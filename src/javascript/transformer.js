"use strict";
const _path = require('path');

let handle_string_template, handle_class, handle_destruct, handle_function_default_param, handle_function_rest_param;
let current_dirname;

const params = ['module', 'co', 'require', 'include', 'includeAsync', '__filename', '__dirname', 'moduleDefault', 'loadProgress'].map(id),
    useStrict = expr(raw('"use strict"')),
    VarType = {kind: 'var'},
    $proto = id('proto'),
    $super_class = id('super_class'),
    $super_proto = id('super_proto'),
    $undefined = id('undefined'),
    $arguments = id('arguments'),
    $destruct_temp = id('_destruct_temp'),
    $empty = expr(raw('/**/')),
    $this = {type: "ThisExpression"},
    $module = id('module'),
    $moduleDefault = id('moduleDefault');


let context = {onIdentifier: Boolean};

function transform(ast, options) {
    handle_string_template = options.StringTemplate;
    handle_class = options.Class;
    handle_function_default_param = options.Default;
    handle_function_rest_param = options.Rest;
    handle_destruct = options.Destruct;
    current_dirname = options.dir;

    iterate(ast.body);
    return ast.body;
}

function Empty() {
}
Empty.prototype = Object.create(null);

const handler = handle.bind.bind(handle, null);

