# Ideas

The backlog. Items move to Done with the commit that lands them; an item that turns out to be a bad idea is deleted with a line saying why, not left to rot.

## Exhibits

An exhibit is one design idea carried across a whole form, so each item below says what the idea is and how it reaches every field. An idea that only reaches one field belongs inside an exhibit, not beside it.

### Payment details — card number, expiry, security code

1. **The Slot Machine** — every field is a row of reels. One SPIN button spins all of them at once and a HOLD toggle keeps the ones that happened to land right. Expiry has two reels, the code three, the number sixteen. Open question: pure chance has no ceiling on how long it takes, which reads as broken rather than hostile — a nudge (holds are free, spins are cheap) or a pity mechanic is probably needed.
2. **The Bureaucrat** — nothing may be entered out of order. Each digit clears a 1–3 second "verification" spinner before the next unlocks, and every field is a 12px-tall `<select>` whose options are re-shuffled each time it opens. The expiry's month select offers all twelve; the year select offers ninety.
3. **The Timepiece** — every field is an analogue clock face dragged by hand. Expiry is the obvious one (hour hand picks the month, minute hand picks the year across a 60-minute sweep, so a year is six minutes wide); the card number is four faces read as clock positions; the code is a stopwatch you must stop on the right second.
4. **The Chip Reader** — the whole form comes off a rendered card you drag into a slot at the right angle and speed. Too fast reads as a swipe, too slow times out, and each successful read yields exactly one field.

### Personal information — name, email, phone, address

5. **The Directory** — the name is picked from a `<select>` of forty thousand entries, alphabetical, no search box and no type-ahead (the control eats keystrokes on purpose), with a helpful "Can't find it? Scroll down" pinned to the bottom. Email and address are picked the same way, from lists that are necessarily incomplete.
6. **Generate Until It's Yours** — every field has one control, a Generate button producing a random plausible value. Keep pressing until it is you. A counter reports how close the last attempt was, character by character, which does not help.
7. **By Map** — every field is answered by pinning a point on a satellite view of the whole planet. Address is fair enough; name and phone number are a stretch, which is the joke. Zoom is a two-step process and the map recentres on the origin each time.

### Dates — date of birth

8. **The Timeline** — a single horizontal timeline from 1900 to today at roughly forty pixels per year, no zoom. A magnifier follows the cursor showing the date under it, lagging 300 ms.
9. **The Calendar That Only Goes Forward** — a month-at-a-time picker with a Next button and no Previous. It starts at January 1900.

### Consent — the cookie banner

10. **Reject All** — Accept is one button; Reject is a 6×7 matrix of individually-required checkboxes, re-shuffled if you miss one. Legally compliant, obviously.
11. **The Terms** — scroll-to-the-bottom-to-continue, with a scrollbar that returns to the top whenever the tab loses focus.

## Site

12. **Light appearance** — one additive CSS partial plus a pre-paint appearance script so there is no flash. The tokens are already named by role for it.
13. **Exhibit permalinks that restore state** — `#/payment/odometer?v=…` so a visitor can show someone how far they got. Needs a serialisation the session owns, not the exhibit.
14. **A hall of fame** — fastest completion per exhibit, kept in `localStorage`, purely local. The comparison line ("industry average: 9 seconds") in the receipt is the seed of this.
15. **What's New panel** — a curated `changelog.json` feed, like OddworldMap's. Worth it once the exhibit count justifies a visit for "what changed".
16. **Site furniture** — `CNAME` (baddesigns.org), `og-image.png` social card, favicons, `site.webmanifest`, `robots.txt`, `sitemap.xml`. Deferred until the name and the visual identity have settled.
17. **A "how bad is it" measure** — the cruelty pips are hand-assigned. They could instead be derived from a recorded median completion time once there is traffic, which is a more honest number and a better joke.
18. **Random exhibit button** — one keypress, one victim.

## Done

_(nothing yet)_
