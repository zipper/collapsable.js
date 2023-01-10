module.exports = function(grunt) {
	grunt.initConfig({
		sync: {
			production: {
				src: 'node_modules/collapsable.js/dist/Collapsable.js',
				dest: 'js/Collapsable.js'
			}
		}
	});

	grunt.loadNpmTasks('grunt-sync');

	grunt.registerTask('default', ['sync']);
};
