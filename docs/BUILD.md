# Build

## Static assets

```sh
./build
```

Equivalent to:

```sh
bower install
sass --update sass:public/css
```

Output CSS lands in `public/css/`. Do not edit generated CSS by hand — change `sass/styles.scss` and rebuild.

## npm scripts

| Script | Purpose |
|---|---|
| `npm test` | Placeholder only — exits with "no test specified" |

There is no TypeScript compile step; the framework is plain CommonJS under `src/`.

## Local Studio UI

The webserver feature (`src/features/webserver.js`) serves Handlebars views from `views/`, static files from `public/`, and plugin UIs from `src/plugins/*/views/`. A consuming app must call `botkit.boot()` and wire database + webserver events — see [ARCHITECTURE.md](ARCHITECTURE.md).
