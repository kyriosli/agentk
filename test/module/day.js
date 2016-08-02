import {Response} from '../../src/module/http';

export default function () {
    return new Response('' + new Date().getDay())
}