marionette-js-runner
====================

This project is the sum of a number of other smaller more focused projects:
  - [marionette-js-client](https://github.com/mozilla-b2g/marionette_js_client)
  - [marionette-profile-builder](https://github.com/mozilla-b2g/marionette-profile-builder)
  - [marionette-b2gdesktop-host](https://github.com/mozilla-b2g/marionette-b2gdesktop-host)

See [MDN](https://developer.mozilla.org/en-US/docs/Marionette/Marionette_JavaScript_Tools) 
for more details about the intent of the project and where its going.

## Installing / Invoking tests


add marionette-js-runner and marionette-js-client to your project

```json
{
  "devDependencies": {
    "marionette-client": "...",
    "marionette-js-runner": "..."
  }
}
```

Invoke a marionette-mocha test

```sh
# from the root of your project (where your package.json is)
./node_modules/.bin/marionette-mocha path/to/test.js
```

See `marionette-mocha --help` for more docs on what it can do.

## Exposed APIs for wirting marionette tests

## `marionette` (suite/describe like a api)

The marionette function is a wrapper around mocha's suite/describe blocks.
They expose an additional field (a filter) which is an object which describes under which 
conditions a test may execute. 

The filter is matched vs metadata from the particular host (like firefox / b2g-desktop ) the test is running on.
[Example host metdata](https://github.com/mozilla-b2g/marionette-b2gdesktop-host/blob/105552c46f0e384627bce19b242f2de94e06c633/index.js#L33)

```js
// this always runs
marionette('I always run', function() {
});

// only runs on firefox
marionette('firefox only', { host: 'firefox' }, function() {
  test('only executed when host is firefox');
});

// executed when firefox is the host OR b2g-desktop
marionette('b2g desktop or firefox', { host: ['firefox', 'b2g-desktop'] }, function() {
  
});
```
