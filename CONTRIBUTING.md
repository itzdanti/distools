# Contributing

Thanks for wanting to help. This project is a static site of small, single-purpose Discord
utilities, and it stays healthy by keeping each one genuinely small.

The short version:

1. Put the logic in `src/lib/core/` as a pure function. No React, no DOM.
2. Register the tool in `src/tools/registry.ts` and build its page under `src/tools/`.
3. If it should be callable over the API, add an endpoint in `src/lib/core/api.ts`.
4. Run `npm run verify`. If it is green, open a pull request.

Before you start on anything larger than a typo, open an issue so we can agree on the approach.

## Two rules that are not negotiable

- **No endpoint ever accepts a webhook URL.** A webhook URL is a password. The API must refuse to
  take one, so it can never be logged or relayed.
- **No tool gains a network call it does not need.** The privacy page has to stay true. If a tool
  can work entirely in the browser, it must.

## Setting up

You need Node 20 or newer. There is no `.env`, no database and no backend.

```bash
git clone https://github.com/itzdanti/distools.git
cd distools
npm install
npm run dev
```

The dev server is at `http://localhost:5173`.

## Project layout

| Path | What lives there |
|---|---|
| `src/lib/core/` | Pure logic: text transforms, snowflake maths, permissions, the API registry. No React. |
| `src/tools/` | The tool components and the registry that lists them. |
| `src/pages/` | Route-level pages: home, tool, about, docs, API response. |
| `src/components/` | Shared UI: buttons, panels, inputs, the API reference panel. |
| `content/docs/` | The documentation, as MDX. |
| `scripts/` | Build and test utilities. `scripts/tests/` holds the test suites. |
| `DISTOOLS_CONFIG` | Service-wide settings. Only edit it if you are deploying your own copy. |

## Adding a tool

1. Add a pure function to the relevant file in `src/lib/core/`, or a new file if it is a new
   category. Keep it dependency-free and testable.
2. Add the component in `src/tools/<category>.tsx`. Use the shared components from
   `src/components/ui.tsx` rather than raw HTML.
3. Add an entry to `TOOLS` in `src/tools/registry.ts` with a slug, name, description, icon,
   category and keywords. Set `needsNetwork: true` only if it really makes a request.
4. If it should be callable, add an endpoint to `src/lib/core/api.ts`. It shows up in the docs and
   the OpenAPI file automatically.

## Tests

```bash
npm run tests    # config, API, routes, dist and live-server suites
npm run verify   # lint, then tests
```

`npm run tests` covers:

- `test:config` — parses the shipped `DISTOOLS_CONFIG` and checks the format rules.
- `test:api` — the API handler, in process.
- `test:routes` — renders every tool and every page, failing on any throw.
- `test:dist` — checks the files a deploy would publish.
- `test:serve` — boots the dev and preview servers and makes real HTTP requests.

If you add a tool, `test:routes` picks it up automatically. If you add an endpoint, consider adding
an assertion to `scripts/tests/api.ts`.

## Configuration

`DISTOOLS_CONFIG` at the repository root holds the service name, deploy domain, repository and
support links, licence name, and privacy/terms/takedown contacts. It is parsed at build time and
shown in the app's metadata, footer and About page. Most contributors never need to touch it.

## Style

- The codebase favours explained code over clever code. Comments should say *why*, not *what*.
- No comments that restate the next line.
- Match the formatting of the file you are editing. `npm run lint` is the arbiter.
- British spelling in prose ("licence", "colour"), except in identifiers and API fields.

## Commit messages

Write the subject in the imperative mood, as a sentence: `Add snowflake countdown tool`. Keep the
body for the reasoning if it is not obvious.

## Pull requests

- One focused change per pull request.
- Fill in the pull request template.
- Make sure `npm run verify` passes.
- Link the issue it addresses, if there is one.

## Code of conduct

By taking part you agree to the [Code of Conduct](CODE_OF_CONDUCT.md).

## Security and support

Do not report a vulnerability in a public issue or pull request — follow [SECURITY.md](SECURITY.md).
For usage questions see [SUPPORT.md](SUPPORT.md).

## Licence

Contributions are accepted under the project's existing licence. See [LICENSE](LICENSE).
