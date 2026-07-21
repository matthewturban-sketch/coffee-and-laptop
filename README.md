# C+L Systems

Single-page marketing site for **C+L Systems** (full name: Coffee and Laptop), a solo
practice that recovers lost enrollment revenue for private career and trade schools.
The centerpiece is an interactive **Dormant Revenue Calculator**.

Domain: candlsystems.com. Contact: hello@candlsystems.com.

Imported from the Claude Design project "C+L website design brief" and converted from
the `.dc.html` design-canvas format into a self-contained static page (no runtime,
no build step, no dependencies).

## Structure

- `index.html` — full page markup (header, hero, problem, calculator, offers, why-me, booking, footer)
- `styles.css` — base styles, fonts, and hover states
- `script.js` — the Dormant Revenue Calculator (client-side only, nothing stored)

## Running locally

Open `index.html` directly in your browser, or serve the folder:

```bash
python3 -m http.server 8000
```

Then visit http://localhost:8000

## Before launch — placeholders to fill in

Search the source for these and replace them:

- `[scheduling link]` in the booking section — point the "Book a 20-minute call" button at your Calendly (or similar) URL.
- `[email]` / `[email address]` — real contact email in the footer and email-fallback note.
- The **Why me** paragraph is marked `[Matt to finalize wording.]`.
- The email fallback form is a placeholder; wire `#email-submit` in `script.js` to a real handler.

## Calculator assumptions

Two fixed, conservative assumptions live at the top of `script.js`:

- `LIFT_POINTS = 3` — start-rate lift from faster follow-up (percentage points)
- `REACTIVATION_RATE = 2` — percent of the dormant list that can be reactivated

Formulas:
- Ongoing recovery/yr = inquiries/mo × 12 × lift × tuition
- One-time = dormant × reactivation rate × tuition
- Year-one total = the two added together
