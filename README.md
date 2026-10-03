<div align="center">

# aki's Discord Tools

**57 small utilities for Discord. No sign-in, no server, nothing stored.**

[![Live site](https://img.shields.io/badge/live-distools.itzdanti.dev-5865f2?style=flat-square)](https://distools.itzdanti.dev/)
[![Docs](https://img.shields.io/badge/docs-Fumadocs-8a8a99?style=flat-square&logo=readthedocs&logoColor=white)](https://distools.itzdanti.dev/docs)
[![API](https://img.shields.io/badge/API-53%20endpoints-4ade80?style=flat-square)](https://distools.itzdanti.dev/api/v1)
[![GitHub stars](https://img.shields.io/github/stars/itzdanti/distools?style=flat-square&label=stars&color=fbbf24)](https://github.com/itzdanti/distools/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/itzdanti/distools?style=flat-square&label=forks&color=8a8a99)](https://github.com/itzdanti/distools/network/members)
[![GitHub issues](https://img.shields.io/github/issues/itzdanti/distools?style=flat-square&label=issues&color=4ade80)](https://github.com/itzdanti/distools/issues)
[![GitHub license](https://img.shields.io/github/license/itzdanti/distools?style=flat-square&label=license&color=f87171)](LICENSE)
[![Contributors](https://img.shields.io/github/contributors/itzdanti/distools?style=flat-square&label=contributors&color=a78bfa)](https://github.com/itzdanti/distools/graphs/contributors)
[![Last commit](https://img.shields.io/github/last-commit/itzdanti/distools?style=flat-square&label=last%20commit&color=6a6a78)](https://github.com/itzdanti/distools/commits/main)

</div>

---

Most of these started because I kept needing one specific thing and getting annoyed that every
site that did it wanted an account first.

Fancy text that actually works on mobile. A snowflake decoder that tells you the date instead of
just printing a number. Permission maths that doesn't send your role list to a stranger's
server. That's it. That's the brief.

Everything runs in your tab. Open the network panel and watch nothing happen.

<div align="center">
  <em>57 tools · 53 API endpoints · one static bundle · zero backend</em>
</div>

---

## What it does

| | |
|---|---|
| **Text** | fancy, zalgo, small caps, spoiler, divider, mentions, markdown, unicode cleanup |
| **IDs** | snowflake decode and create, mock IDs, user / guild / invite / emoji lookup |
| **Webhooks** | send, delete, run a test payload |
| **Emoji** | Twemoji and standard conversions, resizing, a list of every one of them |
| **Developer** | token inspector, webhook info, permission calculator, colour shade, hashtag |
| **Misc** | timestamp, birthday/age, VTT and subtitle helpers, sound board |

Full list with screenshots-ish descriptions: **[distools.itzdanti.dev](https://distools.itzdanti.dev/)**

---

## The API

53 of the 57 tools are callable. It's the same code the page runs, so the docs can't drift from
the implementation.

```js
import { api } from "https://distools.itzdanti.dev/api/v1/client.js";

const fancy = await api.get("/text/fancy", { text: "hello", style: "bold" });
console.log(fancy.data.output); // 𝗵𝗲𝗹𝗹𝗼
```

No key. No rate limit. No user data. Webhook URLs are not accepted by any endpoint, on purpose.

Reference: **[distools.itzdanti.dev/docs/api](https://distools.itzdanti.dev/docs/api)**

### The one thing worth knowing

The site is on GitHub Pages, which serves files. There's no process behind the domain that can
read `?text=hello` and compute an answer, so:

- **Opening a URL works.** `distools.itzdanti.dev/api/v1/text/fancy?text=hi` renders the JSON.
- **Importing the client works.** That's the supported way to call it, in a browser or in Node.
- **A bare `fetch()` of a parameterised endpoint does not**, and that's Pages, not a bug. You'll
  get the HTML shell. Use the client.

The discovery documents *are* real files, so `curl` works on those:

```bash
curl https://distools.itzdanti.dev/api/v1/openapi.json
```

---

## Running it yourself

Node 20 or newer. No `.env`, no backend, no database.

```bash
git clone https://github.com/itzdanti/distools.git
cd distools
npm install
npm run dev
```

| Script | What it does |
|---|---|
| `npm run dev` | regenerate `openapi.json`, then dev server on `:5173` |
| `npm run build` | regenerate docs data, type-check, build the site, then build `/api/v1/client.js` and bake the JSON |
| `npm run preview` | serve the built output |
| `npm run lint` | oxlint |
| `npm run test:config` | parse the shipped `DISTOOLS_CONFIG` and check the format rules |
| `npm run test:api` | run 101 assertions against the API handler in-process |
| `npm run test:routes` | render all 57 tools, every docs page and every route, failing on any throw |
| `npm run test:dist` | check the built files a deploy would publish |
| `npm run test:serve` | boot the dev server and a preview of `dist`, then make real HTTP requests |
| `npm run tests` | all of the test suites, building first so the dist tests have something to check |
| `npm run docs:openapi` | regenerate `openapi.json` from the endpoint registry |
| `npm run docs:llms` | regenerate `public/llms-full.txt` from the docs and the registry |
| `npm run release:notes` | build `release-notes.md` from the commits since the last tag |
| `npm run verify` | `lint`, then `tests` |

`openapi.json` and `llms-full.txt` are generated, never hand-edited. Change an endpoint in
`src/lib/core/api.ts`, run `npm run verify`, and the reference at `/docs/api`, the OpenAPI file,
and the LLM text all follow.

### Deploying

Push to `main`. The workflow in `.github/workflows/pages.yml` builds and deploys to GitHub
Pages, and `public/CNAME` points at `distools.itzdanti.dev`. Nothing else to configure.

### Releasing

Push a `v*` tag, or run the **Deploy and release** workflow by hand and type a version. The
workflow runs `npm run verify`, builds the site, writes release notes from the commits since the
last tag — one line per commit, credited to its author — and publishes the release. The final
line links back to the site, using the name and domain from `DISTOOLS_CONFIG`.

<details>
<summary>Deploying somewhere else</summary>

Any static host works. The output is `dist/`, and two paths need rewrites to your host's
equivalent of `404.html`:

- `/tool/*` and `/docs/*` — the client-side router handles these
- `/api/v1/*` — the app answers these itself

Set `base` in `vite.config.ts` if you're not serving from a domain root.
</details>

---

## Contributing

Pull requests welcome, including from people who have never opened one before. The short version:

1. Put the logic in `src/lib/core/` as a pure function. No React, no `document`.
2. Register the tool in `src/tools/registry.tsx` and build the page.
3. If it should be callable, add an endpoint to `src/lib/core/api.ts`. It appears in the docs
   automatically.

Two rules that are not negotiable: **no endpoint ever accepts a webhook URL**, and **no tool
gains a network call it does not need**. The privacy page has to stay true.

```bash
npm run verify
```

Longer version, with the reasoning: **[contributing guide](https://distools.itzdanti.dev/docs/contributing)**

---

## Community

- **[Contributing guide](CONTRIBUTING.md)** — how to build a change, and the rules that are not
  negotiable.
- **[Code of Conduct](CODE_OF_CONDUCT.md)** — the behaviour expected of everyone here.
- **[Support](SUPPORT.md)** — where to ask a question, and what to include.
- **[Security policy](SECURITY.md)** — how to report a vulnerability privately.
- **[Changelog](CHANGELOG.md)** and **[Authors](AUTHORS.md)**.

Bug reports and tool ideas have templates: **[open an issue](https://github.com/itzdanti/distools/issues/new/choose)**.

---

## Licence

Not MIT, not GPL. It's a custom licence that lets you use, modify, copy, merge, publish,
distribute and sublicense this — including commercially — and forbids one thing: **selling it**.

Keep the copyright notice, don't imply the original author endorses your fork, and you're fine.

Full text: **[LICENSE](LICENSE)**

---

## Notes

- Not affiliated with, endorsed by, or sponsored by Discord Inc. Discord is a trademark of
  Discord Inc.
- The icons are [Lucide](https://lucide.dev). Emoji artwork belongs to whoever made the emoji.
- Some Discord routes now answer `401` without a bot token. That's Discord, not a broken tool,
  and the site says so rather than hanging. Details in the docs.

<div align="center">
  <sub>Built by aki · <a href="https://distools.itzdanti.dev/docs/contributing">come help</a></sub>
</div>
