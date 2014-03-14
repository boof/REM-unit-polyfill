(function(w, undef) {

	var rem = w.rem || {};
	rem.manual = false;

	"use strict";
	// test for REM unit support
	function hasFeature() {
		var div = document.createElement('div');
		div.style.cssText = 'font-size: 1rem;';

		return (/rem/).test(div.style.fontSize);
	}
	rem.hasFeature = hasFeature();

	// filter returned link nodes for stylesheets
	function getStylesheets() {
		var styles = document.getElementsByTagName('link'),
			filteredStyles = [];

		for (var i = 0; i < styles.length; i++) {
			if (styles[i].rel.toLowerCase() === 'stylesheet' && styles[i].getAttribute('data-norem') === null) {
				filteredStyles.push(styles[i]);
			}
		}

		return filteredStyles;
	}

	function inject(css) {
		// create the new element
		var remcss = document.createElement('style');
		remcss.setAttribute('type', 'text/css');
		remcss.id = 'remReplace';
		document.getElementsByTagName('head')[0].appendChild(remcss);

		if (remcss.styleSheet) {
			// IE8 will not support innerHTML on read-only elements, such as STYLE
			remcss.styleSheet.cssText = css;
		} else {
			remcss.appendChild(document.createTextNode(css));
		}

	}

	function processSheets(stylesheets) {
		var css = '',
			resolves = 0;
		for (var i = 0, ii = stylesheets.length; i < ii; i++) {
			xhr(stylesheets[i].href, function(response) {
				css = css + "\n" + response.responseText;
				if (++resolves === ii) inject(rem.convert(css));
			});
		}
	}

	function xhr(url, callback) { // create new XMLHttpRequest object and run it
		try {
			var xhr = getXMLHttpRequest();
			xhr.open('GET', url, true);
			xhr.send();

			var ie = (function() { //function checking IE version
				var undef,
					v = 3,
					div = document.createElement('div'),
					all = div.getElementsByTagName('i');
				while (
					div.innerHTML = '<!--[if gt IE ' + (++v) + ']><i></i><![endif]-->',
					all[0]
				);
				return v > 4 ? v : undef;
			}());

			if (ie >= 7) { //If IE is greater than 6
				// This targets modern browsers and modern versions of IE,
				// which don't need the "new" keyword.
				xhr.onreadystatechange = function() {
					if (xhr.readyState === 4) {
						callback(xhr);
					} // else { callback function on AJAX error }
				};
			} else {
				// This block targets old versions of IE, which require "new".
				xhr.onreadystatechange = new function() { //IE6 and IE7 need the "new function()" syntax to work properly
					if (xhr.readyState === 4) {
						callback(xhr);
					} // else { callback function on AJAX error }
				};
			}
		} catch (e) {
			if (window.XDomainRequest) {
				var xdr = new XDomainRequest();
				xdr.open('get', url);
				xdr.onload = function() {
					callback(xdr);
				};
				xdr.onerror = function() {
					return false; // xdr load fail
				};
				xdr.send();
			}
		}
	}

	function getXMLHttpRequest() { // we're gonna check if our browser will let us use AJAX
		if (window.XMLHttpRequest) return new XMLHttpRequest();
		// if XMLHttpRequest doesn't work
		try {
			// then we'll instead use AJAX through ActiveX for IE6/IE7
			return new ActiveXObject("MSXML2.XMLHTTP");
		} catch {
			try {
				// other microsoft
				return new ActiveXObject("Microsoft.XMLHTTP");
			} catch {
				// No XHR at all...
			}
		}
	};

	if (!rem.hasFeature) { // this checks if the rem value is supported
		setTimeout(function() {
			if (rem.manual) return;
			var body = document.getElementsByTagName('body')[0],
				style = body.currentStyle,
				fontSize = '';

			if (style) {
				if (style.fontSize.indexOf("px") >= 0) {
					rem.fontSize = style.fontSize.replace('px', '');
				} else if (style.fontSize.indexOf("em") >= 0) {
					rem.fontSize = style.fontSize.replace('em', '');
				} else if (style.fontSize.indexOf("pt") >= 0) {
					rem.fontSize = style.fontSize.replace('pt', '');
				} else {
					// IE8 returns the percentage while other browsers return the computed value
					rem.fontSize = (style.fontSize.replace('%', '') / 100) * 16;
				}
			} else if (w.getComputedStyle) {
				// find font-size in body element
				rem.fontSize = document.defaultView.getComputedStyle(body, null).getPropertyValue('font-size').replace('px', '');
			}

			processSheets(getStylesheets());
		}, 0);
	}
	w.rem = rem;

})(window);
