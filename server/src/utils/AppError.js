/**
 * An error we throw on purpose, with an HTTP status and a message that is safe to show users.
 * Anything else that gets thrown is treated as an unexpected bug and hidden behind a generic 500.
 *
 * Options:
 * - code: machine-readable reason the frontend can branch on (e.g. 'YOUTUBE_NOT_CONNECTED')
 * - expose: show the message to users; defaults to true for 4xx. Set it for 5xx errors
 *   whose message is deliberately written for users (e.g. "YouTube took too long").
 */
export class AppError extends Error {
  constructor(statusCode, message, { code, expose = statusCode < 500, cause } = {}) {
    super(message, { cause })
    this.name = 'AppError'
    this.statusCode = statusCode
    this.code = code
    this.expose = expose
  }
}
