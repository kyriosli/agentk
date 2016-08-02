let i = 0;


function next() {
    co.run(Boolean, i & 1).then(function () {
        i++;
        if ((i & 0xfff) === 0) {
            process.stdout.write('\x1b[s ' + '        '.substr(i.toString().length) + i + ' ' + JSON.stringify(process.memoryUsage()) + '\x1b[u');
        }
        setTimeout(next, 0);
    });
}

next();
next();
next();
next();
next();
next();
next();
next();
next();
next();
next();
next();
next();
next();
next();
next();