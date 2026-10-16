import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import request from 'supertest'
import { afterAll, describe, expect, it } from 'vitest'
import { SESSION_COOKIE_NAME } from '../src/config/session.js'
import { createTestApp, getCookie } from './helpers.js'

// A tiny fake client build, shaped like Vite's output.
const distDir = mkdtempSync(path.join(tmpdir(), 'tuberoast-dist-'))
mkdirSync(path.join(distDir, 'assets'))
writeFileSync(path.join(distDir, 'index.html'), '<!doctype html><title>TubeRoast</title><div id="root"></div>')
writeFileSync(path.join(distDir, 'assets', 'index-abc123.js'), 'console.log("app")')
writeFileSync(path.join(distDir, 'favicon.svg'), '<svg xmlns="http://www.w3.org/2000/svg"/>')

const productionApp = () =>
  createTestApp({ config: { isProduction: true, clientDistDir: distDir, clientUrl: 'https://tuberoast.example' } }).app

afterAll(() => rmSync(distDir, { recursive: true, force: true }))

describe('serving the client in production', () => {
  it.each(['/', '/history', '/roasts/abc', '/some/unknown/page'])('serves index.html for %s (React Router takes over)', async (url) => {
    const res = await request(productionApp()).get(url)

    expect(res.status).toBe(200)
    expect(res.headers['content-type']).toMatch(/text\/html/)
    expect(res.text).toContain('<div id="root">')
    expect(res.headers['cache-control']).toBe('no-cache')
  })

  it('serves hashed assets with a one-year immutable cache', async () => {
    const res = await request(productionApp()).get('/assets/index-abc123.js')

    expect(res.status).toBe(200)
    expect(res.text).toContain('console.log("app")')
    expect(res.headers['cache-control']).toBe('public, max-age=31536000, immutable')
  })

  it('serves other static files with revalidation', async () => {
    const res = await request(productionApp()).get('/favicon.svg')

    expect(res.status).toBe(200)
    expect(res.headers['cache-control']).toBe('no-cache')
  })

  it('keeps unknown API routes as JSON 404s, never the HTML page', async () => {
    const res = await request(productionApp()).get('/api/does-not-exist')

    expect(res.status).toBe(404)
    expect(res.body).toEqual({ error: { message: 'Not found' } })
  })

  it('still answers the API (health check used by Render)', async () => {
    const res = await request(productionApp()).get('/api/health')

    expect(res.status).toBe(200)
    expect(res.body.status).toBe('ok')
  })

  it('does not serve the page for non-GET requests', async () => {
    const res = await request(productionApp()).post('/history').set('Content-Type', 'application/json').send('{}')

    expect(res.status).toBe(404)
    expect(res.headers['content-type']).toMatch(/json/)
  })

  it('does not create sessions for static files', async () => {
    const res = await request(productionApp()).get('/assets/index-abc123.js')
    expect(getCookie(res, SESSION_COOKIE_NAME)).toBeNull()
  })

  it('does not serve the client when no build directory is configured (development)', async () => {
    const res = await request(createTestApp().app).get('/')
    expect(res.status).toBe(404)
  })
})

describe('security headers', () => {
  it('allows Google avatar images in the Content Security Policy, and only scripts from our origin', async () => {
    const csp = (await request(productionApp()).get('/')).headers['content-security-policy']

    expect(csp).toContain("img-src 'self' data: https://lh3.googleusercontent.com")
    expect(csp).toContain("script-src 'self'")
  })
})

describe('running behind a proxy (Render)', () => {
  it('sets a Secure session cookie when the proxy reports HTTPS', async () => {
    const res = await request(productionApp()).get('/api/auth/google').set('X-Forwarded-Proto', 'https')

    const cookie = getCookie(res, SESSION_COOKIE_NAME)
    expect(cookie.raw).toMatch(/; Secure/i)
    expect(cookie.raw).toMatch(/HttpOnly/i)
    expect(cookie.raw).toMatch(/SameSite=Lax/i)
  })

  it('refuses to send the Secure cookie over plain HTTP', async () => {
    const res = await request(productionApp()).get('/api/auth/google')

    expect(getCookie(res, SESSION_COOKIE_NAME)).toBeNull()
  })

  it('rate limits by the real client IP from X-Forwarded-For, not the proxy', async () => {
    const app = productionApp()
    for (let i = 0; i < 20; i++) {
      await request(app).get('/api/auth/google').set('X-Forwarded-For', '203.0.113.1').expect(302)
    }

    const sameUser = await request(app).get('/api/auth/google').set('X-Forwarded-For', '203.0.113.1')
    const otherUser = await request(app).get('/api/auth/google').set('X-Forwarded-For', '198.51.100.7')

    expect(sameUser.status).toBe(429)
    expect(otherUser.status).toBe(302)
  })
})