const handlers = {
    ImportDeclaration: function (stmt, idx, arr) {
        const $include = call(member(call(id('includeAsync'), [raw(JSON.stringify(_path.resolve(current_dirname, stmt.source.value)))]), 'yield'), []);
        if (!stmt.specifiers.length) { // import only
            arr[idx] = expr(call(member({
                type: "MemberExpression",
                object: $include,
                property: id('loadProgress'),
                computed: true
            }, 'done'), []));
            return
        }
        const loc = stmt.loc,
            name = stmt.source.value,
            slash = name.lastIndexOf('/'),
            ns = {
                loc: loc,
                imported: stmt.source.raw,
                type: "Identifier",
                name: '_' + name.substr(slash + 1).replace(/\W/g, '_') + '_' + loc.start.line + '_' + loc.start.column
            };

        for (let specifier of stmt.specifiers) {
            switch (specifier.type) {
                case "ImportNamespaceSpecifier":
                    ns.name = specifier.local.name;
                    break;
                case "ImportSpecifier":
                    if (specifier.imported.name !== 'default') {
                        context.addImported(specifier.local.name, member(ns, specifier.imported.name));
                        break;
                    }
                case "ImportDefaultSpecifier":
                    context.addImported(specifier.local.name, {
                        type: "MemberExpression",
                        object: ns,
                        property: $moduleDefault,
                        computed: true
                    });
                    break;
            }
        }

        context.onImport(ns);
        arr[idx] = {
            loc: loc,
            type: "VariableDeclaration",
            kind: 'const',
            declarations: [declarator(ns, $include)]
        }
    },
    ExportNamedDeclaration: function (stmt, idx, arr) {
        if (stmt.declaration) { // export let ...
            const ctx = context.beginExport();
            handle('declaration', stmt);
            arr[idx] = stmt.declaration;
            ctx.dispose();
        } else { // export {...}
            const specifiers = stmt.specifiers;
            let default_loc = -1;
            if (specifiers.some(function (specifier, i) {
                    if (specifier.exported.name === 'default') {
                        // export as default
                        default_loc = i;
                        return true
                    }
                })) {
                context.onDefaultExport(arr, idx, specifiers[default_loc].local);
                specifiers.splice(default_loc, 1);
            } else {
                arr[idx] = $empty
            }
            context.exportIds(specifiers);
        }
    },
    ExportDefaultDeclaration: function (stmt, idx, arr) {
        const decl = stmt.declaration;
        if ((decl.type === "ClassDeclaration" || decl.type === "FunctionDeclaration") && !decl.id) {
            decl.type = decl.type === "FunctionDeclaration" ? "FunctionExpression" : "ClassExpression";
        }
        let init;
        switch (decl.type) {
            case "ClassDeclaration":
            case "FunctionDeclaration":
                init = decl.id;
                arr[idx] = decl;
                handle(idx, arr);
                arr.splice(++idx, 0, null);
                break;
            default:
                handle('declaration', stmt);
                init = stmt.declaration;
                break;
        }

        context.onDefaultExport(arr, idx, init);
    },
    VariableDeclaration: function (stmt) {
        for (let i = 0, decls = stmt.declarations, L = decls.length; i < L; i++) {
            const decl = decls[i];
            decl.init && handle('init', decl);
            const id = decl.id;
            if (id.type === "Identifier") {
                context.addVariable(id, stmt);
            } else if (handle_destruct) {
                // let {x} = init
                let init;
                if (decl.init.type === "Identifier") {
                    init = decl.init;
                    decls.splice(i--, 1); // delete the declaration
                    L--;
                } else {
                    init = decl.id = makeDestructDummy(id)
                }
                walkDestruct(id, init, function (identifier, init) {
                    context.addVariable(identifier, stmt);
                    decls.splice(++i, 0, declarator(identifier, init));
                    L++;
                });
            } else {
                walkDestruct(id, null, function (identifier) {
                    context.addVariable(identifier, stmt);
                });
            }
        }
    },
    IfStatement: handles('test', 'consequent', 'alternate'),
    WhileStatement: handles('test', 'body'),
    DoWhileStatement: handles('body', 'test'),
    ForStatement: function (stmt) {
        const ctx = makeContext();
        handle('init', stmt);
        handle('test', stmt);
        handle('update', stmt);
        handle('body', stmt);
        ctx.dispose();
    }, ForOfStatement: function (stmt) {
        const ctx = makeContext();
        const left = stmt.left;
        const extra_decls = [];
        if (left.type === "VariableDeclaration") { // for(let x of ...)
            const id = left.declarations[0].id;
            if (id.type === "Identifier") {
                context.addVariable(id, left)
            } else if (handle_destruct) {
                const dummy = left.declarations[0].id = makeDestructDummy(id);
                walkDestruct(id, dummy, function (identifier, init) {
                    context.addVariable(identifier, left);
                    extra_decls.push(declarator(identifier, init))
                });
            } else {
                walkDestruct(id, null, function (identifier) {
                    context.addVariable(identifier, left);
                });
            }
        }
        handle('right', stmt);
        handle('body', stmt);
        extra_decls.length && pushExtraDecls(left.kind, extra_decls, stmt);
        ctx.dispose();
    },
    SwitchStatement: function (stmt) {
        handle('discriminant', stmt);
        for (let kase of stmt.cases) {
            handle('test', kase);
            iterate(kase.consequent)
        }
    },
    TryStatement: function (stmt) {
        handle('block', stmt);
        if (stmt.handler) {
            const ctx = makeContext();
            context.addVariable(stmt.handler.param, VarType);
            iterate(stmt.handler.body.body);
            ctx.dispose();
        }
        stmt.finalizer && handle('finalizer', stmt);
    },
    BlockStatement: function (stmt, key) {
        if (key === 'body') {
            iterate(stmt.body);
        } else {
            const ctx = makeContext();
            iterate(stmt.body);
            ctx.dispose();
        }
    },
    ClassDeclaration: function (node, key, parent) {
        const isStmt = node.type === "ClassDeclaration";
        isStmt && context.addVariable(node.id, VarType);
        const superClass = node.superClass;
        superClass && handle('superClass', node);
        const body = node.body.body;

        const $className = body.$className = node.id || id('anonymous');

        iterate(body);
        // body.forEach(onMethod);
        if (!handle_class) return;

        // const proto = <Class>.prototype
        const env_decl = [declarator($proto, member($className, 'prototype'))];

        // super_class = <Super>, super_proto = proto.__proto__ = super_class.prototype
        superClass && env_decl.push(
            declarator($super_class, superClass),
            declarator($super_proto, assign(member($proto, '__proto__'), member($super_class, 'prototype')))
        );
        // Object.defineProperty(<Class>, 'prototype', {writable: false})
        body.unshift({
            type: "VariableDeclaration",
            kind: 'const',
            declarations: env_decl
        }, expr(call(id('Object.defineProperty'), [
            $className, raw('"prototype"'), {
                type: "ObjectExpression", properties: [
                    prop('writable', raw('false'))
                ]
            }
        ])));

        body.push({
            type: "ReturnStatement",
            argument: $className,
            loc: {start: {line: node.loc.end.line, column: 0}}
        });

        if (!body.hasConstructor) {
            body.push({
                type: "FunctionDeclaration",
                id: $className,
                params: [],
                body: {
                    type: "BlockStatement",
                    body: node.superClass ? [expr(call(member($super_proto, 'constructor.call'), [$this]))] : []
                }
            })
        }

        const factory = {
            type: "FunctionExpression",
            params: [],
            body: {
                loc: node.body.loc,
                type: "BlockStatement",
                body: body
            }
        };
        if (isStmt) {
            parent[key] = {
                type: "VariableDeclaration",
                kind: 'var',
                declarations: [declarator(node.id, call(factory, []))]
            };
        } else {
            parent[key] = call(factory, []);
        }

    },
    MethodDefinition: function (method, i, arr) {
        handleFunction(method.value);
        if (!handle_class) return;
        let target = method.static ? arr.$className.name : 'proto';
        if (method.kind.length === 3) { // get|set
            arr[i] = expr(call(member({
                type: "Identifier",
                name: target,
                loc: method.loc
            }, method.kind === 'get' ? '__defineGetter__' : '__defineSetter__'), [
                method.key.type === "Identifier" ? raw(JSON.stringify(method.key.name)) : method.key,
                method.value
            ]));
        } else if (method.kind === 'constructor') {
            arr.hasConstructor = true;
            method.value.type = "FunctionDeclaration";
            method.value.id = arr.$className;
            arr[i] = method.value;
        } else {
            method.type = "ExpressionStatement";
            method.expression = assign({
                type: "MemberExpression",
                object: {type: "Identifier", name: target, loc: method.loc},
                property: method.key,
                computed: method.computed
            }, method.value);
        }
    },
    FunctionDeclaration: function (stmt) {
        context.addVariable(stmt.id, VarType);
        handleFunction(stmt, true);
    },
    ReturnStatement: handler('argument'),
    LabeledStatement: function (stmt) {
        return handle(0, [stmt.body]);
    },
    ExpressionStatement: handler('expression'),
    SequenceExpression: function (expr) {
        iterate(expr.expressions)
    },
    CallExpression: function (expr) {
        handle('callee', expr);
        iterate(expr['arguments']);
    },
    MemberExpression: function (expr, key, parent) {
        if (handle_class && key === 'callee' && expr.object.type === "Super") {
            // super.xxx(...) => super_proto.xxx.call(this, ...)
            expr.object = {type: "Identifier", name: 'super_proto', loc: expr.loc};
            parent.callee = member(expr, 'call');
            parent['arguments'].unshift($this)
        } else {
            handle('object', expr)
        }
        if (expr.computed) {
            handle('property', expr)
        }
    },
    Super: function (expr, key, parent) {
        if (handle_class) {
            if (key === 'callee') {
                // super(...) => super_class.call(this, ...)
                expr = {type: "Identifier", name: 'super_class', loc: expr.loc};
                parent.callee = member(expr, 'call');
                parent['arguments'].unshift($this)
            } else {
                // super.xxx => super_proto.xxx
                parent[key] = {type: "Identifier", name: 'super_proto', loc: expr.loc}
            }
        }
    },
    ObjectExpression: function (expr) {
        for (let prop of expr.properties) {
            handle('value', prop)
        }
    },
    ObjectPattern: function (expr, key, parent) { // {} = {}
        if (key === 'left' && parent.type === "AssignmentExpression") {
            if (handle_destruct) {
                const seqs = [];
                let init = parent.right;
                if (init.type !== "Identifier") {
                    context.addTemp($destruct_temp);
                    seqs.push(assign($destruct_temp, init));
                    init = $destruct_temp;
                }
                walkDestruct(expr, init, function (identifier, init) {
                    if (!init) {
                        context.addTemp(identifier);
                    } else {
                        handle(0, [identifier]);
                        seqs.push(assign(identifier, init));
                    }
                });
                seqs.push(init);
                parent.type = "SequenceExpression";
                parent.expressions = seqs;
            } else {
                walkDestruct(expr, null, function (value) {
                    handlers[value.type](value)
                })
            }
            return;
        }
        console.error(expr, key, parent);
        throw new Error('unhandled object pattern');
    },
    ArrayExpression: function (expr) {
        iterate(expr.elements);
    },
    BinaryExpression: handles('left', 'right'),
    ConditionalExpression: handles('test', 'consequent', 'alternate'),
    FunctionExpression: function (expr) {
        handleFunction(expr, false)
    },
    AwaitExpression: function (expr) {
        handle('argument', expr);
        expr.type = "YieldExpression";
    },
    Identifier: function (id) {
        context.onIdentifier(id)
    },
    TemplateLiteral: function (expr, key, obj) {
        const exprs = expr.expressions;
        let i = exprs.length;
        iterate(exprs);
        if (!handle_string_template) return;
        if (i === 0) { // `simple string`
            obj[key] = {
                type: "Literal",
                raw: JSON.stringify(expr.quasis[0].value.cooked),
                loc: expr.loc
            };
            return;
        }

        expr.type = "BinaryExpression";
        expr.operator = '+';
        let current = expr, last = expr.quasis[i].value;

        while (i--) {
            let str = expr.quasis[i].value;
            str.type = "Literal";
            str.raw = JSON.stringify(str.cooked);

            current = current.left = binary(binary(null, '+', str), '+', exprs[i]);
            current = current.left;
        }
        if (last.cooked) {
            expr.right = last;
            last.type = "Literal";
            last.raw = JSON.stringify(last.cooked);
        } else {
            expr.right = expr.left.right;
            expr.left = expr.left.left;
        }
        current.type = "Literal";
        current.raw = current.right.raw;
        current.loc = current.right.loc;
    },
    BreakStatement: Boolean,
    ContinueStatement: Boolean,
    Literal: Boolean,
    ThisExpression: Boolean,
    EmptyStatement: Boolean
};

