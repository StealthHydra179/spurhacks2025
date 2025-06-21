const jwt = require('jsonwebtoken');

function authenticateToken(req, res, next) {
    // First try to get token from Authorization header (Bearer token)
    const authHeader = req.headers['authorization'];
    let token = authHeader?.split(' ')[1];
    
    // If no Bearer token, try to get token from cookies
    if (!token) {
        token = req.cookies?.token;
    }

    if (!token) return res.sendStatus(401);

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
}

module.exports = authenticateToken
