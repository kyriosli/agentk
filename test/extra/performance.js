"use strict";
var http = require('http');

var maxConn = (process.argv[4] | 0) || 100, running = 0;
console.log('< or >: adjust conns; q: exit');

var agent = http.globalAgent;

agent.maxSockets = 4096;

var options = {
    method: 'GET',
    host: '127.0.0.1',
    port: process.env.server_port || '80',
    path: process.env.server_path || '/',
    agent: agent
};

var sec = 0;
var reqs = 0;
var oks = 0;
var errors = 0;
var bytesRecv = 0;
var statusCodes = [];
var statusMap = {};
var stats = new Uint32Array(600);
var maxqps = -1;
var start = Date.now(), startSec = start / 1000 | 0;
function run() {
    while (running < maxConn) {
        running++;
        reqs++;
        var now = Date.now() / 1000 | 0;
        if (sec !== now) {
            if (reqs > maxqps) maxqps = reqs;

            var msg = '\x1b[s ' + reqs + ' q/s (' + maxqps + ' max, ' + (oks * 1000 / (Date.now() - start)).toFixed(2) + ' avg) ' +
                (now - startSec) + 's elapsed ' + maxConn + ' conns, ' + oks + ' oks( ';
            for (var key in statusMap) {
                msg += key + ':' + stats[+key] + ' ';
            }
            msg += ') ' + errors + ' errors, ' + (bytesRecv / 1048576 | 0) + ' MB recv \x1b[u';
            process.stdout.write(msg);
            sec = now;
            reqs = 0;
        }
        http.request(options, onres).on('error', onerror).end();
    }
}

run();

function onres(tres) {
    oks++;
    statusMap[tres.statusCode] = true;
    stats[tres.statusCode]++;
    tres.on('data', function (data) {
        bytesRecv += data.length
    }).on('end', function () {
        running--;
        run();
    })
}

function onerror() {
    errors++;
    running--;
    run();
}

process.stdin.resume();
process.stdin.setRawMode(true);
process.stdin.on('data', function (data) {
    if (data[0] === 0x71) {
        process.stdout.write('\n');
        process.exit(0)
    } else if (data[0] === 44) { // --
        if (maxConn > 10) {
            maxConn -= 10;
        } else {
            maxConn = 0;
        }
    } else if (data[0] === 46) { // ++
        maxConn += 10;
        run();
    }
});

