const errorHandler = (err, req, res, next) => {
    const statusCode = res.statusCode ? res.statusCode : 500;
  
    res.status(statusCode);
  
    res.json({
      message: err.message,
      // Uncomment the stack trace in development for better debugging
      stack:  err.stack
    });
  };
  
  module.exports = errorHandler;
  