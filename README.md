Clickatell NodeJS Library
=========================================

Master: [![Build Status](https://secure.travis-ci.org/arcturial/clickatell-node.png?branch=master)](http://travis-ci.org/arcturial/clickatell)

This library allows easy access to connecting the [Clickatell's](http://www.clickatell.com) different messenging API's.


1. Installation
------------------

This library is managed by the **Node Package Manager**

`npm install clickatell-node`

2. Usage
------------------

All calls are asynchronous and the parameters follows the nodeJS convention of specifying any errors as the first parameter and the
response as the second.

```javascript

var clickatell = require('clickatell-node').http(user, pass, api_id);
// var clickatell = require('clickatell-node').rest(token);

clickatell.sendMessage(["00000000000"], "My Message", {}, function (err, messages) {

    for (var key in messages) {
        var message = messages[key];

        console.log(message);

        // Message response format:
        // message.id (false if error)
        // message.destination
        // message.error (false if no error)
        // message.code (false if no error)
    }

});

```


3. Supported API calls
------------------

The available calls should be defined as the following. Whenever you write a new adapter (API type) you should also try to stick
to this interface.

```javascript

sendMessage(to, message, extra, callback);

getBalance(callback);

stopMessage(apiMsgId, callback);

queryMessage(apiMsgId, callback);

routeCoverage(msisdn, callback);

getMessageCharge(apiMsgId, callback);

```

The callback uses the standard way of handling response and will be invoked with the following parameters:

```javascript

sendMessage(["0000000000"], "My Message", {}, function (err, messages) {

});

```

4. SendMessage parameters that are not supported
---------------

The `sendMessage` calls supports a third parameter called `extra`. This parameter can be used to specify any values in the [Clickatell documentation](http://www.clickatell.com) that the library does not support as part of the public interface.

5. Testing
---------------

To run the library test suite just execute `npm test` from the library root. Please make sure all tests are passing before pushing back any changes.