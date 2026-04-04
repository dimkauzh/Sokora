import { ShardingManager } from "discord.js";
import { sql } from "bun";
import { createHash, Hash } from "crypto";
import fs from "fs";

const manager = new ShardingManager("./src/bot.ts", { token: process.env.TOKEN });

async function getHash(file: string, hashAlgo?: Hash): Promise<string> {
  return new Promise((resolve, reject) => {
    if (hashAlgo == undefined) {
      hashAlgo = createHash("sha256");
    }

    const stream = fs.createReadStream(file);
    stream.on("data", data => hashAlgo.update(data));
    stream.on("error", reject);
    stream.on("end", () => resolve(hashAlgo.digest("hex")));
  });
}

const migrationFiles = fs.readdirSync("./migrations")
  .filter(f => f.endsWith(".sql"))
  .sort()
  .map(f => './migrations/'+f);
const hash = createHash("sha1");
let migrations: {[hash: string]: string} = {};
for (let file of migrationFiles) {
  const fileHash = await getHash(file, hash);
  migrations[fileHash] = file;
};
const hashList = Object.keys(migrations)

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

try {
  const DBversion = (await sql`SELECT value FROM _info WHERE key='version';`)[0].value;
  if (DBversion != hashList[hashList.length-1]) {
    console.log("Updating database...");
    await applyMigrations(DBversion);
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

manager.on("shardCreate", shard => {
  shard.on("error", error => console.error(error));
  console.log(`Launched shard ${shard.id}!`);
  if (process.env.ENABLE_MEDIA_FETCHING == "true")
    console.warn("External media and <meta> tag fetching is enabled; tread lightly!");
});

await manager.spawn();
