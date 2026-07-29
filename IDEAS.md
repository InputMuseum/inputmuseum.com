# Ideas

The backlog. Items move to Done with the commit that lands them; an item that turns out to be a bad idea is deleted with a line saying why, not left to rot.

## Exhibits

### Payment details

1. **Expiry Roulette** — an analogue clock face where the hour hand picks the month and the minute hand picks the year, dragged by hand. The years run 2026–2035 across the full 60-minute sweep, so each year is six minutes wide and the hand snaps to the nearest whole minute.
2. **CVV Endurance** — three digits entered by holding a button down. The counter rises at one per second and wraps 9 → 0, and releasing commits whatever it lands on. There is no way to go back a digit, only forward around the loop.
3. **Cardholder Name by Consensus** — you type the name; three "verification agents" (fake, local, on timers) each vote on whether that is really your name. Two must agree. They re-vote on every keystroke.
4. **The Chip Reader** — drag a rendered card into a slot, at the exact angle, at a speed within tolerance. Too fast reads as a swipe, too slow times out.

### Personal information

5. **The Name Picker** — a `<select>` of forty thousand first names, alphabetical, no search box, no type-ahead (the control eats keystrokes on purpose), and a helpful "Can't find it? Scroll down" hint pinned to the bottom.
6. **Phone Number by Generation** — a Generate button that produces a random number in your country's format, and nothing else. Keep pressing until it is yours. A counter tracks how close the last one was, digit by digit, which does not help.
7. **Address by Map** — a satellite view zoomed to the whole planet; you pin your house. Zoom is a two-step process: pick a zoom level, then apply it, and the map recentres on the origin each time.
8. **Email as a Ladder** — the address is assembled one character at a time from a keyboard whose keys are re-shuffled after every press.

### Dates

9. **The Timeline** — date of birth entered by scrubbing a single horizontal timeline that spans 1900 to today, roughly forty pixels per year, with no zoom. A magnifier follows the cursor and shows the date under it, lagging by 300 ms.
10. **The Calendar That Only Goes Forward** — a month-at-a-time date picker with a Next button and no Previous button. It starts at January 1900.

### Consent

11. **Reject All** — a cookie banner where Accept is one button and Reject is a 6×7 matrix of individually-required checkboxes, re-shuffled if you miss one. Legally compliant, obviously.
12. **The Terms** — a scroll-to-the-bottom-to-continue agreement whose scrollbar resets to the top whenever the tab loses focus.

## Site

13. **Light appearance** — one additive CSS partial plus a pre-paint appearance script so there is no flash. The tokens are already named by role for it.
14. **Exhibit permalinks that restore state** — `#/payment/odometer?v=…` so a visitor can show someone how far they got. Needs a serialisation the session owns, not the exhibit.
15. **A hall of fame** — fastest completion per exhibit, kept in `localStorage`, purely local. The comparison line ("industry average: 9 seconds") in the receipt is the seed of this.
16. **What's New panel** — a curated `changelog.json` feed, like OddworldMap's. Worth it once the exhibit count justifies a visit for "what changed".
17. **Site furniture** — `CNAME` (baddesigns.org), `og-image.png` social card, favicons, `site.webmanifest`, `robots.txt`, `sitemap.xml`. Deferred until the name and the visual identity have settled.
18. **A "how bad is it" measure** — the cruelty pips are hand-assigned. They could instead be derived from a recorded median completion time once there is traffic, which is a more honest number and a better joke.
19. **Random exhibit button** — one keypress, one victim.

## Done

_(nothing yet)_
