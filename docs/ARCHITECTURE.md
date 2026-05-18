# Architecture

## Entry point

`src/Core.js` exports a factory that returns the `botkit` controller object. Host applications require this module, pass config, register skills/plugins, then call `boot()`.

## Boot sequence

`boot()` waits for three subsystems before firing `booted`:

1. **Database** — `src/features/database.js` emits `boot:database_connected`
2. **Webserver** — `src/features/webserver.js` emits `boot:webserver_up`
3. **Plugins** — `src/features/plugin_loader.js` emits `boot:plugins_loaded`

## Core features (`src/features/`)

| Module | Role |
|---|---|
| `conversation.js` | Multi-turn conversation state and script execution |
| `studio.js` | Studio script editor/runtime integration |
| `middleware.js` | Before/after script hooks |
| `events.js` | Event queue and triggering |
| `understand_*.js` | Message routing, sessions, remote triggers |
| `API.js` | HTTP API surface for Studio |
| `plugin_loader.js` | Loads plugins from `src/plugins/` |

## Plugins (`src/plugins/`)

Built-in plugins include `activate` and `plugin_manager`. Each plugin can export `web` routes and views. `src/plugins/index.js` is a minimal homepage example.

## Message flow

1. Host calls `botkit.receive(bot, message)`
2. `ingest` → `understand` (match triggers / scripts)
3. Matched script runs via `createConversation` → `fulfill`

## Adding a plugin

1. Create a directory under `src/plugins/<name>/` with `plugin.js` exporting `name`, optional `web` routes, and handlers
2. Register loading order via the plugin manager or host app configuration
3. Add any views under `views/` and static assets under `public/` as needed
