import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import SeasonBadge from './SeasonBadge'

const MOCK_SEASON = {
  id:    'season-1',
  name:  'quiet winter',
  emoji: '❄️',
  color: '#93c5fd',
}

// ─── null season ─────────────────────────────────────────────────

describe('SeasonBadge — no season', () => {
  it('renders nothing when season is null and user is not the owner', () => {
    const { container } = render(<SeasonBadge season={null} isOwn={false} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('renders a "start a season" prompt when season is null and isOwn=true', () => {
    render(<SeasonBadge season={null} isOwn={true} onClick={vi.fn()} />)
    expect(screen.getByText('start a season')).toBeInTheDocument()
  })

  it('calls onClick when the "start a season" button is clicked', async () => {
    const user = userEvent.setup()
    const handleClick = vi.fn()
    render(<SeasonBadge season={null} isOwn={true} onClick={handleClick} />)
    await user.click(screen.getByRole('button'))
    expect(handleClick).toHaveBeenCalledOnce()
  })
})

// ─── with season ─────────────────────────────────────────────────

describe('SeasonBadge — with season', () => {
  it('renders the season emoji and name', () => {
    render(<SeasonBadge season={MOCK_SEASON} />)
    expect(screen.getByText('quiet winter')).toBeInTheDocument()
    expect(screen.getByText('❄️')).toBeInTheDocument()
  })

  it('calls onClick when isOwn=true and badge is clicked', async () => {
    const user = userEvent.setup()
    const handleClick = vi.fn()
    render(<SeasonBadge season={MOCK_SEASON} isOwn={true} onClick={handleClick} />)
    await user.click(screen.getByRole('button'))
    expect(handleClick).toHaveBeenCalledOnce()
  })

  it('does NOT call onClick when isOwn=false (visitor view)', async () => {
    const user = userEvent.setup()
    const handleClick = vi.fn()
    render(<SeasonBadge season={MOCK_SEASON} isOwn={false} onClick={handleClick} />)
    // button still renders but has no onClick bound
    await user.click(screen.getByRole('button'))
    expect(handleClick).not.toHaveBeenCalled()
  })
})
