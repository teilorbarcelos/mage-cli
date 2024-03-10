import fs from "fs";
import path from "path";
import * as inquirer from "inquirer";
import handlebars from "handlebars";
import { MagicWords } from "../constants";

interface ConfigData {
  stack: string;
  assets: string;
  base: string;
  components: string;
  controllers: string;
  helpers: string;
  hooks: string;
  lib: string;
  modules: string;
  pages: string;
  services: string;
  src: string;
}

export async function init(): Promise<void> {
  const configFile = "mage-cli.json";
  const gitignoreFile = ".gitignore";

  const currentDir = process.cwd();
  const configFilePath = path.join(currentDir, configFile);
  const gitignoreFilePath = path.join(currentDir, gitignoreFile);

  if (fs.existsSync(configFilePath)) {
    console.log(`The config file ${configFile} already exists.`);
    return;
  }

  const templatePath = path.join(__dirname, "../models/mage-cli.json");
  const template = fs.readFileSync(templatePath, "utf-8");

  const templateObj = JSON.parse(template);
  const questionsKeysList = Object.keys(templateObj);
  const questionsList = questionsKeysList.map((key) => {
    if (key === "stack")
      return {
        type: "list",
        name: key,
        message: `Choose a ${key}:`,
        choices: ["NextJs", "NodeJs"],
      };
    return {
      type: "input",
      name: key,
      message: `Enter the path for the "${key}" folder from the project root:`,
      default: key,
    };
  });

  const stackSrcQuestions: inquirer.QuestionCollection<ConfigData> = [
    questionsList.find((question) => question.name === "stack"),
    questionsList.find((question) => question.name === "src"),
  ];

  const getAllQuestions: (
    src: string
  ) => inquirer.QuestionCollection<ConfigData> = (src) =>
    questionsList
      .filter(
        (question) => question.name !== "stack" && question.name !== "src"
      )
      .map((question) => ({
        ...question,
        default: path.join(src, question.name),
      }));

  try {
    const inquirerPrompt = inquirer.createPromptModule();
    const stackSrcQuestionsResponse = await inquirerPrompt<ConfigData>(
      stackSrcQuestions
    );

    const allQuestions: inquirer.QuestionCollection<ConfigData> =
      getAllQuestions(stackSrcQuestionsResponse.src);

    const finalAnswersResponse = await inquirerPrompt<ConfigData>(allQuestions);

    const allResponses: ConfigData = {
      ...finalAnswersResponse,
      ...stackSrcQuestionsResponse,
    };
    const compiledTemplate = handlebars.compile(template);
    const configContent = compiledTemplate(allResponses);
    fs.writeFileSync(configFilePath, configContent);
    console.log(`${MagicWords.ocusPocus} config file ${configFile} created.`);

    if (fs.existsSync(gitignoreFilePath)) {
      const gitignoreContent = fs.readFileSync(gitignoreFilePath, "utf-8");

      if (!gitignoreContent.includes(configFile)) {
        fs.appendFileSync(gitignoreFilePath, `\n${configFile}`);
        console.log(
          `${MagicWords.simSalabim} file ${configFile} added to ${gitignoreFile}.`
        );
      } else {
        console.log(
          `The file ${configFile} is already listed in ${gitignoreFile}.`
        );
      }
    } else {
      fs.writeFileSync(gitignoreFilePath, configFile);
      console.log(`File ${gitignoreFile} created and ${configFile} added.`);
    }
  } catch (error) {
    console.error("An error occurred:", error);
  }
}
