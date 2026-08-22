#!/usr/bin/env bash
#
# Install the 0 A.D. Campaign Kit.
#
#   ./install.sh              campaigns + maps mod
#   ./install.sh --config     also install local.cfg (overwrites any existing one)
#   ./install.sh --dry-run    say what would happen, touch nothing
#   ./install.sh --uninstall  remove everything this script installed
#
# Safe to re-run. Won't run while 0 A.D. is open, because the game rewrites its
# config on exit and would undo half of this.

set -euo pipefail

MOD_NAME="campaign-kit-maps"
SRC="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

DRY=0; WITH_CONFIG=0; UNINSTALL=0
for arg in "$@"; do
	case "$arg" in
		--dry-run)   DRY=1 ;;
		--config)    WITH_CONFIG=1 ;;
		--uninstall) UNINSTALL=1 ;;
		-h|--help)   sed -n '2,12p' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
		*) echo "unknown option: $arg" >&2; exit 2 ;;
	esac
done

case "$(uname -s)" in
	Darwin) USERDIR="$HOME/Library/Application Support/0ad" ;;
	Linux)  USERDIR="${XDG_DATA_HOME:-$HOME/.local/share}/0ad" ;;
	*)      echo "Unsupported platform: $(uname -s)." >&2
	        echo "On Windows the equivalent path is %appdata%\\0ad — copy the folders by hand." >&2
	        exit 1 ;;
esac

say() { printf '  %s\n' "$1"; }
run() { if [ "$DRY" = 1 ]; then say "would: $*"; else "$@"; fi; }

if pgrep -f pyrogenesis >/dev/null 2>&1; then
	echo "0 A.D. is running. Quit it first — it rewrites its config on exit." >&2
	exit 1
fi

CAMPAIGNS="$USERDIR/mods/user/campaigns"
MODDIR="$USERDIR/mods/$MOD_NAME"
CONFIG="$USERDIR/config/local.cfg"

if [ "$UNINSTALL" = 1 ]; then
	echo "Uninstalling from $USERDIR"
	for f in "$SRC"/campaigns/*.json; do
		t="$CAMPAIGNS/$(basename "$f")"
		[ -e "$t" ] && { run rm -f "$t"; say "removed $(basename "$f")"; }
	done
	[ -d "$MODDIR" ] && { run rm -rf "$MODDIR"; say "removed mod $MOD_NAME"; }
	say "left alone: local.cfg, your saves, your campaign progress"
	echo "Done."
	exit 0
fi

if [ ! -d "$USERDIR" ]; then
	echo "No 0 A.D. user directory at:" >&2
	echo "  $USERDIR" >&2
	echo "Run the game once so it creates it, then try again." >&2
	exit 1
fi

echo "Installing to $USERDIR"
[ "$DRY" = 1 ] && echo "  (dry run — nothing will be written)"

# --- campaigns -------------------------------------------------------------
# These go in the always-loaded 'user' mod, so they appear whatever mod set is
# enabled. That's why every campaign name is prefixed with the mod it needs.
run mkdir -p "$CAMPAIGNS"
n=0
for f in "$SRC"/campaigns/*.json; do
	run cp "$f" "$CAMPAIGNS/"
	n=$((n + 1))
done
say "$n campaigns -> mods/user/campaigns/"

# --- maps mod --------------------------------------------------------------
if [ -d "$SRC/mod" ]; then
	run mkdir -p "$MODDIR"
	run cp -R "$SRC/mod/." "$MODDIR/"
	say "maps mod -> mods/$MOD_NAME/  (enable it in Settings -> Mod Selection)"
fi

# --- config ----------------------------------------------------------------
if [ "$WITH_CONFIG" = 1 ]; then
	run mkdir -p "$USERDIR/config"
	if [ -e "$CONFIG" ] && [ "$DRY" != 1 ]; then
		run cp "$CONFIG" "$CONFIG.backup"
		say "backed up existing local.cfg -> local.cfg.backup"
	fi
	run cp "$SRC/config/local.cfg" "$CONFIG"
	say "local.cfg -> config/  (detailed tooltips, game clock, edge snapping)"
else
	say "skipped local.cfg (pass --config to install it)"
fi

echo
echo "Done. In game: Single-player -> Campaigns -> New."
echo
echo "Campaign names are prefixed with the mod they need:"
echo "  (Vanilla)          works on the base game"
echo "  (Delenda Est)      enable ONLY Delenda Est: mod public 0ad_delenda_est_r28"
echo "  (Millennium A.D.)  enable ONLY Millennium A.D.: mod public millenniumad"
echo
echo "Total conversions must be enabled alone — never stacked with map packs or"
echo "each other. tools/audit-mods.py will tell you what a given mod set breaks."
