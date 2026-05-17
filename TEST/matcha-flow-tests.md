# Matcha — Flow Test Scenarios

> Manual + automated flow tests for each match type.
> Each flow is a complete session from Home to End Game.
> Use these as acceptance criteria — if a flow breaks anywhere, the build is not done.

---

## How to Read These Flows

- **Step** — what the user does
- **Screen** — which screen/route is active
- **Expected State** — what the app must show or do
- **Assert** — what Claude Code's test must verify

---

## FLOW A — Singles
### 4 players · 1 court · Winning point 11

**Personas:** Hafiz, Razak, Jojo, Khairi

---

### A-0 · Home

| | |
|---|---|
| **Step** | Open app (no existing session) |
| **Screen** | `/` |
| **Expected State** | Shows "Matcha", tagline, one button: `Generate Matches` |
| **Assert** | `Resume Session` button is NOT visible. `New Session` ghost is NOT visible. |

---

### A-1 · Match Type

| | |
|---|---|
| **Step** | Tap `Generate Matches` |
| **Screen** | `/setup/match-type` |
| **Expected State** | Three cards: Singles, Fixed Doubles, Random Doubles. `Players →` button is disabled. |
| **Assert** | CTA disabled before selection. |

| | |
|---|---|
| **Step** | Tap **Singles** card |
| **Expected State** | Singles card gets active left border. `Players →` becomes enabled. |
| **Assert** | Only Singles is selected. Other cards are unselected. |

---

### A-2 · Players

| | |
|---|---|
| **Step** | Tap `Players →` |
| **Screen** | `/setup/players` |
| **Expected State** | Empty player list. Input focused. `Winning Point →` is disabled. |

| | |
|---|---|
| **Step** | Type `Hafiz`, press Enter |
| **Expected State** | List shows: `1. Hafiz ×`. Input clears. |
| **Assert** | Player count = 1. CTA still disabled (min 2 for singles). |

| | |
|---|---|
| **Step** | Type `Razak`, press Enter |
| **Expected State** | List shows: `1. Hafiz ×`, `2. Razak ×`. |
| **Assert** | Player count = 2. CTA now **enabled**. |

| | |
|---|---|
| **Step** | Type `Jojo`, press Enter |
| **Step** | Type `Khairi`, press Enter |
| **Expected State** | List: `1. Hafiz`, `2. Razak`, `3. Jojo`, `4. Khairi` |
| **Assert** | Player count = 4. No pairing prompt shown (Singles only). |

| | |
|---|---|
| **Step** | Type `Hafiz`, press Enter |
| **Expected State** | Input clears. Inline error: `Name already added.` Player list unchanged. |
| **Assert** | Duplicate rejected. Player count still = 4. |

---

### A-3 · Winning Point

| | |
|---|---|
| **Step** | Tap `Winning Point →` |
| **Screen** | `/setup/winning-point` |
| **Expected State** | Buttons: `7` `11` `15` `21` `···`. `Court →` is disabled. |

| | |
|---|---|
| **Step** | Tap `11` |
| **Expected State** | `11` is selected (active state). `Court →` becomes enabled. |
| **Assert** | winningPoint = 11. |

---

### A-4 · Court

| | |
|---|---|
| **Step** | Tap `Court →` |
| **Screen** | `/setup/court` |
| **Expected State** | Empty court list. Input focused. `Generate Match` button is disabled. |

| | |
|---|---|
| **Step** | Type `Main Court`, press Enter |
| **Expected State** | List: `1. Main Court ×`. `Generate Match` becomes enabled. |
| **Assert** | Court count = 1. |

---

### A-5 · Match (Round 1)

| | |
|---|---|
| **Step** | Tap `Generate Match` |
| **Screen** | `/match` |
| **Expected State** | Match tab active. 1 court card (dark). 1 match assigned. 2 players benched. |
| **Assert** | Match has exactly 2 players (team1[0] vs team2[0]). Benched list has 2 players. Court status = occupied. Available court count = 0. |

**Example generated state:**
```
Court: Main Court
Match 1
Hafiz vs Razak

Benched: Jojo, Khairi
```

---

### A-6 · Add Score (Match 1)

