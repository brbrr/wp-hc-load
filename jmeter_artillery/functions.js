module.exports = {
  setJSONBody: setJSONBody,
  logHeaders: logHeaders,
  logResponse: logResponse,
  extractWpApi: extractWpApi,
  logRequest: logRequest,
  prepJwtReq: prepJwtReq,
  addTimestamp: addTimestamp
}

function setJSONBody(requestParams, context, ee, next) {
  return next(); // MUST be called for the scenario to continue
}

function addTimestamp(requestParams, context, ee, next) {
  requestParams.url += "&t=" + Date.now();
  return next(); // MUST be called for the scenario to continue
}

function prepJwtReq(requestParams, context, ee, next) {
  var payload = "{\"user\":" +
    JSON.stringify(context.vars["usrInfo"]) +
    ",\"session_id\":" +
    context.vars["sessionId"] + 
    "}"
  requestParams.body = "payload=" + encodeURIComponent(payload);
  // context.vars["jwtPayload"] = "payload=" + encodeURIComponent(payload);
  return next(); // MUST be called for the scenario to continue
}

function logRequest(requestParams, context, ee, next) {
  console.log(requestParams);
  return next(); // MUST be called for the scenario to continue
}

function logHeaders(requestParams, response, context, ee, next) {
  console.log(response.headers);
  return next(); // MUST be called for the scenario to continue
}

function logResponse(requestParams, response, context, ee, next) {
  console.log(response);
  return next(); // MUST be called for the scenario to continue
}

function extractWpApi(requestParams, response, context, ee, next) {
  var cookies = response.headers["set-cookie"];
  context.vars["wpApi"] = cookies[0].match(/wp_api=(.+?);(.*)/)[1];
  context.vars["wpApiSec"] = cookies[1];
  return next(); // MUST be called for the scenario to continue
}

