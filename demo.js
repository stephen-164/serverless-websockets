var awsIot = require('aws-iot-device-sdk');

$(function(){

    var iotKeys = {};

    // Step 1: query the Lambda endpoint to get a set of Amazon credentials, which will allow us to call the
    // IoT API and subscribe to the topics we want.  These credentials are generated via STS and are valid
    // for one hour by default.  The server will return a Client ID which we must use to connect; the credentials
    // will only be valid if we use that ID.
    var connect = function(){
        $.post(
            window.lambdaEndpoint,
            {
                // Some sort of authentication is a good idea here!  Retrieve some identifying token from elsewhere
                // in your application and send it along; preferably one that can be verified without needing to access
                // any stateful resources.
                authToken: 'foobar'
            },
            function(res){
                console.log("Endpoint: " + res.iotEndpoint);
                console.log("Region: " + res.region);
                console.log("AccessKey: " + res.accessKey);
                console.log("SecretKey: " + res.secretKey);
                console.log("ClientId: " + res.clientId);

                iotKeys = res; // save the keys

                subscribe();
            },
            'json'
        );
    };
    connect();

    // Step 2: connect to IoT using the supplied credentials.  We must use the given Client ID, and pass the Session Token
    // in addition to the normal access key id/secret.  Once we've connected, we can subscribe to the chosen topic.  You
    // might want to
    var subscribe = function(){
        window.iotClient = awsIot.device({
            region: iotKeys.region,
            protocol: 'wss',
            accessKeyId: iotKeys.accessKey,
            secretKey: iotKeys.secretKey,
            sessionToken: iotKeys.sessionToken,
            port: 443,
            host: iotKeys.iotEndpoint,
            clientId: iotKeys.clientId
        });

        iotClient.on('connect', function(){
            console.log('Connected to IoT, now subscribing')
            iotClient.subscribe(iotTopic);
        });

        iotClient.on('message', function(topic, message){
            // And we got a message!
            console.log('Received a message from topic "' + topic + '": ' + message)
        });

        iotClient.on('close', function(){
            console.log('Connection lost')
        });
    }

    // Publishing messages from the client into the topic is also really easy, if you change the Lambda
    // function to grant the appropriate permissions:
    //
    // var sendMessage = function(message){
    //     iotClient.publish(iotTopic, message);
    // }
});
