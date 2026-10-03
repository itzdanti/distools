# Security Policy

## Reporting a vulnerability

Please report security issues privately. Do **not** open a public issue for anything that could be
exploited before it is fixed.

Email **distools@itzdanti.dev** with:

- what the issue is and where it lives (file, route or tool),
- the steps to reproduce it,
- what an attacker could do with it,
- and any proof-of-concept you have.

You will get an acknowledgement within a few days. If the report is valid, a fix and a credit (if
you want one) will follow. If it is not, you will get an explanation of why.

## Scope

This is a static site. There is no server, no database, no account system and no session to
attack, which removes most of the usual surface. The parts that are still worth reporting:

- **The published API client** (`/api/v1/client.js`) and the API handler in `src/lib/core/api.ts`.
  Input that causes a crash, a hang, or output that is unsafe to inject into a page.
- **Cross-site scripting.** Any place where user input or a Discord response reaches the DOM
  without being escaped.
- **Data exposure.** A code path that sends a value somewhere it should not, or logs one.
- **Supply chain.** A dependency that is malicious or has a known serious advisory.

## Out of scope

- The absence of a backend. It is intentional; the site is a static bundle.
- Discord returning `401` for anonymous guild and profile lookups. That is Discord's behaviour,
  documented on the [privacy page](https://distools.itzdanti.dev/docs/privacy), not a flaw here.
- Requests that only work because the caller supplied a webhook URL they own.
- Rate limiting. There is no server to rate limit.
- Anything that requires a victim to paste a secret into a tool that tells them not to. The tools
  never transmit that input; see the privacy page.

## What we will never ask you for

A maintainer will never ask for your Discord password, token, or 2FA code. Anyone who does is
impersonating the project. If that happens, report it to the address above.

## Takedown and legal requests

Copyright or legal complaints should go to **legal@itzdanti.dev** instead, so they are handled
separately from security reports. See the [Terms of Service](https://distools.itzdanti.dev/terms).

## Supported versions

Only the latest deployment of the live site is supported. There are no maintained release
branches; fixes ship to `main` and are deployed from there.
