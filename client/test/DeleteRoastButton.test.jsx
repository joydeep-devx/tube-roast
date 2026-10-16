import { act, fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import DeleteRoastButton from '../src/components/roast/DeleteRoastButton.jsx'

const button = (name) => screen.getByRole('button', { name })

describe('DeleteRoastButton', () => {
  it('asks for confirmation and moves focus to the safe choice', () => {
    const onDelete = vi.fn()
    render(<DeleteRoastButton onDelete={onDelete} />)

    fireEvent.click(button('Delete'))

    expect(screen.getByRole('group', { name: 'Confirm delete' })).toBeTruthy()
    expect(document.activeElement).toBe(button('Cancel'))
    expect(onDelete).not.toHaveBeenCalled()
  })

  it('cancelling returns focus to the Delete button and deletes nothing', () => {
    const onDelete = vi.fn()
    render(<DeleteRoastButton onDelete={onDelete} />)

    fireEvent.click(button('Delete'))
    fireEvent.click(button('Cancel'))

    expect(document.activeElement).toBe(button('Delete'))
    expect(onDelete).not.toHaveBeenCalled()
  })

  it('deletes after confirming, showing progress while it runs', async () => {
    let finish
    const onDelete = vi.fn(() => new Promise((resolve) => (finish = resolve)))
    render(<DeleteRoastButton onDelete={onDelete} />)

    fireEvent.click(button('Delete'))
    fireEvent.click(button('Yes, delete'))

    expect(onDelete).toHaveBeenCalledOnce()
    expect(button('Deleting…').disabled).toBe(true)
    expect(button('Cancel').disabled).toBe(true)
    await act(async () => finish())
  })

  it('shows the error and refocuses Delete if deleting fails', async () => {
    render(<DeleteRoastButton onDelete={vi.fn(async () => Promise.reject(new Error('Roast not found')))} />)

    fireEvent.click(button('Delete'))
    await act(async () => fireEvent.click(button('Yes, delete')))

    expect(screen.getByRole('alert').textContent).toBe('Roast not found')
    expect(document.activeElement).toBe(button('Delete'))
  })
})
