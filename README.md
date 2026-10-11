# The Haunt

A public, portrait-first Halloween housewarming website for Dakota and Rashika. Designed for a vertical 1080 × 1920 display, with warm ambient light, a welcoming haunted house, and gentle motion.

## Display controls

- **Full screen** enters browser fullscreen. Idle controls fade away; move the mouse, tap, or press a key to restore them. Escape exits fullscreen.
- **Candlelight** opens three lighting moods and a glow-brightness slider.
- **Lights only** hides the welcome scene for an ambient-light display.
- The pause button stops motion. Device reduced-motion preferences are respected.
- Screen wake lock keeps the display awake in fullscreen when the browser supports it.

Preferences are saved locally in the current browser. The website is public and needs no login. Apartment chores and shared household records are future work.

## GitHub Pages

GitHub Pages publishes the `docs/` directory on the `main` branch. There is no build step. All website fonts, icons, and artwork are self-hosted with relative URLs, so they work under the repository's `/apartment/` path.

For local preview, run `python3 -m http.server 4173 --directory docs` from this directory.

## Assets

The original haunted-house illustration was made with the built-in image-generation tool. Cormorant Garamond and DM Sans fonts are licensed under the SIL Open Font License; Phosphor interface icons are MIT licensed. The asset license files are included in `docs/assets/`.
