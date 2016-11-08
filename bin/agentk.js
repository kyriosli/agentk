#!/bin/sh
":" // ; exec /usr/bin/env node $(if [ "`/usr/bin/env node -v`" \< "v5" ]; then echo --harmony; fi) $NODE_OPTS "$0" "$@"
"use strict";

let exec = 'ak';

let min_version = 'v0.12';

if (process.version < min_version) {
    throw new Error(exec + " runs on Node.js " + min_version + " or higher, please upgrade your installation and try again.");
}

if (process.env.SU) {
    process.setuid(process.env.SU);
    delete process.env.SU
}

const fs = require('fs'), path = require('path');

const win32 = process.platform === 'win32';

let colors = {
    'k': '0',
    'K': '0;1',
    'r': '1',
    'R': '1;1',
    'g': '2',
    'G': '2;1',
    'y': '3',
    'Y': '3;1',
    'b': '4',
    'B': '4;1',
    'm': '5',
    'M': '5;1',
    'c': '6',
    'C': '6;1',
    'w': '7',
    'W': '7;1'
};

const args = process.argv.slice(2);

const properties = process.properties = {};
for (let i = args.length; i--;) {
    let m = /^--([\w.\-]+)(?:=(.*))?/.exec(args[i]);
    if (m) {
        properties[m[1]] = m[2] || true;
        args.splice(i, 1);
    }
}


let cmd;

const levels = {verbose: 0, debug: 1, info: 2, log: 2, warn: 3, error: 4, fatal: 5};

