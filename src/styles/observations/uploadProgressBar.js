// @flow strict-local

import { Dimensions, StyleSheet } from "react-native";
import type { TextStyleProp, ViewStyleProp } from "react-native/Libraries/StyleSheet/StyleSheet";

import colors from "../colors";

const { width } = Dimensions.get( "screen" );

const borderRadius = 30;

const viewStyles: { [string]: ViewStyleProp } = StyleSheet.create( {
  bottomSheet: {
    opacity: 0
  },
  progressBar: {
    marginTop: 14,
    backgroundColor: colors.logInGray,
    width
  },
  grayContainer: {
    borderTopLeftRadius: borderRadius,
    borderTopRightRadius: borderRadius,
    paddingTop: 21,
    backgroundColor: colors.logInGray,
    alignItems: "center",
    height: "100%"
  },
  closeButton: {
    position: "absolute",
    right: 0,
    top: 17
  }
} );

const textStyles: { [string]: TextStyleProp } = StyleSheet.create( {
  whiteText: {
    color: colors.white
  }
} );

export {
  textStyles,
  viewStyles
};
