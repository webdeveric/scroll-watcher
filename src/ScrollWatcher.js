(function( root, name, factory ) {
  'use strict';

  if ( typeof define === 'function' && define.amd ) {

    define( [], function() {
      return factory( root );
    });

  } else if ( typeof module !== 'undefined' && module.exports ) {

    module.exports = factory( root );

  } else {

    root[ name ] = factory( root );

  }

}( typeof window !== 'undefined' ? window : this, 'ScrollWatcher', function( window ) {
  'use strict';

  if ( ! window.document ) {
    throw new Error( 'ScrollWatcher requires a window with a document' );
  }

  // Get the element ID or generate one if it's missing.
  var getId = (function() {
    var counter = 0;
    return function( element ) {
      if ( ! element.id ) {
        var newId = '';
        do {
          newId = 'id' + counter++;
        } while ( document.getElementById( newId ) !== null );
        element.id = newId;
      }
      return element.id;
    };
  }());

  // Polyfill requestAnimationFrame and cancelAnimationFrame
  (function( w ) {
    var prefix = [ 'webkit', 'moz', 'ms', 'o' ],
        i = 0,
        limit = prefix.length;

    for ( ; i < limit && !w.requestAnimationFrame ; ++i ) {
      w.requestAnimationFrame = w[ prefix[ i ] + 'RequestAnimationFrame' ];
      w.cancelAnimationFrame  = w[ prefix[ i ] + 'CancelAnimationFrame' ] || w[ prefix[ i ] + 'CancelRequestAnimationFrame' ];
    }

    if ( ! w.requestAnimationFrame ) {
      var lastTime = 0;
      w.requestAnimationFrame = function( callback ) {
        var now   = new Date().getTime(),
            ttc   = Math.max( 0, 16 - now - lastTime ),
            timer = w.setTimeout( function() { callback( now + ttc ); }, ttc );
        lastTime = now + ttc;
        return timer;
      };
    }

    if ( ! w.cancelAnimationFrame ) {
      w.cancelAnimationFrame = function( timer ) {
        w.clearTimeout( timer );
      };
    }
  }( window ));

  function ScrollWatcher( obj )
  {
    if ( ! window.addEventListener ) {
      return;
    }

    this.queue           = [];
    this.running         = false;
    this.requestId       = null;
    this.currentCallback = null;
    this.timestamp       = 0;
    this.prevTimestamp   = 0;
    this.obj             = obj || window;
    this.doc             = this.obj === window ? document.documentElement : this.obj.ownerDocument.documentElement;
    this.vp              = {};

    this.eventNames = [
      'scroll',
      'resize',
      'touchmove',
      'MSPointerMove'
    ];

    [ 'top', 'right', 'bottom', 'left' ].forEach( function( prop ) {

      Object.defineProperty( this.vp, prop, {
        get: function() {
          return this.rect( this.doc )[ prop ];
        }.bind(this)
      });

    }, this );

    this.saveViewportDimensions();

    this.handleOnce( 'load', 'pageshow' );

    this.listen();
  }

  // Cache the getBoundingClientRect results.
  // Let all instances share the same cache.
  ScrollWatcher.cache = {};
  ScrollWatcher.prevCache = {};

  ScrollWatcher.prototype.rect = function( element )
  {
    var key = getId( element );

    if ( ! ScrollWatcher.cache[ key ] ) {
      var rect = element.getBoundingClientRect();

      ScrollWatcher.cache[ key ] = {
        top:          rect.top,
        right:        rect.right,
        bottom:       rect.bottom,
        left:         rect.left,
        width:        rect.width,
        height:       rect.height,
        offsetTop:    element.offsetTop,
        offsetLeft:   element.offsetLeft,
        offsetWidth:  element.offsetWidth,
        offsetHeight: element.offsetHeight
      };

    }

    return ScrollWatcher.cache[ key ];
  };

  ScrollWatcher.prototype.prevRect = function( element )
  {
    var key = window.getId( element );
    return ScrollWatcher.prevCache[ key ] ? ScrollWatcher.prevCache[ key ] : null;
  };

  ScrollWatcher.prototype.inViewport = function( element, minPercent )
  {
    var rect = this.rect( element );

    if ( rect.bottom <= 0 || rect.top >= this.vp.height || rect.left >= this.vp.width || rect.right <= 0 ) {
      return false;
    }

    if ( minPercent !== void 0 ) {
      return this.percentInViewport( element ) >= minPercent;
    }

    return true;
  };

  ScrollWatcher.prototype.pixelsInViewport = function( element )
  {
    var rect = this.rect( element ),
        pixels = rect.top > 0 ? Math.min( rect.height, this.vp.height - rect.top ) : Math.max( rect.height + rect.top, 0 );

    return pixels;
  };

  ScrollWatcher.prototype.percentInViewport = function( element )
  {
    var rect = this.rect( element ),
        pixels = this.pixelsInViewport( element );

    return Math.round( (pixels / rect.height) * 100 ) / 100;
  };

  ScrollWatcher.prototype.handleOnce = function()
  {
    var eventNames = Array.prototype.slice.call( arguments ),
        handled = false;

    eventNames.forEach( function( eventName ) {
      var self = this,
          tmpHandler = function( e ) {
            if ( ! handled ) {
              handled = true;
              self.handleEvent( e );
            }
            self.obj.removeEventListener( eventName, tmpHandler, false );
          };

      this.obj.addEventListener( eventName, tmpHandler, false );
    }, this );
  };

  ScrollWatcher.prototype.listen = function()
  {
    if ( 'addEventListener' in this.obj ) {

      this.eventNames.forEach( function( eventName ) {
        this.obj.addEventListener( eventName, this, false );
      }, this );

    }
  };

  ScrollWatcher.prototype.stopListening = function()
  {
    if ( 'removeEventListener' in this.obj ) {

      this.eventNames.forEach( function( eventName ) {
        this.obj.removeEventListener( eventName, this, false );
      }, this );

    }
  };

  ScrollWatcher.prototype.saveViewportDimensions = function()
  {
    this.vp.width = window.innerWidth || this.doc.clientWidth;
    this.vp.height = window.innerHeight || this.doc.clientHeight;
  };

  ScrollWatcher.prototype.onResize = function()
  {
    this.saveViewportDimensions();
  };

  ScrollWatcher.prototype.onScroll = function( e )
  {
    if ( ! this.requestId ) {
      var self = this,
          doAnimationFrame = function( timestamp ) {
            self.prevTimestamp = self.timestamp;
            self.timestamp = timestamp;
            self.run( e );
            self.requestId = null;
          };

      this.requestId = window.requestAnimationFrame( doAnimationFrame );
    }
  };

  ScrollWatcher.prototype.handleEvent = function( e )
  {
    if ( e.type === 'resize' ) {
      this.onResize( e );
    } else {
      this.onScroll( e );
    }
  };

  ScrollWatcher.prototype.run = function( e )
  {
    this.running = true;

    ScrollWatcher.prevCache = ScrollWatcher.cache;
    ScrollWatcher.cache = {};

    this.queue.forEach( function( callback ) {
      this.currentCallback = callback;
      callback( this, e );
      if ( callback.runOnce ) {
        this.removeCurrentCallback();
      }
    }, this );

    this.running = false;
  };

  ScrollWatcher.prototype.add = function( callback )
  {
    return this.queue[ this.queue.length ] = callback;
  };

  ScrollWatcher.prototype.once = function( callback )
  {
    callback.runOnce = true;
    return this.add( callback );
  };

  ScrollWatcher.prototype.remove = function( callback )
  {
    var oldLength = this.queue.length;

    this.queue = this.queue.filter( function( item ) {
      return item !== callback;
    });

    return this.queue.length < oldLength;
  };

  ScrollWatcher.prototype.removeCurrentCallback = function()
  {
    if ( this.currentCallback ) {
      this.remove( this.currentCallback );
      this.currentCallback = null;
      return true;
    }
    return false;
  };

  if ( Object.defineProperties ) {
    Object.defineProperties( ScrollWatcher.prototype, {
      timeDiff: {
        get: function() {
          return this.timestamp - this.prevTimestamp;
        }
      },
      atTop: {
        get: function() {
          return this.doc.scrollTop === 0;
        }
      },
      atBottom: {
        get: function() {
          return this.doc.scrollHeight - this.doc.scrollTop === this.doc.clientHeight;
        }
      },
      scrollLeft: {
        get: function() {
          return (this.obj.pageXOffset || this.obj.scrollLeft) | 0 - this.obj.clientLeft | 0;
        }
      },
      scrollTop: {
        get: function() {
          return (this.obj.pageYOffset || this.obj.scrollTop) | 0  - this.obj.clientTop | 0;
        }
      }
    });
  }

  ScrollWatcher.prototype.die = function()
  {
    var props = Object.getOwnPropertyNames( this ),
        i = 0,
        l = props.length;

    this.stopListening();

    for ( ; i < l ; ++i ) {
      this[ props[ i ] ] = null;
    }
  };

  return ScrollWatcher;

}));
