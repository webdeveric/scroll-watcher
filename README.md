# Scroll Watcher

Perform callbacks when scrolling.

## Example Usage

```javascript
var sw = new ScrollWatcher();

sw.add( function( sw ) {
  console.log( sw.scrollTop );

  if ( sw.atBottom ) {
    console.log('You are at the bottom.');
    sw.stopListening();
  }
});
```
