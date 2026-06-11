import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import DeleteButton from './DeleteButton'

// ─── initial render ──────────────────────────────────────────────

describe('DeleteButton — initial state', () => {
  it('renders with the default "delete" label', () => {
    render(<DeleteButton onDelete={vi.fn()} />)
    expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument()
  })

  it('renders with a custom label when provided', () => {
    render(<DeleteButton onDelete={vi.fn()} label="remove" />)
    expect(screen.getByRole('button', { name: /remove/i })).toBeInTheDocument()
  })

  it('does not show the confirmation UI initially', () => {
    render(<DeleteButton onDelete={vi.fn()} />)
    expect(screen.queryByText('sure?')).not.toBeInTheDocument()
  })
})

// ─── confirmation flow ───────────────────────────────────────────

describe('DeleteButton — confirmation flow', () => {
  it('shows "sure?" + yes/no after the first click', async () => {
    const user = userEvent.setup()
    render(<DeleteButton onDelete={vi.fn()} />)
    await user.click(screen.getByRole('button', { name: /delete/i }))
    expect(screen.getByText('sure?')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /yes/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /no/i })).toBeInTheDocument()
  })

  it('calls onDelete when "yes" is clicked', async () => {
    const user = userEvent.setup()
    const onDelete = vi.fn()
    render(<DeleteButton onDelete={onDelete} />)
    await user.click(screen.getByRole('button', { name: /delete/i }))
    await user.click(screen.getByRole('button', { name: /yes/i }))
    expect(onDelete).toHaveBeenCalledOnce()
  })

  it('does NOT call onDelete when "no" is clicked', async () => {
    const user = userEvent.setup()
    const onDelete = vi.fn()
    render(<DeleteButton onDelete={onDelete} />)
    await user.click(screen.getByRole('button', { name: /delete/i }))
    await user.click(screen.getByRole('button', { name: /no/i }))
    expect(onDelete).not.toHaveBeenCalled()
  })

  it('resets back to initial state after "no" is clicked', async () => {
    const user = userEvent.setup()
    render(<DeleteButton onDelete={vi.fn()} />)
    await user.click(screen.getByRole('button', { name: /delete/i }))
    await user.click(screen.getByRole('button', { name: /no/i }))
    expect(screen.queryByText('sure?')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument()
  })
})

// ─── error paths ─────────────────────────────────────────────────

describe('DeleteButton — edge cases', () => {
  it('renders without crashing when onDelete is undefined', () => {
    // Safeguards against missing prop — should not throw on render
    expect(() => render(<DeleteButton />)).not.toThrow()
  })

  it('does not crash when "yes" clicked with no onDelete prop', async () => {
    const user = userEvent.setup()
    render(<DeleteButton />)
    await user.click(screen.getByRole('button', { name: /delete/i }))
    // Clicking "yes" when onDelete is undefined should not throw
    await expect(
      user.click(screen.getByRole('button', { name: /yes/i }))
    ).resolves.not.toThrow()
  })
})
