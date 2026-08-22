
Engine.LoadLibrary("rmgen");
Engine.LoadLibrary("rmgen-common");
Engine.LoadLibrary("rmbiome");

/**
 * Determine player starting positions on a circular pattern.
 * Same idiom as Amberwood, but here the circle is drawn on open water:
 * every point becomes the heart of its own island.
 */
function playerPlacementCircleHl(radius, startingAngle = undefined, center = undefined) {
	const startAngle = startingAngle !== undefined ? startingAngle : randomAngle();
	let [playerPositions, playerAngles] = distributePointsOnCircle(getNumPlayers(), startAngle, radius, center || g_Map.getCenter());
	// Get player IDs
	let playerIDs = getPlayerIDs();

	// Group players by area (teams stay together)
	({ playerIDs, playerPosition: playerPositions } = groupPlayersByArea(playerIDs, playerPositions));

	return [playerIDs, playerPositions.map(p => p.round()), playerAngles, startAngle];
}


/**
 * Raise a single island out of the seabed.
 * Roundish, but deliberately not a perfect disk — a coastline should be worth scouting.
 */
function createIslandHl(position, radius, terrain, height, painters)
{
	return createArea(
		new ClumpPlacer(diskArea(radius), 0.75, 0.15, Infinity, position),
		[
			new TerrainPainter(terrain),
			new SmoothElevationPainter(ELEVATION_SET, height, 5)
		].concat(painters));
}


/**
 * The contested ring: small islets in the middle sea, offset half a step from the
 * player lanes so that nobody has one on their own doorstep. They carry the stone
 * and metal that the home islands are short of, and they are small enough that
 * holding one means holding the water around it.
 */
function createIsletRingHl(count, radius, startAngle, isletRadius, terrain, height, painters)
{
	const [positions] = distributePointsOnCircle(count, startAngle + Math.PI / count, radius, g_Map.getCenter());

	for (const position of positions)
		createIslandHl(position.round(), isletRadius * randFloat(0.75, 1.25), terrain, height, painters);

	return positions.map(p => p.round());
}


