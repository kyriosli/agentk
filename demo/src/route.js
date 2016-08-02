/**
 * This is the route rules config file for
 */

import Router from 'module/router';
import * as view from 'module/view';
import {Response} from 'module/http';

view.view_engine = manifest.config.view_engine;
view.path = manifest.config.views;

const route = new Router();

route.exact('/', req => view.render("index", {
    title: 'Demo project for AgentK',
    message: 'It works!'
}));

// TODO: add more url rules

route.all(req => new Response('<h1>Oops</h1><p>Something bad happened. <a href="javascript:history.back()">back</a></p>', {
    status: 404,
    headers: {
        'content-type': 'text/html'
    }
}));

export default route;