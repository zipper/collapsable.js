$(function () {

	$('.example')
		.collapsable({
			control: '> h2 .ca-link',
			box: '.example-content',

			fx: 'slide',
			fxDuration: 300,

			extLinks: {
				selector: '.example .anchor, .ca-ext-link'
			},

			classNames: {
				expanded: 'example-expanded',
				collapsed: 'example-collapsed'
			}
		})
		.on('collapse.collapsable', function(e) {
			if ($(e.target).is('.example') && e.collapsableEvent && $(e.collapsableEvent.target).hasClass('ca-ext-link')) {
				e.preventDefault();
			}
		});


	$('.collapsable-basic').collapsable();

	$('.collapsable-toggle').collapsable({
		fx: 'toggle'
	});

	$('.collapsable-slide').collapsable({
		fx: 'slide',
		fxDuration: 300
	});

	$('.collapsable-accordion').collapsable({
		accordion: true,
		fx: 'slide',
		fxDuration: 300
	});

	$('.collapsable-collapsableAll').collapsable({
		collapsableAll: false,
		fx: 'slide',
		fxDuration: 300
	});


});
