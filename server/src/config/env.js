import { z } from 'zod'

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(5000),
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
