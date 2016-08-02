const assert = require('assert'), assertEqual = assert.strictEqual;
let test = new Test("async");


test.test('async', function () {
    async function foo(foo) {
    }

    assert(foo() instanceof Promise);
    assert((async function () {
        })() instanceof Promise
    );
});

test.test('await', function () {
    async function test() {
        assertEqual(await add(12, 30), 42);
        assertEqual(await new Promise(function (resolve) {
            setTimeout(resolve, 0, 1234)
        }), 1234)
    }

    co.yield(test());
});

test.test('arguments', function () {
    async function foo(foo) {
        return await add(foo, 30)
    }

    assertEqual(co.yield(foo(12)), 42);

    async function foo2(...foo) {
        return await add(foo[0], foo[1])
    }

    assertEqual(co.yield(foo2(12, 30)), 42);
    async function foo3(foo, bar = 30) {
        return await add(foo, bar)
    }

    assertEqual(co.yield(foo3(12)), 42);
    assertEqual(co.yield(foo3(12, 31)), 43);
});


import * as math from 'module/math'

test.test('exported', function () {
    assertEqual(co.yield(math.async_abs(-10)), 10)
});

function add(a, b) {
    return new Promise(function (resolve) {
        setTimeout(function () {
            resolve(a + b)
        })
    })

}