"use strict";

var tests = {
    "Optimisation": [{
        "title": "proper tail calls (tail call optimisation)",
        "tests": {
            "direct recursion": "\n\"use strict\";\nreturn (function f(n){\n  if (n <= 0) {\n    return  \"foo\";\n  }\n  return f(n - 1);\n}(1e6)) === \"foo\";\n      ",
            "mutual recursion": "\n\"use strict\";\nfunction f(n){\n  if (n <= 0) {\n    return  \"foo\";\n  }\n  return g(n - 1);\n}\nfunction g(n){\n  if (n <= 0) {\n    return  \"bar\";\n  }\n  return f(n - 1);\n}\nreturn f(1e6) === \"foo\" && f(1e6+1) === \"bar\";\n      "
        }
    }],
    "Syntax": [{
        "title": "default function parameters",
        "tests": {
            "basic functionality": "\nreturn (function (a = 1, b = 2) { return a === 3 && b === 2; }(3));\n      ",
            "explicit undefined defers to the default": "\nreturn (function (a = 1, b = 2) { return a === 1 && b === 3; }(undefined, 3));\n      ",
            "defaults can refer to previous params": "\nreturn (function (a, b = a) { return b === 5; }(5));\n      ",
            "arguments object interaction": "\nreturn (function (a = \"baz\", b = \"qux\", c = \"quux\") {\n  a = \"corge\";\n  // The arguments object is not mapped to the\n  // parameters, even outside of strict mode.\n  return arguments.length === 2\n    && arguments[0] === \"foo\"\n    && arguments[1] === \"bar\";\n}(\"foo\", \"bar\"));\n      ",
            "temporal dead zone": "\nreturn (function(x = 1) {\n  try {\n    eval(\"(function(a=a){}())\");\n    return false;\n  } catch(e) {}\n  try {\n    eval(\"(function(a=b,b){}())\");\n    return false;\n  } catch(e) {}\n  return true;\n}());\n      ",
            "separate scope": "\nreturn (function(a=function(){\n  return typeof b === 'undefined';\n}){\n  var b = 1;\n  return a();\n}());\n      ",
            "new Function() support": "\nreturn new Function(\"a = 1\", \"b = 2\",\n  \"return a === 3 && b === 2;\"\n)(3);\n      "
        }
    }, {
        "title": "rest parameters",
        "tests": {
            "basic functionality": "\nreturn (function (foo, ...args) {\n  return args instanceof Array && args + \"\" === \"bar,baz\";\n}(\"foo\", \"bar\", \"baz\"));\n      ",
            "function 'length' property": "\nreturn function(a, ...b){}.length === 1 && function(...c){}.length === 0;\n      ",
            "arguments object interaction": "\nreturn (function (foo, ...args) {\n  foo = \"qux\";\n  // The arguments object is not mapped to the\n  // parameters, even outside of strict mode.\n  return arguments.length === 3\n    && arguments[0] === \"foo\"\n    && arguments[1] === \"bar\"\n    && arguments[2] === \"baz\";\n}(\"foo\", \"bar\", \"baz\"));\n      ",
            "can't be used in setters": "\nreturn (function (...args) {\n  try {\n    eval(\"({set e(...args){}})\");\n  } catch(e) {\n    return true;\n  }\n}());\n      ",
            "new Function() support": "\nreturn new Function(\"a\", \"...b\",\n  \"return b instanceof Array && a+b === 'foobar,baz';\"\n)('foo','bar','baz');\n      "
        }
    }, {
        "title": "spread (...) operator",
        "tests": {
            "with arrays, in function calls": "\nreturn Math.max(...[1, 2, 3]) === 3\n      ",
            "with arrays, in array literals": "\nreturn [...[1, 2, 3]][2] === 3;\n      ",
            "with sparse arrays, in function calls": "\nvar a = Array(...[,,]);\nreturn \"0\" in a && \"1\" in a && '' + a[0] + a[1] === \"undefinedundefined\";\n      ",
            "with sparse arrays, in array literals": "\nvar a = [...[,,]];\nreturn \"0\" in a && \"1\" in a && '' + a[0] + a[1] === \"undefinedundefined\";\n      ",
            "with strings, in function calls": "\nreturn Math.max(...\"1234\") === 4;\n      ",
            "with strings, in array literals": "\nreturn [\"a\", ...\"bcd\", \"e\"][3] === \"d\";\n      ",
            "with astral plane strings, in function calls": "\nreturn Array(...\"𠮷𠮶\")[0] === \"𠮷\";\n      ",
            "with astral plane strings, in array literals": "\nreturn [...\"𠮷𠮶\"][0] === \"𠮷\";\n      ",
            "with generator instances, in calls": "\nvar iterable = (function*(){ yield 1; yield 2; yield 3; }());\nreturn Math.max(...iterable) === 3;\n      ",
            "with generator instances, in arrays": "\nvar iterable = (function*(){ yield \"b\"; yield \"c\"; yield \"d\"; }());\nreturn [\"a\", ...iterable, \"e\"][3] === \"d\";\n      ",
            "with generic iterables, in calls": "\nvar iterable = global.__createIterableObject([1, 2, 3]);\nreturn Math.max(...iterable) === 3;\n      ",
            "with generic iterables, in arrays": "\nvar iterable = global.__createIterableObject([\"b\", \"c\", \"d\"]);\nreturn [\"a\", ...iterable, \"e\"][3] === \"d\";\n      ",
            "with instances of iterables, in calls": "\nvar iterable = global.__createIterableObject([1, 2, 3]);\nreturn Math.max(...Object.create(iterable)) === 3;\n      ",
            "with instances of iterables, in arrays": "\nvar iterable = global.__createIterableObject([\"b\", \"c\", \"d\"]);\nreturn [\"a\", ...Object.create(iterable), \"e\"][3] === \"d\";\n      ",
            "spreading non-iterables is a runtime error": "\ntry {\n  Math.max(...2);\n} catch(e) {\n  return Math.max(...[1, 2, 3]) === 3;\n}\n      "
        }
    }, {
        "title": "object literal extensions",
        "tests": {
            "computed properties": "\nvar x = 'y';\nreturn ({ [x]: 1 }).y === 1;\n      ",
            "shorthand properties": "\nvar a = 7, b = 8, c = {a,b};\nreturn c.a === 7 && c.b === 8;\n      ",
            "shorthand methods": "\nreturn ({ y() { return 2; } }).y() === 2;\n      ",
            "string-keyed shorthand methods": "\nreturn ({ \"foo bar\"() { return 4; } })[\"foo bar\"]() === 4;\n      ",
            "computed shorthand methods": "\nvar x = 'y';\nreturn ({ [x](){ return 1 } }).y() === 1;\n      ",
            "computed accessors": "\nvar x = 'y',\n    valueSet,\n    obj = {\n      get [x] () { return 1 },\n      set [x] (value) { valueSet = value }\n    };\nobj.y = 'foo';\nreturn obj.y === 1 && valueSet === 'foo';\n      "
        }
    }, {
        "title": "for..of loops",
        "tests": {
            "with arrays": "\nvar arr = [5];\nfor (var item of arr)\n  return item === 5;\n      ",
            "with sparse arrays": "\nvar arr = [,,];\nvar count = 0;\nfor (var item of arr)\n  count += (item === undefined);\nreturn count === 2;\n      ",
            "with strings": "\nvar str = \"\";\nfor (var item of \"foo\")\n  str += item;\nreturn str === \"foo\";\n      ",
            "with astral plane strings": "\nvar str = \"\";\nfor (var item of \"𠮷𠮶\")\n  str += item + \" \";\nreturn str === \"𠮷 𠮶 \";\n      ",
            "with generator instances": "\nvar result = \"\";\nvar iterable = (function*(){ yield 1; yield 2; yield 3; }());\nfor (var item of iterable) {\n  result += item;\n}\nreturn result === \"123\";\n      ",
            "with generic iterables": "\nvar result = \"\";\nvar iterable = global.__createIterableObject([1, 2, 3]);\nfor (var item of iterable) {\n  result += item;\n}\nreturn result === \"123\";\n      ",
            "with instances of generic iterables": "\nvar result = \"\";\nvar iterable = global.__createIterableObject([1, 2, 3]);\nfor (var item of Object.create(iterable)) {\n  result += item;\n}\nreturn result === \"123\";\n      ",
            "iterator closing, break": "\nvar closed = false;\nvar iter = __createIterableObject([1, 2, 3], {\n  'return': function(){ closed = true; return {}; }\n});\nfor (var it of iter) break;\nreturn closed;\n      ",
            "iterator closing, throw": "\nvar closed = false;\nvar iter = __createIterableObject([1, 2, 3], {\n  'return': function(){ closed = true; return {}; }\n});\ntry {\n  for (var it of iter) throw 0;\n} catch(e){}\nreturn closed;\n      "
        }
    }, {
        "title": "octal and binary literals",
        "tests": {
            "octal literals": "\nreturn 0o10 === 8 && 0O10 === 8;\n      ",
            "binary literals": "\nreturn 0b10 === 2 && 0B10 === 2;\n      ",
            "octal supported by Number()": "\nreturn Number('0o1') === 1;\n      ",
            "binary supported by Number()": "\nreturn Number('0b1') === 1;\n      "
        }
    }, {
        "title": "template literals",
        "tests": {
            "basic functionality": "\nvar a = \"ba\", b = \"QUX\";\nreturn `foo bar\n${a + \"z\"} ${b.toLowerCase()}` === \"foo bar\\nbaz qux\";\n      ",
            "toString conversion": "\nvar a = {\n  toString: function() { return \"foo\"; },\n  valueOf: function() { return \"bar\"; },\n};\nreturn `${a}` === \"foo\";\n      ",
            "tagged template literals": "\nvar called = false;\nfunction fn(parts, a, b) {\n  called = true;\n  return parts instanceof Array &&\n    parts[0]     === \"foo\"      &&\n    parts[1]     === \"bar\\n\"    &&\n    parts.raw[0] === \"foo\"      &&\n    parts.raw[1] === \"bar\\\\n\"   &&\n    a === 123                   &&\n    b === 456;\n}\nreturn fn `foo${123}bar\\n${456}` && called;\n      ",
            "passed array is frozen": "\nreturn (function(parts) {\n  return Object.isFrozen(parts) && Object.isFrozen(parts.raw);\n}) `foo${0}bar${0}baz`;\n      ",
            "line break normalisation": "\nvar cr   = eval(\"`x\" + String.fromCharCode(13)    + \"y`\");\nvar lf   = eval(\"`x\" + String.fromCharCode(10)    + \"y`\");\nvar crlf = eval(\"`x\" + String.fromCharCode(13,10) + \"y`\");\n\nreturn cr.length === 3 && lf.length === 3 && crlf.length === 3\n  && cr[1] === lf[1] && lf[1] === crlf[1] && crlf[1] === '\\n';\n      "
        }
    }, {
        "title": "RegExp \"y\" and \"u\" flags",
        "tests": {
            "\"y\" flag": "\nvar re = new RegExp('\\\\w', 'y');\nre.exec('xy');\nreturn (re.exec('xy')[0] === 'y');\n      ",
            "\"y\" flag, lastIndex": "\nvar re = new RegExp('yy', 'y');\nre.lastIndex = 3;\nvar result = re.exec('xxxyyxx')[0];\nreturn result === 'yy' && re.lastIndex === 5;\n      ",
            "\"u\" flag": "\nreturn \"𠮷\".match(/^.$/u)[0].length === 2;\n      ",
            "\"u\" flag, Unicode code point escapes": "\nreturn \"𝌆\".match(/\\u{1d306}/u)[0].length === 2;\n      ",
            "\"u\" flag, case folding": "\nreturn \"ſ\".match(/S/iu) && \"ſ\".match(/\\w/iu) && \"ſ\".match(/\\W/iu)\n && \"S\".match(/ſ/iu) && \"S\".match(/\\w/iu) && \"S\".match(/\\W/iu);\n      "
        }
    }, {
        "title": "destructuring, declarations",
        "tests": {
            "with arrays": "\nvar [a, , [b], c] = [5, null, [6]];\nreturn a === 5 && b === 6 && c === undefined;\n      ",
            "with sparse arrays": "\nvar [a, , b] = [,,,];\nreturn a === undefined && b === undefined;\n      ",
            "with strings": "\nvar [a, b, c] = \"ab\";\nreturn a === \"a\" && b === \"b\" && c === undefined;\n      ",
            "with astral plane strings": "\nvar [c] = \"𠮷𠮶\";\nreturn c === \"𠮷\";\n      ",
            "with generator instances": "\nvar [a, b, c] = (function*(){ yield 1; yield 2; }());\nreturn a === 1 && b === 2 && c === undefined;\n      ",
            "with generic iterables": "\nvar [a, b, c] = global.__createIterableObject([1, 2]);\nreturn a === 1 && b === 2 && c === undefined;\n      ",
            "with instances of generic iterables": "\nvar [a, b, c] = Object.create(global.__createIterableObject([1, 2]));\nreturn a === 1 && b === 2 && c === undefined;\n      ",
            "iterator closing": "\nvar closed = false;\nvar iter = global.__createIterableObject([1, 2, 3], {\n  'return': function(){ closed = true; return {}; }\n});\nvar [a, b] = iter;\nreturn closed;\n      ",
            "trailing commas in iterable patterns": "\nvar [a,] = [1];\nreturn a === 1;\n      ",
            "with objects": "\nvar {c, x:d, e} = {c:7, x:8};\nreturn c === 7 && d === 8 && e === undefined;\n      ",
            "object destructuring with primitives": "\nvar {toFixed} = 2;\nvar {slice} = '';\nreturn toFixed === Number.prototype.toFixed\n  && slice === String.prototype.slice;\n      ",
            "trailing commas in object patterns": "\nvar {a,} = {a:1};\nreturn a === 1;\n      ",
            "throws on null and undefined": "\ntry {\n  var {a} = null;\n  return false;\n} catch(e) {}\ntry {\n  var {b} = undefined;\n  return false;\n} catch(e) {}\nreturn true;\n      ",
            "computed properties": "\nvar qux = \"corge\";\nvar { [qux]: grault } = { corge: \"garply\" };\nreturn grault === \"garply\";\n      ",
            "multiples in a single var statement": "\nvar [a,b] = [5,6], {c,d} = {c:7,d:8};\nreturn a === 5 && b === 6 && c === 7 && d === 8;\n      ",
            "nested": "\nvar [e, {x:f, g}] = [9, {x:10}];\nvar {h, x:[i]} = {h:11, x:[12]};\nreturn e === 9 && f === 10 && g === undefined\n  && h === 11 && i === 12;\n      ",
            "in for-in loop heads": "\nfor(var [i, j, k] in { qux: 1 }) {\n  return i === \"q\" && j === \"u\" && k === \"x\";\n}\n      ",
            "in for-of loop heads": "\nfor(var [i, j, k] of [[1,2,3]]) {\n  return i === 1 && j === 2 && k === 3;\n}\n      ",
            "in catch heads": "\ntry {\n  throw [1,2];\n} catch([i,j]) {\n  try {\n    throw { k: 3, l: 4 };\n  } catch({k, l}) {\n    return i === 1 && j === 2 && k === 3 && l === 4;\n  }\n}\n      ",
            "rest": "\nvar [a, ...b] = [3, 4, 5];\nvar [c, ...d] = [6];\nreturn a === 3 && b instanceof Array && (b + \"\") === \"4,5\" &&\n   c === 6 && d instanceof Array && d.length === 0;\n      ",
            "defaults": "\nvar {a = 1, b = 0, z:c = 3} = {b:2, z:undefined};\nvar [d = 0, e = 5, f = 6] = [4,,undefined];\nreturn a === 1 && b === 2 && c === 3\n  && d === 4 && e === 5 && f === 6;\n      ",
            "defaults, let temporal dead zone": "\nvar {a, b = 2} = {a:1};\ntry {\n  eval(\"let {c = c} = {};\");\n  return false;\n} catch(e){}\ntry {\n  eval(\"let {c = d, d} = {d:1};\");\n  return false;\n} catch(e){}\nreturn a === 1 && b === 2;\n      "
        }
    }, {
        "title": "destructuring, assignment",
        "tests": {
            "with arrays": "\nvar a,b,c;\n[a, , [b], c] = [5, null, [6]];\nreturn a === 5 && b === 6 && c === undefined;\n      ",
            "with sparse arrays": "\nvar a, b;\n[a, , b] = [,,,];\nreturn a === undefined && b === undefined;\n      ",
            "with strings": "\nvar a,b,c;\n[a, b, c] = \"ab\";\nreturn a === \"a\" && b === \"b\" && c === undefined;\n      ",
            "with astral plane strings": "\nvar c;\n[c] = \"𠮷𠮶\";\nreturn c === \"𠮷\";\n      ",
            "with generator instances": "\nvar a,b,c;\n[a, b, c] = (function*(){ yield 1; yield 2; }());\nreturn a === 1 && b === 2 && c === undefined;\n      ",
            "with generic iterables": "\nvar a,b,c;\n[a, b, c] = global.__createIterableObject([1, 2]);\nreturn a === 1 && b === 2 && c === undefined;\n      ",
            "with instances of generic iterables": "\nvar a,b,c;\n[a, b, c] = Object.create(global.__createIterableObject([1, 2]));\nreturn a === 1 && b === 2 && c === undefined;\n      ",
            "iterator closing": "\nvar closed = false;\nvar iter = global.__createIterableObject([1, 2, 3], {\n  'return': function(){ closed = true; return {}; }\n});\nvar a,b;\n[a, b] = iter;\nreturn closed;\n      ",
            "iterable destructuring expression": "\nvar a, b, iterable = [1,2];\nreturn ([a, b] = iterable) === iterable;\n      ",
            "chained iterable destructuring": "\nvar a,b,c,d;\n[a,b] = [c,d] = [1,2];\nreturn a === 1 && b === 2 && c === 1 && d === 2;\n      ",
            "trailing commas in iterable patterns": "\nvar a;\n[a,] = [1];\nreturn a === 1;\n      ",
            "with objects": "\nvar c,d,e;\n({c, x:d, e} = {c:7, x:8});\nreturn c === 7 && d === 8 && e === undefined;\n      ",
            "object destructuring with primitives": "\nvar toFixed, slice;\n({toFixed} = 2);\n({slice} = '');\nreturn toFixed === Number.prototype.toFixed\n  && slice === String.prototype.slice;\n      ",
            "trailing commas in object patterns": "\nvar a;\n({a,} = {a:1});\nreturn a === 1;\n      ",
            "object destructuring expression": "\nvar a, b, obj = { a:1, b:2 };\nreturn ({a,b} = obj) === obj;\n      ",
            "parenthesised left-hand-side is a syntax error": "\nvar a, b;\n({a,b} = {a:1,b:2});\ntry {\n  eval(\"({a,b}) = {a:3,b:4};\");\n}\ncatch(e) {\n  return a === 1 && b === 2;\n}\n      ",
            "chained object destructuring": "\nvar a,b,c,d;\n({a,b} = {c,d} = {a:1,b:2,c:3,d:4});\nreturn a === 1 && b === 2 && c === 3 && d === 4;\n      ",
            "throws on null and undefined": "\nvar a,b;\ntry {\n  ({a} = null);\n  return false;\n} catch(e) {}\ntry {\n  ({b} = undefined);\n  return false;\n} catch(e) {}\nreturn true;\n      ",
            "computed properties": "\nvar grault, qux = \"corge\";\n({ [qux]: grault } = { corge: \"garply\" });\nreturn grault === \"garply\";\n      ",
            "nested": "\nvar e,f,g,h,i;\n[e, {x:f, g}] = [9, {x:10}];\n({h, x:[i]} = {h:11, x:[12]});\nreturn e === 9 && f === 10 && g === undefined\n  && h === 11 && i === 12;\n      ",
            "rest": "\nvar a,b,c,d;\n[a, ...b] = [3, 4, 5];\n[c, ...d] = [6];\nreturn a === 3 && b instanceof Array && (b + \"\") === \"4,5\" &&\n   c === 6 && d instanceof Array && d.length === 0;\n      ",
            "nested rest": "\nvar a = [1, 2, 3], first, last;\n[first, ...[a[2], last]] = a;\nreturn first === 1 && last === 3 && (a + \"\") === \"1,2,2\";\n      ",
            "empty patterns": "\n[] = [1,2];\n({} = {a:1,b:2});\nreturn true;\n      ",
            "defaults": "\nvar a,b,c,d,e,f;\n({a = 1, b = 0, z:c = 3} = {b:2, z:undefined});\n[d = 0, e = 5, f = 6] = [4,,undefined];\nreturn a === 1 && b === 2 && c === 3\n  && d === 4 && e === 5 && f === 6;\n      "
        }
    }, {
        "title": "destructuring, parameters",
        "tests": {
            "with arrays": "\nreturn function([a, , [b], c]) {\n  return a === 5 && b === 6 && c === undefined;\n}([5, null, [6]]);\n      ",
            "with sparse arrays": "\nreturn function([a, , b]) {\n  return a === undefined && b === undefined;\n}([,,,]);\n      ",
            "with strings": "\nreturn function([a, b, c]) {\n  return a === \"a\" && b === \"b\" && c === undefined;\n}(\"ab\");\n      ",
            "with astral plane strings": "\nreturn function([c]) {\n  return c === \"𠮷\";\n}(\"𠮷𠮶\");\n      ",
            "with generator instances": "\nreturn function([a, b, c]) {\n  return a === 1 && b === 2 && c === undefined;\n}(function*(){ yield 1; yield 2; }());\n      ",
            "with generic iterables": "\nreturn function([a, b, c]) {\n  return a === 1 && b === 2 && c === undefined;\n}(global.__createIterableObject([1, 2]));\n      ",
            "with instances of generic iterables": "\nreturn function([a, b, c]) {\n  return a === 1 && b === 2 && c === undefined;\n}(Object.create(global.__createIterableObject([1, 2])));\n      ",
            "iterator closing": "\nvar closed = false;\nvar iter = global.__createIterableObject([1, 2, 3], {\n  'return': function(){ closed = true; return {}; }\n});\n(function([a,b]) {}(iter));\nreturn closed;\n      ",
            "trailing commas in iterable patterns": "\nreturn function([a,]) {\n  return a === 1;\n}([1]);\n      ",
            "with objects": "\nreturn function({c, x:d, e}) {\n  return c === 7 && d === 8 && e === undefined;\n}({c:7, x:8});\n      ",
            "object destructuring with primitives": "\nreturn function({toFixed}, {slice}) {\n  return toFixed === Number.prototype.toFixed\n    && slice === String.prototype.slice;\n}(2,'');\n      ",
            "trailing commas in object patterns": "\nreturn function({a,}) {\n  return a === 1;\n}({a:1});\n      ",
            "throws on null and undefined": "\ntry {\n  (function({a}){}(null));\n  return false;\n} catch(e) {}\ntry {\n  (function({b}){}(undefined));\n  return false;\n} catch(e) {}\nreturn true;\n      ",
            "computed properties": "\nvar qux = \"corge\";\nreturn function({ [qux]: grault }) {\n  return grault === \"garply\";\n}({ corge: \"garply\" });\n      ",
            "nested": "\nreturn function([e, {x:f, g}], {h, x:[i]}) {\n  return e === 9 && f === 10 && g === undefined\n    && h === 11 && i === 12;\n}([9, {x:10}],{h:11, x:[12]});\n      ",
            "'arguments' interaction": "\nreturn (function({a, x:b, y:e}, [c, d]) {\n  return arguments[0].a === 1 && arguments[0].x === 2\n    && !(\"y\" in arguments[0]) && arguments[1] + '' === \"3,4\";\n}({a:1, x:2}, [3, 4]));\n      ",
            "new Function() support": "\nreturn new Function(\"{a, x:b, y:e}\",\"[c, d]\",\n  \"return a === 1 && b === 2 && c === 3 && \"\n  + \"d === 4 && e === undefined;\"\n)({a:1, x:2}, [3, 4]);\n      ",
            "in parameters, function 'length' property": "\nreturn function({a, b}, [c, d]){}.length === 2;\n      ",
            "rest": "\nreturn function([a, ...b], [c, ...d]) {\n  return a === 3 && b instanceof Array && (b + \"\") === \"4,5\" &&\n     c === 6 && d instanceof Array && d.length === 0;\n}([3, 4, 5], [6]);\n      ",
            "empty patterns": "\nreturn function ([],{}){\n  return arguments[0] + '' === \"3,4\" && arguments[1].x === \"foo\";\n}([3,4],{x:\"foo\"});\n      ",
            "defaults": "\nreturn (function({a = 1, b = 0, c = 3, x:d = 0, y:e = 5},\n    [f = 6, g = 0, h = 8]) {\n  return a === 1 && b === 2 && c === 3 && d === 4 &&\n    e === 5 && f === 6 && g === 7 && h === 8;\n}({b:2, c:undefined, x:4},[, 7, undefined]));\n      ",
            "defaults, separate scope": "\nreturn (function({a=function(){\n  return typeof b === 'undefined';\n}}){\n  var b = 1;\n  return a();\n}({}));\n      ",
            "defaults, new Function() support": "\nreturn new Function(\"{a = 1, b = 0, c = 3, x:d = 0, y:e = 5}\",\n  \"return a === 1 && b === 2 && c === 3 && d === 4 && e === 5;\"\n)({b:2, c:undefined, x:4});\n      "
        }
    }, {
        "title": "Unicode code point escapes",
        "tests": {
            "in strings": "\nreturn '\\u{1d306}' == '\\ud834\\udf06';\n      ",
            "in identifiers": "\nvar \\u{102C0} = { \\u{102C0} : 2 };\nreturn \\u{102C0}['\\ud800\\udec0'] === 2;\n      "
        }
    }, {
        "title": "new.target",
        "tests": {
            "in constructors": "\nvar passed = false;\nnew function f() {\n  passed = (new.target === f);\n}();\n(function() {\n  passed &= (new.target === undefined);\n}());\nreturn passed;\n      ",
            "assignment is an early error": "\nvar passed = false;\nnew function f() {\n  passed = (new.target === f);\n}();\n\ntry {\n  Function(\"new.target = function(){};\");\n} catch(e) {\n  return passed;\n}\n      "
        }
    }],
    "Bindings": [{
        "title": "const",
        "tests": {
            "basic support": "\nconst foo = 123;\nreturn (foo === 123);\n      ",
            "is block-scoped": "\nconst bar = 123;\n{ const bar = 456; }\nreturn bar === 123;\n      ",
            "cannot be in statements": "\nconst bar = 1;\ntry {\n  Function(\"if(true) const baz = 1;\")();\n} catch(e) {\n  return true;\n}\n      ",
            "redefining a const is an error": "\nconst baz = 1;\ntry {\n  Function(\"const foo = 1; foo = 2;\")();\n} catch(e) {\n  return true;\n}\n      ",
            "for loop statement scope": "\nconst baz = 1;\nfor(const baz = 0; false;) {}\nreturn baz === 1;\n",
            "for-in loop iteration scope": "\nvar scopes = [];\nfor(const i in { a:1, b:1 }) {\n  scopes.push(function(){ return i; });\n}\nreturn (scopes[0]() === \"a\" && scopes[1]() === \"b\");\n      ",
            "for-of loop iteration scope": "\nvar scopes = [];\nfor(const i of ['a','b']) {\n  scopes.push(function(){ return i; });\n}\nreturn (scopes[0]() === \"a\" && scopes[1]() === \"b\");\n      ",
            "temporal dead zone": "\nvar passed = (function(){ try { qux; } catch(e) { return true; }}());\nfunction fn() { passed &= qux === 456; }\nconst qux = 456;\nfn();\nreturn passed;\n      ",
            "basic support (strict mode)": "\n\"use strict\";\nconst foo = 123;\nreturn (foo === 123);\n      ",
            "is block-scoped (strict mode)": "\n'use strict';\nconst bar = 123;\n{ const bar = 456; }\nreturn bar === 123;\n      ",
            "cannot be in statements (strict mode)": "\n'use strict';\nconst bar = 1;\ntry {\n  Function(\"'use strict'; if(true) const baz = 1;\")();\n} catch(e) {\n  return true;\n}\n      ",
            "redefining a const (strict mode)": "\n'use strict';\nconst baz = 1;\ntry {\n  Function(\"'use strict'; const foo = 1; foo = 2;\")();\n} catch(e) {\n  return true;\n}\n      ",
            "for loop statement scope (strict mode)": "\n'use strict';\nconst baz = 1;\nfor(const baz = 0; false;) {}\nreturn baz === 1;\n      ",
            "for-in loop iteration scope (strict mode)": "\n'use strict';\nvar scopes = [];\nfor(const i in { a:1, b:1 }) {\n  scopes.push(function(){ return i; });\n}\nreturn (scopes[0]() === \"a\" && scopes[1]() === \"b\");\n      ",
            "for-of loop iteration scope (strict mode)": "\n'use strict';\nvar scopes = [];\nfor(const i of ['a','b']) {\n  scopes.push(function(){ return i; });\n}\nreturn (scopes[0]() === \"a\" && scopes[1]() === \"b\");\n      ",
            "temporal dead zone (strict mode)": "\n'use strict';\nvar passed = (function(){ try { qux; } catch(e) { return true; }}());\nfunction fn() { passed &= qux === 456; }\nconst qux = 456;\nfn();\nreturn passed;\n      "
        }
    }, {
        "title": "let",
        "tests": {
            "basic support": "\nlet foo = 123;\nreturn (foo === 123);\n      ",
            "is block-scoped": "\nlet bar = 123;\n{ let bar = 456; }\nreturn bar === 123;\n      ",
            "cannot be in statements": "\nlet bar = 1;\ntry {\n  Function(\"if(true) let baz = 1;\")();\n} catch(e) {\n  return true;\n}\n      ",
            "for loop statement scope": "\nlet baz = 1;\nfor(let baz = 0; false;) {}\nreturn baz === 1;\n      ",
            "temporal dead zone": "\nvar passed = (function(){ try {  qux; } catch(e) { return true; }}());\nfunction fn() { passed &= qux === 456; }\nlet qux = 456;\nfn();\nreturn passed;\n      ",
            "for/for-in loop iteration scope": "\nlet scopes = [];\nfor(let i = 0; i < 2; i++) {\n  scopes.push(function(){ return i; });\n}\nlet passed = (scopes[0]() === 0 && scopes[1]() === 1);\n\nscopes = [];\nfor(let i in { a:1, b:1 }) {\n  scopes.push(function(){ return i; });\n}\npassed &= (scopes[0]() === \"a\" && scopes[1]() === \"b\");\nreturn passed;\n      ",
            "basic support (strict mode)": "\n'use strict';\nlet foo = 123;\nreturn (foo === 123);\n      ",
            "is block-scoped (strict mode)": "\n'use strict';\nlet bar = 123;\n{ let bar = 456; }\nreturn bar === 123;\n      ",
            "cannot be in statements (strict mode)": "\n'use strict';\nlet bar = 1;\ntry {\n  Function(\"'use strict'; if(true) let baz = 1;\")();\n} catch(e) {\n  return true;\n}\n      ",
            "for loop statement scope (strict mode)": "\n'use strict';\nlet baz = 1;\nfor(let baz = 0; false;) {}\nreturn baz === 1;\n      ",
            "temporal dead zone (strict mode)": "\n'use strict';\nvar passed = (function(){ try {  qux; } catch(e) { return true; }}());\nfunction fn() { passed &= qux === 456; }\nlet qux = 456;\nfn();\nreturn passed;\n      ",
            "for/for-in loop iteration scope (strict mode)": "\n'use strict';\nlet scopes = [];\nfor(let i = 0; i < 2; i++) {\n  scopes.push(function(){ return i; });\n}\nlet passed = (scopes[0]() === 0 && scopes[1]() === 1);\n\nscopes = [];\nfor(let i in { a:1, b:1 }) {\n  scopes.push(function(){ return i; });\n}\npassed &= (scopes[0]() === \"a\" && scopes[1]() === \"b\");\nreturn passed;\n      "
        }
    }],
    "Functions": [{
        "title": "arrow functions",
        "tests": {
            "0 parameters": "\nreturn (() => 5)() === 5;\n      ",
            "1 parameter, no brackets": "\nvar b = x => x + \"foo\";\nreturn (b(\"fee fie foe \") === \"fee fie foe foo\");\n      ",
            "multiple parameters": "\nvar c = (v, w, x, y, z) => \"\" + v + w + x + y + z;\nreturn (c(6, 5, 4, 3, 2) === \"65432\");\n      ",
            "lexical \"this\" binding": "\nvar d = { x : \"bar\", y : function() { return z => this.x + z; }}.y();\nvar e = { x : \"baz\", y : d };\nreturn d(\"ley\") === \"barley\" && e.y(\"ley\") === \"barley\";\n      ",
            "\"this\" unchanged by call or apply": "\nvar d = { x : \"foo\", y : function() { return () => this.x; }};\nvar e = { x : \"bar\" };\nreturn d.y().call(e) === \"foo\" && d.y().apply(e) === \"foo\";\n      ",
            "can't be bound, can be curried": "\nvar d = { x : \"bar\", y : function() { return z => this.x + z; }};\nvar e = { x : \"baz\" };\nreturn d.y().bind(e, \"ley\")() === \"barley\";\n      ",
            "lexical \"arguments\" binding": "\nvar f = (function() { return z => arguments[0]; }(5));\nreturn f(6) === 5;\n      ",
            "no line break between params and =>": "\nreturn (() => {\n  try { Function(\"x\\n => 2\")(); } catch(e) { return true; }\n})();\n      ",
            "correct precedence": "\nreturn (() => {\n  try { Function(\"0 || () => 2\")(); } catch(e) { return true; }\n})();\n      ",
            "no \"prototype\" property": "\nvar a = () => 5;\nreturn !a.hasOwnProperty(\"prototype\");\n      ",
            "lexical \"super\" binding in constructors": "\nvar received;\n\nclass B {\n  constructor (arg) {\n    received = arg;\n  }\n}\nclass C extends B {\n  constructor () {\n    var callSuper = () => super('foo');\n    callSuper();\n  }\n}\nreturn new C instanceof C && received === 'foo'\n      ",
            "lexical \"super\" binding in methods": "\nclass B {\n  qux() {\n    return \"quux\";\n  }\n}\nclass C extends B {\n  baz() {\n    return x => super.qux();\n  }\n}\nvar arrow = new C().baz();\nreturn arrow() === \"quux\";\n      ",
            "lexical \"new.target\" binding": "\nfunction C() {\n  return x => new.target;\n}\nreturn new C()() === C && C()() === undefined;\n      "
        }
    }, {
        "title": "class",
        "tests": {
            "class statement": "\nclass C {}\nreturn typeof C === \"function\";\n      ",
            "is block-scoped": "\nclass C {}\nvar c1 = C;\n{\n  class C {}\n  var c2 = C;\n}\nreturn C === c1;\n      ",
            "class expression": "\nreturn typeof class C {} === \"function\";\n      ",
            "anonymous class": "\nreturn typeof class {} === \"function\";\n      ",
            "constructor": "\nclass C {\n  constructor() { this.x = 1; }\n}\nreturn C.prototype.constructor === C\n  && new C().x === 1;\n      ",
            "prototype methods": "\nclass C {\n  method() { return 2; }\n}\nreturn typeof C.prototype.method === \"function\"\n  && new C().method() === 2;\n      ",
            "string-keyed methods": "\nclass C {\n  \"foo bar\"() { return 2; }\n}\nreturn typeof C.prototype[\"foo bar\"] === \"function\"\n  && new C()[\"foo bar\"]() === 2;\n      ",
            "computed prototype methods": "\nvar foo = \"method\";\nclass C {\n  [foo]() { return 2; }\n}\nreturn typeof C.prototype.method === \"function\"\n  && new C().method() === 2;\n      ",
            "optional semicolons": "\nclass C {\n  ;\n  method() { return 2; };\n  method2() { return 2; }\n  method3() { return 2; };\n}\nreturn typeof C.prototype.method === \"function\"\n  && typeof C.prototype.method2 === \"function\"\n  && typeof C.prototype.method3 === \"function\";\n      ",
            "static methods": "\nclass C {\n  static method() { return 3; }\n}\nreturn typeof C.method === \"function\"\n  && C.method() === 3;\n      ",
            "computed static methods": "\nvar foo = \"method\";\nclass C {\n  static [foo]() { return 3; }\n}\nreturn typeof C.method === \"function\"\n  && C.method() === 3;\n      ",
            "accessor properties": "\nvar baz = false;\nclass C {\n  get foo() { return \"foo\"; }\n  set bar(x) { baz = x; }\n}\nnew C().bar = true;\nreturn new C().foo === \"foo\" && baz;\n      ",
            "computed accessor properties": "\nvar garply = \"foo\", grault = \"bar\", baz = false;\nclass C {\n  get [garply]() { return \"foo\"; }\n  set [grault](x) { baz = x; }\n}\nnew C().bar = true;\nreturn new C().foo === \"foo\" && baz;\n      ",
            "static accessor properties": "\nvar baz = false;\nclass C {\n  static get foo() { return \"foo\"; }\n  static set bar(x) { baz = x; }\n}\nC.bar = true;\nreturn C.foo === \"foo\" && baz;\n      ",
            "computed static accessor properties": "\nvar garply = \"foo\", grault = \"bar\", baz = false;\nclass C {\n  static get [garply]() { return \"foo\"; }\n  static set [grault](x) { baz = x; }\n}\nC.bar = true;\nreturn C.foo === \"foo\" && baz;\n      ",
            "class name is lexically scoped": "\nclass C {\n  method() { return typeof C === \"function\"; }\n}\nvar M = C.prototype.method;\nC = undefined;\nreturn C === undefined && M();\n      ",
            "computed names, temporal dead zone": "\ntry {\n  var B = class C {\n    [C](){}\n  }\n} catch(e) {\n  return true;\n}\n      ",
            "methods aren't enumerable": "\nclass C {\n  foo() {}\n  static bar() {}\n}\nreturn !C.prototype.propertyIsEnumerable(\"foo\") && !C.propertyIsEnumerable(\"bar\");\n      ",
            "implicit strict mode": "\nclass C {\n  static method() { return this === undefined; }\n}\nreturn (0,C.method)();\n      ",
            "constructor requires new": "\nclass C {}\ntry {\n  C();\n}\ncatch(e) {\n  return true;\n}\n      ",
            "extends": "\nclass B {}\nclass C extends B {}\nreturn new C() instanceof B\n  && B.isPrototypeOf(C);\n      ",
            "extends expressions": "\nvar B;\nclass C extends (B = class {}) {}\nreturn new C() instanceof B\n  && B.isPrototypeOf(C);\n      ",
            "extends null": "\nclass C extends null {\n  constructor() { return Object.create(null); }\n}\nreturn Function.prototype.isPrototypeOf(C)\n  && Object.getPrototypeOf(C.prototype) === null;\n      ",
            "new.target": "\nvar passed = false;\nnew function f() {\n  passed = new.target === f;\n}();\n\nclass A {\n  constructor() {\n    passed &= new.target === B;\n  }\n}\nclass B extends A {}\nnew B();\nreturn passed;\n      "
        }
    }, {
        "title": "super",
        "tests": {
            "statement in constructors": "\nvar passed = false;\nclass B {\n  constructor(a) { passed = (a === \"barbaz\"); }\n}\nclass C extends B {\n  constructor(a) { super(\"bar\" + a); }\n}\nnew C(\"baz\");\nreturn passed;\n      ",
            "expression in constructors": "\nclass B {\n  constructor(a) { return [\"foo\" + a]; }\n}\nclass C extends B {\n  constructor(a) { return super(\"bar\" + a); }\n}\nreturn new C(\"baz\")[0] === \"foobarbaz\";\n      ",
            "in methods, property access": "\nclass B {}\nB.prototype.qux = \"foo\";\nB.prototype.corge = \"baz\";\nclass C extends B {\n  quux(a) { return super.qux + a + super[\"corge\"]; }\n}\nC.prototype.qux = \"garply\";\nreturn new C().quux(\"bar\") === \"foobarbaz\";\n      ",
            "in methods, method calls": "\nclass B {\n  qux(a) { return \"foo\" + a; }\n}\nclass C extends B {\n  qux(a) { return super.qux(\"bar\" + a); }\n}\nreturn new C().qux(\"baz\") === \"foobarbaz\";\n      ",
            "method calls use correct \"this\" binding": "\nclass B {\n  qux(a) { return this.foo + a; }\n}\nclass C extends B {\n  qux(a) { return super.qux(\"bar\" + a); }\n}\nvar obj = new C();\nobj.foo = \"foo\";\nreturn obj.qux(\"baz\") === \"foobarbaz\";\n      ",
            "constructor calls use correct \"new.target\" binding": "\nvar passed;\nclass B {\n  constructor() { passed = (new.target === C); }\n}\nclass C extends B {\n  constructor() { super(); }\n}\nnew C();\nreturn passed;\n      ",
            "is statically bound": "\nclass B {\n  qux() { return \"bar\"; }\n}\nclass C extends B {\n  qux() { return super.qux() + this.corge; }\n}\nvar obj = {\n  qux: C.prototype.qux,\n  corge: \"ley\"\n};\nreturn obj.qux() === \"barley\";\n      ",
            "super() invokes the correct constructor": "\n// checks that super() is *not* a synonym of super.constructor()\nvar passed;\nclass B {\n    constructor() {\n        passed = true;\n    }\n};\nB.prototype.constructor = function () {\n    passed = false;\n};\nclass C extends B { };\nnew C;\nreturn passed;\n      "
        }
    }, {
        "title": "generators",
        "tests": {
            "basic functionality": "\nfunction * generator(){\n  yield 5; yield 6;\n};\nvar iterator = generator();\nvar item = iterator.next();\nvar passed = item.value === 5 && item.done === false;\nitem = iterator.next();\npassed    &= item.value === 6 && item.done === false;\nitem = iterator.next();\npassed    &= item.value === undefined && item.done === true;\nreturn passed;\n      ",
            "generator function expressions": "\nvar generator = function * (){\n  yield 5; yield 6;\n};\nvar iterator = generator();\nvar item = iterator.next();\nvar passed = item.value === 5 && item.done === false;\nitem = iterator.next();\npassed    &= item.value === 6 && item.done === false;\nitem = iterator.next();\npassed    &= item.value === undefined && item.done === true;\nreturn passed;\n      ",
            "correct \"this\" binding": "\nfunction * generator(){\n  yield this.x; yield this.y;\n};\nvar iterator = { g: generator, x: 5, y: 6 }.g();\nvar item = iterator.next();\nvar passed = item.value === 5 && item.done === false;\nitem = iterator.next();\npassed    &= item.value === 6 && item.done === false;\nitem = iterator.next();\npassed    &= item.value === undefined && item.done === true;\nreturn passed;\n      ",
            "can't use \"this\" with new": "\nfunction * generator(){\n  yield this.x; yield this.y;\n};\ntry {\n  (new generator()).next();\n}\ncatch (e) {\n  return true;\n}\n      ",
            "sending": "\nvar sent;\nfunction * generator(){\n  sent = [yield 5, yield 6];\n};\nvar iterator = generator();\niterator.next();\niterator.next(\"foo\");\niterator.next(\"bar\");\nreturn sent[0] === \"foo\" && sent[1] === \"bar\";\n      ",
            "%GeneratorPrototype%": "\nfunction * generatorFn(){}\nvar ownProto = Object.getPrototypeOf(generatorFn());\nvar passed = ownProto === generatorFn.prototype;\n\nvar sharedProto = Object.getPrototypeOf(ownProto);\npassed &= sharedProto !== Object.prototype &&\n  sharedProto === Object.getPrototypeOf(function*(){}.prototype) &&\n  sharedProto.hasOwnProperty('next');\n\nreturn passed;\n      ",
            "%GeneratorPrototype% prototype chain": "\nfunction * generatorFn(){}\nvar g = generatorFn();\nvar ownProto = Object.getPrototypeOf(g);\nvar passed = ownProto === generatorFn.prototype;\n\nvar sharedProto = Object.getPrototypeOf(ownProto);\nvar iterProto = Object.getPrototypeOf(sharedProto);\n\npassed &= iterProto.hasOwnProperty(Symbol.iterator) &&\n  !sharedProto     .hasOwnProperty(Symbol.iterator) &&\n  !ownProto        .hasOwnProperty(Symbol.iterator) &&\n  g[Symbol.iterator]() === g;\n\nreturn passed;\n      ",
            "%GeneratorPrototype%.constructor": "\nfunction * g (){}\nvar iterator = new g.constructor(\"a\",\"b\",\"c\",\"yield a; yield b; yield c;\")(5,6,7);\nvar item = iterator.next();\nvar passed = item.value === 5 && item.done === false;\nitem = iterator.next();\npassed    &= item.value === 6 && item.done === false;\nitem = iterator.next();\npassed    &= item.value === 7 && item.done === false;\nitem = iterator.next();\npassed    &= item.value === undefined && item.done === true;\n\npassed &= g.constructor === (function*(){}).constructor;\nreturn passed;\n      ",
            "%GeneratorPrototype%.throw": "\nvar passed = false;\nfunction * generator(){\n  try {\n    yield 5; yield 6;\n  } catch(e) {\n    passed = (e === \"foo\");\n  }\n};\nvar iterator = generator();\niterator.next();\niterator.throw(\"foo\");\nreturn passed;\n      ",
            "%GeneratorPrototype%.return": "\nfunction * generator(){\n  yield 5; yield 6;\n};\nvar iterator = generator();\nvar item = iterator.next();\nvar passed = item.value === 5 && item.done === false;\nitem = iterator.return(\"quxquux\");\npassed    &= item.value === \"quxquux\" && item.done === true;\nitem = iterator.next();\npassed    &= item.value === undefined && item.done === true;\nreturn passed;\n      ",
            "yield operator precedence": "\nvar passed;\nfunction * generator(){\n  passed = yield 0 ? true : false;\n};\nvar iterator = generator();\niterator.next();\niterator.next(true);\nreturn passed;\n      ",
            "yield *, arrays": "\nvar iterator = (function * generator() {\n  yield * [5, 6];\n}());\nvar item = iterator.next();\nvar passed = item.value === 5 && item.done === false;\nitem = iterator.next();\npassed    &= item.value === 6 && item.done === false;\nitem = iterator.next();\npassed    &= item.value === undefined && item.done === true;\nreturn passed;\n      ",
            "yield *, sparse arrays": "\nvar iterator = (function * generator() {\n  yield * [,,];\n}());\nvar item = iterator.next();\nvar passed = item.value === undefined && item.done === false;\nitem = iterator.next();\npassed    &= item.value === undefined && item.done === false;\nitem = iterator.next();\npassed    &= item.value === undefined && item.done === true;\nreturn passed;\n      ",
            "yield *, strings": "\nvar iterator = (function * generator() {\n  yield * \"56\";\n}());\nvar item = iterator.next();\nvar passed = item.value === \"5\" && item.done === false;\nitem = iterator.next();\npassed    &= item.value === \"6\" && item.done === false;\nitem = iterator.next();\npassed    &= item.value === undefined && item.done === true;\nreturn passed;\n      ",
            "yield *, astral plane strings": "\nvar iterator = (function * generator() {\n  yield * \"𠮷𠮶\";\n}());\nvar item = iterator.next();\nvar passed = item.value === \"𠮷\" && item.done === false;\nitem = iterator.next();\npassed    &= item.value === \"𠮶\" && item.done === false;\nitem = iterator.next();\npassed    &= item.value === undefined && item.done === true;\nreturn passed;\n      ",
            "yield *, generator instances": "\nvar iterator = (function * generator() {\n  yield * (function*(){ yield 5; yield 6; yield 7; }());\n}());\nvar item = iterator.next();\nvar passed = item.value === 5 && item.done === false;\nitem = iterator.next();\npassed    &= item.value === 6 && item.done === false;\nitem = iterator.next();\npassed    &= item.value === 7 && item.done === false;\nitem = iterator.next();\npassed    &= item.value === undefined && item.done === true;\nreturn passed;\n      ",
            "yield *, generic iterables": "\nvar iterator = (function * generator() {\n  yield * global.__createIterableObject([5, 6, 7]);\n}());\nvar item = iterator.next();\nvar passed = item.value === 5 && item.done === false;\nitem = iterator.next();\npassed    &= item.value === 6 && item.done === false;\nitem = iterator.next();\npassed    &= item.value === 7 && item.done === false;\nitem = iterator.next();\npassed    &= item.value === undefined && item.done === true;\nreturn passed;\n      ",
            "yield *, instances of iterables": "\nvar iterator = (function * generator() {\n  yield * Object.create(__createIterableObject([5, 6, 7]));\n}());\nvar item = iterator.next();\nvar passed = item.value === 5 && item.done === false;\nitem = iterator.next();\npassed    &= item.value === 6 && item.done === false;\nitem = iterator.next();\npassed    &= item.value === 7 && item.done === false;\nitem = iterator.next();\npassed    &= item.value === undefined && item.done === true;\nreturn passed;\n      ",
            "yield * on non-iterables is a runtime error": "\nvar iterator = (function * generator() {\n  yield * [5];\n}());\nvar item = iterator.next();\nvar passed = item.value === 5 && item.done === false;\niterator = (function * generator() {\n  yield * 5;\n}());\ntry {\n  iterator.next();\n} catch (e) {\n  return passed;\n}\n      ",
            "yield *, iterator closing": "\nvar closed = '';\nvar iter = __createIterableObject([1, 2, 3], {\n  'return': function(){\n    closed += 'a';\n    return {done: true};\n  }\n});\nvar gen = (function* generator(){\n  try {\n    yield *iter;\n  } finally {\n    closed += 'b';\n  }\n})();\ngen.next();\ngen['return']();\nreturn closed === 'ab';\n      ",
            "yield *, iterator closing via throw()": "\nvar closed = false;\nvar iter = global.__createIterableObject([1, 2, 3], {\n  'throw': undefined,\n  'return': function() {\n    closed = true;\n    return {done: true};\n  }\n});\nvar gen = (function*(){\n  try {\n    yield *iter;\n  } catch(e){}\n})();\ngen.next();\ngen['throw']();\nreturn closed;\n      ",
            "shorthand generator methods": "\nvar o = {\n  * generator() {\n    yield 5; yield 6;\n  },\n};\nvar iterator = o.generator();\nvar item = iterator.next();\nvar passed = item.value === 5 && item.done === false;\nitem = iterator.next();\npassed    &= item.value === 6 && item.done === false;\nitem = iterator.next();\npassed    &= item.value === undefined && item.done === true;\nreturn passed;\n      ",
            "string-keyed shorthand generator methods": "\nvar o = {\n  * \"foo bar\"() {\n    yield 5; yield 6;\n  },\n};\nvar iterator = o[\"foo bar\"]();\nvar item = iterator.next();\nvar passed = item.value === 5 && item.done === false;\nitem = iterator.next();\npassed    &= item.value === 6 && item.done === false;\nitem = iterator.next();\npassed    &= item.value === undefined && item.done === true;\nreturn passed;\n      ",
            "computed shorthand generators": "\nvar garply = \"generator\";\nvar o = {\n  * [garply] () {\n    yield 5; yield 6;\n  },\n};\nvar iterator = o.generator();\nvar item = iterator.next();\nvar passed = item.value === 5 && item.done === false;\nitem = iterator.next();\npassed    &= item.value === 6 && item.done === false;\nitem = iterator.next();\npassed    &= item.value === undefined && item.done === true;\nreturn passed;\n      ",
            "shorthand generator methods, classes": "\nclass C {\n  * generator() {\n    yield 5; yield 6;\n  }\n};\nvar iterator = new C().generator();\nvar item = iterator.next();\nvar passed = item.value === 5 && item.done === false;\nitem = iterator.next();\npassed    &= item.value === 6 && item.done === false;\nitem = iterator.next();\npassed    &= item.value === undefined && item.done === true;\nreturn passed;\n      ",
            "computed shorthand generators, classes": "\nvar garply = \"generator\";\nclass C {\n  * [garply] () {\n    yield 5; yield 6;\n  }\n}\nvar iterator = new C().generator();\nvar item = iterator.next();\nvar passed = item.value === 5 && item.done === false;\nitem = iterator.next();\npassed    &= item.value === 6 && item.done === false;\nitem = iterator.next();\npassed    &= item.value === undefined && item.done === true;\nreturn passed;\n      ",
            "shorthand generators can't be constructors": "\nclass C {\n  * generator() {\n    yield 5; yield 6;\n  }\n};\ntry {\n  Function(\"class D { * constructor() { return {}; } }\");\n} catch(e) {\n  return true;\n}\n      "
        }
    }],
    "Built-ins": [{
        "title": "typed arrays",
        "tests": {
            "Int8Array": "\nvar buffer = new ArrayBuffer(64);\nvar view = new Int8Array(buffer);         view[0] = 0x80;\nreturn view[0] === -0x80;\n      ",
            "Uint8Array": "\nvar buffer = new ArrayBuffer(64);\nvar view = new Uint8Array(buffer);        view[0] = 0x100;\nreturn view[0] === 0;\n      ",
            "Uint8ClampedArray": "\nvar buffer = new ArrayBuffer(64);\nvar view = new Uint8ClampedArray(buffer); view[0] = 0x100;\nreturn view[0] === 0xFF;\n      ",
            "Int16Array": "\nvar buffer = new ArrayBuffer(64);\nvar view = new Int16Array(buffer);        view[0] = 0x8000;\nreturn view[0] === -0x8000;\n      ",
            "Uint16Array": "\nvar buffer = new ArrayBuffer(64);\nvar view = new Uint16Array(buffer);       view[0] = 0x10000;\nreturn view[0] === 0;\n      ",
            "Int32Array": "\nvar buffer = new ArrayBuffer(64);\nvar view = new Int32Array(buffer);        view[0] = 0x80000000;\nreturn view[0] === -0x80000000;\n      ",
            "Uint32Array": "\nvar buffer = new ArrayBuffer(64);\nvar view = new Uint32Array(buffer);       view[0] = 0x100000000;\nreturn view[0] === 0;\n      ",
            "Float32Array": "\nvar buffer = new ArrayBuffer(64);\nvar view = new Float32Array(buffer);       view[0] = 0.1;\nreturn view[0] === 0.10000000149011612;\n      ",
            "Float64Array": "\nvar buffer = new ArrayBuffer(64);\nvar view = new Float64Array(buffer);       view[0] = 0.1;\nreturn view[0] === 0.1;\n      ",
            "DataView (Int8)": "\nvar buffer = new ArrayBuffer(64);\nvar view = new DataView(buffer);\nview.setInt8 (0, 0x80);\nreturn view.getInt8(0) === -0x80;\n      ",
            "DataView (Uint8)": "\nvar buffer = new ArrayBuffer(64);\nvar view = new DataView(buffer);\nview.setUint8(0, 0x100);\nreturn view.getUint8(0) === 0;\n      ",
            "DataView (Int16)": "\nvar buffer = new ArrayBuffer(64);\nvar view = new DataView(buffer);\nview.setInt16(0, 0x8000);\nreturn view.getInt16(0) === -0x8000;\n      ",
            "DataView (Uint16)": "\nvar buffer = new ArrayBuffer(64);\nvar view = new DataView(buffer);\nview.setUint16(0, 0x10000);\nreturn view.getUint16(0) === 0;\n      ",
            "DataView (Int32)": "\nvar buffer = new ArrayBuffer(64);\nvar view = new DataView(buffer);\nview.setInt32(0, 0x80000000);\nreturn view.getInt32(0) === -0x80000000;\n      ",
            "DataView (Uint32)": "\nvar buffer = new ArrayBuffer(64);\nvar view = new DataView(buffer);\nview.setUint32(0, 0x100000000);\nreturn view.getUint32(0) === 0;\n      ",
            "DataView (Float32)": "\nvar buffer = new ArrayBuffer(64);\nvar view = new DataView(buffer);\nview.setFloat32(0, 0.1);\nreturn view.getFloat32(0) === 0.10000000149011612;\n      ",
            "DataView (Float64)": "\nvar buffer = new ArrayBuffer(64);\nvar view = new DataView(buffer);\nview.setFloat64(0, 0.1);\nreturn view.getFloat64(0) === 0.1;\n      ",
            "ArrayBuffer[Symbol.species]": "\nreturn typeof ArrayBuffer[Symbol.species] === 'function';\n      ",
            "constructors require new": "\nvar buffer = new ArrayBuffer(64);\nvar constructors = [\n  'ArrayBuffer',\n  'DataView',\n  'Int8Array',\n  'Uint8Array',\n  'Uint8ClampedArray',\n  'Int16Array',\n  'Uint16Array',\n  'Int32Array',\n  'Uint32Array',\n  'Float32Array',\n  'Float64Array'\n];\nreturn constructors.every(function (constructor) {\n  try {\n    if (constructor in global) {\n      global[constructor](constructor === \"ArrayBuffer\" ? 64 : buffer);\n    }\n    return false;\n  } catch(e) {\n    return true;\n  }\n});\n      ",
            "constructors accept generic iterables": "\nvar constructors = [\n  'Int8Array',\n  'Uint8Array',\n  'Uint8ClampedArray',\n  'Int16Array',\n  'Uint16Array',\n  'Int32Array',\n  'Uint32Array',\n  'Float32Array',\n  'Float64Array'\n];\nfor(var i = 0; i < constructors.length; i++){\n  var arr = new global[constructors[i]](__createIterableObject([1, 2, 3]));\n  if(arr.length !== 3 || arr[0] !== 1 || arr[1] !== 2 || arr[2] !== 3)return false;\n}\nreturn true;\n      ",
            "correct prototype chains": "\nvar constructors = [\n  'Int8Array',\n  'Uint8Array',\n  'Uint8ClampedArray',\n  'Int16Array',\n  'Uint16Array',\n  'Int32Array',\n  'Uint32Array',\n  'Float32Array',\n  'Float64Array'\n];\nvar constructor = Object.getPrototypeOf(Int8Array);\nvar prototype = Object.getPrototypeOf(Int8Array.prototype);\nif(constructor === Function.prototype || prototype === Object.prototype)return false;\nfor(var i = 0; i < constructors.length; i+=1) {\n  if (!(constructors[i] in global\n      && Object.getPrototypeOf(global[constructors[i]]) === constructor\n      && Object.getPrototypeOf(global[constructors[i]].prototype) === prototype\n      && Object.getOwnPropertyNames(global[constructors[i]].prototype).sort() + ''\n        === \"BYTES_PER_ELEMENT,constructor\")) {\n    return false;\n  }\n}\nreturn true;\n      ",
            "%TypedArray%.from": "\nreturn typeof Int8Array.from === \"function\" &&\ntypeof Uint8Array.from === \"function\" &&\ntypeof Uint8ClampedArray.from === \"function\" &&\ntypeof Int16Array.from === \"function\" &&\ntypeof Uint16Array.from === \"function\" &&\ntypeof Int32Array.from === \"function\" &&\ntypeof Uint32Array.from === \"function\" &&\ntypeof Float32Array.from === \"function\" &&\ntypeof Float64Array.from === \"function\";\n",
            "%TypedArray%.of": "\nreturn typeof Int8Array.of === \"function\" &&\ntypeof Uint8Array.of === \"function\" &&\ntypeof Uint8ClampedArray.of === \"function\" &&\ntypeof Int16Array.of === \"function\" &&\ntypeof Uint16Array.of === \"function\" &&\ntypeof Int32Array.of === \"function\" &&\ntypeof Uint32Array.of === \"function\" &&\ntypeof Float32Array.of === \"function\" &&\ntypeof Float64Array.of === \"function\";\n",
            "%TypedArray%.prototype.subarray": "\nreturn typeof Int8Array.prototype.subarray === \"function\" &&\ntypeof Uint8Array.prototype.subarray === \"function\" &&\ntypeof Uint8ClampedArray.prototype.subarray === \"function\" &&\ntypeof Int16Array.prototype.subarray === \"function\" &&\ntypeof Uint16Array.prototype.subarray === \"function\" &&\ntypeof Int32Array.prototype.subarray === \"function\" &&\ntypeof Uint32Array.prototype.subarray === \"function\" &&\ntypeof Float32Array.prototype.subarray === \"function\" &&\ntypeof Float64Array.prototype.subarray === \"function\";\n",
            "%TypedArray%.prototype.join": "\nreturn typeof Int8Array.prototype.join === \"function\" &&\ntypeof Uint8Array.prototype.join === \"function\" &&\ntypeof Uint8ClampedArray.prototype.join === \"function\" &&\ntypeof Int16Array.prototype.join === \"function\" &&\ntypeof Uint16Array.prototype.join === \"function\" &&\ntypeof Int32Array.prototype.join === \"function\" &&\ntypeof Uint32Array.prototype.join === \"function\" &&\ntypeof Float32Array.prototype.join === \"function\" &&\ntypeof Float64Array.prototype.join === \"function\";\n",
            "%TypedArray%.prototype.indexOf": "\nreturn typeof Int8Array.prototype.indexOf === \"function\" &&\ntypeof Uint8Array.prototype.indexOf === \"function\" &&\ntypeof Uint8ClampedArray.prototype.indexOf === \"function\" &&\ntypeof Int16Array.prototype.indexOf === \"function\" &&\ntypeof Uint16Array.prototype.indexOf === \"function\" &&\ntypeof Int32Array.prototype.indexOf === \"function\" &&\ntypeof Uint32Array.prototype.indexOf === \"function\" &&\ntypeof Float32Array.prototype.indexOf === \"function\" &&\ntypeof Float64Array.prototype.indexOf === \"function\";\n",
            "%TypedArray%.prototype.lastIndexOf": "\nreturn typeof Int8Array.prototype.lastIndexOf === \"function\" &&\ntypeof Uint8Array.prototype.lastIndexOf === \"function\" &&\ntypeof Uint8ClampedArray.prototype.lastIndexOf === \"function\" &&\ntypeof Int16Array.prototype.lastIndexOf === \"function\" &&\ntypeof Uint16Array.prototype.lastIndexOf === \"function\" &&\ntypeof Int32Array.prototype.lastIndexOf === \"function\" &&\ntypeof Uint32Array.prototype.lastIndexOf === \"function\" &&\ntypeof Float32Array.prototype.lastIndexOf === \"function\" &&\ntypeof Float64Array.prototype.lastIndexOf === \"function\";\n",
            "%TypedArray%.prototype.slice": "\nreturn typeof Int8Array.prototype.slice === \"function\" &&\ntypeof Uint8Array.prototype.slice === \"function\" &&\ntypeof Uint8ClampedArray.prototype.slice === \"function\" &&\ntypeof Int16Array.prototype.slice === \"function\" &&\ntypeof Uint16Array.prototype.slice === \"function\" &&\ntypeof Int32Array.prototype.slice === \"function\" &&\ntypeof Uint32Array.prototype.slice === \"function\" &&\ntypeof Float32Array.prototype.slice === \"function\" &&\ntypeof Float64Array.prototype.slice === \"function\";\n",
            "%TypedArray%.prototype.every": "\nreturn typeof Int8Array.prototype.every === \"function\" &&\ntypeof Uint8Array.prototype.every === \"function\" &&\ntypeof Uint8ClampedArray.prototype.every === \"function\" &&\ntypeof Int16Array.prototype.every === \"function\" &&\ntypeof Uint16Array.prototype.every === \"function\" &&\ntypeof Int32Array.prototype.every === \"function\" &&\ntypeof Uint32Array.prototype.every === \"function\" &&\ntypeof Float32Array.prototype.every === \"function\" &&\ntypeof Float64Array.prototype.every === \"function\";\n",
            "%TypedArray%.prototype.filter": "\nreturn typeof Int8Array.prototype.filter === \"function\" &&\ntypeof Uint8Array.prototype.filter === \"function\" &&\ntypeof Uint8ClampedArray.prototype.filter === \"function\" &&\ntypeof Int16Array.prototype.filter === \"function\" &&\ntypeof Uint16Array.prototype.filter === \"function\" &&\ntypeof Int32Array.prototype.filter === \"function\" &&\ntypeof Uint32Array.prototype.filter === \"function\" &&\ntypeof Float32Array.prototype.filter === \"function\" &&\ntypeof Float64Array.prototype.filter === \"function\";\n",
            "%TypedArray%.prototype.forEach": "\nreturn typeof Int8Array.prototype.forEach === \"function\" &&\ntypeof Uint8Array.prototype.forEach === \"function\" &&\ntypeof Uint8ClampedArray.prototype.forEach === \"function\" &&\ntypeof Int16Array.prototype.forEach === \"function\" &&\ntypeof Uint16Array.prototype.forEach === \"function\" &&\ntypeof Int32Array.prototype.forEach === \"function\" &&\ntypeof Uint32Array.prototype.forEach === \"function\" &&\ntypeof Float32Array.prototype.forEach === \"function\" &&\ntypeof Float64Array.prototype.forEach === \"function\";\n",
            "%TypedArray%.prototype.map": "\nreturn typeof Int8Array.prototype.map === \"function\" &&\ntypeof Uint8Array.prototype.map === \"function\" &&\ntypeof Uint8ClampedArray.prototype.map === \"function\" &&\ntypeof Int16Array.prototype.map === \"function\" &&\ntypeof Uint16Array.prototype.map === \"function\" &&\ntypeof Int32Array.prototype.map === \"function\" &&\ntypeof Uint32Array.prototype.map === \"function\" &&\ntypeof Float32Array.prototype.map === \"function\" &&\ntypeof Float64Array.prototype.map === \"function\";\n",
            "%TypedArray%.prototype.reduce": "\nreturn typeof Int8Array.prototype.reduce === \"function\" &&\ntypeof Uint8Array.prototype.reduce === \"function\" &&\ntypeof Uint8ClampedArray.prototype.reduce === \"function\" &&\ntypeof Int16Array.prototype.reduce === \"function\" &&\ntypeof Uint16Array.prototype.reduce === \"function\" &&\ntypeof Int32Array.prototype.reduce === \"function\" &&\ntypeof Uint32Array.prototype.reduce === \"function\" &&\ntypeof Float32Array.prototype.reduce === \"function\" &&\ntypeof Float64Array.prototype.reduce === \"function\";\n",
            "%TypedArray%.prototype.reduceRight": "\nreturn typeof Int8Array.prototype.reduceRight === \"function\" &&\ntypeof Uint8Array.prototype.reduceRight === \"function\" &&\ntypeof Uint8ClampedArray.prototype.reduceRight === \"function\" &&\ntypeof Int16Array.prototype.reduceRight === \"function\" &&\ntypeof Uint16Array.prototype.reduceRight === \"function\" &&\ntypeof Int32Array.prototype.reduceRight === \"function\" &&\ntypeof Uint32Array.prototype.reduceRight === \"function\" &&\ntypeof Float32Array.prototype.reduceRight === \"function\" &&\ntypeof Float64Array.prototype.reduceRight === \"function\";\n",
            "%TypedArray%.prototype.reverse": "\nreturn typeof Int8Array.prototype.reverse === \"function\" &&\ntypeof Uint8Array.prototype.reverse === \"function\" &&\ntypeof Uint8ClampedArray.prototype.reverse === \"function\" &&\ntypeof Int16Array.prototype.reverse === \"function\" &&\ntypeof Uint16Array.prototype.reverse === \"function\" &&\ntypeof Int32Array.prototype.reverse === \"function\" &&\ntypeof Uint32Array.prototype.reverse === \"function\" &&\ntypeof Float32Array.prototype.reverse === \"function\" &&\ntypeof Float64Array.prototype.reverse === \"function\";\n",
            "%TypedArray%.prototype.some": "\nreturn typeof Int8Array.prototype.some === \"function\" &&\ntypeof Uint8Array.prototype.some === \"function\" &&\ntypeof Uint8ClampedArray.prototype.some === \"function\" &&\ntypeof Int16Array.prototype.some === \"function\" &&\ntypeof Uint16Array.prototype.some === \"function\" &&\ntypeof Int32Array.prototype.some === \"function\" &&\ntypeof Uint32Array.prototype.some === \"function\" &&\ntypeof Float32Array.prototype.some === \"function\" &&\ntypeof Float64Array.prototype.some === \"function\";\n",
            "%TypedArray%.prototype.sort": "\nreturn typeof Int8Array.prototype.sort === \"function\" &&\ntypeof Uint8Array.prototype.sort === \"function\" &&\ntypeof Uint8ClampedArray.prototype.sort === \"function\" &&\ntypeof Int16Array.prototype.sort === \"function\" &&\ntypeof Uint16Array.prototype.sort === \"function\" &&\ntypeof Int32Array.prototype.sort === \"function\" &&\ntypeof Uint32Array.prototype.sort === \"function\" &&\ntypeof Float32Array.prototype.sort === \"function\" &&\ntypeof Float64Array.prototype.sort === \"function\";\n",
            "%TypedArray%.prototype.copyWithin": "\nreturn typeof Int8Array.prototype.copyWithin === \"function\" &&\ntypeof Uint8Array.prototype.copyWithin === \"function\" &&\ntypeof Uint8ClampedArray.prototype.copyWithin === \"function\" &&\ntypeof Int16Array.prototype.copyWithin === \"function\" &&\ntypeof Uint16Array.prototype.copyWithin === \"function\" &&\ntypeof Int32Array.prototype.copyWithin === \"function\" &&\ntypeof Uint32Array.prototype.copyWithin === \"function\" &&\ntypeof Float32Array.prototype.copyWithin === \"function\" &&\ntypeof Float64Array.prototype.copyWithin === \"function\";\n",
            "%TypedArray%.prototype.find": "\nreturn typeof Int8Array.prototype.find === \"function\" &&\ntypeof Uint8Array.prototype.find === \"function\" &&\ntypeof Uint8ClampedArray.prototype.find === \"function\" &&\ntypeof Int16Array.prototype.find === \"function\" &&\ntypeof Uint16Array.prototype.find === \"function\" &&\ntypeof Int32Array.prototype.find === \"function\" &&\ntypeof Uint32Array.prototype.find === \"function\" &&\ntypeof Float32Array.prototype.find === \"function\" &&\ntypeof Float64Array.prototype.find === \"function\";\n",
            "%TypedArray%.prototype.findIndex": "\nreturn typeof Int8Array.prototype.findIndex === \"function\" &&\ntypeof Uint8Array.prototype.findIndex === \"function\" &&\ntypeof Uint8ClampedArray.prototype.findIndex === \"function\" &&\ntypeof Int16Array.prototype.findIndex === \"function\" &&\ntypeof Uint16Array.prototype.findIndex === \"function\" &&\ntypeof Int32Array.prototype.findIndex === \"function\" &&\ntypeof Uint32Array.prototype.findIndex === \"function\" &&\ntypeof Float32Array.prototype.findIndex === \"function\" &&\ntypeof Float64Array.prototype.findIndex === \"function\";\n",
            "%TypedArray%.prototype.fill": "\nreturn typeof Int8Array.prototype.fill === \"function\" &&\ntypeof Uint8Array.prototype.fill === \"function\" &&\ntypeof Uint8ClampedArray.prototype.fill === \"function\" &&\ntypeof Int16Array.prototype.fill === \"function\" &&\ntypeof Uint16Array.prototype.fill === \"function\" &&\ntypeof Int32Array.prototype.fill === \"function\" &&\ntypeof Uint32Array.prototype.fill === \"function\" &&\ntypeof Float32Array.prototype.fill === \"function\" &&\ntypeof Float64Array.prototype.fill === \"function\";\n",
            "%TypedArray%.prototype.keys": "\nreturn typeof Int8Array.prototype.keys === \"function\" &&\ntypeof Uint8Array.prototype.keys === \"function\" &&\ntypeof Uint8ClampedArray.prototype.keys === \"function\" &&\ntypeof Int16Array.prototype.keys === \"function\" &&\ntypeof Uint16Array.prototype.keys === \"function\" &&\ntypeof Int32Array.prototype.keys === \"function\" &&\ntypeof Uint32Array.prototype.keys === \"function\" &&\ntypeof Float32Array.prototype.keys === \"function\" &&\ntypeof Float64Array.prototype.keys === \"function\";\n",
            "%TypedArray%.prototype.values": "\nreturn typeof Int8Array.prototype.values === \"function\" &&\ntypeof Uint8Array.prototype.values === \"function\" &&\ntypeof Uint8ClampedArray.prototype.values === \"function\" &&\ntypeof Int16Array.prototype.values === \"function\" &&\ntypeof Uint16Array.prototype.values === \"function\" &&\ntypeof Int32Array.prototype.values === \"function\" &&\ntypeof Uint32Array.prototype.values === \"function\" &&\ntypeof Float32Array.prototype.values === \"function\" &&\ntypeof Float64Array.prototype.values === \"function\";\n",
            "%TypedArray%.prototype.entries": "\nreturn typeof Int8Array.prototype.entries === \"function\" &&\ntypeof Uint8Array.prototype.entries === \"function\" &&\ntypeof Uint8ClampedArray.prototype.entries === \"function\" &&\ntypeof Int16Array.prototype.entries === \"function\" &&\ntypeof Uint16Array.prototype.entries === \"function\" &&\ntypeof Int32Array.prototype.entries === \"function\" &&\ntypeof Uint32Array.prototype.entries === \"function\" &&\ntypeof Float32Array.prototype.entries === \"function\" &&\ntypeof Float64Array.prototype.entries === \"function\";\n",
            "%TypedArray%.prototype[Symbol.iterator]": "\nreturn typeof Int8Array.prototype[Symbol.iterator] === \"function\" &&\ntypeof Uint8Array.prototype[Symbol.iterator] === \"function\" &&\ntypeof Uint8ClampedArray.prototype[Symbol.iterator] === \"function\" &&\ntypeof Int16Array.prototype[Symbol.iterator] === \"function\" &&\ntypeof Uint16Array.prototype[Symbol.iterator] === \"function\" &&\ntypeof Int32Array.prototype[Symbol.iterator] === \"function\" &&\ntypeof Uint32Array.prototype[Symbol.iterator] === \"function\" &&\ntypeof Float32Array.prototype[Symbol.iterator] === \"function\" &&\ntypeof Float64Array.prototype[Symbol.iterator] === \"function\";\n",
            "%TypedArray%[Symbol.species]": "\nreturn typeof Int8Array[Symbol.species] === \"function\" &&\ntypeof Uint8Array[Symbol.species] === \"function\" &&\ntypeof Uint8ClampedArray[Symbol.species] === \"function\" &&\ntypeof Int16Array[Symbol.species] === \"function\" &&\ntypeof Uint16Array[Symbol.species] === \"function\" &&\ntypeof Int32Array[Symbol.species] === \"function\" &&\ntypeof Uint32Array[Symbol.species] === \"function\" &&\ntypeof Float32Array[Symbol.species] === \"function\" &&\ntypeof Float64Array[Symbol.species] === \"function\";\n"
        }
    }, {
        "title": "Map",
        "tests": {
            "basic functionality": "\nvar key = {};\nvar map = new Map();\n\nmap.set(key, 123);\n\nreturn map.has(key) && map.get(key) === 123;\n      ",
            "constructor arguments": "\nvar key1 = {};\nvar key2 = {};\nvar map = new Map([[key1, 123], [key2, 456]]);\n\nreturn map.has(key1) && map.get(key1) === 123 &&\n       map.has(key2) && map.get(key2) === 456;\n      ",
            "constructor requires new": "\nnew Map();\ntry {\n  Map();\n  return false;\n} catch(e) {\n  return true;\n}\n      ",
            "constructor accepts null": "\nnew Map(null);\nreturn true;\n      ",
            "constructor invokes set": "\nvar passed = false;\nvar _set = Map.prototype.set;\n\nMap.prototype.set = function(k, v) {\n  passed = true;\n};\n\nnew Map([ [1, 2] ]);\nMap.prototype.set = _set;\n\nreturn passed;\n      ",
            "iterator closing": "\nvar closed = false;\nvar iter = global.__createIterableObject([1, 2, 3], {\n  'return': function(){ closed = true; return {}; }\n});\ntry {\n  new Map(iter);\n} catch(e){}\nreturn closed;\n      ",
            "Map.prototype.set returns this": "\nvar map = new Map();\nreturn map.set(0, 0) === map;\n      ",
            "-0 key converts to +0": "\nvar map = new Map();\nmap.set(-0, \"foo\");\nvar k;\nmap.forEach(function (value, key) {\n  k = 1 / key;\n});\nreturn k === Infinity && map.get(+0) == \"foo\";\n      ",
            "Map.prototype.size": "\nvar key = {};\nvar map = new Map();\n\nmap.set(key, 123);\n\nreturn map.size === 1;\n      ",
            "Map.prototype.delete": "\nreturn typeof Map.prototype.delete === \"function\";\n      ",
            "Map.prototype.clear": "\nreturn typeof Map.prototype.clear === \"function\";\n      ",
            "Map.prototype.forEach": "\nreturn typeof Map.prototype.forEach === \"function\";\n      ",
            "Map.prototype.keys": "\nreturn typeof Map.prototype.keys === \"function\";\n      ",
            "Map.prototype.values": "\nreturn typeof Map.prototype.values === \"function\";\n      ",
            "Map.prototype.entries": "\nreturn typeof Map.prototype.entries === \"function\";\n      ",
            "Map.prototype[Symbol.iterator]": "\nreturn typeof Map.prototype[Symbol.iterator] === \"function\";\n      ",
            "Map.prototype isn't an instance": "\nnew Map();\nvar obj = {};\ntry {\n  Map.prototype.has(obj);\n}\ncatch(e) {\n  return true;\n}\n      ",
            "Map iterator prototype chain": "\n// Iterator instance\nvar iterator = new Map()[Symbol.iterator]();\n// %MapIteratorPrototype%\nvar proto1 = Object.getPrototypeOf(iterator);\n// %IteratorPrototype%\nvar proto2 = Object.getPrototypeOf(proto1);\n\nreturn proto2.hasOwnProperty(Symbol.iterator) &&\n  !proto1    .hasOwnProperty(Symbol.iterator) &&\n  !iterator  .hasOwnProperty(Symbol.iterator) &&\n  iterator[Symbol.iterator]() === iterator;\n      ",
            "Map[Symbol.species]": "\nvar prop = Object.getOwnPropertyDescriptor(Map, Symbol.species);\nreturn 'get' in prop && Map[Symbol.species] === Map;\n      "
        }
    }, {
        "title": "Set",
        "tests": {
            "basic functionality": "\nvar obj = {};\nvar set = new Set();\n\nset.add(123);\nset.add(123);\n\nreturn set.has(123);\n      ",
            "constructor arguments": "\nvar obj1 = {};\nvar obj2 = {};\nvar set = new Set([obj1, obj2]);\n\nreturn set.has(obj1) && set.has(obj2);\n      ",
            "constructor requires new": "\nnew Set();\ntry {\n  Set();\n  return false;\n} catch(e) {\n  return true;\n}\n      ",
            "constructor accepts null": "\nnew Set(null);\nreturn true;\n      ",
            "constructor invokes add": "\nvar passed = false;\nvar _add = Set.prototype.add;\n\nSet.prototype.add = function(v) {\n  passed = true;\n};\n\nnew Set([1]);\nSet.prototype.add = _add;\n\nreturn passed;\n      ",
            "iterator closing": "\nvar closed = false;\nvar iter = global.__createIterableObject([1, 2, 3], {\n  'return': function(){ closed = true; return {}; }\n});\nvar add = Set.prototype.add;\nSet.prototype.add = function(){ throw 0 };\ntry {\n  new Set(iter);\n} catch(e){}\nSet.prototype.add = add;\nreturn closed;\n      ",
            "Set.prototype.add returns this": "\nvar set = new Set();\nreturn set.add(0) === set;\n      ",
            "-0 key converts to +0": "\nvar set = new Set();\nset.add(-0);\nvar k;\nset.forEach(function (value) {\n  k = 1 / value;\n});\nreturn k === Infinity && set.has(+0);\n      ",
            "Set.prototype.size": "\nvar obj = {};\nvar set = new Set();\n\nset.add(123);\nset.add(123);\nset.add(456);\n\nreturn set.size === 2;\n      ",
            "Set.prototype.delete": "\nreturn typeof Set.prototype.delete === \"function\";\n      ",
            "Set.prototype.clear": "\nreturn typeof Set.prototype.clear === \"function\";\n      ",
            "Set.prototype.forEach": "\nreturn typeof Set.prototype.forEach === \"function\";\n      ",
            "Set.prototype.keys": "\nreturn typeof Set.prototype.keys === \"function\";\n      ",
            "Set.prototype.values": "\nreturn typeof Set.prototype.values === \"function\";\n      ",
            "Set.prototype.entries": "\nreturn typeof Set.prototype.entries === \"function\";\n      ",
            "Set.prototype[Symbol.iterator]": "\nreturn typeof Set.prototype[Symbol.iterator] === \"function\";\n      ",
            "Set.prototype isn't an instance": "\nnew Set();\nvar obj = {};\ntry {\n  Set.prototype.has(obj);\n}\ncatch(e) {\n  return true;\n}\n      ",
            "Set iterator prototype chain": "\n// Iterator instance\nvar iterator = new Set()[Symbol.iterator]();\n// %SetIteratorPrototype%\nvar proto1 = Object.getPrototypeOf(iterator);\n// %IteratorPrototype%\nvar proto2 = Object.getPrototypeOf(proto1);\n\nreturn proto2.hasOwnProperty(Symbol.iterator) &&\n  !proto1    .hasOwnProperty(Symbol.iterator) &&\n  !iterator  .hasOwnProperty(Symbol.iterator) &&\n  iterator[Symbol.iterator]() === iterator;\n      ",
            "Set[Symbol.species]": "\nvar prop = Object.getOwnPropertyDescriptor(Set, Symbol.species);\nreturn 'get' in prop && Set[Symbol.species] === Set;\n      "
        }
    }, {
        "title": "WeakMap",
        "tests": {
            "basic functionality": "\nvar key = {};\nvar weakmap = new WeakMap();\n\nweakmap.set(key, 123);\n\nreturn weakmap.has(key) && weakmap.get(key) === 123;\n      ",
            "constructor arguments": "\nvar key1 = {};\nvar key2 = {};\nvar weakmap = new WeakMap([[key1, 123], [key2, 456]]);\n\nreturn weakmap.has(key1) && weakmap.get(key1) === 123 &&\n       weakmap.has(key2) && weakmap.get(key2) === 456;\n      ",
            "constructor requires new": "\nnew WeakMap();\ntry {\n  WeakMap();\n  return false;\n} catch(e) {\n  return true;\n}\n      ",
            "constructor accepts null": "\nnew WeakMap(null);\nreturn true;\n      ",
            "constructor invokes set": "\nvar passed = false;\nvar _set = WeakMap.prototype.set;\n\nWeakMap.prototype.set = function(k, v) {\n  passed = true;\n};\n\nnew WeakMap([ [{ }, 42] ]);\nWeakMap.prototype.set = _set;\n\nreturn passed;\n      ",
            "frozen objects as keys": "\nvar f = Object.freeze({});\nvar m = new WeakMap;\nm.set(f, 42);\nreturn m.get(f) === 42;\n      ",
            "iterator closing": "\nvar closed = false;\nvar iter = global.__createIterableObject([1, 2, 3], {\n  'return': function(){ closed = true; return {}; }\n});\ntry {\n  new WeakMap(iter);\n} catch(e){}\nreturn closed;\n      ",
            "WeakMap.prototype.set returns this": "\nvar weakmap = new WeakMap();\nvar key = {};\nreturn weakmap.set(key, 0) === weakmap;\n      ",
            "WeakMap.prototype.delete": "\nreturn typeof WeakMap.prototype.delete === \"function\";\n      ",
            "no WeakMap.prototype.clear method": "\nif (!(\"clear\" in WeakMap.prototype)) {\n  return true;\n}\nvar m = new WeakMap();\nvar key = {};\nm.set(key, 2);\nm.clear();\nreturn m.has(key);\n      ",
            ".has, .get and .delete methods accept primitives": "\nvar m = new WeakMap;\nreturn m.has(1) === false\n  && m.get(1) === undefined\n  && m.delete(1) === false;\n      ",
            "WeakMap.prototype isn't an instance": "\nnew WeakMap();\nvar obj = {};\ntry {\n  WeakMap.prototype.has(obj);\n}\ncatch(e) {\n  return true;\n}\n      "
        }
    }, {
        "title": "WeakSet",
        "tests": {
            "basic functionality": "\nvar obj1 = {};\nvar weakset = new WeakSet();\n\nweakset.add(obj1);\nweakset.add(obj1);\n\nreturn weakset.has(obj1);\n      ",
            "constructor arguments": "\nvar obj1 = {}, obj2 = {};\nvar weakset = new WeakSet([obj1, obj2]);\n\nreturn weakset.has(obj1) && weakset.has(obj2);\n      ",
            "constructor requires new": "\nnew WeakSet();\ntry {\n  WeakSet();\n  return false;\n} catch(e) {\n  return true;\n}\n      ",
            "constructor accepts null": "\nnew WeakSet(null);\nreturn true;\n      ",
            "constructor invokes add": "\nvar passed = false;\nvar _add = WeakSet.prototype.add;\n\nWeakSet.prototype.add = function(v) {\n  passed = true;\n};\n\nnew WeakSet([ { } ]);\nWeakSet.prototype.add = _add;\n\nreturn passed;\n      ",
            "iterator closing": "\nvar closed = false;\nvar iter = global.__createIterableObject([1, 2, 3], {\n  'return': function(){ closed = true; return {}; }\n});\ntry {\n  new WeakSet(iter);\n} catch(e){}\nreturn closed;\n      ",
            "WeakSet.prototype.add returns this": "\nvar weakset = new WeakSet();\nvar obj = {};\nreturn weakset.add(obj) === weakset;\n      ",
            "WeakSet.prototype.delete": "\nreturn typeof WeakSet.prototype.delete === \"function\";\n      ",
            "no WeakSet.prototype.clear method": "\nif (!(\"clear\" in WeakSet.prototype)) {\n  return true;\n}\nvar s = new WeakSet();\nvar key = {};\ns.add(key);\ns.clear();\nreturn s.has(key);\n      ",
            ".has and .delete methods accept primitives": "\nvar s = new WeakSet;\nreturn s.has(1) === false\n  && s.delete(1) === false;\n      ",
            "WeakSet.prototype isn't an instance": "\nnew WeakSet();\nvar obj = {};\ntry {\n  WeakSet.prototype.has(obj);\n}\ncatch(e) {\n  return true;\n}\n      "
        }
    }, {
        "title": "Proxy",
        "tests": {
            "constructor requires new": "\nnew Proxy({}, {});\ntry {\n  Proxy({}, {});\n  return false;\n} catch(e) {\n  return true;\n}\n      ",
            "no \"prototype\" property": "\nnew Proxy({}, {});\nreturn !Proxy.hasOwnProperty('prototype');\n      ",
            "\"get\" handler": "\nvar proxied = { };\nvar proxy = new Proxy(proxied, {\n  get: function (t, k, r) {\n    return t === proxied && k === \"foo\" && r === proxy && 5;\n  }\n});\nreturn proxy.foo === 5;\n      ",
            "\"get\" handler, instances of proxies": "\nvar proxied = { };\nvar proxy = Object.create(new Proxy(proxied, {\n  get: function (t, k, r) {\n    return t === proxied && k === \"foo\" && r === proxy && 5;\n  }\n}));\nreturn proxy.foo === 5;\n      ",
            "\"get\" handler invariants": "\nvar passed = false;\nvar proxied = { };\nvar proxy = new Proxy(proxied, {\n  get: function () {\n    passed = true;\n    return 4;\n  }\n});\n// The value reported for a property must be the same as the value of the corresponding\n// target object property if the target object property is a non-writable,\n// non-configurable own data property.\nObject.defineProperty(proxied, \"foo\", { value: 5, enumerable: true });\ntry {\n  proxy.foo;\n  return false;\n}\ncatch(e) {}\n// The value reported for a property must be undefined if the corresponding target\n// object property is a non-configurable own accessor property that has undefined\n// as its [[Get]] attribute.\nObject.defineProperty(proxied, \"bar\",\n  { set: function(){}, enumerable: true });\ntry {\n  proxy.bar;\n  return false;\n}\ncatch(e) {}\nreturn passed;\n      ",
            "\"set\" handler": "\nvar proxied = { };\nvar passed = false;\nvar proxy = new Proxy(proxied, {\n  set: function (t, k, v, r) {\n    passed = t === proxied && k + v === \"foobar\" && r === proxy;\n  }\n});\nproxy.foo = \"bar\";\nreturn passed;\n      ",
            "\"set\" handler, instances of proxies": "\nvar proxied = { };\nvar passed = false;\nvar proxy = Object.create(new Proxy(proxied, {\n  set: function (t, k, v, r) {\n    passed = t === proxied && k + v === \"foobar\" && r === proxy;\n  }\n}));\nproxy.foo = \"bar\";\nreturn passed;\n      ",
            "\"set\" handler invariants": "\nvar passed = false;\nnew Proxy({},{});\n// Cannot change the value of a property to be different from the value of\n// the corresponding target object if the corresponding target object\n// property is a non-writable, non-configurable own data property.\nvar proxied = {};\nvar proxy = new Proxy(proxied, {\n  set: function () {\n    passed = true;\n    return true;\n  }\n});\nObject.defineProperty(proxied, \"foo\", { value: 2, enumerable: true });\nproxy.foo = 2;\ntry {\n  proxy.foo = 4;\n  return false;\n} catch(e) {}\n// Cannot set the value of a property if the corresponding target\n// object property is a non-configurable own accessor property\n// that has undefined as its [[Set]] attribute.\nObject.defineProperty(proxied, \"bar\",\n  { get: function(){}, enumerable: true });\ntry {\n  proxy.bar = 2;\n  return false;\n} catch(e) {}\nreturn passed;\n      ",
            "\"has\" handler": "\nvar proxied = {};\nvar passed = false;\n\"foo\" in new Proxy(proxied, {\n  has: function (t, k) {\n    passed = t === proxied && k === \"foo\";\n  }\n});\nreturn passed;\n      ",
            "\"has\" handler, instances of proxies": "\nvar proxied = {};\nvar passed = false;\n\"foo\" in Object.create(new Proxy(proxied, {\n  has: function (t, k) {\n    passed = t === proxied && k === \"foo\";\n  }\n}));\nreturn passed;\n      ",
            "\"has\" handler invariants": "\nvar passed = false;\nnew Proxy({},{});\n// A property cannot be reported as non-existent, if it exists as a\n// non-configurable own property of the target object.\nvar proxied = {};\nvar proxy = new Proxy(proxied, {\n  has: function () {\n    passed = true;\n    return false;\n  }\n});\nObject.defineProperty(proxied, \"foo\", { value: 2, writable: true, enumerable: true });\ntry {\n  'foo' in proxy;\n  return false;\n} catch(e) {}\n// A property cannot be reported as non-existent, if it exists as an\n// own property of the target object and the target object is not extensible.\nproxied.bar = 2;\nObject.preventExtensions(proxied);\ntry {\n  'bar' in proxy;\n  return false;\n} catch(e) {}\nreturn passed;\n      ",
            "\"deleteProperty\" handler": "\nvar proxied = {};\nvar passed = false;\ndelete new Proxy(proxied, {\n  deleteProperty: function (t, k) {\n    passed = t === proxied && k === \"foo\";\n  }\n}).foo;\nreturn passed;\n      ",
            "\"deleteProperty\" handler invariant": "\nvar passed = false;\nnew Proxy({},{});\n// A property cannot be reported as deleted, if it exists as a non-configurable\n// own property of the target object.\nvar proxied = {};\nObject.defineProperty(proxied, \"foo\", { value: 2, writable: true, enumerable: true });\ntry {\n  delete new Proxy(proxied, {\n    deleteProperty: function () {\n      passed = true;\n      return true;\n    }\n  }).foo;\n  return false;\n} catch(e) {}\nreturn passed;\n      ",
            "\"getOwnPropertyDescriptor\" handler": "\nvar proxied = {};\nvar fakeDesc = { value: \"foo\", configurable: true };\nvar returnedDesc = Object.getOwnPropertyDescriptor(\n  new Proxy(proxied, {\n    getOwnPropertyDescriptor: function (t, k) {\n      return t === proxied && k === \"foo\" && fakeDesc;\n    }\n  }),\n  \"foo\"\n);\nreturn (returnedDesc.value     === fakeDesc.value\n  && returnedDesc.configurable === fakeDesc.configurable\n  && returnedDesc.writable     === false\n  && returnedDesc.enumerable   === false);\n      ",
            "\"getOwnPropertyDescriptor\" handler invariants": "\nvar passed = false;\nnew Proxy({},{});\n// A property cannot be reported as non-existent, if it exists as a non-configurable\n// own property of the target object.\nvar proxied = {};\nvar proxy = new Proxy(proxied, {\n  getOwnPropertyDescriptor: function () {\n    passed = true;\n    return undefined;\n  }\n});\nObject.defineProperty(proxied, \"foo\", { value: 2, writable: true, enumerable: true });\ntry {\n  Object.getOwnPropertyDescriptor(proxy, \"foo\");\n  return false;\n} catch(e) {}\n// A property cannot be reported as non-existent, if it exists as an own property\n// of the target object and the target object is not extensible.\nproxied.bar = 3;\nObject.preventExtensions(proxied);\ntry {\n  Object.getOwnPropertyDescriptor(proxy, \"bar\");\n  return false;\n} catch(e) {}\n// A property cannot be reported as existent, if it does not exists as an own property\n// of the target object and the target object is not extensible.\ntry {\n  Object.getOwnPropertyDescriptor(new Proxy(proxied, {\n    getOwnPropertyDescriptor: function() {\n      return { value: 2, configurable: true, writable: true, enumerable: true };\n    }}), \"baz\");\n  return false;\n} catch(e) {}\n// A property cannot be reported as non-configurable, if it does not exists as an own\n// property of the target object or if it exists as a configurable own property of\n// the target object.\ntry {\n  Object.getOwnPropertyDescriptor(new Proxy({}, {\n    getOwnPropertyDescriptor: function() {\n      return { value: 2, configurable: false, writable: true, enumerable: true };\n    }}), \"baz\");\n  return false;\n} catch(e) {}\ntry {\n  Object.getOwnPropertyDescriptor(new Proxy({baz:1}, {\n    getOwnPropertyDescriptor: function() {\n      return { value: 1, configurable: false, writable: true, enumerable: true };\n    }}), \"baz\");\n  return false;\n} catch(e) {}\nreturn passed;\n      ",
            "\"defineProperty\" handler": "\nvar proxied = {};\nvar passed = false;\nObject.defineProperty(\n  new Proxy(proxied, {\n    defineProperty: function (t, k, d) {\n      passed = t === proxied && k === \"foo\" && d.value === 5;\n      return true;\n    }\n  }),\n  \"foo\",\n  { value: 5, configurable: true }\n);\nreturn passed;\n      ",
            "\"defineProperty\" handler invariants": "\nvar passed = false;\nnew Proxy({},{});\n// A property cannot be added, if the target object is not extensible.\nvar proxied = Object.preventExtensions({});\nvar proxy = new Proxy(proxied, {\n  defineProperty: function() {\n    passed = true;\n    return true;\n  }\n});\ntry {\n  Object.defineProperty(proxy, \"foo\", { value: 2 });\n  return false;\n} catch(e) {}\n// A property cannot be non-configurable, unless there exists a corresponding\n// non-configurable own property of the target object.\ntry {\n  Object.defineProperty(\n    new Proxy({ bar: true }, {\n      defineProperty: function () {\n        return true;\n      }\n    }),\n    \"bar\",\n    { value: 5, configurable: false, writable: true, enumerable: true }\n  );\n  return false;\n} catch(e) {}\nreturn passed;\n      ",
            "\"getPrototypeOf\" handler": "\nvar proxied = {};\nvar fakeProto = {};\nvar proxy = new Proxy(proxied, {\n  getPrototypeOf: function (t) {\n    return t === proxied && fakeProto;\n  }\n});\nreturn Object.getPrototypeOf(proxy) === fakeProto;\n      ",
            "\"getPrototypeOf\" handler invariant": "\nvar passed = false;\nnew Proxy({},{});\n// If the target object is not extensible, [[GetPrototypeOf]] applied to the proxy object\n// must return the same value as [[GetPrototypeOf]] applied to the proxy object's target object.\ntry {\n  Object.getPrototypeOf(new Proxy(Object.preventExtensions({}), {\n    getPrototypeOf: function () {\n      passed = true;\n      return {};\n    }\n  }));\n  return false;\n} catch(e) {}\nreturn passed;\n      ",
            "\"setPrototypeOf\" handler": "\nvar proxied = {};\nvar newProto = {};\nvar passed = false;\nObject.setPrototypeOf(\n  new Proxy(proxied, {\n    setPrototypeOf: function (t, p) {\n      passed = t === proxied && p === newProto;\n      return true;\n    }\n  }),\n  newProto\n);\nreturn passed;\n      ",
            "\"setPrototypeOf\" handler invariant": "\nvar passed = false;\nnew Proxy({},{});\nObject.setPrototypeOf({},{});\n// If the target object is not extensible, the argument value must be the\n// same as the result of [[GetPrototypeOf]] applied to target object.\ntry {\n  Object.setPrototypeOf(\n    new Proxy(Object.preventExtensions({}), {\n      setPrototypeOf: function () {\n        passed = true;\n        return true;\n      }\n    }),{});\n  return false;\n} catch(e) {}\nreturn passed;\n      ",
            "\"isExtensible\" handler": "\nvar proxied = {};\nvar passed = false;\nObject.isExtensible(\n  new Proxy(proxied, {\n    isExtensible: function (t) {\n      passed = t === proxied; return true;\n    }\n  })\n);\nreturn passed;\n      ",
            "\"isExtensible\" handler invariant": "\nvar passed = false;\nnew Proxy({},{});\n// [[IsExtensible]] applied to the proxy object must return the same value\n// as [[IsExtensible]] applied to the proxy object's target object with the same argument.\ntry {\n  Object.isExtensible(new Proxy({}, {\n    isExtensible: function (t) {\n      passed = true;\n      return false;\n    }\n  }));\n  return false;\n} catch(e) {}\ntry {\n  Object.isExtensible(new Proxy(Object.preventExtensions({}), {\n    isExtensible: function (t) {\n      return true;\n    }\n  }));\n  return false;\n} catch(e) {}\nreturn true;\n      ",
            "\"preventExtensions\" handler": "\nvar proxied = {};\nvar passed = false;\nObject.preventExtensions(\n  new Proxy(proxied, {\n    preventExtensions: function (t) {\n      passed = t === proxied;\n      return Object.preventExtensions(proxied);\n    }\n  })\n);\nreturn passed;\n      ",
            "\"preventExtensions\" handler invariant": "\nvar passed = false;\nnew Proxy({},{});\n// [[PreventExtensions]] applied to the proxy object only returns true\n// if [[IsExtensible]] applied to the proxy object's target object is false.\ntry {\n  Object.preventExtensions(new Proxy({}, {\n    preventExtensions: function () {\n      passed = true;\n      return true;\n    }\n  }));\n  return false;\n} catch(e) {}\nreturn passed;\n      ",
            "\"ownKeys\" handler": "\nvar proxied = {};\nvar passed = false;\nObject.keys(\n  new Proxy(proxied, {\n    ownKeys: function (t) {\n      passed = t === proxied; return [];\n    }\n  })\n);\nreturn passed;\n      ",
            "\"ownKeys\" handler invariant": "\nvar passed = false;\nnew Proxy({},{});\n// The Type of each result List element is either String or Symbol.\ntry {\n  Object.keys(new Proxy({}, {\n    ownKeys: function () {\n      passed = true;\n      return [2];\n    }}));\n  return false;\n} catch(e) {}\n// The result List must contain the keys of all non-configurable own properties of the target object.\nvar proxied = {};\nObject.defineProperty(proxied, \"foo\", { value: 2, writable: true, enumerable: true });\ntry {\n  Object.keys(new Proxy(proxied, {\n    ownKeys: function () {\n      return [];\n    }}));\n  return false;\n} catch(e) {}\n// If the target object is not extensible, then the result List must contain all the keys\n// of the own properties of the target object and no other values.\ntry {\n  Object.keys(new Proxy(Object.preventExtensions({b:1}), {\n    ownKeys: function () {\n      return ['a'];\n    }}));\n  return false;\n} catch(e) {}\nreturn passed;\n      ",
            "\"apply\" handler": "\nvar proxied = function(){};\nvar passed = false;\nvar host = {\n  method: new Proxy(proxied, {\n    apply: function (t, thisArg, args) {\n      passed = t === proxied && thisArg === host && args + \"\" === \"foo,bar\";\n    }\n  })\n};\nhost.method(\"foo\", \"bar\");\nreturn passed;\n      ",
            "\"apply\" handler invariant": "\nvar passed = false;\nnew Proxy(function(){}, {\n    apply: function () { passed = true; }\n})();\n// A Proxy exotic object only has a [[Call]] internal method if the\n// initial value of its [[ProxyTarget]] internal slot is an object\n// that has a [[Call]] internal method.\ntry {\n  new Proxy({}, {\n    apply: function () {}\n  })();\n  return false;\n} catch(e) {}\nreturn passed;\n      ",
            "\"construct\" handler": "\nvar proxied = function(){};\nvar passed = false;\nnew new Proxy(proxied, {\n  construct: function (t, args) {\n    passed = t === proxied && args + \"\" === \"foo,bar\";\n    return {};\n  }\n})(\"foo\",\"bar\");\nreturn passed;\n      ",
            "\"construct\" handler invariants": "\nvar passed = false;\nnew Proxy({},{});\n// A Proxy exotic object only has a [[Construct]] internal method if the\n// initial value of its [[ProxyTarget]] internal slot is an object\n// that has a [[Construct]] internal method.\ntry {\n  new new Proxy({}, {\n    construct: function (t, args) {\n      return {};\n    }\n  })();\n  return false;\n} catch(e) {}\n// The result of [[Construct]] must be an Object.\ntry {\n  new new Proxy(function(){}, {\n    construct: function (t, args) {\n      passed = true;\n      return 5;\n    }\n  })();\n  return false;\n} catch(e) {}\nreturn passed;\n      ",
            "Proxy.revocable": "\nvar obj = Proxy.revocable({}, { get: function() { return 5; } });\nvar passed = (obj.proxy.foo === 5);\nobj.revoke();\ntry {\n  obj.proxy.foo;\n} catch(e) {\n  passed &= e instanceof TypeError;\n}\nreturn passed;\n      ",
            "Array.isArray support": "\nreturn Array.isArray(new Proxy([], {}));\n      ",
            "JSON.stringify support": "\nreturn JSON.stringify(new Proxy(['foo'], {})) === '[\"foo\"]';\n      "
        }
    }, {
        "title": "Reflect",
        "tests": {
            "Reflect.get": "\nreturn Reflect.get({ qux: 987 }, \"qux\") === 987;\n      ",
            "Reflect.set": "\nvar obj = {};\nReflect.set(obj, \"quux\", 654);\nreturn obj.quux === 654;\n      ",
            "Reflect.has": "\nreturn Reflect.has({ qux: 987 }, \"qux\");\n      ",
            "Reflect.deleteProperty": "\nvar obj = { bar: 456 };\nReflect.deleteProperty(obj, \"bar\");\nreturn !(\"bar\" in obj);\n      ",
            "Reflect.getOwnPropertyDescriptor": "\nvar obj = { baz: 789 };\nvar desc = Reflect.getOwnPropertyDescriptor(obj, \"baz\");\nreturn desc.value === 789 &&\n  desc.configurable && desc.writable && desc.enumerable;\n      ",
            "Reflect.defineProperty": "\nvar obj = {};\nReflect.defineProperty(obj, \"foo\", { value: 123 });\nreturn obj.foo === 123 &&\n  Reflect.defineProperty(Object.freeze({}), \"foo\", { value: 123 }) === false;\n      ",
            "Reflect.getPrototypeOf": "\nreturn Reflect.getPrototypeOf([]) === Array.prototype;\n      ",
            "Reflect.setPrototypeOf": "\nvar obj = {};\nReflect.setPrototypeOf(obj, Array.prototype);\nreturn obj instanceof Array;\n      ",
            "Reflect.isExtensible": "\nreturn Reflect.isExtensible({}) &&\n  !Reflect.isExtensible(Object.preventExtensions({}));\n      ",
            "Reflect.preventExtensions": "\nvar obj = {};\nReflect.preventExtensions(obj);\nreturn !Object.isExtensible(obj);\n      ",
            "Reflect.ownKeys, string keys": "\nvar obj = Object.create({ C: true });\nobj.A = true;\nObject.defineProperty(obj, 'B', { value: true, enumerable: false });\n\nreturn Reflect.ownKeys(obj).sort() + '' === \"A,B\";\n      ",
            "Reflect.ownKeys, symbol keys": "\nvar s1 = Symbol(), s2 = Symbol(), s3 = Symbol();\nvar proto = {};\nproto[s1] = true;\nvar obj = Object.create(proto);\nobj[s2] = true;\nObject.defineProperty(obj, s3, { value: true, enumerable: false });\n\nvar keys = Reflect.ownKeys(obj);\nreturn keys.indexOf(s2) >-1 && keys.indexOf(s3) >-1 && keys.length === 2;\n      ",
            "Reflect.apply": "\nreturn Reflect.apply(Array.prototype.push, [1,2], [3,4,5]) === 5;\n      ",
            "Reflect.construct": "\nreturn Reflect.construct(function(a, b, c) {\n  this.qux = a + b + c;\n}, [\"foo\", \"bar\", \"baz\"]).qux === \"foobarbaz\";\n      ",
            "Reflect.construct sets new.target meta property": "\nreturn Reflect.construct(function(a, b, c) {\n  if (new.target === Object) {\n    this.qux = a + b + c;\n  }\n}, [\"foo\", \"bar\", \"baz\"], Object).qux === \"foobarbaz\";\n      ",
            "Reflect.construct creates instance from newTarget argument": "\nfunction F(){}\nreturn Reflect.construct(function(){}, [], F) instanceof F;\n      "
        }
    }, {
        "title": "Promise",
        "tests": {
            "basic functionality": "\nvar p1 = new Promise(function(resolve, reject) { resolve(\"foo\"); });\nvar p2 = new Promise(function(resolve, reject) { reject(\"quux\"); });\nvar score = 0;\n\nfunction thenFn(result)  { score += (result === \"foo\");  check(); }\nfunction catchFn(result) { score += (result === \"quux\"); check(); }\nfunction shouldNotRun(result)  { score = -Infinity;   }\n\np1.then(thenFn, shouldNotRun);\np2.then(shouldNotRun, catchFn);\np1.catch(shouldNotRun);\np2.catch(catchFn);\n\np1.then(function() {\n  // Promise.prototype.then() should return a new Promise\n  score += p1.then() !== p1;\n  check();\n});\n\nfunction check() {\n  if (score === 4) asyncTestPassed();\n}\n      ",
            "constructor requires new": "\nnew Promise(function(){});\ntry {\n  Promise(function(){});\n  return false;\n} catch(e) {\n  return true;\n}\n      ",
            "Promise.prototype isn't an instance": "\nnew Promise(function(){});\ntry {\n  Promise.prototype.then(function(){});\n} catch (e) {\n  return true;\n}\n      ",
            "Promise.all": "\nvar fulfills = Promise.all([\n  new Promise(function(resolve)   { setTimeout(resolve,200,\"foo\"); }),\n  new Promise(function(resolve)   { setTimeout(resolve,100,\"bar\"); }),\n]);\nvar rejects = Promise.all([\n  new Promise(function(_, reject) { setTimeout(reject, 200,\"baz\"); }),\n  new Promise(function(_, reject) { setTimeout(reject, 100,\"qux\"); }),\n]);\nvar score = 0;\nfulfills.then(function(result) { score += (result + \"\" === \"foo,bar\"); check(); });\nrejects.catch(function(result) { score += (result === \"qux\"); check(); });\n\nfunction check() {\n  if (score === 2) asyncTestPassed();\n}\n      ",
            "Promise.all, generic iterables": "\nvar fulfills = Promise.all(global.__createIterableObject([\n  new Promise(function(resolve)   { setTimeout(resolve,200,\"foo\"); }),\n  new Promise(function(resolve)   { setTimeout(resolve,100,\"bar\"); }),\n]));\nvar rejects = Promise.all(global.__createIterableObject([\n  new Promise(function(_, reject) { setTimeout(reject, 200,\"baz\"); }),\n  new Promise(function(_, reject) { setTimeout(reject, 100,\"qux\"); }),\n]));\nvar score = 0;\nfulfills.then(function(result) { score += (result + \"\" === \"foo,bar\"); check(); });\nrejects.catch(function(result) { score += (result === \"qux\"); check(); });\n\nfunction check() {\n  if (score === 2) asyncTestPassed();\n}\n      ",
            "Promise.race": "\nvar fulfills = Promise.race([\n  new Promise(function(resolve)   { setTimeout(resolve,200,\"foo\"); }),\n  new Promise(function(_, reject) { setTimeout(reject, 300,\"bar\"); }),\n]);\nvar rejects = Promise.race([\n  new Promise(function(_, reject) { setTimeout(reject, 200,\"baz\"); }),\n  new Promise(function(resolve)   { setTimeout(resolve,300,\"qux\"); }),\n]);\nvar score = 0;\nfulfills.then(function(result) { score += (result === \"foo\"); check(); });\nrejects.catch(function(result) { score += (result === \"baz\"); check(); });\n\nfunction check() {\n  if (score === 2) asyncTestPassed();\n}\n      ",
            "Promise.race, generic iterables": "\nvar fulfills = Promise.race(global.__createIterableObject([\n  new Promise(function(resolve)   { setTimeout(resolve,200,\"foo\"); }),\n  new Promise(function(_, reject) { setTimeout(reject, 300,\"bar\"); }),\n]));\nvar rejects = Promise.race(global.__createIterableObject([\n  new Promise(function(_, reject) { setTimeout(reject, 200,\"baz\"); }),\n  new Promise(function(resolve)   { setTimeout(resolve,300,\"qux\"); }),\n]));\nvar score = 0;\nfulfills.then(function(result) { score += (result === \"foo\"); check(); });\nrejects.catch(function(result) { score += (result === \"baz\"); check(); });\n\nfunction check() {\n  if (score === 2) asyncTestPassed();\n}\n      ",
            "Promise[Symbol.species]": "\nvar prop = Object.getOwnPropertyDescriptor(Promise, Symbol.species);\nreturn 'get' in prop && Promise[Symbol.species] === Promise;\n      "
        }
    }, {
        "title": "Symbol",
        "tests": {
            "basic functionality": "\nvar object = {};\nvar symbol = Symbol();\nvar value = {};\nobject[symbol] = value;\nreturn object[symbol] === value;\n      ",
            "typeof support": "\nreturn typeof Symbol() === \"symbol\";\n      ",
            "symbol keys are hidden to pre-ES6 code": "\nvar object = {};\nvar symbol = Symbol();\nobject[symbol] = 1;\n\nfor (var x in object){}\nvar passed = !x;\n\nif (Object.keys && Object.getOwnPropertyNames) {\n  passed &= Object.keys(object).length === 0\n    && Object.getOwnPropertyNames(object).length === 0;\n}\n\nreturn passed;\n      ",
            "Object.defineProperty support": "\nvar object = {};\nvar symbol = Symbol();\nvar value = {};\n\nif (Object.defineProperty) {\n  Object.defineProperty(object, symbol, { value: value });\n  return object[symbol] === value;\n}\n\nreturn passed;\n      ",
            "symbols inherit from Symbol.prototype": "\nvar symbol = Symbol();\nvar passed = symbol.foo === undefined;\nSymbol.prototype.foo = 2;\npassed &= symbol.foo === 2;\ndelete Symbol.prototype.foo;\nreturn passed;\n      ",
            "cannot coerce to string or number": "\nvar symbol = Symbol();\n\ntry {\n  symbol + \"\";\n  return false;\n}\ncatch(e) {}\n\ntry {\n  symbol + 0;\n  return false;\n} catch(e) {}\n\nreturn true;\n      ",
            "can convert with String()": "\nreturn String(Symbol(\"foo\")) === \"Symbol(foo)\";\n      ",
            "new Symbol() throws": "\nvar symbol = Symbol();\ntry {\n  new Symbol();\n} catch(e) {\n  return true;\n}\n      ",
            "Object(symbol)": "\nvar symbol = Symbol();\nvar symbolObject = Object(symbol);\n\nreturn typeof symbolObject === \"object\" &&\n  symbolObject instanceof Symbol &&\n  symbolObject == symbol &&\n  symbolObject !== symbol &&\n  symbolObject.valueOf() === symbol;\n      ",
            "JSON.stringify ignores symbols": "\nvar object = {foo: Symbol()};\nobject[Symbol()] = 1;\nvar array = [Symbol()];\nreturn JSON.stringify(object) === '{}' && JSON.stringify(array) === '[null]' && JSON.stringify(Symbol()) === undefined;\n      ",
            "global symbol registry": "\nvar symbol = Symbol.for('foo');\nreturn Symbol.for('foo') === symbol &&\n   Symbol.keyFor(symbol) === 'foo';\n      "
        }
    }, {
        "title": "well-known symbols[18]",
        "tests": {
            "Symbol.hasInstance": "\nvar passed = false;\nvar obj = { foo: true };\nvar C = function(){};\nObject.defineProperty(C, Symbol.hasInstance, {\n  value: function(inst) { passed = inst.foo; return false; }\n});\nobj instanceof C;\nreturn passed;\n      ",
            "Symbol.isConcatSpreadable": "\nvar a = [], b = [];\nb[Symbol.isConcatSpreadable] = false;\na = a.concat(b);\nreturn a[0] === b;\n      ",
            "Symbol.iterator, existence": "\nreturn \"iterator\" in Symbol;\n      ",
            "Symbol.iterator, arguments object": "\nreturn (function() {\n  return typeof arguments[Symbol.iterator] === 'function'\n    && Object.hasOwnProperty.call(arguments, Symbol.iterator);\n}());\n      ",
            "Symbol.species, existence": "\nreturn \"species\" in Symbol;\n      ",
            "Symbol.species, Array.prototype.concat": "\nvar obj = [];\nobj.constructor = {};\nobj.constructor[Symbol.species] = function() {\n    return { foo: 1 };\n};\nreturn Array.prototype.concat.call(obj, []).foo === 1;\n      ",
            "Symbol.species, Array.prototype.filter": "\nvar obj = [];\nobj.constructor = {};\nobj.constructor[Symbol.species] = function() {\n    return { foo: 1 };\n};\nreturn Array.prototype.filter.call(obj, Boolean).foo === 1;\n      ",
            "Symbol.species, Array.prototype.map": "\nvar obj = [];\nobj.constructor = {};\nobj.constructor[Symbol.species] = function() {\n    return { foo: 1 };\n};\nreturn Array.prototype.map.call(obj, Boolean).foo === 1;\n      ",
            "Symbol.species, Array.prototype.slice": "\nvar obj = [];\nobj.constructor = {};\nobj.constructor[Symbol.species] = function() {\n    return { foo: 1 };\n};\nreturn Array.prototype.slice.call(obj, 0).foo === 1;\n      ",
            "Symbol.species, Array.prototype.splice": "\nvar obj = [];\nobj.constructor = {};\nobj.constructor[Symbol.species] = function() {\n    return { foo: 1 };\n};\nreturn Array.prototype.splice.call(obj, 0).foo === 1;\n      ",
            "Symbol.species, RegExp.prototype[Symbol.split]": "\nvar passed = false;\nvar obj = { constructor: {} };\nobj[Symbol.split] = RegExp.prototype[Symbol.split];\nobj.constructor[Symbol.species] = function() {\n  passed = true;\n  return /./;\n};\n\"\".split(obj);\nreturn passed;\n      ",
            "Symbol.species, Promise.prototype.then": "\nvar promise      = new Promise(function(resolve){ resolve(42); });\nvar FakePromise1 = promise.constructor = function(exec){ exec(function(){}, function(){}); };\nvar FakePromise2 = function(exec){ exec(function(){}, function(){}); };\nObject.defineProperty(FakePromise1, Symbol.species, {value: FakePromise2});\nreturn promise.then(function(){}) instanceof FakePromise2;\n      ",
            "Symbol.replace": "\nvar O = {};\nO[Symbol.replace] = function(){\n  return 42;\n};\nreturn ''.replace(O) === 42;\n      ",
            "Symbol.search": "\nvar O = {};\nO[Symbol.search] = function(){\n  return 42;\n};\nreturn ''.search(O) === 42;\n      ",
            "Symbol.split": "\nvar O = {};\nO[Symbol.split] = function(){\n  return 42;\n};\nreturn ''.split(O) === 42;\n      ",
            "Symbol.match": "\nvar O = {};\nO[Symbol.match] = function(){\n  return 42;\n};\nreturn ''.match(O) === 42;\n      ",
            "Symbol.match, RegExp constructor": "\nvar re = /./;\nre[Symbol.match] = false;\nvar foo = {constructor: RegExp};\nfoo[Symbol.match] = true;\nreturn RegExp(re) !== re && RegExp(foo) === foo;\n      ",
            "Symbol.match, String.prototype.startsWith": "\nvar re = /./;\ntry {\n  '/./'.startsWith(re);\n} catch(e){\n  re[Symbol.match] = false;\n  return '/./'.startsWith(re);\n}\n      ",
            "Symbol.match, String.prototype.endsWith": "\nvar re = /./;\ntry {\n  '/./'.endsWith(re);\n} catch(e){\n  re[Symbol.match] = false;\n  return '/./'.endsWith(re);\n}\n      ",
            "Symbol.match, String.prototype.includes": "\nvar re = /./;\ntry {\n  '/./'.includes(re);\n} catch(e){\n  re[Symbol.match] = false;\n  return '/./'.includes(re);\n}\n      ",
            "Symbol.toPrimitive": "\nvar a = {}, b = {}, c = {};\nvar passed = 0;\na[Symbol.toPrimitive] = function(hint) { passed += hint === \"number\";  return 0; };\nb[Symbol.toPrimitive] = function(hint) { passed += hint === \"string\";  return 0; };\nc[Symbol.toPrimitive] = function(hint) { passed += hint === \"default\"; return 0; };\n\na >= 0;\nb in {};\nc == 0;\nreturn passed === 3;\n      ",
            "Symbol.toStringTag": "\nvar a = {};\na[Symbol.toStringTag] = \"foo\";\nreturn (a + \"\") === \"[object foo]\";\n      ",
            "Symbol.toStringTag affects existing built-ins": "\nvar s = Symbol.toStringTag;\nvar passed = true;\n[\n  [Array.prototype, []],\n  [String.prototype, ''],\n  [arguments, arguments],\n  [Function.prototype, function(){}],\n  [Error.prototype, new Error()],\n  [Boolean.prototype, true],\n  [Number.prototype, 2],\n  [Date.prototype, new Date()],\n  [RegExp.prototype, /./]\n].forEach(function(pair){\n  pair[0][s] = \"foo\";\n  passed &= (Object.prototype.toString.call(pair[1]) === \"[object foo]\");\n  delete pair[0][s];\n});\nreturn passed;\n      ",
            "Symbol.toStringTag, new built-ins": "\nvar passed = true;\nvar s = Symbol.toStringTag;\n[\n  [String, \"String Iterator\"],\n  [Array, \"Array Iterator\"],\n  [Map, \"Map Iterator\"],\n  [Set, \"Set Iterator\"]\n].forEach(function(pair){\n  var iterProto = Object.getPrototypeOf(new pair[0]()[Symbol.iterator]());\n  passed = passed\n    && iterProto.hasOwnProperty(s)\n    && iterProto[s] === pair[1];\n});\npassed = passed\n  && Object.getPrototypeOf(function*(){})[s] === \"GeneratorFunction\"\n  && Object.getPrototypeOf(function*(){}())[s] === \"Generator\"\n  && Map.prototype[s] === \"Map\"\n  && Set.prototype[s] === \"Set\"\n  && ArrayBuffer.prototype[s] === \"ArrayBuffer\"\n  && DataView.prototype[s] === \"DataView\"\n  && Promise.prototype[s] === \"Promise\"\n  && Symbol.prototype[s] === \"Symbol\"\n  && typeof Object.getOwnPropertyDescriptor(\n    Object.getPrototypeOf(Int8Array).prototype, Symbol.toStringTag).get === \"function\";\n  return passed;\n      ",
            "Symbol.toStringTag, misc. built-ins": "\nvar s = Symbol.toStringTag;\nreturn Math[s] === \"Math\"\n  && JSON[s] === \"JSON\";\n      ",
            "Symbol.unscopables": "\nvar a = { foo: 1, bar: 2 };\na[Symbol.unscopables] = { bar: true };\nwith (a) {\n  return foo === 1 && typeof bar === \"undefined\";\n}\n      "
        }
    }],
    "Built-in extensions": [{
        "title": "Object static methods",
        "tests": {
            "Object.assign": "\nvar o = Object.assign({a:true}, {b:true}, {c:true});\nreturn \"a\" in o && \"b\" in o && \"c\" in o;\n      ",
            "Object.is": "\nreturn typeof Object.is === 'function' &&\n  Object.is(NaN, NaN) &&\n !Object.is(-0, 0);\n      ",
            "Object.getOwnPropertySymbols": "\nvar o = {};\nvar sym = Symbol(), sym2 = Symbol(), sym3 = Symbol();\no[sym]  = true;\no[sym2] = true;\no[sym3] = true;\nvar result = Object.getOwnPropertySymbols(o);\nreturn result[0] === sym\n  && result[1] === sym2\n  && result[2] === sym3;\n      ",
            "Object.setPrototypeOf": "\nreturn Object.setPrototypeOf({}, Array.prototype) instanceof Array;\n      "
        }
    }, {
        "title": "function \"name\" property",
        "tests": {
            "function statements": "\nfunction foo(){};\nreturn foo.name === 'foo' &&\n  (function(){}).name === '';\n      ",
            "function expressions": "\nreturn (function foo(){}).name === 'foo' &&\n  (function(){}).name === '';\n      ",
            "new Function": "\nreturn (new Function).name === \"anonymous\";\n      ",
            "bound functions": "\nfunction foo() {};\nreturn foo.bind({}).name === \"bound foo\" &&\n  (function(){}).bind({}).name === \"bound \";\n      ",
            "variables (function)": "\nvar foo = function() {};\nvar bar = function baz() {};\nreturn foo.name === \"foo\" && bar.name === \"baz\";\n      ",
            "object methods (function)": "\nvar o = { foo: function(){}, bar: function baz(){}};\no.qux = function(){};\nreturn o.foo.name === \"foo\" &&\n       o.bar.name === \"baz\" &&\n       o.qux.name === \"\";\n      ",
            "accessor properties": "\nvar o = { get foo(){}, set foo(x){} };\nvar descriptor = Object.getOwnPropertyDescriptor(o, \"foo\");\nreturn descriptor.get.name === \"get foo\" &&\n       descriptor.set.name === \"set foo\";\n      ",
            "shorthand methods": "\nvar o = { foo(){} };\nreturn o.foo.name === \"foo\";\n      ",
            "shorthand methods (no lexical binding)": "\nvar f = \"foo\";\nreturn ({f() { return f; }}).f() === \"foo\";\n      ",
            "symbol-keyed methods": "\nvar sym1 = Symbol(\"foo\");\nvar sym2 = Symbol();\nvar o = {\n  [sym1]: function(){},\n  [sym2]: function(){}\n};\n\nreturn o[sym1].name === \"[foo]\" &&\n       o[sym2].name === \"\";\n      ",
            "class statements": "\nclass foo {};\nclass bar { static name() {} };\nreturn foo.name === \"foo\" &&\n  typeof bar.name === \"function\";\n      ",
            "class expressions": "\nreturn class foo {}.name === \"foo\" &&\n  typeof class bar { static name() {} }.name === \"function\";\n      ",
            "variables (class)": "\nvar foo = class {};\nvar bar = class baz {};\nvar qux = class { static name() {} };\nreturn foo.name === \"foo\" &&\n       bar.name === \"baz\" &&\n       typeof qux.name === \"function\";\n      ",
            "object methods (class)": "\nvar o = { foo: class {}, bar: class baz {}};\no.qux = class {};\nreturn o.foo.name === \"foo\" &&\n       o.bar.name === \"baz\" &&\n       o.qux.name === \"\";\n      ",
            "class prototype methods": "\nclass C { foo(){} };\nreturn (new C).foo.name === \"foo\";\n      ",
            "class static methods": "\nclass C { static foo(){} };\nreturn C.foo.name === \"foo\";\n      ",
            "isn't writable, is configurable": "\nvar descriptor = Object.getOwnPropertyDescriptor(function f(){},\"name\");\nreturn descriptor.enumerable   === false &&\n       descriptor.writable     === false &&\n       descriptor.configurable === true;\n      "
        }
    }, {
        "title": "String static methods",
        "tests": {
            "String.raw": "\nreturn typeof String.raw === 'function';\n      ",
            "String.fromCodePoint": "\nreturn typeof String.fromCodePoint === 'function';\n      "
        }
    }, {
        "title": "String.prototype methods",
        "tests": {
            "String.prototype.codePointAt": "\nreturn typeof String.prototype.codePointAt === 'function';\n      ",
            "String.prototype.normalize": "\nreturn typeof String.prototype.normalize === \"function\"\n  && \"c\\u0327\\u0301\".normalize(\"NFC\") === \"\\u1e09\"\n  && \"\\u1e09\".normalize(\"NFD\") === \"c\\u0327\\u0301\";\n      ",
            "String.prototype.repeat": "\nreturn typeof String.prototype.repeat === 'function'\n  && \"foo\".repeat(3) === \"foofoofoo\";\n      ",
            "String.prototype.startsWith": "\nreturn typeof String.prototype.startsWith === 'function'\n  && \"foobar\".startsWith(\"foo\");\n      ",
            "String.prototype.endsWith": "\nreturn typeof String.prototype.endsWith === 'function'\n  && \"foobar\".endsWith(\"bar\");\n      ",
            "String.prototype.includes": "\nreturn typeof String.prototype.includes === 'function'\n  && \"foobar\".includes(\"oba\");\n      ",
            "String.prototype[Symbol.iterator]": "\nreturn typeof String.prototype[Symbol.iterator] === 'function';\n      ",
            "String iterator prototype chain": "\n// Iterator instance\nvar iterator = ''[Symbol.iterator]();\n// %StringIteratorPrototype%\nvar proto1 = Object.getPrototypeOf(iterator);\n// %IteratorPrototype%\nvar proto2 = Object.getPrototypeOf(proto1);\n\nreturn proto2.hasOwnProperty(Symbol.iterator) &&\n  !proto1    .hasOwnProperty(Symbol.iterator) &&\n  !iterator  .hasOwnProperty(Symbol.iterator) &&\n  iterator[Symbol.iterator]() === iterator;\n      "
        }
    }, {
        "title": "RegExp.prototype properties",
        "tests": {
            "RegExp.prototype.flags": "\nreturn /./igm.flags === \"gim\" && /./.flags === \"\";\n      ",
            "RegExp.prototype[Symbol.match]": "\nreturn typeof RegExp.prototype[Symbol.match] === 'function';\n      ",
            "RegExp.prototype[Symbol.replace]": "\nreturn typeof RegExp.prototype[Symbol.replace] === 'function';\n      ",
            "RegExp.prototype[Symbol.split]": "\nreturn typeof RegExp.prototype[Symbol.split] === 'function';\n      ",
            "RegExp.prototype[Symbol.search]": "\nreturn typeof RegExp.prototype[Symbol.search] === 'function';\n      ",
            "RegExp[Symbol.species]": "\nvar prop = Object.getOwnPropertyDescriptor(RegExp, Symbol.species);\nreturn 'get' in prop && RegExp[Symbol.species] === RegExp;\n      "
        }
    }, {
        "title": "Array static methods",
        "tests": {
            "Array.from, array-like objects": "\nreturn Array.from({ 0: \"foo\", 1: \"bar\", length: 2 }) + '' === \"foo,bar\";\n      ",
            "Array.from, generator instances": "\nvar iterable = (function*(){ yield 1; yield 2; yield 3; }());\nreturn Array.from(iterable) + '' === \"1,2,3\";\n      ",
            "Array.from, generic iterables": "\nvar iterable = global.__createIterableObject([1, 2, 3]);\nreturn Array.from(iterable) + '' === \"1,2,3\";\n      ",
            "Array.from, instances of generic iterables": "\nvar iterable = global.__createIterableObject([1, 2, 3]);\nreturn Array.from(Object.create(iterable)) + '' === \"1,2,3\";\n      ",
            "Array.from map function, array-like objects": "\nreturn Array.from({ 0: \"foo\", 1: \"bar\", length: 2 }, function(e, i) {\n  return e + this.baz + i;\n}, { baz: \"d\" }) + '' === \"food0,bard1\";\n      ",
            "Array.from map function, generator instances": "\nvar iterable = (function*(){ yield \"foo\"; yield \"bar\"; yield \"bal\"; }());\nreturn Array.from(iterable, function(e, i) {\n  return e + this.baz + i;\n}, { baz: \"d\" }) + '' === \"food0,bard1,bald2\";\n      ",
            "Array.from map function, generic iterables": "\nvar iterable = global.__createIterableObject([\"foo\", \"bar\", \"bal\"]);\nreturn Array.from(iterable, function(e, i) {\n  return e + this.baz + i;\n}, { baz: \"d\" }) + '' === \"food0,bard1,bald2\";\n      ",
            "Array.from map function, instances of iterables": "\nvar iterable = global.__createIterableObject([\"foo\", \"bar\", \"bal\"]);\nreturn Array.from(Object.create(iterable), function(e, i) {\n  return e + this.baz + i;\n}, { baz: \"d\" }) + '' === \"food0,bard1,bald2\";\n      ",
            "Array.from, iterator closing": "\nvar closed = false;\nvar iter = global.__createIterableObject([1, 2, 3], {\n  'return': function(){ closed = true; return {}; }\n});\ntry {\n  Array.from(iter, function() { throw 42 });\n} catch(e){}\nreturn closed;\n      ",
            "Array.of": "\nreturn typeof Array.of === 'function' &&\n  Array.of(2)[0] === 2;\n      ",
            "Array[Symbol.species]": "\nvar prop = Object.getOwnPropertyDescriptor(Array, Symbol.species);\nreturn 'get' in prop && Array[Symbol.species] === Array;\n      "
        }
    }, {
        "title": "Array.prototype methods",
        "tests": {
            "Array.prototype.copyWithin": "\nreturn typeof Array.prototype.copyWithin === 'function';\n      ",
            "Array.prototype.find": "\nreturn typeof Array.prototype.find === 'function';\n      ",
            "Array.prototype.findIndex": "\nreturn typeof Array.prototype.findIndex === 'function';\n      ",
            "Array.prototype.fill": "\nreturn typeof Array.prototype.fill === 'function';\n      ",
            "Array.prototype.keys": "\nreturn typeof Array.prototype.keys === 'function';\n      ",
            "Array.prototype.values": "\nreturn typeof Array.prototype.values === 'function';\n      ",
            "Array.prototype.entries": "\nreturn typeof Array.prototype.entries === 'function';\n      ",
            "Array.prototype[Symbol.iterator]": "\nreturn typeof Array.prototype[Symbol.iterator] === 'function';\n      ",
            "Array iterator prototype chain": "\n// Iterator instance\nvar iterator = [][Symbol.iterator]();\n// %ArrayIteratorPrototype%\nvar proto1 = Object.getPrototypeOf(iterator);\n// %IteratorPrototype%\nvar proto2 = Object.getPrototypeOf(proto1);\n\nreturn proto2.hasOwnProperty(Symbol.iterator) &&\n  !proto1    .hasOwnProperty(Symbol.iterator) &&\n  !iterator  .hasOwnProperty(Symbol.iterator) &&\n  iterator[Symbol.iterator]() === iterator;\n      ",
            "Array.prototype[Symbol.unscopables]": "\nvar unscopables = Array.prototype[Symbol.unscopables];\nif (!unscopables) {\n  return false;\n}\nvar ns = \"find,findIndex,fill,copyWithin,entries,keys,values\".split(\",\");\nfor (var i = 0; i < ns.length; i++) {\n  if (Array.prototype[ns[i]] && !unscopables[ns[i]]) return false;\n}\nreturn true;\n      "
        }
    }, {
        "title": "Number properties",
        "tests": {
            "Number.isFinite": "\nreturn typeof Number.isFinite === 'function';\n      ",
            "Number.isInteger": "\nreturn typeof Number.isInteger === 'function';\n      ",
            "Number.isSafeInteger": "\nreturn typeof Number.isSafeInteger === 'function';\n      ",
            "Number.isNaN": "\nreturn typeof Number.isNaN === 'function';\n      ",
            "Number.EPSILON": "\nreturn typeof Number.EPSILON === 'number';\n      ",
            "Number.MIN_SAFE_INTEGER": "\nreturn typeof Number.MIN_SAFE_INTEGER === 'number';\n      ",
            "Number.MAX_SAFE_INTEGER": "\nreturn typeof Number.MAX_SAFE_INTEGER === 'number';\n      "
        }
    }, {
        "title": "Math methods",
        "tests": {
            "Math.clz32": "\nreturn typeof Math.clz32 === \"function\";\n",
            "Math.imul": "\nreturn typeof Math.imul === \"function\";\n",
            "Math.sign": "\nreturn typeof Math.sign === \"function\";\n",
            "Math.log10": "\nreturn typeof Math.log10 === \"function\";\n",
            "Math.log2": "\nreturn typeof Math.log2 === \"function\";\n",
            "Math.log1p": "\nreturn typeof Math.log1p === \"function\";\n",
            "Math.expm1": "\nreturn typeof Math.expm1 === \"function\";\n",
            "Math.cosh": "\nreturn typeof Math.cosh === \"function\";\n",
            "Math.sinh": "\nreturn typeof Math.sinh === \"function\";\n",
            "Math.tanh": "\nreturn typeof Math.tanh === \"function\";\n",
            "Math.acosh": "\nreturn typeof Math.acosh === \"function\";\n",
            "Math.asinh": "\nreturn typeof Math.asinh === \"function\";\n",
            "Math.atanh": "\nreturn typeof Math.atanh === \"function\";\n",
            "Math.trunc": "\nreturn typeof Math.trunc === \"function\";\n",
            "Math.fround": "\nreturn typeof Math.fround === \"function\";\n",
            "Math.cbrt": "\nreturn typeof Math.cbrt === \"function\";\n",
            "Math.hypot": "\nreturn Math.hypot() === 0 &&\n  Math.hypot(1) === 1 &&\n  Math.hypot(9, 12, 20) === 25 &&\n  Math.hypot(27, 36, 60, 100) === 125;\n      "
        }
    }],
    "Subclassing": [{
        "title": "Array is subclassable",
        "tests": {
            "length property (accessing)": "\nclass C extends Array {}\nvar c = new C();\nvar len1 = c.length;\nc[2] = 'foo';\nvar len2 = c.length;\nreturn len1 === 0 && len2 === 3;\n      ",
            "length property (setting)": "\nclass C extends Array {}\nvar c = new C();\nc[2] = 'foo';\nc.length = 1;\nreturn c.length === 1 && !(2 in c);\n      ",
            "correct prototype chain": "\nclass C extends Array {}\nvar c = new C();\nreturn c instanceof C && c instanceof Array && Object.getPrototypeOf(C) === Array;\n      ",
            "Array.isArray support": "\nclass C extends Array {}\nreturn Array.isArray(new C());\n      ",
            "Array.prototype.concat": "\nclass C extends Array {}\nvar c = new C();\nreturn c.concat(1) instanceof C;\n      ",
            "Array.prototype.filter": "\nclass C extends Array {}\nvar c = new C();\nreturn c.filter(Boolean) instanceof C;\n      ",
            "Array.prototype.map": "\nclass C extends Array {}\nvar c = new C();\nreturn c.map(Boolean) instanceof C;\n      ",
            "Array.prototype.slice": "\nclass C extends Array {}\nvar c = new C();\nc.push(2,4,6);\nreturn c.slice(1,2) instanceof C;\n      ",
            "Array.prototype.splice": "\nclass C extends Array {}\nvar c = new C();\nc.push(2,4,6);\nreturn c.splice(1,2) instanceof C;\n      ",
            "Array.from": "\nclass C extends Array {}\nreturn C.from({ length: 0 }) instanceof C;\n      ",
            "Array.of": "\nclass C extends Array {}\nreturn C.of(0) instanceof C;\n      "
        }
    }, {
        "title": "RegExp is subclassable",
        "tests": {
            "basic functionality": "\nclass R extends RegExp {}\nvar r = new R(\"baz\",\"g\");\nreturn r.global && r.source === \"baz\";\n      ",
            "correct prototype chain": "\nclass R extends RegExp {}\nvar r = new R(\"baz\",\"g\");\nreturn r instanceof R && r instanceof RegExp && Object.getPrototypeOf(R) === RegExp;\n      ",
            "RegExp.prototype.exec": "\nclass R extends RegExp {}\nvar r = new R(\"baz\",\"g\");\nreturn r.exec(\"foobarbaz\")[0] === \"baz\" && r.lastIndex === 9;\n      ",
            "RegExp.prototype.test": "\nclass R extends RegExp {}\nvar r = new R(\"baz\");\nreturn r.test(\"foobarbaz\");\n      "
        }
    }, {
        "title": "Function is subclassable",
        "tests": {
            "can be called": "\nclass C extends Function {}\nvar c = new C(\"return 'foo';\");\nreturn c() === 'foo';\n      ",
            "correct prototype chain": "\nclass C extends Function {}\nvar c = new C(\"return 'foo';\");\nreturn c instanceof C && c instanceof Function && Object.getPrototypeOf(C) === Function;\n      ",
            "can be used with \"new\"": "\nclass C extends Function {}\nvar c = new C(\"this.bar = 2;\");\nc.prototype.baz = 3;\nreturn new c().bar === 2 && new c().baz === 3;\n      ",
            "Function.prototype.call": "\nclass C extends Function {}\nvar c = new C(\"x\", \"return this.bar + x;\");\nreturn c.call({bar:1}, 2) === 3;\n      ",
            "Function.prototype.apply": "\nclass C extends Function {}\nvar c = new C(\"x\", \"return this.bar + x;\");\nreturn c.apply({bar:1}, [2]) === 3;\n      ",
            "Function.prototype.bind": "\nclass C extends Function {}\nvar c = new C(\"x\", \"y\", \"return this.bar + x + y;\").bind({bar:1}, 2);\nreturn c(6) === 9 && c instanceof C;\n      "
        }
    }, {
        "title": "Promise is subclassable",
        "tests": {
            "basic functionality": "\nclass P extends Promise {}\nvar p1 = new P(function(resolve, reject) { resolve(\"foo\"); });\nvar p2 = new P(function(resolve, reject) { reject(\"quux\"); });\nvar score = +(p1 instanceof P);\n\nfunction thenFn(result)  { score += (result === \"foo\");  check(); }\nfunction catchFn(result) { score += (result === \"quux\"); check(); }\nfunction shouldNotRun(result)  { score = -Infinity;   }\n\np1.then(thenFn, shouldNotRun);\np2.then(shouldNotRun, catchFn);\np1.catch(shouldNotRun);\np2.catch(catchFn);\n\np1.then(function() {\n  // P.prototype.then() should return a new P\n  score += p1.then() instanceof P && p1.then() !== p1;\n  check();\n});\n\nfunction check() {\n  if (score === 5) asyncTestPassed();\n}\n      ",
            "correct prototype chain": "\nclass C extends Promise {}\nvar c = new C(function(resolve, reject) { resolve(\"foo\"); });\nreturn c instanceof C && c instanceof Promise && Object.getPrototypeOf(C) === Promise;\n      ",
            "Promise.all": "\nclass P extends Promise {}\nvar fulfills = P.all([\n  new Promise(function(resolve)   { setTimeout(resolve,200,\"foo\"); }),\n  new Promise(function(resolve)   { setTimeout(resolve,100,\"bar\"); }),\n]);\nvar rejects = P.all([\n  new Promise(function(_, reject) { setTimeout(reject, 200,\"baz\"); }),\n  new Promise(function(_, reject) { setTimeout(reject, 100,\"qux\"); }),\n]);\nvar score = +(fulfills instanceof P);\nfulfills.then(function(result) { score += (result + \"\" === \"foo,bar\"); check(); });\nrejects.catch(function(result) { score += (result === \"qux\"); check(); });\n\nfunction check() {\n  if (score === 3) asyncTestPassed();\n}\n      ",
            "Promise.race": "\nclass P extends Promise {}\nvar fulfills = P.race([\n  new Promise(function(resolve)   { setTimeout(resolve,200,\"foo\"); }),\n  new Promise(function(_, reject) { setTimeout(reject, 300,\"bar\"); }),\n]);\nvar rejects = P.race([\n  new Promise(function(_, reject) { setTimeout(reject, 200,\"baz\"); }),\n  new Promise(function(resolve)   { setTimeout(resolve,300,\"qux\"); }),\n]);\nvar score = +(fulfills instanceof P);\nfulfills.then(function(result) { score += (result === \"foo\"); check(); });\nrejects.catch(function(result) { score += (result === \"baz\"); check(); });\n\nfunction check() {\n  if (score === 3) asyncTestPassed();\n}\n      "
        }
    }, {
        "title": "miscellaneous subclassables",
        "tests": {
            "Boolean is subclassable": "\nclass C extends Boolean {}\nvar c = new C(true);\nreturn c instanceof Boolean\n  && c instanceof C\n  && c == true;\n      ",
            "Number is subclassable": "\nclass C extends Number {}\nvar c = new C(6);\nreturn c instanceof Number\n  && c instanceof C\n  && +c === 6;\n      ",
            "String is subclassable": "\nclass C extends String {}\nvar c = new C(\"golly\");\nreturn c instanceof String\n  && c instanceof C\n  && c + '' === \"golly\"\n  && c[0] === \"g\"\n  && c.length === 5;\n      ",
            "Map is subclassable": "\nvar key = {};\nclass M extends Map {}\nvar map = new M();\n\nmap.set(key, 123);\n\nreturn map instanceof M && map.has(key) && map.get(key) === 123;\n      ",
            "Set is subclassable": "\nvar obj = {};\nclass S extends Set {}\nvar set = new S();\n\nset.add(123);\nset.add(123);\n\nreturn set instanceof S && set.has(123);\n      "
        }
    }],
    "Misc": [{
        "title": "prototype of bound functions",
        "tests": {
            "basic functions": "\nfunction correctProtoBound(proto) {\n  var f = function(){};\n  if (Object.setPrototypeOf) {\n    Object.setPrototypeOf(f, proto);\n  }\n  else {\n    f.__proto__ = proto;\n  }\n  var boundF = Function.prototype.bind.call(f, null);\n  return Object.getPrototypeOf(boundF) === proto;\n}\nreturn correctProtoBound(Function.prototype)\n  && correctProtoBound({})\n  && correctProtoBound(null);\n      ",
            "generator functions": "\nfunction correctProtoBound(proto) {\n  var f = function*(){};\n  if (Object.setPrototypeOf) {\n    Object.setPrototypeOf(f, proto);\n  }\n  else {\n    f.__proto__ = proto;\n  }\n  var boundF = Function.prototype.bind.call(f, null);\n  return Object.getPrototypeOf(boundF) === proto;\n}\nreturn correctProtoBound(Function.prototype)\n  && correctProtoBound({})\n  && correctProtoBound(null);\n      ",
            "arrow functions": "\nfunction correctProtoBound(proto) {\n  var f = ()=>5;\n  if (Object.setPrototypeOf) {\n    Object.setPrototypeOf(f, proto);\n  }\n  else {\n    f.__proto__ = proto;\n  }\n  var boundF = Function.prototype.bind.call(f, null);\n  return Object.getPrototypeOf(boundF) === proto;\n}\nreturn correctProtoBound(Function.prototype)\n  && correctProtoBound({})\n  && correctProtoBound(null);\n      ",
            "classes": "\nfunction correctProtoBound(proto) {\n  class C {}\n  if (Object.setPrototypeOf) {\n    Object.setPrototypeOf(C, proto);\n  }\n  else {\n    C.__proto__ = proto;\n  }\n  var boundF = Function.prototype.bind.call(C, null);\n  return Object.getPrototypeOf(boundF) === proto;\n}\nreturn correctProtoBound(Function.prototype)\n  && correctProtoBound({})\n  && correctProtoBound(null);\n      ",
            "subclasses": "\nfunction correctProtoBound(superclass) {\n  class C extends superclass {\n    constructor() {\n      return Object.create(null);\n    }\n  }\n  var boundF = Function.prototype.bind.call(C, null);\n  return Object.getPrototypeOf(boundF) === Object.getPrototypeOf(C);\n}\nreturn correctProtoBound(function(){})\n  && correctProtoBound(Array)\n  && correctProtoBound(null);\n      "
        }
    }, {
        "title": "Proxy, internal 'get' calls",
        "tests": {
            "ToPrimitive": "\n// ToPrimitive -> Get -> [[Get]]\nvar get = [];\nvar p = new Proxy({toString:Function()}, { get: function(o, k) { get.push(k); return o[k]; }});\np + 3;\nreturn get[0] === Symbol.toPrimitive && get.slice(1) + '' === \"valueOf,toString\";\n      ",
            "CreateListFromArrayLike": "\n// CreateListFromArrayLike -> Get -> [[Get]]\nvar get = [];\nvar p = new Proxy({length:2, 0:0, 1:0}, { get: function(o, k) { get.push(k); return o[k]; }});\nFunction.prototype.apply({}, p);\nreturn get + '' === \"length,0,1\";\n      ",
            "instanceof operator": "\n// InstanceofOperator -> GetMethod -> GetV -> [[Get]]\n// InstanceofOperator -> OrdinaryHasInstance -> Get -> [[Get]]\nvar get = [];\nvar p = new Proxy(Function(), { get: function(o, k) { get.push(k); return o[k]; }});\n({}) instanceof p;\nreturn get[0] === Symbol.hasInstance && get.slice(1) + '' === \"prototype\";\n      ",
            "HasBinding": "\n// HasBinding -> Get -> [[Get]]\nvar get = [];\nvar p = new Proxy({foo:1}, { get: function(o, k) { get.push(k); return o[k]; }});\np[Symbol.unscopables] = p;\nwith(p) {\n  typeof foo;\n}\nreturn get[0] === Symbol.unscopables && get.slice(1) + '' === \"foo\";\n      ",
            "CreateDynamicFunction": "\n// CreateDynamicFunction -> GetPrototypeFromConstructor -> Get -> [[Get]]\nvar get = [];\nvar p = new Proxy(Function, { get: function(o, k) { get.push(k); return o[k]; }});\nnew p;\nreturn get + '' === \"prototype\";\n      ",
            "ClassDefinitionEvaluation": "\n// ClassDefinitionEvaluation -> Get -> [[Get]]\nvar get = [];\nvar p = new Proxy(Function(), { get: function(o, k) { get.push(k); return o[k]; }});\nclass C extends p {}\nreturn get + '' === \"prototype\";\n      ",
            "IteratorComplete, IteratorValue": "\n// IteratorComplete -> Get -> [[Get]]\n// IteratorValue -> Get -> [[Get]]\nvar get = [];\nvar iterable = {};\niterable[Symbol.iterator] = function() {\n  return {\n    next: function() {\n      return new Proxy({ value: 2, done: false }, { get: function(o, k) { get.push(k); return o[k]; }});\n    }\n  };\n}\nvar i = 0;\nfor(var e of iterable) {\n  if (++i >= 2) break;\n}\nreturn get + '' === \"done,value,done,value\";\n      ",
            "ToPropertyDescriptor": "\n// ToPropertyDescriptor -> Get -> [[Get]]\nvar get = [];\nvar p = new Proxy({\n    enumerable: true, configurable: true, value: true,\n    writable: true, get: Function(), set: Function()\n  }, { get: function(o, k) { get.push(k); return o[k]; }});\ntry {\n  // This will throw, since it will have true for both \"get\" and \"value\",\n  // but not before performing a Get on every property.\n  Object.defineProperty({}, \"foo\", p);\n} catch(e) {\n  return get + '' === \"enumerable,configurable,value,writable,get,set\";\n}\n      ",
            "Object.assign": "\n// Object.assign -> Get -> [[Get]]\nvar get = [];\nvar p = new Proxy({foo:1, bar:2}, { get: function(o, k) { get.push(k); return o[k]; }});\nObject.assign({}, p);\nreturn get + '' === \"foo,bar\";\n      ",
            "Object.defineProperties": "\n// Object.defineProperties -> Get -> [[Get]]\nvar get = [];\nvar p = new Proxy({foo:{}, bar:{}}, { get: function(o, k) { get.push(k); return o[k]; }});\nObject.defineProperties({}, p);\nreturn get + '' === \"foo,bar\";\n      ",
            "Function.prototype.bind": "\n// Function.prototype.bind -> Get -> [[Get]]\nvar get = [];\nvar p = new Proxy(Function(), { get: function(o, k) { get.push(k); return o[k]; }});\nFunction.prototype.bind.call(p);\nreturn get + '' === \"length,name\";\n      ",
            "Error.prototype.toString": "\n// Error.prototype.toString -> Get -> [[Get]]\nvar get = [];\nvar p = new Proxy({}, { get: function(o, k) { get.push(k); return o[k]; }});\nError.prototype.toString.call(p);\nreturn get + '' === \"name,message\";\n      ",
            "String.raw": "\n// String.raw -> Get -> [[Get]]\nvar get = [];\nvar raw = new Proxy({length: 2, 0: '', 1: ''}, { get: function(o, k) { get.push(k); return o[k]; }});\nvar p = new Proxy({raw: raw}, { get: function(o, k) { get.push(k); return o[k]; }});\nString.raw(p);\nreturn get + '' === \"raw,length,0,1\";\n      ",
            "RegExp constructor": "\n// RegExp -> Get -> [[Get]]\nvar get = [];\nvar re = { constructor: null };\nre[Symbol.match] = true;\nvar p = new Proxy(re, { get: function(o, k) { get.push(k); return o[k]; }});\nRegExp(p);\nreturn get[0] === Symbol.match && get.slice(1) + '' === \"constructor,source,flags\";\n      ",
            "RegExp.prototype.flags": "\n// RegExp.prototype.flags -> Get -> [[Get]]\nvar get = [];\nvar p = new Proxy({}, { get: function(o, k) { get.push(k); return o[k]; }});\nObject.getOwnPropertyDescriptor(RegExp.prototype, 'flags').get.call(p);\nreturn get + '' === \"global,ignoreCase,multiline,unicode,sticky\";\n      ",
            "RegExp.prototype.test": "\n// RegExp.prototype.test -> RegExpExec -> Get -> [[Get]]\nvar get = [];\nvar p = new Proxy({ exec: function() { return null; } }, { get: function(o, k) { get.push(k); return o[k]; }});\nRegExp.prototype.test.call(p);\nreturn get + '' === \"exec\";\n      ",
            "RegExp.prototype.toString": "\n// RegExp.prototype.toString -> Get -> [[Get]]\nvar get = [];\nvar p = new Proxy({}, { get: function(o, k) { get.push(k); return o[k]; }});\nRegExp.prototype.toString.call(p);\nreturn get + '' === \"source,flags\";\n      ",
            "RegExp.prototype[Symbol.match]": "\n// RegExp.prototype[Symbol.match] -> Get -> [[Get]]\nvar get = [];\nvar p = new Proxy({ exec: function() { return null; } }, { get: function(o, k) { get.push(k); return o[k]; }});\nRegExp.prototype[Symbol.match].call(p);\np.global = true;\nRegExp.prototype[Symbol.match].call(p);\nreturn get + '' === \"global,exec,global,unicode,exec\";\n      ",
            "RegExp.prototype[Symbol.replace]": "\n// RegExp.prototype[Symbol.replace] -> Get -> [[Get]]\nvar get = [];\nvar p = new Proxy({ exec: function() { return null; } }, { get: function(o, k) { get.push(k); return o[k]; }});\nRegExp.prototype[Symbol.replace].call(p);\np.global = true;\nRegExp.prototype[Symbol.replace].call(p);\nreturn get + '' === \"global,exec,global,unicode,exec\";\n      ",
            "RegExp.prototype[Symbol.search]": "\n// RegExp.prototype[Symbol.search] -> Get -> [[Get]]\nvar get = [];\nvar p = new Proxy({ exec: function() { return null; } }, { get: function(o, k) { get.push(k); return o[k]; }});\nRegExp.prototype[Symbol.search].call(p);\nreturn get + '' === \"lastIndex,exec\";\n      ",
            "RegExp.prototype[Symbol.split]": "\n// RegExp.prototype[Symbol.split] -> Get -> [[Get]]\nvar get = [];\nvar constructor = Function();\nconstructor[Symbol.species] = Object;\nvar p = new Proxy({ constructor: constructor, flags: '', exec: function() { return null; } }, { get: function(o, k) { get.push(k); return o[k]; }});\nRegExp.prototype[Symbol.split].call(p, \"\");\nreturn get + '' === \"constructor,flags,exec\";\n      ",
            "Array.from": "\n// Array.from -> Get -> [[Get]]\nvar get = [];\nvar p = new Proxy({length: 2, 0: '', 1: ''}, { get: function(o, k) { get.push(k); return o[k]; }});\nArray.from(p);\nreturn get[0] === Symbol.iterator && get.slice(1) + '' === \"length,0,1\";\n      ",
            "Array.prototype.concat": "\n// Array.prototype.concat -> Get -> [[Get]]\nvar get = [];\nvar arr = [1];\narr.constructor = undefined;\nvar p = new Proxy(arr, { get: function(o, k) { get.push(k); return o[k]; }});\nArray.prototype.concat.call(p,p);\nreturn get[0] === \"constructor\"\n  && get[1] === Symbol.isConcatSpreadable\n  && get[2] === \"length\"\n  && get[3] === \"0\"\n  && get[4] === get[1] && get[5] === get[2] && get[6] === get[3]\n  && get.length === 7;\n      ",
            "Array.prototype iteration methods": "\n// Array.prototype methods -> Get -> [[Get]]\nvar methods = ['copyWithin', 'every', 'fill', 'filter', 'find', 'findIndex', 'forEach',\n  'indexOf', 'join', 'lastIndexOf', 'map', 'reduce', 'reduceRight', 'some'];\nvar get;\nvar p = new Proxy({length: 2, 0: '', 1: ''}, { get: function(o, k) { get.push(k); return o[k]; }});\nfor(var i = 0; i < methods.length; i+=1) {\n  get = [];\n  Array.prototype[methods[i]].call(p, Function());\n  if (get + '' !== (\n    methods[i] === 'fill' ? \"length\" :\n    methods[i] === 'every' ? \"length,0\" :\n    methods[i] === 'lastIndexOf' || methods[i] === 'reduceRight' ? \"length,1,0\" :\n    \"length,0,1\"\n  )) {\n    return false;\n  }\n}\nreturn true;\n      ",
            "Array.prototype.pop": "\n// Array.prototype.pop -> Get -> [[Get]]\nvar get = [];\nvar p = new Proxy([0,1,2,3], { get: function(o, k) { get.push(k); return o[k]; }});\nArray.prototype.pop.call(p);\nreturn get + '' === \"length,3\";\n      ",
            "Array.prototype.reverse": "\n// Array.prototype.reverse -> Get -> [[Get]]\nvar get = [];\nvar p = new Proxy([0,,2,,4,,], { get: function(o, k) { get.push(k); return o[k]; }});\nArray.prototype.reverse.call(p);\nreturn get + '' === \"length,0,4,2\";\n      ",
            "Array.prototype.shift": "\n// Array.prototype.shift -> Get -> [[Get]]\nvar get = [];\nvar p = new Proxy([0,1,2,3], { get: function(o, k) { get.push(k); return o[k]; }});\nArray.prototype.shift.call(p);\nreturn get + '' === \"length,0,1,2,3\";\n      ",
            "Array.prototype.splice": "\n// Array.prototype.splice -> Get -> [[Get]]\nvar get = [];\nvar p = new Proxy([0,1,2,3], { get: function(o, k) { get.push(k); return o[k]; }});\nArray.prototype.splice.call(p,1,1);\nArray.prototype.splice.call(p,1,0,1);\nreturn get + '' === \"length,constructor,1,2,3,length,constructor,2,1\";\n      ",
            "Array.prototype.toString": "\n// Array.prototype.toString -> Get -> [[Get]]\nvar get = [];\nvar p = new Proxy({ join:Function() }, { get: function(o, k) { get.push(k); return o[k]; }});\nArray.prototype.toString.call(p);\nreturn get + '' === \"join\";\n      ",
            "JSON.stringify": "\n// JSON.stringify -> Get -> [[Get]]\nvar get = [];\nvar p = new Proxy({}, { get: function(o, k) { get.push(k); return o[k]; }});\nJSON.stringify(p);\nreturn get + '' === \"toJSON\";\n      ",
            "Promise resolve functions": "\n// Promise resolve functions -> Get -> [[Get]]\nvar get = [];\nvar p = new Proxy({}, { get: function(o, k) { get.push(k); return o[k]; }});\nnew Promise(function(resolve){ resolve(p); });\nreturn get + '' === \"then\";\n      ",
            "String.prototype.match": "\n// String.prototype.match -> Get -> [[Get]]\nvar get = [];\nvar proxied = {};\nproxied[Symbol.toPrimitive] = Function();\nvar p = new Proxy(proxied, { get: function(o, k) { get.push(k); return o[k]; }});\n\"\".match(p);\nreturn get[0] === Symbol.match && get[1] === Symbol.toPrimitive && get.length === 2;\n      ",
            "String.prototype.replace": "\n// String.prototype.replace functions -> Get -> [[Get]]\nvar get = [];\nvar proxied = {};\nproxied[Symbol.toPrimitive] = Function();\nvar p = new Proxy(proxied, { get: function(o, k) { get.push(k); return o[k]; }});\n\"\".replace(p);\nreturn get[0] === Symbol.replace && get[1] === Symbol.toPrimitive && get.length === 2;\n      ",
            "String.prototype.search": "\n// String.prototype.search functions -> Get -> [[Get]]\nvar get = [];\nvar proxied = {};\nproxied[Symbol.toPrimitive] = Function();\nvar p = new Proxy(proxied, { get: function(o, k) { get.push(k); return o[k]; }});\n\"\".search(p);\nreturn get[0] === Symbol.search && get[1] === Symbol.toPrimitive && get.length === 2;\n      ",
            "String.prototype.split": "\n// String.prototype.split functions -> Get -> [[Get]]\nvar get = [];\nvar proxied = {};\nproxied[Symbol.toPrimitive] = Function();\nvar p = new Proxy(proxied, { get: function(o, k) { get.push(k); return o[k]; }});\n\"\".split(p);\nreturn get[0] === Symbol.split && get[1] === Symbol.toPrimitive && get.length === 2;\n      ",
            "Date.prototype.toJSON": "\n// Date.prototype.toJSON -> ToPrimitive -> Get -> [[Get]]\n// Date.prototype.toJSON -> Invoke -> GetMethod -> GetV -> [[Get]]\nvar get = [];\nvar p = new Proxy({toString:Function(),toISOString:Function()}, { get: function(o, k) { get.push(k); return o[k]; }});\nDate.prototype.toJSON.call(p);\nreturn get[0] === Symbol.toPrimitive && get.slice(1) + '' === \"valueOf,toString,toISOString\";\n      "
        }
    }, {
        "title": "Proxy, internal 'set' calls",
        "tests": {
            "Object.assign": "\n// Object.assign -> Set -> [[Set]]\nvar set = [];\nvar p = new Proxy({}, { set: function(o, k, v) { set.push(k); o[k] = v; return true; }});\nObject.assign(p, { foo: 1, bar: 2 });\nreturn set + '' === \"foo,bar\";\n      ",
            "Array.from": "\n// Array.from -> Set -> [[Set]]\nvar set = [];\nvar p = new Proxy({}, { set: function(o, k, v) { set.push(k); o[k] = v; return true; }});\nArray.from.call(function(){ return p; }, {length:2, 0:1, 1:2});\nreturn set + '' === \"length\";\n      ",
            "Array.of": "\n// Array.from -> Set -> [[Set]]\nvar set = [];\nvar p = new Proxy({}, { set: function(o, k, v) { set.push(k); o[k] = v; return true; }});\nArray.of.call(function(){ return p; }, 1, 2, 3);\nreturn set + '' === \"length\";\n      ",
            "Array.prototype.copyWithin": "\n// Array.prototype.copyWithin -> Set -> [[Set]]\nvar set = [];\nvar p = new Proxy([1,2,3,4,5,6], { set: function(o, k, v) { set.push(k); o[k] = v; return true; }});\np.copyWithin(0, 3);\nreturn set + '' === \"0,1,2\";\n      ",
            "Array.prototype.fill": "\n// Array.prototype.fill -> Set -> [[Set]]\nvar set = [];\nvar p = new Proxy([1,2,3,4,5,6], { set: function(o, k, v) { set.push(k); o[k] = v; return true; }});\np.fill(0, 3);\nreturn set + '' === \"3,4,5\";\n      ",
            "Array.prototype.pop": "\n// Array.prototype.pop -> Set -> [[Set]]\nvar set = [];\nvar p = new Proxy([], { set: function(o, k, v) { set.push(k); o[k] = v; return true; }});\np.pop();\nreturn set + '' === \"length\";\n      ",
            "Array.prototype.push": "\n// Array.prototype.push -> Set -> [[Set]]\nvar set = [];\nvar p = new Proxy([], { set: function(o, k, v) { set.push(k); o[k] = v; return true; }});\np.push(0,0,0);\nreturn set + '' === \"0,1,2,length\";\n      ",
            "Array.prototype.reverse": "\n// Array.prototype.reverse -> Set -> [[Set]]\nvar set = [];\nvar p = new Proxy([0,0,0,,], { set: function(o, k, v) { set.push(k); o[k] = v; return true; }});\np.reverse();\nreturn set + '' === \"3,1,2\";\n      ",
            "Array.prototype.shift": "\n// Array.prototype.shift -> Set -> [[Set]]\nvar set = [];\nvar p = new Proxy([0,0,,0], { set: function(o, k, v) { set.push(k); o[k] = v; return true; }});\np.shift();\nreturn set + '' === \"0,2,length\";\n      ",
            "Array.prototype.splice": "\n// Array.prototype.splice -> Set -> [[Set]]\nvar set = [];\nvar p = new Proxy([1,2,3], { set: function(o, k, v) { set.push(k); o[k] = v; return true; }});\np.splice(1,0,0);\nreturn set + '' === \"3,2,1,length\";\n      ",
            "Array.prototype.unshift": "\n// Array.prototype.unshift -> Set -> [[Set]]\nvar set = [];\nvar p = new Proxy([0,0,,0], { set: function(o, k, v) { set.push(k); o[k] = v; return true; }});\np.unshift(0,1);\nreturn set + '' === \"5,3,2,0,1,length\";\n      "
        }
    }, {
        "title": "Proxy, internal 'defineProperty' calls",
        "tests": {
            "[[Set]]": "\n// [[Set]] -> [[DefineOwnProperty]]\nvar def = [];\nvar p = new Proxy({foo:1, bar:2}, { defineProperty: function(o, v, desc) { def.push(v); Object.defineProperty(o, v, desc); return true; }});\np.foo = 2; p.bar = 4;\nreturn def + '' === \"foo,bar\";\n      ",
            "SetIntegrityLevel": "\n// SetIntegrityLevel -> DefinePropertyOrThrow -> [[DefineOwnProperty]]\nvar def = [];\nvar p = new Proxy({foo:1, bar:2}, { defineProperty: function(o, v, desc) { def.push(v); Object.defineProperty(o, v, desc); return true; }});\nObject.freeze(p);\nreturn def + '' === \"foo,bar\";\n      "
        }
    }, {
        "title": "Proxy, internal 'deleteProperty' calls",
        "tests": {
            "Array.prototype.copyWithin": "\n// Array.prototype.copyWithin -> DeletePropertyOrThrow -> [[Delete]]\nvar del = [];\nvar p = new Proxy([0,0,0,,,,], { deleteProperty: function(o, v) { del.push(v); return delete o[v]; }});\np.copyWithin(0,3);\nreturn del + '' === \"0,1,2\";\n      ",
            "Array.prototype.pop": "\n// Array.prototype.pop -> DeletePropertyOrThrow -> [[Delete]]\nvar del = [];\nvar p = new Proxy([0,0,0], { deleteProperty: function(o, v) { del.push(v); return delete o[v]; }});\np.pop();\nreturn del + '' === \"2\";\n      ",
            "Array.prototype.reverse": "\n// Array.prototype.reverse -> DeletePropertyOrThrow -> [[Delete]]\nvar del = [];\nvar p = new Proxy([0,,2,,4,,], { deleteProperty: function(o, v) { del.push(v); return delete o[v]; }});\np.reverse();\nreturn del + '' === \"0,4,2\";\n      ",
            "Array.prototype.shift": "\n// Array.prototype.shift -> DeletePropertyOrThrow -> [[Delete]]\nvar del = [];\nvar p = new Proxy([0,,0,,0,0], { deleteProperty: function(o, v) { del.push(v); return delete o[v]; }});\np.shift();\nreturn del + '' === \"0,2,5\";\n      ",
            "Array.prototype.splice": "\n// Array.prototype.splice -> DeletePropertyOrThrow -> [[Delete]]\nvar del = [];\nvar p = new Proxy([0,0,0,0,,0], { deleteProperty: function(o, v) { del.push(v); return delete o[v]; }});\np.splice(2,2,0);\nreturn del + '' === \"3,5\";\n      ",
            "Array.prototype.unshift": "\n// Array.prototype.unshift -> DeletePropertyOrThrow -> [[Delete]]\nvar del = [];\nvar p = new Proxy([0,0,,0,,0], { deleteProperty: function(o, v) { del.push(v); return delete o[v]; }});\np.unshift(0);\nreturn del + '' === \"5,3\";\n      "
        }
    }, {
        "title": "Proxy, internal 'getOwnPropertyDescriptor' calls",
        "tests": {
            "[[Set]]": "\n// [[Set]] -> [[GetOwnProperty]]\nvar gopd = [];\nvar p = new Proxy({},\n  { getOwnPropertyDescriptor: function(o, v) { gopd.push(v); return Object.getOwnPropertyDescriptor(o, v); }});\np.foo = 1; p.bar = 1;\nreturn gopd + '' === \"foo,bar\";\n      ",
            "Object.assign": "\n// Object.assign -> [[GetOwnProperty]]\nvar gopd = [];\nvar p = new Proxy({foo:1, bar:2},\n  { getOwnPropertyDescriptor: function(o, v) { gopd.push(v); return Object.getOwnPropertyDescriptor(o, v); }});\nObject.assign({}, p);\nreturn gopd + '' === \"foo,bar\";\n      ",
            "Object.prototype.hasOwnProperty": "\n// Object.prototype.hasOwnProperty -> HasOwnProperty -> [[GetOwnProperty]]\nvar gopd = [];\nvar p = new Proxy({foo:1, bar:2},\n  { getOwnPropertyDescriptor: function(o, v) { gopd.push(v); return Object.getOwnPropertyDescriptor(o, v); }});\np.hasOwnProperty('garply');\nreturn gopd + '' === \"garply\";\n      ",
            "Function.prototype.bind": "\n// Function.prototype.bind -> HasOwnProperty -> [[GetOwnProperty]]\nvar gopd = [];\nvar p = new Proxy(Function(),\n  { getOwnPropertyDescriptor: function(o, v) { gopd.push(v); return Object.getOwnPropertyDescriptor(o, v); }});\np.bind();\nreturn gopd + '' === \"length\";\n      "
        }
    }, {
        "title": "Proxy, internal 'ownKeys' calls",
        "tests": {
            "SetIntegrityLevel": "\n// SetIntegrityLevel -> [[OwnPropertyKeys]]\nvar ownKeysCalled = 0;\nvar p = new Proxy({}, { ownKeys: function(o) { ownKeysCalled++; return Object.keys(o); }});\nObject.freeze(p);\nreturn ownKeysCalled === 1;\n      ",
            "TestIntegrityLevel": "\n// TestIntegrityLevel -> [[OwnPropertyKeys]]\nvar ownKeysCalled = 0;\nvar p = new Proxy(Object.preventExtensions({}), { ownKeys: function(o) { ownKeysCalled++; return Object.keys(o); }});\nObject.isFrozen(p);\nreturn ownKeysCalled === 1;\n      ",
            "SerializeJSONObject": "\n// SerializeJSONObject -> EnumerableOwnNames -> [[OwnPropertyKeys]]\nvar ownKeysCalled = 0;\nvar p = new Proxy({}, { ownKeys: function(o) { ownKeysCalled++; return Object.keys(o); }});\nJSON.stringify({a:p,b:p});\nreturn ownKeysCalled === 2;\n      "
        }
    }, {
        "title": "Object static methods accept primitives",
        "tests": {
            "Object.getPrototypeOf": "\nreturn Object.getPrototypeOf('a').constructor === String;\n      ",
            "Object.getOwnPropertyDescriptor": "\nreturn Object.getOwnPropertyDescriptor('a', 'foo') === undefined;\n      ",
            "Object.getOwnPropertyNames": "\nvar s = Object.getOwnPropertyNames('a');\nreturn s.length === 2 &&\n  ((s[0] === 'length' && s[1] === '0') || (s[0] === '0' && s[1] === 'length'));\n      ",
            "Object.seal": "\nreturn Object.seal('a') === 'a';\n      ",
            "Object.freeze": "\nreturn Object.freeze('a') === 'a';\n      ",
            "Object.preventExtensions": "\nreturn Object.preventExtensions('a') === 'a';\n      ",
            "Object.isSealed": "\nreturn Object.isSealed('a') === true;\n      ",
            "Object.isFrozen": "\nreturn Object.isFrozen('a') === true;\n      ",
            "Object.isExtensible": "\nreturn Object.isExtensible('a') === false;\n      ",
            "Object.keys": "\nvar s = Object.keys('a');\nreturn s.length === 1 && s[0] === '0';\n      "
        }
    }, {
        "title": "own property order",
        "tests": {
            "Object.keys": "\nvar obj = {\n  // Non-negative integer names appear first in value order\n  2:    true,\n  0:    true,\n  1:    true,\n  // Other string names appear in source order\n  ' ':  true,\n  // Non-negative integers are sorted above other names\n  9:    true,\n  D:    true,\n  B:    true,\n  // Negative integers are treated as other names\n  '-1': true,\n};\n// Other string names are added in order of creation\nobj.A = true;\n// Non-negative integer names, conversely, ignore order of creation\nobj[3] = true;\n// Having a total of 20+ properties doesn't affect property order\n\"EFGHIJKLMNOPQRSTUVWXYZ\".split('').forEach(function(key){\n  obj[key] = true;\n});\n// Object.defineProperty doesn't affect the above rules\nObject.defineProperty(obj, 'C', { value: true, enumerable: true });\nObject.defineProperty(obj, '4', { value: true, enumerable: true });\n// Deleting and reinserting a property doesn't preserve its position\ndelete obj[2];\nobj[2] = true;\n\nvar forInOrder = '';\nfor(var key in obj)forInOrder += key;\n\nreturn Object.keys(obj).join('') === forInOrder;\n      ",
            "Object.getOwnPropertyNames": "\nvar obj = {\n  2:    true,\n  0:    true,\n  1:    true,\n  ' ':  true,\n  9:    true,\n  D:    true,\n  B:    true,\n  '-1': true\n};\nobj.A = true;\nobj[3] = true;\n\"EFGHIJKLMNOPQRSTUVWXYZ\".split('').forEach(function(key){\n  obj[key] = true;\n});\nObject.defineProperty(obj, 'C', { value: true, enumerable: true });\nObject.defineProperty(obj, '4', { value: true, enumerable: true });\ndelete obj[2];\nobj[2] = true;\n\nreturn Object.getOwnPropertyNames(obj).join('') === \"012349 DB-1AEFGHIJKLMNOPQRSTUVWXYZC\";\n      ",
            "Object.assign": "\nvar result = '';\nvar target = {};\n\n\"012349 DBACEFGHIJKLMNOPQRST\".split('').concat(-1).forEach(function(key){\n  Object.defineProperty(target, key, {\n    set: function(){\n      result += key;\n    }\n  })\n});\n\nvar obj = {2: 2, 0: 0, 1: 1, ' ': ' ', 9: 9, D: 'D', B: 'B', '-1': '-1'};\nObject.defineProperty(obj, 'A', {value: 'A',  enumerable: true});\nObject.defineProperty(obj, '3', {value: '3',  enumerable: true});\nObject.defineProperty(obj, 'C', {value: 'C',  enumerable: true});\nObject.defineProperty(obj, '4', {value: '4',  enumerable: true});\ndelete obj[2];\nobj[2] = true;\n\n\"EFGHIJKLMNOPQRST\".split('').forEach(function(key){\n  obj[key] = key;\n});\n\nObject.assign(target, obj);\n\nreturn result === \"012349 DB-1ACEFGHIJKLMNOPQRST\";\n      ",
            "JSON.stringify": "\nvar obj = {\n  2:    true,\n  0:    true,\n  1:    true,\n  ' ':  true,\n  9:    true,\n  D:    true,\n  B:    true,\n  '-1': true\n};\nobj.A = true;\nobj[3] = true;\n\"EFGHIJKLMNOPQRSTUVWXYZ\".split('').forEach(function(key){\n  obj[key] = true;\n});\nObject.defineProperty(obj, 'C', { value: true, enumerable: true });\nObject.defineProperty(obj, '4', { value: true, enumerable: true });\ndelete obj[2];\nobj[2] = true;\n\nreturn JSON.stringify(obj) ===\n  '{\"0\":true,\"1\":true,\"2\":true,\"3\":true,\"4\":true,\"9\":true,\" \":true,\"D\":true,\"B\":true,\"-1\":true,\"A\":true,\"E\":true,\"F\":true,\"G\":true,\"H\":true,\"I\":true,\"J\":true,\"K\":true,\"L\":true,\"M\":true,\"N\":true,\"O\":true,\"P\":true,\"Q\":true,\"R\":true,\"S\":true,\"T\":true,\"U\":true,\"V\":true,\"W\":true,\"X\":true,\"Y\":true,\"Z\":true,\"C\":true}';\n      ",
            "JSON.parse": "\nvar result = '';\nJSON.parse(\n  '{\"0\":true,\"1\":true,\"2\":true,\"3\":true,\"4\":true,\"9\":true,\" \":true,\"D\":true,\"B\":true,\"-1\":true,\"E\":true,\"F\":true,\"G\":true,\"H\":true,\"I\":true,\"J\":true,\"K\":true,\"L\":true,\"A\":true,\"C\":true}',\n  function reviver(k,v) {\n    result += k;\n    return v;\n  }\n);\nreturn result === \"012349 DB-1EFGHIJKLAC\";\n      ",
            "Reflect.ownKeys, string key order": "\nvar obj = {\n  2:    true,\n  0:    true,\n  1:    true,\n  ' ':  true,\n  9:    true,\n  D:    true,\n  B:    true,\n  '-1': true\n};\nobj.A = true;\nobj[3] = true;\n\"EFGHIJKLMNOPQRSTUVWXYZ\".split('').forEach(function(key){\n  obj[key] = true;\n});\nObject.defineProperty(obj, 'C', { value: true, enumerable: true });\nObject.defineProperty(obj, '4', { value: true, enumerable: true });\ndelete obj[2];\nobj[2] = true;\n\nreturn Reflect.ownKeys(obj).join('') === \"012349 DB-1AEFGHIJKLMNOPQRSTUVWXYZC\";\n      ",
            "Reflect.ownKeys, symbol key order": "\nvar sym1 = Symbol(), sym2 = Symbol(), sym3 = Symbol();\nvar obj = {\n  1:    true,\n  A:    true,\n};\nobj.B = true;\nobj[sym1] = true;\nobj[2] = true;\nobj[sym2] = true;\nObject.defineProperty(obj, 'C', { value: true, enumerable: true });\nObject.defineProperty(obj, sym3,{ value: true, enumerable: true });\nObject.defineProperty(obj, 'D', { value: true, enumerable: true });\n\nvar result = Reflect.ownKeys(obj);\nvar l = result.length;\nreturn result[l-3] === sym1 && result[l-2] === sym2 && result[l-1] === sym3;\n      "
        }
    }, {
        "title": "miscellaneous",
        "tests": {
            "no escaped reserved words as identifiers": "\nvar \\u0061;\ntry {\n  eval('var v\\\\u0061r');\n} catch(e) {\n  return true;\n}\n      ",
            "duplicate property names in strict mode": "\n'use strict';\nreturn this === undefined && ({ a:1, a:1 }).a === 1;\n      ",
            "no semicolon needed after do-while": "\ndo {} while (false) return true;\n      ",
            "no assignments allowed in for-in head": "\ntry {\n  eval('for (var i = 0 in {}) {}');\n}\ncatch(e) {\n  return true;\n}\n      ",
            "accessors aren't constructors": "\ntry {\n  new (Object.getOwnPropertyDescriptor({get a(){}}, 'a')).get;\n} catch(e) {\n  return true;\n}\n      ",
            "Invalid Date": "\nreturn new Date(NaN) + \"\" === \"Invalid Date\";\n      ",
            "RegExp constructor can alter flags": "\nreturn new RegExp(/./im, \"g\").global === true;\n      ",
            "RegExp.prototype.toString generic and uses \"flags\" property": "\nreturn RegExp.prototype.toString.call({source: 'foo', flags: 'bar'}) === '/foo/bar';\n      ",
            "built-in prototypes are not instances": "\ntry {\n  RegExp.prototype.exec(); return false;\n} catch(e) {}\ntry {\n  Date.prototype.valueOf(); return false;\n} catch(e) {}\n\nif (![Error, EvalError, RangeError, ReferenceError, SyntaxError, TypeError, URIError].every(function (E) {\n    return Object.prototype.toString.call(E.prototype) === '[object Object]';\n})) {\n  return false;\n}\n\nreturn true;\n      ",
            "function 'length' is configurable": "\nvar fn = function(a, b) {};\n\nvar desc = Object.getOwnPropertyDescriptor(fn, \"length\");\nif (desc.configurable) {\n  Object.defineProperty(fn, \"length\", { value: 1 });\n  return fn.length === 1;\n}\n\nreturn false;\n      ",
            "hoisted block-level function declaration": "\n// Note: only available outside of strict mode.\nif (!this) return false;\nvar passed = f() === 1;\nfunction f() { return 1; }\n\npassed &= typeof g === 'undefined';\n{ function g() { return 1; } }\npassed &= g() === 1;\n\npassed &= h() === 2;\n{ function h() { return 1; } }\nfunction h() { return 2; }\npassed &= h() === 1;\n\nreturn passed;\n      ",
            "labeled function statements": "\n// Note: only available outside of strict mode.\nif (!this) return false;\n\nlabel: function foo() { return 2; }\nreturn foo() === 2;\n      ",
            "function statements in if-statement clauses": "\n// Note: only available outside of strict mode.\nif (!this) return false;\n\nif(true) function foo() { return 2; }\nif(false) {} else function bar() { return 3; }\nif(true) function baz() { return 4; } else {}\nif(false) function qux() { return 5; } else function qux() { return 6; }\nreturn foo() === 2 && bar() === 3 && baz() === 4 && qux() === 6;\n      ",
            "basic support": "\nreturn { __proto__ : [] } instanceof Array\n  && !({ __proto__ : null } instanceof Object);\n      ",
            "multiple __proto__ is an error": "\ntry {\n  eval(\"({ __proto__ : [], __proto__: {} })\");\n}\ncatch(e) {\n  return true;\n}\n      ",
            "not a computed property": "\nif (!({ __proto__ : [] } instanceof Array)) {\n  return false;\n}\nvar a = \"__proto__\";\nreturn !({ [a] : [] } instanceof Array);\n      ",
            "not a shorthand property": "\nif (!({ __proto__ : [] } instanceof Array)) {\n  return false;\n}\nvar __proto__ = [];\nreturn !({ __proto__ } instanceof Array);\n      ",
            "not a shorthand method": "\nif (!({ __proto__ : [] } instanceof Array)) {\n  return false;\n}\nreturn !({ __proto__(){} } instanceof Function);\n      ",
            "get prototype": "\nvar A = function(){};\nreturn (new A()).__proto__ === A.prototype;\n      ",
            "set prototype": "\nvar o = {};\no.__proto__ = Array.prototype;\nreturn o instanceof Array;\n      ",
            "absent from Object.create(null)": "\nvar o = Object.create(null), p = {};\no.__proto__ = p;\nreturn Object.getPrototypeOf(o) !== p;\n      ",
            "present in hasOwnProperty()": "\nreturn Object.prototype.hasOwnProperty('__proto__');\n      ",
            "correct property descriptor": "\nvar desc = Object.getOwnPropertyDescriptor(Object.prototype,\"__proto__\");\nvar A = function(){};\n\nreturn (desc\n  && \"get\" in desc\n  && \"set\" in desc\n  && desc.configurable\n  && !desc.enumerable);\n      ",
            "present in Object.getOwnPropertyNames()": "\nreturn Object.getOwnPropertyNames(Object.prototype).indexOf('__proto__') > -1;\n      ",
            "existence": "\nvar i, names = [\"anchor\", \"big\", \"bold\", \"fixed\", \"fontcolor\", \"fontsize\",\n  \"italics\", \"link\", \"small\", \"strike\", \"sub\", \"sup\"];\nfor (i = 0; i < names.length; i++) {\n  if (typeof String.prototype[names[i]] !== 'function') {\n    return false;\n  }\n}\nreturn true;\n      ",
            "tags' names are lowercase": "\nvar i, names = [\"anchor\", \"big\", \"bold\", \"fixed\", \"fontcolor\", \"fontsize\",\n  \"italics\", \"link\", \"small\", \"strike\", \"sub\", \"sup\"];\nfor (i = 0; i < names.length; i++) {\n  if (\"\"[names[i]]().toLowerCase() !== \"\"[names[i]]()) {\n    return false;\n  }\n}\nreturn true;\n      ",
            "quotes in arguments are escaped": "\nvar i, names = [\"anchor\", \"fontcolor\", \"fontsize\", \"link\"];\nfor (i = 0; i < names.length; i++) {\n  if (\"\"[names[i]]('\"') !== \"\"[names[i]]('&' + 'quot;')) {\n    return false;\n  }\n}\nreturn true;\n      ",
            "hyphens in character sets": "\nreturn /[\\w-_]/.exec(\"-\")[0] === \"-\";\n      ",
            "invalid character escapes": "\nreturn /\\z/.exec(\"\\\\z\")[0] === \"z\"\n  && /[\\z]/.exec(\"[\\\\z]\")[0] === \"z\";\n      ",
            "invalid control-character escapes": "\nreturn /\\c2/.exec(\"\\\\c2\")[0] === \"\\\\c2\";\n      ",
            "invalid Unicode escapes": "\nreturn /\\u1/.exec(\"u1\")[0] === \"u1\"\n  && /[\\u1]/.exec(\"u\")[0] === \"u\";\n      ",
            "invalid hexadecimal escapes": "\nreturn /\\x1/.exec(\"x1\")[0] === \"x1\"\n  && /[\\x1]/.exec(\"x\")[0] === \"x\";\n      ",
            "incomplete patterns and quantifiers": "\nreturn /x{1/.exec(\"x{1\")[0] === \"x{1\"\n  && /x]1/.exec(\"x]1\")[0] === \"x]1\";\n      ",
            "octal escape sequences": "\nreturn /\\041/.exec(\"!\")[0] === \"!\"\n  && /[\\041]/.exec(\"!\")[0] === \"!\";\n      ",
            "invalid backreferences become octal escapes": "\nreturn /\\41/.exec(\"!\")[0] === \"!\"\n  && /[\\41]/.exec(\"!\")[0] === \"!\";\n      "
        }
    }],
    "Annex b": []
};

