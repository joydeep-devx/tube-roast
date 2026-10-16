import { useEffect, useRef, useState } from 'react'
import { secondaryButtonClass } from './buttonStyles.js'

/**
 * Two-step delete: "Delete" → "Delete this roast? [Yes, delete] [Cancel]".
 * Accessible without window.confirm: focus moves to Cancel (the safe choice), and back to Delete
 * after cancelling, so keyboard users never lose their place.
 */
function DeleteRoastButton({ onDelete, label = 'Delete' }) {
  const [step, setStep] = useState('idle') // 'idle' | 'confirming' | 'deleting'
  const [errorMessage, setErrorMessage] = useState(null)
  const cancelRef = useRef(null)
  const deleteRef = useRef(null)
  const returnFocusRef = useRef(false)

  useEffect(() => {
    if (step === 'confirming') {
      cancelRef.current?.focus()
    } else if (step === 'idle' && returnFocusRef.current) {
      returnFocusRef.current = false
      deleteRef.current?.focus()
    }
  }, [step])

  function cancel() {
    returnFocusRef.current = true
    setStep('idle')
  }

  async function confirmDelete() {
    setStep('deleting')
    setErrorMessage(null)
    try {
      await onDelete()
    } catch (error) {
      setErrorMessage(error.message)
      returnFocusRef.current = true
      setStep('idle')
    }
  }

  if (step === 'idle') {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <button
          ref={deleteRef}
          type="button"
          onClick={() => setStep('confirming')}
          className={`${secondaryButtonClass} text-muted hover:text-accent`}
        >
          {label}
        </button>
        {errorMessage && (
          <span role="alert" className="text-sm text-accent">
            {errorMessage}
          </span>
        )}
      </div>
    )
  }

  return (
    <div role="group" aria-label="Confirm delete" className="flex flex-wrap items-center gap-2">
      <span className="text-sm">Delete this roast?</span>
      <button
        type="button"
        onClick={confirmDelete}
        disabled={step === 'deleting'}
        className="rounded-full bg-accent-strong px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent-hover disabled:opacity-60"
      >
        {step === 'deleting' ? 'Deleting…' : 'Yes, delete'}
      </button>
      <button
        ref={cancelRef}
        type="button"
        onClick={cancel}
        disabled={step === 'deleting'}
        className={secondaryButtonClass}
      >
        Cancel
      </button>
    </div>
  )
}

export default DeleteRoastButton
