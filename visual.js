(function (s) {
	"use strict";

	TSC.visual = {};

	s = TSC.visual;

	s.init = function () {
		TSC.buttons = document.getElementsByTagName("button");
		TSC.svg = new TSC.SVG(document.getElementById("svg"));
		TSC.eventEmitter = EventEmitter.create(this);

		/**
		 * Click matrix
		 * @param {HTMLElement} element
		 */
		TSC.clickMatrixButton = function (element) {
			window.location.hash = "matrix";
			document.body.className = "matrix";
			switchModes(element);
			TSC.matrixVisual.init();
		};

		/**
		 * Click map
		 * @param {HTMLElement} element
		 */
		TSC.clickMapButton = function (element) {
			window.location.hash = "map";
			document.body.className = "map";
			switchModes(element);
			TSC.mapVisual.init();
		};

		/**
		 * Switch modes
		 * @param {HTMLElement} element
		 */
		function switchModes(element) {
			removeButtonsActiveClass(element);
			element.classList.add("active");
			TSC.eventEmitter.unsubscribe();
			TSC.svg.clear();
		}

		/**
		 * Remove active class from buttons
		 * @param {HTMLElement} except
		 */
		function removeButtonsActiveClass(except) {
			var buttons = Array.prototype.slice.call(TSC.buttons),
				button,
				i;

			for (i = 0; i < buttons.length; i++) {
				button = buttons[i];
				if (button !== except) {
					button.classList.remove("active");
				}
			}
		}
	};

	/**
	 * Refresh id collector - increase "z-index" (move as last svg element in DOM)
	 * @param {IdCollector} idCollector
	 */
	s.refreshIdCollector = function (idCollector) {
		var elementId,
			element,
			i;

		for (i = 0; i < idCollector.length; i++) {
			elementId = idCollector[i];
			element = document.getElementById(elementId);
			TSC.svg.canvas.appendChild(element);
		}
	};

	/**
	 * Clear id collector
	 * @param {IdCollector} idCollector
	 */
	s.clearIdCollector = function (idCollector) {
		var itemId,
			item;

		while (idCollector.length) {
			itemId = idCollector.shift();
			item = document.getElementById(itemId);
			item.remove();
		}
	};


}());