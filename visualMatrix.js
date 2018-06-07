/* global MG */
(function (p) {
	"use strict";

	var visual = TSC.visual,
		svg = TSC.svg,
		eventEmitter = TSC.eventEmitter;

	/**
	 * Visualize tsc data
	 * @constructor
	 */
	TSC.MatrixVisual = function () {
		this.svg = TSC.svg;
		this.color = "yellow";
		/** @type {State} */
		this.state = state;
		/** @type {MatrixDefinition} */
		this.matrix = this.calculateMatrixDefinition(TSC.width, TSC.height, this.state.destinations);

		this.type = TSC.legendType.Original;
	};

	p = TSC.MatrixVisual.prototype;

	/**
	 * Init
	 */
	p.init = function () {
		this.clear();
		this.renderLegend();
		this.renderAllNodesBasicColor(this.rendered.allNodes);
		this.createEvents();
		this.renderBestSolutions(0, this.rendered.bestSolution);
	};

	/**
	 * Clear
	 */
	p.clear = function () {
		this.rendered = {
			allNodes: [],
			bestSolution: [],
			tenBestSolutions: [],
			fragments: [],
			nodeHovered: [],
			boruvka: []
		};
		this.visualState = {
			destsDays: {},
			fragments: {},
			highlightedWays: {},
			heatMapWays: {}
		};
	};

	/**
	 * Create events
	 */
	p.createEvents = function () {
		var self = this,
			bestSolution = document.getElementById("matrixBestSolution"),
			tenBestSolutions = document.getElementById("matrixTenBestSolutions"),
			fragments = document.getElementById("matrixFragments"),
			boruvka = document.getElementById("matrixBoruvka");

		bestSolution.checked = true;
		tenBestSolutions.checked = false;
		fragments.checked = false;

		eventEmitter.subscribe(bestSolution, "change", function (data) {
			var checked = data[0].currentTarget.checked;

			if (checked) {
				self.renderBestSolutions(0, self.rendered.bestSolution);
			} else {
				self.clearIdCollector(self.rendered.bestSolution);
			}
			return true;
		});
		eventEmitter.subscribe(tenBestSolutions, "change", function (data) {
			var checked = data[0].currentTarget.checked;

			if (checked) {
				self.renderBestSolutions(10, self.rendered.tenBestSolutions);
			} else {
				self.clearIdCollector(self.rendered.tenBestSolutions);
			}
			return true;
		});
		eventEmitter.subscribe(fragments, "change", function (data) {
			var checked = data[0].currentTarget.checked;

			if (checked) {
				self.renderTotallyBestFragments(10, self.rendered.fragments);
			} else {
				self.clearIdCollector(self.rendered.fragments);
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
			destinations = state.destinations,
			fragments = state.fragments.fragmentsDestTotallyBest,
			destFragments,
			destFragment,
			matrix = this.matrix,
			i,
			cx,
			cy,
			fromDestPrice,
			toDestPrice,
			fromDestIndex,
			toDestIndex,
			cxFrom,
			cyFrom,
			cxTo,
			cyTo,
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

				cx = matrix.left + dayIndex * matrix.stepDay;
				cy = matrix.top + destIndex * matrix.stepDestination;

				cxFrom = matrix.left + (dayIndex - 1) * matrix.stepDay;
				cyFrom = matrix.top + fromDestIndex * matrix.stepDestination;

				cxTo = matrix.left + (dayIndex + 1) * matrix.stepDay;
				cyTo = matrix.top + toDestIndex * matrix.stepDestination;


				idCollector.push(this.svg.drawRectangleCentered(cx, cy, 30, 20));
				idCollector.push(this.svg.drawArrow(cxFrom, cyFrom, cx, cy, fromDestPrice, "fragmentArrow"));
				idCollector.push(this.svg.drawArrow(cx, cy, cxTo, cyTo, toDestPrice, "fragmentArrow"));
			}
		}

	};

	/**
	 *
	 * @param {IdCollector} idCollector
	 */
	p.renderAllNodesBasicColor = function (idCollector) {
		var matrix = this.matrix,
			destsDays = this.visualState.destsDays,
			dayIndex,
			destIndex,
			dataString,
			eventsString,
			data,
			x,
			y;

		// start
		destsDays[0] = {0: this.svg.drawCircle(matrix.left, matrix.top, 5)};
		// finish
		destsDays[0][matrix.daysCount] = this.svg.drawCircle(matrix.right, matrix.top, 5);

		for (destIndex = 1; destIndex < matrix.destinationsCount; destIndex++) {
			destsDays[destIndex] = {};
			for (dayIndex = 1; dayIndex < matrix.daysCount - 1; dayIndex++) {
				x = matrix.left + dayIndex * matrix.stepDay;
				y = matrix.top + destIndex * matrix.stepDestination;

				data = {
					destIndex: destIndex,
					dayIndex: dayIndex,
					y: y,
					x: x,
					elementId: "node-" + destIndex + "-" + dayIndex
				};

				dataString = encodeURI(JSON.stringify(data));
				eventsString = " " +
					' onmouseover="TSC.matrixVisual.nodeMouseOver(event, this,\'' + dataString + '\');" ' +
					' onmouseout="TSC.matrixVisual.nodeMouseOut(event, this,\'' + dataString + '\');" ';

				idCollector.push(
					destsDays[destIndex][dayIndex] = this.svg.drawCircle(x, y, 5, undefined, eventsString, data.elementId, 25)
				);
			}
		}
	};

	/**
	 *
	 */
	p.refreshNodes = function () {
		this.refreshIdColector(this.rendered.allNodes);
	};

	/**
	 *
	 */
	p.refreshIdColector = function (idCollector) {
		var elementId,
			element,
			i;

		for (i = 0; i < idCollector.length; i++) {
			elementId = idCollector[i];
			element = document.getElementById(elementId);
			this.svg.canvas.appendChild(element);
		}
	};

	/**
	 * @typedef {Object} Data
	 * @property {number} destIndex
	 * @property {number} dayIndex
	 * @property {number} y
	 * @property {number} x
	 * @property {string} elementId
	 */

	/**
	 * Node mouse over
	 * @param {MouseEvent} event
	 * @param {SVGElement} element
	 * @param {string} encodedData
	 */
	p.nodeMouseOver = function (event, element, encodedData) {
		var data = /** @type {Data} */ JSON.parse(decodeURI(encodedData)),
			idCollector = /** @type {IdCollector} */ this.rendered.nodeHovered,
			destDays = this.state.destsDays,
			arrivals = destDays.arrivals[data.destIndex][data.dayIndex],
			arrival,
			departures = destDays.departures[data.destIndex][data.dayIndex],
			departure,
			i;

		stopPropagation(event);

		// arrows
		for (i = 0; i < arrivals.length; i++) {
			arrival = arrivals[i];
			idCollector.push(this.renderFlight(arrival.flight, i, true, false));
		}
		for (i = 0; i < departures.length; i++) {
			departure = departures[i];
			idCollector.push(this.renderFlight(departure.flight, i, true, false));
		}

		// numbers
		for (i = 0; i < arrivals.length; i++) {
			arrival = arrivals[i];
			idCollector.push(this.renderFlight(arrival.flight, i, false, true));
		}
		for (i = 0; i < departures.length; i++) {
			departure = departures[i];
			idCollector.push(this.renderFlight(departure.flight, i, false, true));
		}


		// force "z-index" (move as last svg element)
		this.svg.canvas.appendChild(element);
		this.refreshNodes();
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
			idCollector.push(this.svg.drawArrow(x1, y1, x2, y2, undefined, cssClassesString));
		}
		if (text !== false) {
			idCollector.push(this.svg.writeText((x1 + x2) / 2, (y1 + y2) / 2, flight.price, cssClassesString));
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

		this.clearIdCollector(this.rendered.nodeHovered);
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
			matrix = this.matrix,
			daysTotal = matrix.daysCount - 1,
			i,
			x1,
			y1,
			x2,
			y2,
			keys,
			placeFromId,
			placeToId,
			dayIndex,
			value = undefined,
			length,
			actualKey,
			blacklist,
			parts;

		//render each day

		for (i = 0, keys = Object.keys(edges), length = keys.length; i < length; ++i) {
			actualKey = keys[i];
			//value = edges[actualKey];
			parts = actualKey.split("rel");
			placeFromId = parts[0];
			placeToId = parts[1];
			for (dayIndex = 0; dayIndex < daysTotal; dayIndex++) {
				blacklist = placeToId === 0 && dayIndex < daysTotal - 1;
				blacklist = blacklist || placeFromId === 0 && dayIndex !== 0;

				if (blacklist === false) {
					x1 = matrix.left + dayIndex * matrix.stepDay;
					y1 = matrix.top + placeFromId * matrix.stepDestination;
					x2 = matrix.left + (dayIndex + 1) * matrix.stepDay;
					y2 = matrix.top + placeToId * matrix.stepDestination;
					idCollector.push(svg.drawLine(
						x1, y1,
						x2, y2,
						value, "fragmentArrow")
					);
					idCollector.push(svg.drawLine(
						x1, y2,
						x2, y1,
						value, "fragmentArrow")
					);
				}
			}

		}
	};

	/**
	 * Render best solutions
	 * @param {number} bestCount
	 * @param {IdCollector} idCollector
	 */
	p.renderBestSolutions = function (bestCount, idCollector) {
		var solutionsSet, way, j, quality,
			state = this.state,
			bestSolutions = state.bestSolutions,
			i,
			item,
			itemsArray,
			matrix = this.matrix,
			minOfStopNumber = typeof bestCount === "number" ?
				Math.min(bestSolutions.length, bestCount + 1) :
				bestSolutions.length;

		// reverse order because of z-index order
//		for (quality = minOfStopNumber - 1; quality >= 0; quality--) {

		for (quality = 0; quality < minOfStopNumber; quality++) {
			solutionsSet = bestSolutions[quality];
			//console.log("\t#" + (quality + 1));
			for (j = 0; j < solutionsSet.length; j++) {
				way = solutionsSet[j];

				itemsArray = this.renderLineThrough(way, 0, matrix.daysCount, quality);

				for (i = 0; i < itemsArray.length; i++) {
					item = itemsArray[i];
					idCollector.push(item);
				}

			}
		}
		this.refreshNodes();
	};

	/**
	 * Clear id collector
	 * @param {IdCollector} idCollector
	 */
	p.clearIdCollector = function (idCollector) {
		var itemId,
			item;

		while (idCollector.length) {
			itemId = idCollector.shift();
			item = document.getElementById(itemId);
			item.remove();
		}
	};

	/**
	 * Render line through
	 * @param {Way} way
	 * @param {number} fromDay
	 * @param {number} toDay
	 * @param {number} quality
	 */
	p.renderLineThrough = function (way, fromDay, toDay, quality) {
		var dayIndex,
			elementsList = [],
			matrix = this.matrix,
			inWayIndex = 0,
			wayLength = way.flights.length,
			x1, y1, x2, y2,
			cssClasses = "bestSolution quality" + quality;

		fromDay = fromDay || 0;
		toDay = toDay || wayLength;

		for (dayIndex = fromDay; dayIndex < toDay && inWayIndex < wayLength; dayIndex++, inWayIndex++) {
			x1 = matrix.left + dayIndex * matrix.stepDay;
			y1 = matrix.top + way.flights[dayIndex].from * matrix.stepDestination;
			x2 = matrix.left + (dayIndex + 1) * matrix.stepDay;
			y2 = matrix.top + way.flights[dayIndex].to * matrix.stepDestination;

			elementsList.push(this.svg.drawArrow(x1, y1, x2, y2, way.flights[dayIndex].price, cssClasses));
		}

		this.refreshNodes();
		return elementsList;
	};

	/**
	 *
	 */
	p.renderLegend = function () {
		var matrix = this.matrix,
			dayIndex,
			destIndex,
			x,
			y;

		for (dayIndex = 0; dayIndex < matrix.daysCount; dayIndex++) {
			x = matrix.left + dayIndex * matrix.stepDay;
			y = matrix.top - matrix.placeForDay;

			this.svg.writeText(x, y, dayIndex);
		}
		for (destIndex = 0; destIndex < matrix.destinationsCount; destIndex++) {
			x = matrix.left - matrix.placeForDestination * 1.5;
			y = matrix.top + destIndex * matrix.stepDestination + this.svg.legendSize / 3;

			this.svg.writeText(x, y, this.getDestinationName(destIndex));
		}
	};

	/**
	 * Calculate matrix for other renderers
	 * @param {number} width
	 * @param {number} height
	 * @param {Destinations} destinations
	 * @return {MatrixDefinition}
	 */
	p.calculateMatrixDefinition = function (width, height, destinations) {
		var canvasWidth = TSC.width,
			canvasHeight = TSC.height,
			placeForDestination = 30,
			placeForDay = 30,
			matrixWidth = canvasWidth * 0.9 - placeForDestination,
			matrixHeight = canvasHeight * 0.7 - placeForDay,
			top = canvasHeight * 0.05 + placeForDay,
			bottom = top + matrixHeight,
			left = canvasWidth * 0.05 + placeForDestination,
			right = left + matrixWidth,
			destinationsCount = destinations.length,
			daysCount = destinations.length + 1,
			stepDestination = matrixHeight / (destinationsCount - 1),
			stepDay = matrixWidth / (daysCount - 1);

		return {
			canvasWidth: canvasWidth,
			canvasHeight: canvasHeight,
			placeForDestination: placeForDestination,
			placeForDay: placeForDay,
			matrixWidth: matrixWidth,
			matrixHeight: matrixHeight,
			top: top,
			bottom: bottom,
			left: left,
			right: right,
			destinationsCount: destinationsCount,
			daysCount: daysCount,
			stepDestination: stepDestination,
			stepDay: stepDay
		};
	};

	/**
	 * Get destination name
	 * @param {number} index
	 * @param {TSC.legendType} type
	 * @return {string}
	 */
	p.getDestinationName = function (index, type) {
		var actualType = type || this.type;

		switch (actualType) {
		case TSC.legendType.Original:
			return this.state.destinations[index];
		case TSC.legendType.ABC:
			return String.fromCharCode(65 + index);
		default:
			return String(index);
		}
	};

}());