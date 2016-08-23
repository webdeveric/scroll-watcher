module.exports = function(grunt) {
  'use strict';

  var jsFiles = [ 'src/**/*.js' ];

  var config = {

    eslint: {
      options: {
        configFile: 'eslint-config-webdeveric'
      },
      js: jsFiles
    },

    babel: {
      options: {
        sourceMap: true
      },
      js: {
        files: [ {
          expand: true,
          cwd: './src/',
          src: ['*.js'],
          dest: './lib/'
        } ]
      }
    },

    watch: {
      js: {
        files: jsFiles,
        tasks: [ 'js' ]
      }
    }
  };

  grunt.config.init( config );

  grunt.loadNpmTasks('grunt-babel');
  grunt.loadNpmTasks('grunt-eslint');
  grunt.loadNpmTasks('grunt-contrib-watch');

  grunt.task.registerTask(
    'lint',
    'Run linting and coding style tasks',
    [ 'eslint' ]
  );

  grunt.task.registerTask(
    'build',
    'Transpile ES6 to ES5',
    [ 'babel' ]
  );

  grunt.task.registerTask(
    'js',
    'Lint then build',
    [ 'lint', 'build' ]
  );

  grunt.task.registerTask(
    'default',
    [ 'watch' ]
  );
};
