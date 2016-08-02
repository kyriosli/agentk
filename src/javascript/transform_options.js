
try {
    exports.StringTemplate = (0, eval)('`${1 + 2}`') !== '3';
} catch (e) {
    exports.StringTemplate = true
}

supports('Class', '(class{})');
supports('Destruct', '(function(){var {a}={}})');
supports('Rest', '(function(...a){})');

if (exports.Rest) exports.Default = true;
else supports('Default', '(function(a=0){})');

function supports(name, expr) {
    try {
        (0, eval)(expr);
    } catch (e) {
        exports[name] = true;
        return
    }
    exports[name] = false;
}