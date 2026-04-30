import * as fs from "fs";
import { createInterface } from "readline";

const readHiddenInput = async (prompt: string): Promise<string> => {
  console.log(prompt);

  return new Promise(resolve => {
    const rl = createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    const stdin = process.stdin;
    if (stdin.isTTY) stdin.setRawMode(true);

    stdin.on("data", data => {
      if (data.toString() == "\n" || data.toString() == "\r") {
        if (stdin.isTTY) stdin.setRawMode(false);
        process.stdout.moveCursor(0, -1);
        process.stdout.clearLine(1);
        process.stdout.moveCursor(0, 1);
        rl.close();
      }
    });

    rl.question("", input => resolve(input));
  });
};

const replaceInEnv = (key: string, value: string) => {
  try {
    const envContent = fs.readFileSync(".env", "utf-8");
    const updatedContent = envContent.replace(key, value);
    fs.writeFileSync(".env", updatedContent, "utf-8");
  } catch (error) {
    console.error(`Error updating .env file: ${error}`);
  }
};

const main = async () => {
  fs.copyFileSync("example.env", ".env");
  const token = await readHiddenInput(
    "Paste your bot token below: (you can get one from https://discord.com/developers/applications)",
  );
  replaceInEnv("YOUR_TOKEN", token);
  const useDocker = confirm(
    "Are you going to use Docker (Y) or setup manually (N, or any other key)?",
  );
  if (useDocker) {
    console.log(
      "Then just run Docker Compose on this directory, it should all work out of the box.",
    );
  } else {
    const pgUser = await readHiddenInput("Enter your PostgreSQL user below");
    const pgPass = await readHiddenInput("Enter your PostgreSQL pass below");
    const pgName = await readHiddenInput("Enter your PostgreSQL database name below");
    const pgHost = await readHiddenInput(
      'IF using a host different than "localhost", enter it here, otherwise hit Return in your keyboard',
    );
    const pgPort = await readHiddenInput(
      'IF using a host different than "5432", enter it here, otherwise hit Return in your keyboard',
    );
    replaceInEnv(
      "postgres://user:pass@localhost:port/dbname",
      `postgres://${pgUser}:${pgPass}@${pgHost.trim() == "" ? "localhost" : pgHost}:${pgPort.trim() == "" ? "5432" : pgPort}/${pgName}`,
    );
  }
  const errorsId = await readHiddenInput(
    "Enter an error channel ID. Sokora will send detailed error logs here whenever a command breaks. (Optional.)",
  );
  if (errorsId.trim() != "") replaceInEnv("YOUR_CHANNEL_ID", errorsId);
  const ownerId = await readHiddenInput(
    "Enter your user ID. Sokora might give it some use. (Optional.)",
  );
  if (ownerId.trim() != "") replaceInEnv("YOUR_USER_ID", ownerId);
  console.log("You're good to go, happy coding!");
};

main().catch(console.error);
