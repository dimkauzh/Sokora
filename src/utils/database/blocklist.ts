import { getDatabase } from ".";
import { TableDefinition } from "./types";

const tableDefinition: TableDefinition = {
  name: "blocklist",
  definition: {
    id: "INTEGER",
  },
};

const database = getDatabase(tableDefinition);
const checkQuery = database.query("SELECT * FROM blocklist WHERE id = $1;");
export function check(userID: string) {
  return checkQuery.all(userID).length == 0;
}

const addQuery = database.query("INSERT INTO blocklist (id) VALUES (?1);");
export function add(userID: string) {
  addQuery.run(userID);
}

const removeQuery = database.query("DELETE FROM blocklist WHERE id = $1;");
export function remove(userID: string) {
  removeQuery.run(userID);
}
