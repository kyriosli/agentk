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

    test().yield();
});

test.test('arguments', function () {
    async function foo(foo) {
        return await add(foo, 30)
    }

    assertEqual(foo(12).yield(), 42);

    async function foo2(...foo) {
        return await add(foo[0], foo[1])
    }

    assertEqual(foo2(12, 30).yield(), 42);
    async function foo3(foo, bar = 30) {
        return await add(foo, bar)
    }

    assertEqual(foo3(12).yield(), 42);
    assertEqual(foo3(12, 31).yield(), 43);
});


import * as math from 'module/math'

test.test('exported', function () {
    assertEqual(math.async_abs(-10).yield(), 10)
});

function add(a, b) {
    return new Promise(function (resolve) {
        setTimeout(function () {
            resolve(a + b)
        })
    })

}