| | |
|---|---|
| **Step** | Tap `+ Add Score` on Match 1 |
| **Screen** | `/match/score/:matchId/winner` |
| **Expected State** | Title: `Select Winner`. Two cards: `Hafiz` | `Razak`. `Insert Score →` disabled. |

| | |
|---|---|
| **Step** | Tap `Hafiz` card |
| **Expected State** | Hafiz card selected (accent border). `Insert Score →` enabled. |
| **Assert** | winnerId = Hafiz's player id. |

| | |
|---|---|
| **Step** | Tap `Insert Score →` |
| **Screen** | `/match/score/:matchId/score` |
| **Expected State** | Title: `Insert Score`. Winning team shown bold: `Hafiz`. Score input empty. |

| | |
|---|---|
| **Step** | Type `11` in score input |
| **Step** | Tap `Submit` |
| **Screen** | `/match` |
| **Expected State** | Match 1 card now shows score. Court card updates. History tab has 1 entry. |
| **Assert** | match.status = `completed`. match.score.winnerId = [hafizId]. Court status = `empty`. |

---

### A-7 · Generate Next Match (Round 2)

| | |
|---|---|
| **Step** | Court card now shows `+ Generate Match` (dashed) |
| **Step** | Tap `+ Generate Match` |
| **Expected State** | New match generated for remaining players (Jojo vs Khairi). Card goes dark. |
| **Assert** | No repeated matchup from Round 1. Benched list updates accordingly. |

---

### A-8 · History Tab

| | |
|---|---|
| **Step** | Tap `History` tab |
| **Screen** | `/match?tab=history` |
| **Expected State** | 1 completed match card. Shows `Hafiz` in bold (winner). Score `11 – ?` visible. |
| **Assert** | Completed match count = 1. Winner name bolded. |

---

### A-9 · End Game

| | |
|---|---|
| **Step** | Tap `History` → tap `Match` tab → tap `End Game` |
| **Screen** | `/` |
| **Expected State** | Home screen. Session cleared. Only `Generate Matches` visible. |
| **Assert** | localStorage key `matcha:session` is null or removed. |

---
---

## FLOW B — Fixed Doubles
### 6 players · 2 courts · Winning point 15

**Personas:** Rosberg + Michael (pair 1), Noni + Remy (pair 2), Jojo + Razak (pair 3)

---

### B-0 · Home → Match Type

| | |
|---|---|
| **Step** | Tap `Generate Matches` → tap **Fixed Doubles** |
| **Assert** | Only Fixed Doubles card is selected. CTA enabled. |

---

### B-1 · Players — Adding

| | |
|---|---|
| **Step** | Add players one by one: `Rosberg`, `Michael`, `Noni`, `Remy`, `Jojo`, `Razak` |
| **Expected State** | List of 6. No pairing prompt yet. CTA enabled (≥ 4, even count). |
| **Assert** | Player count = 6. Even = valid. CTA enabled. |

| | |
|---|---|
| **Step** | Add a 7th player: `Khairi` |
| **Expected State** | Player count = 7. CTA **disabled**. |
| **Assert** | Odd count for Fixed Doubles = invalid. CTA disabled with message: `Fixed doubles requires an even number of players.` |

| | |
|---|---|
| **Step** | Remove `Khairi` via `×` |
| **Expected State** | Player count = 6. CTA re-enabled. |

---

### B-2 · Players — Pairing

| | |
|---|---|
| **Step** | Tap `Winning Point →` |
| **Expected State** | Pairing prompt appears before proceeding. Shows all 6 players to be paired. |
| **Assert** | Pairing step is shown for Fixed Doubles and ONLY for Fixed Doubles. |

| | |
|---|---|
| **Step** | Pair: Rosberg ↔ Michael, Noni ↔ Remy, Jojo ↔ Razak |
| **Expected State** | 3 pairs confirmed. Proceed to Winning Point. |
| **Assert** | Each player belongs to exactly one pair. No player paired with themselves. |

---

### B-3 · Winning Point

| | |
|---|---|
| **Step** | Tap `15` |
| **Assert** | winningPoint = 15. CTA enabled. |

---

### B-4 · Courts

| | |
|---|---|
| **Step** | Add `VIP Court 1`, `VIP Court 2` |
| **Assert** | Court count = 2. Both unique. CTA enabled. |

| | |
|---|---|
| **Step** | Try adding `VIP Court 1` again |
| **Expected State** | Inline error: `Court already added.` Court list unchanged. |

