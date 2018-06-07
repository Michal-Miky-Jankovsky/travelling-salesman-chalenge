(function (p) {
	"use strict";

	var visual = TSC.visual,
		svg = TSC.svg,
		eventEmitter = TSC.eventEmitter;

	/**
	 *
	 * @constructor
	 */
	TSC.MapVisual = function () {
		var initPlaces;

		/** @type {State} */
		this.state = state;
		initPlaces = calculateInitPlaces(this.state.destinations, TSC.kiwiPlaces);
		/** @type {MapDefinition} */
		this.mapDefinition = calculateMapDefinition(TSC.width, TSC.height, initPlaces);
		/** @type {Places} */
		this.places = calculateAbsolutePlaces(initPlaces, this.mapDefinition);
	};

	p = TSC.MapVisual.prototype;

	/**
	 * Init
	 */
	p.init = function () {
		this.clear();
		this.renderNodes(this.rendered.allNodes);
		this.createEvents();
		this.renderBestSolutions(0, 0, this.rendered.bestSolution);
	};

	/**
	 *
	 */
	p.clear = function () {
		// idCollectors
		this.rendered = {
			bestSolution: [],
			tenBestSolutions: [],
			allNodes: [],
			fragments: [],
			boruvka: []
		};
	};

	/**
	 * Render nodes
	 * @param {IdCollector} idCollector
	 */
	p.renderNodes = function (idCollector) {
		var places = /** @type {Place} */ this.places,
			place = places[0],
			data,
			dataString,
			eventsString,
			i;

		// endpoint - no hover effect
		idCollector.push(
			svg.drawCircle(
				place.canvasX, place.canvasY, 5, place.displayName
				//place.canvasX, place.canvasY, 5, "endpoint"
			)
		);

		for (i = 1; i < places.length; i++) {
			place = places[i];

			//console.log(place.canvasX, place.canvasY);

			data = {
				destIndex: i,
				elementId: "node-" + place.id
			};

			dataString = encodeURI(JSON.stringify(data));
			eventsString = " " +
				' onmouseover="TSC.mapVisual.nodeMouseOver(event, this,\'' + dataString + '\');" ' +
				' onmouseout="TSC.mapVisual.nodeMouseOut(event, this,\'' + dataString + '\');" ';

			idCollector.push(
				svg.drawCircle(place.canvasX, place.canvasY, 5, undefined, eventsString, data.elementId, 25)
			);
			// out of refresh idCollector
			svg.writeText(place.canvasX, place.canvasY - 20, place.displayName);

		}
	};


	/**
	 * Node mouse over
	 * @param {MouseEvent} event
	 * @param {SVGElement} element
	 * @param {string} encodedData
	 */
	p.nodeMouseOver = function (event, element, encodedData) {
		// var data = /** @type {Data} */ JSON.parse(decodeURI(encodedData)),
		// 	idCollector = /** @type {IdCollector} */ this.rendered.nodeHovered,
		// 	destDays = this.state.destsDays,
		// 	arrivals = destDays.arrivals[data.destIndex][data.dayIndex],
		// 	arrival,
		// 	departures = destDays.departures[data.destIndex][data.dayIndex],
		// 	departure,
		// 	i;

		stopPropagation(event);

		// // arrows
		// for (i = 0; i < arrivals.length; i++) {
		// 	arrival = arrivals[i];
		// 	idCollector.push(this.renderFlight(arrival.flight, i, true, false));
		// }
		// for (i = 0; i < departures.length; i++) {
		// 	departure = departures[i];
		// 	idCollector.push(this.renderFlight(departure.flight, i, true, false));
		// }
		//
		// // numbers
		// for (i = 0; i < arrivals.length; i++) {
		// 	arrival = arrivals[i];
		// 	idCollector.push(this.renderFlight(arrival.flight, i, false, true));
		// }
		// for (i = 0; i < departures.length; i++) {
		// 	departure = departures[i];
		// 	idCollector.push(this.renderFlight(departure.flight, i, false, true));
		// }

		this.refreshNodes();
	};

	/**
	 * Render flight
	 * @param {Flight} flight
	 * @param {number} quality
	 * @param {boolean} arrow
	 * @param {boolean} text
	 * @return {IdCollector}
	 */
	p.renderFlight = function (flight, quality, arrow, text) {
		var cssClassesString = "flight nodeHover quality" + quality,
			matrix = this.matrix,
			x1 = matrix.left + flight.day * matrix.stepDay,
			y1 = matrix.top + flight.from * matrix.stepDestination,
			x2 = matrix.left + (flight.day + 1) * matrix.stepDay,
			y2 = matrix.top + flight.to * matrix.stepDestination,
			idCollector = [];

		if (arrow !== false) {
			idCollector.push(svg.drawArrow(x1, y1, x2, y2, undefined, cssClassesString));
		}
		if (text !== false) {
			idCollector.push(svg.writeText((x1 + x2) / 2, (y1 + y2) / 2, flight.price, cssClassesString));
		}
		return idCollector;
	};

	/**
	 * Node mouse out
	 * @param {MouseEvent} event
	 * @param {SVGElement} element
	 * @param {string} encodedData
	 */
	p.nodeMouseOut = function (event, element, encodedData) {
		var data = /** @type {Data} */ decodeURI(encodedData);

		stopPropagation(event);

		// visual.clearIdCollector(this.rendered.nodeHovered);
	};

	/**
	 *
	 */
	p.createEvents = function () {
		var self = this,
			bestSolution = document.getElementById("mapBestSolution"),
			tenBestSolutions = document.getElementById("mapTenBestSolutions"),
			fragments = document.getElementById("mapFragments"),
			boruvka = document.getElementById("mapBoruvka");

		bestSolution.checked = true;
		tenBestSolutions.checked = false;

		eventEmitter.subscribe(bestSolution, "change", function (data) {
			var checked = data[0].currentTarget.checked;

			if (checked) {
				self.renderBestSolutions(0, 0, self.rendered.bestSolution);
			} else {
				visual.clearIdCollector(self.rendered.bestSolution);
			}
			return true;
		});
		eventEmitter.subscribe(tenBestSolutions, "change", function (data) {
			var checked = data[0].currentTarget.checked;

			if (checked) {
				self.renderBestSolutions(10, 0, self.rendered.tenBestSolutions);
			} else {
				visual.clearIdCollector(self.rendered.tenBestSolutions);
			}
			return true;
		});
		eventEmitter.subscribe(fragments, "change", function (data) {
			var checked = data[0].currentTarget.checked;

			if (checked) {
				self.renderTotallyBestFragments(10, self.rendered.fragments);
			} else {
				visual.clearIdCollector(self.rendered.fragments);
			}
			return true;
		});

		eventEmitter.subscribe(boruvka, "change", function (data) {
			var checked = data[0].currentTarget.checked;

			if (checked) {
				self.renderBoruvka(1, self.rendered.boruvka);
			} else {
				visual.clearIdCollector(self.rendered.boruvka);
			}
			return true;
		});

	};

	/**
	 *  Render top fragments
	 * @param {number} n
	 * @param {IdCollector} idCollector
	 */
	p.renderTotallyBestFragments = function (n, idCollector) {
		var state = this.state,
			places = /** @type {Places} */ this.places,
			destinations = state.destinations,
			fragments = state.fragments.fragmentsDestTotallyBest,
			destFragments,
			destFragment,
			matrix = this.matrix,
			i,
			cx,
			cy,
			placeCenter,
			placeFrom,
			placeTo,
			fromDestPrice,
			toDestPrice,
			fromDestIndex,
			toDestIndex,
			dayIndex,
			destIndex;

		for (destIndex = 1; destIndex < destinations.length; destIndex++) {
			destFragments = fragments[destIndex];
			for (i = 0; i < destFragments.length; i++) {
				destFragment = destFragments[i];
				dayIndex = destFragment.departure.flight.day;

				fromDestIndex = destFragment.arrival.flight.from;
				toDestIndex = destFragment.departure.flight.to;

				fromDestPrice = destFragment.arrival.flight.price;
				toDestPrice = destFragment.departure.flight.price;

				placeCenter = places[destIndex];
				placeFrom = places[fromDestIndex];
				placeTo = places[toDestIndex];

				idCollector.push(svg.drawRectangleCentered(placeCenter.canvasX, placeCenter.canvasY, 30, 20));
				idCollector.push(svg.drawArrow(
					placeFrom.canvasX, placeFrom.canvasY,
					placeCenter.canvasX, placeCenter.canvasY,
					fromDestPrice, "fragmentArrow"));
				idCollector.push(svg.drawArrow(
					placeCenter.canvasX, placeCenter.canvasY,
					placeTo.canvasX, placeTo.canvasY,
					toDestPrice, "fragmentArrow"));
			}
		}

	};

	/**
	 * Render boruvka
	 * @param {number} n
	 * @param {IdCollector} idCollector
	 */
	p.renderBoruvka = function (n, idCollector) {
		var state = this.state,
			boruvka = /** @type {Places} */ state.boruvka,
			edges = boruvka.edges,
			places = /** @type {Places} */ this.places,
			i,
			keys,
			value,
			length,
			actualKey,
			placeFrom,
			placeTo,
			parts;

		for (i = 0, keys = Object.keys(edges), length = keys.length; i < length; ++i) {
			actualKey = keys[i];
			//value = edges[actualKey];
			parts = actualKey.split("rel");
			placeFrom = places[parts[0]];
			placeTo = places[parts[1]];
			idCollector.push(svg.drawLine(
				placeFrom.canvasX, placeFrom.canvasY,
				placeTo.canvasX, placeTo.canvasY,
				value, "fragmentArrow")
			);
		}
	};

	/**
	 * Render best solutions
	 * @param {number} bestCount
	 * @param {number} offset
	 * @param {IdCollector} idCollector
	 */
	p.renderBestSolutions = function (bestCount, offset, idCollector) {
		var solutionsSet, way, j, quality,
			state = this.state,
			bestSolutions = state.bestSolutions,
			i,
			item,
			itemsArray,
			destinations = state.destinations,
			minOfStopNumber = typeof bestCount === "number" ?
				Math.min(bestSolutions.length, bestCount + 1) :
				bestSolutions.length;

		for (quality = 0; quality < minOfStopNumber; quality++) {
			solutionsSet = bestSolutions[quality];
			//console.log("\t#" + (quality + 1));
			for (j = 0; j < solutionsSet.length; j++) {
				way = solutionsSet[j];

				itemsArray = this.renderLineThrough(way, 0, destinations.length + 1, quality);

				for (i = 0; i < itemsArray.length; i++) {
					item = itemsArray[i];
					idCollector.push(item);
				}

			}
		}
		this.refreshNodes();
	};

	/**
	 * Render line through
	 * @param {Way} way
	 * @param {number} fromDay
	 * @param {number} toDay
	 * @param {number} quality
	 * @return {Array}
	 */
	p.renderLineThrough = function (way, fromDay, toDay, quality) {
		var places = /** @type {Place} */ this.places,
			dayIndex,
			elementsList = [],
			inWayIndex = 0,
			wayLength = way.flights.length,
			cssClasses = "bestSolution quality" + quality,
			fromIndex,
			toIndex,
			placeFrom,
			placeTo;

		fromDay = fromDay || 0;
		toDay = toDay || wayLength;

		for (dayIndex = fromDay; dayIndex < toDay && inWayIndex < wayLength; dayIndex++, inWayIndex++) {
			fromIndex = way.flights[dayIndex].from;
			toIndex = way.flights[dayIndex].to;
			placeFrom = places[fromIndex];
			placeTo = places[toIndex];

			elementsList.push(
				svg.drawArrow(
					placeFrom.canvasX, placeFrom.canvasY,
					placeTo.canvasX, placeTo.canvasY,
					"#" + dayIndex,
					// way.flights[dayIndex].price,
					cssClasses
				)
			);
		}

		this.refreshNodes();
		return elementsList;
	};

	/**
	 * Calculate absolute places
	 * @param {Array.<{lat :number,lng :number,x :number,y :number,id :string,displayName :string}>} initPlaces
	 * @param {MapDefinition} mapDefinition
	 * @return {Places}
	 */
	function calculateAbsolutePlaces(initPlaces, mapDefinition) {
		var i,
			place,
			conversionX = mapDefinition.conversionX,
			conversionY = mapDefinition.conversionY,
			top = mapDefinition.top,
			left = mapDefinition.left,
			leftCorrection = mapDefinition.startX * conversionX,
			topCorrection = mapDefinition.startY * conversionY;

		// enrich places
		for (i = 0; i < initPlaces.length; i++) {
			place = initPlaces[i];
			place.canvasX = left + place.x * conversionX - leftCorrection;
			place.canvasY = top + place.y * conversionY - topCorrection;
		}

		return initPlaces;
	}

	/**
	 * Calculate places
	 * @param {Destinations} destinations
	 * @param {KiwiRestPlaces} places
	 * @return {Array.<{lat :number,lng :number,x :number,y :number,id :string,displayName :string}>}
	 */
	function calculateInitPlaces(destinations, places) {
		var i,
			placesOut = [],
			coordinates,
			place,
			index;

		for (i = 0; i < places.length; i++) {
			place = places[i];

			index = destinations.indexOf(place.id);
			if (index !== -1) {
				coordinates = convertLatLng(place.lat, place.lng, 200, 100);

				placesOut[index] = {
					lat: place.lat,
					lng: place.lng,
					x: coordinates.x,
					y: coordinates.y,
					id: destinations[index],
					displayName: place.value
				};
			}
		}

		// completeness check // todo not working
		for (i = 0; i < places.length; i++) {
			place = places[i];
			if (!place) {
				debugger;
			}
		}

		return placesOut;
	}

	/**
	 * Calculate matrix for other renderers
	 * @param {State} state
	 * @param {number} width
	 * @param {number} height
	 * @param {Places} places
	 * @return {MapDefinition}
	 */
	function calculateMapDefinition(width, height, places) {
		var canvasWidth = width,
			canvasHeight = height,
			mapWidth = canvasWidth * 0.9,
			mapHeight = canvasHeight * 0.85,
			top = canvasHeight * 0.1,
			bottom = top + mapHeight,
			left = canvasWidth * 0.05,
			right = left + mapWidth,
			minX = null,
			minY = null,
			maxX = null,
			maxY = null,
			dest,
			conversion,
			i;

		// min & max
		for (i = 0; i < places.length; i++) {
			dest = places[i];
			if (minX === null || dest.x < minX) {
				minX = dest.x;
			}
			if (minY === null || dest.y < minY) {
				minY = dest.y;
			}
			if (maxX === null || dest.x > maxX) {
				maxX = dest.x;
			}
			if (maxY === null || dest.y > maxY) {
				maxY = dest.y;
			}
		}

		// fit x
		conversion = mapWidth / (maxX - minX);
		// check if shrink necessary for y
		if ((maxY - minY) * conversion > mapHeight) {
			//fit y
			conversion = mapHeight / (maxY - minY);
		}

		return {
			canvasWidth: canvasWidth,
			canvasHeight: canvasHeight,
			mapWidth: mapWidth,
			mapHeight: mapHeight,
			top: top,
			bottom: bottom,
			left: left,
			right: right,
			startX: minX,
			startY: minY,
			conversionX: conversion,
			conversionY: conversion
		};
	}

	/**
	 * Convert latitude longitude
	 * @param {number} latitude (φ)
	 * @param {number} longitude (λ)
	 * @param {number} mapWidth
	 * @param {number} mapHeight
	 * @return {{x: number, y: number}}
	 */
	function convertLatLng(latitude, longitude, mapWidth, mapHeight) {
		var x = (longitude + 180) * (mapWidth / 360), // get x value
			latRad = latitude * Math.PI / 180, // convert from degrees to radians
			mercN = Math.log(Math.tan(Math.PI / 4 + latRad / 2)),
			y = mapHeight / 2 - mapWidth * mercN / (2 * Math.PI);

		return {x: x, y: y};
	}

	/**
	 *
	 */
	p.refreshNodes = function () {
		visual.refreshIdCollector(this.rendered.allNodes);
	};


	/**
	 * Stop propagation
	 * @param {Event|MouseEvent} event
	 * @return {boolean}
	 */
	function stopPropagation(event) {
		var evt;

		//stopPropagation
		event.cancelBubble = true;
		if (event.stopPropagation !== undefined) {
			event.stopPropagation();
		}

		// cancelDefault
		evt = event ? event : window.event;

		if (evt.preventDefault) {
			evt.preventDefault();
		}
		evt.returnValue = false;
		return false;

	}

}());