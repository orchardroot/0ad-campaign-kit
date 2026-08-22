# 0ad-island-warfare

Eight home-made campaigns for [0 A.D.](https://play0ad.com) Release 28 "Boiorix", four of them built on one stubborn conviction: the best way to play a real-time strategy game is from a boat.

I'm a new-ish 0 A.D. player who kept picking the island maps, kept losing the sea, and kept wishing the game had a course that taught naval play instead of hoping you'd work it out under fire. So I wrote one. Then three more. Every mission puts each nation on its own island — nothing reaches you that didn't sail — and each level teaches exactly one idea before it unlocks the next.

Also here: a cheat-sheet of every naval map I've found (vanilla + mods), with the settings for a game you can play with a cup of tea in the other hand.

## The campaigns

| Campaign | Missions | Difficulty | What it teaches |
|---|---|---|---|
| **Admiral's Course — Island Warfare** | 7, gated | Sandbox → Easy | The basics: docks, fishing, warship types, migration, sea control, beach defence, landings, and a free-for-all exam |
| **Island Nations — One Nation, One Island** | 8, gated | Easy → Medium | Island empire-building: colonising empty islands, mining outposts, forward naval bases, FFA patience, wadeable fords, harbours, choosing your beach, and a four-way archipelago exam |
| **Sea Powers — Wars of the Islands** | 7, open | Easy / Medium | Historical matchups on island maps, play in any order: Salamis, the Peloponnesian War, Tyre, the Balearics, the Punic War for Corsica, Cyprus, Britannia |
| **Iron Admiral — Community Maps** | 6, gated | Medium | The big maps from [Community Maps 2](https://mod.io/g/0ad/m/community-maps-2): raiding, two-front wars, 3v3, Rapa Nui, and an eight-player Aegean finale |

Suggested order: Admiral's Course → Island Nations → Iron Admiral, with Sea Powers whenever you fancy a story. Iron Admiral needs the free Community Maps 2 mod enabled; everything else is vanilla.

### Mission lists

<details>
<summary><b>Admiral's Course</b> (<code>campaigns/island_warfare.json</code>)</summary>

1. **Harbour Sandbox** — docks, fishing, warship types, transports (zero pressure)
2. **The Fishing Fleet** — running an economy on fish and sea trade
3. **The Crossing** — migration: ferry your civilisation to a new home
4. **Rule the Waves** — winning sea control
5. **Hold the Beach** — defending against amphibious assault
6. **The Landing** — combined-arms landings with an AI ally
7. **Admiral's Exam** — free-for-all archipelago graduation
</details>

<details>
<summary><b>Island Nations</b> (<code>campaigns/island_nations.json</code>)</summary>

1. **One Island Each** (Islands) — colonise a second island
2. **The Cyclades** — mining outposts on empty islets
3. **The Aegean Divide** — forward naval bases on mid-sea islands
4. **Three Kings** (Islands, 3-way FFA) — let the AIs bleed each other first
5. **The Searocks** (Snowflake Searocks, 2v2) — defend the fords, win at sea
6. **Harbour Wars** (Harbor) — first Medium duel
7. **Corsica against Sardinia** — picking the right beach
8. **Thalassocracy** (Archipelago, 4-way FFA) — the exam
</details>

<details>
<summary><b>Sea Powers</b> (<code>campaigns/sea_powers.json</code>)</summary>

- **Salamis, 480 BC** — Athens vs Persia (Aegean Sea)
- **Peloponnesian War, 431 BC** — Athens vs Sparta + Macedon (Cycladic Archipelago 3p)
- **Tyre, 332 BC** — Macedon vs Persia (Islands)
- **The Balearics, 240 BC** — Carthage vs Iberians (Islands)
- **Punic War, 259 BC** — Carthage vs Rome (Corsica)
- **Cyprus, 306 BC** — Ptolemies vs Seleucids (Harbor)
- **Britannia, 55 BC** — Britons vs Rome (Northern Island)
</details>

<details>
<summary><b>Iron Admiral</b> (<code>campaigns/iron_admiral.json</code>)</summary>

1. **Coastline: The Raiders** — long shore, little wood, constant raiding
2. **Volcanic Island** — the two-fleet system
3. **Northern Islands: Two Fronts** (2v2) — a land border *and* a sea war
4. **Caribbean Island** (3v3) — hold the mountain, be the team's navy
5. **Rapa Nui: King of the Sea** — flank the fort by boat
6. **Aegean Archipelago: The Great War** (4v4, 8 players) — the finale
</details>

## Also in here: two land campaigns

Before the boats, there were these. They live in the same folder because they live in the same `user` mod, and because a campaign that only exists on one Mac is a campaign waiting to be lost.

- **Boot Camp — Learning the Ropes** (`campaigns/bootcamp.json`) — eleven missions, gated. Starts with the two built-in tutorials, then a Roman sandbox, then a slow climb through first command, a duel, a siege defence, booming, aggression, a naval detour and a graduation. What I wish I'd been handed on day one.
- **Great Battles of Antiquity** (`campaigns/great_battles.json`) — five hand-made scenarios from the base game, playable in any order: the Tiber, the Third Macedonian War, Migration, Death Canyon, Gold Rush.

Neither needs a mod. Both are dry land, and I'm told some people prefer it.

## And two for the overhaul mods

The big total-conversion mods ship almost no campaigns between them — Millennium A.D. has none at all, and Delenda Est's single offering routes three of its fifteen levels through vanilla random maps, which its own author warns are unreliable in the mod. One of those sits at level five and gates everything after it.

So: two more courses, same structure as the rest, skirmish maps only.

- **(Delenda Est) Journey through the World — Rebuilt** (`campaigns/de_journey.json`) — ten missions, gated. Coin and Glory (the mod runs six resources, not four), choosing your Roman general, capturing mercenary camps, farming enriched ground, and a game with one of the twenty-odd factions the base game hasn't got. Finishes 3v3 on Two Seas.
- **(Millennium A.D.) Six Crowns** (`campaigns/mad_six_crowns.json`) — ten missions, gated, AD 500–1000. One faction per mission for the first six — Norse, Anglo-Saxons, Byzantines, Carolingians, Umayyads, Rus — then free choice, a team game, and a finale in the deep forest. Uses all ten maps the mod ships.

Campaign names are prefixed with the mod they need, because the `user` mod is always loaded and the campaign menu otherwise shows all eight side by side with nothing to tell you which is which. Use round brackets, not square ones — 0 A.D.'s GUI parses `[...]` as markup, so a `[Vanilla]` prefix throws "Invalid tag" on the campaign screen and gets swallowed instead of displayed. `(Vanilla)` ones run on the base game; the other two need their mod enabled **on its own**, not stacked with map packs.

## Install

Copy the campaigns into 0 A.D.'s always-loaded `user` mod:

```sh
mkdir -p ~/Library/Application\ Support/0ad/mods/user/campaigns
cp campaigns/*.json ~/Library/Application\ Support/0ad/mods/user/campaigns/
```

(Linux: `~/.local/share/0ad/mods/user/campaigns/`.) They then appear under **Single-player → Campaigns → New**.

## How the missions work

Every mission opens the normal game-setup screen with the map locked in, and the mission description tells you the player count, teams and AI difficulty to set.

That works because each level sets `"useGameSetup": true`. It's worth knowing what that flag does, because the campaign format is barely documented and the failure is silent: with it, the setup screen opens with the map locked *and Petra AI is assigned automatically to every non-human slot*, at whatever difficulty `gui.gamesetup.aidifficulty` holds. Without it, the level launches straight into the map with **no AI at all** — you get a map, an opponent slot, and nobody in it. Leave it off deliberately for tutorials and sandboxes; set it everywhere else.

Two other fields are not optional. `Order` must list every level key: the campaign menu sorts with `Order.indexOf(...)` and throws `TypeError: this.run.template.Order is undefined` without it, so the campaign won't open at all. `ShowUnavailable` lets you see the whole course from the start.

Don't set `Preview` on a level at all. It looks like a convenience and it's a trap: the campaign menu builds a GUI sprite from it, and GUI sprites resolve under `art/textures/ui/`, so the value has to be the full `session/icons/mappreview/foo.png` path — *not* the bare `foo.png` that a map's own `settings.Preview` uses. Get it wrong and you get a magenta box. Omit the field entirely and `MapCache.getMapPreview()` reads the map's own declaration, prepends the right directory, and falls back to `nopreview.png`. It's self-maintaining and works for maps from any mod.

One more trap, since campaign names are displayed through the GUI's markup parser: never put square brackets in a campaign or level name. `[...]` is tag syntax, so a `[Vanilla]` prefix throws "Invalid tag" and gets swallowed rather than shown. Round brackets are fine.

Gating uses `Requires`, with `ShowUnavailable` so you can see the whole course from the start and know what you're working towards.

## The cheat-sheet

[`docs/island-maps-cheatsheet.md`](docs/island-maps-cheatsheet.md) — every ship-friendly map in vanilla 0 A.D. and the mod.io map packs, which campaign missions use them, and settings recipes ranging from "totally chill boat-building afternoon" to "eight players, let chaos reign".

## Contributing

If you know a good island map I've missed, or a mission that would teach something these don't, open an issue or a PR. Campaign files are plain JSON — the hardest part is the prose.

---

*orchardroot — made in Cheshire, a long way from the sea, under the supervision of two cats.*
