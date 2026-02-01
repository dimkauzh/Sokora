export type FieldData =
  | "TEXT"
  | "TEXT?"
  | "INTEGER"
  | "INTEGER?"
  | "BOOL"
  | "TIMESTAMP"
  | "TIMESTAMP?"
  | "CHANNEL"
  | "CHANNEL?"
  | "USER"
  | "USER?"
  | "ROLE"
  | "ROLE?"
  | "LOG"
  | "EGG"
  | "OBJECT"
  | "REWARD";

export type TableDefinition = {
  name: string;
  definition: Record<string, FieldData>;
};

type Maybe<T> = T | null;

export type SqlType<T extends FieldData> = {
  BOOL: boolean;
  INTEGER: number;
  "INTEGER?": Maybe<number>;
  TEXT: string;
  "TEXT?": Maybe<string>;
  TIMESTAMP: number;
  "TIMESTAMP?": Maybe<number>;
  CHANNEL: string;
  "CHANNEL?": Maybe<string>;
  USER: string;
  "USER?": Maybe<string>;
  ROLE: string;
  "ROLE?": Maybe<string>;
  LOG: string;
  EGG: string;
  OBJECT: string;
  REWARD: string;
}[T];

export type TypeOfDefinition<T extends TableDefinition> = {
  [K in keyof T["definition"]]: SqlType<T["definition"][K]>;
};

export type SingleSettingDefinition = {
  type: FieldData;
  desc: string;
  val?: any;
  iterable?: boolean;
  selectMenu?: boolean;
  emoji?: string;
  settings?: Record<
    string,
    SingleSettingDefinition & { settings?: Record<string, SingleSettingDefinition> }
  >;
};

export type SettingsDefinition = Record<
  string,
  {
    description: string;
    settings: Record<string, SingleSettingDefinition>;
  }
>;

export type LevelReward = { id: string; level: number; channel: boolean };
