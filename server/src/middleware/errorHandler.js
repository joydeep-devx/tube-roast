const GENERIC_MESSAGE = 'Something went wrong'

function resolveStatus(err) {
  const status = err.statusCode ?? err.status
  return Number.isInteger(status) && status >= 400 && status < 600 ? status : 500
}

/**
 * Last middleware in the chain. Express recognizes it as an error handler because it takes 4 arguments.
 *
 * Clients get a consistent `{ error: { message } }` shape. Only errors marked `expose`
 * (our AppErrors and body-parser's 4xx errors) reveal their message; everything else
 * gets a generic message so internals and stack traces never leak.
 */
export function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err)
  }

  const status = resolveStatus(err)
  const message = err.expose === true && status < 500 ? err.message : GENERIC_MESSAGE

  if (status >= 500) {
    // Full details stay in server logs. Request bodies and headers are not logged because they may hold secrets.
    console.error(`[error] ${req.method} ${req.originalUrl}`, err)
  }

  res.status(status).json({ error: { message } })
}
