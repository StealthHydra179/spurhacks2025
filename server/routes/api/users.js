var express = require('express'),
    router = express.Router();
    
const { sql } = require('../../db/db');    
const { logger } = require('../../logger');

const userDb = require('../../db/users'); 

const TAG = 'api_users';

router.get('/', function (req, res) {
    res.json({
        message: 'Welcome to the User API',
        status: 'success'
    });
})

router.get('/getByID/:id', async function (req, res) {
    try {
        const userId = req.params.id;
        logger.info(`${TAG} Fetching user with ID: ${userId}`);
        user = await userDb.getByID(userId)

        if (user.length === 0) {
            logger.warn(`${TAG} User with ID ${userId} not found`);
            return res.status(404).json({ message: 'User not found' });
        }
        
        res.json(user[0]);
    } catch (error) {
        logger.error(`${TAG} Error fetching user: ${error.message}`);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

module.exports = router;
