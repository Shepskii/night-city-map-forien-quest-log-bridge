# Night City Map - Forien's Quest Log Bridge

A standalone Foundry VTT module that synchronizes gigs from [Night City Map](https://github.com/samroaleksej-bit/night-city-map) into [Forien's Quest Log](https://github.com/Forien/foundryvtt-forien-quest-log).

## Requirements

- Foundry VTT v12 or v13
- Night City Map
- Forien's Quest Log

Install this folder as `Data/modules/night-city-map-forien-quest-log-bridge` and enable it with both required modules. Synchronization runs on the active GM client.

## Status mapping

| Night City Map | Forien's Quest Log |
|---|---|
| Hidden | Inactive (hidden from players) |
| Offer | Available |
| Active / accepted | Active |
| Done | Completed |
| Failed | Failed |

The bridge also mirrors the gig title, description, fixer, reward, and GM notes. Map UI changes trigger synchronization directly; a lightweight one-second check covers changes made through other paths. The current state is reconciled when Forien's Quest Log finishes initializing.

When a gig is deleted from Night City Map, its linked Forien's Quest Log entry is deleted as well. The bridge only removes entries carrying its own gig-link flag; unrelated quest log entries are left untouched.

## Unofficial content

Pneuma's Combat Tools is unofficial content provided under the Homebrew Content Policy of R. Talsorian Games and is not approved or endorsed by RTG. This content references materials that are the property of R. Talsorian Games and its licensees.