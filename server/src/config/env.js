import { z } from 'zod'

// Every message is fixed text, so a bad value (possibly a secret) is never echoed back.
const requiredString = () =>
  z
    .string({ error: 'is required' })
    .trim()
    .min(1, { error: 'is required', abort: true })

function isHttpUrl(value) {
  try {
    return ['http:', 'https:'].includes(new URL(value).protocol)
  } catch {
    return false
  }
}

const httpUrl = () => requiredString().refine(isHttpUrl, 'must be an http(s) URL')

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(5000),
  MONGO_URI: requiredString().refine(
    (value) => /^mongodb(\+srv)?:\/\//.test(value),
    'must start with mongodb:// or mongodb+srv://',
  ),

  GOOGLE_CLIENT_ID: requiredString().refine(
    (value) => value.endsWith('.apps.googleusercontent.com'),
    'must be an OAuth client ID ending in .apps.googleusercontent.com',
  ),
  GOOGLE_CLIENT_SECRET: requiredString(),
  // Must match an "Authorized redirect URI" in Google Cloud exactly.
  GOOGLE_REDIRECT_URI: httpUrl(),
  // Where the React app runs. Used for post-login redirects and the CSRF origin check.
  CLIENT_URL: httpUrl().transform((value) => new URL(value).origin),
  // Signs session cookies and encrypts session data. Long and random: see README.
  SESSION_SECRET: requiredString().min(32, 'must be at least 32 characters'),

  // Hosted LLM used to write roasts. Server-side only: never expose this to the client.
  NVIDIA_API_KEY: requiredString().refine((value) => value.startsWith('nvapi-'), 'must be an NVIDIA API key (starts with nvapi-)'),
  NVIDIA_MODEL: z.string().trim().min(1).default('nvidia/nemotron-3.5-super-vl-120b-a12b'),
})

/**
 * Validates environment variables and returns a typed, frozen config object.
 * Throws on invalid input so the server fails at startup instead of mid-request.
 * The error names the bad variables but never echoes their values, which may be secrets.
 */
export function loadEnv(source = process.env) {
  const result = envSchema.safeParse(source)

  if (!result.success) {
    const problems = result.error.issues.map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
    throw new Error(`Invalid environment configuration:\n${problems.join('\n')}`)
  }

  return Object.freeze(result.data)
}
