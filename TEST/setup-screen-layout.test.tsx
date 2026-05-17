import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { SetupScreenLayout } from '../src/components/SetupScreenLayout'

describe('SetupScreenLayout', () => {
  it('renders content separately from a bottom CTA footer', () => {
    const markup = renderToStaticMarkup(
      <SetupScreenLayout
        backButton={<button type="button">Back</button>}
        footer={<button type="button">Continue</button>}
      >
        <h1>Players</h1>
      </SetupScreenLayout>,
    )

    expect(markup).toContain('class="setup-screen"')
    expect(markup).toContain('class="setup-screen__content"')
    expect(markup).toContain('class="setup-screen__footer"')
    expect(markup.indexOf('Players')).toBeLessThan(markup.indexOf('Continue'))
  })
})
