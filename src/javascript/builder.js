"use strict";

const newlines = '\n'.repeat(128), whitespaces = ' '.repeat(128);

let line = 1, column = 0, buf = '', toIndent = null;
const inspect = require('util').inspect;


function returns() {
    const ret = buf;
    line = 1;
    column = 0;
    buf = '';
    toIndent = null;
    return ret;
}

const $appendBefore = appendBefore, $appendStart = appendStart, $appendEnd = appendEnd;
let useLoc = true;

module.exports = function (ast, option) {
    //console.log('building', ast);
    // assert ast.type === "Program"
    const _useLoc = option && option.loc;
    if (_useLoc !== useLoc) {
        if (_useLoc) {
            appendBefore = $appendBefore;
            appendStart = $appendStart;
            appendEnd = $appendEnd;
        } else {
            appendBefore = appendStart = appendEnd = append;
        }
        useLoc = _useLoc;
    }

    ast.body.forEach(onStmt);

    return returns();
};

function onStmt(stmt) {
    for (; stmt;) {
        switch (stmt.type) {
            case "BlockStatement":
                appendStart('{', stmt);
                stmt.body.forEach(onStmt);
                appendEnd('}', stmt);
                return;
            case "ExpressionStatement":
                onExpr(stmt.expression, true);
                break;
            case "IfStatement":
                appendStart('if (', stmt);
                onExpr(stmt.test);
                append(') ');
                onStmt(stmt.consequent);
                if (stmt.alternate) {
                    append(' else ');
                    stmt = stmt.alternate;
                    continue;
                }
                return;
            case "VariableDeclaration":
                appendStart(stmt.kind + ' ', stmt);
                stmt.declarations.forEach(onVarDecl);
                break;
            case "ReturnStatement":
                appendStart('return', stmt);
                if (stmt.argument) {
                    append(' ');
                    onExpr(stmt.argument);
                }
                break;
            case "ThrowStatement":
                appendStart('throw ', stmt);
                onExpr(stmt.argument);
                break;
            case "FunctionDeclaration":
                onFunction(stmt);
                return;
            case "ClassDeclaration":
                onClass(stmt);
                return;
            case "TryStatement":
                appendStart('try {', stmt);
                stmt.block.body.forEach(onStmt);
                if (stmt.handler) {
                    append('} catch (');
                    onIdentifier(stmt.handler.param);
                    append(') {');
                    stmt.handler.body.body.forEach(onStmt);
                }
                if (stmt.finalizer) {
                    append('} finally {');
                    stmt.finalizer.body.forEach(onStmt);
                }
                appendEnd('}', stmt);
                return;
            case "ForStatement":
                appendStart('for (', stmt);
                onDeclOrExpr(stmt.init);
                append('; ');
                onExpr(stmt.test);
                append('; ');
                onExpr(stmt.update);
                append(') ');
                stmt = stmt.body;
                continue;
            case "ForInStatement":
            case "ForOfStatement":
                appendStart('for (', stmt);
                onDeclOrExpr(stmt.left);
                append(stmt.type === "ForInStatement" ? ' in ' : ' of ');
                onExpr(stmt.right);
                append(') ');
                stmt = stmt.body;
                continue;
            case "WhileStatement":
                appendStart('while (', stmt);
                onExpr(stmt.test);
                append(') ');
                stmt = stmt.body;
                continue;
            case "DoWhileStatement":
                appendStart('do ', stmt);
                onStmt(stmt.body);
                append(' while (');
                onExpr(stmt.test);
                appendEnd(');', stmt);
                return;
            case "EmptyStatement":
                appendStart(';', stmt);
                return;
            case "SwitchStatement":
                appendStart('switch (', stmt);
                onExpr(stmt.discriminant);
                append(') {');
                stmt.cases.forEach(onSwitchCase);
                appendEnd('}', stmt);
                return;
            case "BreakStatement":
            case "ContinueStatement":
            {
                let str = stmt.type === "BreakStatement" ? 'break' : 'continue';
                if (stmt.label) {
                    str += ' ' + stmt.label.name + ';'
                } else {
                    str += ';'
                }
                appendStart(str, stmt);
                return;
            }
            case "LabeledStatement":
                onIdentifier(stmt.label);
                append(':');
                stmt = stmt.body;
                continue;
            case "DebuggerStatement":
                appendStart('debugger', stmt);
                break;
            default:
                console.error('on statement ' + inspect(stmt, {depth: 10}));
                throw new Error('unhandled statement type ' + stmt.type);
        }
        append(';');
        return
    }
}

function onClass(node) {
    appendStart('class ', node);
    node.id && onIdentifier(node.id);
    if (node.superClass) {
        append(' extends ');
        onExpr(node.superClass);
    }
    appendBefore(' {', node.body, 2);
    node.body.body.forEach(onMethod);
    appendEnd('}', node);
}

