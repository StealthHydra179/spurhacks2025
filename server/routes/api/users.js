var express = require('express'),
    router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { logger } = require('../../logger');
const userDb = require('../../db/users');
const TAG = 'api_users';

router.get('/', function (req, res) {
    res.json({
        message: 'Welcome to the User API',
        status: 'success'
    });
})

// router.get('/getByID/:id', async function (req, res) {
//     try {
//         const userId = req.params.id;
//         logger.info(`${TAG} Fetching user with ID: ${userId}`);
//         user = await userDb.getByID(userId)

//         if (user.length === 0) {
//             logger.warn(`${TAG} User with ID ${userId} not found`);
//             return res.status(404).json({ message: 'User not found' });
//         }
        
//         res.json(user[0]);
//     } catch (error) {
//         logger.error(`${TAG} Error fetching user: ${error.message}`);
//         res.status(500).json({ message: 'Internal Server Error' });
//     }
// });


// Register
router.post('/register', async (req, res) => {
    if (!req.body || !req.body.username || !req.body.password || !req.body.email) {
        logger.warn(`${TAG} Registration failed: Username, email, and password are required`);
        return res.status(400).json({ message: 'Username, email, and password are required' });
    }
    const { username, password } = req.body;

    // Comprehensive email validation using regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(req.body.email)) {
        logger.warn(`${TAG} Registration failed: Invalid email address "${req.body.email}"`);
        return res.status(400).json({ message: 'Invalid email address' });
    }

    const userExists = await userDb.getByUsername(username);
    if (userExists.length !== 0) {
        logger.warn(`${TAG} Registration failed: User already exists with username ${username}`);
        logger.info(`${TAG} User details: ${userExists}`);
        return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);// TODO fix salt
    await userDb.setUser(req.body.email, username, hashedPassword);
    // TODO add peper to hashing?

    res.status(201).json({ message: 'User registered' });
});

// TODO Begin temp code

// Login
router.post('/login', async (req, res) => {
    if (!req.body || !req.body.username || !req.body.password) {
        logger.warn(`${TAG} Login failed: Username and password are required`);
        return res.status(400).json({ message: 'Username and password are required' });
    }
    const { username, password } = req.body;
    const users = await userDb.getByUsername(username);

    if (users.length === 0) {
        return res.status(400).json({message: 'User not found'})
    }
    const user = users[0]

    if (!user || !(await bcrypt.compare( password, user.hashed_password))) {
        return res.status(401).json({ message: 'Invalid credentials' });
    }    const userID = user.id;

    const token = jwt.sign({ username, userID }, process.env.JWT_SECRET, { expiresIn: '1h' });
    
    // Send token as httpOnly cookie for better security
    res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', // Only use HTTPS in production
        sameSite: 'strict',
        maxAge: 3600000 // 1 hour in milliseconds
    });
    
    res.json({ message: 'Login successful' });
    logger.info(`${TAG} User ${username} logged in successfully`);
});

// Logout route
router.post('/logout', (req, res) => {
    // Clear the httpOnly cookie
    res.clearCookie('token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
    });
    
    res.json({ message: 'Logout successful' });
    logger.info(`${TAG} User logged out successfully`);
});

// Protected route
router.get('/profile', authenticateToken, async (req, res) => {
    try {
        const users = await userDb.getByUsername(req.user.username);
        if (users.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        const user = users[0];
        // Don't send the hashed password
        const { hashed_password, ...userProfile } = user;
        
        res.json(userProfile);
    } catch (error) {
        logger.error(`${TAG} Error fetching profile: ${error.message}`);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// Middleware to validate JWT from cookie
function authenticateToken(req, res, next) {
    const token = req.cookies?.token;

    if (!token) return res.sendStatus(401);

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
}

module.exports = router;
