var fs = require('fs');

global.assert = require('assert');

function spawnMocha(argv) {
  var mocha = __dirname + '/../node_modules/.bin/mocha';
  var spawn = require('child_process').spawn;
  return child = spawn(mocha, argv);
}

global.spawnMocha = spawnMocha;
