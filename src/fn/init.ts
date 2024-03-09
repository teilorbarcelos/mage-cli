import fs from "fs";
import path from "path";
import { MagicWords } from "../constants";

export function init(): void {
  const configFile = "mage-cli.json";
  const gitignoreFile = ".gitignore";

  const currentDir = process.cwd();
  const configFilePath = path.join(currentDir, configFile);
  const gitignoreFilePath = path.join(currentDir, gitignoreFile);

  if (!fs.existsSync(configFilePath)) {
    fs.writeFileSync(configFilePath, "{}");
    console.log(`${MagicWords.ocusPocus} config file ${configFile} created.`);
  } else {
    console.log(`The config file ${configFile} already exists.`);
  }

  if (fs.existsSync(gitignoreFilePath)) {
    const gitignoreContent = fs.readFileSync(gitignoreFilePath, "utf-8");

    if (!gitignoreContent.includes(configFile)) {
      fs.appendFileSync(gitignoreFilePath, `\n${configFile}`);
      console.log(
        `${MagicWords.simSalabim} file ${configFile} added to ${gitignoreFile}.`
      );
    } else {
      console.log(
        `The file ${configFile} is already listed on ${gitignoreFile}.`
      );
    }
  } else {
    fs.writeFileSync(gitignoreFilePath, configFile);
    console.log(`File ${gitignoreFile} created and ${configFile} added.`);
  }
}
