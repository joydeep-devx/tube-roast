/**
 * The contract every LLM provider implements. Roast logic depends only on this shape,
 * so switching from NVIDIA to another provider means writing one new provider file.
 *
 * @typedef {object} CompletionRequest
 * @property {string} system      Instructions for the model.
 * @property {string} user        The request, including any data.
 * @property {object} schema      JSON Schema the reply must follow (providers use structured output when they can).
 * @property {number} maxTokens   Upper bound for the reply length.
 *
 * @typedef {object} CompletionResult
 * @property {string} text        The model's raw reply. Callers must still validate it.
 * @property {string} model       Model that produced it.
 * @property {boolean} truncated  True if the reply was cut off by the token limit.
 *
 * @typedef {object} LlmProvider
 * @property {string} model
 * @property {(request: CompletionRequest) => Promise<CompletionResult>} complete
 *   Rejects with an AppError whose code is ROAST_TIMEOUT, ROAST_BUSY or ROAST_UNAVAILABLE.
 */

export const LLM_ERROR_CODES = Object.freeze({
  TIMEOUT: 'ROAST_TIMEOUT',
  BUSY: 'ROAST_BUSY',
  UNAVAILABLE: 'ROAST_UNAVAILABLE',
})
