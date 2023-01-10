const example = document.querySelectorAll('.example');
new Collapsable(example, {
	control: '.example > h2 .ca-link',
	box: '.example-content',

	fxDuration: 300,

	extLinks: {
		selector: '.example .anchor, .ca-ext-link'
	},

	classNames: {
		expanded: 'example-expanded',
		collapsed: 'example-collapsed'
	}
});
example.forEach((element) => {
	element.addEventListener('collapse.collapsable', (event) => {
		if (
			event.target.classList.contains('example') &&
			event.collapsableEvent &&
			event.collapsableEvent.currentTarget.closest('.anchor, .ca-ext-link').length
		) {
			e.preventDefault();
		}
	})
})

const collapsableBasic = document.querySelectorAll('.collapsable-basic');
new Collapsable(collapsableBasic);


const collapsableAccordion = document.querySelectorAll('.collapsable-accordion');
new Collapsable(collapsableAccordion, {
	accordion: true
});


const collapsableCollapsableAll = document.querySelectorAll('.collapsable-collapsableAll')
new Collapsable(collapsableCollapsableAll, {
	collapsableAll: false
});
