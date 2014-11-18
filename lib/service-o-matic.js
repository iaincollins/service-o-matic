var express = require('express');
var changeCase = require('change-case');
var crypto = require('crypto');
var app = express();

module.exports = new function() {
    
    var services = {};
    
    this.addService = function(serviceName, serviceObject, propertiesToExpose) {
        
        var webServiceName = changeCase.paramCase(serviceName);
        var webMethods = {};
        var serviceId = '_'+crypto.createHash('sha1').update(JSON.stringify({
            serviceName: serviceName,
            serviceObject: serviceObject.toString()
        })).digest("hex");
        global[serviceId] = serviceObject;
        
        services[serviceName] = webServiceName;

        if (typeof serviceObject == "function")
            serviceObject['service'] = serviceObject;

        var javascript = '';
        for (var property in serviceObject) {
            if (typeof serviceObject[property] == "function" || typeof serviceObject[property] == "object") {

                if ( // If propertiesToExpose is null expose all properties
                    propertiesToExpose == null
                    // Expose methods with "use webservice" declared inside them
                    || (serviceObject[property].toString().match(/(\"|')use webservice(\"|')/))
                    // If propertiesToExpose is not null then treat propertiesToExpose as whitelist array of properties to be exposed.
                    || (Array.isArray(propertiesToExpose) && propertiesToExpose.indexOf(property) > -1) ) {
                    
                    // Extract arguments
                    var methodArguments = serviceObject[property].toString().match(/^\s*function\s+(?:\w*\s*)?\((.*?)\)/);
                    methodArguments = methodArguments ? (methodArguments[1] ? methodArguments[1].trim().split(/\s*,\s*/) : []) : null;
                    
                    // @fixme Should be option drive, not argument name driven
                    // If the last argument is named 'callback' then assume
                    // the module only supports callbacks not promises (lame!)
                    // Although crazy hacky this works for LOTS of modules.
                    var usesCallbacks = false;
                    if (methodArguments
                        && methodArguments.length > 0
                        && methodArguments[methodArguments.length - 1].toLowerCase() === 'callback') {
                        usesCallbacks = true;
                        methodArguments.pop()
                    }
                    
                    var webMethodName = changeCase.paramCase(property);
                    var webMethodArguments = [];
                    for (arg in methodArguments) {
                        webMethodArguments.push(changeCase.paramCase(methodArguments[arg]));
                    }

                    javascript += 'app.all("/' + webServiceName + '/' + webMethodName + '", function(req, res, next) {';
                    javascript += 'res.setHeader("Access-Control-Allow-Origin", "*");';
                    for (var arg in webMethodArguments) {
                        javascript += ' var ' + methodArguments[arg] + ' = req.query["' + webMethodArguments[arg] + '"];';
                    }
                    
                    if (typeof serviceObject[property] == "function") {
                        if (usesCallbacks === true) {
                            javascript += '     res.setHeader("Content-Type", "application/json; charset=utf-8");';
                            var methodArgumentsAsString = methodArguments.toString();
                            if (methodArguments.length > 0)
                                methodArgumentsAsString += ',';
                            javascript += '     global["' + serviceId + '"]["' + property + '"](' + methodArgumentsAsString + ' function(error, response) {';
                            javascript += '         if (arguments.length > 2) {';
                            javascript += '             res.json(arguments);';
                            javascript += '         } else {';
                            javascript += '             res.json(response);';
                            javascript += '         }';

                            javascript += '     });';
                        } else {
                            javascript += ' try {';
                            javascript += '     global["' + serviceId + '"]["' + property + '"](' + methodArguments + ')';
                            javascript += '     .then(function(response) {'
                            javascript += '         res.setHeader("Content-Type", "application/json; charset=utf-8");';
                            javascript += '         if (arguments.length > 1) {';
                            javascript += '             res.json(arguments);';
                            javascript += '         } else {';
                            javascript += '             res.json(response);';
                            javascript += '         }';
                            javascript += '     });';
                            javascript += ' } catch(e) {';
                            javascript += '     res.setHeader("Content-Type", "application/json; charset=utf-8");';
                            javascript += '     res.json( global["' + serviceId + '"]["' + property + '"](' + methodArguments + ') );';
                            javascript += ' }';
                        }
                    } else if (typeof serviceObject[property] == "object") {
                        javascript += '     res.setHeader("Content-Type", "application/json; charset=utf-8");';
                        if (property) {
                            javascript += '     res.json( global["' + serviceId + '"].' + property  + ');';
                        } else {
                            javascript += '     res.json( global["' + serviceId + '"] );';
                        }
                    }

                    javascript += '});';

                    if (webMethodArguments.length > 0) {
                        console.log("Created endpoint /" + webServiceName + "/" + webMethodName + " with arguments: " + webMethodArguments);
                    } else {
                        console.log("Created endpoint /" + webServiceName + "/" + webMethodName);
                    }

                    webMethods[webMethodName] = webMethodArguments;
                }
            }
        }

        // OH NOES, EVAL! DON'T LOOK. ITSATRAP.
        eval(javascript);

        app.get("/" + webServiceName, function(req, res, next) {
            res.setHeader('Content-Type', 'text/html; charset="UTF-8"');
            var html;
            html = '<head><link rel="stylesheet" href="//maxcdn.bootstrapcdn.com/bootstrap/3.2.0/css/bootstrap.min.css"></head>';
            html += '<body class="container">';
            html += '<div class="row"><div class="col-sm-9">';
            html += "<h1>" + serviceName + " <small>Service</small></h1>";
            html += '<p class="lead">The following endpoints are available from this webservice:</p>';
            html += '<ul class="list-unstyled">';
            for (var webMethod in webMethods) {
                html += '<li>';
                html += '<h3><a href="/' + webServiceName + '/' + webMethod;
                if (webMethods[webMethod].length > 0)
                    for (var i = 0; i < webMethods[webMethod].length; i++) {
                        if (i == 0) {
                            html += "?";
                        } else {
                            html += "&";
                        }
                        html += webMethods[webMethod][i] + '=';
                    }
                html += '">/' + webServiceName + '/' + webMethod + '</a></h3>';
                if (webMethods[webMethod].length > 0) {
                    html += '<form method="get" action="/' + webServiceName + '/' + webMethod + '" name="' + webMethod + '" class="well form-horizontal">';
                    for (var i = 0; i < webMethods[webMethod].length; i++) {
                        html += '<div class="form-group">';
                        html += '<label class="col-sm-3 control-label">' + changeCase.titleCase(webMethods[webMethod][i]) + '</label>';
                        html += '<div class="col-sm-9"><input name="' + webMethods[webMethod][i] + '" type="text" class="form-control" /></div>';
                        html += '</div>';
                    }
                    html += '<div class="form-group"><div class="col-sm-12 text-right"><button class="btn btn-primary" type="submit"">Submit</button></div></div>';
                    html += '</form>';
                } else {
                    // html += '<p class="lead"><em>No arguments.</em></p>';
                }
                html += '</li>';
            }
            html += '</ul>';
            html += '</div></div>';
            html += '</body>';
            res.send(html);
        });

        console.log("Generated documentation at /" + webServiceName);

    };
    
    /** 
     * @deprecated Use addService() instead
     */
    this.createService = function(serviceName, serviceObject, propertiesToExpose) {
        this.addService(serviceName, serviceObject, propertiesToExpose);
    }
    
    this.startServices = function(port) {
        
        app.set('port', process.env.PORT || 3000);
        if (port)
             app.set('port', port);

         app.use(function(req, res, next) {
             next();
         });

         app.get("/", function(req, res, next) {
             res.setHeader('Content-Type', 'text/html; charset="UTF-8"');
             var html = '<head><link rel="stylesheet" href="//maxcdn.bootstrapcdn.com/bootstrap/3.2.0/css/bootstrap.min.css"></head>';
             html += '<body class="container">';
             html += '<div class="row"><div class="col-sm-9">';
             html += "<h1>Web Services</small></h1>";
             html += '<p class="lead">The following webservices are available from this host:</p>';
             html += '<ul class="list-unstyled">';
             for (var webService in services) {
                 html += '<li>';
                 html += '<h3><a href="/' + services[webService] + '">' + webService + '</a></h3>';
                 html += '</li>';
             }
             html += '</ul>';
             html += '</div></div>';
             html += '</body>';
             res.send(html);
         });
         
         app.use(function(req, res, next) {
             res.setHeader('Content-Type', 'text/html; charset="UTF-8"');
             res.status(404);
             var html = '<head><link rel="stylesheet" href="//maxcdn.bootstrapcdn.com/bootstrap/3.2.0/css/bootstrap.min.css"></head>';
             html += '<body class="container">';
             html += '<div class="row"><div class="col-sm-9">';
             html += "<h2>404 - File not found</h2>";
             html += '</div></div>';
             html += '</body>';
             res.send(html);
         });

        app.listen(app.get('port'), function() {
            console.log('Server listening on port %d in %s mode', app.get('port'), app.get('env'));
        });
    }
    return this;
}