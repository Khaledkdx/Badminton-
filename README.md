# FBC Badminton Live Roster

Small backend + frontend for the badminton registration page.

## What it does

- Everyone opens the same live registration page.
- Registrations are saved on the server in `data/registrations.json`.
- The page polls the server every 2 seconds, so new names appear for everyone.
- The WhatsApp message always contains the latest full list.
- `Clear data` removes all saved registrations after entering the admin PIN.

## Run locally

```bash
npm install
npm start
```

Then open:

```text
http://localhost:3000
```

Default clear PIN:

```text
3233
```

To change it:

```bash
CLEAR_PIN=your-secret-pin npm start
```

## Deploy

GitHub Pages alone cannot run this backend. Use a Node hosting service such as Render, Railway, Fly.io, or a VPS.

For deployment, set:

```text
Start command: npm start
Environment variable: CLEAR_PIN=your-secret-pin
```

The app uses `process.env.PORT`, so it works with most Node hosting platforms.
