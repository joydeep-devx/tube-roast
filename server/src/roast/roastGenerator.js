import { AppError } from '../utils/AppError.js'
import { buildRoastMessages, ROAST_JSON_SCHEMA } from './roastPrompt.js'
import { parseRoastOutput } from './roastSchema.js'

const MAX_ATTEMPTS = 2
// Room for the JSON answer (~600 chars of roast plus headline and verdict).
const MAX_ANSWER_TOKENS = 500

/**
 * Turns a roast profile into a validated roast using any LlmProvider.
 * Invalid replies are retried once; provider errors (timeouts, rate limits) are not,
 * because retrying them would only make the user wait twice as long.
 */
export function createRoastGenerator({ provider }) {
  return {
    async generate(profile) {
      const { system, user } = buildRoastMessages(profile)

      for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
        const reply = await provider.complete({ system, user, schema: ROAST_JSON_SCHEMA, maxTokens: MAX_ANSWER_TOKENS })
        const parsed = reply.truncated
          ? { success: false, reason: 'reply was cut off by the token limit' }
          : parseRoastOutput(reply.text)

        if (parsed.success) {
          return { ...parsed.data, model: reply.model }
        }
        console.warn(`[roast] Attempt ${attempt} rejected: ${parsed.reason}`)
      }

      throw new AppError(502, 'The AI fumbled the punchline. Please try again.', { code: 'ROAST_FAILED', expose: true })
    },
  }
}
