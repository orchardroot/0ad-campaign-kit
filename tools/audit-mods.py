#!/usr/bin/env python3
"""
Audit campaign missions against a 0 A.D. mod set.

Mods don't only add things. A total conversion ships `.DELETED` marker files
that mask content out of every mod below it, so enabling one quietly removes
maps that campaigns point at - and you find out at the loading screen, one
mission at a time. This resolves the virtual filesystem for a mod chain and
tells you up front which missions survive it.

Usage:
    tools/audit-mods.py [--mods "mod public foo"] [--campaigns dir]

With no --mods it audits whatever `mod.enabledmods` currently says in
user.cfg. With --mods it audits a hypothetical chain, which is the point:
check the evening's mod set before committing the evening to it.

Exits non-zero if any mission is broken.
"""

import json
import os
import sys
import zipfile
from glob import glob

MAC_APP = "/Applications/0 A.D..app/Contents/Resources/data/mods"
MAC_MODS = os.path.expanduser("~/Library/Application Support/0ad/mods")
LINUX_MODS = os.path.expanduser("~/.local/share/0ad/mods")
MAC_CFG = os.path.expanduser("~/Library/Application Support/0ad/config/user.cfg")
LINUX_CFG = os.path.expanduser("~/.config/0ad/config/user.cfg")

MARKER = ".DELETED"

# A mod this deletion-happy is rewriting the game, not decorating it. Delenda
# Est ships 285 markers; Millennium A.D. ships one, but it's a directory marker
# over simulation/data/civs, which is just as total. Either test alone misses
# one of them, so both count.
TC_MARKERS = 50
TC_DIR_PREFIX = "simulation/"


def enabled_mods():
    """The chain from user.cfg, as the game would read it."""
    for cfg in (MAC_CFG, LINUX_CFG):
        if not os.path.exists(cfg):
            continue
        with open(cfg, encoding="utf-8", errors="replace") as fh:
            for line in fh:
                key, _, val = line.partition("=")
                if key.strip() == "mod.enabledmods":
                    return val.strip().strip('"').split()
    return []


def locate(name):
    """Where a mod lives: shipped alongside the game, or installed by hand."""
    for base in (MAC_APP, MAC_MODS, LINUX_MODS):
        path = os.path.join(base, name)
        if os.path.isdir(path):
            return path
    return None


def contents(moddir):
    """Every VFS path a mod contributes, from its zips and from loose files.

    Mods ship either way - a released mod is a zip, a mod you're writing is a
    directory - and the game reads both, so both are indexed here. Names are
    relative to the mod root, which is what a marker path is relative to too.
    """
    paths = []
    for z in sorted(glob(os.path.join(moddir, "*.zip"))):
        try:
            with zipfile.ZipFile(z) as zf:
                paths += [n for n in zf.namelist() if not n.endswith("/")]
        except zipfile.BadZipFile:
            print(f"warning: {z} is not a readable zip; skipping")
    for root, _, files in os.walk(moddir):
        for f in files:
            rel = os.path.relpath(os.path.join(root, f), moddir)
            # mod.json is metadata and the zips are the archives we just read.
            if rel == "mod.json" or (os.sep not in rel and rel.endswith(".zip")):
                continue
            paths.append(rel)
    return paths


def resolve(chain):
    """Replay the mod chain into a virtual filesystem.

    Load order is last-wins: each mod shadows the ones before it. A mod's
    markers are applied before its own files, because a mod is allowed to
    delete a path and then supply its own version of it - Delenda Est does
    this for maps it rewrites.

    Returns (vfs, killed, mods) where vfs maps path -> mod that supplies it,
    killed maps a masked path -> (mod that deleted it, mod that had it), and
    mods maps mod name -> stats about what it deleted.
    """
    vfs, killed, mods = {}, {}, {}

    for name in chain:
        moddir = locate(name)
        if moddir is None:
            mods[name] = None  # not installed; reported by the caller
            continue

        paths = contents(moddir)
        markers = [p for p in paths if p.endswith(MARKER)]
        # A marker can name a file (foo.xml.DELETED) or a whole directory
        # (simulation/data/civs.DELETED). Rather than guess from the extension,
        # mask the exact path and everything under it - that covers both.
        dirs = [m for m in markers if "." not in os.path.basename(m[: -len(MARKER)])]

        for marker in markers:
            target = marker[: -len(MARKER)]
            under = target + "/"
            for p in [p for p in vfs if p == target or p.startswith(under)]:
                killed[p] = (name, vfs.pop(p))

        mods[name] = {"files": len(paths) - len(markers),
                      "markers": len(markers),
                      "dir_markers": dirs,
                      "shadowed": 0}

        for p in paths:
            if p.endswith(MARKER):
                continue
            if p in vfs and vfs[p] != name:
                mods[vfs[p]]["shadowed"] += 1  # same path, later mod, later wins
            vfs[p] = name
            killed.pop(p, None)  # re-supplied higher up, so it's back

    return vfs, killed, mods


def conversions(mods):
    """Which mods in the chain are total conversions, by the heuristic above."""
    out = []
    for name, stat in mods.items():
        if not stat:
            continue
        deep = [d for d in stat["dir_markers"] if d.startswith(TC_DIR_PREFIX)]
        if stat["markers"] >= TC_MARKERS or deep:
            out.append((name, stat, deep))
    return out


