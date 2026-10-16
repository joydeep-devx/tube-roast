import express from 'express'
import request from 'supertest'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createApp } from '../src/app.js'
import { errorHandler } from '../src/middleware/errorHandler.js'
import { AppError } from '../src/utils/AppError.js'

// A tiny app with routes that fail on purpose, wired to the real error handler.
function createFailingApp() {
  const app = express()
  app.get('/bug', () => {
    throw new Error('database password is hunter2')
  })
  app.get('/async-bug', async () => {
    throw new Error('async internal detail')
  })
  app.get('/forbidden', () => {
    throw new AppError(403, 'You can only view your own roasts')
  })
  app.use(errorHandler)
  return app
}

describe('error handling', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns a JSON 404 for unknown routes', async () => {
    const res = await request(createApp()).get('/api/does-not-exist')

    expect(res.status).toBe(404)
    expect(res.body).toEqual({ error: { message: 'Not found' } })
  })

  it('hides internal error details behind a generic 500', async () => {
    const logSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const res = await request(createFailingApp()).get('/bug')

    expect(res.status).toBe(500)
    expect(res.body).toEqual({ error: { message: 'Something went wrong' } })
    expect(res.text).not.toContain('hunter2')
    expect(res.text).not.toContain('at ')
    expect(logSpy).toHaveBeenCalledOnce()
  })

  it('catches errors thrown in async handlers (Express 5)', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})

    const res = await request(createFailingApp()).get('/async-bug')

    expect(res.status).toBe(500)
    expect(res.body.error.message).toBe('Something went wrong')
  })

  it('exposes the message of intentional AppErrors', async () => {
    const res = await request(createFailingApp()).get('/forbidden')

    expect(res.status).toBe(403)
    expect(res.body).toEqual({ error: { message: 'You can only view your own roasts' } })
  })

  it('rejects malformed JSON with a 400', async () => {
    const res = await request(createApp())
      .post('/api/health')
      .set('Content-Type', 'application/json')
      .send('{"broken":')

    expect(res.status).toBe(400)
    expect(res.body.error.message).toBeTypeOf('string')
  })

  it('rejects JSON bodies over 10kb with a 413', async () => {
    const res = await request(createApp())
      .post('/api/health')
      .set('Content-Type', 'application/json')
      .send(JSON.stringify({ padding: 'x'.repeat(11 * 1024) }))

    expect(res.status).toBe(413)
  })
})
