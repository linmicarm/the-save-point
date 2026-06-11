import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import SectionHeader from './SectionHeader'

// SectionHeader uses <Link> which requires a Router context
const renderInRouter = ui => render(<MemoryRouter>{ui}</MemoryRouter>)

describe('SectionHeader', () => {
  it('renders the section label', () => {
    renderInRouter(
      <SectionHeader label="currently" accent="#c4b5fd" accentRgb="196, 181, 253" />
    )
    expect(screen.getByText('currently')).toBeInTheDocument()
  })

  it('does NOT render a "see all" link when linkTo is omitted', () => {
    renderInRouter(
      <SectionHeader label="mood arc" accent="#c4b5fd" accentRgb="196, 181, 253" />
    )
    expect(screen.queryByText(/see all/i)).not.toBeInTheDocument()
  })

  it('renders a "see all →" link when linkTo is provided', () => {
    renderInRouter(
      <SectionHeader
        label="journal"
        accent="#c4b5fd"
        accentRgb="196, 181, 253"
        linkTo="/journal"
      />
    )
    expect(screen.getByText(/see all/i)).toBeInTheDocument()
  })

  it('"see all" link points to the correct href', () => {
    renderInRouter(
      <SectionHeader
        label="places"
        accent="#c4b5fd"
        accentRgb="196, 181, 253"
        linkTo="/places"
      />
    )
    const link = screen.getByRole('link', { name: /see all/i })
    expect(link).toHaveAttribute('href', '/places')
  })
})
