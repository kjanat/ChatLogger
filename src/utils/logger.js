const winston = require('winston');

// Define log format
const logFormat = winston.format.printf(({ level, message, timestamp }) => {
    return `${timestamp} ${level}: ${message}`;
});

// Get environment directly since we can't use config (would cause circular dependency)
const nodeEnv = process.env.NODE_ENV || 'development';

// Create a logger instance that supports various log levels: error, warn, info, http, verbose, debug, silly
const logger = winston.createLogger({
    level: nodeEnv === 'development' ? 'debug' : 'info',
    format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.colorize(),
        logFormat
    ),
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
        new winston.transports.File({ filename: 'logs/combined.log' })
    ],
});

module.exports = logger;
