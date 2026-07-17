const dns = require("dns");

dns.setServers([
    "8.8.8.8",
    "1.1.1.1"
]);

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const connectDB = require('./config/db');

const env = require('./config/env');
//const {connectDB} = require('./config/db');
const {notFound, errorHandler} = require('./middleware/errorHandler');

const healthRouter = require('./routes/health');
const authRouter = require("./routes/auth");
const resumeRouter = require("./routes/resumes");

const dashBoardRouter = require("./routes/dashboard");
const insightRouter = require("./routes/insights");
const versionRouter = require("./routes/versions");
const historyRouter = require("./routes/history");

const app = express();

app.set("trust proxy", 1);
app.use(cors({
    origin:true,
    credentials: true,
}));

app.use(express.json({limit: '1mb'}));
app.use(express.urlencoded({extended: true, limit: '1mb'}));
app.use(cookieParser());

if (env.isDev) {
    app.use(morgan('dev'));
}

app.use('/api/health', healthRouter);
app.use("/api/auth",authRouter);
app.use("/api/resumes",resumeRouter);
app.use("/api/dashboard",dashBoardRouter);
app.use("/api/insights",insightRouter);
app.use("/api/versions",versionRouter);
app.use("/api/history",historyRouter);

app.use(notFound);
app.use(errorHandler);

async function startServer() {
    try {
        await connectDB();
        const PORT = env.PORT || 5000;
        app.listen(PORT, () => {
            console.log(`Server running in ${env.NODE_ENV} mode on port ${PORT}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

process.on('unhandledRejection', (reason) => {
    console.error('Unhandled Rejection at:', reason);
});
startServer();

module.exports = app;