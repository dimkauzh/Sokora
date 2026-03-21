import { SQL } from "bun";
import { TableDefinition } from "./types";

// Connect into the PostgreSQL database
const user = process.env.POSTGRE_USER;
const pass = process.env.POSTGRE_PASS;
const port = process.env.POSTGRE_PORT;
const dbName = process.env.POSTGRE_DB;
const db = new SQL(`postgres://${user}:${pass}@localhost:${port}/${dbName}`);

export function getDatabase(def: TableDefinition) {
  // Create table if it doesn't exist
  const defStr = Object.entries(def.definition)
    .map(([field, type]) => field.concat(" ", type))
    .join(", ");

  db`CREATE TABLE IF NOT EXISTS ${def.name} (${defStr});`.execute();
  return db;
}
