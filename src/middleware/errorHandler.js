export function notFound(req, res, next) {
  res.status(404).json({ message: 'Not Found' });
}

export function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  const status = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;
  const payload = {
    message: err.message || 'Server Error',
  };
  if (process.env.NODE_ENV !== 'production') {
    payload.stack = err.stack;
  }
  res.status(status).json(payload);
}
