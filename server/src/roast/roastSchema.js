import { z } from 'zod'
import { ROAST_LIMITS } from './roastPrompt.js'

// Even with structured output, model replies are untrusted input: validate everything.
export const roastOutputSchema = z.object({
  headline: z.string().trim().min(3).max(ROAST_LIMITS.headline),
  roast: z.string().trim().min(40).max(ROAST_LIMITS.roast),
  verdict: z.string().trim().min(2).max(ROAST_LIMITS.verdict),
})

// Claims the model has invented in testing. We never have this data, so a roast that mentions it is wrong.
const UNSUPPORTED_CLAIMS = [/watch[\s-]?(history|time)/i, /\bwatched\b/i, /\bfinish(ed)? (watching|them|it)\b/i]
const LINKS = /\bhttps?:\/\/|\bwww\./i

/** Strips a ```json … ``` wrapper some models add despite instructions. */
function unwrapCodeFence(text) {
  return text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '')
}

/**
 * Parses and checks a model reply. Returns { success: true, data } or { success: false, reason }.
 * The reason is for server logs only.
 */
export function parseRoastOutput(text) {
  let json
  try {
    json = JSON.parse(unwrapCodeFence(String(text ?? '')))
  } catch {
    return { success: false, reason: 'reply was not valid JSON' }
  }

  const result = roastOutputSchema.safeParse(json)
  if (!result.success) {
    return { success: false, reason: `reply did not match the schema (${result.error.issues[0]?.path.join('.')})` }
  }

  const allText = Object.values(result.data).join(' ')
  if (UNSUPPORTED_CLAIMS.some((pattern) => pattern.test(allText))) {
    return { success: false, reason: 'reply claimed watch history or watch time' }
  }
  if (LINKS.test(allText)) {
    return { success: false, reason: 'reply contained a link' }
  }

  return { success: true, data: result.data }
}
