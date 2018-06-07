(function (p) {
	"use strict";

	/**
	 * SVG
	 * @constructor
	 * @param {DOMElement} canvasToDrawOn
	 */
	TSC.SVG = function (canvasToDrawOn) {
		this.canvas = canvasToDrawOn;
		this.color = TSC.colors.light; // default
		this.strokeWidth = 2;
		this.backgroundColor = TSC.colors.dark; // default
		this.legendSize = 20;
		this.rectRadius = .15;
		this.idCounter = 1;


	};

	p = TSC.SVG.prototype;

	/**
	 * Clear
	 */
	p.clear = function () {
		this.canvas.innerHTML = "";
	};

	/**
	 * Write text
	 * @param {number} cx
	 * @param {number} cy
	 * @param {string|number?} text
	 * @param {string?} cssClassesString
	 * @param {boolean?} returnStringOnly
	 * @return {Element|string}
	 */
	p.writeText = function (cx, cy, text, cssClassesString, returnStringOnly) {
		var idCounter = "text" + this.idCounter++,
			html = '<g id="' + idCounter + '" data-cx="' + cx + '" data-cy="' + cy + '"' +
				' class="arrow ' + (cssClassesString || "") + '"' +
				">";
		cy += 6;
		html += '<text x="' + cx + '" y="' + cy + '" ' +
			'fill="' + this.color + '" font-size="' + this.legendSize + '" ' +
			'text-anchor="middle" ' +
			// 'style="filter: url(#glow); stroke: #111; " ' +
			'style="stroke: #111; stroke-width: 5px" ' +
			//'filter="url(#textShadow)"' +
			">" + text + "</text>";

		html += '<text x="' + cx + '" y="' + cy + '" ' +
			'fill="' + this.color + '" font-size="' + this.legendSize + '" ' +
			'text-anchor="middle" ' +
			//'filter="url(#textShadow)"' +
			">" + text + "</text>";

		html += "</g>";
		//console.log("text html", html + "</g>");

		if (returnStringOnly === true) {
			return html;
		}

		this.canvas.innerHTML += html + "</g>";
		return idCounter;
	};

	/**
	 * Draw rectangle centered
	 * @param {number} cx
	 * @param {number} cy
	 * @param {number} width
	 * @param {number} height
	 * @param {text|number?} text
	 * @param {text?} color
	 */
	p.drawRectangleCentered = function (cx, cy, width, height, text, color) {
		return this.drawRectangleCenteredPlus(cx, cy, width, height, text, color);
	};

	/**
	 * Draw rectangle centered + data
	 * @param {number} cx
	 * @param {number} cy
	 * @param {number} width
	 * @param {number} height
	 * @param {text|number?} text
	 * @param {text?} color
	 * @param {Object} data
	 */
	p.drawRectangleCenteredData = function (cx, cy, width, height, text, color, data) {
		var plus = "",
			length,
			keys,
			i;

		for (i = 0, keys = Object.keys(data), length = keys.length; i < length; ++i) {
			plus += " data-" + keys[i] + '="' + object[keys[i]] + '"';
		}

		this.drawRectangleCenteredPlus(cx, cy, width, height, text, color, plus);
	};

	/**
	 * Draw rectangle centered + string
	 * @param {number} cx
	 * @param {number} cy
	 * @param {number} width
	 * @param {number} height
	 * @param {text|number?} text
	 * @param {text?} color
	 * @param {string} plus
	 * @return {Element}
	 */
	p.drawRectangleCenteredPlus = function (cx, cy, width, height, text, color, plus) {
		var idCounter = "rectangle" + this.idCounter++,
			html = '<g id="' + idCounter + '" data-cx="' + cx + '" data-cy="' + cy + '">',
			rx = width * this.rectRadius,
			ry = height * this.rectRadius,
			x = cx - width / 2,
			y = cy - height / 2,
			textDistance = 10,
			xText,
			yText;

		html += '<rect x="' + x + '" y="' + y + '" ' +
			'width="' + width + '" height="' + height + '" ' +
			'rx="' + rx + '" ry="' + ry + '" ' +
			'stroke="' + (color || this.color) + '" stroke-width="2" ' +
			'fill="none"' +
			(plus || "") +
			"/>";

		if (text !== undefined) {
			//console.log("circle text", text);
			xText = x;
			yText = y - textDistance;

			html += '<text x="' + xText + '" y="' + yText + '">' + text + "</text>";
		}

		this.canvas.innerHTML += html + "</g>";
		return idCounter;
	};
	/**
	 * Draw circle
	 * @param {number} cx
	 * @param {number} cy
	 * @param {number} r
	 * @param {text|number?} text
	 * @param {string?} plus
	 * @param {string?} idCounterForce
	 * @param {number?} invisibleR
	 * @return {string}
	 */
	p.drawCircle = function (cx, cy, r, text, plus, idCounterForce, invisibleR) {
		var idCounter = idCounterForce || "circle" + this.idCounter++,
			html = '<g id="' + idCounter + '" data-cx="' + cx + '" data-cy="' + cy + '">',
			textDistance = 20,
			cxText,
			cyText;

		if (invisibleR) {

			html += '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" ' +
				'stroke="' + this.color + '" stroke-width="' + this.strokeWidth + '"' +
				(plus || "") +
				"/>";

			// invisible top
			html += '<circle cx="' + cx + '" cy="' + cy + '" r="' + invisibleR + '" ' +
				'stroke="blue" stroke-width="' + this.strokeWidth + '"' +
				' class="invisible"' +
				(plus || "") + "/>";


		} else {
			html += '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" ' +
				'stroke="' + this.color + '" stroke-width="' + this.strokeWidth + '"' +
				(plus || "") + "/>";

		}

		if (text !== undefined) {
			//console.log("circle text", text);
			cxText = cx;
			cyText = cy - textDistance;

			html += this.writeText(cxText, cyText, text, undefined, true);
		}

		this.canvas.innerHTML += html + "</g>";
		return idCounter;
	};

	/**
	 * Draw arrow
	 * @param {number} x1
	 * @param {number} y1
	 * @param {number} x2
	 * @param {number} y2
	 * @param {string|number?} text
	 * @param {string?} cssClassesString
	 * @return {string}
	 */
	p.drawLine = function (x1, y1, x2, y2, text, cssClassesString) {
		var idCounter = "line" + this.idCounter++,
			html = '<g id="' + idCounter + '" data-x1="' + x1 + '" data-y1="' + y1 + '"' +
				' class="line ' + (cssClassesString || "") + '"' +
				">",
			path,
			cxText,
			cyText;

		// main line absolute
		path = '<path d="';
		path += "M " + x1 + "," + y1 + " L " + x2 + "," + y2 + '" ';
		path += "/>";
		html += path;

		if (text !== undefined) {
			cxText = (x1 + x2) / 2;
			cyText = (y1 + y2) / 2; //cy - textDistance;

			html += this.writeText(cxText, cyText, text, undefined, true);
		}
		this.canvas.innerHTML += html + "</g>";

		return idCounter;
	};

	/**
	 * Draw arrow
	 * @param {number} x1
	 * @param {number} y1
	 * @param {number} x2
	 * @param {number} y2
	 * @param {string|number?} text
	 * @param {string?} cssClassesString
	 * @return {string}
	 */
	p.drawArrow = function (x1, y1, x2, y2, text, cssClassesString) {
		var idCounter = "arrow" + this.idCounter++,
			html = '<g id="' + idCounter + '" data-x1="' + x1 + '" data-y1="' + y1 + '"' +
				' class="arrow ' + (cssClassesString || "") + '"' +
				">",
			path,
			cxText,
			cyText,
			textDistance = 10,
			textAngle,
			deltaAngle = 10,
			deltaRad = radians(deltaAngle),
			length = pythagoras(x2 - x1, y2 - y1),
			headLength = 20, //length * 0.1,
			angle = correctAngle(Math.atan2(x2 - x1, y2 - y1));


		// main line absolute
		path = '<path d="';
		path += "M " + x1 + "," + y1 + " L " + x2 + "," + y2 + '" ';
		path += 'class="forwards"/>';
		html += path;

		// arrow head
		path = '<path d="';
		// reset top absolute
		path += "M " + x2 + "," + y2 + " ";
		// one arrow part relative
		path += "l " + Math.cos(angle + deltaRad) * headLength + "," + Math.sin(angle + deltaRad) * headLength;
		// reset top absolute
		path += "M " + x2 + "," + y2 + " ";
		// second arrow part relative
		path += "l " + Math.cos(angle - deltaRad) * headLength + "," + Math.sin(angle - deltaRad) * headLength;
		//path += 'class="' +  + '"/>';
		path += '"/>';
		// add path
		html += path;

		if (text !== undefined) {
			//console.log("circle text", text);
			cxText = (x1 + x2) / 2;
			cyText = (y1 + y2) / 2; //cy - textDistance;

			html += this.writeText(cxText, cyText, text, undefined, true);
		}

		//html += '<circle cx="' + x1 + '" cy="' + y1 + '" r="3" stroke="black" stroke-width="1"/>';

		// console.log("arrow html", html + "</g>");
		this.canvas.innerHTML += html + "</g>";

		return idCounter;
	};

	/**
	 * Pythagoras get c from a b
	 * @param {number} a
	 * @param {number} b
	 * @return {number}
	 */
	function pythagoras(a, b) {
		return Math.sqrt(a * a + b * b);
	}

	/**
	 * Correct angle from Math.atan2 to use with cos and sin
	 * @param {number} angleFromAtan2
	 * @return {number}
	 */
	function correctAngle(angleFromAtan2) {
		angleFromAtan2 = -angleFromAtan2;
		angleFromAtan2 -= Math.PI / 2;
		return angleFromAtan2;
	}

	/**
	 * Radians from degrees
	 * @param {number} degreesToConvert
	 * @return {number}
	 */
	function radians(degreesToConvert) {
		return degreesToConvert * Math.PI / 180;
	}

	/**
	 * Degrees from radians
	 * @param {number} radiansToConvert
	 * @return {number}
	 */
	function degrees(radiansToConvert) {
		return radiansToConvert * 180 / Math.PI;
	}
}());