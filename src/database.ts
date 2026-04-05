import { sql } from "bun";
import { createHash, Hash } from "crypto";
import fs from "fs";

// Maybe import this file in bot.ts instead, then make this a class with static variables like for a db instance ? (one instance per shard)

const migrationsDir = "./migrations";
const hash = createHash("sha1");

async function getHash(file: string, hashAlgo?: Hash): Promise<string> {
  if (hashAlgo == undefined) {
    hashAlgo = createHash("sha256");
  }
  
  return new Promise((resolve, reject) => {
    const stream = fs.createReadStream(file);
    stream.on("data", data => hashAlgo.update(data));
    stream.on("error", reject);
    stream.on("end", () => resolve(hashAlgo.digest("hex")));
  });
}

const migrationFiles = fs.readdirSync(migrationsDir)
  .filter(f => f.endsWith(".sql"))
  .sort()
  .map(f => `${migrationsDir}/${f}`);

const migrations: {[hash: string]: string} = Object.fromEntries(
    await Promise.all(
        migrationFiles.map(async file => [await getHash(file, hash), file])
    )
);

const hashList = Object.keys(migrations);

async function applyMigrations(after?: string) {
  const fileList = hashList
    .slice(after ? hashList.indexOf(after)+1 : 0)
    .map(h => migrations[h]);

  console.log(`Applying ${fileList.length} migrations...`);
  for (let file of fileList) {
    try {
      await sql.file(file);
    } catch (e) {
      console.error(`Failed to apply '${file}' :`);
      console.error(e);
      process.exit(1);
    }
  }
  await sql`UPDATE _info SET value=${hashList[hashList.length-1]} WHERE key='version'`;
  console.log("Database updated successfully");
}

export async function updateDatabase() {
    try {
      const DBversion = (await sql`SELECT value FROM _info WHERE key='version';`)[0].value;
      if (DBversion != hashList[hashList.length-1]) {
        console.log("Updating database...");
        await applyMigrations(DBversion);
      } else {
        console.log("Database up-to-date");
      }
    } catch {
      console.log("Initializing database...");
      await sql`CREATE TABLE IF NOT EXISTS _info (
        "key" TEXT,
        "value" TEXT
      );
      INSERT INTO _info VALUES ('version', '')`.simple();
      await applyMigrations();
    }
}
