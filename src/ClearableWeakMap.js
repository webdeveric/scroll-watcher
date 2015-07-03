export default class ClearableWeakMap
{
  constructor( iterable = [] ) {
    this.storage = new WeakMap( iterable );
  }

  clear()
  {
    this.storage = new WeakMap();
  }

  delete( key )
  {
    return this.storage.delete( key );
  }

  get( key )
  {
    return this.storage.get( key );
  }

  has( key )
  {
    return this.storage.has( key );
  }

  set( key, value )
  {
    this.storage.set( key, value );
    return this;
  }
}
