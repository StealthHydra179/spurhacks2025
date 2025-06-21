require('dotenv').config();
const express = require('express');
const app = express()
const port = 3000
const {logger} = require('./logger');
const sql = require('./db/db'); 

const TAG = 'server_index';

app.use(express.json());


app.get('/', (req, res) => {
  res.send('Hello World!')
})

const apiUsers = require('./routes/api/users');
app.use('/api/users', apiUsers);
const apiTransactions = require('./routes/api/transactions');
app.use('/api/transactions', apiTransactions);
const apiBotConversations = require('./routes/api/bot_conversations');
app.use('/api/bot_conversations', apiBotConversations)

app.listen(port, () => {
  logger.info(`${TAG} Server listening on port ${port}`)
})
