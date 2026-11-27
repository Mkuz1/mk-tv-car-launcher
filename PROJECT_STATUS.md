# MK TV & Car Launcher (MK Launcher): project status

_Source of truth for this app's claude.ai chat. As of 2026-11-27._

Apple TV-style home screen and Islamic dashboard screensaver for Google TV / Android TV, a touch home screen with azkar and prayer times for Android car head units, and an iPhone-style phone launcher.

## Current state

| | |
|---|---|
| Version | **2.9.7** (car/TV app, `app/AndroidManifest.xml`); phone launcher 1.9.x; helper 1.3.x |
| Platforms | Google TV / Android TV 9+, Android car head units 8+, Android phones 8+ |
| Downloads | GitHub releases in this repo (`v2.9.7`, 2026-11-11): TV, car and phone APKs + Play bundles zip |
| Website | **https://mklnchr.pages.dev** (`site/`, auto-deploys via `pages.yml` to Pages project `mklnchr`) |
| App Store / Play | Not live |

## Rules specific to this app

- `build.yml` runs on every push and publishes a GitHub release when the `versionName` on main has no release yet. For docs-only commits, put `[skip ci]` in the commit message.

## Recent changes

- 2026-11-26: Website added (real screenshots, live download links); auto-deploy (PR #1); koussa.net invite (PR #2); SEO with the real app icon as favicon (PR #3). Listed on koussa.net as one of the two new apps.
- 2026-11-11: Car 2.9.7 keeps split screen together.

## Open items

- None known.

## Rules for every MK app (decided in the MK APPS project)

- **This file is the hand-off to the app's own Claude chat.** That chat reads it from GitHub through Project knowledge. Every change to this app (code, release, store, website, decision) must also update this file in the same PR or commit.
- **Nothing local-only.** Every asset, store file and site file lives in the app's GitHub repo. Signing keys and passwords are the only exception and are never committed (they stay in `~/keys` on the Mac).
- **Websites deploy themselves** to Cloudflare Pages from GitHub Actions on push (secrets `CLOUDFLARE_API_TOKEN` / `CLOUDFLARE_ACCOUNT_ID` are set on the repo). No manual or terminal deploys.
- **Every app site invites visitors to https://www.koussa.net** (the MK Apps showcase, source in `Mkuz1/MK-APPS`, served by Cloudflare project `mkuzapps`). Keep that card when editing the site, and update the app's row in `MK-APPS/build.py` when platforms, versions or store links change.
- **SEO and share previews (done 2026-11-26):** keep the OG + Twitter tags with an absolute 1200x630 image under 300 KB, canonical, favicon.ico + 192/512 icons + 180 px touch icon, web manifest, robots.txt, sitemap.xml and SoftwareApplication JSON-LD. When replacing a share image, give it a new file name so WhatsApp refreshes its cache.
- **Store badges only for what is really live.** Re-check the App Store / Play page before adding a badge.
- **Mohamad merges pull requests himself** (Claude Code's auto mode on the Mac blocks `gh pr merge`).

---
_Last updated 2026-11-27. Update this file with every change to the app._
