import MongoStore, { createWebCryptoAdapter } from 'connect-mongo'
import session from 'express-session'
import mongoose from 'mongoose'

export const SESSION_COOKIE_NAME = 'tuberoast.sid'
const SESSION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000

export const sessionCookieOptions = (isProduction) => ({
  httpOnly: true, // JavaScript in the page can't read the cookie, so XSS can't steal it
  sameSite: 'lax', // not sent on cross-site POSTs, which blocks most CSRF
  secure: isProduction, // HTTPS-only in production; localhost is plain HTTP
  path: '/',
})

/**
 * Stores sessions in MongoDB (they survive server restarts) and encrypts their contents
 * with AES-GCM, so a database leak doesn't expose session data. Call after connecting to MongoDB.
 */
export function createSessionStore({ secret }) {
  return MongoStore.create({
    client: mongoose.connection.getClient(),
    dbName: mongoose.connection.name,
    collectionName: 'sessions',
    ttl: SESSION_MAX_AGE_MS / 1000, // MongoDB deletes expired sessions automatically
    touchAfter: 24 * 60 * 60, // refresh the expiry at most once a day instead of on every request
    cryptoAdapter: createWebCryptoAdapter({ secret }),
  })
}

export function createSessionMiddleware({ secret, store, isProduction }) {
  return session({
    name: SESSION_COOKIE_NAME,
    secret,
    store, // undefined → in-memory store (tests only)
    resave: false,
    saveUninitialized: false, // no cookie until there's something worth remembering
    cookie: { ...sessionCookieOptions(isProduction), maxAge: SESSION_MAX_AGE_MS },
  })
}

// express-session's regenerate/save/destroy use callbacks; these wrap them for async/await.
export const regenerateSession = (req) => new Promise((resolve, reject) => req.session.regenerate((err) => (err ? reject(err) : resolve())))
export const saveSession = (req) => new Promise((resolve, reject) => req.session.save((err) => (err ? reject(err) : resolve())))
export const destroySession = (req) => new Promise((resolve, reject) => req.session.destroy((err) => (err ? reject(err) : resolve())))
