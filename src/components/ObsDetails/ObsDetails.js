// @flow

import {
  BottomSheetModal, BottomSheetModalProvider,
  BottomSheetTextInput
} from "@gorhom/bottom-sheet";
import { useNavigation, useRoute } from "@react-navigation/native";
import { formatISO } from "date-fns";
import _ from "lodash";
import type { Node } from "react";
import React, {
  useContext, useEffect, useRef, useState
} from "react";
import { useTranslation } from "react-i18next";
import {
  Alert, Image, Keyboard,
  LogBox, Pressable, ScrollView, Text,
  TextInput as NativeTextInput, TouchableOpacity, View
} from "react-native";
import { ActivityIndicator, Button } from "react-native-paper";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import IconMaterial from "react-native-vector-icons/MaterialIcons";
import Realm from "realm";

import realmConfig from "../../models/index";
import Observation from "../../models/Observation";
import Taxon from "../../models/Taxon";
import User from "../../models/User";
import { ObsEditContext } from "../../providers/contexts";
import { formatObsListTime } from "../../sharedHelpers/dateAndTime";
import colors from "../../styles/colors";
import { imageStyles, textStyles, viewStyles } from "../../styles/obsDetails/obsDetails";
import createIdentification from "../Identify/helpers/createIdentification";
import { getUser } from "../LoginSignUp/AuthenticationService";
import RoundGrayButton from "../SharedComponents/Buttons/RoundGrayButton";
import PhotoScroll from "../SharedComponents/PhotoScroll";
import QualityBadge from "../SharedComponents/QualityBadge";
import TranslatedText from "../SharedComponents/TranslatedText";
import UserIcon from "../SharedComponents/UserIcon";
import ViewWithFooter from "../SharedComponents/ViewWithFooter";
import ActivityTab from "./ActivityTab";
import DataTab from "./DataTab";
import checkCamelAndSnakeCase from "./helpers/checkCamelAndSnakeCase";
import createComment from "./helpers/createComment";
import faveObservation from "./helpers/faveObservation";
import useRemoteObservation from "./hooks/useRemoteObservation";
import ObsDetailsHeader from "./ObsDetailsHeader";

// this is getting triggered by passing dates, like _created_at, through
// react navigation via the observation object. it doesn't seem to
// actually be breaking anything, for the moment (May 2, 2022)
LogBox.ignoreLogs( [
  "Non-serializable values were found in the navigation state"
] );

