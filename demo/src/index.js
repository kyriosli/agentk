/**
 * Entry file for AgentK demo project.
 *
 */

import {listen} from 'module/http';
import route from 'route';

let server = listen(manifest.config.port, route);

console.log('server started at', server.address());

export function reload() {
    console.log('reload triggered');
}