---

### B-5 · Match (Round 1)

| | |
|---|---|
| **Step** | Tap `Generate Match` |
| **Screen** | `/match` |
| **Expected State** | Dark court cards with matches. Benched = 1 full pair. |
| **Assert** | Each match team = a fixed pair. Partners are NEVER split. Benched = whole pair only. |

**Example:**
```
VIP Court 1 — Match 1
Rosberg & Michael  vs  Noni & Remy

Benched: Jojo, Razak
```

---

### B-6 · Score — Both Courts

| | |
|---|---|
| **Step** | Tap `+ Add Score` on Match 1 → Select winner → Enter score `15` → Submit |
| **Assert** | Match 1 completed. Winners are the full pair. Court 1 now empty. |

---

### B-7 · Round 2 — Partners Preserved

| | |
|---|---|
| **Step** | Tap `+ Generate Match` on an empty court |
| **Assert** | Rosberg always with Michael. Noni always with Remy. Jojo always with Razak. No exceptions across all rounds. |

---

### B-8 · End Game

| | |
|---|---|
| **Step** | Tap `End Game` |
| **Assert** | Session cleared. Home shows only `Generate Matches`. |

---
---

## FLOW C — Random Doubles (Even Players)
### 6 players · 1 court · Winning point 21

**Personas:** Chong Wei, Johan, Jojo, Khairi, Misbun, Razak

---

### C-1 · Setup

| | |
|---|---|
| **Step** | Match Type → Random Doubles → add 6 players → Winning Point 21 → add `Court A` |
| **Assert** | No pairing step shown. CTA enabled at 4+ players. |

---

### C-2 · Round 1

| | |
|---|---|
| **Step** | Tap `Generate Match` |
| **Expected State** | 1 dark card on Court A. 4 players in match. 2 players benched. |
| **Assert** | team1 and team2 are disjoint. Benched count = 2. matchKey stored in usedMatchups. |

---

### C-3 · Round 2 — No Repeat

| | |
|---|---|
| **Step** | Complete Match 1. Tap `+ Generate Match`. |
| **Assert** | getMatchKey(round2.team1, round2.team2) ≠ getMatchKey(round1.team1, round1.team2). |

---

### C-4 · Round 3 — Rotation

| | |
|---|---|
| **Step** | Complete Match 2. Tap `+ Generate Match`. |
| **Assert** | Third unique matchup. Previously benched players prioritised to play. |

---
---

## FLOW D — Random Doubles (Odd Players)
### 5 players · 1 court · Winning point 7

**Personas:** Hafiz, Razak, Jojo, Khairi, Misbun

> This is the critical flow. Odd players with random doubles must be explicitly tested.

---

### D-1 · Setup — Odd Count Accepted

| | |
|---|---|
| **Step** | Match Type → Random Doubles → add 5 players → Winning Point 7 → add `Court B` |
| **Assert** | 5 players accepted with NO error. CTA enabled. No warning shown. This is valid for random doubles. |

---

### D-2 · Round 1 — Exactly One Benched

| | |
|---|---|
| **Step** | Tap `Generate Match` |
| **Expected State** | 1 match. 4 players playing. **Exactly 1 player benched**. |
| **Assert** | Benched list has exactly 1 player. Match has 4 unique players. The benched player does NOT appear in team1 or team2. |

**Example:**
```
Court B — Match 1
Hafiz & Razak  vs  Jojo & Khairi

Benched: Misbun
```

---

### D-3 · Round 1 — Benched Player Not in Active Match

| | |
|---|---|
| **Context** | Direct test of the ghost player bug. |
| **Assert** | The player in Benched does NOT appear in any active match card on the same screen. |
| **Assert** | `Set(activePlayers).intersection(Set(benchedPlayers)).size === 0` |

---

### D-4 · Round 1 — Playing Player Not in Benched

| | |
|---|---|
| **Context** | Inverse of D-3. |
| **Assert** | Every player in team1 + team2 is absent from the benched list. |
| **Assert** | playing (4) + benched (1) = 5 = total players. No player unaccounted. No player double-counted. |

---

### D-5 · Round 2 — Bye Rotation

