;(function($) {

	function expandBox(opts, $box, $parent) {
		if(typeof opts.onExpand == 'function')
			opts.onExpand.call($parent);

		if(opts.fx == 'slide') {
			$box
				.slideDown(opts.collapseDelay, function() { if(typeof opts.onExpanded == 'function') opts.onExpanded.call($parent) })
				.css({display: 'block'});
		}
		else {
			if(opts.fx == 'toggle') {
				$box.show();
			}

			if(typeof opts.onExpanded == 'function') {
				t = setTimeout(function () {
					opts.onExpanded.call($parent);
				}, opts.collapseDelay);
			}
		}
	}

	function collapseBox(opts, $box, $parent) {
		if(typeof opts.onCollapse == 'function')
			opts.onCollapse.call($parent);

		if(opts.fx == 'slide') {
			$box
				.css({display: 'block'})
				.slideUp(opts.collapseDelay, function () {
					if (typeof opts.onCollapsed == 'function') opts.onCollapsed.call($parent)
				});
		}
		else {
			if(opts.fx == 'toggle') {
				$box.hide();
			}

			if(typeof opts.onCollapsed == 'function') {
				t = setTimeout(function () {
					opts.onCollapsed.call($parent);
				}, opts.collapseDelay);
			}
		}
	}

	var methods = {
		init: function(options) {
			var opts = $.extend(true, {}, $.fn.collapsable.defaults, options);
			var $boxSet = $(this);
			var $extLinks = opts.extLinks ? $(opts.extLinks) : $([]);
			var spinnerExt = $.nette ? $.nette.ext('spinner') : null;

			var fragment = window.location.href;
			if ((i = fragment.search(/#/)) != -1)
				fragment = fragment.substring(i+1);
			else
				fragment = '';

			if(opts.fx === 'slide' && ! opts.collapseDelay) {
				opts.collapseDelay = 500;
			}

			if($extLinks.length) {
				if ($extLinks[0].tagName.toUpperCase() != 'A')
					$extLinks = $extLinks.find('a');

				$extLinks.bind('click', function(e) {
					var $target = $($(this).attr('href'));

					if (opts.extLinksPreventDefault)
						e.preventDefault();

					if ($target.hasClass(opts.classNames.collapsed)) {
						var $control = $target.find(opts.control);
						var $btn = ($control[0].tagName.toUpperCase() == 'A') ? $control : $control.find('a');

						$btn.trigger('click');
					}
				});
			}

			if(opts.expandAll)
				$(opts.expandAll).bind('click', function() { methods.expandAll.call($boxSet); return false; });

			if(opts.collapseAll)
				$(opts.collapseAll).bind('click', function() { methods.collapseAll.call($boxSet); return false; });

			if(opts.grouped && !opts.collapsableAll && (fragment === '' || $boxSet.filter('#' + fragment).length === 0)) {
				var $visible = $boxSet.filter('.' + opts.classNames.defaultExpanded);
				if($visible.length == 0)
					$boxSet.first().addClass(opts.classNames.defaultExpanded);
			}

			if ((fragment && ($fragment = $boxSet.filter('#' + fragment)).length)) {
				$boxSet.filter('.' + opts.classNames.defaultExpanded).removeClass(opts.classNames.defaultExpanded);
				$fragment.addClass(opts.classNames.defaultExpanded);
			}

			return $boxSet.each(function() {
				var $this    = $(this);
				var $control = $this.find(opts.control);
				var $box     = $this.find(opts.box);

				if($control.length == 0 || $box.length == 0)
					return true; // return false by ukončil celý each!!!

				if($control.find('a').length == 0 && $control[0].tagName.toUpperCase() != 'A')
					$control.wrapInner('<a class="ca-link" href="#'+$(this).attr('id')+'"></a>');

				$btn = ($control[0].tagName.toUpperCase() == 'A') ? $control : $control.find('a');

				if(opts.defaultOpen || $this.hasClass(opts.classNames.defaultExpanded) || $this.attr('id') == fragment) {
					$this.removeClass(opts.classNames.collapsed).addClass(opts.classNames.expanded);

					$extLinks.filter('[href=#' + $this.attr('id') + ']').addClass(opts.classNames.extLinkActive);

					if(typeof opts.onExpanded == 'function')
						opts.onExpanded.call($this);
				}
				else {
					if(opts.fx !== false) $box.hide();
					$this.removeClass(opts.classNames.expanded).addClass(opts.classNames.collapsed);
				}

				$this.find($btn).bind('click', function(e) {
					var data = $this.data('collapsable');
					if (data)
						opts = data.opts;

					if($this.hasClass(opts.classNames.expanded) && (!opts.grouped || opts.collapsableAll)) {
						$extLinks.filter('[href=#' + $this.attr('id') + ']').removeClass(opts.classNames.extLinkActive);

						$this.removeClass(opts.classNames.expanded).addClass(opts.classNames.collapsed);
						collapseBox(opts, $box, $this);
					}
					else {
						if(opts.grouped) {
							$extLinks.removeClass(opts.classNames.extLinkActive);

							var $visible = $boxSet.filter('.' + opts.classNames.expanded);
							$boxSet.removeClass(opts.classNames.expanded).addClass(opts.classNames.collapsed);
							if($visible.length > 0) {
								collapseBox(opts, $visible.find(opts.box), $boxSet.filter($visible));
							}
						}

						$extLinks.filter('[href=#' + $this.attr('id') + ']').addClass(opts.classNames.extLinkActive);

						$this.removeClass(opts.classNames.collapsed).addClass(opts.classNames.expanded);
						expandBox(opts, $box, $this);
					}

					if($(this).hasClass('ajax') && spinnerExt) {
						$box.append(spinnerExt.$spinnerHtml);
					}

					if(opts.preventDefault)
						e.preventDefault();
				});

				$(this).data('collapsable', {opts: opts});
			});
		},

		expandAll: function() {
			var $boxSet = $(this);
			var data;
			if(data = $boxSet.data('collapsable')) {
				var opts = data.opts;

				$boxSet.removeClass(opts.classNames.collapsed).addClass(opts.classNames.expanded);
				$boxSet.each(function() {
					expandBox(opts, $(this).find(opts.box), $(this));
				});

				if(opts.preventDefault)
					return false;
				else
					$(document).scrollTop($boxSet.first().offset().top);
			}
		},

		collapseAll: function() {
			var $boxSet = $(this);
			var data;
			if(data = $boxSet.data('collapsable')) {
				var opts = data.opts;

				$boxSet.removeClass(opts.classNames.expanded).addClass(opts.classNames.collapsed);
				$boxSet.each(function() {
					collapseBox(opts, $(this).find(opts.box), $(this));
				});

				if(opts.preventDefault)
					return false;
				else
					$(document).scrollTop($boxSet.first().offset().top);
			}
		},

		destroy: function() {
			var $boxSet = $(this);
			$boxSet.each(function() {
				var data;
				var $this = $(this);
				if(data = $this.data('collapsable')) {
					$this.find(data.opts.box).removeAttr('style');

					var $control = $this.find(data.opts.control);
					var $btn = ($control[0].tagName.toUpperCase() == 'A') ? $control : $control.find('a');

					$this.removeClass(data.opts.classNames.collapsed + ' ' + data.opts.classNames.expanded);

					$btn.unbind('click');
					$btn.filter('.ca-link').each(function() { // pouze odkazy vytvořené pluginem chceme odstranit
						$(this).parent().html($(this).html());
					});

					if(data.opts.extLinks)
						$(data.opts.extLinks).unbind('click');

					if(data.opts.expandAll)
						$(data.opts.expandAll).unbind('click');

					if(data.opts.collapseAll)
						$(data.opts.collapseAll).unbind('click');

					$this.removeData('collapsable');
				}
			});
		}
	};

	$.fn.collapsable = function(options) {
		if(methods[options]) {
			return methods[options].apply(this, Array.prototype.slice.call(arguments, 1));
		}
		else if(typeof options === 'object' || !options) {
			var ret =  methods.init.apply( this, arguments );

			var data = ret.data('collapsable');
			if(data && typeof data.opts.onInit == 'function') {
				$(this).each(function() {
					data.opts.onInit.call(this);
				})
			}

			return ret;
		}
		else {
			$.error('Method ' + options + ' does not exist on jQuery.collapsable' );
		}
	};

	$.fn.collapsable.defaults = {
		control:          '.ca-control', // selektor ovladaciho prvku, muze se v ramci boxu i opakovat
		box:              '.ca-box',     // selektor pro skryvanou/zobrazovanou cast
		fx:               false,         // [ false (jen zmena class) / toggle (prepinani show/hide) / slide (animace vysky) ]
		collapseDelay:    0,             // doba trvání efektu, případně zpoždění volání onExpanded a onCollapsed funkcí; výchozí hodnota 500, pokud je fx === 'slide'

		grouped:          false,         // pokud je true, pak bude otevreny vzdy jen jeden box ze skupiny
		defaultOpen:      false,         // otevreny/zavreny po inicializaci
		preventDefault:   true,          // po kliku na control zavolani / nezavolani preventDefault na event
		collapsableAll:   true,          // lze zavrit vsechny polozky, ma vliv pouze pokud grouped==true

		extLinks:         false,         // false nebo selektor externich odkazu (napr. prichycen horni lista, atp.)
		extLinksPreventDefault: false,    // true / false zda po kliku na externí odkaz má být zavoláno preventDefault na události click
		expandAll:        false,         // false nebo selektor na odkaz, ktery otevre vsechny boxy
		collapseAll:      false,         // false nebo selektor na odkaz, ktery zavre vsechny boxy

		classNames: {                     // nazvy trid, otevreny, zavreny box a box, ktery bude defaultne otevreny
			expanded:        'ca-expanded',
			collapsed:       'ca-collapsed',
			defaultExpanded: 'ca-default-expanded',
			extLinkActive:   'ca-ext-active'
		},

		onInit:      null,      // callback funkce volana ihned po inicializaci
		onExpand:    null,      // callback volany pred samotny oteviranim
		onExpanded:  null,      // callback zavolany po dokonceni otevirani, ma smysl jen pri fx: 'slide' s nenulovym casem
		onCollapse:  null,      // analogicky viz vyse
		onCollapsed: null
	};

})(jQuery);
