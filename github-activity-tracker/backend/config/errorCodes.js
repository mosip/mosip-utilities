/**
 * HTTP and GitHub API error codes used by sync routes and services.
 * Centralized so APIs and GitHub error handling stay consistent and easy to change.
 */

// HTTP status codes (API responses)
const HTTP = {
  BAD_REQUEST: 400,
  NOT_FOUND: 404,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
};

// GitHub API response status codes
const GITHUB = {
  /** Validation Failed – e.g. no access to repo, invalid query */
  VALIDATION_FAILED: 422,
};

// PostgreSQL error codes (error.code from pg driver)
const POSTGRES = {
  /** unique_violation – duplicate key on unique constraint */
  UNIQUE_VIOLATION: '23505',
};

// Response payload status strings
const STATUS = {
  ERROR: 'error',
  SUCCESS: 'success',
};

module.exports = {
  HTTP,
  GITHUB,
  POSTGRES,
  STATUS,
};