function onMethod(method) {
    let prefix = '';
    if (method.static) prefix = 'static ';

    if (method.kind.length === 3) prefix += method.kind + ' '; // get|set

    if (method.computed) prefix += '[';

    appendStart(prefix, method);
    onExpr(method.key);
    if (method.computed) append(']');
    onFunction(method.value, true);
}

function onSwitchCase(switchCase) {
    if (switchCase.test) {
        appendStart('case ', switchCase);
        onExpr(switchCase.test);
        append(':')
    } else {
        appendStart('default:', switchCase);
    }
    switchCase.consequent.forEach(onStmt);
}

function onDeclOrExpr(node) {
    if (node && node.type === "VariableDeclaration") {
        appendStart(node.kind + ' ', node);
        node.declarations.forEach(onVarDecl);
    } else if (node) {
        onExpr(node);
    }
}

function onIdentifier(node) {
    appendStart(node.name, node);
}

function onVarDecl(decl, i) {
    i && append(', ');
    onExpr(decl.id);
    if (decl.init) {
        append(' = ');
        onExpr(decl.init);
    }
}

const levels = {
    '*': 2,
    '/': 2,
    '%': 2,
    '+': 3,
    '-': 3,
    '<<': 4,
    '>>': 4,
    '>>>': 4,
    '<': 5,
    '<=': 5,
    '>': 5,
    '>=': 5,
    'in': 5,
    'instanceof': 5,
    '==': 6,
    '!=': 6,
    '===': 6,
    '!==': 6,
    '&': 7,
    '^': 8,
    '|': 9, '&&': 10,
    '||': 11
};

function level(expr) {
    switch (expr.type) {
        case "UnaryExpression":
        case "NewExpression":
        case "UpdateExpression":
            return 1;
        case "BinaryExpression":
        case "LogicalExpression":
            return levels[expr.operator];
        case "ConditionalExpression":
            return 12;
        case "ArrowFunctionExpression":
        case "AssignmentExpression":
        case "AssignmentPattern":
            return 13;
        case "YieldExpression":
            return 14;
        case "SequenceExpression":
            return 15;
        default:
            return 0;
    }
}

function autoWrap(expr, l, isStmt) {
    const wrap = level(expr) > l;
    if (wrap) appendBefore('(', expr, 1);
    onExpr(expr, isStmt && !wrap);
    if (wrap) append(')');
}

function onExpr(expr, isStmt) {
    if (!expr) return;
    //console.log('on expression', expr);
    switch (expr.type) {
        case "Literal":
            appendStart(expr.raw, expr);
            break;
        case "UpdateExpression":
        case "UnaryExpression":
            if (expr.prefix) {
                appendStart(expr.operator + (expr.operator.length > 3 ? ' ' : ''), expr);
                autoWrap(expr.argument, 1);
            } else {
                autoWrap(expr.argument, 1, isStmt);
                append(expr.operator);
            }
            break;
        case "AssignmentPattern":
            onIdentifier(expr.left);
            append(' = ');
            autoWrap(expr.right, 13);
            break;
        case "AssignmentExpression":
            if (isStmt && expr.left.type === "ObjectPattern") {
                append('(');
                onExpr(expr.left);
                append(' = ');
                autoWrap(expr.right, 13);
                append(')');
                break;
            }
        case "BinaryExpression":
        case "LogicalExpression":
        {
            const lvl = level(expr);
            autoWrap(expr.left, lvl, isStmt);
            append(' ' + expr.operator + ' ');
            autoWrap(expr.right, expr.type === "AssignmentExpression" ? 13 : lvl - 1);
            break;
        }
        case "ConditionalExpression":
            autoWrap(expr.test, 12);
            append(' ? ');
            autoWrap(expr.consequent, 12);
            append(' : ');
            autoWrap(expr.alternate, 12);
            break;
        case "MemberExpression":
            autoWrap(expr.object, expr.object.type === "NewExpression" ? 1 : 0, isStmt);
            append(expr.computed ? '[' : '.');
            onExpr(expr.property);
            expr.computed && append(']');
            break;
        case "CallExpression":
            autoWrap(expr.callee, 0, isStmt);
            append('(');
            onExprs(expr['arguments']);
            appendEnd(')', expr);
            break;
        case "Identifier":
            onIdentifier(expr);
            break;
        case "ThisExpression":
            appendStart('this', expr);
            break;
        case "FunctionExpression":
            isStmt && appendBefore('(', expr, 1);
            onFunction(expr);
            isStmt && append(')');
            break;
        case "ClassExpression":
            onClass(expr);
            break;
        case "ObjectExpression":
        case "ObjectPattern":
            if (isStmt) {
                appendBefore('({', expr, 1);
            } else {
                appendStart('{', expr)
            }
            for (let i = 0, L = expr.properties.length; i < L; i++) {
                i && append(',');
                let prop = expr.properties[i];
                if (prop.computed) append('[');
                onExpr(prop.key); // identifier or literal
                if (prop.computed) append(']');
                if (prop.value.type === "AssignmentPattern") {
                    append('=');
                    onExpr(prop.value.right)
                } else {
                    append(':')
                    onExpr(prop.value);
                }
            }
            appendEnd(isStmt ? '})' : '}', expr);
            break;
        case "NewExpression":
        {
            appendStart('new ', expr);

            let curr = expr.callee, wrapCallee = false;
            for (; ;) {
                if (curr.type === "CallExpression" || level(curr) > 0) {
                    wrapCallee = true;
                    break;
                }
                if (curr.type === "MemberExpression") {
                    curr = curr.object;
                    continue;
                }
                break;
            }

            if (wrapCallee) append('(');
            onExpr(expr.callee);
            append(wrapCallee ? ')(' : '(');
            onExprs(expr['arguments']);
            append(')');
            break;
        }
        case "RestElement":
            appendBefore('...', expr.argument, 3);
            onExpr(expr.argument);
            break;
        case "ArrayExpression":
        case "ArrayPattern":
        {
            appendStart('[', expr);
            onExprs(expr.elements);
            append(']');
            break;
        }
        case "ArrowFunctionExpression":
            onFunction(expr);
            break;
        case "SequenceExpression":
            onExprs(expr.expressions, isStmt);
            break;
        case "YieldExpression":
        {
            const requiresWrap = level(expr.argument) > 14;
            appendStart((expr.delegate ? 'yield* ' : 'yield ') + (requiresWrap ? '(' : ''), expr);
            onExpr(expr.argument);
            requiresWrap && append(')');
            break;
        }
        case "Super":
            append('super', expr);
            break;
        case "TemplateLiteral":
        {
            appendStart('`', expr);
            const exprs = expr.expressions,
                quasis = expr.quasis,
                L = exprs.length;
            for (let i = 0; i < L; i++) {
                append(quasis[i].value.raw + '${');
                onExpr(exprs[i]);
                append('}')
            }
            append(quasis[L].value.raw + '`');
            break;
        }
        default:
            console.log('on expression', expr);
            throw new Error('unhandled expression type ' + expr.type);
    }
}