| | |
|---|---|
| **Step** | Complete Match 1. Tap `+ Generate Match`. |
| **Assert** | Round 2 benched player ≠ Round 1 benched player. Misbun (sat out R1) now plays. |

**Example:**
```
Court B — Match 2
Misbun & Jojo  vs  Hafiz & Khairi

Benched: Razak
```

---

### D-6 · Round 2 — Player Integrity Check

| | |
|---|---|
| **Assert** | Same rules as D-3 and D-4 apply. Benched and playing lists are mutually exclusive. Total = 5. |

---

### D-7 · Round 3 — Continued Rotation

| | |
|---|---|
| **Step** | Complete Match 2. Tap `+ Generate Match`. |
| **Assert** | Third unique matchup. Player who sat out most recently is lowest priority to bench again. |
| **Assert** | Integrity check: no player in both lists. playing + benched = 5. |

---

### D-8 · Bye Fairness — 5 Rounds Check

| | |
|---|---|
| **Test** | Run 5 consecutive rounds with 5 players, 1 court. |
| **Assert** | No single player benched more than 2 times while another benches 0 times across 5 rounds. |
| **Assert** | Every round: playing (4) + benched (1) = 5. No exceptions. |

---

### D-9 · Exhausted Matchups — Graceful Reset

| | |
|---|---|
| **Step** | Continue generating until all unique matchups are used. |
| **Assert** | App does not crash. Either: (a) resets usedMatchups and starts fresh, or (b) shows: `All matchups played. Starting fresh.` |

---

### D-10 · Generate Match on Empty Court — Available Players Only

| | |
|---|---|
| **Step** | With Match 1 still active (not completed), tap `+ Generate Match` on an empty court. |
| **Assert** | Players in the active Match 1 are NOT pulled into the new match. |
| **Assert** | If benched player count < 4, `+ Generate Match` is disabled or shows: `Not enough available players.` |

---
---

## FLOW E — Core Edge Cases

### E-1 · Page Refresh Mid-Session

| | |
|---|---|
| **Step** | Generate Round 1. Do not complete any match. Hard refresh. |
| **Assert** | Session restored from localStorage. All courts, players, matches exactly as before. No data lost. |

---

### E-2 · Resume Session from Home

| | |
|---|---|
| **Step** | Start session, generate match, close tab. Reopen. |
| **Assert** | Home shows `Resume Session` and `New Session`. Tapping Resume → `/match` fully restored. Tapping New Session → clears session, fresh setup. |

---

### E-3 · More Courts Than Possible Matches

| | |
|---|---|
| **Setup** | Random Doubles · 4 players · 3 courts |
| **Assert** | 1 court occupied. 2 courts empty (dashed). `+ Generate Match` on empty courts disabled — no available players. |

---

### E-4 · All Courts Occupied

| | |
|---|---|
| **Setup** | 2 courts. Both active. |
| **Assert** | No `+ Generate Match` visible. Indicator shows: `Waiting for a court to free up.` |

---

### E-5 · Winning Point — Custom Value

| | |
|---|---|
| **Step** | Tap `···` → type `0` | Rejected: `Enter a value of 1 or more.` |
| **Step** | Type `-5` | Rejected: same error. |
| **Step** | Type `30` | Accepted. winningPoint = 30. |

---

### E-6 · End Match (No Score)

| | |
|---|---|
| **Step** | On Select Winner, tap `End Match` without selecting a winner |
| **Assert** | Match ends. No score object. Court freed. History shows match with no score. Abandoned match NOT in active list. |

---
---

## FLOW F — Score Input Validation

> All tests on the Insert Score screen. Session winning point = 21 unless stated.

---

### F-1 · Negative Score

| | |
|---|---|
| **Step** | Type `-1` | Rejected. Error: `Score must be a positive number.` Submit disabled. |
| **Step** | Type `-99` | Same rejection. |

---

### F-2 · Alphabetic Input

| | |
|---|---|
| **Step** | Type `abc` | Rejected or not entered. Error: `Score must be a number.` |
| **Step** | Type `12abc` (mixed) | Rejected or stripped to `12`. Stored value must be a clean integer. |
| **Step** | Type `twelve` | Rejected. No partial acceptance. |

---

### F-3 · Score Exceeds Winning Point

