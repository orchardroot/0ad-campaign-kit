# 0 A.D. Campaign Kit

Ten campaigns, two maps, two tools and one piece of documentation for
[0 A.D.](https://play0ad.com) **Release 28 "Boiorix"** — including courses for
the two big overhaul mods, which ship almost no campaigns of their own.

I'm a new-ish player who kept choosing the island maps, kept losing the sea, and
kept wishing the game had a course that taught naval war instead of hoping I'd
work it out under fire. So I wrote one. Then nine more, and by then I'd learned
enough about the campaign format the hard way that it seemed worth writing down.

## Install

```sh
git clone https://github.com/orchardroot/0ad-campaign-kit
cd 0ad-campaign-kit
./install.sh
```

Campaigns go into the always-loaded `user` mod, and the maps install as a mod
you enable in **Settings → Mod Selection**. Then **Single-player → Campaigns → New**.

`--config` also installs my `local.cfg` (detailed tooltips, a game clock,
building edge-snap, further camera zoom). `--dry-run` shows what it would do.
`--uninstall` removes it again, leaving your saves and progress alone.

macOS and Linux. On Windows, copy `campaigns/` to
`%appdata%\0ad\mods\user\campaigns` and `mod/` to `%appdata%\0ad\mods\campaign-kit-maps`.

## Read the prefix

Every campaign name starts with the mod it needs, because the `user` mod loads
whatever else is enabled — so all ten always appear in the menu, whether or not
the mod they depend on is switched on.

| Prefix | Enable |
|---|---|
| **(Vanilla)** | nothing — base game |
| **(Delenda Est)** | `mod public 0ad_delenda_est_r28`, on its own |
| **(Millennium A.D.)** | `mod public millenniumad`, on its own |

**Total conversions must be enabled alone** — not stacked with map packs, and
never with each other. They delete vanilla content wholesale, and load order is
last-wins, so two of them together means the second quietly guts the first.
`tools/audit-mods.py` will tell you exactly what a given mod set breaks.

## The campaigns

### Vanilla — the naval course

| Campaign | Missions | Difficulty | What it teaches |
|---|---|---|---|
| **Admiral's Course — Island Warfare** | 7, gated | Sandbox → Easy | Docks, fishing, warship types, migration, sea control, beach defence, landings, and a free-for-all exam |
| **Island Nations — One Nation, One Island** | 8, gated | Easy → Medium | Colonising empty islands, mining outposts, forward naval bases, FFA patience, fords, harbours, choosing your beach |
| **Sea Powers — Wars of the Islands** | 7, open | Easy / Medium | Historical matchups, any order: Salamis, the Peloponnesian War, Tyre, the Balearics, Corsica, Cyprus, Britannia |
| **Iron Admiral — Community Maps** | 6, gated | Medium | The big maps from [Community Maps 2](https://mod.io/g/0ad/m/community-maps-2): raiding, two fronts, 3v3, Rapa Nui, an eight-player finale |

Order: Admiral's Course → Island Nations → Iron Admiral, with Sea Powers
whenever you fancy a story. Iron Admiral needs Community Maps 2.

### Vanilla — dry land

| Campaign | Missions | What it is |
|---|---|---|
| **Boot Camp — Learning the Ropes** | 11, gated | What I wish I'd been handed on day one. The two built-in tutorials, a sandbox, then first command, a duel, a siege defence, booming, aggression, a naval detour, graduation |
| **Great Battles of Antiquity** | 5, open | The base game's hand-made scenarios: the Tiber, the Third Macedonian War, Migration, Death Canyon, Gold Rush |

### Delenda Est

| Campaign | Missions | What it is |
|---|---|---|
| **Journey through the World — Rebuilt** | 10, gated | A course in the mod's own systems rather than a map tour: Coin and Glory, choosing your Roman general, capturing mercenary camps, farming enriched ground, a game as one of the factions the base game hasn't got |
| **Museum — A Tour of the Mod** | 13, open | Unit portraits, the hero roster, ship combat, formation testing, Napata and Noba reconstructions, Roman eyecandy. No opponents — for looking, not fighting |

[Delenda Est](https://github.com/JustusAvramenko/delenda_est) ships one campaign,
and it routes three of its fifteen levels through vanilla random maps its own
author warns are unreliable in the mod — one of them at level five, gating
everything after it. Rebuilt uses skirmish maps only.

### Millennium A.D.

| Campaign | Missions | What it is |
|---|---|---|
| **Six Crowns** | 10, gated | One faction per mission for the first six — Norse, Anglo-Saxons, Byzantines, Carolingians, Umayyads, Rus — then free choice, a team game, and a finale in the deep forest. Uses all ten maps the mod ships |
| **Museum — A Tour of the Mod** | 10, open | The four per-faction structure showcases, the units demo, the Norse sandbox |

[Millennium A.D.](https://github.com/0ADMods/millenniumad) ships no campaigns at all.

## The maps

`mod/` installs as **Campaign Kit Maps**. Both are random maps, so they take any
size and player count.

**Halcyon** — a golden-hour archipelago, 2–8 players. Every nation gets its own
island; nothing reaches you that didn't sail. Home islands carry only their
starting mines, and nearly all the stone and metal sits on contested mid-sea
islets, deliberately offset from the player lanes so nobody owns one by default.
Fish are generous, because a naval economy should be viable. Three biomes:
**Golden Hour**, **Squall**, **Moonlight**.

**The Narrows** — two shores split by a navigable strait, 2–6 players, allies on
the same side. Mainland metal is thin and every mid-channel islet has three
mines, so holding the water has a concrete payoff rather than a notional one.
Built for the sea-control lesson.

## Tools

```sh
tools/validate-campaigns.py               # lint every campaign
tools/validate-campaigns.py --installed   # missing maps are errors, not warnings

tools/audit-mods.py                       # what does my current mod set break?
tools/audit-mods.py --mods "mod public 0ad_delenda_est_r28"
```

**`validate-campaigns.py`** catches the things that fail silently: a missing
`Order`, a missing `useGameSetup`, square brackets in a name, a bare-filename
`Preview`, dangling `Requires`, gating cycles, and map references that don't
resolve against the base game plus your installed mods. Exits non-zero, so it
works as a pre-commit hook.

**`audit-mods.py`** resolves the virtual filesystem for a mod chain — honouring
load order and `.DELETED` masking — and reports which missions survive it. Pass
`--mods` to test a chain you haven't committed to yet. It also warns when two
total conversions are enabled together and tells you which one wins.

For the record, on my machine: Delenda Est ships **285 `.DELETED` markers** and
breaks **11 of the 44 vanilla missions** here, including all five Great Battles.
That's by design, not a fault. It's also exactly the sort of thing you'd rather
find out from a tool than from a loading screen.

## Documentation

**[`docs/campaign-format.md`](docs/campaign-format.md)** — the campaign format
and the bits nobody wrote down. The system is officially experimental and barely
documented, and it fails silently in at least five interesting ways: `Order` is
mandatory or the menu throws; `useGameSetup` is what gives you an opponent, and
without it your enemy slot is simply empty; square brackets in a name are parsed
as GUI markup and swallowed; `Preview` takes a different value here than it does
in a map file; and scenario maps launched directly get no AI either. Every claim
is cited to the relevant file inside `public.zip`.

**[`docs/island-maps-cheatsheet.md`](docs/island-maps-cheatsheet.md)** — every
ship-friendly map I've found, vanilla and modded, with settings ranging from
"boat-building afternoon" to "eight players, let chaos reign".

## How the missions work

Each mission opens the normal game-setup screen with the map locked in, and the
description tells you the player count, teams and AI difficulty to set. That
works because every level sets `"useGameSetup": true`, which also assigns Petra
AI to each non-human slot at your configured difficulty. Levels that should have
no opponent say `"useGameSetup": false` explicitly — the game treats false and
absent identically, so the difference is intent, which is what the linter reads.

Gating uses `Requires`, with `ShowUnavailable` so you can see the whole course
from the start and know what you're working towards.

## Contributing

Campaign files are plain JSON — the hardest part is the prose. If you know a
good island map I've missed, or a mission that would teach something these
don't, open an issue or a PR. Run `tools/validate-campaigns.py` first and it'll
catch the silent ones.

---

*orchardroot — made in Cheshire, a long way from the sea, under the supervision
of two cats.*