function handles() {
    const names = arguments, L = names.length;
    return function (expr) {
        for (let i = 0; i < L; i++) {
            handle(names[i], expr)
        }
    }
}

// aliases
handlers.ForInStatement = handlers.ForOfStatement;
handlers.ClassExpression = handlers.ClassDeclaration;
handlers.NewExpression = handlers.CallExpression;
handlers.ArrayPattern = handlers.ObjectPattern;
handlers.ArrowFunctionExpression = handlers.FunctionExpression;
handlers.AssignmentExpression
    = handlers.LogicalExpression
    = handlers.BinaryExpression;
handlers.UnaryExpression
    = handlers.UpdateExpression
    = handlers.YieldExpression
    = handlers.ThrowStatement
    = handlers.ReturnStatement;


function iterate(arr) {
    for (var i = arr.length; i; i--) {
        handle(arr.length - i, arr)
    }
}

function handle(key, obj) {
    const child = obj[key];
    if (!child) return;
    // console.error('handle', key, child.type);
    const handler = handlers[child.type];
    if (!handler) {
        console.error(obj, key);
        throw new Error('unhandled object type ' + child.type);
        return console.error('unhandled object type ' + child.type);
    }
    handler(child, key, obj)
}

function makeDestructDummy(param) {
    return {
        type: "Identifier",
        name: '_destruct_temp_' + param.loc.start.line + '_' + param.loc.start.column,
        loc: param.loc
    };
}

