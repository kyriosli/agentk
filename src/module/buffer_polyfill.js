/**
 *
 * This module supplies `Buffer.alloc`, `Buffer.allocUnsafe`, `Buffer.allocUnsafeSlow` and `Buffer.from` class methods.
 * See [https://nodejs.org/api/buffer.html](https://nodejs.org/api/buffer.html) for more usages and examples
 *
 * @example
 *
 *  if(!Buffer.from) include('module/buffer_polyfill');
 *  Buffer.alloc(1024); // returns zero-filled buffer
 *  Buffer.from("lorem ipsum"); // transform
 *
 * @title Buffer API implementations for lower version of Node.JS
 */
"use strict";
const Buffer = global.Buffer;

if (!Buffer.alloc) {
    Buffer.allocUnsafe = function (size) {
        return new Buffer(size)
    };

    const SlowBuffer = require('buffer').SlowBuffer;
    Buffer.allocUnsafeSlow = function (size) {
        return new SlowBuffer(size);
    };

    Buffer.alloc = function (size, fill, encoding) {
        return Buffer.allocUnsafe(size).fill(fill, 0, size, encoding);
    };

    Buffer.from = function (value, encodingOrOffset, length) {
        if (typeof value === 'number')
            throw new TypeError('"value" argument must not be a number');

        if (value instanceof ArrayBuffer)
            return fromArrayBuffer(value, encodingOrOffset, length);

        if (typeof value === 'string') {
            if (encodingOrOffset !== 'utf8')
                return new Buffer(value, encodingOrOffset);
            var ret = Buffer.allocUnsafe(value.length * 3);
            return ret.slice(0, ret.write(value, 0, ret.length, 'utf8'))
        }

        return fromObject(value);
    };


}

function fromObject(obj) {
    if (obj instanceof Buffer) {
        const b = Buffer.allocUnsafe(obj.length);

        if (b.length === 0)
            return b;

        obj.copy(b, 0, 0, obj.length);
        return b;
    }

    if (obj) {
        if (obj.buffer instanceof ArrayBuffer || 'length' in obj) {
            if (typeof obj.length !== 'number' || obj.length !== obj.length) {
                return new Buffer(0);
            }
            return new Buffer(obj);
        }

        if (obj.type === 'Buffer' && Array.isArray(obj.data)) {
            return new Buffer(obj.data);
        }
    }

    throw new TypeError('First argument must be a string, Buffer, ArrayBuffer, Array, or array-like object.');
}

function fromArrayBuffer(obj, byteOffset, length) {
    byteOffset >>>= 0;

    const maxLength = obj.byteLength - byteOffset;

    if (maxLength < 0)
        throw new RangeError("'offset' is out of bounds");

    if (length === undefined) {
        length = maxLength;
    } else {
        length >>>= 0;
        if (length > maxLength)
            throw new RangeError("'length' is out of bounds");
    }

    return new Buffer(new Uint8Array(obj, byteOffset, length));
}