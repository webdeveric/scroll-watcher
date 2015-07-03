const prefix = [ 'webkit', 'moz', 'ms', 'o' ];

export var requestAnimationFrame = (function( w ) {

  for ( let i = 0, limit = prefix.length ; i < limit && !w.requestAnimationFrame ; ++i ) {
    w.requestAnimationFrame = w[ prefix[ i ] + 'RequestAnimationFrame' ];
  }

  if ( ! w.requestAnimationFrame ) {
    let lastTime = 0;
    w.requestAnimationFrame = function( callback ) {
      var now   = new Date().getTime(),
          ttc   = Math.max( 0, 16 - now - lastTime ),
          timer = w.setTimeout( () => { callback( now + ttc ); }, ttc );
      lastTime = now + ttc;
      return timer;
    };
  }

  return w.requestAnimationFrame;
}( window ));

export var cancelAnimationFrame = (function( w ) {

  for ( let i = 0, limit = prefix.length ; i < limit && !w.cancelAnimationFrame ; ++i ) {
    w.cancelAnimationFrame  = w[ prefix[ i ] + 'CancelAnimationFrame' ] || w[ prefix[ i ] + 'CancelRequestAnimationFrame' ];
  }

  if ( ! w.cancelAnimationFrame ) {
    w.cancelAnimationFrame = function( timer ) {
      w.clearTimeout( timer );
    };
  }

  return w.cancelAnimationFrame;
}( window ));
