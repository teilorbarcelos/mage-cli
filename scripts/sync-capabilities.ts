import fs from "fs";
import path from "path";

const README_PATH = path.join(__dirname, "../README.md");
const OUTPUT_PATH = path.join(__dirname, "../src/ai/capabilities.ts");

function sync() {
  console.log("⚡ Mage: Synchronizing CLI capabilities from README...");

  if (!fs.existsSync(README_PATH)) {
    console.error("❌ README.md not found!");
    process.exit(1);
  }

  const readme = fs.readFileSync(README_PATH, "utf-8");

  const startMarker = "<!-- START_MAGE_MANUAL -->";
  const endMarker = "<!-- END_MAGE_MANUAL -->";

  const startIndex = readme.indexOf(startMarker);
  const endIndex = readme.indexOf(endMarker);

  if (startIndex === -1 || endIndex === -1) {
    console.error("❌ Sync markers not found in README.md!");
    process.exit(1);
  }

  const manualContent = readme
    .substring(startIndex + startMarker.length, endIndex)
    .trim();

  // Escape backticks in the content so they don't break the template literal in the output
  const escapedContent = manualContent.replace(/`/g, "\\`").replace(/\${/g, "\\${");

  const fileContent = `/**
 * AUTO-GENERATED FILE - DO NOT EDIT MANUALLY
 * This file is synchronized from README.md via scripts/sync-capabilities.ts
 */

export const MAGE_CLI_CAPABILITIES = \`
${escapedContent}
\`;
`;

  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, fileContent);

  console.log("✅ Capabilities synchronized successfully!");
}

sync();
