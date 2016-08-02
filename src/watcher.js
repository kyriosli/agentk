"use strict";

const cp = require('child_process'),
    fs = require('fs'),
    path = require('path');

function watch(dir, cb) {
    fs.watch(dir, cb);

    for (let name of fs.readdirSync(dir)) {
        let subpath = path.join(dir, name);
        if (fs.statSync(subpath).isDirectory()) {
            watch(subpath, cb);
        }
    }
}

exports.run = function (dir) {
    let worker, respawning, lastRespawn;
    const args = ['--harmony', path.resolve(__dirname, '../index.js'), 'run', dir],
        options = {
            stdio: 'inherit',
            env: require('util')._extend({
                properties: JSON.stringify(process.properties)
            }, process.env)
        };
    if (dir.slice(-3) === '.js') { // watch file
        console.log('\x1b[36mWATCHER\x1b[0m watching ' + dir);
        fs.watchFile(dir, onevent);
    } else {
        const isDir = dir.slice(-5) !== '.json',
            manifest_file = isDir ? path.resolve(dir, 'manifest.json') : dir,
            programDir = isDir ? dir : path.dirname(dir);
        const manifest = JSON.parse(fs.readFileSync(manifest_file));
        const main = path.resolve(programDir, manifest.main || 'index.js');
        const mSrc = /([\/\\])src\1/.exec(main);
        const srcDir = mSrc ? main.slice(0, mSrc.index + 4) : path.join(programDir, 'src');
        console.log('\x1b[36mWATCHER\x1b[0m watching ' + srcDir);
        watch(srcDir, onevent);
    }

    spawn();

    function onevent() {
        if (respawning) return;
        respawning = true;
        if (Date.now() - lastRespawn < 1000) {
            setTimeout(respawn, 1000);
        } else {
            setTimeout(respawn, 10);
        }
    }


    function respawn() {
        console.log('\x1b[36mWATCHER\x1b[0m respawning');
        try {
            worker.kill('SIGINT');
        } catch (e) {
        }
        setTimeout(spawn, 10);
    }

    function spawn() {
        lastRespawn = Date.now();
        respawning = false;
        worker = cp.spawn(process.execPath, args, options);
    }
};
