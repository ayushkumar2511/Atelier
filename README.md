# Atelier – Painting analysis & auction base price

## Run locally
1. Install Node.js 18+ (https://nodejs.org). No npm install needed - zero dependencies.
2. Copy `.env.example` to `.env` and paste your Anthropic API key (https://console.anthropic.com).
3. Run `node server.js`
4. Open http://localhost:3000

## How it works
- Feature catalogue = Form, Colour, Depth perception + Design basics (edit `CATALOGUE` in server.js to add/remove features).
- Each painting is scored 0-10 per feature by Claude (vision), with a one-line observation.
- Overall score (0-100) = average of all feature scores.
- Base price = Min * (Max/Min)^(score/100)  (min/max editable on the Auction page).
- Tiers: Emerging <40, Established 40-59, Distinguished 60-79, Masterwork 80+ (edit in public/index.html).
- Auction page can export CSV.

Note: results live in the browser tab (refresh clears them) - export CSV before closing.

## Easiest way (no key, no server)
Double-click `public/index.html`. Quick mode measures colour, contrast and edges in your browser (approximate, no AI).
With the server + API key running (`node server.js`), the same page uses AI analysis automatically.
