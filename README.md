# Scroll Watcher

Perform callbacks when scrolling.

## Example Usage

```javascript
var sw = new ScrollWatcher();
var elm = document.getElementById('some-id');

// Do something like this if you want an infinite scroll feed.
sw.add( function( sw ) {
  if ( sw.atBottom ) {
    console.log('You are at the bottom.');
    // Perform AJAX here to load more content.
  }
});

// Do something when an element enters the viewport.
sw.add( function( sw ) {
  if ( sw.inViewport(elm) ) {
    // Do something here.

    // You can remove the callback if you want to run this once.
    sw.removeCurrentCallback();
  }
});

sw.add( function( sw ) {
  if ( someStopCondition ) {
    // This removes the event listeners.
    sw.stopListening();
  }
});
```
