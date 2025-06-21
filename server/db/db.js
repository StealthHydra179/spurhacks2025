const postgres = require("postgres");
const { logger } = require("../logger");

const TAG = "db";

const sql = postgres({
  /* options */
});
logger.info(`${TAG} Database loaded`);

exports.sql = sql;
