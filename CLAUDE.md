# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- **Dev server:** `npm run dev` (uses nodemon, starts on port 4000)
- **Production start:** `npm start`
- **Install deps:** `npm install`
- No test runner or linter is configured.

## Architecture

This is a server-rendered Express.js e-commerce app ("Lumina") using EJS templates with `express-ejs-layouts`.

### Routing

- `routes/index.js` — Client-facing pages: home (`/`), shop (`/shop`), deals (`/deals`), product detail (`/product/:id`), dashboard (`/dashboard`), login/register
- `routes/admin.js` — Admin panel mounted at `/admin`: dashboard, product CRUD (`/admin/products`, create, edit, delete)

### Data Layer

- `data/products.js` — In-memory product store with `getAll`, `getById`, `create`, `update`, `delete`. No database; data resets on server restart. MongoDB/Mongoose dependencies exist in package.json but are not currently wired up.

### View Layouts

Two layout files control the page shell:
- `views/layout.ejs` — Client storefront layout (navbar, footer, countdown timer)
- `views/admin/layout.ejs` — Admin panel layout (sidebar, topbar). Admin views opt into this layout via `layout: 'admin/layout'` in route handlers.
- Login/register pages use `layout: false` (standalone).

### Role System

Roles (`admin`/`client`) are stored in a `role` cookie. The `/toggle-role` endpoint flips between them. `res.locals.role` is set via middleware in `app.js` and is available in all templates. Auth is currently stubbed — login/register always succeed.

### Styling

Single stylesheet at `public/stylesheets/style.css`. Dark theme with CSS custom properties (prefix `--`). Manrope font via Google Fonts CDN. Admin styles are in the same file (search for "ADMIN PANEL STYLES" section).