| | |
|---|---|
| **Step** | Type `22` (winning point = 21) | Rejected. Error: `Score cannot exceed the winning point (21).` |
| **Step** | Type `100` | Same rejection. |
| **Step** | Type `21` | Accepted. Exact winning point is valid. |
| **Step** | Type `15` | Accepted. Scores below winning point are valid. |

---

### F-4 · Score is Zero

| | |
|---|---|
| **Step** | Type `0` | Rejected. Error: `Score must be at least 1.` |

---

### F-5 · Decimal Score

| | |
|---|---|
| **Step** | Type `7.5` | Rejected. Error: `Score must be a whole number.` |
| **Step** | Type `7.0` | Rejected or coerced to `7`. If coerced, stored value must be integer 7, not float. |

---

### F-6 · Whitespace-Only Input

| | |
|---|---|
| **Step** | Type `   ` (spaces only), tap Submit | Rejected. Treated as empty. Submit disabled. |

---

### F-7 · Score Pasted from Clipboard

| | |
|---|---|
| **Step** | Paste `-5` into score input | Same validation as typed. Paste does not bypass validation. |
| **Step** | Paste `abc` | Rejected or cleared. |

---
---

## FLOW G — Player Integrity

> Targets the specific bug where a player appears in more than one list simultaneously.

---

### G-1 · No Playing Player in Benched List

| | |
|---|---|
| **Setup** | Any match type. Generate a round. |
| **Assert** | None of the players in team1 or team2 of any active match appear in the Benched section. |
| **Assert** | `Set(activePlayers).intersection(Set(benchedPlayers)).size === 0` |

---

### G-2 · No Benched Player in Active Match

| | |
|---|---|
| **Assert** | Every player in the Benched section is absent from all active match cards. |
| **Assert** | Benched list shows only players with status `benched`. Playing list shows only players with status `playing`. |

---

### G-3 · Player Integrity on Generate Match Screen

| | |
|---|---|
| **Assert** | Each player appears in exactly one match on the Generate Match screen. |
| **Assert** | No player in two different match cards on the same screen. |
| **Assert** | No player appears twice within the same match card. |

---

### G-4 · Player Integrity After Score Submission

| | |
|---|---|
| **Step** | Complete a match. Return to `/match`. |
| **Assert** | Players from completed match are no longer in any active match card. |
| **Assert** | Court that hosted the completed match shows empty. No ghost players remain. |
| **Assert** | Completed players available for next generated match. |

---

### G-5 · Player Count Invariant — Every Round

| | |
|---|---|
| **Rule** | `playing + benched = total players`. Must hold after every state change. |
| **Step** | Check after: session start, match generated, score submitted, match ended, page refresh. |
| **Assert** | `matches.flatMap(m => [...m.team1, ...m.team2]).length + benched.length === session.players.length` |

---

### G-6 · Multi-Court Player Isolation

| | |
|---|---|
| **Setup** | Random Doubles · 8 players · 2 courts |
| **Assert** | Court 1 players and Court 2 players are completely disjoint. No player on both courts. Total playing = 8. Benched = 0. Sum = 8. |

---
---

## FLOW H — Additional Edge Cases

---

### H-1 · Rapid Tap — Double Generate

| | |
|---|---|
| **Step** | Tap `Generate Match` or `+ Generate Match` twice rapidly |
| **Assert** | Only one match generated. No duplicate cards. No duplicate player assignments. |

---

### H-2 · Back Navigation — State Preserved

| | |
|---|---|
| **Step** | Add 4 players → `Winning Point →` → `← Players` |
| **Assert** | All 4 players still listed. No data lost. |

| | |
|---|---|
| **Step** | Select winning point 15 → `← Players` → `Winning Point →` again |
| **Assert** | Winning point 15 still selected. State persists across back/forward. |

---

### H-3 · Remove Player Mid-List — Renumbering

| | |
|---|---|
| **Step** | Add Hafiz (1), Razak (2), Jojo (3), Khairi (4). Remove Razak. |
| **Assert** | List renumbers: Hafiz (1), Jojo (2), Khairi (3). Sequential, no gaps. IDs of remaining players unchanged. |

---

### H-4 · Player Name — Whitespace Trimming

| | |
|---|---|
| **Step** | Type `  Hafiz  ` (leading/trailing spaces), press Enter |
| **Assert** | Stored as `Hafiz`. Then type `Hafiz` again → rejected as duplicate. |

