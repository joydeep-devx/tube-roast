import { AppError } from '../utils/AppError.js'
import { LLM_ERROR_CODES } from './llmProvider.js'

const NVIDIA_BASE_URL = 'https://integrate.api.nvidia.com/v1'
// Nemotron reasons before answering. Capping it roughly halved latency in testing with no loss in quality.
const MAX_THINKING_TOKENS = 256

const unavailable = () =>
  new AppError(503, 'The roast service is unavailable right now. Please try again later.', {
    code: LLM_ERROR_CODES.UNAVAILABLE,
    expose: true,
  })

// Maps NVIDIA's HTTP errors to user-safe errors. Details go to the server log, never the client.
function toAppError(status) {
  if (status === 429) {
    return new AppError(503, 'The roasting oven is busy. Please try again in a minute.', {
      code: LLM_ERROR_CODES.BUSY,
      expose: true,
    })
  }
  if (status === 401 || status === 403) {
    console.error(`[llm] NVIDIA rejected the API key (HTTP ${status}). Check NVIDIA_API_KEY in server/.env.`)
  } else if (status === 404) {
    console.error('[llm] NVIDIA could not find the model (HTTP 404). Check NVIDIA_MODEL in server/.env.')
  } else {
    console.error(`[llm] NVIDIA request failed with HTTP ${status}`)
  }
  return unavailable()
}

/**
 * LLM provider for NVIDIA's hosted, OpenAI-compatible chat completions API.
 * This is the only file that knows NVIDIA's URL, headers and request extensions.
 * fetchImpl is injectable so tests never call the real API.
 */
export function createNvidiaProvider({ apiKey, model, fetchImpl = fetch, timeoutMs = 30_000 }) {
  return {
    model,

    async complete({ system, user, schema, maxTokens }) {
      let response
      try {
        response = await fetchImpl(`${NVIDIA_BASE_URL}/chat/completions`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: 'system', content: system },
              { role: 'user', content: user },
            ],
            max_tokens: maxTokens + MAX_THINKING_TOKENS,
            temperature: 0.9,
            top_p: 0.95,
            response_format: { type: 'json_schema', json_schema: { name: 'roast', schema, strict: true } },
            nvext: { max_thinking_tokens: MAX_THINKING_TOKENS },
          }),
          signal: AbortSignal.timeout(timeoutMs),
        })
      } catch (error) {
        if (error.name === 'TimeoutError' || error.name === 'AbortError') {
          throw new AppError(504, 'The roast took too long to cook. Please try again.', {
            code: LLM_ERROR_CODES.TIMEOUT,
            expose: true,
          })
        }
        console.error('[llm] Could not reach NVIDIA:', error.message)
        throw unavailable()
      }

      if (!response.ok) {
        throw toAppError(response.status)
      }

      const data = await response.json().catch(() => null)
      const choice = data?.choices?.[0]

      return {
        // Only the final answer. The model's reasoning is in a separate field and is ignored.
        text: typeof choice?.message?.content === 'string' ? choice.message.content : '',
        model: data?.model ?? model,
        truncated: choice?.finish_reason === 'length',
      }
    },
  }
}
