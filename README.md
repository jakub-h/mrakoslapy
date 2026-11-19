# mrakoslapy

A game master's assistant for [Matfyzácká mafie (Mrakošlapi)](https://www.hranostaj.cz/hra291).
It runs on the šéf hry's tablet or phone and works offline.

The app holds every player's hand, walks the šéf hry through the night wake order, and resolves
shots through tunnels, slinas and mirrors by time unit. It drafts the DEN announcement, which the
šéf hry can correct before reading it out. During the day it shows each player's cards; at the end
of the day the šéf hry enters the result, and the app applies Provazochodec, Mrakošlap, Masový vrah
and Kuskoňa/Gandalf. Each night's shot paths stay in the log for post-game analysis.

The game is stored in the browser after every action and can be exported as JSON.

## Rule interpretations

Where the rules are open, the engine does this:

- A mirror reflects a shot back one hop, to where it came from, not to the original shooter.
- Every fragment of a split shot counts on its own, even when two fragments arrive together.
- Šílený střelec shoots on even nights. Each copy of an action card acts on its own.
- The lowest-numbered Mrakošlap or Zrcadlo is used first.
- A Medik who fakes death still takes that night's shots, and is untouchable until they return.
- Tunnels and slinas keep working after their maker dies that night.
- No tunnel can start or end at the Ateista.
- An exhibition is announced even if its target died that night.

## Development

```sh
corepack enable pnpm
pnpm install
pnpm dev      # local server
pnpm test     # engine tests
pnpm build    # static build in dist/
```

The rule engine in `src/engine/` has no UI dependencies. Pushing to `master` deploys to GitHub
Pages.

## Printable cards

`print/mrakoslapy-karty.pdf` holds all 40 cards at MTG size (63 × 88 mm), 9 per A4 page. Print
at 100% scale. To change the cards, edit `print/cards.mjs` and render the PDF again:

```sh
cd print
node cards.mjs all > cards.html
google-chrome --headless --no-pdf-header-footer --print-to-pdf=mrakoslapy-karty.pdf cards.html
rm cards.html
```
