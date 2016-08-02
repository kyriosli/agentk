/**
 * Wrapper for http server/client API.
 *
 * @author kyrios
 */

const ohttp = require('http'),
    ohttps = require('https'),
    ourl = require('url'),
    ofs = require('fs'),
    ozlib = require('zlib'),
    oquerystring = require('querystring');

const $slice = [].slice;

/**
 *
 * @param {Headers} headers
 * @param {Function} cb
 */
function* headersIterator(headers, cb) {
    let entries = headers._entries;
    for (let key in entries) {
        let entry = entries[key], name = entry.name;
        for (let i = 0, L = entry.length; i < L; i++) {
            yield cb(entry[i], name);
        }
    }
}

function Empty() {
}
Empty.prototype = Object.create(null);

export class Headers {
    /**
     * Headers represents a set of name-value pairs which will be used in:
     *  - client request object
     *  - remote server response
     *  - server request event
     *
     * @param {object} [headers] initial name-value map of headers
     */
    constructor(headers) {
        this._entries = new Empty();

        if (headers && typeof headers === 'object') {
            for (let name in headers) {
                this.append(name, headers[name]);
            }
        }
    }

    /**
     * Appends an entry to the object.
     *
     * @param {string} name
     * @param {string} value
     */
    append(name, value) {
        name = '' + name;
        let key = name.toLowerCase(), entry = this._entries[key];
        if (entry) {
            entry[entry.length++] = '' + value;
        } else {
            this._entries[key] = {name, 0: '' + value, length: 1};
        }
    }

    /**
     * Sets a header to the object.
     *
     * @param {string} name
     * @param {string} value
     */
    set(name, value) {
        name = '' + name;
        this._entries[name.toLowerCase()] = {name, 0: '' + value, length: 1};
    }

    /**
     * Deletes all headers named `name`
     *
     * @param {string} name
     */
    ["delete"](name) {
        let key = ('' + name).toLowerCase();
        if (key in this._entries) {
            delete this._entries[key]
        }
    }


    /**
     * cb will be called with 3 arguments: value, name, and this Headers object
     *
     * @param {function} cb
     */
    forEach(cb) {
        let entries = this._entries;
        for (let key in entries) {
            let entry = entries[key], name = entry.name;
            for (let i = 0, L = entry.length; i < L; i++) {
                cb(entry[i], name, this);
            }
        }
    }

    /**
     * Returns the value of an entry of this object, or null if none exists.
     *
     * The first will be returned if multiple entries were found.
     *
     * @param {string} name
     * @returns {null|string}
     */
    get(name) {
        let entry = this._entries[('' + name).toLowerCase()];
        return entry ? entry[0] : null;
    }

    /**
     * Returns All values of this object with the name
     *
     * @param {string} name
     * @returns {Array}
     */
    getAll(name) {
        let entry = this._entries[('' + name).toLowerCase()];
        return entry ? $slice.call(entry) : [];
    }

    /**
     * Returns whether an entry of the name exists
     *
     * @param {string} name
     * @returns {boolean}
     */
    has(name) {
        let key = ('' + name).toLowerCase();
        return key in this._entries;
    }

    /**
     * Returns an iterator that yields name-value pair of all entries
     *
     * @returns {Iterator.<[string,string]>}
     */
    entries() {
        return headersIterator(this, (val, key) => [key, val])
    }

    /**
     * Returns an iterator that yields names of all entries
     *
     * @returns {Iterator.<string>}
     */
    keys() {
        return headersIterator(this, (val, key) => key)
    }

    /**
     * Returns an iterator that yields values of all entries
     *
     * @returns {Iterator.<string>}
     */
    values() {
        return headersIterator(this, String)
    }

    /**
     * Returns an iterator that yields name-value pair of all entries
     *
     * @returns {Iterator}
     */
    [Symbol.iterator]() {
        return this.entries()
    }
}

const stream_Readable = require('stream').Readable;
const _empty = new Buffer(0);

Buffer.alloc || include('buffer_polyfill');

/**
 * Abstract class for http request/response entity
 *
 */
export class Body {
    /**
     *
     * @param {string|Buffer|ArrayBuffer|node.stream.stream.Readable} body
     */
    constructor(body) {
        let buf = null, stream = null;
        if (!body) {
            buf = Buffer.allocUnsafe(0)
        } else if (body instanceof stream_Readable) {
            stream = body;
        } else {
            buf = Buffer.from(body)
        }
        this._stream = stream;
        this._buffer = buf;
        this._payload = null;

    }

