# The 0 A.D. campaign format, and the bits nobody wrote down

Notes for Release 28. The campaign system is officially experimental, and the
format has almost no documentation, so most of what follows was learned by
writing campaigns that loaded fine, looked fine, and were quietly broken.

Everything here is checked automatically by [`tools/validate-campaigns.py`](../tools/validate-campaigns.py).

Source of truth, if you want to read it yourself, is inside `public.zip`:

- `gui/common/campaigns/CampaignTemplate.js`, what makes a template valid
- `gui/campaigns/default_menu/CampaignMenu.js`, the menu, gating and launch
- `gui/maps/MapCache.js`, preview resolution

## Shape

```json
{
  "Name": "(Vanilla) Admiral's Course",
  "Description": "…",
  "Order": ["harbour_sandbox", "fishing_fleet"],
  "ShowUnavailable": true,
  "Levels": {
    "harbour_sandbox": {
      "Name": "01 — Harbour Sandbox",
      "Description": "…",
      "Map": "skirmishes/cycladic_archipelago_2p.xml",
      "MapType": "skirmish",
      "useGameSetup": true
    },
    "fishing_fleet": { "…": "…", "Requires": "harbour_sandbox" }
  }
}
```

The file lives in a mod's `campaigns/` directory. Its **filename is the
identifier**. `CampaignTemplate.getAvailableTemplates()` derives the id by
slicing the path, and progress saves bind to that, not to `Name`. So renaming
the display name is safe; renaming the file orphans every save.

The `user` mod (`mods/user/campaigns/`) is always loaded whatever mod set is
active, which is the convenient place to keep campaigns, and the reason to
label them, see below.

## The five silent failures

### 1. `Order` is not optional

The menu sorts levels with `this.run.template.Order.indexOf(...)`. Without it:

```
TypeError: this.run.template.Order is undefined
```

and the campaign cannot be opened at all. List every level key. Keys omitted
from `Order` get `indexOf` of `-1` and sort to the top.

### 2. `useGameSetup` is what gives you an opponent

Per level. With it, the level opens the game-setup screen with the map locked
**and Petra AI assigned to every non-human slot**, at whatever difficulty
`gui.gamesetup.aidifficulty` holds:

```js
if (level.useGameSetup)
    for (let i = 1; i < gameSettings.playerCount.nbPlayers; ++i)
        gameSettings.playerAI.set(i, { bot: …, difficulty: …, behavior: … });
```

Without it the level launches straight into the map with **no AI in any slot**.
You get a map, an opponent's starting units, and nobody controlling them. The
game plays perfectly; it's just empty.

Set it on every level that should have an opponent.

For a level that deliberately has none (a tutorial, a sandbox, a browsing
index), write `"useGameSetup": false` explicitly rather than omitting the key.
The game treats `false` and absent identically, since it tests
`if (level.useGameSetup)`. The difference is for the reader and for the linter:
explicit `false` says "I meant this", absence says "I forgot", and those are
the same file with very different bugs.

### 3. Never put square brackets in a name

GUI strings run through the markup parser, where `[...]` is tag syntax, the
same syntax as `[color="red"]…[/color]` in map descriptions. A `[Vanilla] `
prefix produces:

```
ERROR: Invalid tag 'Vanilla' at 8 in '[Vanilla] Boot Camp — Learning the Ropes'
```

and the label is *swallowed* rather than displayed. A bracketed label with a
space in it, like `[Millennium A.D.]`, throws twice, because the parser reads `A.D.`
as a tag parameter with no value.

Round brackets are fine, as every stock map named `(2 players)` demonstrates.

### 4. Don't set `Preview` at all

The trap is that two different fields share the name and take different values.

- A **map's** `settings.Preview` is a bare `foo.png`, because `MapCache`
  prepends `session/icons/mappreview/` itself.
- A **campaign level's** `Preview` becomes a GUI sprite, and GUI sprites resolve
  under `art/textures/ui/`, so it needs the full
  `session/icons/mappreview/foo.png`.

Get it wrong and you get a magenta missing-texture box plus:

```
CCacheLoader failed to find archived or source file for: "art/textures/ui/foo.png"
```

Omit the field. `getLevelPreview()` falls through to
`MapCache.getMapPreview()`, which reads the map's own declaration, resolves the
directory, and degrades to `nopreview.png`. Self-maintaining, and correct for
maps supplied by any mod.

### 5. Scenario maps launched directly get no AI either

Related to (2), and the reason the limitation is often mistaken for a hard one:
without `useGameSetup`, `startScenario()` builds the settings and launches, and
nothing ever assigns a bot. It is *not* true that the campaign menu can't hand
the setup screen players or AI. That's exactly what `useGameSetup` does.

## Gating

`Requires` takes a single level key. Combined with `ShowUnavailable: true` the
whole course is visible from the start with locked entries greyed out, which
reads better than a list that grows.

Watch for cycles. Two levels requiring each other are silently unreachable
forever, with no error.

## Working with total conversions

Because the `user` mod always loads, every campaign appears in the menu
regardless of which mods are enabled. Prefix names with the mod they need.

Total conversions delete vanilla content, and campaigns break accordingly.
Delenda Est R28 ships 285 `.DELETED` markers; 11 of 44 vanilla missions in this
repo reference a map it removes outright, and the built-in tutorials fail
because it removes `units/athen/champion_marine`. This is by design. Vanilla
campaigns need the total conversion off.

The linter takes `--installed` to promote missing-map warnings to errors, which
is what you want when the relevant mod is enabled.
