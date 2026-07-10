const mongoose= require('mongoose');
const env = require("./env");

mongoose.set('strictQuery', true);
 async function connectDB() {
    const conn = await mongoose.connect(env.MONGO_URI, {
        serverSelectionTimeoutMS: 5000,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);

    mongoose.connection.on('error', (err) => {
        console.error(`MongoDB connection error: ${err}`);      
    });
}

module.exports = connectDB;