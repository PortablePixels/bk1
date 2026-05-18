# Testing

## Automated tests

This repository has no Jest/Mocha (or other) test suite. `package.json` defines `npm test` as a no-op placeholder.

## Manual verification

When changing framework behaviour:

1. Run `./build` and exercise the feature through the host application that embeds BK (e.g. Quit Coach / Botkit host).
2. For Studio UI changes, run `./watch` and reload the web interface.
3. Use `DEBUG=botkit:*` (see `debug` package usage in `src/Core.js` and features) for verbose logging.

Add automated tests here only if the team introduces a runner and CI for this repo.
