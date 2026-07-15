const env = require("../config/env");
const apiError = require("../utils/apiError");

function notFound(req, res, next) {
    next(apiError.notFound(`Can't find ${req.originalUrl} on this server!`));
}

function errorHandler(err, req, res, next) {
    let status = err.statusCode || 500;
    let message = err.message || "Internal Server Error";
    let details = err.details || null;

    if (err.name === "ValidationError" && err.errors) {
        status = 400;
        details = Object.fromEntries(
            Object.entries(err.errors).map(([key, value]) => [key, value.message])
        );
        message = "Validation failed";
    } else if (err.name === "CastError") {
        status = 400;
        message = `Invalid ${err.path}: ${err.value}`;
    } else if (err.code === 11000) {
        status = 409;
        message = `Duplicate field value`;
        details = err.keyValue;
    } else if (err.name === "ZodError") {
        status = 400;
        message = "Validation failed";
        details = err.issues;
    }

    if (status >= 500) {
        console.error(err);
    }

    res.status(status).json({
        error: {
            message,
            ...(details ? { details } : {}),
            ...(env.isProd ? {} : { stack: err.stack }),
        },
    });
}

module.exports ={notFound, errorHandler};
