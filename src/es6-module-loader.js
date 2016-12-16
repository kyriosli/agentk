//
"use strict";

const parseOptions = {
    ecmaVersion: 8,
    sourceType: 'module',
    locations: true,
    loc: true
}, transformOptions = require('./javascript/transform_options'), buildOptions = {
    loc: true
};

const path = require('path'), fs = require('fs'), vm = require('vm');


const acorn = require('./javascript/acorn'), parse = acorn.parse;

const build = require('./javascript/builder');
const transform = require('./javascript/transformer');
const moduleDefault = Symbol('module default'), loadProgress = Symbol('load progress');
const co = require('./co');

const definedModules = {}; // name: Primise(module)

exports.cache = definedModules;

global.include = function (name) {
    return includeAsync(name).then(function (module) {
        return module[loadProgress]
    })
};

var beforeModuleLoad = Boolean, checkModule = Boolean;

if (process.properties.check) {
    const modulesLoaded = Object.create(null);
    beforeModuleLoad = function (path) {
        const m = /[\/\\]module[\/\\]([^\/\\]+)/.exec(path);
        if (!m) return;
        const module_name = m[1];
        if (module_name in modulesLoaded) {
            console.trace('loading ' + path + ': a module with the same name has already been loaded: ' + modulesLoaded[module_name])
        } else {
            modulesLoaded[module_name] = path;
        }
    };
    checkModule = function (option) {
        if (option.transformed.imports.length) for (let obj of option.transformed.imports) {
            if (!obj.used) {
                console.log('\x1b[33mWARN\x1b[0m unused import ' + obj.imported + ' in ' + option.filename + ':' + obj.loc.start.line + ':' + obj.loc.start.column)
            }
        }
    }
}

/**
 * @param {String} name full path of the module name
 * @returns {Promise} a promise that resolves the module
 */
function includeAsync(name) {
    if (!/\.(\w+)$/.test(name)) {
        name += '.js';
    }
    if (name in definedModules) return definedModules[name];
    beforeModuleLoad(name);
    if (fs.existsSync(name)) {
        try {
            let source = fs.readFileSync(name);
            let module = {}, ret = definedModules[name] = Promise.resolve(module);
            defineModule(module, source, {filename: name});
            return ret;
        } catch (e) { // file IO error, or module compilation failed
            return definedModules[name] = Promise.reject(e);
        }
    }

    let basename = path.basename(name), supername = path.basename(name.slice(0, -basename.length));
    if (!process.properties.check || supername !== 'module') { // file not found
        return definedModules[name] = Promise.reject(new Error('ENOENT, no such file or directory \'' + name + '\''));
    }
    return definedModules[name] = require('./module_server').checkedDownload(basename).then(function (buffer) {
        ensureParentDir(name);
        fs.writeFileSync(name, buffer);
        let module = {};
        defineModule(module, buffer, {filename: name});
        return module;
    })
}

function ensureParentDir(name) {
    let dir = path.dirname(name);
    if (fs.existsSync(dir)) return;
    ensureParentDir(dir);
    fs.mkdirSync(dir);
}

// init property for module default getter
const defaultProp = {
    configurable: true,
    get: function () {
        return this[loadProgress].yield()[moduleDefault];
    }
};

function initModule(module, option) {
    let props = {};
    checkModule(option);
    option.transformed.exports.forEach(function (name) {
        props[name] = {
            configurable: true,
            get: function () {
                return this[loadProgress].yield()[name];
            }, set: function (val) {
                this[loadProgress].yield()[name] = val;
            }
        }
    });
    props[moduleDefault] = defaultProp;
    Object.defineProperties(module, props);
}

const resolvedPaths = {};
const _load = require('module')._load;

function resolveModulePath(dir) {
    if (dir in resolvedPaths) return resolvedPaths[dir];

    let paths = dir === '/' || dir[dir.length - 1] === '\\' ? [] : resolveModulePath(path.dirname(dir)),
        curr = path.join(dir, 'node_modules');
    if (fs.existsSync(curr)) {
        paths = paths.slice();
        paths.unshift(curr)
    }
    return resolvedPaths[dir] = paths
}

// returns: script
function compile(buffer, option) {
    let ast = parse(buffer, parseOptions);
    transformOptions.dir = option.dir;
    let transformed = option.transformed = transform(ast, transformOptions);
    return build(transformed.ast, buildOptions);
}

function defineModule(module, buffer, option) {
    const __filename = option.filename,
        __dirname = option.dir = path.dirname(__filename);
    let compiled;
    try {
        compiled = compile(buffer, option);
    } catch (e) {
        const err = new Error('failed parsing ' + __filename + ': ' + e.message), old_stack = e.stack;

        if (old_stack) {
            const stack = err.stack, idx = stack.indexOf('\n');

            err.stack = stack.substr(0, idx) +
                old_stack.substr(old_stack.indexOf('\n')) +
                '\n============================================' +
                stack.substr(idx);
        }
        throw err;
    }
    // console.log('/* ' + option.filename + '*/$', compiled);
    let ctor = vm.runInThisContext(compiled, option);

    module[loadProgress] = co.run(function () {
        initModule(module, option);
        option.exports = null; // TODO: sub-module exports analyse
        option.id = __filename;
        option.paths = resolveModulePath(__dirname);

        ctor(module, co, function (path) {
            return _load(path, option)
        }, function _import(name) {
            return includeAsync(path.resolve(__dirname, name)).yield()
        }, includeAsync, __filename, __dirname, moduleDefault, loadProgress);
        return module;
    });
}
