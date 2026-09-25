# 🔴⚫ RED OR BLACK — site

Paste your wallet, pick a color. Every 5 minutes the wheel spins — everyone who
picked the color the ball lands on (and holds the coin) splits every creator
reward in equal parts, paid in SOL. Nobody called it? The pot rolls over.

Next.js 16 + motion. Everything live comes over one WebSocket from
[`red-or-black-back`](https://github.com/Harkor421/red-or-black-back).

| route | what |
| --- | --- |
| `/` | the table: wheel, countdown, your wallet (eligible or not, what you've won), RED / BLACK, the pot, last spins, live picks, latest winners, verify a spin |
| `/live` | the **stream view** — a fixed 1920×1080 stage for an OBS browser source. Nothing to click; `?sound=1` starts with sound on |

## The spin

The page doesn't fake a result. At the bell the ball is launched; when the
backend reports the drand beacon's pocket, the ball decelerates to 12 o'clock
and the wheel decelerates to whatever angle puts that pocket under it — both
starting at the speed they were already spinning, so nothing jumps. After the
landing, the result card shows who won and how much each gets — "YOU WON" if
your wallet is among them — and each payout batch links to its transaction as it
confirms.

Any spin can be re-derived in the browser (`lib/wheel.ts`, "Verify this spin"):
the beacon is fetched straight from drand, its randomness is checked against its
signature, and the pocket is recomputed with the same arithmetic as the backend.

## Run

```bash
npm install
NEXT_PUBLIC_BACKEND_URL=http://localhost:8787 npm run dev
```

## Deploy

```bash
vercel deploy --prod
```

`NEXT_PUBLIC_BACKEND_URL` is read at **build time** — changing it in Vercel does
nothing until the next deploy.

## Streaming it

In OBS: *Sources → Browser*, URL `https://<site>/live?sound=1`, 1920×1080,
"Control audio via OBS" on. Go live on pump.fun with that scene.
