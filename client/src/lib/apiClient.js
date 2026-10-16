export class ApiError extends Error {
  constructor(status, message) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

/**
 * Small wrapper around fetch for our own API. Same-origin requests carry the session cookie
 * automatically (via the Vite proxy in development). Non-2xx responses throw an ApiError.
 */
export async function apiRequest(path, { method = 'GET', body, signal } = {}) {
  const response = await fetch(path, {
    method,
    signal,
    credentials: 'same-origin',
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  })

  if (response.status === 204) {
    return null
  }

  const data = await response.json().catch(() => null)

  if (!response.ok) {
    throw new ApiError(response.status, data?.error?.message ?? 'Something went wrong')
  }

  return data
}