---

### H-5 · Player Name — Special Characters

| | |
|---|---|
| **Step** | `Chong Wei` (space in name) | Accepted. |
| **Step** | `O'Brien` (apostrophe) | Accepted. |
| **Step** | `<script>alert(1)</script>` | Accepted as string, rendered safely. Never executed as code. XSS not possible. |

---

### H-6 · Maximum Players — 16th Accepted, 17th Rejected

| | |
|---|---|
| **Step** | Add 16 players | All accepted. Input disabled or shows: `Maximum of 16 players reached.` |
| **Step** | Attempt 17th | Rejected. List stays at 16. |

---

### H-7 · Maximum Courts — 8th Accepted, 9th Rejected

| | |
|---|---|
| **Step** | Add 8 courts | All accepted. Input disabled or shows: `Maximum of 8 courts reached.` |
| **Step** | Attempt 9th | Rejected. List stays at 8. |

---

### H-8 · Corrupted localStorage — Graceful Recovery

| | |
|---|---|
| **Step** | Set `matcha:session` to `"corrupted_garbage"` manually. Open app. |
| **Assert** | App does not crash. Invalid data discarded silently. Home shows `Generate Matches` only. |

---

### H-9 · Direct URL Access — No Session

| | |
|---|---|
| **Step** | Navigate directly to `/match` with no session |
| **Assert** | Redirected to `/`. Broken match screen never shown. |

| | |
|---|---|
| **Step** | Navigate directly to `/setup/players` with no session |
| **Assert** | Redirected to `/` or `/setup/match-type`. Setup always starts from the beginning. |

---

### H-10 · Winning Point — Switch Between Preset and Custom

| | |
|---|---|
| **Step** | Tap `21`. Then tap `···` and type `30`. | winningPoint = 30. Preset `21` deselected. |
| **Step** | Tap preset `7`. | winningPoint = 7. Custom input cleared. Preset wins. |

---

### H-11 · Select Winner — Switching Selection

| | |
|---|---|
| **Step** | Tap Team 1. Then tap Team 2. |
| **Assert** | Team 2 selected. Team 1 deselected. Only one team selectable at a time. `Insert Score →` remains enabled. |

---

### H-12 · History Filter — No Results

| | |
|---|---|
| **Step** | Open History. Tap Filter. Uncheck all players. Tap `Filter`. |
| **Assert** | Shows empty state: `No matches found.` No crash. |

---

### H-13 · End Game With Active Match

| | |
|---|---|
| **Step** | Generate match. Do not complete it. Tap `End Game`. |
| **Assert** | Game ends. Active match abandoned. Session cleared. History shows only completed matches. Abandoned match NOT in history. |

---

### H-14 · Random Doubles — Minimum Valid Odd Count (5 players)

| | |
|---|---|
| **Assert** | 5 players → CTA enabled, no error. After generating: 4 playing, 1 benched. App maximises players on court — never 3 playing with 2 benched when 4 can play. |

---

### H-15 · Random Doubles — Large Odd Count (9 players, 2 courts)

| | |
|---|---|
| **Setup** | 9 players · 2 courts · Random Doubles |
| **Assert** | Both courts filled (8 playing). 1 benched. No player on both courts. Integrity check passes. |

---

### H-16 · Court Name — Whitespace Only

| | |
|---|---|
| **Step** | Type `   ` (spaces only) as court name, press Enter |
| **Assert** | Rejected. Error: `Court name cannot be empty.` |

---

### H-17 · Changing Match Type Clears Player Pairs

| | |
|---|---|
| **Step** | Select Fixed Doubles. Add 4 players. Pair them. Go back. Select Random Doubles. Re-enter Players. |
| **Assert** | No pairing step shown. Previous pair data cleared. Players treated as individuals. |

---

### H-18 · Score Submitted — Winning Point Boundary

| | |
|---|---|
| **Context** | Winning point = 7. |
| **Step** | Type `7` | Accepted. |
| **Step** | Type `8` | Rejected. `Score cannot exceed the winning point (7).` |
| **Step** | Type `6` | Accepted. Match can end at any valid score. |

---

### H-19 · Two Matches Complete Simultaneously (2 courts)

