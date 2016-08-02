"use strict";
var _http = require('http'),
    _url = require('url'),
    _query = require('querystring'),
    _extend = require('util')._extend;

if (process.argv.length === 2) {
    console.log('usage: node press.js {config_file.json}');
    process.exit(1);
}

var config = JSON.parse(require('fs').readFileSync(process.argv[2]));

var conns = config.conn || 100,
    qps = config.qps || 1000,
    running = 0;
var queries = config.requests;
var defaults = config.defaults;

queries.forEach(function (obj, i) {
    var url;
    if (typeof obj === 'string') {
        url = obj;
        obj = queries[i] = _extend({}, defaults)
    } else {
        _extend(obj, defaults);
        url = obj.url;
    }
    if (url) {
        var parsed = _url.parse(url);
        obj.host = parsed.hostname;
        obj.port = parsed.port || 80;
        obj.path = parsed.path;
    }

    if (obj.data) {
        obj.data = new Buffer(typeof obj.data === 'string' ? obj.data
                : obj.dataType === 'json' ? JSON.stringify(obj.data)
                : _query.stringify(obj.data)
        );
    }
});

process.stdout.write(
    '\x1b[32;1m< conn -= 10  \x1b[35m[ qps -= 10  \x1b[33mc clear\x1b[0m\n' +
    '\x1b[32;1m> conn += 10  \x1b[35m] qps += 10  \x1b[31mq exit\x1b[0m\n' + '' +
    '\x1b[36;1mtime elapsed\x1b[32m conn\x1b[35m qps(avg curr  max)\x1b[34m wait(min curr max)\x1b[32m     OKs\x1b[31m Error\x1b[0m Recv (MB)\n\x1b[s');

var agent = _http.globalAgent;

agent.maxSockets = 4096;

var sec, reqs, oks, errors, bytesRecv, statusCodes, statusMap, stats, maxqps, start, startSec, delays, minDelay, maxDelay;
clear();

var pending = null;

function run() {
    if (pending) return;
    while (running < conns) {
        var timeStart = Date.now();
        var nowSec = timeStart / 1000 | 0;
        if (sec === nowSec && reqs >= qps) { // qps drain
            return ondrain();
        }

        if (sec !== nowSec) {
            if (reqs > maxqps) maxqps = reqs;

            var secs = nowSec - startSec;

            var msg = '\x1b[u\x1b[36;1m' + align(secs / 86400 | 0, 2) + 'd ' + new Date(secs * 1000).toJSON().substr(11, 8)
                + '\x1b[32m' + align(conns, 5)
                + '\x1b[35m' + align((oks * 1000 / ( timeStart - start)).toFixed(2), 8) + align(reqs, 5) + align(maxqps, 5)
                + ' \x1b[34m' + align(minDelay | 0, 6) + align(delays / reqs | 0, 6) + align(maxDelay, 6)
                + ' \x1b[32m' + align(oks, 8)
                + '\x1b[31m' + align(errors, 6)
                + '\x1b[0m' + align(bytesRecv / 1048576 | 0, 9);

            process.stdout.write(msg);
            sec = nowSec;
            reqs = 0;
            delays = 0;
        }
        running++;
        reqs++;
        var q = queries[Math.random() * queries.length | 0];
        var req = _http.request(q, onres).on('error', onerror);
        req.timeStart = timeStart;
        req.end(q.data);
    }
}

function align(num, n) {
    var tmp = num + '';
    return '                '.substr(tmp.length - n + 16) + tmp;
}

run();

function ondrain() {
    pending = setTimeout(function () {
        pending = null;
        run();
    }, 1000 - Date.now() % 1000);
}

function onres(tres) {
    var delay = Date.now() - this.timeStart;
    delays += delay;
    if (delay > maxDelay) maxDelay = delay;
    if (delay < minDelay) minDelay = delay;
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

function clear() {
    reqs = sec = oks = errors = bytesRecv = 0;
    maxqps = maxDelay = -1;
    minDelay = Infinity;
    delays = 0;
    statusCodes = [];
    statusMap = {};
    stats = new Uint32Array(600);
    start = Date.now();
    startSec = start / 1000 | 0;
}

process.stdin.resume();
process.stdin.setRawMode(true);
process.stdin.on('data', function (data) {
    switch (data[0]) {
        case 0x63: // c
            clear();
            break;
        case 0x71: // q
            process.stdout.write('\n\n\n');
            process.exit(0);
            break;
        case 0x2c: // ,
        case 0x3C: // <
            if (conns > 10) {
                conns -= 10;
            } else {
                conns = 1;
            }
            break;
        case 0x2E: // .
        case 0x3E: // >
            if (conns < 10) {
                conns = 10;
            } else {
                conns += 10;
            }
            run();
            break;
        case 0x5B:// [
            qps -= 10;
            break;
        case 0x5D:
            qps += 10;
            break;
    }

});

