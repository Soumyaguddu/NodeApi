
exports.errorHandler = (err, req, res, next) => {
  res.locals.message = err.message || "Please try again after some time";
  res.status(err.status || 500)
      .json({status: false, message: res.locals.message});
};