var verbose = process.argv[2] === '-v';

var suffix = '................................................................................';

var Total = 0, Succ = 0;

var println = function (str) {
    process.stdout.write(str + '\n');
};

async(Object.keys(tests), function (key, next) {
    println('\x1b[36;1m' + key + '\x1b[0m');

    async(tests[key], function (obj, next) {
        var tmp = '';
        var total = 0, succs = 0;
        async(Object.keys(obj.tests), function (key, next) {
            var code = obj.tests[key];
            if (code.indexOf('asyncTestPassed') + 1) { // async
                var resolved = false;

                try {
                    Function('asyncTestPassed', code)(function () {
                        // passed
                        if (!timer) return;
                        clearTimeout(timer);

                        onresult(true);
                    });
                    var timer = setTimeout(function () {
                        timer = null;
                        onresult(false);
                    }, 1000);
                } catch (e) {
                    onresult(false);
                }

            } else {
                var succ = false;
                try {
                    succ = Function(code)();
                } catch (e) {
                }
                onresult(succ)
            }

            function onresult(ok) {
                if (resolved) throw new Error('reenter');
                resolved = true;
                var succ = ok ? 1 : 0;
                total++;
                succs += succ;
                if (verbose)
                    tmp += '\n    ' + key + ' '
                        + (succ ? suffix.substr(key.length + 9) + ' \x1b[30;42mYES\x1b[0m' : suffix.substr(key.length + 8) + ' \x1b[30;41mNO\x1b[0m');
                next()
            }
        }, function () {
            Total += total;
            Succ += succs;
            println('  \x1b[35;1m' + obj.title + '\x1b[0m ' + suffix.substr(obj.title.length + (total + '/' + succs).length + 4) + ' \x1b[3' + (succs ? succs === total ? 2 : 3 : 1) + ';1m' + succs + '/' + total + '\x1b[0m' + tmp)
            next();
        });
    }, next);

}, function () {
    println('Total: ' + (Succ * 100 / Total).toFixed(2) + '% (' + Succ + '/' + Total + ')\n' +
        'node: ' + process.version + ', v8: v' + process.versions.v8);
});

function async(arr, cb, complete) {
    var n = 0, L = arr.length;
    if (!L) return complete();
    cb(arr[0], next);

    function next() {
        if (++n === L) {
            //console.log('completed');
            complete();
        } else {
            cb(arr[n], next)
        }
    }


}
function fetchResults() {
    var results = {}, map = [], tests = {};
    var onRow = function (tr) {
        if (tr.className === 'category') {
            var title = tr.firstElementChild.textContent;
            results[title] = map = []
        } else if (tr.className === 'supertest') {
            title = tr.firstElementChild.textContent.trim().slice(1, -1);
            map.push({title: title, tests: tests = {}})
        } else if (tr.className === 'subtest') {
            var td = tr.firstElementChild;
            title = td.querySelector('span').textContent.trim().slice(1);
            tests[title] = td.querySelector('script').getAttribute('data-source');
        }

    };
    var arr = document.querySelectorAll('#table-wrapper tr');
    for (var i = 1, L = arr.length; i < L; i++) {
        onRow(arr[i])
    }
    return JSON.stringify(results);
}