const express = require('express')
const app = express()
const port = 3000
const {logger} = require('./logger');
const sql = require('./db/db'); 

const TAG = 'server_index';

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  logger.info(`${TAG} Server listening on port ${port}`)
})

