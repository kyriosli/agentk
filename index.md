---
layout: index
---

AgentK 是一个集开发流程和运维于一体的`Node.JS`开发框架，旨在解决快速搭建`Node.JS`项目过程中常见的难题。

  1. 支持全新的ES6风格的模块书写和加载方式，以及类的定义，使得代码书写更加规范
  2. 通过协程方案解决了回调问题，异步代码可以同步书写，函数的封装对调用者不透明，不需要学习新的编程范式
  3. 集成进程管理和集群功能，提供操作系统级别的进程守护，防止意外宕机或被误杀
  4. 集成路由/模版引擎等常见功能，规范化开发细节

你可以通过`npm`安装AgentK:

    (sudo) npm install kyriosli/agentk -g

AgentK 支持`0.12.x`以上的node，但对`4.x`支持较差(不兼容一些ES6特性). 如果您使用较旧的node，如`0.12.x`，请尝试安装专门为低版本node准备的包: 

    (sudo) npm install kyriosli/agentk#old-node -g

安装成功了? 看看[快速上手](getting_started)吧

想要阅读更多，可以参考[教程](turtorial)

关注[changelog](changelog)第一时间得知最新功能特性