const ObsDetails = ( ): Node => {
  const { t } = useTranslation( );
  const [refetch, setRefetch] = useState( false );
  const [showCommentBox, setShowCommentBox] = useState( false );
  const [comment, setComment] = useState( "" );
  const { addObservations } = useContext( ObsEditContext );
  const { params } = useRoute( );
  let { observation } = params;
  const [tab, setTab] = useState( 0 );
  const navigation = useNavigation( );
  const [ids, setIds] = useState( [] );
  const bottomSheetModalRef = useRef( null );
  const [addingComment, setAddingComment] = useState( false );
  const [snapPoint, setSnapPoint] = useState( 100 );

  // Clear the comment in a timeout so it doesn't trigger a re-render of the
  // text input *after* the bottom sheet modal gets dismissed, b/c that seems
  // to re-render the bottom sheet in a presented state, making it hard to
  // actually dismiss
  const clearComment = ( ) => setTimeout( ( ) => setComment( "" ), 100 );

  const onBackdropPress = () => {
    Alert.alert(
      t( "Discard-Comment" ),
      t( "Are-you-sure-discard-comment" ),
      [{
        text: t( "Yes" ),
        onPress: () => {
          setShowCommentBox( false );
          // setComment( "" );
          Keyboard.dismiss();
          clearComment( );
        }
      }, { text: t( "No" ) }],
      {
        cancelable: false
      }
    );
  };

  // Make bottom sheet modal visibility reactive instead of imperative
  useEffect( ( ) => {
    if ( showCommentBox ) {
      bottomSheetModalRef.current?.present( );
    } else {
      bottomSheetModalRef.current?.dismiss( );
    }
  }, [showCommentBox, bottomSheetModalRef] );

  const renderHandle = () => (
    <View style={viewStyles.handleContainer} />
  );

  const renderBackdrop = () => (
    <TouchableOpacity activeOpacity={1} style={viewStyles.background} onPress={onBackdropPress}>
      <View />
    </TouchableOpacity>
  );

  // TODO: we'll probably need to redo this logic a bit now that we're
  // passing an observation via navigation instead of reopening realm
  const { remoteObservation, currentUserFaved } = useRemoteObservation( observation, refetch );

  /* TODO - removed this since otherwise refreshing new comments will not work (will
      always use old local copy that doesn't include new comments) */
  if ( remoteObservation ) {
    observation = remoteObservation;
  }
  const showActivityTab = ( ) => setTab( 0 );
  const showDataTab = ( ) => setTab( 1 );

  const toggleRefetch = ( ) => setRefetch( !refetch );

  useEffect( () => {
    const markViewedLocally = async ( ) => {
      const realm = await Realm.open( realmConfig );
      const existingObs = realm?.objectForPrimaryKey( "Observation", observation.uuid );
      if ( !existingObs ) { return; }
      realm?.write( ( ) => {
        existingObs.viewed = true;
      } );
    };
    if ( observation ) { setIds( observation.identifications.map( i => i ) ); }
    if ( observation.viewed === false ) {
      Observation.markObservationUpdatesViewed( observation.uuid );
      markViewedLocally( );
    }
  }, [observation] );

  if ( !observation ) { return null; }

  const comments = observation.comments.map( c => c );
  const photos = _.compact( observation.observationPhotos.map( op => op.photo ) );
  const { taxon, uuid, user } = observation;

  const onIDAdded = async identification => {
    // Add temporary ID to observation.identifications ("ghosted" ID, while we're trying to add it)
    const currentUser = await getUser();
    const newId = {
      body: identification.body,
      taxon: identification.taxon,
      user: {
        id: currentUser?.id,
        login: currentUser?.login,
        signedIn: true
      },
      created_at: formatISO( Date.now() ),
      uuid: identification.uuid,
      vision: false,
      // This tells us to render is ghosted (since it's temporarily visible
      // until getting a response from the server)
      temporary: true
    };
    setIds( [...ids, newId] );

    let error = null;

    try {
      const results = await createIdentification( {
        observation_id: observation.uuid,
        taxon_id: newId.taxon.id,
        body: newId.body
      } );

      if ( results === 1 ) {
        // Remove ghosted highlighting
        newId.temporary = false;
        setIds( [...ids, newId] );
      } else {
        // Couldn't create ID
        error = t( "Couldnt-create-identification", { error: t( "Unknown-error" ) } );
      }
    } catch ( e ) {
      error = t( "Couldnt-create-identification", { error: e.message } );
    }

    if ( error ) {
      // Remove temporary ID and show error
      setIds( [...ids] );

      Alert.alert(
        "Error",
        error,
        [{ text: t( "OK" ) }],
        {
          cancelable: true
        }
      );
    }
  };

  const navToUserProfile = userId => navigation.navigate( "UserProfile", { userId } );
  const navToTaxonDetails = ( ) => navigation.navigate( "TaxonDetails", { id: taxon.id } );
  const navToAddID = ( ) => {
    addObservations( [observation] );
    navigation.push( "AddID", { onIDAdded, goBackOnSave: true } );
  };
  const openCommentBox = ( ) => {
    setShowCommentBox( true );
  };
  const submitComment = async ( ) => {
    setAddingComment( true );
    clearComment( );
    setShowCommentBox( false );
    Keyboard.dismiss();
    const response = await createComment( comment, uuid );
    setAddingComment( false );
    if ( response ) {
      setRefetch( !refetch );
    }
  };

  const showTaxon = ( ) => {
    if ( !taxon ) { return <Text>{t( "Unknown-organism" )}</Text>; }
    return (
      <>
        <Image source={Taxon.uri( taxon )} style={viewStyles.imageBackground} />
        <Pressable
          style={viewStyles.obsDetailsColumn}
          onPress={navToTaxonDetails}
          testID={`ObsDetails.taxon.${taxon.id}`}
          accessibilityRole="link"
          accessibilityLabel="go to taxon details"
        >
          <Text style={textStyles.commonNameText}>
            {checkCamelAndSnakeCase( taxon, "preferredCommonName" )}
          </Text>
          <Text style={textStyles.scientificNameText}>{taxon.name}</Text>
        </Pressable>
      </>
    );
  };

  const renderBottomSheetTextView = () => (
    <BottomSheetTextInput
      keyboardType="default"
      style={[viewStyles.commentInput, viewStyles.commentInputText, textStyles.commentTextInput]}
      value={comment}
      selectionColor={colors.black}
      activeUnderlineColor={colors.transparent}
      placeholder={t( "Add-a-comment" )}
      autoFocus
      multiline
      onChangeText={setComment}
      render={innerProps => (
        <NativeTextInput
              /* eslint-disable react/jsx-props-no-spreading */
          {...innerProps}
          style={[
            innerProps.style,
            viewStyles.commentInputText, textStyles.commentTextInput
          ]}
        />
      )}
    />
  );

  const faveOrUnfave = async ( ) => {
    if ( currentUserFaved ) {
      await faveObservation( uuid, "unfave" );
      setRefetch( !refetch );
    } else {
      await faveObservation( uuid, "fave" );
      setRefetch( !refetch );
    }
  };

  const displayCreatedAt = ( ) => ( observation.createdAt
    ? observation.createdAt
    : formatObsListTime( observation._created_at ) );

  return (
    <BottomSheetModalProvider>
      <ViewWithFooter>
        <ObsDetailsHeader observationUUID={uuid} />
        <ScrollView
          testID={`ObsDetails.${uuid}`}
          contentContainerStyle={viewStyles.scrollView}
        >
          <View style={viewStyles.userProfileRow}>
            <Pressable
              style={viewStyles.userProfileRow}
              onPress={( ) => navToUserProfile( user.id )}
              testID="ObsDetails.currentUser"
              accessibilityRole="link"
            >
              <UserIcon uri={User.uri( user )} />
              <Text>{User.userHandle( user )}</Text>
            </Pressable>
            <Text style={textStyles.observedOn}>{displayCreatedAt( )}</Text>
          </View>
          <View style={viewStyles.photoContainer}>
            <PhotoScroll photos={photos} />
            <Button
              icon={currentUserFaved ? "star-outline" : "star"}
              onPress={faveOrUnfave}
              textColor={colors.white}
              labelStyle={textStyles.favText}
              style={viewStyles.favButton}
            />
          </View>
          <View style={viewStyles.row}>
            {showTaxon( )}
            <View>
              <View style={viewStyles.rowWithIcon}>
                <Image
                  style={imageStyles.smallIcon}
                  source={require( "../../images/ic_id.png" )}
                />
                <Text style={textStyles.idCommentCount}>{observation.identifications.length}</Text>
              </View>
              <View style={viewStyles.rowWithIcon}>
                <Icon name="chat" size={15} color={colors.logInGray} />
                <Text style={textStyles.idCommentCount}>{observation.comments.length}</Text>
              </View>
              <QualityBadge qualityGrade={checkCamelAndSnakeCase( observation, "qualityGrade" )} />
            </View>
          </View>
          <View style={[viewStyles.rowWithIcon, viewStyles.locationContainer]}>
            <IconMaterial name="location-pin" size={15} color={colors.logInGray} />
            <Text style={textStyles.locationText}>
              {checkCamelAndSnakeCase( observation, "placeGuess" )}
            </Text>
          </View>

          <View style={viewStyles.userProfileRow}>
            <Pressable
              onPress={showActivityTab}
              accessibilityRole="button"
              style={viewStyles.tabContainer}
            >
              <TranslatedText
                style={[textStyles.tabText, tab === 0 ? textStyles.tabTextActive : null]}
                text="ACTIVITY"
              />
              { tab === 0 && <View style={viewStyles.tabContainerActive} />}
            </Pressable>
            <Pressable
              onPress={showDataTab}
              testID="ObsDetails.DataTab"
              accessibilityRole="button"
              style={viewStyles.tabContainer}
            >
              <TranslatedText
                style={[textStyles.tabText, tab === 1 ? textStyles.tabTextActive : null]}
                text="DATA"
              />
              { tab === 1 && <View style={viewStyles.tabContainerActive} />}
            </Pressable>
          </View>
          {tab === 0
            ? (
              <ActivityTab
                ids={ids}
                comments={comments}
                navToTaxonDetails={navToTaxonDetails}
                navToUserProfile={navToUserProfile}
                toggleRefetch={toggleRefetch}
              />
            )
            : <DataTab observation={observation} />}
          {addingComment && (
            <View style={[viewStyles.row, viewStyles.centerRow]}>
              <ActivityIndicator size="large" />
            </View>
          )}
          <View style={viewStyles.row}>
            <View style={viewStyles.button}>
              {/* TODO: get this button working. Not sure why createIdentification
              isn't working here but it doesn't appear to be working on
              staging either (Mar 11, 2022) */}
              <RoundGrayButton
                buttonText={t( "Suggest-an-ID" )}
                handlePress={navToAddID}
                testID="ObsDetail.cvSuggestionsButton"
              />
            </View>
            <View style={viewStyles.button}>
              <RoundGrayButton
                buttonText={t( "Add-Comment" )}
                handlePress={openCommentBox}
                testID="ObsDetail.commentButton"
                disabled={showCommentBox}
              />
            </View>
          </View>
        </ScrollView>
        <BottomSheetModal
          ref={bottomSheetModalRef}
          index={0}
          enableOverDrag={false}
          enablePanDownToClose
          snapPoints={[snapPoint]}
          backdropComponent={renderBackdrop}
          handleComponent={renderHandle}
          style={viewStyles.bottomModal}
        >
          <View
            style={viewStyles.commentInputContainer}
            onLayout={( {
              nativeEvent: {
                layout: { height }
              }
            } ) => {
              setSnapPoint( height + 20 );
            }}
          >
            {renderBottomSheetTextView()}
            <TouchableOpacity
              style={viewStyles.sendComment}
              onPress={() => submitComment( )}
            >
              <Icon name="send" size={35} color={colors.inatGreen} />
            </TouchableOpacity>
          </View>
        </BottomSheetModal>
      </ViewWithFooter>
    </BottomSheetModalProvider>
  );
};

export default ObsDetails;
