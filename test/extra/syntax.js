const assert = require('assert'), assertEqual = assert.equal;

// 测试运算符优先级
assertEqual((1 + 2) * 3, 9);
assertEqual(1 + (2 * 3), 7);
assertEqual(2 + 3 << 4, 80);
assertEqual(2 + (3 << 4), 50);

// 测试函数立即量
(function (s) {
    assertEqual(s, 1234);
    return;
    throw new Error('should not be here')
})(1234);

void function (t) {
    assertEqual(t, 2345)
}(2345);

// 测试return
assertEqual(function () {
    return 512 + 105 << 1
}(), 1234);

// 测试语法结构
(function () {
    function* test(x) {
        yield x * x;
        yield x, x + 1;
        yield (x, x + 1);
        yield x = 14;
        yield* [x];
    }

    const obj = test(12);
    assertEqual(obj.next().value, 144);
    assertEqual(obj.next().value, 12);
    assertEqual(obj.next().value, 13);
    assertEqual(obj.next().value, 14);
    assertEqual(obj.next().value, 14);


    // 测试if
    if (true) {
        assert.ok(true);
    } else {
        throw new Error('should not be here')
    }
    if (false) {
        throw new Error('should not be here')
    } else if (true) {
        assert.ok(true)
    } else {
        throw new Error('should not be here')
    }
    let i = 3, arr = [];
    while (i--) {
        arr.push(i);
    }
    for (i = 8; i > 5; i--) arr.push(i);
    assert.deepEqual(arr, [2, 1, 0, 8, 7, 6]);
    arr.length = 0;
    for (let j = 4; j--;) {
        arr.push(j * j);
    }
    assert.deepEqual(arr, [9, 4, 1, 0]);
    for (i of arr.splice(0, 4)) arr.push(i + 1);
    assert.deepEqual(arr, [10, 5, 2, 1]);

    i = 0;
    test: for (let j of arr) {
        i += j;
        continue test;
    }
    assertEqual(i, 18);

    do {
        i--;
    } while (i > 12);
    assertEqual(i, 12);

    switch (i) {
        case 12:
            break;
        default:
            throw new Error('should not be here')
    }

    assertEqual((i = 0) ? 1 : 2, 2);
    assertEqual(i, 0);

    // known bug on older node
    // assert.deepEqual((x=>({x}))(123), {x: 123});

    (function () {
    }).call();
    (function () {
    }), 0;
    (function () {
    }).name.length;
    (function () {
    }) + '' + '' + '';


    assertEqual(new (function () {
        return {
            x: function (x) {
                this.foo = x + 3
            }
        }
    }().x)(123).foo, 126);

    for (let key in {foo: 0}) {
        assert.strictEqual(key, 'foo');
        return;
    }
    throw new Error('should not be here')
})();

// 测试var
~function () {
    var x, y, z = 3, w = 4, u = z + w;
    assertEqual(u, 7);
    if (!x) {
        ~function () {
            const z = 4, w = 6, u = z * w;
            assertEqual(u, 24);
        }();
    } else {
        throw new Error('should not be here')
    }
}();

// 测试new
new function test() {
    assert.ok(this instanceof test);
};
assertEqual(new (function () {
    return function (xxx) {
        this.xxx = xxx;
    }
}())(123)['xxx'], 123);

// 测试字符串模板
assertEqual(
    `a${1 + 2} ${`` + 4}`,
    'a3 4'
);

// 测试class
class Test {
    base_foo(a) {
        return a + '; Test::base_foo@' + this.id
    }
}

class MyTest extends Test {
    constructor(id) {
        super(5678);
        this.id = id;
        this.X = 1234;
    }

    foo() {
        return this.constructor.className + '::' + super.base_foo('foo');
    }

    get abc() {
        return this.id << 1;
    }

    set abc(abc) {
        this.id = abc >> 1;
    }

    get [0]() {
        return (this.id + '')[0]
    }

    ['test' + (7 >> 1)]() {
        return 3
    }

    static get className() {
        return 'MyTest'
    }

    static getParentClass() {
        return this.prototype.__proto__.constructor;
    }
}

const test = new MyTest(1234);

assertEqual(test.foo(), 'MyTest::foo; Test::base_foo@1234');
assertEqual(test.abc, 2468);
test.abc = 48;
assertEqual(test[0], '2');
assertEqual(MyTest.getParentClass(), Test);
assertEqual(test.test3(), 3);

const Test2 = class extends Test {
    constructor(id) {
        super();
        this.id = id;
    }

    foo() {
        return 'anonymous::' + super.base_foo('foo');
    }
};

assertEqual(new Test2(33).foo(), 'anonymous::foo; Test::base_foo@33');

// 测试shorthand
assertEqual({test}.test.id, 24);
assertEqual({
    test() {
        return 1234
    }
}.test(), 1234);
assertEqual({
    "foo bar"() {
        return 1234
    }
}["foo bar"](), 1234);

// 测试立即量
//noinspection BadExpressionStatementJS
(function () {
    //noinspection BadExpressionStatementJS
    ({test})
});

// 测试rest
function withRest(a, b, ...c) {
    return c
}
assert.deepEqual(withRest(), []);
assert.deepEqual(withRest(1, 2, 3), [3]);

((a, ...b) => {
    assertEqual(b[1], 3)
})(1, 2, 3);

class WithRest {
    static a(...c) {
        return c[0] + c[1]
    }
}
assert.deepEqual(WithRest.a(1, 2), 3);

