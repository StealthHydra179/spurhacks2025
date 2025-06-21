const dotenv = require('dotenv');
dotenv.config();

const express = require('express')
const app = express()
const port = 3000
const {logger} = require('./logger');
const sql = require('./db/db'); 

const TAG = 'server_index';

app.get('/', (req, res) => {
  res.send('Hello World!')
})

var apiUsers = require('./routes/api/users');
app.use('/api/users', apiUsers);
var apiTransactions = require('./routes/api/transactions');
app.use('/api/transactions', apiTransactions);

app.listen(port, () => {
  logger.info(`${TAG} Server listening on port ${port}`)
})