function walkDestruct(pattern, variable, cb) {
    switch (pattern.type) {
        case "ObjectPattern": // {a:a}
            for (let prop of pattern.properties) {
                walkDestruct(prop.value, variable && {
                        type: "MemberExpression",
                        object: variable,
                        property: prop.key,
                        computed: prop.computed || prop.key.type !== "Identifier"
                    }, cb)
            }
            break;
        case "ArrayPattern": // [a]
            pattern.elements.forEach(function (elem, i) {
                elem && walkDestruct(elem, variable && {
                        type: "MemberExpression",
                        object: variable,
                        property: raw(i + ''),
                        computed: true
                    }, cb);
            });
            break;
        case "AssignmentPattern": // {a=...}
            if (variable) {
                const temp = makeDestructDummy(pattern.left);
                cb(temp);
                cb(pattern.left, makeDefault(temp, variable, pattern.right))
            } else {
                cb(pattern.left);
            }
            break;
        case "RestElement": // [, ...a], variable from ArrayPattern
            cb(pattern.argument, variable && call(id('Array.prototype.slice.call'), [variable.object, variable.property]));
            break;
        default:
            cb(pattern, variable);
            break;
    }
}

function makeGlobalContext() {
    const pseudo_ctx = context;
    let exporting = false;
    const variables = new Empty(), exportMap = new Empty(), importMap = new Empty(), imports = [], nsMap = new Empty();
    const global_refs = [];

    const temps = [], tempMap = new Empty();

    let has_default = false;
    const scope = context = {
        _scope: null,
        _variables: variables,
        hasDefault: false,
        addVariable: function (id, stmt) {
            if (exporting) {
                if (id.name in exportMap) throw new Error(id.name + ' has already been exported');
                exportMap[id.name] = {kind: stmt.kind, local: id, exported: id};
            }
            variables[id.name] = stmt.kind;
        },
        onIdentifier: function (id, asserted) {
            if (asserted || !(id.name in variables)) {
                global_refs.push(id)
            }
        },
        beginExport: function () {
            exporting = true;

            return {
                dispose: function () {
                    exporting = false;
                }
            };
        },
        exportIds: function (ids) {
            for (let specifier of ids) {
                const exported = specifier.exported.name;
                if (exported in exportMap) throw new Error(exported + ' has already been exported');
                specifier.kind = variables[specifier.local.name];
                exportMap[exported] = specifier;
            }
        },
        onImport: function (ns) {
            nsMap[ns.name] = ns;
            imports.push(ns)
        },
        addImported: function (local_name, expr) {
            importMap[local_name] = expr;
        },
        addTemp: function (id) {
            if (id.name in tempMap)  return;
            tempMap[id.name] = true;
            temps.push(declarator(id, null));
        },
        onDefaultExport: function (arr, idx, init) {
            const callee = id('Object.defineProperty');
            callee.loc = arr[idx] && arr[idx].loc;
            arr[idx] = expr(call(callee, [
                $module, $moduleDefault, {
                    type: "ObjectExpression", properties: [
                        prop('value', init)]
                }]));
            has_default = true;
        }
    };
    scope._scope = scope;


    return {
        _imports: imports,
        exports: function*() {
            for (let exported in  exportMap) {
                const obj = exportMap[exported], local = obj.local;
                if (!obj.kind && (obj.kind = variables[local.name]) !== 'var') {
                    if (local.name in importMap) { // exporting imported
                        obj.local = importMap[local.name];
                        obj.kind = 'imported';
                        obj.local.object.used = true;
                    } else if (local.name in nsMap) {
                        nsMap[local.name].used = true;
                        obj.kind = 'const';
                    } else throw new ReferenceError(local.name + ' is not defined')
                }
                yield obj;
            }
        },
        dispose: function () {
            if (temps.length) {
                this.extra_decl = {
                    type: "VariableDeclaration",
                    kind: 'var',
                    declarations: temps
                }
            }
            this.hasDefaultExport = has_default;
            // check for global refs
            if (global_refs.length) {
                for (let id of global_refs) {
                    const name = id.name;
                    if (name in variables) continue;
                    if (name in importMap) {
                        // console.error('found imported reference', name);
                        const imported = importMap[name];
                        id.type = "MemberExpression";
                        id.object = {type: "Identifier", name: imported.object.name, loc: id.loc};
                        id.property = imported.property;
                        id.computed = imported.computed;
                        imported.object.used = true;
                    } else if (name in nsMap) {
                        nsMap[name].used = true;
                    }
                }
            }
            context = pseudo_ctx;
        }
    };
}

