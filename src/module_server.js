"use strict";

const zlib = require('zlib'), fs = require('fs');

let server = process.env.MODULE_SERVER;
if (!server) {
    let fs = require('fs'), configFile = require('path').join(process.env.HOME, '.agentk/config.json');
    if (fs.existsSync(configFile)) {
        try {
            server = JSON.parse(fs.readFileSync(configFile, 'utf8'))['module.server'];
        } catch (e) {
        }
    }
}
if (!server) {
    server = 'https://raw.githubusercontent.com/kyriosli/agentk-modules';
}

const parsedUrl = require('url').parse(server), http = require(parsedUrl.protocol.slice(0, -1));

exports.download = function (name) {
    let manifest = global.manifest,
        dependencies = manifest && manifest.dependencies;
    let shortname = name.substr(0, name.length - 3), version = 'master';
    if (dependencies && shortname in dependencies && dependencies[shortname] !== '*') {
        version = dependencies[name]
    }
    let suffix = '/' + version + '/' + name;
    return new Promise(function (resolve, reject) {
        http.request({
            method: 'GET',
            host: parsedUrl.hostname,
            port: parsedUrl.port,
            path: parsedUrl.pathname + suffix
        }, function (tres) {
            if (tres.statusCode !== 200) {
                return reject(new Error(suffix + ": bad response status: " + tres.statusCode));
            }
            if (tres.headers['content-encoding'] === 'gzip') {
                tres = tres.pipe(zlib.createGunzip());
            }
            let bufs = [], totalLen = 0;
            tres.on('data', function (chunk) {
                totalLen += chunk.length;
                bufs.push(chunk)
            }).on('end', function () {
                resolve(Buffer.concat(bufs, totalLen))
            }).on('error', reject)
        }).on('error', reject).end();
    })
};

var toCheck = [];

exports.checkedDownload = function (name) {
    return new Promise(function (resolve, reject) {
        if (toCheck.push({name: name, resolve: resolve, reject: reject}) === 1)
            checkInput();
    });
};


function checkInput() {
    process.stdin.resume();
    process.stdin.on('data', ondata);
    onCheck();

    function ondata(input) {
        input = input.toString();

        if (input === 'a\n' || input === 'A\n') {
            exports.checkedDownload = exports.download;
            toCheck.forEach(download);
            toCheck = null;
            return dispose();
        }

        if (input === '\n') {
            input = 'Y\n';
        }

        var checking = toCheck[0];
        if (input === 'y\n' || input === 'Y\n') {
            download(checking)
        } else if (input === 'n\n' || input === 'N\n') {
            checking.reject(new Error('module ' + checking.name + ' not found'))
        } else {
            return onCheck();
        }
        // next
        toCheck.shift();
        if (toCheck.length) {
            onCheck();
        } else {
            dispose();
        }
    }

    function download(checking) {
        exports.download(checking.name).then(checking.resolve, checking.reject)
    }

    function dispose() {
        process.stdin.removeListener('data', ondata);
        process.stdin.pause();
    }


    function onCheck() {
        process.stdout.write('\x1b[33mWARN\x1b[0m module \x1b[36m' + toCheck[0].name.slice(0, -3) + '\x1b[0m not found, try to download it from the git repository? [Y/n/a] ');
    }
}

exports.update = function (modules) {
    const co = require('./co');
    co.run(function () {
        let dependencies;
        try {
            dependencies = require(process.cwd() + '/../../manifest.json').dependencies
        } catch (e) {
        }
        if (!modules.length) {
            for (let file of fs.readdirSync('.')) {
                let m = /^(\w+)\.js$/.exec(file);
                if (!m) {
                    continue;
                }
                modules.push(m[1]);
            }
        }
        let maxLen = 0;
        for (let name of modules) {
            if (name.length > maxLen) maxLen = name.length;
        }

        let prefix = ' '.repeat(maxLen) + ' : ';

        let upToDates = [], upgraded = 0;

        for (let name of modules.sort()) {
            if (dependencies && name in dependencies && dependencies[name] !== '*') {
                // dependencies specifies particular version
                continue;
            }
            let file = name + '.js';
            let log_prefix = name + prefix.substr(name.length);
            let content;
            try {
                content = co.yield(exports.download(file));
            } catch (e) {
                process.stdout.write('\x1b[31m' + log_prefix + e.message + '\x1b[0m\n');
                continue
            }

            if (Buffer.compare(content, read(file)) === 0) {
                upToDates.push(name);
                continue
            }
            write(file, content);

            process.stdout.write('\x1b[36m' + log_prefix + 'updated\x1b[0m\n');
            upgraded++;
        }
        let tail = '\n' + upgraded + ' updated / ' + upToDates.length + ' up to date';
        if (upToDates.length) {
            tail += ':\n  \x1b[32m' + upToDates.join(' ') + '\x1b[0m\n'
        } else {
            tail += '.\n'
        }
        process.stdout.write(tail);


        function read(file) {
            return fs.readFileSync(file)
        }

        function write(file, content) {
            return fs.writeFileSync(file, content)
        }
    }).then(null, function (err) {
        throw err
    });
};