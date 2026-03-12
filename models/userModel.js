const path = require("path");
const { v4: uuidv4 } = require("uuid");

const { readJsonFile, writeJsonFile } = require("../utils/jsonStorage");

const USERS_FILE = path.join(__dirname, "..", "data", "users.json");

async function getAllUsers() {
  return readJsonFile(USERS_FILE, []);
}

async function findUserByUsername(username) {
  const users = await getAllUsers();

  return users.find(
    (user) => user.username.toLowerCase() === username.toLowerCase()
  );
}

async function findUserById(userId) {
  const users = await getAllUsers();
  return users.find((user) => user.id === userId) || null;
}

async function createUser({ username, passwordHash }) {
  const users = await getAllUsers();

  const newUser = {
    id: uuidv4(),
    username,
    passwordHash
  };

  users.push(newUser);
  await writeJsonFile(USERS_FILE, users);

  return newUser;
}

module.exports = {
  getAllUsers,
  findUserByUsername,
  findUserById,
  createUser
};
