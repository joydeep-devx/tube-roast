import path from 'node:path'
import express from 'express'

const ONE_YEAR_SECONDS = 365 * 24 * 60 * 60

/**
 * In production, Express serves the built React app from the same origin as the API.
 * Same origin means first-party session cookies and no CORS.
 *
 * - /assets/* files have content hashes in their names (index-DMGtyAXY.js), so they never change:
 *   browsers may cache them for a year.
 * - Everything else (index.html, favicon) must be revalidated, so a new deploy shows up immediately.
 * - Any other GET outside /api returns index.html, letting React Router handle /history, /roasts/:id, etc.
 */
export function serveClient(distDir) {
  const indexFile = path.join(distDir, 'index.html')

  const staticFiles = express.static(distDir, {
    index: false, // "/" goes through the SPA fallback below, with no-cache headers
    setHeaders(res, filePath) {
      const isHashedAsset = filePath.includes(`${path.sep}assets${path.sep}`)
      res.setHeader('Cache-Control', isHashedAsset ? `public, max-age=${ONE_YEAR_SECONDS}, immutable` : 'no-cache')
    },
  })

  function spaFallback(req, res, next) {
    const isPageRequest = (req.method === 'GET' || req.method === 'HEAD') && !req.path.startsWith('/api')
    if (!isPageRequest) return next()
    res.setHeader('Cache-Control', 'no-cache')
    res.sendFile(indexFile)
  }

  return [staticFiles, spaFallback]
}
