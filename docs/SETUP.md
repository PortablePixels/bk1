# Setup

## Prerequisites

- Node.js (compatible with dependencies in `package.json` — legacy Express 4 / Mongoose 5 stack)
- [Bower](https://bower.io/) for front-end vendor packages
- Sass CLI for compiling `sass/styles.scss`

## Install

```sh
npm install
./build
```

`./build` runs `bower install` and compiles Sass to `public/css/`.

## Environment

| Variable | Description |
|---|---|
| `PORT` | HTTP port for the Studio webserver (default `3000`) |
| `APP_ENV` | Environment label (default `local`) |
| `USERS` | Admin basic-auth users for the Studio UI (parsed by `parseAdminUsers`) |
| `PROXY_IP` | Trust proxy setting (default `true`) |

MongoDB connection strings and other bot runtime config are typically supplied by the host application that embeds BK, not by this repo alone.

## CSS during development

```sh
./watch
```

Runs `sass --watch sass:public/css` — use alongside your host app when editing Studio styles.
