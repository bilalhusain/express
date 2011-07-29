
/**
 * Module dependencies.
 */

var assert = require('assert')
  , http = require('http')
  , sys = require('sys');

module.exports = assert;

assert.response = function(app, req, res){
  if (app.fd) {
    ++app.pending;
    return assertResponse(app, req, res);
  }

  app.pending = 1;
  app.listen(0, function(){
    assertResponse(app, req, res);
  });
};

function fail(title, expected, actual) {
  console.error('\n\n  \033[31m%s\033[0m', title);
  console.error('    \033[90mExpected:\033[0m %s', sys.inspect(expected));
  console.error('    \033[90mGot:\033[0m %s\n', sys.inspect(actual));
  process.exit(1);
}

function assertResponse(app, req, res) {
  req.method = req.method || 'GET';
  res.status = res.status || 200;

  // http request
  var request = http.request({
      host: '127.0.0.1'
    , port: app.address().port
    , path: req.url
    , method: req.method
    , headers: req.headers
  });

  // write given data
  if (req.data) request.write(data);

  request.on('response', function(response){
    response.body = '';
    response.setEncoding('utf8');
    response.on('data', function(chunk){ response.body += chunk; });
    response.on('end', function(){

      // response body
      if (null != res.body) {
        assertResponseBody(res.body, response.body);
      }

      // response status
      if ('number' == typeof res.status) {
        assertResponseStatus(res.status, response.statusCode);
      }

      // response header fields
      if (res.headers) {
        assertResponseHeader(res.headers, response.headers);
      }

      --app.pending || app.close();
    });
  });

  request.end();
}

function assertResponseHeader(expected, actual) {
  Object.keys(expected).forEach(function(field){
    var actualVal = actual[field.toLowerCase()]
      , expectedVal = expected[field]
      , ok = expectedVal instanceof RegExp
        ? expectedVal.test(actualVal)
        : expectedVal == actual;
    if (ok) return;
    fail('Invalid response header field ' + field, expectedVal, actualVal);
  });
}

function assertResponseBody(expected, actual) {
  var ok = expected instanceof RegExp
    ? expected.test(actual)
    : expected === actual;
  if (ok) return;
  fail('Invalid response body.', expected, actual);
}

function assertResponseStatus(expected, actual) {
  if (expected == actual) return;
  fail('Invalid response status.', expected, actual);
}