function onExprs(arr, isStmt) {
    if (!arr.length) return;
    for (let i = 0, L = arr.length; i < L; i++) {
        let expr = arr[i];
        if (!expr) {
            append(', ');
            continue
        }
        let isSeq = level(expr) === 15;
        append(isSeq ? i ? ', (' : '(' : i ? ', ' : '');
        onExpr(arr[i], isStmt && i === 0);
        isSeq && append(')');
    }
}


function onFunction(expr, isShorthand) {
    const isArrow = expr.type === "ArrowFunctionExpression";
    appendStart(isArrow || isShorthand ? '' : expr.generator ? 'function* ' : 'function ', expr);
    expr.id && onIdentifier(expr.id);
    let L = expr.params.length;
    append('(');
    const hasRest = L && expr.params[L - 1].type === "RestElement";
    if (hasRest) L--;
    const defaults = expr.defaults || [];
    for (let i = 0; i < L; i++) {
        i && append(', ');
        onExpr(expr.params[i]);
        if (defaults[i]) {
            append(' = ');
            autoWrap(defaults[i], 13)
        }
    }
    if (hasRest) {
        append(L ? ', ...' : '...');
        onIdentifier(expr.params[L].argument);
        L++;
    }
    if (isArrow) {
        if (expr.body.type === "BlockStatement") {
            appendBefore(') => {', expr.body, 5);
            expr.body.body.forEach(onStmt);
            appendEnd('}', expr.body);
        } else {
            let prefix = ') => ';
            const isObject = expr.body.type === "ObjectExpression";
            if (isObject) prefix += '(';

            appendBefore(prefix, expr.body, prefix.length);
            onExpr(expr.body);
            isObject && append(')');
        }
    } else {
        appendBefore(') {', expr.body, 2);
        expr.body.body.forEach(onStmt);
        appendEnd('}', expr.body);
    }
}

function appendBefore(str, node, i) {
    let loc = node.loc && node.loc.start;
    if (loc) {
        if (loc.column >= i)loc.column -= i;
        autoAppend(str, loc);
    } else {
        append(str);
    }
}

function appendStart(str, node) {
    let loc = node.loc && node.loc.start;
    if (loc) {
        autoAppend(str, loc);
    } else {
        append(str);
    }
}

function appendEnd(str, node) {
    let loc = node.loc && node.loc.end;
    if (loc) {
        if (loc.column >= str.length) loc.column -= str.length;
        autoAppend(str, loc);
    } else {
        append(str);
    }
}

function autoAppend(str, pos) {
    const l = pos.line, c = pos.column;
    if (l > line) {
        buf += newlines.substr(0, l - line);
        line = l;
        column = 0;
    }
    if (l === line && c > column) {
        buf += whitespaces.substr(0, c - column);
        column = c;
    }

    buf += str;
    column += str.length;
}

function append(str) {
    buf += str;
    column += str.length;
}