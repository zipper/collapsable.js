$(function () {

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
