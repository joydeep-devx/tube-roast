import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

// Unmount rendered components and undo mocks after every test, so tests can't affect each other.
afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
  window.history.replaceState(null, '', '/')
})
