$(function(){

	var lambdaEndpoint = 'https://715b5n02xc.execute-api.us-east-1.amazonaws.com/dev/iotkeys'

    // Step 1: query the Lambda endpoint to get a set of Amazon credentials, which will allow us to call the
    // IoT API and subscribe to the topics we want.  These credentials are generated via STS and are valid
    // for one hour by default.  The server will return a Client ID which we must use to connect; the credentials
    // will only be valid if we use that ID.
    var connect = function(){
        $.post(
            lambdaEndpoint,
            {
                // Some sort of authentication is a good idea here!  Retrieve some identifying token from elsewhere
                // in your application and send it along; preferably one that can be verified without needing to access
                // any stateful resources.
                authToken: 'foobar',
                topic: 'drivers'
            },
            function(res){
                console.log(res);
                subscribe(res);
            },
            'json'
        );
    };
    connect();

    // Step 2: connect to IoT using the supplied credentials.  The Lambda gives us the websocket URL to use complete with
    // STS token credentials, so we can use a lightweight library like Paho rather than the full-blown AWS SDK.
    // Once we've connected, we can subscribe to the topic the Lambda has indicated will be accepted.
    var subscribe = function(config){

		// Create a client instance
		client = new Paho.MQTT.Client(
			config.websocket.host,
			443,
			config.websocket.path,
			config.clientId
		);

		// set callback handlers
		client.onConnectionLost = onConnectionLost;
		client.onMessageArrived = onMessageArrived;

		// connect the client
		client.connect({useSSL: true, onSuccess:onConnect});


		// called when the client connects
		function onConnect() {
		    // Once a connection has been made, make a subscription and send a message.
            console.log('Connected to IoT, now subscribing to topic ' + config.topic)
			client.subscribe(config.topic);
		}

		// called when the client loses its connection
		function onConnectionLost(responseObject) {
		  if (responseObject.errorCode !== 0) {
            console.log('Connection lost')
		  }
		}

		// called when a message arrives
		function onMessageArrived(message) {
            console.log('Received a message from topic "' + message.destinationName + '": ' + message.payloadString)
		}
    }

    // Publishing messages from the client into the topic is also really easy, if you change the Lambda
    // function to grant the appropriate permissions:
    //
    // var sendMessage = function(topic, message){
	//     message = new Paho.MQTT.Message(message);
	//     message.destinationName = topic;
	//     client.send(message);
    // }
});
