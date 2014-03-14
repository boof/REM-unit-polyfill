(function(w, undef) {
	"use strict";

	var blockExp = /[\w\d\s\-\/\\\[\]:,.'"*()<>+~%#^$_=|@]+\{[\w\d\s\-\/\\%#:;,.'"*()]+\d*\.?\d+rem[\w\d\s\-\/\\%#:;,.'"*()]*\}/g,
		propertyExp = /\d*\.?\d+rem/g,
		rulesExp = /[\w\d\s\-\/\\%#:,.'"*()]+\d*\.?\d+rem[\w\d\s\-\/\\%#:,.'"*()]*[;}]/g;

	var rem = w.rem || {};
	rem.fontSize = 16;

	function removeComments(css) {
		var start = css.search(/\/\*/),
			end = css.search(/\*\//);
		if ((start > -1) && (end > start)) {
			css = css.substring(0, start) + css.substring(end + 2);
			return removeComments(css);
		} else {
			return css;
		}
	}

	// Test for Media Query support
	function mediaQuery() {
		return w.matchMedia || w.msMatchMedia;
	}
	// Remove queries.
	function removeMediaQueries(css) {
		// If the browser doesn't support media queries, we find all @media declarations in the CSS and remove them.
		// Note: Since @rules can't be nested in the CSS spec, we're safe to just check for the closest following "}}" to the "@media".
		return mediaQuery() ? css : css.replace(/@media[\s\S]*?\}\s*\}/, "");
	}

	function clean(css) {
		return removeComments(removeMediaQueries(css));
	}

	// collect all of the rules from the xhr response texts and match them to a pattern
	function collect(css) {
		// find selectors that use rem in one or more of their rules
		var blocks = css.match(blockExp),
			properties = css.match(propertyExp);

		if (blocks && blocks.length) {
			return {
				'blocks': blocks,
				'properties': properties
			};
		}

		return null;
	}

	// first build each individual rule from elements in the found array and then add it to the string of rules.
	function seperate(rules) {
		var css = '',
			current, rule, properties;

		for (var i = 0, ii = rules.length; i < ii; i++) {
			rule = rules[i];

			// find properties with rem values in them
			properties = rule.match(rulesExp);

			// save the selector portion of each rule with a rem value
			css = css + rule.substr(0, rule.indexOf("{") + 1);
			// build a new set of with only the selector and properties that have rem in the value
			for (var j = 0, jj = properties.length; j < jj; j++) {
				css = css + properties[j];
			}
			// sanitize/close block
			if (css[css.length - 1] !== "}") css = css + "\n}";
		}

		return css;
	}

	// replace each set of parentheses with evaluated content
	function calculate(rules) {
		var remSize, rule, sizes = [];

		for (var i = 0; i < rules.length; i++) {
			rule = rules[i];
			remSize = parseFloat(rule.substr(0, rule.length - 3));
			sizes[i] = Math.round(remSize * rem.fontSize) + 'px';
		}

		return sizes;
	}

	// replace and load the new rules
	function rewrite(css, rules, sizes) {
		// only run this loop as many times as css has entries
		for (var i = 0, ii = sizes.length; i < ii; i++) {
			// replace old rules with our processed rules
			css = css.replace(rules[i], sizes[i]);
		}

		return css;
	}

	function convert(css) {
		css = clean(css);

		var data = collect(css);
		var rems = seperate(data.blocks);
		var sizes = calculate(data.properties);

		return rewrite(rems, data.properties, sizes);
	}
	rem.convert = convert;

	w.rem = rem;

})(window);
