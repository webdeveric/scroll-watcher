(function() {

  if ( window.CustomEvent !== void 0 ) {
    return;
  }

  function FakeCustomEvent( event, params )
  {
    params = params || { bubbles: false, cancelable: false, detail: undefined };
    var evt = document.createEvent( 'CustomEvent' );
    evt.initCustomEvent( event, params.bubbles, params.cancelable, params.detail );
    return evt;
  }

  FakeCustomEvent.prototype = window.Event.prototype;
  window.CustomEvent = FakeCustomEvent;

})();
