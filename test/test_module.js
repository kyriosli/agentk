import * as math from 'module/math';
import getDay from 'module/day';

const assert = require('assert'), assertEqual = assert.strictEqual;

let test = new Test("math");
test.test("abs", function () {
    assertEqual(math.abs(1), 1);
    assertEqual(math.abs(0), 0);
    assertEqual(math.abs(-1), 1);
    assert(Object.is(math.abs(NaN), NaN));
});

test = new IntegrationTest('http handle', getDay);

test.test('get', function () {
    let response = test.get('/');
    assertEqual(response.status, 200, 'bad response status');
    assertEqual(co.yield(response.text()), '' + new Date().getDay(), 'bad response content');
});
