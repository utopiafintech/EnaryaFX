# Enarya FX

A single-page forex information site: live-rate ticker bar, currency converter, rates table with sparklines, forex basics, market sessions and a news section. Plain HTML, CSS and JavaScript. No build step.

## Run locally

Open `index.html` in a browser. Or serve it:

```bash
python3 -m http.server 8000
# then visit http://localhost:8000
```

## Deploy free with GitHub Pages

1. Create a new GitHub repository (e.g. `enarya-fx`).
2. Upload `index.html` and `README.md` to the repository root.
3. Go to **Settings → Pages**.
4. Under **Build and deployment**, choose **Deploy from a branch**, select `main` and `/ (root)`, then **Save**.
5. After a minute your site is live at `https://YOUR-USERNAME.github.io/enarya-fx/`.

(Netlify also works: drag the folder onto app.netlify.com/drop.)

## Customize

- **Rates provider / API key:** edit the `fetchRates()` function in `index.html`. It must return daily objects shaped like `{ USD: 1, EUR: 0.92, ... }`.
- **Currency pairs:** edit the `PAIRS` array.
- **News:** replace the placeholder data in `fetchNews()` with a call to your news API.
- **Colors:** change the CSS variables at the top of the `<style>` block.

## Notes

- The default provider (Frankfurter v2) serves daily reference rates, including ETB, which update once per business day. For tick-by-tick prices, use a paid provider.
- Market session hours are approximate and do not adjust for daylight saving time.
- The Shashego Market session (Ethiopia) assumes 08:00-17:00 local time (UTC+3). Edit the `SESSIONS` array in `index.html` to match its real hours.
- ETB/USD is shown as the value of one birr in US dollars.

## Disclaimer

Enarya FX provides information for educational purposes only and is not financial advice. Forex trading carries a high level of risk.
