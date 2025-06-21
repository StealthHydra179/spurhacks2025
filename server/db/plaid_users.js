const {sql} = require('./db');
const { logger } = require('../logger');

const TAG = 'plaid_users';

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

async function getAllUserData() {
    try {
        // Get all plaid users from the database
        const users = await sql`SELECT * FROM plaid_users`;
        logger.info(`${TAG} Retrieved ${users.length} plaid users from database`);
        return users;
    } catch (error) {
        logger.error(`${TAG} Error fetching all user data: ${error.message}`);
        return [];
    }
}

module.exports = {
    getByID: getByID,
    getByUserID: getByUserID,
    createAccessToken: createAccessToken,
    getByAccessToken: getByAccessToken,
    deleteByUserID: deleteByUserID,
    getAllUserData: getAllUserData
};
