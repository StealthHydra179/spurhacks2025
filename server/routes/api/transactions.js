var express = require('express'),
    router = express.Router();
    
const { sql } = require('../../db/db');    
const { logger } = require('../../logger');

const userDb = require('../../db/transactions'); 

const TAG = 'api_transactions';

router.get('/', function (req, res) {
    res.json({
        message: 'Welcome to the Transactions API',
        status: 'success'
    });
})


module.exports = router;