function print(level, str) {
    str = str.replace(/\$#[rgbcmykw]{2}<(.+?)>/gi, (m, text) => '\x1b[3' + colors[m[2]] + ';4' + colors[m[3]] + 'm' + text + '\x1b[0m');
    (levels[level] > 2 ? process.stdout : process.stderr).write(str + '\n')
}

function callService(cmd, options) {
    loadAndRun('../src/service/controller.js', function (module) {
        try {
            let method = module[cmd.replace(' ', '_')];
            if (method) method(options);
            else  module.fallback(cmd, options);
        } catch (err) {
            if (err.code === 'ECONNREFUSED' || err.code === 'ENOENT') {
                print('error', 'command \'' + cmd + '\' failed, maybe service not started?')
            } else {
                print('error', 'command \'' + cmd + '\' failed, ' + err.message)
            }
            process.exit(1)
        }
    }).done();
}


function commander(dir) {
    if (dir !== undefined) {
        if (!require('fs').statSync(dir).isDirectory()) {
            print('error', exec + ' ' + cmd + ' requires directory name as parameter');
            process.exit(-1);
        }
        process.chdir(dir);
    }
    callService(cmd, dir)
}

let commands = {
    "help": {
        help: "print this help message",
        "args": "[<command>]",
        maxArgs: 1,
        "desc": "display usage of commands",
        func: function (subcmd) {
            let cmd = args[0];
            if (cmd === 'help' && arguments.length && subcmd in commands) { // help <cmd>
                let command = commands[subcmd];
                print('info', "$#Gk<usage>: $#Ck<" + exec + "> " + subcmd + " " + (command.args || "") + "\n");
                let desc = 'desc' in command ? command.desc : command.help;
                desc && print('info', desc);
                return;
            } else if (!cmd || cmd === 'help' && !subcmd) { // agentk help?
                print('info', "$#Ck<AgentK> v" + require('../package.json').version +
                    "\n$#Gk<usage>: $#Ck<" + exec + "> <command> [<args>]\n");
            } else {
                if (cmd === 'help') { // agentk help xxx
                    cmd = subcmd
                }
                print('warn', "command not found: $#Rk<" + cmd + ">\n");
            }

            print('info', "possible commands are:");
            Object.keys(commands).forEach(function (cmd) {
                print('info', "  $#yk<" + cmd + ">" + "            ".substr(cmd.length) + commands[cmd].help)
            });
            print('info', "\ntype $#Ck<" + exec + " help> <command> to get more info");
        }, completion: function (prefix, triggers) {
            let output = '';
            for (let txt of Object.keys(commands)) {
                output = completion(output, prefix, txt);
            }
            if (triggers) {
                var config = readConfig();
                for (var key in config) {
                    if (key.substr(0, 8) === 'trigger.') {
                        output = completion(output, prefix, key.substr(8));
                    } else if (key.substr(0, 6) === 'alias.') {
                        output = completion(output, prefix, key.substr(6));
                    }
                }
            }
            return output;
        }
    },
    "run": {
        help: "run program without crash respawn",
        "args": "[<program directory> | <main module>] [--watch]",
        "desc": "run the program located in the directory (or current directory, if none specified) directly in current " +
        "terminal, outputs will be printed into stdout/stderr.\nHit Ctrl-c to terminate execution",
        func: function (dir) {
            if (arguments.length === 0) {
                dir = '.'
            }
            properties.check = true;
            if (dir.substr(dir.length - 3) === '.js') {
                require('../index.js').load(path.resolve(dir)).done();
            } else if (properties.watch) {
                require('../src/watcher').run(dir)
            } else {
                require('../index.js').run(dir);
            }
        }
    },
    "start": {
        help: "start program",
        "args": "[<program directory>]",
        "desc": "run the program located in the directory (or current directory, if none specified), guarded by the " +
        "service. If something bad happened, the program will be restarted. Outputs will be written to log files",
        func: commander
    },
    "stop": {
        help: "stop program",
        "args": "[<program directory>]",
        maxArgs: 1,
        "desc": "stop the program",
        func: commander,
        completion: completeRunningJobs
    },
    "restart": {
        help: "restart program",
        "args": "[<program directory>]",
        maxArgs: 1,
        "desc": "restart the program. The old child process will be detached and killed soon after " +
        "several seconds, and new child will be spawned immediately. Listening socket ports will not be released",
        func: commander,
        completion: completeRunningJobs
    },
    "reload": {
        help: "reload program",
        "args": "[<program directory>]",
        maxArgs: 1,
        "desc": "reload the program. The behavior of reload is same as restart, but you can specify a trigger named reload to do user-specific behavior.",
        func: commander,
        completion: completeRunningJobs
    },
    "status": {
        help: "show program status",
        "args": "[<program directory>]",
        maxArgs: 1,
        desc: "display the status of one or all running programs",
        func: commander,
        completion: completeRunningJobs
    },
    "doc": {
        help: "generate documentation",
        args: "[<output directory>]",
        "desc": "generate documentation for all module files in src/module. \n\n\x1b[36mOPTIONS\x1b[0m\n\n" +
        "  \x1b[32moutput directory\x1b[0m: output directory for generated files, defaults to \x1b[36m./doc/\n",
        func: function (outDir) {
            outDir = path.resolve(outDir || 'doc');
            let co = require('../src/co.js'),
                load = require('../index.js').load;
            co.run(function () {
                let module = load(path.join(__dirname, '../src/module/doc.js')).yield();
                module.doc(outDir, properties.format || 'md');
            }).done();
        }
    },
    "init": {
        help: "initialize project structure",
        desc: "Generate default project structure with a default config file, module and resource directories, and so on",
        func: function () {
            require('./init.js');
        }
    },
    "logs": {
        help: "print program stdout/stderr log message",
        args: "[<program path>]",
        maxArgs: 1,
        func: function (dir) {
            let file = getFilePath('programs');
            if (!fs.existsSync(file)) return;
            let arr = JSON.parse(fs.readFileSync(file, 'utf8'));
            if (dir) {
                dir = path.resolve(dir);
            } else {
                dir = process.cwd();
            }
            if (win32) dir = dir.replace(/\\/g, '/').toLowerCase();
            let found;
            for (let program of arr) {
                if (program.dir === dir) {
                    found = program;
                    break
                }
            }
            if (!found) {
                print('error', "'" + dir + "' not found in running programs");
                return
            }

            if (!found.stdout && !found.stderr) {
                print('error', "'" + dir + "' stdout/stderr not redirected to file");
                return
            }

            require('../src/logs.js')(found);

        },
        completion: completeRunningJobs
    },
    "service": {
        help: "service controlling scripts",
        args: "start|stop|systemd_install|systemd_uninst|upstart_install|upstart_uninst|sysv_install|sysv_uninst|rc-create",
        maxArgs: 2,
        get desc() {
            callService('description');
        },
        func: function (arg0, arg1) {
            if (!arguments.length) {
                showHelp();
            } else {
                callService('service ' + arg0, arg1);
            }
        },
        completion: function () {
            let lastArg = arguments[arguments.length - 1];
            if (lastArg.substr(0, 7) === '--user=') {
                return completeUsername(lastArg, '--user=');
            }
            if (args.length === 5) {
                let output = '';
                for (let arg of commands.service.args.split('|')) {
                    output = completion(output, lastArg, arg);
                }
                return output;
            }
        }
    },
    "completion": {
        help: "auto completion helper",
        args: ">> ~/.bashrc (or ~/.zshrc)",
        get desc() {
            return "enable bash completion. After install, please reopen your terminal to make sure it takes effects. \nOr you can just type in current shell:\n    $(" + exec + " completion)";
        },
        func: function (p, agentk, arg2) {
            if (!arguments.length) {
                if (process.stdout.isTTY) {
                    return showHelp()
                }
                let file = path.join(__dirname, 'completion.sh');
                if (win32) {
                    if (process.env.SHELL) {
                        file = '/' + file.replace(/[:\\]+/g, '/');
                    } else {
                        throw new Error("completion is not supported in this shell, Install MinGW32 and try again")
                    }
                }
                return process.stdout.write('. ' + file + '\n')
            }
            if (p !== "--") {
                return showHelp();
            }
            let ret;
            if (process.argv.length === 6) {
                ret = commands.help.completion(arg2 || '', true);
            } else {
                let args = process.argv.slice(6);
                if (arg2 in commands) {
                    let command = commands[arg2];
                    if (!command.completion || 'maxArgs' in command && args.length > command.maxArgs) {
                        return;
                    }
                    ret = commands[arg2].completion.apply(null, args);
                } else {
                    let config = readConfig();
                    if ('trigger.' + arg2 in config) {
                        ret = completeRunningJobs(args[0]);
                    }
                }
            }
            ret && ret.length && process.stdout.write(ret);
        }
    },
    "test": {
        help: "run autotest scripts",
        args: "[<test name>]",
        desc: "will run the test scripts found in the `test` directory",
        maxArgs: 1,
        func: function (name) {
            let projectDir = process.cwd();
            if (fs.existsSync('manifest.json')) {
                let manifest = global.manifest = JSON.parse(fs.readFileSync('manifest.json'));
                if ('directory' in manifest && manifest.directory) {
                    process.chdir(manifest.directory);
                }
            } else {
                print('info', '$#Yk<WARN> manifest.json not found');
            }
            let files;
            if (arguments.length) { // call by name
                if (!fs.existsSync(path.join(projectDir, '/test/' + name + '.js'))) {
                    throw new Error('test script not found: ' + name + '.js');
                }

                files = [name + '.js'];
            } else {
                files = fs.readdirSync(projectDir + '/test').filter(RegExp.prototype.test.bind(/\.js$/));
            }
            properties.check = true;
            loadAndRun('../src/module/test.js', function (module) {
                global.IntegrationTest = module.IntegrationTest;
                global.Test = module.Test;
                for (let file of files) {
                    module.run(path.join(projectDir, '/test/' + file));
                }
                module.summary();
            }).done();
        },
        completion: function (prefix) {
            if (!fs.existsSync('test')) return;
            let buf = '';
            for (let arr = fs.readdirSync('test'), i = 0, L = arr.length; i < L; i++) {
                let m = /(.+)\.js$/.exec(arr[i]);
                if (m) {
                    buf = completion(buf, prefix, m[1]);
                }
            }
            return buf;

        }
    },
    "rc-create": {
        help: "create sysv rc/init script for a program",
        args: "<filename> <program directory> [--user=<username>] [--alias.xxx=xxx ...]",
        maxArgs: 3,
        desc: "creates a script file in /etc/init.d that can be used to control the program.\n\n" +
        "Optional arguments:\n" +
        "  \x1b[36muser\x1b[0m target user to be used to run the script, default to \x1b[32mroot\x1b[0m\n" +
        "  \x1b[36malias.xxx\x1b[0m add optional behavior or override default behaviors. For example:\n" +
        "    \x1b[32m--alias.foobar=foobar\x1b[0m  add an optional behavior named foobar\n" +
        "    \x1b[32m--alias.foobar=foobaz\x1b[0m  optional behavior foobar will trigger foobaz\n" +
        "    \x1b[32m--alias.start=foobaz\x1b[0m   override default behavior start with foobaz\n",
        func: function (filename, dir) {
            if (arguments.length < 2)
                return showHelp();
            callService('rc_create', {filename: filename, dir: dir, entryFile: __filename});
        }, completion: function () {
            let lastArg = arguments[arguments.length - 1];
            if (!lastArg) return;
            if (lastArg.substr(0, 7) === '--user=') {
                return completeUsername(lastArg, '--user=');
            }
        }
    },
    "config": {
        help: "configuration helper",
        args: "[<configuration name>]  [<configuration value>] | -d <configuration name>",
        desc: "gets and sets configurations for current user.",
        func: function (name, val) {
            let config = readConfig();
            if (arguments.length === 0) {
                let buf = '';
                for (var k in config) {
                    buf += k + ': ' + JSON.stringify(config[k]) + '\n';
                }
                process.stdout.write(buf);
            } else if (arguments.length === 1) {
                if (name === '-d') {
                    throw new Error('configuration name to be deleted is required');
                }
                if (name in config) {
                    process.stdout.write(config[name] + '\n');
                }
            } else {
                if (name === '-d') {
                    if (!(delete config[val])) return; // not modified
                } else {
                    config[name] = val;
                }
                fs.writeFileSync(getFilePath('config.json'), JSON.stringify(config, null, 2));
            }
        }, completion: function (name) {
            if (arguments.length === 1 || arguments.length === 2 && name === '-d' && (name = arguments[1])) {
                var buf = '', config = readConfig();
                for (let key in config) {
                    buf = completion(buf, name, key);
                }
                return buf;
            }
        }
    },
    "update": {
        help: "update modules from server",
        args: "[<modules>]",
        desc: "query the server for updates of modules in src/module.",
        func: function () {
            let modules = Array.prototype.slice.call(arguments);
            process.chdir('src/module');
            require('../src/module_server').update(modules);
        }
    }
};

if (!args.length) {
    cmd = 'help';
} else if (!((cmd = args[0]) in commands)) {
    let config = readConfig();
    if ('alias.' + cmd in config) {
        cmd = config['alias.' + cmd];
        if (!(cmd in commands)) {
            cmd = 'help';
        }
    } else if ('trigger.' + cmd in config) { // trigger
        commander(args[1]);
        cmd = null;
    } else {
        cmd = 'help';
    }
}
cmd && commands[cmd].func.apply(null, args.slice(1));

function readConfig() {
    let configFile = getFilePath('config.json');
    if (!fs.existsSync(configFile)) return {};
    try {
        return JSON.parse(fs.readFileSync(configFile, 'utf8'));
    } catch (e) {
        return {};
    }
}

function getFilePath(name) {
    if (properties.dir) return path.resolve(properties.dir, name);
    else return path.join(process.env.HOME, '.agentk', name);
}

function showHelp() {
    args[0] = 'help';
    commands.help.func(cmd);
}

function loadAndRun(modulePath, cb) {
    let co = require('../src/co.js'),
        load = require('../index.js').load;
    return co.run(function () {
        return cb(load(path.join(__dirname, modulePath)).yield(), co);
    });
}

function completeRunningJobs(arg) {
    // read active jobs from file
    let file = getFilePath('programs');
    if (!fs.existsSync(file)) return;
    let arr = JSON.parse(fs.readFileSync(file, 'utf8')),
        curr = win32 ? process.cwd().replace(/\\/g, '/').toLowerCase() : process.cwd(),
        output = '';


    for (let program of arr) {
        let dir = program.dir;
        if (dir === curr) {
            output = completion(output, arg, '.', dir);
        } else if (curr[curr.length - 1] !== '/' && dir.substr(0, curr.length) === curr) {
            output = completion(output, arg, dir.substr(curr.length + 1), dir);
        } else {
            output = completion(output, arg, dir);
        }
    }
    return output;
}

function completion(buf, arg0) {
    for (let i = 2, L = arguments.length; i < L; i++) {
        let str = arguments[i];
        if (!arg0 || str.substr(0, arg0.length) === arg0) {
            return buf + str + '\n'
        }
    }
    return buf
}

function completeUsername(arg1, prefix) {
    prefix = prefix || '';
    let buf = '';
    for (let line of fs.readFileSync('/etc/passwd', 'binary').split('\n')) {
        if (!line || line.substr(line.length - 8) === '/nologin' || line.substr(line.length - 6) === '/false') continue;
        buf = completion(buf, arg1, prefix + line.substr(0, line.indexOf(':')))
    }
    return buf;
}