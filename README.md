# Krunker-Inspired Arena Demo

A lightweight, single-file browser game demo inspired by Krunker-style arenas.
It runs entirely client-side with no backend, and spawns bots when the simulated
online player count is `0`.

## Live demo
Use one of the links below (replace `YOUR_GITHUB_USERNAME` and `krunker` if needed):

- **Instant preview (no Pages setup):**
  [Launch via HTMLPreview](https://htmlpreview.github.io/?https://raw.githubusercontent.com/YOUR_GITHUB_USERNAME/krunker/main/docs/index.html)
- **GitHub Pages (recommended for a stable URL):**
  [Launch via Pages](https://YOUR_GITHUB_USERNAME.github.io/krunker/)

**Fixing 404s (Pages):**
1. Replace `YOUR_GITHUB_USERNAME` with your GitHub username (or org).
2. Enable Pages in **Settings → Pages**.
3. Set **Source** to **Deploy from a branch**, then pick **main** + **/docs**.
4. If your repo name isn’t `krunker`, update the URL to match your repo name.
5. Wait a minute for GitHub Pages to deploy, then refresh.

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
