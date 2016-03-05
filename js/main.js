$(function () {

	$('.example').collapsable({
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
	});


	$('.collapsable-basic').collapsable();

	$('.collapsable-toggle').collapsable({
		fx: 'toggle'
	});

	$('.collapsable-slide').collapsable({
		fx: 'slide',
		fxDuration: 300
	});

	$('.collapsable-grouped').collapsable({
		grouped: true,
		fx: 'slide',
		fxDuration: 300
	});

	$('.collapsable-collapsableAll').collapsable({
		collapsableAll: false,
		fx: 'slide',
		fxDuration: 300
	});


});
