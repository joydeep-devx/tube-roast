import request from 'supertest'
import { describe, expect, it } from 'vitest'
import { createApp } from '../src/app.js'

describe('GET /api/health', () => {
  const app = createApp()

  it('responds 200 with status, uptime and timestamp', async () => {
    const res = await request(app).get('/api/health')

    expect(res.status).toBe(200)
    expect(res.headers['content-type']).toMatch(/application\/json/)
    expect(res.body.status).toBe('ok')
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
