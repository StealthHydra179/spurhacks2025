const { sql } = require("./db");

async function getByID(id) {
  return await sql`SELECT * FROM users WHERE id = ${id}`;
}

async function getByUsername(username) {
  return await sql`SELECT * FROM users WHERE username = ${username}`;
}

async function setUser(email, username, hashed_password) {
  return await sql`INSERT INTO users (email, username, hashed_password, mode) VALUES (${email}, ${username}, ${hashed_password}, 0)`; // 0 is normal, -1 is less aggressive, 1 is more aggressive
}

async function setUserPersonality(userId, personalityMode) {
  // personalityMode should be an integer: 0 = normal, -1 = less aggressive, 1 = more aggressive
  return await sql`UPDATE users SET mode = ${personalityMode} WHERE id = ${userId}`;
}

async function getUserPersonality(userId) {
  const result = await sql`SELECT mode FROM users WHERE id = ${userId}`;
  if (result.length === 0) {
    return null;
  }
  return result[0].mode;
}

module.exports = {
  getByID: getByID,
  getByUsername: getByUsername,
  setUser: setUser,
  setUserPersonality: setUserPersonality,
  getUserPersonality: getUserPersonality,
};
