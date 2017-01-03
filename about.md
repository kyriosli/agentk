---
permalink: "/"
layout: index
title: 首页
in_nav: true
---

AgentK 是一个集成了运行环境和开发辅助于一体的`Node.JS`开发框架。

## 特性

 - ES6模块支持
 - 通过协程(coroutine)提供优雅的编程范式
 - 极小运行时开销
 - 集成进程守护
 - 提供HTTP/路由/模版引擎等常见功能

## 示例

如何启动一个HTTP服务
```js
import {listen, Response} from 'module/http'

const server = listen(8080, function(request) {
  return new Response('hello, world!')
});

console.log('server started at ' + server.address().port)
```

如何处理一个HTTP请求
```js
import handler from 'route.js'
server = listen(8080, handler)

// ---- route.js ---- 
import Router from 'module/Router';
import * as view from 'module/view'

const routes = new Router();

routes.exact('/', function(request) {
  const data = getData();
  // ...
  return view.render('home', data);
});

export default routes;
```

如何