export function* generateMap(mapSettings) {

	TILE_CENTERED_HEIGHT_MAP = true;

	setBiome(mapSettings.Biome);

	const tMainTerrain = g_Terrains.mainTerrain;
	const tForestFloor1 = g_Terrains.forestFloor1;
	const tForestFloor2 = g_Terrains.forestFloor2;
	const tCliff = g_Terrains.cliff;
	const tTier1Terrain = g_Terrains.tier1Terrain;
	const tTier2Terrain = g_Terrains.tier2Terrain;
	const tTier3Terrain = g_Terrains.tier3Terrain;
	const tTier4Terrain = g_Terrains.tier4Terrain;
	const tHill = g_Terrains.hill;
	const tRoad = g_Terrains.road;
	const tRoadWild = g_Terrains.roadWild;
	const tShore = g_Terrains.shore;
	const tWater = g_Terrains.water;

	const oTree1 = g_Gaia.tree1;
	const oTree2 = g_Gaia.tree2;
	const oTree3 = g_Gaia.tree3;
	const oTree4 = g_Gaia.tree4;
	const oTree5 = g_Gaia.tree5;
	const oFruitBush = g_Gaia.fruitBush;
	const oFish = g_Gaia.fish;
	const oMainHuntableAnimal = g_Gaia.mainHuntableAnimal;
	const oSecondaryHuntableAnimal = g_Gaia.secondaryHuntableAnimal;
	const oStoneLarge = g_Gaia.stoneLarge;
	const oStoneSmall = g_Gaia.stoneSmall;
	const oMetalLarge = g_Gaia.metalLarge;
	const oMetalSmall = g_Gaia.metalSmall;
	const oWoodTreasure = "gaia/treasure/wood";
	const oDock = "skirmish/structures/default_dock";

	const aGrass = g_Decoratives.grass;
	const aGrassShort = g_Decoratives.grassShort;
	const aRockLarge = g_Decoratives.rockLarge;
	const aRockMedium = g_Decoratives.rockMedium;
	const aBushMedium = g_Decoratives.bushMedium;
	const aBushSmall = g_Decoratives.bushSmall;

	const pForest1 = [
		tForestFloor2 + TERRAIN_SEPARATOR + oTree1,
		tForestFloor2 + TERRAIN_SEPARATOR + oTree2,
		tForestFloor2
	];
	const pForest2 = [
		tForestFloor1 + TERRAIN_SEPARATOR + oTree4,
		tForestFloor1 + TERRAIN_SEPARATOR + oTree5,
		tForestFloor1
	];

	const heightSeaGround = -6;
	const heightShore = 1;
	const heightLand = 3;
	const heightOffsetBump = 2;
	const heightHill = 18;

	globalThis.g_Map = new RandomMap(heightSeaGround, tWater);

	const numPlayers = getNumPlayers();
	const mapCenter = g_Map.getCenter();

	var clPlayer = g_Map.createTileClass();
	var clHill = g_Map.createTileClass();
	var clForest = g_Map.createTileClass();
	var clDirt = g_Map.createTileClass();
	var clRock = g_Map.createTileClass();
	var clMetal = g_Map.createTileClass();
	var clFood = g_Map.createTileClass();
	var clBaseResource = g_Map.createTileClass();
	var clLand = g_Map.createTileClass();
	var clIslet = g_Map.createTileClass();

	const playerIslandRadius = scaleByMapSize(24, 34);

	const [playerIDs, playerPosition, playerAngle, startAngle] =
		playerPlacementCircleHl(fractionToTiles(0.35));

	g_Map.log("Raising the home islands");
	for (let i = 0; i < numPlayers; ++i)
		createIslandHl(
			playerPosition[i],
			playerIslandRadius,
			tMainTerrain,
			heightLand,
			[
				new TileClassPainter(clLand),
				new TileClassPainter(clPlayer)
			]);

	if (!mapSettings.Nomad)
	{
		g_Map.log("Building the home docks");
		for (let i = 0; i < numPlayers; ++i)
		{
			const dockLocation = findLocationInDirectionBasedOnHeight(playerPosition[i],
				mapCenter, -3, heightLand - 0.5, heightLand);
			g_Map.placeEntityPassable(oDock, playerIDs[i], dockLocation, playerAngle[i] + Math.PI);
		}
	}

	yield 15;

	g_Map.log("Raising the contested islets");
	const isletPositions = createIsletRingHl(
		Math.max(4, 2 * numPlayers),
		fractionToTiles(0.15),
		startAngle,
		scaleByMapSize(8, 13),
		tMainTerrain,
		heightLand,
		[
			new TileClassPainter(clLand),
			new TileClassPainter(clIslet)
		]);

	g_Map.log("Scattering the outer skerries");
	createAreas(
		new ChainPlacer(
			Math.floor(scaleByMapSize(4, 7)),
			Math.floor(scaleByMapSize(7, 10)),
			Math.floor(scaleByMapSize(16, 40)),
			0.07),
		[
			new TerrainPainter(tMainTerrain),
			new SmoothElevationPainter(ELEVATION_SET, heightLand, 5),
			new TileClassPainter(clLand)
		],
		avoidClasses(clLand, scaleByMapSize(10, 16)),
		scaleByMapSize(4, 20));

	paintTerrainBasedOnHeight(heightShore, heightLand, 0, tShore);
	paintTerrainBasedOnHeight(heightSeaGround, heightShore, 2, tWater);

	yield 25;

	placePlayerBases({
		"PlayerPlacement": [playerIDs, playerPosition],
		// PlayerTileClass marked above
		"BaseResourceClass": clBaseResource,
		"Walls": "towers",
		"CityPatch": {
			"radius": playerIslandRadius / 3,
			"outerTerrain": tRoadWild,
			"innerTerrain": tRoad
		},
		"StartingAnimal": {
		},
		"Berries": {
			"template": oFruitBush
		},
		"Mines": {
			"types": [
				{ "template": oMetalLarge },
				{ "template": oStoneLarge }
			]
		},
		"Treasures": {
			"types": [
				{
					"template": oWoodTreasure,
					"count": 10
				}
			]
		},
		"Trees": {
			"template": oTree1,
			"count": scaleByMapSize(12, 24)
		},
		"Decoratives": {
			"template": aGrassShort
		}
	});

	yield 35;

	g_Map.log("Creating bumps");
	createBumps(
		[avoidClasses(clPlayer, 8), stayClasses(clLand, 4)],
		scaleByMapSize(20, 100),
		undefined,
		undefined,
		undefined,
		undefined,
		heightOffsetBump);

	g_Map.log("Creating headlands");
	createHills(
		[tMainTerrain, tCliff, tHill],
		[avoidClasses(clPlayer, 4, clHill, 14, clIslet, 0), stayClasses(clLand, 2)],
		clHill,
		scaleByMapSize(2, 8),
		undefined,
		undefined,
		undefined,
		undefined,
		heightHill);

	yield 45;

	g_Map.log("Creating the island woods");
	const [forestTrees, stragglerTrees] = getTreeCounts(...rBiomeTreeCount(1));
	createForests(
		[tMainTerrain, tForestFloor1, tForestFloor2, pForest1, pForest2],
		[
			avoidClasses(clPlayer, 12, clForest, 12, clHill, 0, clIslet, 0),
			stayClasses(clLand, 4)
		],
		clForest,
		forestTrees);

	yield 55;

	g_Map.log("Creating dirt patches");
	createLayeredPatches(
		[scaleByMapSize(3, 6), scaleByMapSize(5, 10), scaleByMapSize(8, 21)],
		[[tMainTerrain, tTier1Terrain], [tTier1Terrain, tTier2Terrain], [tTier2Terrain, tTier3Terrain]],
		[1, 1],
		[avoidClasses(clForest, 0, clHill, 0, clDirt, 3, clPlayer, 10), stayClasses(clLand, 6)],
		scaleByMapSize(12, 40),
		clDirt);

	g_Map.log("Creating grass patches");
	createPatches(
		[scaleByMapSize(2, 4), scaleByMapSize(3, 7), scaleByMapSize(5, 15)],
		tTier4Terrain,
		[avoidClasses(clForest, 0, clHill, 0, clDirt, 3, clPlayer, 10), stayClasses(clLand, 6)],
		scaleByMapSize(12, 40),
		clDirt);

	yield 60;

	// The whole point of the middle sea: the islets are where the hard resources live.
	// They are small, so a mine out there is always within reach of somebody's fleet.
	g_Map.log("Stocking the contested islets with stone");
	createMines(
		[
			[
				new SimpleObject(oStoneSmall, 0, 2, 0, 4, 0, 2 * Math.PI, 1),
				new SimpleObject(oStoneLarge, 1, 1, 0, 4)
			],
			[new SimpleObject(oStoneSmall, 2, 4, 1, 3)]
		],
		[avoidClasses(clForest, 1, clRock, 7, clHill, 1), stayClasses(clIslet, 2)],
		clRock,
		scaleByMapSize(6, 20));

	g_Map.log("Stocking the contested islets with metal");
	createMines(
		[
			[new SimpleObject(oMetalLarge, 1, 1, 0, 4)],
			[new SimpleObject(oMetalSmall, 2, 4, 1, 3)]
		],
		[avoidClasses(clForest, 1, clMetal, 7, clRock, 4, clHill, 1), stayClasses(clIslet, 2)],
		clMetal,
		scaleByMapSize(6, 20));

	g_Map.log("Creating the few mines left on the outer skerries");
	createMines(
		[
			[
				new SimpleObject(oStoneSmall, 0, 2, 0, 4, 0, 2 * Math.PI, 1),
				new SimpleObject(oStoneLarge, 1, 1, 0, 4)
			]
		],
		[
			avoidClasses(clForest, 1, clPlayer, 20, clIslet, 0, clRock, 12, clHill, 1),
			stayClasses(clLand, 5)
		],
		clRock,
		scaleByMapSize(2, 8));

	createMines(
		[[new SimpleObject(oMetalLarge, 1, 1, 0, 4)]],
		[
			avoidClasses(clForest, 1, clPlayer, 20, clIslet, 0, clMetal, 12, clRock, 5, clHill, 1),
			stayClasses(clLand, 5)
		],
		clMetal,
		scaleByMapSize(2, 8));

	yield 70;

	const planetm = currentBiome() == "generic/india" ? 8 : 1;

	createDecoration(
		[
			[new SimpleObject(aRockMedium, 1, 3, 0, 1)],
			[new SimpleObject(aRockLarge, 1, 2, 0, 1), new SimpleObject(aRockMedium, 1, 3, 0, 2)],
			[new SimpleObject(aGrassShort, 1, 2, 0, 1)],
			[new SimpleObject(aGrass, 2, 4, 0, 1.8), new SimpleObject(aGrassShort, 3, 6, 1.2, 2.5)],
			[new SimpleObject(aBushMedium, 1, 2, 0, 2), new SimpleObject(aBushSmall, 2, 4, 0, 2)]
		],
		[
			scaleByMapSize(16, 262),
			scaleByMapSize(8, 131),
			planetm * scaleByMapSize(20, 350),
			planetm * scaleByMapSize(20, 350),
			planetm * scaleByMapSize(20, 300)
		],
		[avoidClasses(clForest, 0, clPlayer, 0, clHill, 0), stayClasses(clLand, 4)]);

	g_Map.log("Creating shoreline decorations");
	createDecoration(
		[
			[new SimpleObject(g_Decoratives.reeds, 2, 5, 0, 2)],
			[new SimpleObject(g_Decoratives.lillies, 1, 3, 0, 2)]
		],
		[
			scaleByMapSize(20, 120),
			scaleByMapSize(8, 40)
		],
		borderClasses(clLand, 2, 1));

	yield 75;

	g_Map.log("Creating hunt on the home islands");
	createFood(
		[
			[new SimpleObject(oMainHuntableAnimal, 5, 7, 0, 4)],
			[new SimpleObject(oSecondaryHuntableAnimal, 2, 3, 0, 2)]
		],
		[
			3 * numPlayers,
			3 * numPlayers
		],
		[avoidClasses(clForest, 0, clPlayer, 8, clHill, 1, clFood, 16), stayClasses(clLand, 4)],
		clFood);

	createFood(
		[
			[new SimpleObject(oFruitBush, 5, 7, 0, 4)]
		],
		[
			3 * numPlayers
		],
		[avoidClasses(clForest, 0, clPlayer, 8, clHill, 1, clFood, 10), stayClasses(clLand, 4)],
		clFood);

	yield 80;

	// A naval economy has to be able to feed itself, so the shoals are generous:
	// thick along every coast, and thicker still in the open water between islands.
	g_Map.log("Creating coastal shoals");
	createFood(
		[
			[new SimpleObject(oFish, 2, 3, 0, 2)]
		],
		[
			14 * numPlayers
		],
		[avoidClasses(clLand, 3, clFood, 8), borderClasses(clLand, 0, 14)],
		clFood);

	g_Map.log("Creating deep water shoals");
	createFood(
		[
			[new SimpleObject(oFish, 2, 3, 0, 2)]
		],
		[
			30 * numPlayers
		],
		avoidClasses(clLand, 6, clFood, 12),
		clFood);

	yield 85;

	createStragglerTrees(
		[oTree1, oTree2, oTree4, oTree3],
		[
			avoidClasses(clForest, 6, clHill, 1, clPlayer, 8, clMetal, 6, clRock, 6, clFood, 1),
			stayClasses(clLand, 5)
		],
		clForest,
		stragglerTrees);

	// The islets are bare rock and scrub — no timber out there worth crossing for.
	createStragglerTrees(
		[oTree3, oTree5],
		[
			avoidClasses(clMetal, 5, clRock, 5, clFood, 1),
			stayClasses(clIslet, 3)
		],
		clForest,
		Math.round(stragglerTrees / 12));

	placePlayersNomad(
		clPlayer,
		new AndConstraint([
			stayClasses(clLand, 5),
			avoidClasses(clForest, 1, clMetal, 4, clRock, 4, clHill, 4, clFood, 2)]));

	setWaterType("ocean");

	g_Map.log("Halcyon: " + numPlayers + " home islands, " + isletPositions.length + " contested islets");

	return g_Map;
}
