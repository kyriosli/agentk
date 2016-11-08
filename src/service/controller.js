import * as http from '../module/http';
import * as file from '../module/file';

const _cp = require('child_process');
const path = require('path');

const win32 = process.platform === 'win32';
const listen_path = process.properties.dir ?
    path.resolve(process.properties.dir, 'daemon.sock') :
    path.join(process.env.HOME, '.agentk/daemon.sock');

const dir = win32 ? process.cwd().replace(/\\/g, '/').toLowerCase() : process.cwd();

export function start() {
    getData(tryCallService('start', dir));
}

export function fallback(cmd) {
    getData(callService(cmd, dir));
}

export function service_start() {
    let alive = getData(tryCallService('alive'));
    if (alive !== true) {
        throw new Error('start failed');
    }
}

export function service_stop() {
    callService('exit');
}

export function rc_create(options) {
    let defaults = {start: 1, stop: 1, restart: 1, reload: 1, status: 1};

    let username = 'root', scripts = '', keys = '', properties = process.properties;
    for (let key of Object.keys(properties)) {
        if (key === 'user') {
            username = properties.user;
        } else if (key.substr(0, 6) === 'alias.') {
            let aliased = key.substr(6), action = properties[key];
            if (aliased === action) {
                defaults[aliased] = 1;
            } else {
                delete defaults[aliased];
                scripts += '  ' + aliased + ')\n    send_msg ' + JSON.stringify(properties[key]) + '\n    ;;\n';
                keys += '|' + aliased;
            }
        }
    }

    const rundir = getDirectory(username);
    const dir = path.resolve(options.dir);

    let cmd = addslashes(process.execPath) + ' --harmony ' + addslashes(options.entryFile) + ' $1 ' + addslashes(dir) + ' --dir=' + addslashes(rundir);
    if (username !== 'root') {
        cmd = 'su ' + username + ' -c "' + cmd + '"'
    }

    let defaultKeys = Object.keys(defaults).join('|');
    if (defaultKeys) {
        scripts = '  ' + defaultKeys + ')\n    send_msg "$1"\n    ;;\n' + scripts;
        keys = defaultKeys + keys;
    } else {
        keys = keys.substr(1);
    }

    const outFile = '/etc/init.d/' + options.filename;
    file.write(outFile, '#!/bin/sh\n\
function send_msg() {\n\
  ' + cmd + '\n\
}\n\n\
case "$1" in\n' + scripts + '\
  *)\n\
    echo "Usage: $0 {' + keys + '}"\n\
    exit 2\n\
esac\n');
    file.chmod(outFile, '755');
    console.log('rc script file created.\nUsage: \x1b[36m' + outFile + '\x1b[0m {' + keys + '}');

    function addslashes(str) {
        return str.replace(/[^0-9a-zA-Z\.\-\_\+=\/~]/g, '\\$&');
    }
}

export function service_upstart_install() {
    let uname = process.properties.user || 'root';
    let version;
    try {
        version = co.sync(_cp.exec, 'initctl version') + '';
    } catch (e) {
        throw new Error('upstart not installed');
    }

    let vers = /upstart (\d+)\.(\d+)/.exec(version);
    if (!vers) {
        throw new Error('unrecognized output of `initctl version`: ' + version);
    }
    vers = vers[0] * 10000 + vers[1] * 1;

    const filename = `/etc/init/ak_${uname}.conf`;
    if (file.exists(filename)) {
        throw new Error(`${uname}: service already installed`);
    }

    file.write(filename, `description "AgentK: Integrated Node.JS Framework"

start on filesystem
stop on runlevel [016]

respawn
chdir ${getDirectory(uname)}
${vers >= 10004 ? `
setuid ${uname}

exec ${nodeScript()}
` : `
exec /bin/su ${uname} <<< "exec ${nodeScript()}"`}
`);

    console.log(`${uname}: service installed, use \x1b[36msudo initctl start ak_${uname}\x1b[0m to start the service`);
}

export function service_upstart_uninst() {
    let uname = process.properties.user || 'root';
    const filename = `/etc/init/ak_${uname}.conf`;
    if (!file.exists(filename)) {
        throw new Error(`${uname}: service not installed`);
    }
    file.rm(filename);
}

