# 0 A.D. Campaign Kit

Ten campaigns, two maps, two tools and a bit of documentation for
[0 A.D.](https://play0ad.com) **Release 28 "Boiorix"**. That includes courses for
the two big overhaul mods, which between them ship almost nothing in the way of
campaigns.

I'm a fairly new player who kept picking the island maps, kept losing the sea,
and kept wishing someone had written a course that taught naval war instead of
leaving you to work it out while being sunk. So I wrote one. Then nine more. By
that point I'd learned enough about the campaign format the hard way that it
seemed daft not to write it down.

## Install

```sh
git clone https://github.com/orchardroot/0ad-campaign-kit
cd 0ad-campaign-kit
./install.sh
```

The campaigns go in the always-loaded `user` mod. The maps install as a mod you
turn on in **Settings, Mod Selection**. Then **Single-player, Campaigns, New**.

`--config` also drops in my `local.cfg` (detailed tooltips, a game clock,
building edge-snap, a bit more camera zoom). `--dry-run` tells you what it would
do without doing it. `--uninstall` takes it all back out and leaves your saves
and progress where they are.

macOS and Linux. On Windows, copy `campaigns/` into
`%appdata%\0ad\mods\user\campaigns` and `mod/` into
`%appdata%\0ad\mods\campaign-kit-maps`.

## Read the prefix

Every campaign name starts with the mod it needs. The `user` mod loads whatever
else is switched on, so all ten show up in the menu whether or not the mod they
depend on is actually enabled. The prefix is there to stop you picking the wrong
one.

| Prefix | What to enable |
|---|---|
| **(Vanilla)** | nothing, base game |
| **(Delenda Est)** | `mod public 0ad_delenda_est_r28`, on its own |
| **(Millennium A.D.)** | `mod public millenniumad`, on its own |

**Run total conversions on their own.** Not stacked with map packs, and never
with each other. They delete vanilla content wholesale, and load order is
last-wins, so two together means the second quietly guts the first.
`tools/audit-mods.py` will tell you what any given mod set breaks before you
find out the hard way.

## The campaigns

### Vanilla, the naval course

| Campaign | Missions | Difficulty | What it teaches |
|---|---|---|---|
| **Admiral's Course, Island Warfare** | 7, gated | Sandbox to Easy | Docks, fishing, warship types, migration, sea control, beach defence, landings, then a free-for-all exam |
| **Island Nations, One Nation One Island** | 8, gated | Easy to Medium | Colonising empty islands, mining outposts, forward naval bases, patience in a FFA, fords, harbours, picking your beach |
| **Sea Powers, Wars of the Islands** | 7, open | Easy / Medium | Historical matchups in any order: Salamis, the Peloponnesian War, Tyre, the Balearics, Corsica, Cyprus, Britannia |
| **Iron Admiral, Community Maps** | 6, gated | Medium | The big maps from [Community Maps 2](https://mod.io/g/0ad/m/community-maps-2): raiding, two fronts, 3v3, Rapa Nui, an eight-player finale |

Sensible order is Admiral's Course, then Island Nations, then Iron Admiral, with
Sea Powers whenever you fancy a story instead of a lesson. Iron Admiral needs
Community Maps 2.

### Vanilla, dry land

| Campaign | Missions | What it is |
|---|---|---|
| **Boot Camp, Learning the Ropes** | 11, gated | What I wish someone had handed me on day one. Both built-in tutorials, a sandbox, then first command, a duel, a siege defence, booming, aggression, a naval detour and a graduation |
| **Great Battles of Antiquity** | 5, open | The base game's hand-made scenarios: the Tiber, the Third Macedonian War, Migration, Death Canyon, Gold Rush |

### Delenda Est

| Campaign | Missions | What it is |
|---|---|---|
| **Journey through the World, Rebuilt** | 10, gated | A course in the mod's own systems rather than a tour of its maps. Coin and Glory, picking your Roman general, taking mercenary camps, farming the good ground, and a game as one of the factions the base game hasn't got |
| **Museum, A Tour of the Mod** | 13, open | Unit portraits, the hero roster, ship combat, formation testing, the Napata and Noba reconstructions, Roman eyecandy. No opponents. It's for looking at, not fighting |

[Delenda Est](https://github.com/JustusAvramenko/delenda_est) does ship one
campaign, but three of its fifteen levels go through vanilla random maps that
its own author warns are unreliable in the mod, and one of those sits at level
five gating everything after it. Rebuilt sticks to skirmish maps.

### Millennium A.D.

| Campaign | Missions | What it is |
|---|---|---|
| **Six Crowns** | 10, gated | One faction per mission for the first six (Norse, Anglo-Saxons, Byzantines, Carolingians, Umayyads, Rus), then free choice, a team game, and a finale in the deep forest. Uses all ten maps the mod ships |
| **Museum, A Tour of the Mod** | 10, open | The four per-faction structure showcases, the units demo, the Norse sandbox |

[Millennium A.D.](https://github.com/0ADMods/millenniumad) ships no campaigns at
all, which is a shame, because the factions are good.

## The maps

`mod/` installs as **Campaign Kit Maps**. Both are random maps, so they'll take
any size and player count you give them.

**Halcyon.** A golden-hour archipelago for 2 to 8 players. Every nation gets its
own island, so nothing reaches you that didn't sail. Home islands only have
their starting mines. Nearly all the stone and metal sits on contested islets
out in the middle, deliberately offset from the player lanes so nobody gets one
for free. Fish are generous, because a naval economy ought to be worth running.
Three biomes: Golden Hour, Squall and Moonlight.

**The Narrows.** Two shores split by a navigable strait, 2 to 6 players, allies
on the same side. Metal on the mainland is thin on purpose and every mid-channel
islet has three mines, so holding the water actually pays rather than just
feeling clever. Built for the sea-control lesson.

## Tools

```sh
tools/validate-campaigns.py               # lint every campaign
tools/validate-campaigns.py --installed   # missing maps become errors, not warnings

tools/audit-mods.py                       # what does my current mod set break?
tools/audit-mods.py --mods "mod public 0ad_delenda_est_r28"
```

**`validate-campaigns.py`** catches the things that fail quietly: a missing
`Order`, a missing `useGameSetup`, square brackets in a name, a bare-filename
`Preview`, a `Requires` pointing at nothing, gating cycles, and map references
that don't resolve against the base game plus whatever mods you've got
installed. Exits non-zero, so it'll work as a pre-commit hook.

**`audit-mods.py`** works out the virtual filesystem for a mod chain, honouring
load order and `.DELETED` masking, then tells you which missions survive it.
Pass `--mods` to test a chain you haven't committed to yet. It'll also warn you
when two total conversions are on together, and say which one wins.

For the record, on my machine Delenda Est ships **285 `.DELETED` markers** and
breaks **11 of the 44 vanilla missions** in here, including all five Great
Battles. That's by design rather than a fault. It's still the sort of thing
you'd rather hear from a tool than from a loading screen.

## Documentation

**[`docs/campaign-format.md`](docs/campaign-format.md)** is the campaign format
and the bits nobody wrote down. The system is officially experimental and barely
documented, and it fails quietly in at least five interesting ways. `Order` is
mandatory or the menu throws. `useGameSetup` is the thing that gives you an
opponent, and without it your enemy slot is just empty. Square brackets in a
name get parsed as GUI markup and swallowed. `Preview` wants a different value
here than it does in a map file. And scenario maps launched straight from a
campaign get no AI either. Every claim is pinned to the file inside `public.zip`
that it came from.

**[`docs/island-maps-cheatsheet.md`](docs/island-maps-cheatsheet.md)** is every
ship-friendly map I've found, vanilla and modded, with settings ranging from
"quiet boat-building afternoon" to "eight players, let chaos reign".

## How the missions work

Each mission opens the normal game-setup screen with the map locked in, and the
description tells you the player count, teams and AI difficulty to set. That
works because every level sets `"useGameSetup": true`, which also puts Petra AI
in each non-human slot at whatever difficulty you've configured. Levels that
shouldn't have an opponent say `"useGameSetup": false` outright. The game treats
false and absent the same, so the difference is intent, and intent is what the
linter reads.

Gating is `Requires`, with `ShowUnavailable` on, so you can see the whole course
from the start and know what you're working towards.

## Contributing

Campaign files are plain JSON. The hard part is the prose. If you know a good
island map I've missed, or a mission that would teach something these don't,
open an issue or a PR. Run `tools/validate-campaigns.py` first and it'll catch
the quiet ones.

---

*orchardroot, made in Cheshire, a long way from the sea, under the supervision
of two cats.*