assertEqual(function (a, b = 1) {
}.length, 1);
assertEqual(function (a, b = 1, ...c) {
}.length, 1);
assertEqual(function (a, ...c) {
}.length, 1);

// 测试default
function withDefault(a, b = 1234, c = a + b) {
    return a * b + c;
}
assertEqual(withDefault(2), 3704);
assertEqual(withDefault(2, 3), 11);

function withRestAndDefault(a, b = 1234, ...c) {
    return a * b + c.length
}
assertEqual(withRestAndDefault(2), 2468);
assertEqual(withRestAndDefault(2, 3), 6);
assertEqual(withRestAndDefault(2, 3, 4), 7);

function restOneParam(...c) {
    return c
}
assertEqual(restOneParam(1234, 5678).join(), '1234,5678');


// 测试模块export
export {test, WithRest, withDefault as _withDefault}
export let y = 0, z = 1, w = 2;
export default function () {

}

// 测试模块import
import 'syntax.js';
import X, * as m1 from 'syntax.js';
import X2, {test as _test, y as _y} from 'syntax.js';

// export imported
export {_test}

setTimeout(function () {
    assertEqual(X, module[moduleDefault]);
    assertEqual(test.X, 1234);
    assertEqual(m1.z, z);
    m1.y = 4567;
    assertEqual(y, 4567);
    _y = 5678;
    assertEqual(m1.y, 5678);

    assertEqual(_test, test);

    // 解构赋值修改引入变量
    ({abc: _y}) = _test;
    assertEqual(y, test.abc)
});

// 测试表达式序列
w = (1 + 2, 3 + 4);
assertEqual(w, 7);

// 测试解构赋值
let abc, xyz;
({abc, xyz = 22}) = test;
assertEqual(abc, 48);
assertEqual(xyz, 22);
assert.deepEqual([abc] = ['abc'], ['abc']);
assertEqual(abc, 'abc');
({0: abc} = 'abc');
assertEqual(abc, 'a');
[{length: abc}] = 'def';
assertEqual(abc, 1);
[w, , abc] = 'def';
assertEqual(abc, 'f');
[w, ...abc] = [0, 1, 2, 3];
assert.deepEqual(abc, [1, 2, 3]);
[test.abc] = [34];
assertEqual(test.id, 17);


for (let {y, z:[b, a, r = 'z', ...rest]} of [{y: 'foo', z: 'bar###'}])
    assertEqual(y + b + a + r + rest, 'foobar#,#,#');

(function () {
    let {0: d, 1: e, 2: f, length} = 'DEF', g = 'G';
    assert.deepEqual({d, e, f, g, length}, {d: 'D', e: 'E', f: 'F', g: 'G', length: 3});
    return d + e + f;
})();

(function ({0: a, 1: b}, [c, d] = 'cd') {
    assertEqual(a, 'a');
    assertEqual(b, 'b');
    assertEqual(c, 'c');
    assertEqual(d, 'd');
})('ab');

(function ({0: a, 1: b}, [c, d] = 'cd') {
    assertEqual(a, 'a');
    assertEqual(b, 'b');
    assertEqual(c, 'C');
    assertEqual(d, 'D');
})('ab', 'CD');

(function ({a = 1}) {
    assertEqual(a, 1);
})({});

(function ({a = 1}) {
    assertEqual(a, 2);
})({a: 2});

(function ({a = 1} = {a: 3}) {
    assertEqual(a, 3);
})();

// 测试箭头函数
const arrow = x => {
    return x + 1
};
assertEqual(arrow(12), 13);
assertEqual((() => {
    return 13
})(), 13);
assertEqual(((a, b, c) => {
}).length, 3);
assertEqual((x => x + 1)(13), 14);
assertEqual(((x = 14) => x + 1)(), 15);
assertEqual(((a, b = 2, c = a + b) => a * b - c)(3), 1);
assertEqual((({x}) => x + 1)({x: 15}), 16);
assertEqual((({x} = {x: 16}) => x + 1)(), 17);
assertEqual((([x = 17]) => x + 1)([]), 18);
assertEqual((([x, , ...y]) => x + y[2])([1, 2, 3, 4, 5]), 6);

(function () {
    let {a, b, c:{d}, e:[f, {g}]} = {
        a: 1, b: 2, c: {d: 3}, e: [4, {g: 5}]
    };

    let [h,{i, j:k}] = [6, {i: 7, j: 8}];
    assert.deepEqual([a, b, d, f, g, h, i, k], [1, 2, 3, 4, 5, 6, 7, 8]);
    a = {};
    [a.b, , b] = 'foo bar baz'.split(' ');
    ({bar: a.c} = {bar: 'bar'});

    assert.deepEqual({a, b}, {a: {b: 'foo', c: 'bar'}, b: 'baz'});
    let [l,,m] = [3, 4, 5];
    assert.deepEqual([l, m], [3, 5]);

    var test = 'foo';
    var {[test]: foo} = {foo: 'bar'}, abcd = test + foo;
    assertEqual(abcd, 'foobar');

    for (let {z} of [{z: 0}]) {
        assertEqual(z, 0);
    }
    for (let {z} of [{z: 1}]) assertEqual(z, 1);
    for (let {z = 2} of [{}]) assertEqual(z, 2);

    // yet not supported:


    //try {
    //    throw new Error();
    //} catch({stack}) {
    //
    //}
})();