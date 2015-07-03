import ClearableWeakMap from './ClearableWeakMap.js';
import { requestAnimationFrame } from './animationFrame.js';

export class ScrollWatcher
{
  constructor( element = window )
  {
    this.element         = element;
    this.queue           = new Set();
    this.running         = false;
    this.requestId       = null;
    this.currentCallback = null;
    this.timestamp       = 0;
    this.prevTimestamp   = 0;

    this.eventNames = [
      'pageshow',
      'load',
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

  inViewport( element, minPercent )
  {
    const rect = this.rect( element );

    if ( rect.bottom <= 0 || rect.top >= this.viewport.height || rect.left >= this.viewport.width || rect.right <= 0 ) {
      return false;
    }

    if ( minPercent !== void 0 ) {
      return this.percentInViewport( element ) >= minPercent;
    }

    return true;
  }

  pixelsInViewport( element )
  {
    const rect = this.rect( element ),
          pixels = rect.top > 0 ?
          Math.min( rect.height, this.viewport.height - rect.top ) :
          Math.max( rect.height + rect.top, 0 );

    return pixels;
  }

  percentInViewport( element )
  {
    const rect = this.rect( element ),
          pixels = this.pixelsInViewport( element );

    return Math.round( pixels / this.viewport.height * 100 ) / 100;
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
    this.queue.add( callback );
    return this;
  }

  once( callback )
  {
    callback.runOnce = true;
    return this.add( callback );
  }

  remove( callback )
  {
    return this.queue.delete( callback );
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
