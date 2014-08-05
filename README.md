Service-O-Matic
=========

The Service-O-Matic is a module for turning other modules into services.

You can expose multiple modules as webservices in once instance.

It will also generate lightweight documentation and web forms for each method.

It's currently a hack but if you find it useful or just intersting let me know.

me@iaincollins.com / @iaincollins

Here's demo of it running the services shown in usage examples below:

http://service-o-matic.iaincollins.com

### Limitations and supported features

* Service-O-Matic does not **currently** support functions that require parameters to be passed to them in objects.
* Service-O-Matic **does** support both promises and methods that take callbacks.
* The services are RESTful / JSON with Access-Control-Allow-Origin set to "*"
* Error handling is almost non existant.

### Usage with an existing module or library

Using Service-O-Matic is very straightforward. Let's take a simple example
service like the Random Password Generator.

Normally you might invoke it like this:
``` javascript
var passwordGenerator = require('random-password-generator');
var newPassword = passwordGenerator.generate();
```

To expose it as a webservice, all you need to do is this:

``` javascript
var service = require('service-o-matic');
service.createService('Random Password Generator',
                      require('random-password-generator'),
                      true);
service.startServices();
```

* The 1st argument to createService() is what you want to call your service.
* The 2nd argument to createService() the module (or other JS library) you want to expose.
* The 3rd argument being set to true tells Service-O-Matic to expose ALL properties of the library.

Unless you specify the 3rd argument, Service-O-Matic will by default only expose
properties marked as being inteded to be exposed as webservice. Currently only
one module - newsQuery - actually does this though.

## Exposing multiple services

The following example shows how to turn modules which provide a Dictionary 
lookup and a Thesaurus checker into services. The homepage of the server ("/")
will list all the services currently being exposed (which you can then click
through to see their methods and the arguments each method takes).

``` javascript
var service = require('service-o-matic');
service.createService('Dictionary', require('wordnet'), ['lookup']);
service.createService('Thesaurus', require('thesaurus'), ['find']);
service.startServices();
```

## Advanced usage

Some modules provide a range of features and you might need to expose elements 
of them as seperate services. The below example shows how to expose 3 different
services from the countryData module:

``` javascript
var service = require('service-o-matic');
var countryData = require('country-data');
service.createService('Countries', countryData.countries, true);
service.createService('Regions', countryData.regions, true);
service.createService('Currencies', countryData.currencies, true);
service.startServices(8080);
```

In the example above a port number has also been passed to startService().

You can also specify the port via the PORT shell variable.