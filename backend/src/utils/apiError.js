class ApiError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true; 
    Error.captureStackTrace(this, this.constructor);
  }
  
  static badRequest(message,details) {
    return new ApiError(400, message,details);
  }
  static unauthorized(message,details) {
    return new ApiError(401, message,details);
  }
  static forbidden(message,details) {
    return new ApiError(403, message,details);
  } 
  static notFound(message,details) {
    return new ApiError(404, message,details);
  } 
  static conflict(message,details) {
    return new ApiError(409, message,details);
  }
  static toMany(message ="Too many requests") {
    return new ApiError(429, message);
  }
  static internal(message="Internal Server error"){
    return new ApiError(429, message);
  }
}
module.exports =ApiError;