function makeScopeContext() {
    const old_ctx = context;
    const variables = Object.create(old_ctx._variables);
    const globals = [];

    const extra_decls = [], tempMap = new Empty();

    context = {
        _scope: null,
        _variables: variables,
        addVariable: function (id, stmt) {
            variables[id.name] = stmt.kind;
        },
        onIdentifier: function (id, asserted) {
            if (asserted || !(id.name in variables) || variables[id.name] === 'namespace') {
                globals.push(id)
            }
        },
        addTemp: function (id) {
            if (id.name in tempMap)  return;
            tempMap[id.name] = true;
            extra_decls.push(declarator(id, null));
        }
    };
    context._scope = context;

    return {
        temps: extra_decls,
        dispose: function () {
            // check for global refs
            if (globals.length) {
                for (let id of globals) {
                    if (id.name in variables && variables[id.name] === 'var') {
                        // found! it's not a global reference
                    } else {
                        // console.error('found global reference', id.name);
                        old_ctx.onIdentifier(id, true);
                    }
                }
            }
            context = old_ctx;
        }
    }
}

function makeContext() {
    const old_ctx = context, scope = old_ctx._scope;
    const variables = Object.create(old_ctx._variables);
    context = {
        _scope: scope,
        _variables: variables,
        addVariable: function (id, stmt) {
            (stmt === VarType || stmt.kind === 'var' ? scope._variables : variables)[id.name] = stmt.kind;
        },
        onIdentifier: function (id) {
            if (!(id.name in variables)) {
                scope.onIdentifier(id, true)
            }
        },
        addTemp: scope.addTemp
    };

    return {
        dispose: function () {
            context = old_ctx;
        }
    }
}

