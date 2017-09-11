# HappyChat Socket.IO user emitter

This tool designed to simulate HappyChat user activity. It uses `axios` for HTTP requests, and `socket.io-client` for all socket actions. At the moment it can only authenticate and send messages to HC.

It was tested on 20 concurrent users and it seems work fine. Right now I'm not sure about possible concurrency limitations. Generating high load is not guarantied.

## How to run

Before running this tool you need to provide list (or at least 1) user account in config file. Check `local.example.json` for more details.

Also, make sure there at least 1 HappyChat support user is online and available (so users would be able to send their messages to someone)

**To run simulation execute `./node_modules/.bin/babel-node ./src/runner.js`**

Script will fetch all the `testAccounts` from config and then will open the socket and start to send a messages within some predefined `pollingTime` interval

TODO:

- Research for tools or maybe think of how to define different socket actions and situations. [`k6`](https://github.com/loadimpact/k6) - maybe not possible to use npm libraries. investigations is required.
- Think about how to create load: run multiple sockets for different users. As one of the approaches: separate init and load logic, and run load part in `while(true)` loop after init part is completed.
- Nicely terminate all the sockets. google SIGTERM handler
- Maybe start using groups(in `HCSocket#open`) for more users per support guy rate.
