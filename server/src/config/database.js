import mongoose from 'mongoose'

// Our data always lives in this database, whatever (if anything) the connection string names.
const DATABASE_NAME = 'tuberoast'

const READY_STATES = {
  0: 'disconnected',
  1: 'connected',
  2: 'connecting',
  3: 'disconnecting',
}

/**
 * Hides "user:password@" in text that may contain a connection string, so error logs never leak it.
 */
export function redactConnectionString(text) {
  return String(text).replace(/\/\/[^@/\s]+@/g, '//<credentials>@')
}

export async function connectToDatabase(uri) {
  // Fail after 10s instead of Mongoose's default 30s when Atlas is unreachable (wrong URI, IP not allowed).
  await mongoose.connect(uri, { dbName: DATABASE_NAME, serverSelectionTimeoutMS: 10_000 })

  // Registered after the first successful connect, so a failed startup doesn't also log "disconnected".
  mongoose.connection.on('disconnected', () => console.warn('MongoDB disconnected'))
  mongoose.connection.on('reconnected', () => console.log('MongoDB reconnected'))
}

export async function disconnectFromDatabase() {
  await mongoose.disconnect()
}

export function getDatabaseStatus() {
  return READY_STATES[mongoose.connection.readyState] ?? 'unknown'
}
