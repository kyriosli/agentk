"use strict";

Promise.prototype.done = function () {
    this.then(null, function (err) {
        console.error('ERROR', err.stack || err.message || err);
        process.exit(1);
    })
};

if (!process.properties) {
    process.properties = {};
    if (process.env.properties) {
        try {
            process.properties = JSON.parse(process.env.properties)
        } catch (e) {
        }
    }
}

require('./src/es6-module-loader');

exports.load = include;

exports.run = function (programDir) {
    let path = require('path');
    programDir = path.resolve(programDir);
    // read manifest
    let manifestFile;
    if (programDir.substr(-5) === '.json') {
        manifestFile = programDir;
        programDir = path.dirname(programDir)
    } else {
        manifestFile = path.join(programDir, 'manifest.json')
    }
    let manifest = global.manifest = JSON.parse(require('fs').readFileSync(manifestFile, 'utf8'));
    let main = path.resolve(programDir, manifest.main || 'index.js');
    // console.log('run', main, manifest);
    let workdir = programDir;
    if (manifest.directory) {
        workdir = path.resolve(programDir, manifest.directory);
    }
    process.chdir(workdir);

    let co = require('./src/co.js');
    if (process.send) {
        let nextSeq = 1;
        const waits = {};
        process.on('message', function (msg) {
            if (manifest.action && msg.action === 'trigger' && msg.cmd in manifest.action) {
                include(path.resolve(programDir, manifest.action[msg.cmd])).then(function (module) {
                    return co.run(module[msg.cmd])
                }).done();
            } else if (msg.ack) {
                let cb = waits[msg.ack];
                if (cb) {
                    cb[msg.state](msg.data); // resolve|reject
                    delete waits[msg.ack];
                }
            }
        });

        process.sendAndWait = function (mesg) {
            return co.promise(function (resolve, reject) {
                const seq = mesg.seq = nextSeq++;
                waits[seq] = [resolve, reject];
                process.send(mesg);
            })
        };
    }
    exports.load(main).done();
};

if (process.mainModule === module) {
    process.versions.agentk = require('./package.json').version;
    let target = process.argv[2], path = process.argv[3];

    if (target === 'run') {
        exports.run(path);
    } else if (target === 'load') {
        exports.load(require('path').resolve(path)).done();
    }
} else {
    process.mainModule = module;
}