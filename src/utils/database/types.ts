export type FieldData =
  | "TEXT"
  | "INTEGER"
  | "BOOL"
  | "TIMESTAMP"
  | "CHANNEL"
  | "USER"
  | "ROLE"
  | "LOG"
  | "EGG"
  | "REWARD";

export type TableDefinition = {
  name: string;
  definition: Record<string, FieldData>;
};

export type SqlType<T extends FieldData> = {
  BOOL: boolean;
  INTEGER: number;
  TEXT: string;
  TIMESTAMP: Date;
  CHANNEL: string;
  USER: string;
  ROLE: string;
  LOG: string;
  EGG: string;
  REWARD: string;
}[T];

export type TypeOfDefinition<T extends TableDefinition> = {
  [K in keyof T["definition"]]: SqlType<T["definition"][K]>;
};

export type SettingsDefinition = Record<
  string,
  {
    description: string;
    settings: Record<
      string,
      {
        type: FieldData;
        desc: string;
        val?: any;
        iterable?: boolean;
        selectMenu?: boolean;
        emoji?: string;
      }
    >;
  }
>;

export type LevelReward = { id: string; level: number; channel: boolean };
