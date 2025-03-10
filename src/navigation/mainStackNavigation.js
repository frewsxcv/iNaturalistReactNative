// @flow

import { HeaderBackButton } from "@react-navigation/elements";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import * as React from "react";
import { PermissionsAndroid } from "react-native";

import StandardCamera from "../components/Camera/StandardCamera";
import Explore from "../components/Explore/Explore";
import ExploreFilters from "../components/Explore/ExploreFilters";
import ExploreLanding from "../components/Explore/ExploreLanding";
import Messages from "../components/Messages/Messages";
import ObsDetails from "../components/ObsDetails/ObsDetails";
import AddID from "../components/ObsEdit/AddID";
import CVSuggestions from "../components/ObsEdit/CVSuggestions";
import ObsEdit from "../components/ObsEdit/ObsEdit";
import ObsList from "../components/Observations/ObsList";
import GroupPhotos from "../components/PhotoLibrary/GroupPhotos";
import PhotoGallery from "../components/PhotoLibrary/PhotoGallery";
import CustomHeaderWithTranslation from
  "../components/SharedComponents/CustomHeaderWithTranslation";
import Mortal from "../components/SharedComponents/Mortal";
import PermissionGate from "../components/SharedComponents/PermissionGate";
import SoundRecorder from "../components/SoundRecorder/SoundRecorder";
import TaxonDetails from "../components/TaxonDetails/TaxonDetails";
import UserProfile from "../components/UserProfile/UserProfile";
import ExploreProvider from "../providers/ExploreProvider";

const Stack = createNativeStackNavigator( );

const hideHeader = {
  headerShown: false
};

const showHeader = {
  headerShown: true
};

const hideScreenTransitionAnimation = {
  animation: "none"
};

const showBackButton = ( { navigation } ) => ( {
  headerLeft: ( ) => <HeaderBackButton onPress={( ) => navigation.goBack( )} />
} );

const PhotoGalleryWithPermission = ( ) => (
  <PermissionGate permission={PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE}>
    <PermissionGate permission={PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE}>
      <PhotoGallery />
    </PermissionGate>
  </PermissionGate>
);

const StandardCameraWithPermission = ( ) => (
  <PermissionGate permission={PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE}>
    <PermissionGate permission={PermissionsAndroid.PERMISSIONS.CAMERA}>
      <StandardCamera />
    </PermissionGate>
  </PermissionGate>
);

const SoundRecorderWithPermission = ( ) => (
  <PermissionGate permission={PermissionsAndroid.PERMISSIONS.RECORD_AUDIO}>
    <PermissionGate permission={PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE}>
      <PermissionGate permission={PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE}>
        <SoundRecorder />
      </PermissionGate>
    </PermissionGate>
  </PermissionGate>
);

const MainStackNavigation = ( ): React.Node => (
  <Mortal>
    <ExploreProvider>
      <Stack.Navigator screenOptions={hideHeader}>
        <Stack.Screen
          name="ObsList"
          component={ObsList}
          options={hideScreenTransitionAnimation}
        />
        <Stack.Screen
          name="ObsDetails"
          component={ObsDetails}
        />
        <Stack.Screen
          name="UserProfile"
          component={UserProfile}
        />
        <Stack.Screen
          name="TaxonDetails"
          component={TaxonDetails}
          options={showBackButton}
        />
        <Stack.Screen
          name="PhotoGallery"
          component={PhotoGalleryWithPermission}
        />
        <Stack.Screen
          name="GroupPhotos"
          component={GroupPhotos}
        />
        <Stack.Screen
          name="ObsEdit"
          component={ObsEdit}
        />
        <Stack.Screen
          name="SoundRecorder"
          component={SoundRecorderWithPermission}
        />
        <Stack.Screen
          name="StandardCamera"
          component={StandardCameraWithPermission}
        />
        <Stack.Screen
          name="Suggestions"
          component={CVSuggestions}
          options={{
            headerTitle: <CustomHeaderWithTranslation headerText="IDENTIFICATION" />,
            headerShown: true
          }}
        />
        <Stack.Screen
          name="AddID"
          component={AddID}
          options={hideHeader}
        />
        <Stack.Screen
          name="Messages"
          component={Messages}
          options={{
            ...showHeader,
            ...hideScreenTransitionAnimation
          }}
        />
        <Stack.Screen
          name="ExploreLanding"
          component={ExploreLanding}
          options={{
            ...hideHeader,
            ...hideScreenTransitionAnimation
          }}
        />
        <Stack.Screen
          name="Explore"
          component={Explore}
          options={{
            ...hideHeader,
            ...hideScreenTransitionAnimation
          }}
        />
        <Stack.Screen
          name="ExploreFilters"
          component={ExploreFilters}
          options={{
            ...hideHeader,
            ...hideScreenTransitionAnimation
          }}
        />
      </Stack.Navigator>
    </ExploreProvider>
  </Mortal>
);

export default MainStackNavigation;
