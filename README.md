# 0 A.D. Island Warfare — naval campaigns

Four custom campaigns for [0 A.D.](https://play0ad.com) Release 28 "Boiorix", all ship-centric island warfare with one nation per island — plus a cheat-sheet of every good naval map with relaxed-game settings.

## What's here

- **`campaigns/island_warfare.json`** — the Admiral's Course campaign. Seven gated missions, each teaching one naval skill:
  1. **Harbour Sandbox** — docks, fishing, warship types, transports (zero pressure)
  2. **The Fishing Fleet** — running an economy on fish and sea trade
  3. **The Crossing** — migration: ferry your civilization to a new home
  4. **Rule the Waves** — winning sea control
  5. **Hold the Beach** — defending against amphibious assault
  6. **The Landing** — combined-arms landings with an AI ally
  7. **Admiral's Exam** — free-for-all archipelago graduation
- **`campaigns/island_nations.json`** — **Island Nations — One Nation, One Island**. Eight gated missions on one-island-per-player random maps, ramping from Easy to Medium AI:
  1. **One Island Each** (Islands) — colonise a second island
  2. **The Cyclades** — mining outposts on empty islets
  3. **The Aegean Divide** — forward naval bases on mid-sea islands
  4. **Three Kings** (Islands, 3-way FFA) — free-for-all patience
  5. **The Searocks** (Snowflake Searocks, 2v2) — defend the fords, win at sea
  6. **Harbour Wars** (Harbor) — first Medium duel
  7. **Corsica against Sardinia** — picking the right beach
  8. **Thalassocracy** (Archipelago, 4-way FFA) — the exam
- **`campaigns/sea_powers.json`** — **Sea Powers — Wars of the Islands**. Seven open (ungated) historical matchups, one nation per island: Salamis (Athens vs Persia), the Peloponnesian War (Athens vs Sparta + Macedon), Tyre (Macedon vs Persia), the Balearics (Carthage vs Iberians), the Punic War for Corsica (Carthage vs Rome), Cyprus (Ptolemies vs Seleucids) and Britannia (Britons vs Rome).
- **`campaigns/iron_admiral.json`** — **Iron Admiral — Community Maps**. Six gated Medium-AI missions on [Community Maps 2](https://mod.io/g/0ad/m/community-maps-2) maps: Coastline, Volcanic Island, Northern Islands (2v2), Caribbean Island (3v3), Rapa Nui, and the eight-player Aegean Archipelago finale. Requires the CM2 mod to be enabled.
- **`docs/island-maps-cheatsheet.md`** — every naval map available (vanilla + Community Maps 2), with settings recipes for easy games.

## Install

Copy the campaigns into 0 A.D.'s always-loaded `user` mod:

```sh
mkdir -p ~/Library/Application\ Support/0ad/mods/user/campaigns
cp campaigns/*.json ~/Library/Application\ Support/0ad/mods/user/campaigns/
```

(On Linux: `~/.local/share/0ad/mods/user/campaigns/`.)

They then appear under **Single-player → Campaigns → New**.

Suggested order: Admiral's Course → Island Nations → Sea Powers (any time) → Iron Admiral. Iron Admiral (and level 7's epilogue suggestion in Admiral's Course) needs the free [Community Maps 2](https://mod.io/g/0ad/m/community-maps-2) mod enabled; everything else is vanilla.

## Design notes

- Missions use `useGameSetup: true`, which opens the match-setup screen with the map locked in. This is deliberate: campaign-launched scenario maps get no AI assigned otherwise, and it lets the player set AI difficulty per attempt (start Very Easy, replay harder). Campaign progress still records because `campaignData` rides along as a game-settings attribute.
- Mission gating uses `Requires`, with `ShowUnavailable` so the whole course is visible from the start.