| | |
|---|---|
| **Setup** | 2 courts, both active. Submit score on Court 1. |
| **Assert** | Court 1 freed. Court 2 still active and unchanged. No state bleed between courts. |
| **Assert** | Players from Court 1 match now available. Players from Court 2 match still playing. |

---

### H-20 · Random Doubles — 4 Players, 1 Court (Minimum Valid)

| | |
|---|---|
| **Setup** | 4 players · 1 court · Random Doubles |
| **Assert** | All 4 play. Benched = 0. No one sits out. |
| **Assert** | With only 3 unique matchups possible, app exhausts them and resets or notifies cleanly. |

---
---

## FLOW I — State Integrity (Reducer & Domain Gaps)

> These tests target specific gaps found in the source code: `ASSIGN_MATCH` vs `GENERATE_NEXT_MATCH` divergence, `getMatchOptions` using `activeIds` not player `.status`, `byeHistory` growth, `getUsedMatchups` including active matches, match type change wiping players, fixed doubles partner removal, and `canGenerateOnCourt` benched count guard.

---

### I-1 · ASSIGN_MATCH Rejects a Currently Playing Player

| | |
|---|---|
| **Context** | `ASSIGN_MATCH` is dispatched from the GenerateMatch screen. It checks `playingIds` derived from matches with `status === 'playing'`, not from player `.status`. These two can diverge if state is stale. |
| **Step** | Attempt to assign a match where one of the proposed players is already in an active match on another court. |
| **Assert** | `ASSIGN_MATCH` reducer returns state unchanged. The player is not assigned to two courts. |
| **Assert** | The guard `matchPlayerIds.some(id => playingIds.has(id))` catches the conflict and silently rejects. |
| **Assert** | No match is added to `session.matches`. No court status changes. |

---

### I-2 · getMatchOptions Excludes Active Player IDs

| | |
|---|---|
| **Context** | `getMatchOptions` filters by `activePlayerIds` (a Set derived from playing matches), not by player `.status`. This is the correct source of truth for the GenerateMatch screen. |
| **Step** | Set 4 players as `status: 'playing'` in the session. Pass their IDs as `activePlayerIds` to `getMatchOptions`. |
| **Assert** | No returned option includes any player from `activePlayerIds`. |
| **Assert** | If `activeIds` contains all players, `getMatchOptions` returns an empty array. |

| | |
|---|---|
| **Step** | Set same 4 players as `status: 'playing'` but pass an **empty** `activeIds` Set. |
| **Assert** | Options ARE returned — confirming the function uses `activeIds`, not player `.status`. This is the known gap. The caller is responsible for passing the correct `activeIds`. |

---

### I-3 · byeHistory Rotation Stays Fair After Many Rounds

| | |
|---|---|
| **Context** | `byeHistory` is an append-only array of player IDs who have sat out. It grows every round and is never trimmed. Bye fairness depends on reading this history correctly over time. |
| **Test** | Run 20 consecutive rounds with 5 players, 1 court (odd player count). |
| **Assert** | No single player has been benched more than any other player by a margin greater than 1. |
| **Assert** | The function does not slow down, throw, or produce incorrect results as `byeHistory` grows to 20+ entries. |
| **Assert** | `byeHistory.length` after 20 rounds = 20 (one entry per round). |

---

### I-4 · Active Match Already in usedMatchups

| | |
|---|---|
| **Context** | `getUsedMatchups` includes matches with `status === 'playing'` AND `status === 'completed'`. This means an in-progress match on Court 1 is already in `usedMatchups` when generating for Court 2. |
| **Step** | Start a session. Court 1 has an active match: Hafiz & Razak vs Jojo & Khairi. |
| **Step** | Generate a match for Court 2 from the same session. |
| **Assert** | The generated Court 2 match does NOT use the same matchup as Court 1 (already in `usedMatchups`). |
| **Assert** | The two courts never host the exact same matchup simultaneously. |

---

### I-5 · Changing Match Type Clears All Players

| | |
|---|---|
| **Context** | `SET_MATCH_TYPE` reducer resets `players: []`. This is intentional — player counts and pairing rules differ per type. |
| **Step** | Add 4 players under Singles. Go back to Match Type. Select Random Doubles. |
| **Assert** | Player list is empty. Previous 4 players are gone. |
| **Assert** | Session `matchType` = `random-doubles`. `players.length` = 0. |

