/**
 * jQuery plugin for collapsable boxes
 *
 * @copyright Copyright (c) 2014-2016 Radek Šerý
 * @license MIT
 *
 * @version 2.0.0
 */
;(function($) {


	/**
	 * Collapsable defaults
	 * @type {{control: string, box: string, event: string, fx: boolean, fxDuration: number, grouped: boolean, collapsableAll: boolean, preventDefault: boolean, extLinks: {selector: null, preventDefault: boolean, activeClass: string}, classNames: {expanded: string, collapsed: string, defaultExpanded: string}, onInit: null, onExpand: null, onExpanded: null, onCollapse: null, onCollapsed: null}}
	 */
	var defaults = {
		control: '.ca-control', // selektor ovladaciho prvku, muze se v ramci boxu i opakovat
		box: '.ca-box',     // selektor pro skryvanou/zobrazovanou cast
		event: 'click',       // událost, na kterou je u ca-control bindované otevírání

		fx: false,         // [ false (jen zmena class) / toggle (prepinani show/hide) / slide (animace vysky) ]
		fxDuration: 0,             // doba trvání efektu, případně zpoždění volání onExpanded a onCollapsed funkcí; výchozí hodnota 500, pokud je fx === 'slide'

		grouped: false,         // pokud je true, pak bude otevreny vzdy jen jeden box ze skupiny
		collapsableAll: true,          // lze zavrit vsechny polozky, ma vliv pouze pokud grouped==true
		preventDefault: true,          // po kliku na control zavolani / nezavolani preventDefault na event

		extLinks: {
			selector: null,         // false nebo selektor externich odkazu (napr. prichycen horni lista, atp.)
			//openOnly: true @todo
			preventDefault: false, // true / false zda po kliku na externí odkaz má být zavoláno preventDefault na události click
			activeClass: 'ca-ext-active'
		},

		classNames: {                     // nazvy trid, otevreny, zavreny box a box, ktery bude defaultne otevreny
			expanded:        'ca-expanded',
			collapsed:       'ca-collapsed',
			defaultExpanded: 'ca-default-expanded'
		},

		onInit:      null,      // callback funkce volana ihned po inicializaci
		onExpand:    null,      // callback volany pred samotny oteviranim
		onExpanded:  null,      // callback zavolany po dokonceni otevirani, ma smysl jen pri fxDuration > 0
		onCollapse:  null,      // analogicky viz vyse
		onCollapsed: null
	};


	/**
	 * Public methods available via jQuery adapter
	 * @type {{init: methods.init, expandAll: methods.expandAll, collapseAll: methods.collapseAll, destroy: methods.destroy}}
	 */
	var methods = {
		init: function(options) {
			var instance  = new Collapsable(this, options);
			return this;
		},
		expandAll: function(event) {
			handlePublicMethods.call(this, 'expandAll', event);
		},
		collapseAll: function(event) {
			handlePublicMethods.call(this, 'collapseAll', event);
		},
		destroy: function(event) {
			handlePublicMethods.call(this, 'destroy', event);
		}
	};


	/**
	 * Last used uid index
	 * @type {number}
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
	 * @param {String} action - 'collapseAll' | 'expandAll'
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
					collapsable.$control.find('a').trigger('click');
				}
			});
		}
	}


	/**
	 * Prepare default expanded item. Checks the necessity of expanded item (collapsableAll set to false && grouped set
	 * to true) and limits amount of default expanded items to 1 when grouped option set to true. Also when there's
	 * fragment in url targeting existing collapsable item, default expanded set using class in DOM will be overridden.
	 * @this Collapsable
	 * @private
	 */
	function prepareDefaultExpanded() {
		var fragment = window.location.href;
		var i = fragment.search(/#/);

		// search for #hash in url
		if (i !== -1) {
			fragment = fragment.substring(i + 1);
			var $fragment = this.$boxSet.filter('#' + fragment);

			if ($fragment.length) {
				this.$boxSet
					.filter('.' + this.opts.classNames.defaultExpanded)
					.removeClass(this.opts.classNames.defaultExpanded);
				$fragment.addClass(this.opts.classNames.defaultExpanded);

				return;
			}
		}

		if (this.opts.grouped) {
			var $visible = this.$boxSet.filter('.' + this.opts.classNames.defaultExpanded);

			if (! this.opts.collapsableAll && $fragment.length === 0 && $visible.length == 0) {
				this.$boxSet.first().addClass(this.opts.classNames.defaultExpanded);
			}
			if ($visible.length > 1) {
				$visible.slice(1).removeClass(this.opts.classNames.defaultExpanded);
			}
		}
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
		this.$boxSet = $boxSet;

		var that = this;

		this.uid = getUid();

		// default fxDuration in case of slide function
		if (this.opts.fx === 'slide' && ! this.opts.fxDuration) {
			this.opts.fxDuration = 500;
		}

		handleExtLinks.call(this);

		prepareDefaultExpanded.call(this);

		this.$boxSet.each(function() {
			var collapsable = new CollapsableItem(that, this)

			if (collapsable.$box.length && collapsable.$control.length) {
				that.items.push(collapsable);
			}
		});

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


	// @todo zamyslet se nad sjednocením collapseAll a expandAll, zamyslet se nad tím, kdy bránit zavření poslední položky při collapsableAll===false (a kterou nechat otevřenou) a kdy zabránit otevření všech položek při grouped===true
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
	 * Expands all expanded items
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
	 * Expand or collapse item based on if it should expanded by default. Called on initialization within the context
	 * of the item itself.
	 * @this CollapsableItem
	 * @private
	 */
	function handleDefaultExpanded() {
		var event = {
			type: 'collapsable.init'
		};
		var opts = this.parent.opts;

		// save fx so it can be set back
		var fx = opts.fx;

		// for initialization, we don't want to use any effect
		if (opts.fx)
			opts.fx = 'toggle';

		if (this.$collapsable.hasClass(opts.classNames.defaultExpanded)) {
			this.expand(event);
		} else {
			this.collapse(event);
		}

		opts.fx = fx;
	}


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
		var spinnerExt = $.nette ? $.nette.ext('spinner') : null;

		if (! this.id) {
			this.id = getUid();
			this.$collapsable.attr('id', this.id);
		}

		handleDefaultExpanded.call(this);

		if (this.$control.find('a').length === 0 && this.$control[0].tagName.toUpperCase() != 'A') {
			this.$control.wrapInner('<a class="ca-link" href="#' + this.id + '"></a>');
		}

		selector = (this.$control[0].tagName.toUpperCase() === 'A') ? opts.control : opts.control + ' a';
		this.$collapsable.on(opts.event, selector, function(event) {
			if (opts.preventDefault) {
				event.preventDefault();
			}

			if (that.isExpanded()) {
				that.collapse(event);
			}
			else {
				// @todo prověřit celou věc s force zavíráním v případě grouped elementů a návratové hodnotě onExpand false; plus chování při collapsableAll domyslet
				if (opts.grouped) {
					var expandedItem = that.parent.getExpanded(); // grouped -> max one expanded item
					// if grouped element hasn't collapsed, we can't continue
					if (expandedItem.length && that.parent.items[expandedItem[0]].collapse(event, true) === false) {
						return;
					}
				}

				var hasExpanded = that.expand(event);

				// if box has not opened and collapsableAll is set to false, we must make sure something is opened
				if (! hasExpanded && opts.grouped && ! opts.collapsableAll) {
					that.parent.items[expandedItem[0]].expand(event, true); // collapsableAll === true, so expandedItem cannot be empty
				}

				if (hasExpanded && $(this).hasClass('ajax') && spinnerExt && spinnerExt.$spinnerHtml) {
					that.$box.append(spinnerExt.$spinnerHtml);
				}
			}
		});

		this.$collapsable.data('collapsable', that);

		return this;
	};


	// @todo přepsat expand a collapse funkce do jedné?
	/**
	 * @param {Object} event  - event passed to function
	 * @param {boolean} force - forcing CollapsableItem to expand regardless on onExpand return value
	 * @returns {boolean}     - returns if CollapsableItem has been expanded or not
	 */
	CollapsableItem.prototype.expand = function(event, force) {
		var opts = this.parent.opts;
		if(typeof opts.onExpand == 'function') {
			var expand = opts.onExpand.call(this.$collapsable, event);
			if (expand === false && ! force)
				return false;
		}

		this.parent.$extLinks
			.filter('[href=#' + this.id + ']')
			.addClass(opts.extLinks.activeClass);

		this.$collapsable
			.removeClass(opts.classNames.collapsed)
			.addClass(opts.classNames.expanded);

		if(opts.fx == 'slide') {
			this.$box
				.slideDown(opts.fxDuration, function() {
					// @todo vadné this
					if(typeof opts.onExpanded == 'function') opts.onExpanded.call(this.$collapsable, event);
				})
				.css({ display: 'block' });
		}
		else {
			if(opts.fx == 'toggle') {
				this.$box.show();
			}

			if(typeof opts.onExpanded == 'function') {
				t = setTimeout(function () {
					// @todo vadné this
					opts.onExpanded.call(this.$collapsable, event);
				}, opts.fxDuration);
			}
		}

		return true;
	};

	/**
	 * @param {Object} event  - Event passed to function
	 * @param {boolean} force - Forcing CollapsableItem to collapse regardless on onCollapse return value
	 * @returns {boolean}     - Returns if CollapsableItem has been collapsed or not
	 */
	CollapsableItem.prototype.collapse = function(event, force) {
		var opts = this.parent.opts;

		if (! opts.collapsableAll && this.parent.getExpanded().length === 1 && ! force) {
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

		if(opts.fx == 'slide') {
			this.$box
				.css({ display: 'block' })
				.slideUp(opts.fxDuration, function () {
					// @todo vadné this
					if (typeof opts.onCollapsed == 'function') opts.onCollapsed.call(this.$collapsable, event);
				});
		}
		else {
			if(opts.fx == 'toggle') {
				this.$box.hide();
			}

			if(typeof opts.onCollapsed == 'function') {
				t = setTimeout(function () {
					// @todo vadné this
					opts.onCollapsed.call(this.$collapsable, event);
				}, opts.fxDuration);
			}
		}

		return true;
	};

	/**
	 * Tests if the element is expanded or not
	 * @returns {Boolean}
	 */
	CollapsableItem.prototype.isExpanded = function() {
		return this.$collapsable.hasClass(this.parent.opts.classNames.expanded);
	};


	/**
	 * jQuery adapter for Collapsable object, returns elements on which it was called, chainable
	 * @param {Object} options - options to override plugin defaults
	 * @returns {jQuery}
	 */
	$.fn.collapsable = function(options) {
		if (methods[options]) {
			return methods[options].apply(this, Array.prototype.slice.call(arguments, 1));
		}
		else if (typeof options === 'object' || !options) {
			var ret =  methods.init.apply(this, arguments);

			var data = ret.data('collapsable');
			if (data && typeof data.parent.opts.onInit === 'function') {
				$(this).each(function() {
					data.parent.opts.onInit.call($(this));
				});
			}

			return ret;
		}
		else {
			$.error('Method ' + options + ' does not exist on jQuery.collapsable');
		}
	};

	$.fn.collapsable.defaults = defaults;

})(jQuery);
