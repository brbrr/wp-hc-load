# My failed takes on HC task

This folder contains all my work done for HC task. I have tried `JMeter` and `Artillery`. But after some work done - I came to understanding that these tools not quite suitable for our case. Here I'll describe what I've done and what was the problem. One of the challenges was socket.io, and lack of understanding from my side and lack of protocol documentation from other.

Here some findings on socket.io protocol:
[engine.io](https://github.com/socketio/engine.io-protocol)
[socket.io](https://github.com/socketio/socket.io-protocol)(build on top of engine.io)

## JMeter test for HappyChat

Login.jmx - Jmeter test plan file which includes multiple requests.
users.csv - CSV with username/password pairs used in test

test plan consists of next steps(globally - auth & socket stuff):

- log in
- collect REST API cookies
- receiving Session_ID and User info from REST API
- receiving JWT Token from REST API
- receiving SID for both happychat and calypso.localhost (might be not needed)
- Creating Socket.IO session with JWT Token
- Sending some messages in to created stream

Auth part was quite easy and straightforward. But Socket part turns out quite complex. JMeter doesn't support WebSockets out-of-the-box, but there 2 different plugins available. And here is the thing - Socket.IO is not compatible with WebSockets (though it build on top of WS). And without detailed protocol docs - its super complex to reverse engineer it.

## Artillery

Node based load tool build around YAML config files as DSL. Quite nice and easy to use tool, with great HTTP support, but lack of features in WS and Socket.IO. Have native support of Socket.IO.

`artillery.yaml` - test case file. include all the requests and Socket emits.
`functions.js` - helper functions used in test case for different purposes.

Here I ended up with quite the same result: auth part is done, but sockets wont work. The main blocker - HC handleshake (w/ JWT) and event handling. DLS didn't support that.

After reviewing both fails - I decide to pick-up `socket.io-client` library and start from scratch.
