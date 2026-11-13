# Night City Map - Forien's Quest Log Bridge

![Foundry v12](https://img.shields.io/badge/Foundry-v12-informational)
![System](https://img.shields.io/badge/system-cyberpunk--red--core-e5233d)
![License: MIT](https://img.shields.io/badge/license-MIT-green)

A standalone Foundry VTT module that synchronizes gigs from Night City Map into Forien's Quest Log.

## Requirements

- Foundry VTT v12
- Cyberpunk RED Core
- [Night City Map](https://github.com/samroaleksej-bit/night-city-map) (checked against v0.21.0)
- [Forien's Quest Log](https://github.com/Forien/foundryvtt-forien-quest-log)

## Installation

Unzip the release folder to the `Data\Modules` folder in your Foundry instance - `Data/modules/night-city-map-forien-quest-log-bridge`. Enable the module. 

Or install through Foundry with the manifest: https://github.com/Shepskii/night-city-map-forien-quest-log-bridge/releases/latest/download/module.json

While loaded in your World, enable Night City Map - Forien's Quest Log Bridge in the Module Management.

## Features

Gigs created via Night City Map are automatically added to Forien's Quest Log as a new quest with the appropriate status (see ## Status Mapping below)

The bridge mirrors the gig title, description, fixer, reward, and GM notes. Line breaks in the gig's text are kept, so a generated gig's description reads as it does on the map. Synchronization runs whenever Night City Map saves a change to its gigs, however it was made (map, Agent phone, another GM); it does not poll or touch the map's own code. The current state is reconciled when Forien's Quest Log finishes initializing.

When a gig is deleted from Night City Map, its linked Forien's Quest Log quest is deleted as well, and unlinked cleanly first: if you nested it under another quest, or nested quests under it, those links are tidied the way the Quest Log does when you delete a quest yourself. The bridge only removes entries carrying its own gig-link flag; unrelated quest log entries are left untouched.

Synchronization runs on the active GM client.

## Status Mapping

| Night City Map | Forien's Quest Log |
|---|---|
| Hidden | Inactive (hidden from players) |
| Offer | Available |
| Active / accepted | Active |
| Done | Completed |
| Failed | Failed |

## Unofficial Content

Night City Map - Forien's Quest Log Bridge is unofficial content provided under the Homebrew Content Policy of R. Talsorian Games and is not approved or endorsed by RTG. This content references materials that are the property of R. Talsorian Games and its licensees.

## License

Copyright (c) 2026 Shepskii. Licensed under the [Mozilla Public License 2.0](LICENSE). Versions up to and including 0.2.1 were released under the MIT License and stay available under it.

This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not distributed with this file, You can obtain one at https://mozilla.org/MPL/2.0/.
