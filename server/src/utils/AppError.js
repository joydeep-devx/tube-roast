/**
 * An error we throw on purpose, with an HTTP status and a message that is safe to show users.
 * Anything else that gets thrown is treated as an unexpected bug and hidden behind a generic 500.
 */
export class AppError extends Error {
  constructor(statusCode, message, options = {}) {
    super(message, options)
    this.name = 'AppError'
    this.statusCode = statusCode
    this.expose = statusCode < 500
  }
}