def check(path, vfs, killed):
    """Return (campaign name, [(level key, mission name, status, detail)])."""
    with open(path, encoding="utf-8") as fh:
        doc = json.load(fh)

    levels = doc.get("Levels") or {}
    order = [k for k in doc.get("Order") or [] if k in levels]
    order += [k for k in levels if k not in order]

    rows = []
    for key in order:
        lv = levels[key]
        label = lv.get("Name") or key
        if not lv.get("Map") or not lv.get("MapType"):
            rows.append((key, label, "BROKEN", "no Map/MapType - run validate-campaigns.py"))
            continue

        # Random maps are picked by their .json settings file; everything else
        # names the map file itself. Same split the validator makes.
        rel = f"maps/{lv['Map']}.json" if lv["MapType"] == "random" else f"maps/{lv['Map']}"

        if rel in vfs:
            rows.append((key, label, "ok", f"from {vfs[rel]}"))
        elif rel in killed:
            by, had = killed[rel]
            rows.append((key, label, "BROKEN", f"{lv['Map']} deleted by {by}, was {had}'s"))
        else:
            rows.append((key, label, "BROKEN", f"{lv['Map']} not provided by any enabled mod"))

    return doc.get("Name") or os.path.basename(path), rows


def main():
    argv = sys.argv[1:]
    chain = campaigns = None
    while argv:
        arg = argv.pop(0)
        if arg == "--mods" and argv:
            chain = argv.pop(0).split()
        elif arg == "--campaigns" and argv:
            campaigns = argv.pop(0)
        else:
            print(__doc__.strip())
            return 2

    here = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    target = campaigns or os.path.join(here, "campaigns")
    files = sorted(glob(os.path.join(target, "*.json")))
    if not files:
        print(f"no campaign files in {target}")
        return 1

    source = "--mods"
    if chain is None:
        chain, source = enabled_mods(), "user.cfg"
        if not chain:
            print("no mod.enabledmods found in user.cfg; pass --mods instead")
            return 1

    # The user mod is loaded whatever else is enabled, and it's where campaigns
    # normally live, so the audited chain has to include it or the picture is
    # wrong by one mod.
    if "user" not in chain and locate("user"):
        chain = chain + ["user"]

    vfs, killed, mods = resolve(chain)
    print(f"chain ({source}): {' '.join(chain)}\n")

    for name in chain:
        stat = mods.get(name)
        if stat is None:
            print(f"warning: mod '{name}' is not installed - anything it supplies will be missing")
        elif stat["markers"]:
            deleted = sum(1 for by, _ in killed.values() if by == name)
            print(f"{name:24} {stat['files']:6} files  {stat['markers']:4} .DELETED"
                  f"{' marker ' if stat['markers'] == 1 else ' markers'}"
                  f"  masking {deleted} path{'' if deleted == 1 else 's'}")
        else:
            print(f"{name:24} {stat['files']:6} files")

    # Two total conversions in one chain is the loud case: they don't merge,
    # the later one deletes the earlier one's content and you get a half-game.
    tcs = conversions(mods)
    if len(tcs) > 1:
        winner = tcs[-1][0]
        print("\n" + "!" * 72)
        print(f"!! {len(tcs)} total conversions enabled together: {', '.join(n for n, _, _ in tcs)}")
        print(f"!! {winner} loads last, so {winner} wins.")
        for name, stat, _ in tcs[:-1]:
            lost = sum(1 for by, had in killed.values() if had == name)
            print(f"!!   {name}: {lost} of its files are deleted outright by a later mod, "
                  f"and {stat['shadowed']} more are overwritten")
        for name, _, deep in tcs:
            for d in deep:
                print(f"!!   {name} deletes the whole {d[: -len(MARKER)]}/ directory")
        print("!! Enable one total conversion at a time.")
        print("!" * 72)
    elif tcs:
        name, stat, _ = tcs[0]
        print(f"\ntotal conversion in chain: {name} "
              f"({stat['markers']} .DELETED marker{'' if stat['markers'] == 1 else 's'})")

    print()
    total = broken = 0
    vanilla_total = vanilla_broken = 0
    for f in files:
        name, rows = check(f, vfs, killed)
        bad = [r for r in rows if r[2] == "BROKEN"]
        total += len(rows)
        broken += len(bad)
        # The repo labels campaigns with the mod they need; the vanilla ones are
        # the set that's supposed to survive an ordinary chain.
        if name.startswith("(Vanilla)"):
            vanilla_total += len(rows)
            vanilla_broken += len(bad)

        status = f"{len(bad)} BROKEN" if bad else "ok"
        print(f"{os.path.basename(f):24} {status:12} {name}")
        for key, label, state, detail in rows:
            tag = "BROKEN " if state == "BROKEN" else "ok     "
            print(f"    {tag}{label:44} {detail}")

    print(f"\n{len(files)} campaigns, {total} missions, {broken} broken "
          f"(vanilla campaigns: {vanilla_broken} of {vanilla_total} broken)")
    return 1 if broken else 0


if __name__ == "__main__":
    sys.exit(main())