function handleFunction(obj, is_decl) {
    const middle_ctx = makeContext();
    if (!is_decl && obj.id) {
        context.addVariable(obj.id, VarType);
    }
    const scope = makeScopeContext();
    const params = obj.params,
        defaults = obj.defaults,
        paramLen = params.length,
        has_rest_param = paramLen && params[paramLen - 1].type === "RestElement",
        real_paramLen = paramLen - has_rest_param;

    const extra_decls = [];

    for (let i = 0; i < real_paramLen; i++) {
        const param = params[i];
        if (param.type === "Identifier") {
            context.addVariable(param, VarType);
        } else if (handle_destruct) {
            // destruct
            const dummy = obj.params[i] = makeDestructDummy(param);
            walkDestruct(param, dummy, function (identifier, init) {
                extra_decls.push(declarator(identifier, init));
                context.addVariable(identifier, VarType);
            })
        } else {
            walkDestruct(param, null, function (identifier) {
                context.addVariable(identifier, VarType);
            })
        }
    }
    if (has_rest_param && handle_function_rest_param) {
        // assert(handle_function_default_param);
        extra_decls.push(declarator(
            params[paramLen - 1].argument,
            call(id('Array.prototype.slice.call'), [$arguments, raw(real_paramLen + '')])
        ));
        params.length = real_paramLen;
    }

    if (defaults && defaults.length) {
        let i = 0;
        while (!defaults[i]) i++;
        // found first
        const first_default = i;
        for (; i < real_paramLen; i++) {
            const def = defaults[i];

            handle(i, defaults);
            if (handle_function_default_param) {
                const id = params[i];
                extra_decls.splice(i - first_default, 0, declarator(id, makeDefault(id, {
                    type: "MemberExpression", object: $arguments, property: raw('' + i), computed: true
                }, def)));
            }
        }
        if (handle_function_default_param) {
            params.length = first_default;
            defaults.length = 0;
        }
    }

    // body maybe block or expr
    if (obj.body.type === "BlockStatement")
        iterate(obj.body.body);
    else  // an expression
        handle('body', obj);

    scope.dispose();
    middle_ctx.dispose();
    scope.temps.length && extra_decls.push.apply(extra_decls, scope.temps);
    extra_decls.length && pushExtraDecls('var', extra_decls, obj, true);

    if (obj.async) {
        if (obj.body.type === "BlockStatement") {
            obj.body = {
                type: "BlockStatement",
                body: [{
                    type: "ReturnStatement",
                    argument: call(id('co.runIterator'), [call(member({
                        type: "FunctionExpression",
                        generator: true,
                        params: obj.params,
                        body: obj.body
                    }, 'apply'), [$this, $arguments])])
                }]
            }
        }
    }
}

