'use strict';

module.exports = function (grunt) {

	// Project configuration.
	grunt.initConfig({
		nodeunit: {
			files: ['test/**/*_test.js'],
		},
		jshint: {
			options: {
				jshintrc: '.jshintrc'
			},
			gruntfile: {
				src: 'Gruntfile.js'
			},
			lib: {
				src: ['lib/**/*.js']
			},
			test: {
				src: ['test/**/*.js']
			},
			build: {
				src: ['lib/**/*.js'],
				options: {
					reporter: 'checkstyle',
					reporterOutput: 'checkstyle-result.xml'
				},
			}
		},
		watch: {
			gruntfile: {
				files: '<%= jshint.gruntfile.src %>',
				tasks: ['jshint:gruntfile']
			},
			lib: {
				files: '<%= jshint.lib.src %>',
				tasks: ['jshint:lib', 'nodeunit']
			},
			test: {
				files: '<%= jshint.test.src %>',
				tasks: ['jshint:test', 'nodeunit']
			},
		},
	});

	// These plugins provide necessary tasks.
	grunt.loadNpmTasks('grunt-contrib-nodeunit');
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-contrib-watch');

	// Default task.
	// grunt.registerTask('default', ['jshint', 'nodeunit']);

	// default task, for developers
	grunt.registerTask('default', [
		'jshint:gruntfile',
		'jshint:lib'
	]);
	
	// continuous integration task
	grunt.registerTask('build', [
		'jshint:build'
	]);
};
