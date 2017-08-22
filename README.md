JMeter test for HappyChat

Login&WS.jmx - Jmeter test plan file which is include multiple request.
users.csv - CSV with username/password pairs used in tests

test plan consists of next steps:
- log in
- collect REST API cookies
- receiving Session_ID and User info from REST API
- receiving JWT Token from REST API
- receiving SID for both happychat and calypso.localhost (might be not needed)
- Creating Socket.IO session with JWT Token
- Sending some messages in to created stream