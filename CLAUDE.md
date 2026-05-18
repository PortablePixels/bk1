# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Essentials

- BK 1.0 is a fork of Botkit Studio — conversational bot framework code, not a deployable API service on its own.
- Entry point for the framework is `src/Core.js`; features live under `src/features/`, plugins under `src/plugins/`.
- Frontend assets use Bower (`bower.json`) and Sass (`sass/` → `public/css/`). Run `./build` after clone; use `./watch` for CSS during UI work.
- `npm test` is a placeholder — there is no automated test suite in this repo.

## Documentation

Always read the relevant doc before working in that area. Detailed guidance lives in `docs/` — extend those rather than this file.

| Doc | What it covers |
|---|---|
| [docs/SETUP.md](docs/SETUP.md) | Prerequisites, install, Bower/Sass, environment variables |
| [docs/BUILD.md](docs/BUILD.md) | Build scripts, static assets, local web UI |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Core boot sequence, features, plugins, conversations |
| [docs/TESTING.md](docs/TESTING.md) | Test status (none) and manual verification |
