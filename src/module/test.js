import * as http from 'http';

let passed = 0, total = 0, ms = 0, files = 0, err = false;

const assert = require('assert'),
    ohttp = require('http'),
    ostream = require('stream'),
    ourl = require('url'),
    util = require('util');
/**
 * Run a test script
 * @param {string} file pathname of a test script file
 */
export function run(file) {
    files++;
    const start = process.hrtime();
    const lastTotal = total, lastPassed = passed;
    try {
        void include(file)[moduleDefault];
    } catch (e) {
        console.log(`\x1b[30;41m:(\x1b[0m \x1b[33m${file} \x1b[0m failed outside test case: ${e.stack || e.message || e}`);
        err = '\x1b[36m' + file + '\x1b[0m: \x1b[31m' + e + '\x1b[0m';
    }
    const end = process.hrtime(start), cost = end[0] * 1000 + end[1] / 1e6;

    console.log(`\x1b[36m${file} \x1b[32m${'.'.repeat(passed - lastPassed)}\x1b[31m${'.'.repeat(total - lastTotal - passed + lastPassed)} \x1b[0m (${cost.toFixed(2)}ms)\n`);
    ms += cost;
}


export class Test {
    /**
     * Unit test
     *
     * @param {name} name
     * @returns {Test}
     */
    constructor(name) {
        this.name = name;
    }

    test(title, cb) {
        total++;
        try {
            cb.call(this);
        } catch (e) {
            console.log(`\x1b[30;41m:(\x1b[0m \x1b[33m${this.name} \x1b[35m${title}\x1b[0m ${e.stack || e.message || e}`);
            return;
        }
        passed++;
        //console.log(`\x1b[30;42m:)\x1b[0m \x1b[33m${this.name} \x1b[35m${title}\x1b[0m`)
    }
}


export class IntegrationTest extends Test {
    /**
     * Integration test on a router handle that accepts a http request and returns a http response
     *
     * @param {string} name
     * @param {function|router::Router} handle
     * @returns {IntegrationTest}
     */
    constructor(name, handle) {
        super(name);
        this.handle = handle;
    }

    get(url, options) {
        options || (options = {});
        return this.request(url, options);
    }

    postForm(url, params, options) {
        options || (options = {});
        options.method = 'POST';
        let headers = options.headers || (options.headers = {});
        headers['Content-Type'] = 'application/x-www-form-urlencoded';
        options.body = new Buffer(http.buildQuery(params));
        return this.request(url, options);
    }

    request(url, options) {
        let parsed_url = ourl.parse(url, true);
        let req = new http.Request(url, options);
        req.originalUrl = options.url = parsed_url.path;
        req.request = options;

        return this.handle.apply(req, [req]);
    }
}

export function summary() {
    console.log(`\x1b[32m${passed}\x1b[0m/\x1b[33m${total}\x1b[0m tests in ${files} file(s). (${ms.toFixed(2)}ms)`);
    if (err) {
        console.log('\x1b[33mThere seems to be an error in ' + err);
    }
}