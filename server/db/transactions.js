const { sql } = require("./db");
//
// async function getByID(id) {
//     return await sql`SELECT * FROM users WHERE id = ${id}`;
// }
//
// async function getByUsername(username) {
//     return await sql`SELECT * FROM users WHERE username = ${username}`;
// }
//
// async function setUser(email, username, hashed_password) {
//     return await sql`INSERT INTO users (email, username, hashed_password, mode) VALUES (${email}, ${username}, ${hashed_password}, 0)`;// 0 mode is light mode
// }

async function getByID(id) {
  return await sql`SELECT * FROM transactions WHERE id = ${id}`;
}

module.exports = {
  getByID: getByID,
  // getByUsername: getByUsername,
  // setUser: setUser
};
