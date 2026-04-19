import { Interaction } from "discord.js";

export type FieldData =
  | "TEXT"
  | "mTEXT"
  | "INTEGER"
  | "mINTEGER"
  | "BOOL"
  | "TIMESTAMP"
  | "mTIMESTAMP"
  | "CHANNEL"
  | "mCHANNEL"
  | "USER"
  | "mUSER"
  | "ROLE"
  | "mROLE"
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
  mINTEGER: Maybe<number>;
  TEXT: string;
  mTEXT: Maybe<string>;
  TIMESTAMP: Date;
  mTIMESTAMP: Maybe<Date>;
  CHANNEL: string;
  mCHANNEL: Maybe<string>;
  USER: string;
  mUSER: Maybe<string>;
  ROLE: string;
  mROLE: Maybe<string>;
  LOG: string;
  EGG: string;
  OBJECT: string;
  REWARD: string;
}[T];

export type TypeOfDefinition<T extends TableDefinition> = {
  [K in keyof T["definition"]]: SqlType<T["definition"][K]>;
};

// If it returns a string (error), then the precondition failed
export type SettingPrecondition = (interaction: Interaction, newVal: any) => Promise<string | undefined>


export type SingleSettingDefinition = {
  type: FieldData;
  desc: string;
  val?: any;
  precondition?: SettingPrecondition,
  iterable?: boolean;
  selectMenu?: boolean; // unused
  emoji?: string;
  settings?: Record<
    string,
    SingleSettingDefinition & {
      settings?: Record<string, Omit<SingleSettingDefinition, "settings">>;
    }
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
