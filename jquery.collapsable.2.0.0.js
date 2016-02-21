;(function($) {

	var defaults = {
		control: '.ca-control', // selektor ovladaciho prvku, muze se v ramci boxu i opakovat
		box: '.ca-box',     // selektor pro skryvanou/zobrazovanou cast
		event: 'click',       // událost, na kterou je u ca-control bindované otevírání

		fx: false,         // [ false (jen zmena class) / toggle (prepinani show/hide) / slide (animace vysky) ]
		fxDuration: 0,             // doba trvání efektu, případně zpoždění volání onExpanded a onCollapsed funkcí; výchozí hodnota 500, pokud je fx === 'slide'

		grouped: false,         // pokud je true, pak bude otevreny vzdy jen jeden box ze skupiny
		collapsableAll: true,          // lze zavrit vsechny polozky, ma vliv pouze pokud grouped==true
		defaultOpen: null,         // otevreny/zavreny po inicializaci
		preventDefault: true,          // po kliku na control zavolani / nezavolani preventDefault na event

		extLinks: {
			selector: null,         // false nebo selektor externich odkazu (napr. prichycen horni lista, atp.)
			preventDefault: false, // true / false zda po kliku na externí odkaz má být zavoláno preventDefault na události click
			activeClass: 'ca-ext-active'
		},
		expandAll: null,         // false nebo selektor na odkaz, ktery otevre vsechny boxy
		collapseAll: null,         // false nebo selektor na odkaz, ktery zavre vsechny boxy

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

	// public methods which can be used via .collapsable('method');
	var methods = {
		init: function(options) {
			return new Collapsable(this, options);
		},
		expandAll: function() {},
		collapseAll: function() {},
		destroy: function() {}
	};

	var Collapsable = function($boxSet, options) {
		this.opts = $.extend(true, {}, $.fn.collapsable.defaults, options);
		this.items = [];
		this.$boxSet = $boxSet;
		this.$extLinks = this.opts.extLinks.selector ? $(this.opts.extLinks.selector) : $([]);

		var that = this;
		var fragment = window.location.href;

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

			this.$extLinks.on('click', function(e) {
				var $target = $($(this).attr('href'));

				if (that.opts.extLinks.preventDefault)
					e.preventDefault();

				if ($target.hasClass(that.opts.classNames.collapsed)) {
					var $control = $target.find(that.opts.control);
					var $btn = ($control[0].tagName.toUpperCase() == 'A') ? $control : $control.find('a');

					$btn.trigger('click');
				}
			});
		}

		if (this.opts.expandAll) {
			$(this.opts.expandAll).bind('click', function(e) {
				e.preventDefault();
				methods.expandAll.call(that.$boxSet, e);
			});
		}

		if (this.opts.collapseAll) {
			$(opts.collapseAll).bind('click', function(e) {
				e.preventDefault();
				methods.collapseAll.call(that.$boxSet, e);
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

		return this.$boxSet.each(function() {
			var collapsable = new CollapsableItem(that, this)

			if (collapsable.$box.length && collapsable.$control.length) {
				that.items.push(collapsable);
			}
		});
	};

	Collapsable.prototype.findExpanded = function() {
		var l = this.items.length;
		for (var i = 0; i < l; i++) {
			if (this.items[i].isExpanded())
				return this.items[i];
		}
		return null;
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

		if (! this.id) {
			this.id = 'collapsable-' + (new Date()).getTime();
			this.$collapsable.attr('id', this.id);
		}


		if (this.$control.length == 0 || this.$box.length == 0)
			return;

		if (this.$control.find('a').length === 0 && this.$control[0].tagName.toUpperCase() != 'A') {
			this.$control.wrapInner('<a class="ca-link" href="#' + this.id + '"></a>');
		}

		$anchor = (this.$control[0].tagName.toUpperCase() === 'A') ? this.$control : this.$control.find('a');

		if (opts.defaultOpen || this.$collapsable.hasClass(opts.classNames.defaultExpanded)) {
			this.expand();
		}
		else {
			if (opts.fx !== false) this.$box.hide();
			this.$collapsable
				.removeClass(opts.classNames.expanded)
				.addClass(opts.classNames.collapsed);
		}

		this.$collapsable.on(opts.event, $anchor, function(e) {
			if (opts.preventDefault) {
				e.preventDefault();
			}

			if (that.isExpanded()) {
				if (opts.collapsableAll || ! opts.grouped) {
					var collapsed = that.collapse(e);
				}
			}
			else {
				if (opts.grouped) {
					var expandedItem = that.parent.findExpanded();
					var hasCollapsed;
					if (expandedItem) {
						hasCollapsed = expandedItem.collapse(e);

						if (hasCollapsed === false) {
							return;
						}
					}
				}

				var hasExpanded = that.expand(e);

				if (hasExpanded !== false && $(this).hasClass('ajax') && spinnerExt && spinnerExt.$spinnerHtml) {
					that.$box.append(spinnerExt.$spinnerHtml);
				}
			}
		});

		this.$collapsable.data('collapsable', that);
	};

	CollapsableItem.prototype.expand = function(event) {
		var opts = this.parent.opts;
		if(typeof opts.onExpand == 'function') {
			var expand = opts.onExpand.call(this.$collapsable, event);
			if (expand === false)
				return false;
		}

		this.parent.$extLinks
			.filter('[href=#' + this.$collapsable.attr('id') + ']')
			.addClass(opts.classNames.extLinkActive);

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
	};

	CollapsableItem.prototype.collapse = function(event) {
		var opts = this.parent.opts;
		if(typeof opts.onCollapse == 'function') {
			var collapse = opts.onCollapse.call(this.$collapsable, event);
			if (collapse === false) {
				return false;
			}
		}

		this.parent.$extLinks
			.filter('[href=#' + this.$collapsable.attr('id') + ']')
			.removeClass(opts.classNames.extLinkActive);

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
	};

	CollapsableItem.prototype.isExpanded = function() {
		return this.$collapsable.hasClass(this.parent.opts.classNames.expanded);
	};

})(jQuery);
