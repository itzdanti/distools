<!--
Thanks for the pull request. Keep it to one focused change, and make sure `npm run verify` passes.
-->

## What this changes

<!-- A sentence or two. What did you change, and why? -->

## Type of change

- [ ] Bug fix
- [ ] New tool
- [ ] New or changed API endpoint
- [ ] Documentation
- [ ] Refactor or chore
- [ ] Something else

## Related issue

<!-- Link the issue this closes or addresses, e.g. "Closes #12". Delete if there is none. -->

## Checklist

- [ ] `npm run verify` passes locally.
- [ ] I tested the change in a browser, not just through the build.
- [ ] The tool logic is pure and lives in `src/lib/core/`, with no React or DOM access.
- [ ] If I added a tool, I registered it in `src/tools/registry.ts`.
- [ ] If I added an endpoint, it appears in the generated docs and I considered a test.
- [ ] No endpoint accepts a webhook URL.
- [ ] No tool gained a network request it does not strictly need.
- [ ] I did not commit any secret, token, or real webhook URL.