    /**
     *
     * @returns {Promise.<string>} a promise that yields the request payload as a string
     */
    text() {
        return this.buffer().then(buf => buf.toString())
    }

    /**
     *
     * @returns {Promise} a promise that yields the request payload as a JSON object
     */
    json() {
        return this.buffer().then(JSON.parse)
    }

    /**
     *
     * @returns {Promise.<ArrayBuffer>} a promise that yields the request payload as an ArrayBuffer
     */
    arrayBuffer() {
        return this.buffer().then(buf => new Uint8Array(buf).buffer)
    }

    /**
     *
     * @returns {Promise.<Buffer>} a promise that yields the request payload as a Buffer
     */
    buffer() {
        if (!this._payload) {
            if (this._buffer) {
                // construct payload from buffer
                const enc = this.headers && this.headers.get('content-encoding');

                if (enc) {
                    let stream;
                    if (enc === 'gzip') {
                        stream = ozlib.createGunzip();
                    } else if (enc === 'deflate') {
                        stream = ozlib.createInflateRaw();
                    } else {
                        throw new Error('unsupported enc type ' + enc)
                    }
                    stream.end(this._buffer);
                    this._buffer = null;
                    this.headers.delete('content-encoding');
                    this._payload = read_stream(this, stream);
                } else {
                    this._payload = Promise.resolve(this._buffer)
                }
            } else {
                // start stream reading
                void this.stream;
            }
        }
        return this._payload;
    }

    /**
     *
     * @returns {node.stream.stream.Readable} a readable stream
     */
    get stream() {
        let stream = this._stream;
        if (stream) { // start stream reading
            this._stream = null;
            const enc = this.headers && this.headers.get('content-encoding');
            if (enc) {
                if (enc === 'gzip') {
                    stream = stream.pipe(ozlib.createGunzip())
                } else if (enc === 'deflate') {
                    stream = stream.pipe(ozlib.createInflateRaw());
                } else {
                    throw new Error('unsupported enc type ' + enc)
                }
                this.headers.delete('content-encoding');
            }
            this._payload = read_stream(this, stream);
        } else {
            let buffer = this._buffer, payload = this._payload;
            stream = new stream_Readable();
            stream._read = function () {
                stream._read = Boolean;
                if (buffer) {
                    onBuffer(buffer)
                } else {
                    payload.then(onBuffer)
                }

                function onBuffer(buf) {
                    stream.push(buf);
                    stream.push(null);
                }
            };
        }

        return stream;
    }
}

function read_stream(self, stream) {
    return new Promise(function (resolve, reject) {
        let bufs = [], totalLen = 0;
        stream.on('data', function (buf) {
            totalLen += buf.length;
            bufs.push(buf)
        }).once('end', function () {
            resolve(self._buffer = Buffer.concat(bufs, totalLen))
        }).once('error', reject)
    })
}

/**
 * A `Request` is an representation of a client request that will be sent to a remote server, or a server request
 * that received from the remote client.
 */
export class Request extends Body {
    /**
     *
     * @example
     *     // a normal request
     *     new http.Request('http://www.example.com/test?foo=bar')
     *     // a post request
     *     new http.Request('...', {
     *       method: 'POST',
     *       body: http.buildQuery({foo: 'bar'}),
     *       headers: {'content-type': 'application/x-www-form-urlencoded'}
     *     })
     *     // request to a unix domain socket
     *     new http.Request('unix:///foo/bar?test=foobar')
     *     // the server path is '/foo/bar' and the request url is '/?test=foobar'
     *
     * @param {string} url a remote url
     * @param {object} [options] optional arguments, which contains any of:
     *
     *   - method `String`: request method, e.g., "GET" or "POST"
     *   - headers `object|Headers` request headers
     *   - body `string|Buffer|ArrayBuffer|node.stream::stream.Readable` request payload to be sent or received
     *
     */
    constructor(url, options) {
        if (options && typeof options !== 'object') options = null;
        super(options && options.body);

        this._url = url;
        this.method = options && 'method' in options ? '' + options['method'] : 'GET';
        this._headers = options && 'headers' in options && typeof options.headers === 'object' ?
            options.headers instanceof Headers ? options.headers : new Headers(options.headers) : new Headers();
    }

    /**
     *
     * @returns {string} request uri, like `"http://www.example.com/test?foo=bar"`
     */
    get url() {
        return this.hasOwnProperty('host') ? this.scheme + '//' + this.host + this.pathname + (this.search || '') : this._url
    }

    /**
     *
     * @returns {Headers} request headers
     */
    get headers() {
        return this._headers
    }

