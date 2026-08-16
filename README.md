# 0 A.D. Island Warfare — Admiral's Course

A custom seven-mission learning campaign for [0 A.D.](https://play0ad.com) Release 28 "Boiorix", focused on easy-going, ship-centric island warfare — plus a cheat-sheet of every good naval map with relaxed-game settings.

## What's here

- **`campaigns/island_warfare.json`** — the Admiral's Course campaign. Seven gated missions, each teaching one naval skill:
  1. **Harbour Sandbox** — docks, fishing, warship types, transports (zero pressure)
  2. **The Fishing Fleet** — running an economy on fish and sea trade
  3. **The Crossing** — migration: ferry your civilization to a new home
  4. **Rule the Waves** — winning sea control
  5. **Hold the Beach** — defending against amphibious assault
  6. **The Landing** — combined-arms landings with an AI ally
  7. **Admiral's Exam** — free-for-all archipelago graduation
- **`docs/island-maps-cheatsheet.md`** — every naval map available (vanilla + Community Maps 2), with settings recipes for easy games.

## Install

Copy the campaign into 0 A.D.'s always-loaded `user` mod:

```sh
mkdir -p ~/Library/Application\ Support/0ad/mods/user/campaigns
cp campaigns/island_warfare.json ~/Library/Application\ Support/0ad/mods/user/campaigns/
```

(On Linux: `~/.local/share/0ad/mods/user/campaigns/`.)

It then appears under **Single-player → Campaigns → New**.

Level 7's epilogue suggestion (Aegean Archipelago 8p) needs the free [Community Maps 2](https://mod.io/g/0ad/m/community-maps-2) mod; everything else is vanilla.

## Design notes

- Missions use `useGameSetup: true`, which opens the match-setup screen with the map locked in. This is deliberate: campaign-launched scenario maps get no AI assigned otherwise, and it lets the player set AI difficulty per attempt (start Very Easy, replay harder). Campaign progress still records because `campaignData` rides along as a game-settings attribute.
- Mission gating uses `Requires`, with `ShowUnavailable` so the whole course is visible from the start.
