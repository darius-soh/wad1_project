const fs = require("fs/promises");
const path = require("path");

async function writeJsonFile(filePath, data) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf-8");
}

async function readJsonFile(filePath, defaultValue = []) {
  try {
    const fileContents = await fs.readFile(filePath, "utf-8");

    if (!fileContents.trim()) {
      return defaultValue;
    }

    return JSON.parse(fileContents);
  } catch (error) {
    if (error.code === "ENOENT") {
      await writeJsonFile(filePath, defaultValue);
      return defaultValue;
    }

    throw error;
  }
}

module.exports = {
  readJsonFile,
  writeJsonFile
};