export function service_systemd_install() {
    let uname = process.properties.user || 'root';
    const filename = `/etc/systemd/system/ak_${uname}.service`;
    if (file.exists(filename)) {
        throw new Error(`${uname}: service already installed`);
    }

    file.write(filename, `[Unit]
Description=AgentK: Integrated Node.JS Framework

[Service]
User=${uname}
WorkingDirectory=${getDirectory(uname)}
ExecStart=${nodeScript()}
ExecReload=${process.execPath} --harmony ${addslashes(path.join(__dirname, '../../bin/agentk.js'))} reload --all
KillMode=process
Restart=on-failure

[Install]
WantedBy=multi-user.target
`);

    file.symlink(`../ak_${uname}.service`, `/etc/systemd/system/multi-user.target.wants/ak_${uname}.service`);
    console.log(`${uname}: service installed, use \x1b[36msudo systemctl start ak_${uname}.service\x1b[0m to start the service`);
}

export function service_systemd_uninst() {
    let uname = process.properties.user || 'root';
    const filename = `/etc/systemd/system/ak_${uname}.service`;
    if (!file.exists(filename)) {
        throw new Error(`${uname}: service not installed`);
    }
    file.rm(filename);
    file.rm(`/etc/systemd/system/multi-user.target.wants/ak_${uname}.service`);
}

export function service_sysv_install() {
    let uname = process.properties.user || 'root';

    let inittab = '/etc/inittab',
        script = sysvScript(uname),
        current = '' + file.read(inittab);

    let idx = current.indexOf(script), installed = idx !== -1;

    if (installed) {
        throw new Error(`${uname}: service already installed`);
    }
    let found_ids = current.match(/^k[0-9a-zA-Z]:/mg), next_id;
    for (let i of '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ') {
        if (!found_ids || found_ids.indexOf('k' + i + ':') === -1) {
            next_id = i;
            break
        }
    }
    if (!next_id) {
        throw new Error("no unique key available (too many installation)")
    }
    file.write(inittab, current + 'k' + next_id + script);
}

export function service_sysv_uninst() {
    let uname = process.properties.user || 'root';
    let inittab = '/etc/inittab',
        script = sysvScript(uname),
        current = '' + file.read(inittab);

    let idx = current.indexOf(script), installed = idx !== -1;
    if (!installed) {
        throw new Error(`${uname}: service not installed`);
    }
    file.write(inittab, current.substr(0, idx - 2) + current.substr(idx + script.length + 2))
}

function sysvScript(uname) {
    return `:2345:respawn:/bin/su ${addslashes(uname)} <<< "cd ${getDirectory(uname)}; exec ${nodeScript()}"\n`;
}

function nodeScript() {
    let dir = addslashes(path.join(__dirname, '../..'));
    return `${addslashes(process.execPath)} --harmony ${dir}/index.js load ${dir}/src/service/daemon.js >> out.log 2>> err.log`;
}

function getData(result) {
    if (result.code !== 200) {
        throw new Error(result.msg)
    }
    return JSON.parse(result.msg)
}

