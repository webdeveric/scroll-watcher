export default class ClearableWeakMap
{
  constructor( iterable = [] )
  {
    if ( typeof WeakMap === 'undefined' ) {

      console.error('WeakMap is undefined. Please provide a polyfill.');

    } else {

      this.storage = new WeakMap( iterable );

    }
  }

  clear()
  {
    if ( this.storage ) {
      this.storage = new WeakMap();
    }
  }

  delete( key )
  {
    return this.storage ? this.storage.delete( key ) : false;
  }

  get( key )
  {
    return this.storage ? this.storage.get( key ) : false;
  }

  has( key )
  {
    return this.storage ? this.storage.has( key ) : false;
  }

  set( key, value )
  {
    if ( this.storage ) {
      this.storage.set( key, value );
    }

    return this;
  }
}
