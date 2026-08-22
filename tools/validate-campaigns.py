#!/usr/bin/env python3
"""
Validate 0 A.D. campaign templates.

The campaign JSON format is barely documented and fails silently in several
interesting ways. Every check below exists because it bit me, on R28.

Usage:
    tools/validate-campaigns.py [campaigns_dir] [--installed]

Exits non-zero if any ERROR is found. Warnings don't fail the run.
"""

import json
import os
import re
import sys
import zipfile
from glob import glob

# Levels that deliberately have no opponent, so useGameSetup is correctly absent.
NO_OPPONENT = {
    ("bootcamp.json", "intro"),
    ("bootcamp.json", "economy"),
    ("bootcamp.json", "sandbox"),
    ("mad_six_crowns.json", "sandbox"),
}

MAC_APP = "/Applications/0 A.D..app/Contents/Resources/data/mods/public/public.zip"
MAC_MODS = os.path.expanduser("~/Library/Application Support/0ad/mods")
LINUX_MODS = os.path.expanduser("~/.local/share/0ad/mods")


def find_map_sources():
    """Every zip/loose dir that could supply a map, base game plus installed mods."""
    sources = []
    if os.path.exists(MAC_APP):
        sources.append(("public", MAC_APP))
    for mods in (MAC_MODS, LINUX_MODS):
        if not os.path.isdir(mods):
            continue
        for name in sorted(os.listdir(mods)):
            for z in glob(os.path.join(mods, name, "*.zip")):
                sources.append((name, z))
    return sources


def build_map_index():
    """Set of every 'maps/...' path visible across the base game and installed mods."""
    paths = set()
    for _, z in find_map_sources():
        try:
            with zipfile.ZipFile(z) as zf:
                paths.update(n for n in zf.namelist() if n.startswith("maps/"))
        except zipfile.BadZipFile:
            continue
    for mods in (MAC_MODS, LINUX_MODS):
        if not os.path.isdir(mods):
            continue
        for root, _, files in os.walk(mods):
            for f in files:
                full = os.path.join(root, f)
                if "/mods/" not in full:
                    continue
                rel = full.split("/mods/", 1)[1].split("/", 1)
                if len(rel) == 2 and rel[1].startswith("maps/"):
                    paths.add(rel[1])
    return paths


def check(path, maps, strict_maps):
    """Return (errors, warnings) for one campaign file."""
    errs, warns = [], []
    base = os.path.basename(path)

    try:
        with open(path, encoding="utf-8") as fh:
            doc = json.load(fh)
    except (json.JSONDecodeError, UnicodeDecodeError) as e:
        return [f"unparseable: {e}"], []

    # --- top level -------------------------------------------------------
    # CampaignTemplate.isValid() returns this.Name; without it the template is
    # rejected outright with "is not a valid campaign template".
    if not doc.get("Name"):
        errs.append("no 'Name' - CampaignTemplate.isValid() rejects the file")

    levels = doc.get("Levels")
    if not isinstance(levels, dict) or not levels:
        return errs + ["no 'Levels' object"], warns

    # CampaignMenu sorts with Order.indexOf(...). Missing Order throws
    # "TypeError: this.run.template.Order is undefined" and the run won't open.
    order = doc.get("Order")
    if order is None:
        errs.append("no 'Order' - menu throws TypeError and the campaign cannot be opened")
    elif not isinstance(order, list):
        errs.append("'Order' must be a list")
    else:
        missing = set(levels) - set(order)
        extra = set(order) - set(levels)
        if missing:
            errs.append(f"'Order' omits levels (they sort to the top): {sorted(missing)}")
        if extra:
            errs.append(f"'Order' names levels that don't exist: {sorted(extra)}")

    if "ShowUnavailable" not in doc:
        warns.append("no 'ShowUnavailable' - locked levels stay hidden until unlocked")

    # --- markup ----------------------------------------------------------
    # GUI strings are parsed for [tag] markup, same syntax as [color="red"].
    for label, text in [("Name", doc.get("Name")), ("Description", doc.get("Description"))]:
        if text and re.search(r"[\[\]]", text):
            errs.append(f"{label} contains square brackets - parsed as GUI markup, throws 'Invalid tag'")

    # --- levels ----------------------------------------------------------
    for key, lv in levels.items():
        where = f"Levels.{key}"

        for field in ("Map", "MapType"):
            if not lv.get(field):
                errs.append(f"{where}: missing '{field}'")
        if not lv.get("Map") or not lv.get("MapType"):
            continue

        for label in ("Name", "Description"):
            text = lv.get(label)
            if text and re.search(r"[\[\]]", text):
                errs.append(f"{where}.{label}: square brackets - parsed as GUI markup")

        # Preview becomes a GUI sprite resolved under art/textures/ui/, so it needs
        # the full "session/icons/mappreview/foo.png". A map's own settings.Preview
        # is a bare filename because MapCache prepends the directory. Two different
        # conventions, one field name. Omitting it uses the correct fallback.
        pv = lv.get("Preview")
        if pv is not None:
            if "/" not in pv:
                errs.append(
                    f"{where}.Preview '{pv}' is a bare filename - renders a magenta box. "
                    "Omit Preview entirely and MapCache resolves it."
                )
            else:
                warns.append(f"{where}.Preview is set; omitting it is self-maintaining")

        # Without useGameSetup the level launches straight into the map with no AI
        # assigned to any slot: an opponent slot with nobody in it.
        if not lv.get("useGameSetup") and (base, key) not in NO_OPPONENT:
            errs.append(f"{where}: no 'useGameSetup' - launches with NO AI in any opponent slot")

        req = lv.get("Requires")
        if req and req not in levels:
            errs.append(f"{where}.Requires '{req}' is not a level in this campaign")

        rel = f"maps/{lv['Map']}.json" if lv["MapType"] == "random" else f"maps/{lv['Map']}"
        if rel not in maps:
            (errs if strict_maps else warns).append(
                f"{where}: map not found - {lv['Map']} "
                "(is the mod that supplies it installed?)"
            )

    # --- gating cycles ---------------------------------------------------
    for key in levels:
        seen, cur = set(), key
        while cur:
            if cur in seen:
                errs.append(f"Levels.{key}: Requires chain forms a cycle - level is unreachable")
                break
            seen.add(cur)
            cur = levels.get(cur, {}).get("Requires")

    return errs, warns


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    strict_maps = "--installed" in sys.argv

    here = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    target = args[0] if args else os.path.join(here, "campaigns")
    files = sorted(glob(os.path.join(target, "*.json")))
    if not files:
        print(f"no campaign files in {target}")
        return 1

    maps = build_map_index()
    if not maps:
        print("warning: no installed maps found; map references will be reported as warnings\n")
        strict_maps = False

    total_e = total_w = 0
    for f in files:
        errs, warns = check(f, maps, strict_maps)
        total_e += len(errs)
        total_w += len(warns)
        status = "FAIL" if errs else ("warn" if warns else "ok")
        print(f"{os.path.basename(f):24} {status}")
        for e in errs:
            print(f"    ERROR  {e}")
        for w in warns:
            print(f"    warn   {w}")

    print(f"\n{len(files)} campaigns, {total_e} errors, {total_w} warnings")
    return 1 if total_e else 0


if __name__ == "__main__":
    sys.exit(main())
