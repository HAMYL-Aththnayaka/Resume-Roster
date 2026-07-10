const jwt = require('jsonwebtoken');
const env = require('../config/env');

function signToken(payload) {
    return jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN });
}

function verifytoken(token){
    return jwt.verify(token,env.JWT_SECRET);
}

const coockieOptions = {
    httpOnly: true,
    secure: env.isProd, // Set to true in production
    sameSite: env.isProd ? 'None' : 'Lax', // Adjust based on your needs
    maxAge: env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000, // Convert days to milliseconds
    path: '/', // Set the path for the cookie
};

module.exports = {
    signToken,
    verifytoken,
    coockieOptions
};