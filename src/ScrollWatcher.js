import ClearableWeakMap from './ClearableWeakMap';
import { requestAnimationFrame } from './animationFrame';

export class ScrollWatcher
{
  constructor( element = window )
  {
    if ( ! window.addEventListener ) {
      return;
    }

    if ( typeof Set === 'undefined' ) {
      console.error('Set is undefined. Please provide a polyfill.');
    } else {
      this.queue = new Set();
    }

    this.element         = element;
    this.running         = false;
    this.requestId       = null;
    this.currentCallback = null;
    this.timestamp       = 0;
    this.prevTimestamp   = 0;

    this.eventNames = [
      'scroll',
      'resize',
      'touchmove',
      'MSPointerMove'
    ];

    if ( this.element.ownerDocument ) {
      this.doc = this.element.ownerDocument.documentElement;
    } else {
      this.doc = window.document.documentElement;
    }

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
    return ScrollWatcher.prevCache.get( element );
  }

  inViewport( element, minPercent, covering = false )
  {
    const rect = this.rect( element );

    if ( rect.bottom <= 0 || rect.top >= this.viewport.height || rect.left >= this.viewport.width || rect.right <= 0 ) {
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
          vph  = this.viewport.height;

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
          h = Math.min( this.viewport.height, this.rect( element ).height );

    return +( p / h ).toFixed( digits );
  }

  /**
    @return number between 0 and 1

    How much of the viewport is covered by the element.
  */
  percentCoveringViewport( element, digits = 2 )
  {
    const p = this.pixelsInViewport( element ),
          h = this.viewport.height;

    return +( p / h ).toFixed( digits );
  }

  coveringViewport( element )
  {
    const rect = this.rect( element ),
          vertical = rect.top <= 0 && rect.bottom >= this.viewport.height,
          horizontal = rect.left <= 0 && rect.right >= this.viewport.width;

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
      this.handleEvent( new Event('handleloaded') );
      return;
    }

    let handled = false;

    [ 'load', 'pageshow' ].forEach( ( eventName ) => {
      const tmpHandler = ( e ) => {
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
    this.eventNames.forEach( ( eventName ) => {
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
      this.requestId = requestAnimationFrame( ( timestamp ) => {
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

      ScrollWatcher.prevCache = ScrollWatcher.cache;
      ScrollWatcher.cache.clear();

      if ( this.queue && this.queue.size ) {

        this.queue.forEach( ( callback ) => {
          this.currentCallback = callback;
          callback( this, e );
          if ( callback.runOnce ) {
            this.removeCurrentCallback();
          }
        } );

      }

      this.running = false;
    }
  }

  add( callback )
  {
    if ( this.queue ) {
      this.queue.add( callback );
    }

    return this;
  }

  once( callback )
  {
    if ( this.queue ) {
      callback.runOnce = true;
      return this.add( callback );
    }

    return this;
  }

  remove( callback )
  {
    if ( this.queue ) {
      return this.queue.delete( callback );
    }

    return false;
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

    Object.getOwnPropertyNames( this ).forEach( ( prop ) => {
      this[ prop ] = null;
      delete this[ prop ];
    });
  }

  get viewport()
  {
    return this.rect( this.doc );
  }

  get vp()
  {
    return this.rect( this.doc );
  }

  get timeDiff()
  {
    return this.timestamp - this.prevTimestamp;
  }

  get atTop()
  {
    return this.doc.scrollTop === 0;
  }

  get atBottom()
  {
    return this.doc.scrollHeight - this.doc.scrollTop === this.doc.clientHeight;
  }

  get scrollLeft()
  {
    return (this.element.pageXOffset || this.element.scrollLeft) | 0 - this.element.clientLeft | 0;
  }

  get scrollTop()
  {
    return (this.element.pageYOffset || this.element.scrollTop) | 0  - this.element.clientTop | 0;
  }

}

// Cache the getBoundingClientRect results.
// Let all instances share the same cache.
ScrollWatcher.cache = new ClearableWeakMap();
ScrollWatcher.prevCache = null;

export default ScrollWatcher;
