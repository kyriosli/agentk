import route from '../src/route';
import {read} from '../src/module/file';

let it = new IntegrationTest('route', route);
const assert = require('assert'),
    assertEqual = assert.strictEqual;

it.test('get index', function () {
    let response = it.get('/');
    assertEqual(response.status, 200, 'bad response status');
    assertEqual(response.headers.get('content-type'), 'text/html', 'bad response content type');
});


it.test('404 catcher', function () {
    let response = it.get('/i.dont.exist');
    assertEqual(response.status, 404, 'bad response status');
    assertEqual(response.headers.get('content-type'), 'text/html', 'bad response content type');
    assertEqual(co.yield(response.text()),
        '<h1>Oops</h1><p>Something bad happened. <a href="javascript:history.back()">back</a></p>',
        'bad response content'
    );

});

it.test('static file handler', function () {
    let response = it.get('/static/index.css');
    assertEqual(response.status, 200, 'bad response status');
    assert(!Buffer.compare(co.yield(response.buffer()), read('static/index.css')), 'bad response content');
});


it.test('cookie handler', function () {
    let response = it.postForm('/step3', {name: 'foobar'});
    assertEqual(response.status, 302, 'bad response status');
    assertEqual(response.headers.get('Location'), '/step4', 'bad redirect location');
    assertEqual(response.headers.get('Set-Cookie'), 'name=foobar; path=/; expires=Thu, 31 Dec 2099 00:00:00 GMT', 'bad cookie');
});

it.test('calculator', function () {
    let response = it.request('/step3', {
        method: 'PUT',
        body: new Buffer('12+45')
    });
    assertEqual(response.status, 200, 'bad response status');
    assertEqual(response.headers.get('Content-Type'), 'application/json', 'bad response content type');
    assertEqual(co.yield(response.json()).result, 57, 'bad result');
});
