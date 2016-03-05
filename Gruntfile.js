module.exports = function(grunt) {
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		concat: {
			options: {
				stripBanners: true,
				banner: '/**\n' +
					' * <%= pkg.title %> - <%= pkg.description %> \n' +
					' * <%= pkg.homepage %>\n' +
					' *\n' +
					' * @author <%= pkg.author.name %> <<%= pkg.author.email %>>\n' +
					' * @copyright Copyright (c) 2014-<%= grunt.template.today("yyyy") %> <%= pkg.author.name %>\n' +
					' * @license <%= pkg.license %>\n' +
					' *\n' +
					' * @version <%= pkg.version %>\n' +
					' */\n'
			},
			production: {
				src: ['src/jquery.collapsable.js'],
				dest: 'dist/jquery.collapsable.js'
			}
		},
		uglify: {
			options: {
				banner: '/*! <%= pkg.title %> <%= pkg.version %> | <%= pkg.license %> | <%= pkg.author.name %>, <%= pkg.homepage %> */\n'
			},
			production: {
				files: {
					'dist/jquery.collapsable.min.js': ['dist/jquery.collapsable.js']
				}
			}
		}
	});

	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-uglify');

	grunt.registerTask('default', ['concat', 'uglify']);
};
