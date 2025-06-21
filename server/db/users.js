const {sql} = require('./db');

async function getByID(id) {
    return await sql`SELECT * FROM users WHERE id = ${id}`;
}

module.exports = {
    getByID: getByID
};