/**
 * Channel can be used for cross process communication, in two modes:
 *
 *   - provider and query mode: a process can query all pairs for a data, with a channel name
 *   - dispatcher and listener mode: a process can dispatch a message to all pairs, with a channel name
 *
 * @example
 *
 *  import * as channel from 'module/channel'
 *
 *  // register a provider named get_pid
 *  channel.registerProvider('get_pid', function () {
 *      return process.pid
 *  });
 *
 *  // register a listener named notify
 *  channel.registerListener('notify', function (data) {
 *      console.log('received notify', data)
 *  });
 *
 *  setInterval(function () {
 *    co.run(function () {
 *      // call provider get_pid on every worker
 *      console.log(process.pid, channel.query('get_pid'));
 *      // call listener notify on every worker
 *      channel.dispatch('notify', Math.random())
 *    }).done();
 *  }, 3000);
 *
 * @title cross process message gathering and dispatching system
 */


const isSlave = !!process.send;
const providers = {}; // ch=>cb
const listeners = {}; // ch=>cb

if (isSlave) { // ipc enabled
    process.send({action: 'setup', module: 'channel'});
    process.on('message', onMasterMessage)
}


/**
 * register a provider that will be called when [query](#query) method  is called with the same `channel` argument.
 *
 * `cb` is called inside coroutine if `direct` is set to false
 *
 * @param {string} channel channel name to be queried
 * @param {function} cb callback method to get the data
 * @param {boolean} [direct] whether cb should run directly or inside coroutine, default to false
 */
export function registerProvider(channel, cb, direct) {
    providers[channel] = [cb, !!direct];
}

/**
 * register a listener named `channel` to be notified by [dispatch](#dispatch) method
 *
 * `cb` is called outside coroutine
 *
 * @param {string} ch channel name that listens to
 * @param {function} cb callback method receive the dispatched data
 */
export function registerListener(ch, cb) {
    if (ch in listeners) {
        let curr = listeners[ch];
        if ('push' in curr) {
            curr.push(cb);
        } else {
            const callbacks = [curr, cb];
            let L = 2;

            const dispatcher = listeners[ch] = function dispatcher() {
                for (let i = 0; i < L; i++) {
                    callbacks[i].apply(this, arguments);
                }
            };
            dispatcher.push = function (cb) {
                callbacks[L++] = cb;
                return L;
            };
        }
    } else {
        listeners[ch] = cb;
    }
}

let nextSeq = 1;

/**
 * query all workers that has registered a provider named `channel` by [registerProvider](#registerProvider) method,
 * and return the results as an array
 *
 * @param {string} channel channel name to be queried
 * @returns {Array.<any>} all results returned
 */
export function query(channel) {
    let results = isSlave ? process.sendAndWait({
        action: 'channel',
        cmd: 'query',
        channel: channel
    }) : [];
    if (channel in providers) {
        results.push(providers[channel][0]());
    }
    return results;
}

/**
 * dispatch a message to all workers which has registered a listener with the same name `channel` by [registerListener](#registerListener).
 *
 * @param {string} channel channel to be dispatched
 * @param [data] extra message data to be dispatched, must be json serializable
 */
export function dispatch(channel, data) {
    if (isSlave) {
        process.send({
            action: 'channel',
            cmd: 'dispatch',
            channel,
            data
        })
    }
    if (channel in listeners) {
        listeners[channel](data);
    }
}

const waitingQueries = {};

/**
 *
 * @private
 */
export function onMessage(mesg) {
    // outside fiber
    let cmd = mesg.cmd;
    if (cmd === 'query') {
        const worker = this;
        const results = [], seq = mesg.seq = nextSeq++;
        // send to all pairs
        let waiting = dispatchToPairs(worker, mesg);

        // no pairs waited
        if (!waiting) {
            return results;
        }
        return co.promise(function (resolve) {
            // wait for pairs
            const timer = setTimeout(respond, 400);
            waitingQueries[seq] = function (mesg) {
                if (mesg.status === 0) results.push(mesg.result);
                if (!--waiting) {
                    clearTimeout(timer);
                    respond();
                }
            };
            function respond() {
                delete waitingQueries[seq];
                resolve(results);
            }
        });
    } else if (cmd === 'queryback') {
        let cb = waitingQueries[mesg.ack];
        cb && cb(mesg);
    } else if (cmd === 'dispatch') {
        dispatchToPairs(this, mesg);
    }
}

function dispatchToPairs(worker, mesg) {
    let dispatched = 0;
    for (let pair of worker.program.workers) {
        if (pair !== worker) {
            try {
                pair && pair.send(mesg);
                dispatched++;
            } catch (e) {
                console.error('channel.js::Master::dispatch: pair shutdown');
            }
        }
    }
    return dispatched;
}

function onMasterMessage(mesg) {
    if (!mesg || mesg.action !== 'channel') return;
    let cmd = mesg.cmd;
    if (cmd === 'query') {
        let ch = mesg.channel, resp = {
            action: 'channel',
            cmd: 'queryback',
            status: 1,
            ack: mesg.seq
        };
        if (ch in providers) {
            let provider = providers[ch];
            if (provider[1]) { // directly
                resp.status = 0;
                resp.result = provider[0]();
                process.send(resp);
            } else { // inside coroutine
                co.run(provider[0]).then(function (result) { // success
                    resp.status = 0;
                    resp.result = result;
                    process.send(resp);
                }, function () { // failed
                    process.send(resp);
                });
            }
        } else {
            process.send(resp);
        }
    } else if (cmd === 'dispatch') {
        let ch = mesg.channel;
        if (ch in listeners) {
            listeners[ch](mesg.data);
        }
    }
}
