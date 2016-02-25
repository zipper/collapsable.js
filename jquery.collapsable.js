/**
 * jQuery plugin for collapsable boxes
 *
 * @author Radek Šerý <radek.sery@peckadesign.cz>
 * @copyright Copyright (c) 2014-2016 Radek Šerý
 * @license MIT
 *
 * @version 2.0.0
 *
 * @todo add aria support
 */
;(function($) {

	/**
	 * Collapsable defaults
	 * @type {{control: string, box: string, event: string, fx: boolean, fxDuration: number, grouped: boolean, collapsableAll: boolean, preventDefault: boolean, extLinks: {selector: null, preventDefault: boolean, activeClass: string}, classNames: {expanded: string, collapsed: string, defaultExpanded: string}, onInit: null, onExpand: null, onExpanded: null, onCollapse: null, onCollapsed: null}}
	 */
	var defaults = {
		control: '.ca-control', // CSS selector for control element
		box: '.ca-box',         // CSS selector for hideable element (box)
		event: 'click',         // event triggering the expand/collapse

		fx: false,              // effect for expanding/collapsing, [ false | toggle | slide ]
		fxDuration: 0,          // duration of the effect, affects delay between onExpand (onCollapse) and onExpanded (onCollapsed) callbacks; default value is 500 when fx set to slide

		grouped: false,         // determines, if there could be more than one expanded box in same time; related to jQuery set on which initialized
		collapsableAll: true,   // possibility of collapsing all boxes from set
		preventDefault: true,   // whether prevenDefault should be called when specified event occurs on control

		extLinks: {             // external links for operating collapsable set, can be anywhere else in DOM
			selector: null,     // CSS selector for external links; it has to be anchors; the click event is binded
			//openOnly: true    // @todo create possibility for extLinks would only open the boxes?
			preventDefault: false, // whether preventDefault is called on extLinks click
			activeClass: 'ca-ext-active' // class which would be toggled on external link when associated box is expanded or collapsed
		},

		classNames: {            // CSS class names to be used on collapsable box; they are added to element, on which collapsable has been called
			expanded:        'ca-expanded',
			collapsed:       'ca-collapsed',
			defaultExpanded: 'ca-default-expanded'
		},

		// callbacks
		onInit:      null,      // immediately after initialization
		onExpand:    null,      // called when box expansion starts
		onExpanded:  null,      // called when box expansion ends
		onCollapse:  null,      // called when box collapsion starts
		onCollapsed: null       // called when box collapsion ends
	};


	/**
	 * Public methods available via jQuery adapter
	 * @type {{init: methods.init, expandAll: methods.expandAll, collapseAll: methods.collapseAll, destroy: methods.destroy}}
	 */
	var methods = {
		init: function(options) {
			return new Collapsable(this, options);
		},
		expandAll: function(event) {
			handlePublicMethods.call(this, 'expandAll', event);
		},
		collapseAll: function(event) {
			handlePublicMethods.call(this, 'collapseAll', event);
		},
		destroy: function(event) {
			handlePublicMethods.call(this, 'destroy', event); // @todo destroy :)
		}
	};


	/**
	 * Last used uid index
	 * @type {number}
	 * @private
	 */
	var caUid = 0;


	/**
	 * Generates unique id for new Collapsable object
	 * @returns {String}  uid
	 * @private
	 */
	function getUid() {
		return 'ca-uid-' + caUid++;
	}


	/**
	 * Handles public method called on jQuery object using adapter
	 * @param {String} action - collapseAll|expandAll|destroy @todo destroy
	 * @param {Object} event  - event (object) passed by user
	 * @private
	 */
	function handlePublicMethods(action, event) {
		var processed = [];
		this.each(function() {
			var instance = $(this).data('collapsable');
			if (instance) {
				var uid = instance.parent.uid;

				if (processed.indexOf(uid) === -1) {
					processed.push(uid);

					instance.parent[action](event);
				}
			}
		});
	}


	/**
	 * Finds ext links specified in options and bind click event to them for opening
	 * @this Collapsable
	 * @private
	 */
	function handleExtLinks() {
		if ((this.$extLinks = $(this.opts.extLinks.selector).filter('a')).length) {
			var that = this;

			this.$extLinks.on('click', function(event) {
				if (that.opts.extLinks.preventDefault)
					event.preventDefault();

				var collapsable = $($(this).attr('href')).data('collapsable');

				if (collapsable) {
					collapsable.$control.find('a').trigger('click', event);
				}
			});
		}
	}


	/**
	 * Prepare default expanded item. Checks the necessity of expanded item (collapsableAll set to false && grouped set
	 * to true) and limits amount of default expanded items to 1 when grouped option set to true. Also when there's
	 * fragment in url targeting existing collapsable item, default expanded set using class in DOM will be overridden.
	 *
	 * @summary Sets the defaultExpanded flag to appropriate CollapsableItems
	 * @this Collapsable
	 * @private
	 */
	function prepareDefaultExpanded() {
		var fragment = window.location.href;
		var i = fragment.search(/#/);

		var defaultExpanded = -1;
		var defaultExpandedFromUrl = -1;
		var $items = $($.map(this.items, function(item){return item.$collapsable.get();}));

		// search for #hash in url
		if (i !== -1) {
			fragment = fragment.substring(i + 1);
			defaultExpandedFromUrl = $items.index($('#' + fragment));

			if (defaultExpandedFromUrl !== -1) {
				this.items[defaultExpandedFromUrl].defaultExpanded = true;

				// max 1, we can return now
				if (this.opts.grouped) {
					return;
				}
			}
		}

		// max 1 expanded item
		if (this.opts.grouped) {
			defaultExpanded = $items.index($('.' + this.opts.classNames.defaultExpanded));

			// max 1, we can return now
			if (defaultExpanded !== -1) {
				this.items[defaultExpanded].defaultExpanded = true;
				return;
			}
		}

		// not grouped, we add flag to all items with class
		else {
			var that = this;
			$items.each(function(i) {
				if ($(this).hasClass(that.opts.classNames.defaultExpanded)) {
					defaultExpanded = i; // for later use is sufficient to have last index only
					that.items[i].defaultExpanded = true;
				}
			});
		}

		// if we need one and none was found yet, we take the first
		if (defaultExpandedFromUrl === -1 && defaultExpanded === -1 && ! this.opts.collapsableAll) {
			this.items[0].defaultExpanded = true;
		}
	}


	/**
	 * Expand or collapse item based on flags set in prepareDefaultExpanded method; called on initialization within the
	 * context of Collapsable
	 * @this Collapsable
	 * @private
	 */
	function handleDefaultExpanded() {
		var event = { type: 'collapsable.init' };
		var opts = this.opts; // shortcut
		var items = this.items;

		// save fx so it can be set back
		var fx = opts.fx;

		// for initialization, we don't want to use any effect
		if (opts.fx)
			opts.fx = 'toggle';

		var l = items.length;
		var force = ! opts.collapsableAll; // if we can't collapse all, we force expanding the first one chosen in prepareDefaultExpanded, @todo potentially force-open the one from URL instead of first, if hash set? or maybe try to open some without forcing and only if failed, do force-open (would require two passes?
		for (var i = 0; i < l; i++) {
			if (items[i].defaultExpanded) {
				items[i].expand(event, force);
				force = false;
			} else {
				items[i].collapse(event, true); // on init, we want to close all regardless - if you return false, than we shouln't have the class set in first place
			}
		}

		opts.fx = fx;
	}


	/**
	 * @param {jQuery} $boxSet - set of object to be initilized
	 * @param {Object} options - see plugin defaults
	 * @returns {Collapsable}
	 * @constructor
	 */
	var Collapsable = function($boxSet, options) {
		this.opts = $.extend(true, {}, $.fn.collapsable.defaults, options);
		this.items = [];

		var that = this;

		this.uid = getUid();
		this.promiseOpen = false;

		// default fxDuration in case of slide function
		if (this.opts.fx === 'slide' && ! this.opts.fxDuration) {
			this.opts.fxDuration = 500;
		}

		handleExtLinks.call(this);

		$boxSet.each(function() {
			var collapsable = new CollapsableItem(that, this);

			if (collapsable.$box.length && collapsable.$control.length) {
				that.items.push(collapsable);
			}
		});

		prepareDefaultExpanded.call(this);
		handleDefaultExpanded.call(this);

		return this;
	};

	/**
	 * Returns indexes of expanded items in Collapsable.items
	 * @returns {Array}
	 */
	Collapsable.prototype.getExpanded = function() {
		var expanded = [];
		var l = this.items.length;

		for (var i = 0; i < l; i++) {
			if (this.items[i].isExpanded()) {
				expanded.push(i);
			}
		}

		return expanded;
	};


	/**
	 * Expands all collapsed items
	 * @param {Event} event - event to be passed to onExpand and onExpanded callbacks
	 */
	Collapsable.prototype.expandAll = function(event) {
		// if grouped, we only want to expand one (first) box, or none if already expanded
		if (this.opts.grouped && this.getExpanded().length) {
			return;
		}

		event = event || { type: 'collapsable.expandAll' };

		var l = this.items.length;

		for (var i = 0; i < l; i++) {
			if (! this.items[i].isExpanded()) {
				var expanded = this.items[i].expand(event);

				if (this.opts.grouped && expanded) {
					break;
				}
			}
		}
	};


	/**
	 * Collapses all expanded items
	 * @param {Event} event - event to be passed to onCollapse and onCollapsed callbacks
	 */
	Collapsable.prototype.collapseAll = function(event) {
		event = event || { type: 'collapsable.collapseAll' };

		var expandedItems = this.getExpanded();
		var l = expandedItems.length;

		for (var i = 0; i < l; i++) {
			this.items[expandedItems[i]].collapse(event);
		}
	};


	/**
	 * Single item in Collapsable object, represents one collapsable element in page
	 * @param {Collapsable} parent - reference to group of Collapsable elements initialized in same time, sharing same options
	 * @param {jQuery} element     - one instance of collapsable element
	 * @returns {CollapsableItem}
	 * @constructor
	 */
	var CollapsableItem = function(parent, element) {
		this.parent = parent;
		this.$collapsable = $(element);
		this.id = this.$collapsable.attr('id');
		this.$control = this.$collapsable.find(parent.opts.control);
		this.$box     = this.$collapsable.find(parent.opts.box);

		if (this.$control.length == 0 || this.$box.length == 0)
			return;

		var that = this;
		var selector; // selector for clickable element
		var opts = this.parent.opts; // shortcut

		if (! this.id) {
			this.id = getUid();
			this.$collapsable.attr('id', this.id);
		}

		// @todo umožnit různou strukturu ca-control, nyní musí být vždy stejná, tj. nelze <p class="ca-control"><a>...</a> a <p class="ca-control">...</p> v jednom boxu - nevytvoří se odkaz ve druhém elementu
		// souvisí s tím i hodnota proměnné selector níže
		if (this.$control.find('a').length === 0 && this.$control[0].tagName.toUpperCase() != 'A') {
			this.$control.wrapInner('<a class="ca-link" href="#' + this.id + '"></a>');
		}

		selector = (this.$control[0].tagName.toUpperCase() === 'A') ? opts.control : opts.control + ' a';

		// data contains arguments passed when trigger is called, used for passing event that triggered opening (eg. extLink click)
		this.$collapsable.on(opts.event, selector, function(event, originalEvent) {
			var passEvent = originalEvent ? originalEvent : event;
			if (opts.preventDefault) {
				event.preventDefault();
			}

			if (that.isExpanded()) {
				that.collapse(passEvent);
			}
			else {
				that.expand(passEvent);
			}
		});

		this.$collapsable.data('collapsable', this);

		return this;
	};


	// @todo přepsat expand a collapse funkce do jedné?
	/**
	 * Expands single CollapsableItem; could be prevented by returning false from onExpand callback
	 * @param {Object} event  - event passed to function
	 * @param {Boolean} force - forcing CollapsableItem to expand regardless on onExpand return value, should be used only on initilization (force open default expanded item when collapsableAll === false)
	 * @returns {Boolean}     - returns if CollapsableItem has been expanded or not
	 */
	CollapsableItem.prototype.expand = function(event, force) {
		var opts = this.parent.opts;
		var expandedItem = this.parent.getExpanded(); // grouped -> max one expanded item

		this.parent.promiseOpen = true; // allows us to collapse expanded item even if there might be collapseAll === false option

		if (opts.grouped) {
			// before expanding, we have to collapse previously opened item

			// if grouped element hasn't collapsed, we can't continue
			if (expandedItem.length && this.parent.items[expandedItem[0]].collapse(event, force) === false) {
				this.parent.promiseOpen = false;
				return false;
			}
		}

		this.parent.promiseOpen = false;

		if(typeof opts.onExpand == 'function') {
			var expand = opts.onExpand.call(this.$collapsable, event);
			if (expand === false && ! force) {
				// collapsableAll === false && grouped === true, so if box has not opened, we must make sure something is opened, therefore we force-open previously opened box (simulating it has never closed in first place); if grouped
				if (! opts.collapsableAll && opts.grouped) {
					this.parent.items[expandedItem[0]].expand(event, true);
				}

				return false;
			}
		}

		this.parent.$extLinks
			.filter('[href=#' + this.id + ']')
			.addClass(opts.extLinks.activeClass);

		this.$collapsable
			.removeClass(opts.classNames.collapsed)
			.addClass(opts.classNames.expanded);

		var that = this;
		if(opts.fx == 'slide') {
			this.$box
				.slideDown(opts.fxDuration, function() {
					if(typeof opts.onExpanded == 'function') opts.onExpanded.call(that.$collapsable, event);
				})
				.css({ display: 'block' });
		}
		else {
			if(opts.fx == 'toggle') {
				this.$box.show();
			}

			if(typeof opts.onExpanded == 'function') {
				t = setTimeout(function () {
					opts.onExpanded.call(that.$collapsable, event);
				}, opts.fxDuration);
			}
		}

		return true;
	};

	/**
	 * Collapses single CollapsableItem; could be prevented by returning false from onCollapse callback
	 * @param {Object} event  - Event passed to function
	 * @param {Boolean} force - Forcing CollapsableItem to collapse regardless on onCollapse return value
	 * @returns {Boolean}     - Returns if CollapsableItem has been collapsed or not
	 */
	CollapsableItem.prototype.collapse = function(event, force) {
		var opts = this.parent.opts;

		// if we can't collapse all, we are not promised to open something and there is only one opened box, then we can't continue
		if (! opts.collapsableAll && ! this.parent.promiseOpen && this.parent.getExpanded().length < 2) {
			return false;
		}

		if(typeof opts.onCollapse == 'function') {
			var collapse = opts.onCollapse.call(this.$collapsable, event);
			if (collapse === false && ! force) {
				return false;
			}
		}

		this.parent.$extLinks
			.filter('[href=#' + this.id + ']')
			.removeClass(opts.extLinks.activeClass);

		this.$collapsable
			.removeClass(opts.classNames.expanded)
			.addClass(opts.classNames.collapsed);

		var that = this;
		if(opts.fx == 'slide') {
			this.$box
				.css({ display: 'block' })
				.slideUp(opts.fxDuration, function () {
					if (typeof opts.onCollapsed == 'function') opts.onCollapsed.call(that.$collapsable, event);
				});
		}
		else {
			if(opts.fx == 'toggle') {
				this.$box.hide();
			}

			if(typeof opts.onCollapsed == 'function') {
				t = setTimeout(function () {
					opts.onCollapsed.call(that.$collapsable, event);
				}, opts.fxDuration);
			}
		}

		return true;
	};

	/**
	 * Tests if the CollapsableItem is expanded or not
	 * @returns {Boolean}
	 */
	CollapsableItem.prototype.isExpanded = function() {
		return this.$collapsable.hasClass(this.parent.opts.classNames.expanded);
	};


	/**
	 * jQuery adapter for Collapsable object, returns elements on which it was called, so it's chainable
	 * @param {Object} options - options to override plugin defaults
	 * @returns {jQuery}
	 */
	$.fn.collapsable = function(options) {
		if (methods[options]) {
			return methods[options].apply(this, Array.prototype.slice.call(arguments, 1));
		}
		else if (typeof options === 'object' || !options) {
			var data =  methods.init.apply(this, arguments);

			if (data && typeof data.opts.onInit === 'function') {
				var l = data.items.length;
				for (var i = 0; i < l; i++) {
					data.opts.onInit.call(data.items[i].$collapsable);
				}
			}

			return this;
		}
		else {
			$.error('Method ' + options + ' does not exist on jQuery.collapsable');
		}
	};

	$.fn.collapsable.defaults = defaults;

})(jQuery);
