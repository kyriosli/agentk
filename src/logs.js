"use strict";

module.exports = function (program) {
    if (program.stdout) {
        tail(program.stdout, program.ts ? '' : '\x1b[32mout|\x1b[0m')
    }
    if (program.stderr && program.stderr !== program.stdout) {
        tail(program.stderr, program.ts ? '' : '\x1b[31merr|\x1b[0m');
    }
};

function tail(file, prefix) {
    let cp = require('child_process');
    if (!prefix) {
        return cp.spawn('tail', ['-20f', file], {
            stdio: 'inherit'
        });
    }
    let child = cp.spawn('tail', ['-20f', file], {
        stdio: 'pipe'
    });
    let remain = '';
    child.stdout.on('data', function (data) {
        let arr = (remain + data).split('\n');
        remain = arr.pop();
        let buf = '';
        for (let i = 0, L = arr.length; i < L; i++) {
            buf += prefix + arr[i] + '\n';
        }
        process.stdout.write(buf);
    })
}