    //noinspection InfiniteRecursionJS
    /**
     * @returns {String} request scheme, like `"http:"`
     */
    get scheme() {
        parseUrl(this);
        return this.scheme;
    }

    //noinspection InfiniteRecursionJS
    /**
     * @param {String} scheme
     */
    set scheme(scheme) {
        parseUrl(this);
        this.scheme = scheme;
    }

    //noinspection InfiniteRecursionJS
    /**
     * @returns {String} request host, like `"www.example.com:80"`
     */
    get host() {
        parseUrl(this);
        return this.host;
    }

    //noinspection InfiniteRecursionJS
    /**
     * @param {String} host
     */
    set host(host) {
        parseUrl(this);
        this.host = host;
    }

    //noinspection InfiniteRecursionJS
    /**
     * @returns {String} request hostname, like `"www.example.com"`
     */
    get hostname() {
        parseUrl(this);
        return this.hostname;
    }

    //noinspection InfiniteRecursionJS
    /**
     * @returns {String} request port, like `"80"`
     */
    get port() {
        parseUrl(this);
        return this.port;
    }

    //noinspection InfiniteRecursionJS
    /**
     * @returns {String} request pathname, like `"/test"`
     */
    get pathname() {
        parseUrl(this);
        return this.pathname
    }

    //noinspection InfiniteRecursionJS
    get originalPathname() {
        parseUrl(this);
        return this.originalPathname
    }

    //noinspection InfiniteRecursionJS
    /**
     * @param {String} pathname
     */
    set pathname(pathname) {
        parseUrl(this); // call parseUrl in case that current pathname is overwritten
        this.pathname = pathname;
    }

    //noinspection InfiniteRecursionJS
    /**
     * @returns {String} request search string, like `"?foo=bar"`
     */
    get search() {
        parseUrl(this);
        return this.search
    }

    //noinspection InfiniteRecursionJS
    /**
     * @param {String} search
     */
    set search(search) {
        parseUrl(this); // call parseUrl in case that current search is overwritten
        this.search = search;
    }

    //noinspection InfiniteRecursionJS
    /**
     * @returns {object} request query key-value map, like `{foo:"bar"}`
     */
    get query() {
        parseUrl(this);
        return this.query
    }

    //noinspection InfiniteRecursionJS
    /**
     * @returns {object} request cookies
     */
    get cookies() {
        let cookie = this._headers.get('cookie'),
            cookies = {};
        if (cookie) {
            let reg = /(\w+)=(.*?)(?:; |$)/g, m;
            while (m = reg.exec(cookie)) {
                cookies[m[1]] = m[2];
            }
        }
        Object.defineProperty(this, 'cookies', {value: cookies});
        return cookies;
    }

}

export class Response extends Body {
    /**
     * A `Response` is an representation of a server response that will be sent to a remote client, or a client response
     * that received from the remote server.
     *
     * Additional fields can be used to manuplate the response object, which are:
     *
     *   - response.status `number`: status code of the response
     *   - response.statusText `string`: status text of the response
     *
     * @extends Body
     * @param {string|Buffer|ArrayBuffer|node.stream::stream.Readable} [body]
     * @param {object} [options] optional arguments,  which contains any of:
     *
     *   - status `number`: The status code for the reponse, e.g., 200.
     *   - statusText `string`: The status message associated with the staus code, e.g., OK.
     *   - headers `object|Headers`: the response headers
     */
    constructor(body, options) {
        super(body);

        if (options && typeof options !== 'object') options = null;

        let status = this.status = options && 'status' in options ? options.status | 0 : 200;
        this.statusText = options && 'statusText' in options ? '' + options.statusText : ohttp.STATUS_CODES[status] || '';
        if (options && typeof options.headers === 'object') {
            this._headers = options.headers instanceof Headers ? options.headers : new Headers(options.headers);
        } else {
            this._headers = new Headers();

            if (this._buffer) {
                this._headers.append('Content-Length', this._buffer.length);
            }
        }
    }

    /**
     * @returns {boolean}
     */
    get ok() {
        return this.status >= 200 && this.status <= 299
    }

    /**
     *
     * @returns {Headers} response headers
     */
    get headers() {
        return this._headers
    }


    /**
     * Adds Set-Cookie header to the response object
     *
     * @param {string} name cookie name to be set
     * @param {string} value cookie value to be set
     * @param {object} [options] optional keys to be appended, which can contain any of `expires`, `domain`, `path` etc.
     */
    setCookie(name, value, options) {
        let val = name + '=' + value;
        if (options) {
            for (let key in options) {
                val += '; ' + key;
                if ((value = options[key]) !== true) val += '=' + value;
            }
        }

        this.headers.append('Set-Cookie', val);
    }

