;(function($) {

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
		onExpanded:  null,      // callback zavolany po dokonceni otevirani, ma smysl jen pri fx: 'slide' s nenulovym casem
		onCollapse:  null,      // analogicky viz vyse
		onCollapsed: null
	};

	// public methods which can be used via .collapsable('method')
	var methods = {
		init: function(options) {
			var instance  = new Collapsable(this, options);
			return this;
		},
		expandAll: function(event) {
		},
		collapseAll: function(event) {
			var collapsed = [];
			this.each(function() {
				var collapsable = $(this).data('collapsable');
				var uid = collapsable.parent.uid;
				if (collapsed.indexOf(uid) === -1) {
					collapsed.push(uid);

					console.log("Collapsing " + uid);
					collapsable.parent.collapseAll(event);
				}
			});
		},
		destroy: function() {}
	};


	// Private variables
	var collapsableUids = [];


	// Private functions
	function getCollapsableUid() {
		var uid = undefined;
		while (!uid) {
			uid = 'Collapsable_' + Math.random();
			if (collapsableUids[uid]) {
				uid = undefined;
			}
		}
		collapsableUids.push(uid);

		return uid;
	}


	// $.collasable
	$.fn.collapsable = function(options) {
		if (methods[options]) {
			return methods[options].apply(this, Array.prototype.slice.call(arguments, 1));
		}
		else if (typeof options === 'object' || !options) {
			var ret =  methods.init.apply( this, arguments );

			var data = ret.data('collapsable');
			if (data && typeof data.parent.opts.onInit == 'function') {
				$(this).each(function() {
					data.parent.opts.onInit.call($(this));
				});
			}

			return ret;
		}
		else {
			$.error('Method ' + options + ' does not exist on jQuery.collapsable' );
		}
	};

	$.fn.collapsable.defaults = defaults;

	var Collapsable = function($boxSet, options) {
		this.opts = $.extend(true, {}, $.fn.collapsable.defaults, options);
		this.items = [];
		this.$boxSet = $boxSet;
		this.$extLinks = this.opts.extLinks.selector ? $(this.opts.extLinks.selector) : $([]);

		var that = this;
		var fragment = window.location.href;

		this.uid = getCollapsableUid();

		// search for #hash in url
		if ((i = fragment.search(/#/)) != -1) {
			fragment = fragment.substring(i+1);
		} else {
			fragment = '';
		}

		// default fxDuration in case of slide function
		if (this.opts.fx === 'slide' && ! this.opts.fxDuration) {
			this.opts.fxDuration = 500;
		}

		if (this.$extLinks.length) {
			// we assume same structure among all $extLinks!
			if (this.$extLinks[0].tagName.toUpperCase() != 'A')
				this.$extLinks = this.$extLinks.find('a');

			this.$extLinks.on('click', function(event) {
				var $target = $($(this).attr('href'));

				if (that.opts.extLinks.preventDefault)
					event.preventDefault();

				if ($target.hasClass(that.opts.classNames.collapsed)) {
					var $control = $target.find(that.opts.control);
					var $btn = ($control[0].tagName.toUpperCase() == 'A') ? $control : $control.find('a');

					$btn.trigger('click');
				}
			});
		}

		if (this.opts.grouped && ! this.opts.collapsableAll && (fragment === '' || this.$boxSet.filter('#' + fragment).length === 0)) {
			var $visible = this.$boxSet.filter('.' + this.opts.classNames.defaultExpanded);
			if ($visible.length == 0)
				this.$boxSet.first().addClass(this.opts.classNames.defaultExpanded);
		}

		if ((fragment && ($fragment = this.$boxSet.filter('#' + fragment)).length)) {
			this.$boxSet
				.filter('.' + this.opts.classNames.defaultExpanded)
				.removeClass(this.opts.classNames.defaultExpanded);
			$fragment.addClass(this.opts.classNames.defaultExpanded);
		}

		this.$boxSet.each(function() {
			var collapsable = new CollapsableItem(that, this)

			if (collapsable.$box.length && collapsable.$control.length) {
				that.items.push(collapsable);
			}
		});

		return this;
	};

	/**
	 * @return {Array}  indexes of expanded items in Collapsable.items
	 */
	Collapsable.prototype.findExpanded = function() {
		var expanded = [];
		var l = this.items.length;
		for (var i = 0; i < l; i++) {
			if (this.items[i].isExpanded())
				expanded.push(i);
		}
		return expanded;
	};

	/**
	 * Collapses all expanded items
	 */
	Collapsable.prototype.collapseAll = function(event) {
		event = event || { type: 'collapsable.collapseAll' };

		var expandedItems = this.findExpanded();
		var l = expandedItems.length;

		for (var i = 0; i < l; i++) {
			this.items[expandedItems[i]].collapse(event);
		}
	};

	/**
	 * Expands all expanded items
	 */
	Collapsable.prototype.expandAll = function(event) {
		event = event || { type: 'collapsable.expandAll' };

		var l = this.items.length;
		for (var i = 0; i < l; i++) {
			if (! this.items[i].isExpanded()) {
				this.items[i].expand(event);
			}
		}
	};


	/***** CollapsableItem - one instance of collapsable element ****/
	var CollapsableItem = function(parent, collapsable) {
		// public
		this.parent = parent;
		this.$collapsable = $(collapsable);
		this.id = this.$collapsable.attr('id');
		this.$control = this.$collapsable.find(parent.opts.control);
		this.$box     = this.$collapsable.find(parent.opts.box);

		// private
		var that = this;
		var $anchor; // clickable element
		var opts = this.parent.opts; // shortcut
		var spinnerExt = $.nette ? $.nette.ext('spinner') : null;

		var event = {
			type: 'collapsable.init'
		};

		if (! this.id) {
			this.id = 'CollapsableItem-' + (new Date()).getTime();
			this.$collapsable.attr('id', this.id);
		}


		if (this.$control.length == 0 || this.$box.length == 0)
			return;

		if (this.$control.find('a').length === 0 && this.$control[0].tagName.toUpperCase() != 'A') {
			this.$control.wrapInner('<a class="ca-link" href="#' + this.id + '"></a>');
		}

		$anchor = (this.$control[0].tagName.toUpperCase() === 'A') ? this.$control : this.$control.find('a');

		if (this.$collapsable.hasClass(opts.classNames.defaultExpanded)) {
			this.expand(event);
		}
		else {
			if (opts.fx !== false) this.$box.hide();
			this.$collapsable
				.removeClass(opts.classNames.expanded)
				.addClass(opts.classNames.collapsed);
		}

		this.$collapsable.on(opts.event, $anchor, function(event) {
			if (opts.preventDefault) {
				event.preventDefault();
			}

			if (that.isExpanded()) {
				that.collapse(event);
			}
			else {
				if (opts.grouped) {
					var expandedItem = that.parent.findExpanded(); // grouped -> max one expanded item
					var hasCollapsed;
					if (expandedItem.length) {
						hasCollapsed = that.parent.items[expandedItem[0]].collapse(event, true);

						if (hasCollapsed === false) {
							return;
						}
					}
				}

				var hasExpanded = that.expand(event);

				if (! hasExpanded && opts.grouped) {
					that.parent.items[expandedItem[0]].expand(event, true);
				}

				if (hasExpanded !== false && $(this).hasClass('ajax') && spinnerExt && spinnerExt.$spinnerHtml) {
					that.$box.append(spinnerExt.$spinnerHtml);
				}
			}
		});

		this.$collapsable.data('collapsable', that);
	};

	/**
	 * @param {Object} event     Event passed to function
	 * @param {Boolean} force    Forcing CollapsableItem to expand regardless on onExpand return value
	 * @return {Boolean}         Returns if CollapsableItem has been expanded or not
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
					opts.onExpanded.call(this.$collapsable, event);
				}, opts.fxDuration);
			}
		}

		return true;
	};

	/**
	 * @param {Object} event     Event passed to function
	 * @param {Boolean} force    Forcing CollapsableItem to collapse regardless on onCollapse return value
	 * @return {Boolean}         Returns if CollapsableItem has been collapsed or not
	 */
	CollapsableItem.prototype.collapse = function(event, force) {
		var opts = this.parent.opts;

		if (! opts.collapsableAll && this.parent.findExpanded().length === 1 && ! force) {
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
					if (typeof opts.onCollapsed == 'function') opts.onCollapsed.call(this.$collapsable, event);
				});
		}
		else {
			if(opts.fx == 'toggle') {
				this.$box.hide();
			}

			if(typeof opts.onCollapsed == 'function') {
				t = setTimeout(function () {
					opts.onCollapsed.call(this.$collapsable, event);
				}, opts.fxDuration);
			}
		}

		return true;
	};

	CollapsableItem.prototype.isExpanded = function() {
		return this.$collapsable.hasClass(this.parent.opts.classNames.expanded);
	};

})(jQuery);
