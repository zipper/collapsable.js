module.exports = function(grunt) {
	grunt.initConfig({
		'bower-install-simple': {
			options: {
				directory: 'temp/bower/'
			},
			production: {
				options: {
					production: true,
					interactive: false
				}
			}
		},
		copy: {
			production: {
				src: 'temp/bower/jquery.collapsable/dist/jquery.collapsable.js',
				dest: 'js/jquery.collapsable.js'
			}
		}
	});

	grunt.loadNpmTasks('grunt-bower-install-simple');
	grunt.loadNpmTasks('grunt-contrib-copy');

	grunt.registerTask('default', ['bower-install-simple:production', 'copy']);
};
