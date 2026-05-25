const { ValidationError, UniqueConstraintError, ForeignKeyConstraintError } = require('sequelize');

const errorHandler = (err, req, res, next) => {
  // Sequelize validation error
  if (err instanceof ValidationError) {
    const details = Object.fromEntries(err.errors.map((e) => [e.path, e.message]));
    return res.status(400).json({ error: 'Validation failed', details });
  }

  // Unique constraint (duplicate key)
  if (err instanceof UniqueConstraintError) {
    const field = err.errors[0]?.path || 'field';
    return res.status(409).json({ error: `${field} already exists` });
  }

  // Foreign key violation
  if (err instanceof ForeignKeyConstraintError) {
    return res.status(400).json({ error: 'Referenced record does not exist' });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
};

module.exports = errorHandler;
