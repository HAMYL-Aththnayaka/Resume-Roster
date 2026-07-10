const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const required  = ["MONGO_URI", "JWT_SECRET", "JWT_EXPIRES_IN", "COOCKIE_NAME", "GEMINI_API_KEY", "GEMINI_MODEL"];
const missing = required.filter((key) => !process.env[key]);
if (missing.length > 0) {
    console.error(`Missing required environment variables: ${missing.join(', ')}`);
    process.exit(1);
}

module.exports = {
    MONGO_URI: process.env.MONGO_URI,
    JWT_SECRET: process.env.JWT_SECRET, 
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN,
    COOCKIE_NAME: process.env.COOCKIE_NAME,
    CLIENT_ORIGIN: process.env.CLIENT_ORIGIN,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    GEMINI_MODEL: process.env.GEMINI_MODEL
};