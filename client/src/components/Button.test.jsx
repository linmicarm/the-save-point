import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import Button from './Button'

describe('Button', () => {
  it('renders its label and calls onClick', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    render(<Button onClick={onClick}>edit</Button>)
    await user.click(screen.getByRole('button', { name: 'edit' }))
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('does not fire onClick when disabled', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    render(<Button disabled onClick={onClick}>plant</Button>)
    await user.click(screen.getByRole('button', { name: 'plant' }))
    expect(onClick).not.toHaveBeenCalled()
  })

  it('is type="button" by default so it never submits a form', () => {
    render(<Button>go</Button>)
    expect(screen.getByRole('button', { name: 'go' })).toHaveAttribute('type', 'button')
  })

  it('renders a link when given `to`', () => {
    render(<MemoryRouter><Button to="/journal">all entries</Button></MemoryRouter>)
    expect(screen.getByRole('link', { name: 'all entries' })).toHaveAttribute('href', '/journal')
  })

  it('tints a primary button with the color prop', () => {
    render(<Button variant="primary" color="#93c5fd">begin</Button>)
    expect(screen.getByRole('button', { name: 'begin' }).style.background).toContain('rgb(147, 197, 253)')
  })

  it('makes full-width buttons stretch', () => {
    render(<Button full>wide</Button>)
    expect(screen.getByRole('button', { name: 'wide' }).className).toContain('w-full')
  })
})
