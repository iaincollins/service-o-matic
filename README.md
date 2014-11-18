Service-O-Matic 1.0
=========

Service-O-Matic is a module for turning other modules into services.

* It's great for API prototyping and getting things up and running quickly.
* You can expose multiple modules/libriaries as webservices in once instance.
* It generates documentation and web forms for each method.

Email: Iain Collins <me@iaincollins.com> 
Twitter: @iaincollins

## Limitations and supported features

* Service-O-Matic supports both promises and methods that take callbacks (it attempts to work out which to support then tries to fall back gracefully).
* The services are RESTful / JSON with Access-Control-Allow-Origin set to "*" (POST, PUT, GET, DELETE methods are supported).
* Service-O-Matic does not support functions that take objects as their arguments. Everything sent over a RESTful interface is a string.

## Example usage

Using Service-O-Matic is very straightforward. Let's take a simple example
service like the Random Password Generator.

It's normally invoked like this:
``` javascript
var passwordGenerator = require('random-password-generator');
var newPassword = passwordGenerator.generate();
```

To expose it as a webservice with Service-O-Matic, all you need to do is:

``` javascript
var service = require('service-o-matic');
service.addService('Password Generator', require('random-password-generator'));
service.startServices();
```

* The 1st argument to addService() is what you want to call your service.
* The 2nd argument to addService() the module/library you want to expose.

## Exposing multiple services

The following example shows how to turn modules which provide a Dictionary 
lookup and a Thesaurus checker into services.

The homepage of the server ("/") will list all the services currently being exposed - you can then click through to see their methods and the arguments each method takes and test them out.

In this example the third argument is passed - an array of methods to expose (which overrides the default behaviour, which is to expose all methods).


``` javascript
var service = require('service-o-matic');
service.addService('Dictionary', require('wordnet'), ['lookup']);
service.addService('Thesaurus', require('thesaurus'), ['find']);
service.startServices();
```

## Advanced usage

Some modules provide a range of features and you might need to expose elements 
of them as seperate services. The below example shows how to expose 3 different
services from the countryData module:

``` javascript
var service = require('service-o-matic');
var countryData = require('country-data');
service.addService('Countries', countryData.countries,);
service.addService('Regions', countryData.regions);
service.addService('Currencies', countryData.currencies);
service.startServices(8080);
```

In the example above a port number has also been passed to startService().

You can also specify the port via the PORT shell variable.