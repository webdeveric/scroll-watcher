module.exports = function(grunt) {
  'use strict';

  var openCommand = process.platform === 'linux' ? 'xdg-open' : 'open',
      jsFiles = [ 'Gruntfile.js', 'src/**/*.js' ];

  grunt.config.init({
    jshint: {
      src: jsFiles,
      options: {
        jshintrc: './.jshintrc'
      }
    },

    jscs: {
      src: jsFiles,
      options: {
        config: './.jscs.json'
      }
    },

    shell: {
      openreports: {
        command: openCommand + ' .plato/index.html'
      }
    },

    plato: {
      scrollwatcher: {
        files: {
          '.plato/': [ 'src/*.js' ]
        }
      }
    }
  });

  // https://github.com/sindresorhus/load-grunt-tasks
  require('load-grunt-tasks')(grunt);

  // https://www.npmjs.com/package/time-grunt
  require('time-grunt')(grunt);

  grunt.registerTask('lint', [ 'jshint', 'jscs' ] );

  grunt.registerTask('report', [ 'plato', 'shell:openreports' ] );

  grunt.registerTask('default', [ 'lint' ] );
};