    /**
     * Creates an error response
     *
     * @param {number} status
     * @param {Error|string|Buffer} reason message of the error as the response body
     */
    static error(status, reason) {
        return new Response(reason && (reason.message || '' + reason), {
            status: status
        });
    }

    /**
     * Creates a json response, a `content-type` header will be added to the headers
     *
     * @param obj data to be sent
     * @returns {Response}
     */
    static json(obj) {
        return new Response(JSON.stringify(obj), {
            headers: {'content-type': 'application/json'}
        })
    }

    /**
     * Creates a redirect response, the status will be set to 302, and a `location` header will be added
     *
     * @param {string} url redirect url, e.g. 'http://www.example.com' or '/foo/bar'
     * @returns {Response}
     */
    static redirect(url) {
        return new Response(null, {
            status: 302,
            headers: {'location': url}
        })
    }

    static file(file) {
        return new Response(ofs.createReadStream(file));
    }
}

/**
 * default agent for http request. You can set
 * maximum socket per host when calling request
 *
 * @type {node.http.http.Agent}
 */
export const agent = new ohttp.Agent();

function groupHeaders(obj) {
    const headers = new Empty(), entries = obj._headers._entries;
    for (let key in entries) {
        let arr = entries[key];
        headers[arr.name] = arr.length === 1 ? arr[0] : $slice.call(arr);
    }

    return headers;
}

/**
 * Create a new http server, bind it to a port or socket file. A callback is supplied which accepts a
 * [`Request`](#class-Request) object as parameter and returns a [`Response`](#class-Response)
 *
 * There are some extra properties that can be accessed with the `req` object:
 *
 *   - req.request [`http.IncomingMessage`](https://nodejs.org/api/http.html#http_http_incomingmessage) original request object
 *   - req.response [`http.ServerResponse`](https://nodejs.org/api/http.html#http_class_http_serverresponse) original response object
 *   - req.originalUrl `string` request's original url, should not be overwritten
 *
 * @example
 *     http.listen(8080, function(req) {
 *         return new http.Response('<h1>Hello world</h1>', {
 *             status: 200,
 *             headers: {
 *                 'content-type': 'text/html'
 *             }
 *         })
 *     });
 *
 * @param {number|string} port TCP port number or unix domain socket path to listen to
 * @param {function|router.Router} cb request handler callback
 * @param {string} [host] hostname to listen to, only valid if port is a 0-65535 number
 * @param {number} [backlog] maximum requests pending to be accepted, only valid if port is a 0-65535 number
 * @returns {node.http.http.Server} returned after the `listening` event has been fired
 */
export function listen(port, cb, host, backlog) {
    return co.promise(function (resolve, reject) {
        ohttp.createServer(_handler(cb)).listen(port, host, backlog, function () {
            this.removeListener('error', reject);
            resolve(this)
        }).once('error', reject);
    });
}

export function _handler(cb) {
    const co_run = co.run;

    return function (request, response) {
        request.body = request;
        let req = new Request(request.url[0] === '/' ? 'http://' + request.headers.host + request.url : request.url, request);

        req.request = request;
        req.response = response;

        // init req object
        req.originalUrl = request.url;

        co_run(resolver, req).then(function (resp) { // succ
            if (!resp) {
                response.writeHead(404);
                response.end();
                return
            }
            if (!(resp instanceof Response)) {
                throw new Error('illegal response object');
            }

            let tmp;
            if (tmp = resp._buffer) {
                writeHeaders();
                response.end(tmp);
            } else if (tmp = resp._stream) {
                tmp.once('data', function onData(data) {
                    tmp.removeListener('end', onEnd);
                    writeHeaders();
                    response.write(data);
                    this.pipe(response);
                }).once('end', onEnd).on('error', onerror);

                function onEnd() {
                    writeHeaders();
                    response.end();
                }
            } else {
                resp._payload.then(function (buffer) {
                    writeHeaders();
                    response.end(buffer);
                }, onerror)
            }

            function writeHeaders() {
                response.writeHead(resp.status, resp.statusText, groupHeaders(resp));
            }
        }).then(null, onerror);
        function onerror(err) {
            response.writeHead(500);
            response.end(err.message);
            console.error(new Date(), 'http::handler: uncaught exception', err.stack || err.message || err);
        }
    };

    function resolver(req) {
        co.Fiber.current.request = req;
        return cb.apply(req, [req]);
    }
}

