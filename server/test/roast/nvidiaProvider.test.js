import { afterEach, describe, expect, it, vi } from 'vitest'
import { createNvidiaProvider } from '../../src/llm/nvidiaProvider.js'

const API_KEY = 'nvapi-test-key-not-real'
const request = { system: 'system rules', user: 'user data', schema: { type: 'object' }, maxTokens: 500 }

const jsonResponse = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

const completion = (content, finishReason = 'stop') =>
  jsonResponse({ model: 'nvidia/test-model', choices: [{ message: { content, reasoning_content: 'hidden thoughts' }, finish_reason: finishReason }] })

const provider = (fetchImpl, options = {}) =>
  createNvidiaProvider({ apiKey: API_KEY, model: 'nvidia/test-model', fetchImpl, ...options })

describe('NVIDIA provider', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('sends an OpenAI-style request with structured output and capped reasoning', async () => {
    const fetchImpl = vi.fn(async () => completion('{"ok":true}'))
    await provider(fetchImpl).complete(request)

    const [url, options] = fetchImpl.mock.calls[0]
    const body = JSON.parse(options.body)
    expect(url).toBe('https://integrate.api.nvidia.com/v1/chat/completions')
    expect(options.headers.Authorization).toBe(`Bearer ${API_KEY}`)
    expect(body.model).toBe('nvidia/test-model')
    expect(body.messages).toEqual([
      { role: 'system', content: 'system rules' },
      { role: 'user', content: 'user data' },
    ])
    expect(body.response_format).toEqual({
      type: 'json_schema',
      json_schema: { name: 'roast', schema: { type: 'object' }, strict: true },
    })
    expect(body.nvext).toEqual({ max_thinking_tokens: 256 })
    expect(body.max_tokens).toBe(500 + 256)
  })

  it('returns only the final answer, never the reasoning', async () => {
    const result = await provider(vi.fn(async () => completion('{"headline":"x"}'))).complete(request)
    expect(result).toEqual({ text: '{"headline":"x"}', model: 'nvidia/test-model', truncated: false })
  })

  it('reports replies cut off by the token limit', async () => {
    const result = await provider(vi.fn(async () => completion('{"head', 'length'))).complete(request)
    expect(result.truncated).toBe(true)
  })

  it.each([
    [429, 503, 'ROAST_BUSY'],
    [401, 503, 'ROAST_UNAVAILABLE'],
    [403, 503, 'ROAST_UNAVAILABLE'],
    [404, 503, 'ROAST_UNAVAILABLE'],
    [500, 503, 'ROAST_UNAVAILABLE'],
  ])('maps NVIDIA HTTP %i to %i %s', async (nvidiaStatus, status, code) => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const fetchImpl = vi.fn(async () => jsonResponse({ error: 'nope' }, nvidiaStatus))

    await expect(provider(fetchImpl).complete(request)).rejects.toMatchObject({ statusCode: status, code, expose: true })
  })

  it('logs a hint about the key on 401 without printing the key', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    await provider(vi.fn(async () => jsonResponse({}, 401)))
      .complete(request)
      .catch(() => {})

    const logged = JSON.stringify(errorSpy.mock.calls)
    expect(logged).toContain('NVIDIA_API_KEY')
    expect(logged).not.toContain(API_KEY)
  })

  it('times out slow requests', async () => {
    const fetchImpl = vi.fn(
      (url, { signal }) => new Promise((resolve, reject) => signal.addEventListener('abort', () => reject(signal.reason))),
    )

    await expect(provider(fetchImpl, { timeoutMs: 20 }).complete(request)).rejects.toMatchObject({
      statusCode: 504,
      code: 'ROAST_TIMEOUT',
    })
  })

  it('handles network failures', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const fetchImpl = vi.fn(async () => {
      throw new TypeError('fetch failed')
    })

    await expect(provider(fetchImpl).complete(request)).rejects.toMatchObject({ code: 'ROAST_UNAVAILABLE' })
  })

  it('returns empty text for an unexpected response shape, leaving validation to the caller', async () => {
    const result = await provider(vi.fn(async () => jsonResponse({ choices: [] }))).complete(request)
    expect(result.text).toBe('')
  })
})