function pushExtraDecls(kind, extra_decls, obj, is_returns) {
    const decl = {
        type: "VariableDeclaration",
        kind: kind,
        declarations: extra_decls
    };
    if (obj.body.type === "BlockStatement") {
        obj.body.body.unshift(decl);
    } else {
        obj.body = {
            type: "BlockStatement",
            body: [decl, is_returns ? {type: "ReturnStatement", argument: obj.body} : obj.body]
        }
    }
}

function makeDefault(id, variable, defaults) {
    return binary({
        type: "AssignmentExpression",
        left: id,
        operator: '=',
        right: variable
    }, '||', {
        type: "ConditionalExpression",
        test: binary(id, '===', $undefined),
        consequent: defaults,
        alternate: id
    });
}

function id(name) {
    return {type: "Identifier", name: name}
}

function prop(key, $value) {
    return {type: "Property", key: id(key), value: $value}
}

function raw(str) {
    return {type: "Literal", raw: str}
}

function expr(node) {
    return {type: "ExpressionStatement", expression: node}
}

function call(callee, args) {
    return {type: "CallExpression", callee: callee, arguments: args}
}

function member(object, property) {
    return {type: "MemberExpression", object: object, property: id(property), computed: false}
}

function assign(left, right) {
    return {type: "AssignmentExpression", operator: '=', left: left, right: right};
}

function binary(left, operator, right) {
    return {type: "BinaryExpression", operator: operator, left: left, right: right};
}

function declarator(id, init) {
    return {type: "VariableDeclarator", id: id, init: init}
}


module.exports = function (ast, options) {
    const ctx = makeGlobalContext(ast);


    const stmts = transform(ast, options);

    if (!stmts.length ||
        stmts[0].type !== "ExpressionStatement" ||
        stmts[0].expression.type !== "Literal" ||
        stmts[0].expression.value !== 'use strict'
    ) stmts.unshift(useStrict);

    const properties = [], exports = [];
    for (let obj of ctx.exports()) {
        const local = obj.local;

        let attrs;

        if (obj.kind === 'const') {
            attrs = [prop('value', local)]
        } else {
            attrs = [prop('get', {
                type: "ArrowFunctionExpression",
                params: [],
                body: local
            }), prop('set', {
                type: "ArrowFunctionExpression",
                params: [id('_')],
                body: {
                    type: "BlockStatement",
                    body: [expr(assign(local, id('_')))]
                }
            })]
        }
        exports.push(obj.exported.name);
        properties.push(prop(obj.exported.name, {
            type: "ObjectExpression",
            properties: attrs
        }));
    }

    properties.length && stmts.push(expr(call(id('Object.defineProperties'), [
        $module, {type: "ObjectExpression", properties: properties}
    ])));

    ctx.dispose();

    ctx.hasDefaultExport || stmts.push(expr(call(id('Object.defineProperty'), [
        $module, $moduleDefault, {
            type: "ObjectExpression", properties: [
                prop('value', id('undefined'))]
        }])));

    ctx.extra_decl && stmts.push(ctx.extra_decl);

    return {
        imports: ctx._imports,
        exports: exports,
        ast: {
            type: "Program",
            body: [expr({
                type: "FunctionExpression",
                id: null,
                params: params,
                body: {
                    type: "BlockStatement",
                    body: stmts
                }
            })]
        }
    };
};

module.exports.transform = transform;
