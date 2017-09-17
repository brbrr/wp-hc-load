# HappyChat Socket.IO user emitter

This tool designed to simulate HappyChat users. It uses `axios` for HTTP requests, and `socket.io-client` for all socket actions.

It is possible to simulate both users and HE's. 

It was tested on 20 concurrent users and it seems work fine. Right now I'm not sure about possible concurrency limitations. Generating high load is not guarantied.

## Before run

User and HE runners should be executed in separate terminals. Before running this tool you need to provide list (or at least 1) user account in config file, and it you plan to run HE - at least 1 HE account. Check `local.example.json` for more details.

When running only users - make sure there at least 1 HappyChat support user is online and available (so users would be able to send their messages to someone).

There is requirement for HE account - it should be a11n account, which means that you can not use test accounts as HE(at least for now). To be able to login HE account should have created app (web type) and provide its `client_id` & `client_secret`. For these accounts who have 2-factor auth(like mine), you need to generate app password as described [here](http://en.support.wordpress.com/security/two-step-authentication/).

## How to run

First of all you should start HE runner: `./node_modules/.bin/babel-node ./src/HERunner.js`

Then, depending on how many users you want, execute: `COUNT=X ./node_modules/.bin/babel-node ./src/UserRunner.js`
where `COUNT` is number of concurrent users to run. If omitted - will launch 1 user

## TODO:

- Research for tools or maybe think of how to define different socket actions and situations. [`k6`](https://github.com/loadimpact/k6) - maybe not possible to use npm libraries. investigations is required.
- Think about how to create load: run multiple sockets for different users. As one of the approaches: separate init and load logic, and run load part in `while(true)` loop after init part is completed.
- Nicely terminate all the sockets. google SIGTERM handler
- Maybe start using groups(in `HCSocket#open`) for more users per support guy rate.
