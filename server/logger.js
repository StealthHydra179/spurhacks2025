const winston = require('winston');


const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  defaultMeta: { service: 'user-service' },
  transports: [
    new winston.transports.File({ filename: 'server/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'server/combined.log' }),
  ],
});

logger.add(new winston.transports.Console({
    format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
    ),
}));

exports.logger = logger;