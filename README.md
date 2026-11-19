# mrakoslapy

A game master's assistant for [Matfyzácká mafie (Mrakošlapi)](https://www.hranostaj.cz/hra291).
It runs on the šéf hry's tablet or phone and works offline.

The app holds every player's hand, walks the šéf hry through the night wake order, and resolves
shots through tunnels, slinas and mirrors by time unit. It drafts the DEN announcement, which the
šéf hry can correct before reading it out. During the day it shows each player's cards; at the end
of the day the šéf hry enters the result, and the app applies Provazochodec, Mrakošlap, Masový vrah
and Kuskoňa/Gandalf. Each night's shot paths stay in the log for post-game analysis.

The game is stored in the browser after every action and can be exported as JSON.

## How to play

You need 6 to 8 players plus one šéf hry (game master), the [rules](https://www.hranostaj.cz/hra291),
a set of cards, and a tablet or phone for the šéf hry. Only the šéf hry uses the app. The players
keep their cards hidden in hand.

### Get the cards

1. Download [`print/mrakoslapy-karty.pdf`](print/mrakoslapy-karty.pdf). It has all 40 cards at
   the size of Magic: The Gathering cards (63 × 88 mm), 9 per A4 page.
1. Print it at 100% scale, not "fit to page". A printed card is 63 mm wide.
1. Cut along the grey lines. Optional: put each card into a card sleeve in front of an old card or
   a piece of cardboard, so the cards are stiff and look the same from the back.

You can also write the cards on plain paper. Each card needs its name and number, for example
"Zrcadlo 3", because the app tracks every card by number.

### Open the app

1. On the šéf hry's tablet or phone, open <https://jakub-h.github.io/mrakoslapy/>.
1. Optional: add it to the home screen. In Chrome, open the menu and tap **Add to home screen**.
   In Safari, tap **Share**, then **Add to Home Screen**. The app then works offline.

The game is saved in that browser only. Clearing the browser data deletes it. To keep a game,
tap **Export** to download it as a JSON file.

### Run a game

1. Remove cards for smaller games:
   - 7 players: Duch Bobo, Exhibicionista 2, Zrcadlo 5, Astronom 3 and Provazochodec 3. Each
     player gets 5 cards.
   - 6 players: Duch Bobo, Exhibicionista 2, Zrcadlo 5 and Astronom 3. Each player gets 6 cards.
   - 8 players use all 40 cards, 5 per player.
1. Shuffle and deal the cards.
1. In the app, choose the number of players and type their names. A pair that plays together
   counts as one player.
1. Tap **Zadat karty**. Tap a player, then tap each card that player holds. Repeat for every
   player. The šéf hry can look at the cards or ask the players to show them.
1. Tap **Začít hru (NOC 1)**. At night, the app calls each card in wake order. Wake its holder and
   tap the player they point at, or tap **Nepoužije**.
1. After the last card, the app shows the night result. Read the announcement out loud and tap
   **Oznámit DEN**. If the app got something wrong, open **Upravit výsledek** and fix it first.
1. During the day, the app shows everyone's cards. At the end of the day, enter the Anarchista
   shot, the Astronom's NOC, or who was executed and who voted for it. Tap **Oznámit NOC**.
1. Repeat night and day until one player is left.

**Karty** shows every player's cards at any time. Used cards are greyed out. **Záznam** shows
each night's announcement and a diagram of every shot. **↶ Zpět** goes back before the last
announcement, if you need to fix it.

## Jak hrát

Potřebujete 6 až 8 hráčů a jednoho šéfa hry, [pravidla](https://www.hranostaj.cz/hra291), sadu
karet a tablet nebo telefon pro šéfa hry. Aplikaci používá jen šéf hry. Hráči drží své karty
skryté v ruce.

### Karty

1. Stáhněte si [`print/mrakoslapy-karty.pdf`](print/mrakoslapy-karty.pdf). Obsahuje všech
   40 karet ve velikosti karet Magic: The Gathering (63 × 88 mm), 9 na stránku A4.
1. Vytiskněte ho ve skutečné velikosti (100 %), ne „přizpůsobit stránce“. Vytištěná karta je
   široká 63 mm.
1. Rozstříhejte karty podle šedých čar. Volitelně: vložte každou kartu do obalu na karty před
   starou kartu nebo kus kartonu. Karty pak budou tuhé a zezadu stejné.

Karty můžete také napsat na obyčejný papír. Každá karta potřebuje jméno a číslo, například
„Zrcadlo 3“, protože aplikace sleduje každou kartu podle čísla.

### Aplikace

1. Na tabletu nebo telefonu šéfa hry otevřete <https://jakub-h.github.io/mrakoslapy/>.
1. Volitelně: přidejte si ji na plochu. V Chromu otevřete menu a klepněte na **Přidat na plochu**.
   V Safari klepněte na **Sdílet** a pak **Přidat na plochu**. Aplikace pak funguje i offline.

Hra se ukládá jen v tomto prohlížeči. Smazání dat prohlížeče ji smaže. Pro uložení hry klepněte
na **Export**, který ji stáhne jako soubor JSON.

### Průběh hry

1. Pro menší hru odeberte karty:
   - 7 hráčů: Duch Bobo, Exhibicionista 2, Zrcadlo 5, Astronom 3 a Provazochodec 3. Každý hráč
     dostane 5 karet.
   - 6 hráčů: Duch Bobo, Exhibicionista 2, Zrcadlo 5 a Astronom 3. Každý hráč dostane 6 karet.
   - 8 hráčů hraje se všemi 40 kartami, 5 na hráče.
1. Zamíchejte a rozdejte karty.
1. V aplikaci zvolte počet hráčů a zadejte jejich jména. Dvojice, která hraje spolu, je jeden
   hráč.
1. Klepněte na **Zadat karty**. Klepněte na hráče a pak na každou jeho kartu. Opakujte pro
   všechny hráče. Šéf hry se může na karty podívat, nebo si je nechat ukázat.
1. Klepněte na **Začít hru (NOC 1)**. V noci aplikace volá karty v pořadí probouzení. Probuďte
   držitele karty a klepněte na hráče, na kterého ukáže, nebo na **Nepoužije**.
1. Po poslední kartě aplikace ukáže výsledek noci. Přečtěte oznámení nahlas a klepněte na
   **Oznámit DEN**. Pokud aplikace něco spočítala špatně, nejdřív to opravte v **Upravit
   výsledek**.
1. Ve dne aplikace ukazuje karty všech hráčů. Na konci dne zadejte výstřel Anarchisty, NOC
   Astronoma, nebo koho popravili a kdo pro to hlasoval. Klepněte na **Oznámit NOC**.
1. Opakujte noc a den, dokud nezůstane jeden hráč.

**Karty** kdykoliv ukáže karty všech hráčů. Použité karty jsou šedé. **Záznam** ukáže oznámení
každé noci a diagram všech střel. **↶ Zpět** vrátí hru před poslední oznámení, pokud je potřeba
něco opravit.

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
