const {sql} = require('./db');

async function getByID(id) {
    return await sql`SELECT * FROM plaid_users WHERE id = ${id}`;
}

async function getByUserID(user_id) {
    if (user_id) {
        return await sql`SELECT * FROM plaid_users WHERE user_id = ${user_id}`;
    } else {
        // If no user_id provided, return all plaid_users
        return await sql`SELECT * FROM plaid_users`;
    }
}

async function createAccessToken(user_id, access_token) {
    // Always create a new record since users can have multiple access tokens
    const result = await sql`
        INSERT INTO plaid_users (user_id, access_token) 
        VALUES (${user_id}, ${access_token})
        RETURNING id, user_id, access_token
    `;
    return result[0];
}

async function getByAccessToken(access_token) {
    return await sql`SELECT * FROM plaid_users WHERE access_token = ${access_token}`;
}

async function deleteByUserID(user_id) {
    return await sql`DELETE FROM plaid_users WHERE user_id = ${user_id}`;
}

module.exports = {
    getByID: getByID,
    getByUserID: getByUserID,
    createAccessToken: createAccessToken,
    getByAccessToken: getByAccessToken,
    deleteByUserID: deleteByUserID
};
