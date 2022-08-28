// @flow
import type { Object } from "realm";
import Realm from "realm";

// eslint-disable-next-line import/no-cycle
import { getUsername } from "../components/LoginSignUp/AuthenticationService";

class User extends Realm.Object {
  /*:: id: number; */
  /*:: icon_url: string | void; */
  /*:: login: string | void; */
  /*:: name: string | void; */
  /*:: signedIn: bool | void; */

  static USER_FIELDS: Object = {
    icon_url: true,
    id: true,
    login: true,
    name: true
  };

  static mapApiToRealm( user: any ): any {
    return user;
  }

  static uri: ( User | void ) => { uri: string } | void =
    user => ( user?.icon_url ? { uri: user.icon_url } : undefined );

  static userHandle: ( User | void ) => string | void =
    user => user?.login && `@${user.login}`;

  static async isCurrentUser( username: string ): Promise<boolean> {
    const currentUserLogin = await getUsername();
    return username === currentUserLogin;
  }

  static schema: Object = {
    name: "User",
    primaryKey: "id",
    properties: {
      id: "int",
      icon_url: { type: "string?", mapTo: "iconUrl" },
      login: "string?",
      name: "string?",
      signedIn: "bool?"
    }
  };
}

export default User;
