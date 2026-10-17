# Night City Map - Forien's Quest Log Bridge

A standalone Foundry VTT module that synchronizes gigs from Night City Map into Forien's Quest Log.

## Requirements

- Foundry VTT v12
- Cyberpunk RED Core
- [Night City Map](https://github.com/samroaleksej-bit/night-city-map)
- [Forien's Quest Log](https://github.com/Forien/foundryvtt-forien-quest-log)

## Installation

Install this folder as `Data/modules/night-city-map-forien-quest-log-bridge` and enable it with both required modules. 

## Features

Gigs created via Night City Map are automatically added to Forien's Quest Log as a new quest with the appropriate status (see ## Status Mapping below)

The bridge mirrors the gig title, description, fixer, reward, and GM notes. Map UI changes trigger synchronization directly; a lightweight one-second check covers changes made through other paths. The current state is reconciled when Forien's Quest Log finishes initializing.

When a gig is deleted from Night City Map, its linked Forien's Quest Log entry is deleted as well. The bridge only removes entries carrying its own gig-link flag; unrelated quest log entries are left untouched.

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