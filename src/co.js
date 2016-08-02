"use strict";

let Fiber = require('fibers');

exports.Fiber = Fiber;

exports.yield = function (result) {
    if (result instanceof Promise)
        return Fiber.yield(result);
    if (result instanceof Array && result.length && result[0] instanceof Promise) {
        return Fiber.yield(Promise.all(result))
    }

    return result;
};

const $slice = Array.prototype.slice;

exports.run = function (cb, arg) {
    return runIterator(fiber_to_iterator(cb, this, $slice.call(arguments, 1)));
};

exports.wrap = function (cb) {
    return function runFiber() {
        return runIterator(fiber_to_iterator(cb, this, arguments))
    }
};

exports.runIterator = runIterator;

exports.promise = function (cb) {
    return Fiber.yield(new Promise(cb));
};

exports.sync = function (fun) {
    let args = arguments;
    return exports.promise(function (resolve, reject) {
        if (args.length === 1) {
            fun(cb)
        } else if (args.length === 2) {
            fun(args[1], cb)
        } else if (args.length === 3) {
            fun(args[1], args[2], cb)
        } else {
            let arr = Array.prototype.slice.call(args, 1);
            arr.push(cb);
            fun.apply(null, arr)
        }
        function cb(err, result) {
            if (err) reject(err);
            else resolve(result)
        }
    });
};

exports.sleep = function (timeout) {
    Fiber.yield(new Promise(function (resolve) {
        setTimeout(resolve, timeout);
    }))
};

const resourceSets = new WeakMap();

exports.addResource = function (obj) {
    let fiber = Fiber.current,
        resources = fiber.resources || (fiber.resources = new Set());
    resourceSets.set(obj, resources);
    resources.add(obj);
};

exports.removeResource = function (obj) {
    let resources = resourceSets.get(obj);
    if (resources) {
        resources.delete(obj);
        resourceSets.delete(obj);
    }
};


function fiber_to_iterator(cb, self, args) {
    let fiber = new Fiber(function () {
        try {
            return cb.apply(self, args);
        } finally {
            fiber = null
        }
    });
    return {
        next: function (arg) {
            return makeResult(fiber.run(arg));
        }, throw: function (err) {
            return makeResult(fiber.throwInto(err))
        }
    };

    function makeResult(result) {
        return {done: !fiber, value: result}
    }
}

function cleanup(fiber) { // cleanup
    let resources = fiber.resources;
    if (resources) {
        fiber.resources = null;
        for (let handle of resources) {
            handle._close();
        }
    }
}

function runIterator(iterator) {
    return new Promise(function (resolve, reject) {
        sched();

        function sched(args) {
            let result;
            try {
                result = iterator.next(args);
            } catch (e) {
                cleanup(iterator);
                return reject(e);
            }
            onresult(result);
        }

        function onerr(err) {
            let result;
            try {
                result = iterator.throw(err);
            } catch (e) {
                cleanup(iterator);
                return reject(e);
            }
            onresult(result);
        }

        function onresult(result) {
            if (result.done) {
                cleanup(iterator);
                resolve(result.value);
                return;
            }
            result.value.then(sched, onerr);
        }
    });
}