/**
 * default User Agent for http request
 *
 * @type {string}
 */
export let client_ua = `AgentK/${process.versions.agentk} NodeJS/${process.version.substr(1)}`;

/**
 * Compose a http request.
 * `fetch` has two prototypes:
 *
 *   - function fetch(request:[Request](#class-Request))
 *   - function fetch(url:string, options:object)
 *
 * Please refer to the [Request](#class-Request) constructor for the info of the arguments
 * @param {string} url
 * @param {object} [options]
 * @retruns {Promise} a promise that yields a response on success
 */
export function fetch(url, options) {
    const req = typeof url === 'object' && url instanceof Request ? url : new Request(url, options);
    const delay = options && options.timeout || 3000;
    let http_host, https;
    let _agent = agent;


    let parsedUrl = ourl.parse(req.url);
    https = parsedUrl.protocol === 'https:';
    if (https) _agent = new ohttps.Agent(options);
    if (parsedUrl.protocol === 'unix:') {
        http_host = 'localhost';
        options = {
            socketPath: parsedUrl.pathname,
            path: '/' + (parsedUrl.search || '')
        }
    } else {
        http_host = parsedUrl.hostname;
        options = {
            host: parsedUrl.hostname,
            port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
            path: parsedUrl.path
        }
    }
    const headers = req.headers;
    headers.has('host') || headers.set('Host', http_host);
    headers.has('user-agent') || headers.set('User-Agent', client_ua);

    const method = options.method = req.method;
    options.headers = groupHeaders(req);
    options.agent = _agent;


    if (method === 'GET' ||
        method === 'HEAD' ||
        method === 'DELETE' ||
        method === 'OPTIONS') { // no body
        return composeRequest();
    } else if (req._buffer) {
        return composeRequest(req._buffer);
    } else {
        return req.buffer().then(composeRequest);
    }

    function composeRequest(buf) {
        return new Promise(function (resolve, reject) {
            let timer = setTimeout(ontimeout, delay);
            buf && (options.headers['Content-Length'] = buf.length);
            const treq = (https ? ohttps : ohttp).request(options, function (tres) {
                clearTimeout(timer);
                timer = null;
                let headers = new Headers();
                for (let arr = tres.rawHeaders, i = 0, L = arr.length; i < L; i += 2) {
                    headers.append(arr[i], arr[i + 1]);
                }
                resolve(new Response(tres, {
                    status: tres.statusCode,
                    statusText: tres.statusMessage,
                    headers: headers
                }))
            }).on('error', reject);
            treq.end(buf);

            function ontimeout() {
                reject({errno: "ETIMEOUT", message: `http::fetch: Request timeout (${req.url})`});
                timer = null;
                try {
                    treq.abort();
                    treq.socket.destroy();
                } catch (e) {
                }
            }
        })
    }
}

/**
 * Build a http query string from a key-value map
 *
 * @example
 *
 *     let body = {"foo": "bar"}
 *     let payload = http.buildQuery(forms); // "foo=bar"
 *     // compose a POST request
 *     let response = http.request({
 *         method: "POST",
 *         host: "...",
 *         path: "/api/data.php",
 *         headers: {
 *             'Content-Type': 'application/x-www-form-urlencoded'
 *         }
 *     }, payload);
 *
 * @param {object} obj keys and values
 * @returns {string} query string
 */
export function buildQuery(obj) {
    return oquerystring.stringify(obj);
}

/**
 * Parse a http query string into a key-value map.
 * May throw error if malformed UTF-8 escape sequence found
 *
 * @example
 *
 *     // read a request's body and parse its content
 *     let payload = req.body.toString(); // "foo=bar"
 *     let body = http.parseQuery(payload); // {"foo": "bar"}
 *
 * @param {string} query query string to be parsed
 * @returns {object} keys and values
 */
export function parseQuery(query) {
    return oquerystring.parse(query);
}

function parseUrl(req) {
    let url = ourl.parse(req._url, true);
    Object.defineProperties(req, {
        scheme: {
            writable: true,
            value: url.protocol
        }, host: {
            writable: true,
            value: url.host
        }, hostname: {
            value: url.hostname
        }, port: {
            value: url.port
        }, pathname: {
            writable: true,
            value: url.pathname
        }, originalPathname: {
            value: url.pathname
        }, search: {
            writable: true,
            value: url.search
        }, query: {
            value: url.query
        },
        url: {
            get: function () {
                return `${this.scheme}//${this.host}${this.pathname}${this.search}`
            }
        }
    })
}