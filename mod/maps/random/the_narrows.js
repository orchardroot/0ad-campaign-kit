Engine.LoadLibrary("rmgen");
Engine.LoadLibrary("rmgen-common");
Engine.LoadLibrary("rmbiome");

/**
 * The Narrows.
 *
 * Two landmasses facing each other across a single navigable strait that runs
 * the whole length of the map. There is no ford, no land bridge and no way
 * around: everything that crosses has to float.
 *
 * The strait is deliberately generous enough to manoeuvre a fleet in and tight
 * enough that one side can bottle it up. The metal sits on islets in the middle
 * of it, so whoever owns the water owns the late game. Fish are thick in the
 * channel for the same reason - the sea is the map's larder as well as its road.
 */
export function* generateMap(mapSettings)
{
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
	const oMainHuntableAnimal = g_Gaia.mainHuntableAnimal;
	const oSecondaryHuntableAnimal = g_Gaia.secondaryHuntableAnimal;
	const oFish = g_Gaia.fish;
	const oStoneLarge = g_Gaia.stoneLarge;
	const oStoneSmall = g_Gaia.stoneSmall;
	const oMetalLarge = g_Gaia.metalLarge;
	const oMetalSmall = g_Gaia.metalSmall;
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

	const heightSeaGround = -9;
	const heightShore = 1;
	const heightLand = 3;
	const heightIslet = 5;

	globalThis.g_Map = new RandomMap(heightLand, tMainTerrain);

	const numPlayers = getNumPlayers();
	const mapCenter = g_Map.getCenter();
	const mapBounds = g_Map.getBounds();

	const clPlayer = g_Map.createTileClass();
	const clHill = g_Map.createTileClass();
	const clForest = g_Map.createTileClass();
	const clWater = g_Map.createTileClass();
	const clDirt = g_Map.createTileClass();
	const clRock = g_Map.createTileClass();
	const clMetal = g_Map.createTileClass();
	const clFood = g_Map.createTileClass();
	const clBaseResource = g_Map.createTileClass();
	const clIslet = g_Map.createTileClass();

	// Keep the strait axis-aligned so that it cuts the map from edge to edge.
	// A diagonal channel would leave land wedges at the corners and let the
	// infantry walk round, which is exactly the lesson this map is not teaching.
	const straitAngle = randBool() ? 0 : Math.PI / 2;

	// Wide enough to fight a fleet action in, tight enough to blockade.
	const straitWidth = fractionToTiles(0.24);

	const straitStart =
		new Vector2D(mapBounds.left - 10, mapCenter.y).rotateAround(straitAngle, mapCenter);
	const straitEnd =
		new Vector2D(mapBounds.right + 10, mapCenter.y).rotateAround(straitAngle, mapCenter);

	g_Map.log("Placing the two shores");
	placePlayerBases({
		"PlayerPlacement": playerPlacementRiver(straitAngle + Math.PI / 2, fractionToTiles(0.62)),
		"PlayerTileClass": clPlayer,
		"BaseResourceClass": clBaseResource,
		"CityPatch": {
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
		"Trees": {
			"template": oTree1,
			"count": 5
		},
		"Decoratives": {
			"template": aGrassShort
		}
	});
	yield 10;

	g_Map.log("Cutting the strait");
	paintRiver({
		"parallel": false,
		"start": straitStart,
		"end": straitEnd,
		"width": straitWidth,
		"fadeDist": scaleByMapSize(4, 10),
		"deviation": 1,
		"heightRiverbed": heightSeaGround,
		"heightLand": heightLand,
		"meanderShort": 12,
		"meanderLong": 6,
		"waterFunc": (position, height, riverFraction) => {
			createTerrain(height < -1.5 ? tWater : tShore).place(position);
		},
		"landFunc": (position, shoreDist1, shoreDist2) => {
			g_Map.setHeight(position, heightLand + 0.1);
		}
	});
	yield 25;

	paintTerrainBasedOnHeight(heightSeaGround - 1, heightShore, 1, tWater);
	paintTerrainBasedOnHeight(heightShore, heightLand, 1, tShore);
	paintTileClassBasedOnHeight(heightSeaGround - 1, 0.5, 1, clWater);

	g_Map.log("Raising the islets in the channel");
	const isletCount = scaleByMapSize(3, 9);
	const isletRadius = scaleByMapSize(6, 11);
	const isletClearance = scaleByMapSize(4, 9);
	const straitLength = mapBounds.right - mapBounds.left;

	for (let i = 0; i < isletCount; ++i)
	{
		// Spread the islets evenly down the channel, nudged off the centreline
		// so the strait never becomes a single symmetric corridor.
		const alongStrait = mapBounds.left + straitLength * (i + 0.5) / isletCount;
		const acrossStrait = mapCenter.y + (i % 2 ? 1 : -1) * randFloat(0, straitWidth / 6);

		const isletCenter =
			new Vector2D(alongStrait, acrossStrait).rotateAround(straitAngle, mapCenter).round();

		createArea(
			new ClumpPlacer(diskArea(isletRadius), 0.7, 0.1, Infinity, isletCenter),
			[
				new LayeredPainter([tShore, tMainTerrain], [2]),
				new SmoothElevationPainter(ELEVATION_SET, heightIslet, 4),
				new TileClassPainter(clIslet)
			],
			stayClasses(clWater, isletClearance));
	}
	yield 35;

	g_Map.log("Creating bumps");
	createBumps(avoidClasses(clWater, 5, clPlayer, 20, clIslet, 0));

	g_Map.log("Creating hills");
	createHills(
		[tMainTerrain, tCliff, tHill],
		avoidClasses(clPlayer, 20, clHill, 15, clWater, 8, clIslet, 0),
		clHill,
		scaleByMapSize(1, 4) * numPlayers);
	yield 45;

	g_Map.log("Creating forests");
	const [forestTrees, stragglerTrees] = getTreeCounts(...rBiomeTreeCount(1));
	createForests(
		[tMainTerrain, tForestFloor1, tForestFloor2, pForest1, pForest2],
		avoidClasses(clPlayer, 18, clForest, 16, clHill, 0, clWater, 6, clIslet, 0),
		clForest,
		forestTrees);
	yield 55;

	g_Map.log("Creating dirt patches");
	createLayeredPatches(
		[scaleByMapSize(3, 6), scaleByMapSize(5, 10), scaleByMapSize(8, 21)],
		[
			[tMainTerrain, tTier1Terrain],
			[tTier1Terrain, tTier2Terrain],
			[tTier2Terrain, tTier3Terrain]
		],
		[1, 1],
		avoidClasses(clWater, 2, clForest, 0, clHill, 0, clDirt, 5, clPlayer, 10, clIslet, 0),
		scaleByMapSize(15, 45),
		clDirt);

	g_Map.log("Creating grass patches");
	createPatches(
		[scaleByMapSize(2, 4), scaleByMapSize(3, 7), scaleByMapSize(5, 15)],
		tTier4Terrain,
		avoidClasses(clWater, 2, clForest, 0, clHill, 0, clDirt, 5, clPlayer, 10, clIslet, 0),
		scaleByMapSize(15, 45),
		clDirt);
	yield 65;

	g_Map.log("Creating stone mines ashore");
	createMines(
		[
			[
				new SimpleObject(oStoneSmall, 0, 2, 0, 4, 0, 2 * Math.PI, 1),
				new SimpleObject(oStoneLarge, 1, 1, 0, 4, 0, 2 * Math.PI, 4)
			],
			[new SimpleObject(oStoneSmall, 2, 5, 1, 3)]
		],
		avoidClasses(clWater, 3, clForest, 1, clPlayer, 18, clRock, 10, clHill, 2, clIslet, 0),
		clRock);

	// Deliberately thin on the mainland. If you want metal, you go and take it.
	g_Map.log("Creating the meagre mainland metal");
	createMines(
		[[new SimpleObject(oMetalLarge, 1, 1, 0, 4)]],
		avoidClasses(clWater, 3, clForest, 1, clPlayer, 22, clMetal, 14, clRock, 6, clHill, 2,
			clIslet, 0),
		clMetal,
		scaleByMapSize(2, 5));

	g_Map.log("Creating the contested metal on the islets");
	createMines(
		[
			[
				new SimpleObject(oMetalLarge, 1, 2, 2, 5),
				new SimpleObject(oMetalSmall, 0, 2, 3, 6)
			]
		],
		[
			stayClasses(clIslet, 2),
			avoidClasses(clMetal, 6, clRock, 4)
		],
		clMetal,
		isletCount * 3);

	g_Map.log("Creating a little islet stone for the players who hold them");
	createMines(
		[[new SimpleObject(oStoneSmall, 2, 4, 1, 3)]],
		[
			stayClasses(clIslet, 2),
			avoidClasses(clMetal, 4, clRock, 8)
		],
		clRock,
		isletCount);
	yield 75;

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
			scaleByMapAreaAbsolute(16),
			scaleByMapAreaAbsolute(8),
			planetm * scaleByMapAreaAbsolute(13),
			planetm * scaleByMapAreaAbsolute(13),
			planetm * scaleByMapAreaAbsolute(13)
		],
		avoidClasses(clWater, 1, clForest, 0, clPlayer, 0, clHill, 0));

	g_Map.log("Strewing rocks along both shorelines");
	createDecoration(
		[
			[new SimpleObject(aRockLarge, 1, 2, 0, 2), new SimpleObject(aRockMedium, 1, 3, 0, 3)]
		],
		[
			scaleByMapSize(40, 200)
		],
		borderClasses(clWater, 4, 3));
	yield 80;

	createFood(
		[
			[new SimpleObject(oMainHuntableAnimal, 5, 7, 0, 4)],
			[new SimpleObject(oSecondaryHuntableAnimal, 2, 3, 0, 2)]
		],
		[
			3 * numPlayers,
			3 * numPlayers
		],
		avoidClasses(clWater, 2, clForest, 0, clPlayer, 18, clHill, 1, clFood, 16, clIslet, 0),
		clFood);

	createFood(
		[
			[new SimpleObject(oFruitBush, 5, 7, 0, 4)]
		],
		[
			randIntInclusive(1, 4) * numPlayers + 2
		],
		avoidClasses(clWater, 3, clForest, 0, clPlayer, 18, clHill, 1, clFood, 10, clIslet, 0),
		clFood);

	g_Map.log("Stocking the channel with fish");
	createFood(
		[
			[new SimpleObject(oFish, 2, 3, 0, 2)]
		],
		[
			scaleByMapSize(30, 50) * numPlayers
		],
		[
			avoidClasses(clFood, 6, clIslet, 3),
			stayClasses(clWater, 4)
		],
		clFood);
	yield 88;

	createStragglerTrees(
		[oTree1, oTree2, oTree4, oTree3],
		avoidClasses(clWater, 2, clForest, 5, clHill, 1, clPlayer, 10, clMetal, 6, clRock, 6,
			clIslet, 0),
		clForest,
		stragglerTrees);

	g_Map.log("Planting a handful of trees on the islets");
	createStragglerTrees(
		[oTree1, oTree3],
		[
			stayClasses(clIslet, 2),
			avoidClasses(clMetal, 3, clRock, 3)
		],
		clForest,
		isletCount * 6);

	if (!mapSettings.Nomad)
	{
		g_Map.log("Giving every player a dock on the strait");
		const [playerIDs, playerPosition] =
			Object.values(playerPlacementRiver(straitAngle + Math.PI / 2, fractionToTiles(0.62)));

		for (let i = 0; i < numPlayers; ++i)
		{
			const dockLocation = findLocationInDirectionBasedOnHeight(
				playerPosition[i], mapCenter, -3, heightLand - 0.5, 2);

			if (!dockLocation)
				continue;

			const outwardAngle =
				getAngle(mapCenter.x, mapCenter.y, playerPosition[i].x, playerPosition[i].y);

			g_Map.placeEntityPassable(oDock, playerIDs[i], dockLocation, outwardAngle + Math.PI);
		}
	}

	placePlayersNomad(
		clPlayer,
		avoidClasses(clWater, 6, clForest, 1, clMetal, 4, clRock, 4, clHill, 4, clFood, 2,
			clIslet, 0));

	setSkySet(pickRandom(["cirrus", "cumulus", "sunny"]));
	setSunRotation(randomAngle());
	setSunElevation(randFloat(1 / 5, 1 / 3) * Math.PI);
	setWaterColor(0.078, 0.212, 0.396);
	setWaterTint(0.192, 0.404, 0.643);
	setWaterMurkiness(0.72);
	setWaterWaviness(3.5);
	setWaterType("ocean");

	return g_Map;
}
