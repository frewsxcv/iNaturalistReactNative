// @flow strict-local

import { StyleSheet } from "react-native";
import type { TextStyleProp, ViewStyleProp } from "react-native/Libraries/StyleSheet/StyleSheet";

const viewStyles: { [string]: ViewStyleProp } = StyleSheet.create( {
  userCard: {
    flexDirection: "row",
    height: 100,
    marginHorizontal: 20,
    alignItems: "center"
  },
  userDetails: {
    marginLeft: 10
  },
  editProfile: {
    position: "absolute",
    right: 0
  },
  topCard: {
    height: 100
  }
} );

const textStyles: { [string]: TextStyleProp } = StyleSheet.create( {
  text: { }
} );

export {
  textStyles,
  viewStyles
};