export function description() {
    console.log(`\x1b[32mak service <command>\x1b[0m controls service status or installs/uninstalls service from
   operating system. A \x1b[33mservice\x1b[0m is a background process that runs and controls
   the user program, restarts it when it has exited unexpectedly.

\x1b[36mSYNPOSIS\x1b[0m

  ak service start
  ak service stop
  ak service systemd_install [--user=<username>] [--dir=<directory>]
  ak service systemd_uninst  [--user=<username>]
  ak service upstart_install [--user=<username>] [--dir=<directory>]
  ak service upstart_uninst  [--user=<username>]
  ak service sysv_install    [--user=<username>] [--dir=<directory>]
  ak service sysv_uninst     [--user=<username>]

\x1b[36mDESCRIPTION\x1b[0m

\x1b[32;1m● \x1b[32mak service start\x1b[0m: starts the service if it has not ben started.
    If there are running user programs when the service is stopped or killed,
    they will be respawned. Command \x1b[32mak start <program>\x1b[0m will also restarts the
    service if it has not been started.

\x1b[32;1m● \x1b[32mak service stop\x1b[0m: stops the service.
    All running programs will be killed, and will be respawned when the service
    starts again

\x1b[32;1m● \x1b[32mak service systemd_install\x1b[0m: installs daemon service into operating system's
    \x1b[35msystemd\x1b[0m scripts.
    Systemd is a high performance service manager.
  ● To check whether your system supports systemd, run
        \x1b[36msudo systemctl --version\x1b[0m
  ● A \x1b[34;1musername\x1b[0m can be supplied like \x1b[33m--user=xxx\x1b[0m, otherwise \x1b[31;1mroot\x1b[0m will be used.
  ● A \x1b[34;1mdirectory\x1b[0m can be supplied like \x1b[33m--dir=xxx\x1b[0m, otherwise \x1b[31;1m/home/{user}/.agentk\x1b[0m
    will be used. You can then interact with the deamon later with a same
    argument, for example:
        \x1b[36msudo ak service systemd_install --user=kyrios --dir=/var/run/agentk\x1b[0m
        \x1b[36mak start --dir=/var/run/agentk\x1b[0m (must run as kyrios)
  ● The daemon service will be automatically started when the computer finishes
    its boot, and respawned if killed unexpectedly.
  ● To make the installation to take effect immediately, run
        \x1b[36msudo systemctl start ak_[username].service\x1b[0m

\x1b[32;1m● \x1b[32mak service systemd_uninst\x1b[0m: removes the systemd service installation
    \x1b[33mPLEASE DO\x1b[0m stop the service before it is uninstalled, run
  ● To check whether the service is running, run
        \x1b[36msudo systemctl status ak_[username].service\x1b[0m
  ● To stop the service, run
        \x1b[36msudo systemctl stop ak_[username].service\x1b[0m

\x1b[32;1m● \x1b[32mak service upstart_install\x1b[0m: like \x1b[36msystemd_install\x1b[0m, but uses \x1b[35mupstart\x1b[0m to control
    the service.
    Upstart is a event-driven service manager.
  ● To check whether your system supports upstart, run
        \x1b[36msudo initctl version\x1b[0m
  ● A \x1b[34;1musername\x1b[0m and \x1b[34;1mdirectory\x1b[0m can be supplied (see \x1b[32;1msystemd_install\x1b[0m)
  ● To make the installation to take effect immediately, run
        \x1b[36msudo initctl start ak_[username]\x1b[0m

\x1b[32;1m● \x1b[32mak service upstart_uninst\x1b[0m: removes the upstart service installation
    \x1b[33mPLEASE DO\x1b[0m stop the service before it is uninstalled, run
  ● To check whether the service is running, run
        \x1b[36msudo initctl status ak_[username]\x1b[0m
  ● To stop the service, run
        \x1b[36msudo initctl stop ak_[username]\x1b[0m

\x1b[32;1m● \x1b[32mak service sysv_install\x1b[0m: like \x1b[36msystemd_install\x1b[0m, but uses \x1b[35msysvinit\x1b[0m to spawn and
    guard the daemon service.
  ● The sysvinit service manager is out of date, if you don't know which to
    choose, please contact your system admin
  ● To make the installation to take effect immediately, run
        \x1b[36msudo init q\x1b[0m

\x1b[32;1m● \x1b[32mak service sysv_uninst\x1b[0m: removes the sysvinit service installation.
    Run \x1b[36msudo init q\x1b[0m to make the uninstallation take effect.`);
}

