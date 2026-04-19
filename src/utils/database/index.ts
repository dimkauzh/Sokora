import { sql } from "bun";
import { createHash } from "crypto";
import fs from "fs";

// Maybe import this file in bot.ts instead, then make this a class with static variables like for a db instance ? (one instance per shard)
// class? no
// import in bot.ts? yes
// why is it in src and not database/index.ts btw...

const migrationsDir = "./migrations";
const preferredHashType = "sha1";

/**
 * Retrieves the ACTUAL values from a query result because postgre adds unwanted data at the end
 * @param queryResult The returned object from a bun SQL query (so without using .values())
 * @param singles If true when selecting only one column, returns an array of only the column values instead. Else, returns like normal
 * @returns An array containing the objects (or direct values if singles) of the query result
 */
export function values(queryResult: object, singles?: boolean): Array<any> {
  // Not a TS expert but maybe someone can change any to the type of the news object definition ?
  const actualValues = Object.values(queryResult).filter(v => v instanceof Object);
  return singles && actualValues.length && Object.values(actualValues[0]).length == 1
    ? actualValues.map(v => Object.values(v)[0])
    : actualValues;
}

async function getHash(file: string, hashAlgo?: string): Promise<string> {
  const hash = createHash(hashAlgo || "sha256");
  return new Promise((resolve, reject) => {
    const stream = fs.createReadStream(file);
    stream.on("data", data => hash.update(data));
    stream.on("error", reject);
    stream.on("end", () => resolve(hash.digest("hex")));
  });
}

const migrationFiles = fs
  .readdirSync(migrationsDir)
  .filter(f => f.endsWith(".sql"))
  .sort()
  .map(f => `${migrationsDir}/${f}`);

const migrations: { [hash: string]: string } = Object.fromEntries(
  await Promise.all(
    migrationFiles.map(async file => [await getHash(file, preferredHashType), file]),
  ),
);

const hashList = Object.keys(migrations);

async function applyMigrations(after?: string) {
  const fileList = hashList.slice(after ? hashList.indexOf(after) + 1 : 0).map(h => migrations[h]);
  console.log(`Applying ${fileList.length} migrations...`);
  for (const file of fileList)
    try {
      await sql.file(file);
    } catch (e) {
      console.error(`Failed to apply '${file}':\n${e}`);
      process.exit(1);
    }

  await sql`UPDATE _info SET value = ${hashList[hashList.length - 1]} WHERE "key" = 'version';`;
  console.log("Database updated successfully");
}

export async function updateDatabase() {
  try {
    const DBversion = values(await sql`SELECT value FROM _info WHERE "key" = 'version';`, true)[0];
    if (!DBversion) throw new Error(); // Goes into initializing the DB
    if (DBversion == hashList[hashList.length - 1]) return console.log("Database up-to-date");
    console.log("Updating database...");
    await applyMigrations(DBversion);
  } catch {
    console.log("Initializing database...");
    await sql`
      CREATE TABLE IF NOT EXISTS _info ("key" TEXT, "value" TEXT);
      INSERT INTO _info VALUES ('version', '');
    `.simple();
    await applyMigrations();
  }
}
