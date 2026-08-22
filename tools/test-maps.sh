#!/usr/bin/env bash
#
# Generate every map in mod/ headlessly and report whether it worked.
#
#   tools/test-maps.sh                 test everything
#   tools/test-maps.sh halcyon         test one map, all its biomes
#
# A random map script can be perfectly valid JavaScript and still fall over the
# moment the generator runs it, so this is the only test that counts. It uses
# -autostart-nonvisual, so nothing opens a window. Takes about a second a go.
#
# Note the run is killed as soon as generation finishes: a nonvisual autostart
# has no end condition and will happily simulate turns until you stop it.

set -uo pipefail

BIN="/Applications/0 A.D..app/Contents/MacOS/pyrogenesis"
[ -x "$BIN" ] || BIN="$(command -v pyrogenesis || true)"
[ -x "$BIN" ] || { echo "Can't find pyrogenesis. Edit BIN at the top of this script." >&2; exit 1; }

REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MODNAME="campaign-kit-maps"
LOGS="${TMPDIR:-/tmp}/0ad-map-tests"; mkdir -p "$LOGS"
ONLY="${1:-}"
PASS=0; FAIL=0

pause() { perl -e 'select(undef,undef,undef,0.5)' 2>/dev/null || true; }

run_one() {
	local label="$1" map="$2" players="$3" size="$4" biome="$5"
	local log="$LOGS/$label.log"
	local args=(-autostart="random/$map" -autostart-nonvisual
	            -autostart-size="$size" -autostart-players="$players"
	            -mod=mod -mod=public -mod="$MODNAME")
	[ -n "$biome" ] && args+=(-autostart-biome="$biome")

	"$BIN" "${args[@]}" > "$log" 2>&1 &
	local pid=$!
	for _ in $(seq 1 120); do
		grep -q "Total map generation time" "$log" 2>/dev/null && break
		grep -qE "^ERROR|Assertion failed|JavaScript error" "$log" 2>/dev/null && break
		kill -0 "$pid" 2>/dev/null || break
		pause
	done
	kill "$pid" 2>/dev/null; wait "$pid" 2>/dev/null

	local time ents errs
	time=$(grep -o "Total map generation time: [0-9.]*s" "$log" | head -1 | sed 's/.*: //')
	ents=$(grep -o "Total entities: [0-9]*" "$log" | head -1 | sed 's/.*: //')
	errs=$(grep -cE "^ERROR|JavaScript error|Assertion failed" "$log")

	if [ -n "$time" ] && [ "$errs" = 0 ]; then
		printf "  pass  %-30s %8s  %5s entities\n" "$label" "$time" "$ents"
		PASS=$((PASS + 1))
	else
		printf "  FAIL  %-30s see %s\n" "$label" "$log"
		grep -E "^ERROR|JavaScript error|Assertion failed" "$log" | head -3 | sed 's/^/            /'
		FAIL=$((FAIL + 1))
	fi
}

for json in "$REPO"/mod/maps/random/*.json; do
	map="$(basename "$json" .json)"
	[ -n "$ONLY" ] && [ "$ONLY" != "$map" ] && continue

	# Biomes come from SupportedBiomes; "generic/" means use the stock set.
	biomedir="$REPO/mod/maps/random/rmbiome/$map"
	biomes=("")
	if [ -d "$biomedir" ]; then
		biomes=()
		for b in "$biomedir"/*.json; do biomes+=("$map/$(basename "$b" .json)"); done
	fi

	echo "$map"
	for b in "${biomes[@]}"; do
		suffix="${b##*/}"
		run_one "$map${suffix:+-$suffix}-4p" "$map" 4 256 "$b"
	done
	# Player-count extremes are where scaleByMapSize tends to bite.
	run_one "$map-2p" "$map" 2 192 "${biomes[0]}"
	run_one "$map-8p" "$map" 8 320 "${biomes[0]}"
done

echo
echo "$PASS passed, $FAIL failed"
[ "$FAIL" = 0 ] || exit 1