export function status(hasDir) {
    let data = getData(callService('status', hasDir && [dir]));

    if (!data.length) {
        console.log('no program is currently running');
        return;
    }
    let maxPathLen = -1, maxSchedulerLen = -1;

    for (let i = 0, L = data.length; i < L; i++) {
        let obj = data[i],
            pathLen = obj.path.length;
        obj.schedulers = obj.schedulers.map(function (key) {
            let arr = key.split(':'); // address,port,family,fd
            if (arr[3]) return 'custom fd';
            if (arr[1] === '-1') return 'UNIX (' + arr[0] + ')';
            let addrType = arr[2];
            addrType = addrType === '4' ? 'TCP4' : addrType === '6' ? 'TCP6' : addrType.toUpperCase();
            return addrType + ':' + (arr[0] || '*') + ':' + arr[1];
        }).join(', ');
        let schedLen = obj.schedulers.length;
        if (pathLen > maxPathLen) maxPathLen = pathLen;
        if (schedLen > maxSchedulerLen)maxSchedulerLen = schedLen;
    }
    let prefix = ' '.repeat(maxPathLen), suffix = ' '.repeat(maxSchedulerLen);
    let buf = prefix.substr(7) + '\x1b[35;1mProgram\x1b[0m | \x1b[36;1mworkers  ' +
        '\x1b[33mstart time           ' +
        '\x1b[31mlast restart         ' +
        '\x1b[36mrestarted  ' +
        '\x1b[32;1mschedulers\x1b[0m\n' +
        '-'.repeat(maxPathLen) + '-|---------------------------------------------------------------' + '-'.repeat(maxSchedulerLen) + '\n';
    for (let i = 0, L = data.length; i < L; i++) {
        let obj = data[i];
        let workers = obj.workers + '',
            restarted = obj.restarted + '';
        buf += prefix.substr(obj.path.length) + '\x1b[35' + (i & 1 ? '' : ';1') + 'm'
            + obj.path + '\x1b[0m | \x1b[36' + (i & 1 ? '' : ';1') + 'm'
            + workers + '       '.substr(workers.length) + '  \x1b[33m'
            + formatTime(obj.startup) + '  \x1b[31m'
            + formatTime(obj.lastRestart) + '  \x1b[36m'
            + restarted + '         '.substr(restarted.length) + '  \x1b[32m'
            + obj.schedulers + suffix.substr(obj.schedulers.length) + '\x1b[0m\n';
    }

    process.stdout.write(buf);

    function formatTime(t) {
        let time = new Date(t);
        return `${time.getFullYear()}-${tens(time.getMonth() + 1)}-${tens(time.getDate())} ${time.toTimeString().substr(0, 8)}`
    }

    function tens(num) {
        return (num < 10 ? '0' : '') + num;
    }
}

function callService(name, data) {
    let headers = {
        'Content-Length': '0'
    };
    if (data) {
        headers.data = JSON.stringify(data)
    }
    let resp = http.fetch(`unix://${win32 ? '//./pipe/ak_daemon' : listen_path}?${name}`, {
        method: 'GET',
        headers: headers
    }).yield();

    return {code: resp.status, msg: resp.text().yield()}
}

function tryCallService(name, data) {
    if (!file.exists(listen_path)) {
        console.error('starting service...');
        return forkAndCall(name, data);
    }
    try {
        return callService(name, data);
    } catch (e) {
        if (e.code === 'ECONNREFUSED' || e.code === 'ENOENT') {
            console.error('service not started, restarting...');
            file.rm(listen_path);
            return forkAndCall(name, data); // retry
        }
        return {code: -1, msg: e.message}
    }
}

function forkAndCall(name, data) {
    file.mkParentDir(listen_path);
    let service_dir = path.dirname(listen_path),
        stdout = file.open(path.join(service_dir, 'out.log'), 'a'),
        stderr = file.open(path.join(service_dir, 'err.log'), 'a');


    _cp.spawn(process.execPath, process.execArgv.concat([path.join(__dirname, '../../index.js'), 'load', path.join(__dirname, 'daemon.js')]), {
        cwd: service_dir,
        env: process.env,
        stdio: [0, stdout, stderr],
        detached: true
    }).unref();

    file.close(stdout);
    file.close(stderr);

    for (let i = 200; i--;) {
        co.sleep(10);
        if (file.exists(listen_path)) break;
        if (i > 200) {
            throw new Error('timeout waiting for service start');
        }
    }

    return callService(name, data);
}
function addslashes(str) {
    return str.replace(/[^0-9a-zA-Z.-_+=\/~]/g, '\\$&');
}
function getDirectory(uname) {
    if (process.properties.dir) return path.resolve(process.properties.dir);

    let m = file.read('/etc/passwd').toString().match(new RegExp(`^${uname}(?::[^:]*){4}:([^:]*)`, 'm'));
    if (m) {
        return m[1] + '/.agentk'
    } else {
        console.warn(`\x1b[33mWARN\x1b[0m unable to find home directory in /etc/passwd for user ${uname}, using /home/${uname}`);
        return '/home/' + uname + '/.agentk';
    }
}