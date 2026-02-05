# Krunker-Inspired Arena Demo

A lightweight, single-file browser game demo inspired by Krunker-style arenas.
It runs entirely client-side with no backend, and spawns bots when the simulated
online player count is `0`.

## Live demo
Open the hosted demo in your browser (after enabling GitHub Pages):

[Launch the demo](https://YOUR_GITHUB_USERNAME.github.io/krunker/)

**Fixing 404s:** replace `YOUR_GITHUB_USERNAME` with your GitHub username (or org),
then enable Pages in **Settings → Pages** and select the **main** branch + **/root** folder.

## Run locally

### Quick start (open in browser)
1. Open `index.html` directly in a modern browser.
2. Click **Start** to begin.

### Optional local server
Some browsers restrict features when opening a local file directly. If you run
into issues, start a simple local server:

```bash
python -m http.server 8000
```

Then visit `http://127.0.0.1:8000`.

### Preview helper
If your code viewer supports running npm scripts, use:

```bash
npm run preview
```

## Controls
- **WASD**: Move
- **Mouse**: Aim
- **Click**: Shoot
- **R**: Reload
- **Space**: Start/Pause

## Notes
- This is a static demo and does not connect to real multiplayer servers.
- Set **Simulated Online Players** to any value above `0` to pause bot spawning.
