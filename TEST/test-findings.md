# TEST Suite Findings

Date: 2026-05-17

## Command Run

```bash
npx vitest run
```

## Latest Result

The configured `TEST/` suite currently has one failing domain test.

- Test files: 1 failed, 1 passed
- Tests: 100 passed, 1 failed
- Failure: `byeHistory — fairness over many rounds > distributes byes fairly over 20 rounds with 5 players`

## Findings

- `TEST/matcha-tests.ts` is an executable Vitest domain test suite covering match generation, validation rules, scoring, active-player exclusion, bye rotation, and state-integrity edge cases.
- `TEST/matcha-flow-tests.md` documents manual and acceptance flow scenarios for the app; it is not an executable Vitest test.
- The project has `vitest` installed, but `package.json` did not expose a `test` script before this report.
- The stable setup is to configure Vitest to include explicit `TEST/` globs. A broad `vitest run TEST` filter can also match unrelated `__tests__` paths outside the intended folder.
- The remaining test failure is in domain match generation, not in the mobile CTA layout work.

## Suggested Fix

The test command should remain a dedicated npm script backed by explicit Vitest includes:

```json
{
  "scripts": {
    "test": "vitest run"
  }
}
```

This would make the test command discoverable and allow CI or future agents to run the same suite with:

```bash
npm test
```

For the failing bye-fairness test, investigate `generateRound()` in `src/domain/matchGenerator.ts`. The likely fix is to make matchup selection prefer the candidate whose benched players currently have the fewest byes / highest play counts, instead of shuffling candidates before selection.

If the markdown flow scenarios are intended to be enforced automatically, the next improvement would be converting the highest-risk flows from `TEST/matcha-flow-tests.md` into browser-level tests.
