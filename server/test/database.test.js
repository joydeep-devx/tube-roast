import { describe, expect, it } from 'vitest'
import { getDatabaseStatus, redactConnectionString } from '../src/config/database.js'

describe('redactConnectionString', () => {
  it('hides credentials in a connection string', () => {
    expect(redactConnectionString('failed: mongodb+srv://alice:hunter2@cluster0.example.invalid/db')).toBe(
      'failed: mongodb+srv://<credentials>@cluster0.example.invalid/db',
    )
  })

  it('leaves text without credentials unchanged', () => {
    expect(redactConnectionString('connect ECONNREFUSED 127.0.0.1:27017')).toBe('connect ECONNREFUSED 127.0.0.1:27017')
  })
})

describe('getDatabaseStatus', () => {
  it('reports disconnected when no connection was opened', () => {
    expect(getDatabaseStatus()).toBe('disconnected')
  })
})