| | |
|---|---|
| **Step** | Add 4 players under Fixed Doubles (with pairs set). Go back. Select Singles. |
| **Assert** | Player list empty. All `partnerId` references cleared. No orphaned partner data. |

---

### I-6 · REMOVE_PLAYER Clears Partner Reference (Fixed Doubles)

| | |
|---|---|
| **Context** | When a player is removed, their partner's `partnerId` must be cleared. Otherwise the remaining player holds a reference to a non-existent player ID. |
| **Step** | Fixed Doubles. Add Hafiz and Razak. Pair them (Hafiz.partnerId = Razak.id, Razak.partnerId = Hafiz.id). Remove Hafiz. |
| **Assert** | Razak's `partnerId` is `undefined`. No dangling reference to Hafiz's ID. |
| **Assert** | Player list contains only Razak. Razak is unpaired and available to be re-paired. |

| | |
|---|---|
| **Step** | Remove Razak as well. |
| **Assert** | Player list is empty. No errors. |

---

### I-7 · canGenerateOnCourt Blocks When All Players Are Playing

| | |
|---|---|
| **Context** | `canGenerateOnCourt` checks `benchedCount < min`. If all players are currently `status: 'playing'`, benched count = 0, which is < 2 (singles) or < 4 (doubles). Generation must be blocked. |
| **Setup** | 4 players · 1 court · Random Doubles. Generate the first match (all 4 playing, 0 benched). Court completes. New empty court available. |
| **Step** | Attempt `canGenerateOnCourt` before any match completes. |
| **Assert** | Returns `{ valid: false, message: 'Need at least 4 benched players for a doubles match.' }` |
| **Assert** | `+ Generate Match` button on the empty court is disabled or hidden. |

| | |
|---|---|
| **Step** | Complete the active match (players return to `benched`). Attempt `canGenerateOnCourt` again. |
| **Assert** | Returns `{ valid: true }`. Generation proceeds. |

---
---

## Summary — Flows at a Glance

| Flow | Type | Players | Courts | Winning Pt | Key Test |
|---|---|---|---|---|---|
| A | Singles | 4 (even) | 1 | 11 | 1v1, benched rotation, score |
| B | Fixed Doubles | 6 (even) | 2 | 15 | Partner pairs never split |
| C | Random Doubles | 6 (even) | 1 | 21 | No repeated matchups |
| D | Random Doubles | 5 (**odd**) | 1 | 7 | Bye fairness, player integrity |
| E | All | Various | Various | Various | Session restore, court states |
| F | All | — | — | Various | Score input — all invalid inputs |
| G | All | Various | Various | — | Player integrity — no ghost players |
| H | All | Various | Various | Various | 20 additional edge cases |
| I | All | Various | Various | — | Reducer & domain gaps from code review |

---

## The Invariants — Must Hold at All Times

These apply to every state, every round, every match type. Any violation = build failure.

| # | Invariant |
|---|---|
| I-1 | `playing + benched = total players` — always, no exceptions |
| I-2 | A player cannot appear in both playing and benched simultaneously |
| I-3 | A player cannot appear in two active matches across any courts |
| I-4 | A player cannot appear twice within the same match (same team or both teams) |
| I-5 | Fixed Doubles: partners are never separated across any round |
| I-6 | Random Doubles: no matchup repeats until all unique matchups are exhausted |
| I-7 | Score ≥ 1, score ≤ winningPoint, score is a whole integer |
| I-8 | Completed matches never appear as active. Active matches never appear in history. |
| I-9 | localStorage always reflects current session state after every action |
| I-10 | Corrupted or missing localStorage never crashes the app |
| I-11 | `ASSIGN_MATCH` never assigns a player already in a `status: 'playing'` match |
| I-12 | `getMatchOptions` never returns a match option containing an active player ID |
| I-13 | `byeHistory` grows by exactly 1 entry per round (odd player count), never skips or double-counts |
| I-14 | An in-progress match key is always in `usedMatchups` — it can never be re-generated on another court |
| I-15 | Changing match type always clears all players and all partner references |

---

## Pass Criteria

A flow **passes** only when every `Assert` is satisfied with zero manual workarounds.
A flow **fails** if any assert breaks, throws, or requires the user to recover from an unexpected state.
