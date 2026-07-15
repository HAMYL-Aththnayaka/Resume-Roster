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
    secure: env.isProd,
    sameSite: env.isProd ? "None" : "Lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/",
};

module.exports = {
    signToken,
    verifytoken,
    coockieOptions
};