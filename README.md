# What AI Actually Is

An interactive 3D explainer of what modern AI really is, in about 10 minutes of clicking through. An intro and eight short chapters, one continuous particle scene, no math.

Inspired by Chloe Lubinski's talk "How AI works (in 14 minutes)": https://youtu.be/aBUniZHgCnE
Made by Rasheed (@earlythesis). Not affiliated with Anthropic.

## Status

Live at https://earlythesis.com since 2026-11-12. All eight chapters are built, with the finishing pass done (performance, reduced motion, flat fallback, social preview image).

## How to run

Everything runs in Docker. Nothing is published on a host port: the only way in is a Cloudflare tunnel named `what-ai`, and `earlythesis.com` and `www.earlythesis.com` point at it in Cloudflare DNS (www redirects to the bare domain).

```bash
scripts/deploy.sh          # build, start, and print the address
docker compose --profile named down   # take the site offline
```

The tunnel token lives only in `.env`, which git ignores (see `.env.example` for its shape). Without a `.env`, `scripts/deploy.sh` falls back to a temporary quick tunnel with a random address.

For local development without Docker: `npm install`, then `npm run dev`.

## Security

The site is static files only: no server code, no forms, no database, no uploads.

- No port on the server is opened for it. Traffic arrives only through the Cloudflare tunnel, which the server opens outward.
- The web server (unprivileged nginx) runs as a normal user, with no Linux capabilities, a read-only filesystem and memory and process limits. It sits on an internal Docker network with no internet and no route to the host. Even if it were taken over, it could not reach the server or anything else.
- The tunnel container is locked down the same way. Its token lives only in `.env` (mode 600, ignored by git).
- nginx only answers GET and HEAD, never serves hidden files, hides its version and sends strict security headers (CSP, HSTS, frame blocking).

## How to test

With the site running:

```bash
scripts/checks.sh              # 85 behaviour checks: keys, swipes, every interactive part, reduced motion, fallback
scripts/shots.sh mobile        # click through every chapter at phone size, screenshots land in /tmp/wai-out
scripts/shots.sh desktop 3,4   # only chapters 3 and 4, at desktop size
scripts/og.sh                  # re-render the social preview image into public/og.png
```

These run a headless browser inside the official Playwright Docker image. A headless browser cannot judge real frame rate, so changes also get a check on a real phone.

Handy address options: `?tier=low|mid|high` forces a particle count, `?reduced` forces reduced motion, `?fallback` forces the version without 3D.

## How it is built

- Vite, React, TypeScript, React Three Fiber, drei, GSAP. Static site, no backend, no cookies, no tracking. Fonts are bundled, nothing is loaded from other sites.
- `src/content/chapters.ts`: every word on the site, as plain data, with the sources for each chapter.
- `src/scene/shapes.ts`: the places the particles can fly to (cloud, wheel, flowchart, network, text stream, beams, figures, bar chart, garden, final form).
- `src/scene/specs.ts`: what the scene looks like at each step.
- `src/scene/Scene.tsx`: one particle system with one shader, the camera, and the wheel.
- `src/state/`: navigation (steps, addresses like `/#chapter-6`, scroll, keys, swipes) and the small interactive parts.
- `src/ui/SceneLabels.tsx`: real HTML words pinned onto the 3D scene, so screen readers and translators can read them.
- `src/ui/Fallback2D.tsx`: flat pictures for browsers without WebGL.
- `docs/proposal.md`: the first approved copy, kept for history. `src/content/chapters.ts` is the current copy, rewritten on 2026-11-12 against the talk.

Weak devices get fewer particles (14,000, 28,000 or 56,000 depending on the device), and the count and sharpness drop further if the frame rate falls.

## Still open

- Have a native speaker read the non-English lines in chapters 3 and 4.
- Try the site on a few real phones, including an older one.
