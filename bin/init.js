"use strict";

let fs = require('fs'),
    path = require('path'),
    cp = require('child_process');

if (fs.readdirSync('.').length) {
    console.error('[FAIL] directory not empty, exiting...');
    process.exit(1);
}

let dir = path.join(__dirname, '../demo');
cp.execSync('cp -R ' + dir + '/* .', {
    stdio: 'inherit'
});

console.log('\n[OK] The project has been generated.');

let dependencies = JSON.parse(fs.readFileSync('package.json', 'utf8')).dependencies;
if (dependencies) {
    console.log(' * run `npm install .` to install the dependencies');
}
console.log(' * run `ak run` and visit http://localhost:' + JSON.parse(fs.readFileSync('manifest.json')).config.port);
console.log(' * run `ak test` to test the project');