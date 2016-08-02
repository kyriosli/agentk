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

const parsedUrl = require('url').parse(server), http = require(parsedUrl.protocol === 'https:' ? 'https' : 'http');

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
                return reject(new Error(suffix + ": file not found on remote server"));
            }
            let bufs = [], totalLen = 0;
            if (tres.headers['content-encoding'] === 'gzip') {
                tres = tres.pipe(zlib.createGunzip());
            }
            tres.on('data', function (chunk) {
                totalLen += chunk.length;
                bufs.push(chunk)
            }).on('end', function (argument) {
                let result = Buffer.concat(bufs, totalLen);
                resolve(result)
            }).on('error', reject)
        }).on('error', reject).end();
    })
};

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