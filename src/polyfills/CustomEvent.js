try {

  new CustomEvent('test');

} catch ( e ) {

  function FakeCustomEvent( event, { bubbles = false, cancelable = false, detail = null } = {} )
  {
    var evt = document.createEvent( 'CustomEvent' );
    evt.initCustomEvent( event, bubbles, cancelable, detail );
    return evt;
  }

  FakeCustomEvent.prototype = window.Event.prototype;
  window.CustomEvent = FakeCustomEvent;

}
