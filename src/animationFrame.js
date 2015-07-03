const prefix = [ 'webkit', 'moz', 'ms', 'o' ];

export const requestAnimationFrame = (( w ) => {

  for ( let i = 0, limit = prefix.length ; i < limit && !w.requestAnimationFrame ; ++i ) {
    w.requestAnimationFrame = w[ prefix[ i ] + 'RequestAnimationFrame' ];
  }

  if ( ! w.requestAnimationFrame ) {
    let lastTime = 0;
    w.requestAnimationFrame = ( callback ) => {
      const now   = new Date().getTime(),
            ttc   = Math.max( 0, 16 - now - lastTime ),
            timer = w.setTimeout( () => { callback( now + ttc ); }, ttc );
      lastTime = now + ttc;
      return timer;
    };
  }

  return w.requestAnimationFrame;
}( window ));

export const cancelAnimationFrame = (( w ) => {

  for ( let i = 0, limit = prefix.length ; i < limit && !w.cancelAnimationFrame ; ++i ) {
    w.cancelAnimationFrame  = w[ prefix[ i ] + 'CancelAnimationFrame' ] || w[ prefix[ i ] + 'CancelRequestAnimationFrame' ];
  }

  if ( ! w.cancelAnimationFrame ) {
    w.cancelAnimationFrame = ( timer ) => {
      w.clearTimeout( timer );
    };
  }

  return w.cancelAnimationFrame;
}( window ));
