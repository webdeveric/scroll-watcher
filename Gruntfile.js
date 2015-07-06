module.exports = function(grunt) {
  'use strict';

  var jsFiles = [ 'src/*.js' ];

  var config = {

    eslint: {
      options: {
        configFile: './.eslintrc'
      },
      js: jsFiles
    },

    jscs: {
      options: {
        config: './.jscsrc'
      },
      js: jsFiles
    },

    browserify: {
      js: {
        options: {
          transform: [ "babelify" ],
          browserifyOptions: {
            standalone: 'ScrollWatcher'
          }
        },
        files: {
          "lib/ScrollWatcher.bundle.js": "src/ScrollWatcher.js"
        }
      }
    },

    babel: {
      options: {
        sourceMap: true,
        modules: 'umd',
        env: {
          production: {
            compact: true
          }
        }
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

  require('time-grunt')(grunt);

  require('load-grunt-tasks')(grunt);

  grunt.task.registerTask(
    'lint',
    'Run linting and coding style tasks',
    [ 'eslint', 'jscs' ]
  );

  grunt.task.registerTask(
    'build',
    'Transpile ES6 to ES5',
    [ 'browserify' ]
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
