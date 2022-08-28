declare module "realm" {
  declare type PrimaryKey = string | number;

  declare class Object {
    toJSON(): any;
  }
  declare type _RealmObject = Object;

  declare class Realm {
    create<T: _RealmObject>(
      type: string,
      properties: RealmInsertionModel<T>,
      mode?: UpdateMode.Never
    ): T;
    objects<T: _RealmObject>( type: string ): Results<T>;
    objectForPrimaryKey<T: _RealmObject>(
      type: string,
      key: PrimaryKey
    ): T | void;
    close(): void;
    write<ReturnValueType>( callback: () => ReturnValueType ): ReturnValueType;
  }

  declare interface CollectionChangeSet {
    insertions: number[];
    deletions: number[];
    newModifications: number[];
    oldModifications: number[];
  }

  declare type CollectionChangeCallback<T> = (
    collection: Collection<T>,
    changes: CollectionChangeSet
  ) => void;

  declare interface Collection<T> extends $ReadOnlyArray<T> {
    filtered( query: string, ...arg: any[] ): Results<T>;
    sorted( descriptor: string, reverse?: boolean ): Results<T>;
    addListener( callback: CollectionChangeCallback<T> ): void;
    removeAllListeners(): void;
  }

  declare class Results<T> extends Collection<T> {}

  declare class Configuration {}

  declare function open( config: Configuration ): Promise<Realm>;
  declare function deleteFile( config: Configuration ): Promise<Realm>;
}
