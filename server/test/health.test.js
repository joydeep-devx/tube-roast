import request from 'supertest'
import { describe, expect, it } from 'vitest'
import { createTestApp } from './helpers.js'

describe('GET /api/health', () => {
  const { app } = createTestApp()

  it('responds 200 with status, database state, uptime and timestamp', async () => {
    const res = await request(app).get('/api/health')

    expect(res.status).toBe(200)
    expect(res.headers['content-type']).toMatch(/application\/json/)
    expect(res.body.status).toBe('ok')
    // Tests don't open a real connection, so the database is reported as disconnected.
    expect(res.body.database).toBe('disconnected')
    expect(res.body.uptime).toBeTypeOf('number')
    expect(Number.isNaN(Date.parse(res.body.timestamp))).toBe(false)
  })

  it('sets security headers and hides X-Powered-By', async () => {
    const res = await request(app).get('/api/health')

    expect(res.headers['x-content-type-options']).toBe('nosniff')
    expect(res.headers['x-frame-options']).toBe('SAMEORIGIN')
    expect(res.headers['x-powered-by']).toBeUndefined()
  })
})
