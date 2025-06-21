const jwt = require('jsonwebtoken');
const { logger } = require('./logger');

function authenticateToken(req, res, next) {
    logger.info('JWT authentication attempt', { 
        method: req.method, 
        url: req.url,
        userAgent: req.headers['user-agent'],
        ip: req.ip || req.connection.remoteAddress
    });

    // First try to get token from Authorization header (Bearer token)
    const authHeader = req.headers['authorization'];
    let token = authHeader?.split(' ')[1];
    let tokenSource = 'header';
    
    // If no Bearer token, try to get token from cookies
    if (!token) {
        token = req.cookies?.token;
        tokenSource = 'cookie';
    }

    if (!token) {
        logger.warn('Authentication failed: No token provided', {
            method: req.method,
            url: req.url,
            ip: req.ip || req.connection.remoteAddress
        });
        return res.sendStatus(401);
    }

    logger.debug('Token found', { source: tokenSource, url: req.url });

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            logger.warn('Authentication failed: Invalid token', {
                method: req.method,
                url: req.url,
                error: err.message,
                tokenSource,
                ip: req.ip || req.connection.remoteAddress
            });
            return res.sendStatus(403);
        }
        
        logger.info('Authentication successful', {
            userId: user.id,
            username: user.username,
            method: req.method,
            url: req.url,
            tokenSource
        });
        
        req.user = user;
        next();
    });
}

module.exports = authenticateToken
