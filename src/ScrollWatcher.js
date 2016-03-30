import { requestAnimationFrame } from './polyfills/animationFrame';
import './polyfills/CustomEvent';

export class ScrollWatcher
{
  constructor( element = window )
  {
    if ( ! window.addEventListener ) {
      return;
    }

    if ( typeof Map === 'undefined' ) {
      throw new Error('Map is undefined. Please provide a polyfill.');
    }

    this.queue           = new Map();
    this.element         = element;
    this.running         = false;
    this.requestId       = null;
    this.currentCallback = null;
    this.timestamp       = 0;
    this.prevTimestamp   = 0;

    this.eventNames = [
      'scroll',
      'resize',
      'touchmove'
    ];

    this.doc = window.document.body;

    this.listen();

    this.handleLoaded();
  }

  rect( element )
  {
    if ( ! ScrollWatcher.cache.has( element ) ) {

      const rect = element.getBoundingClientRect();

      ScrollWatcher.cache.set(
        element,
        {
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
        }
      );

    }

    return ScrollWatcher.cache.get( element );
  }

  prevRect( element )
  {
    return ScrollWatcher.prevCache ? ScrollWatcher.prevCache.get( element ) : false;
  }

  inViewport( element, minPercent, covering = false )
  {
    const rect = this.rect( element );

    if ( rect.bottom <= 0 || rect.top >= window.innerHeight || rect.left >= window.innerWidth || rect.right <= 0 ) {
      return false;
    }

    if ( minPercent !== void 0 ) {
      if ( covering ) {
        return this.percentCoveringViewport( element ) >= minPercent;
      }

      return this.percentInViewport( element ) >= minPercent;
    }

    return true;
  }

  /**
    @return number

    This returns the number of pixels that are in the viewport for the passed in element.
  */
  pixelsInViewport( element )
  {
    const rect = this.rect( element ),
          vph  = window.innerHeight;

    if ( rect.top <= 0 && rect.bottom >= vph ) {

      return vph;

    } else if ( rect.top >= 0 ) {

      return Math.max( 0, Math.min( rect.height, vph - rect.top ) );

    } else {

      return Math.max( 0, rect.height + rect.top );

    }
  }

  /**
    @return number between 0 and 1

    How much of the element is visible in the viewport.
  */
  percentInViewport( element, digits = 2 )
  {
    const p = this.pixelsInViewport( element ),
          h = Math.min( window.innerHeight, this.rect( element ).height );

    return +( p / h ).toFixed( digits );
  }

  /**
    @return number between 0 and 1

    How much of the viewport is covered by the element.
  */
  percentCoveringViewport( element, digits = 2 )
  {
    const p = this.pixelsInViewport( element ),
          h = window.innerHeight;

    return +( p / h ).toFixed( digits );
  }

  coveringViewport( element )
  {
    const rect = this.rect( element ),
          vertical = rect.top <= 0 && rect.bottom >= window.innerHeight,
          horizontal = rect.left <= 0 && rect.right >= window.innerWidth;

    return {
      vertical,
      horizontal,
      both: vertical && horizontal,
      either: vertical || horizontal
    };
  }

  /**
    Call handleEvent one time when the page has loaded or is complete.
  */
  handleLoaded()
  {
    if ( document.readyState === 'complete' ) {
      this.handleEvent( new CustomEvent('handleloaded') );
      return;
    }

    let handled = false;

    [ 'load', 'pageshow' ].forEach( eventName => {
      const tmpHandler = e => {
        if ( ! handled ) {
          handled = true;
          this.handleEvent( e );
        }

        this.element.removeEventListener( eventName, tmpHandler, false );
      };

      this.element.addEventListener( eventName, tmpHandler, false );
    } );
  }

  listen( listening = true )
  {
    this.eventNames.forEach( eventName => {
      if ( listening ) {
        this.element.addEventListener( eventName, this, false );
      } else {
        this.element.removeEventListener( eventName, this, false );
      }
    } );
  }

  stopListening()
  {
    this.listen( false );
  }

  handleEvent( e )
  {
    if ( ! this.requestId && ! this.running ) {
      this.requestId = requestAnimationFrame( timestamp => {
        this.prevTimestamp = this.timestamp;
        this.timestamp = timestamp;
        this.run( e );
        this.requestId = null;
      } );
    }
  }

  run( e )
  {
    if ( ! this.running ) {
      this.running = true;

      if ( this.queue && this.queue.size ) {

        for (let [callback, runOnce] of this.queue) {
          this.currentCallback = callback;

          if ( typeof callback === 'function' ) {
            callback( this, e );
          } else if ( typeof callback === 'object' && callback.handleEvent && typeof callback.handleEvent === 'function' ) {
            callback.handleEvent( e, this );
          }

          if ( runOnce ) {
            this.removeCurrentCallback();
          }
        }

        this.currentCallback = null;

        ScrollWatcher.prevCache = ScrollWatcher.cache;
        ScrollWatcher.cache = new WeakMap();
      }

      this.running = false;
    }
  }

  isValidCallback( callback )
  {
    switch ( typeof callback ) {
      case 'function':
        return true;
      case 'object':
        return callback.handleEvent && typeof callback.handleEvent === 'function';
      default:
        return false;
    }
  }

  add( callback, runOnce = false )
  {
    if ( ! this.isValidCallback( callback ) ) {
      throw new Error('callback is not a function or an object with a handleEvent method');
    }

    if ( this.queue ) {
      this.queue.set( callback, !!runOnce );
    }

    return this;
  }

  once( callback )
  {
    return this.add( callback, true );
  }

  remove( callback )
  {
    return this.queue ? this.queue.delete( callback ) : false;
  }

  removeCurrentCallback()
  {
    if ( this.currentCallback ) {
      this.remove( this.currentCallback );
      this.currentCallback = null;

      return true;
    }

    return false;
  }

  die()
  {
    this.listen( false );

    Object.getOwnPropertyNames( this ).forEach( prop => {
      this[ prop ] = null;
      delete this[ prop ];
    });
  }

  get viewport()
  {
    return {
      width: window.innerWidth,
      height: window.innerHeight
    };
  }

  get vp()
  {
    return this.viewport;
  }

  get timeDiff()
  {
    return this.timestamp - this.prevTimestamp;
  }

  get atTop()
  {
    return this.scrollTop === 0;
  }

  get atBottom()
  {
    return this.doc.scrollHeight - this.scrollTop === this.doc.parentNode.clientHeight;
  }

  get scrollLeft()
  {
    if ( 'pageXOffset' in this.element ) {
      top = this.element.pageXOffset;
    } else if ( 'scrollLeft' in this.element ) {
      top = this.element.scrollLeft;
    }

    let clientLeft = 'clientLeft' in this.element ? this.element.clientLeft : 0;

    return left - clientLeft;
  }

  get scrollTop()
  {
    let top = 0;

    if ( 'pageYOffset' in this.element ) {
      top = this.element.pageYOffset;
    } else if ( 'scrollTop' in this.element ) {
      top = this.element.scrollTop;
    }

    let clientTop = 'clientTop' in this.element ? this.element.clientTop : 0;

    return top - clientTop;
  }

}

// Cache the getBoundingClientRect results.
// Let all instances share the same cache.
ScrollWatcher.cache = new WeakMap();
ScrollWatcher.prevCache = null;

export default ScrollWatcher;
