var static = require('node-static');

var fileServer = new static.Server('./test');

require('http').createServer(function (request, response) {
    request.addListener('end', function () {
        fileServer.serve(request, response);
        fileServer.serveFile('webtest.html', 200, {}, request, response);
    });
}).listen(8080);