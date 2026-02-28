function generateHex(length) {
  var result = "";
  var chars = "0123456789abcdef";
  for (var i = 0; i < length; i++) {
    result += chars[Math.floor(Math.random() * 16)];
  }
  return result;
}

function handler(event) {
  var request = event.request;
  var headers = request.headers;

  if (!headers["traceparent"]) {
    var traceId = generateHex(32);
    var spanId = generateHex(16);
    headers["traceparent"] = { value: "00-" + traceId + "-" + spanId + "-01" };
  }

  return request;
}
