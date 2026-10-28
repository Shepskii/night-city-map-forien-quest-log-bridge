# Night City Map - Forien's Quest Log Bridge

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
