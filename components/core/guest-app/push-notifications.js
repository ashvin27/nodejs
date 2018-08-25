let request = require('request'),
config = require(__base + 'config');

module.exports = function (params) {
  return {
    send: (dtarray, msgtosend) => {
      if(dtarray.constructor===Array) {
        if(dtarray.length > 0)
        {
          androidDevices = [];
          iosDevices 	= [];
          dtarray.forEach(function(item){
            if(item.device_type=='android') {
              androidDevices.push(item.device_token);
            } else if(item.device_type=='apple') {
              iosDevices.push(item.device_token);
            }
          });
          if(androidDevices.length > 0) {
            sendPNAndroid(androidDevices, msgtosend);
          }
          if(iosDevices.length > 0) {
            sendPNApple(iosDevices, msgtosend);
          }
        }
      }
    }
  };
};

let sendPNAndroid = (dtarray, msgtosend, c) => {
  let url    		= config.pn.fcm.url;
  let api_key 	= config.pn.fcm.guestAppApiKey;

  let registrationIDs = dtarray;
  // console.log(dtarray);
  // console.log(msgtosend);
  let msg = {
    'message': msgtosend
  };

  let fields = {
    'registration_ids': registrationIDs,
    'data': msg
  };

  let headers = {
    'content-type': 'application/json',
    'authorization': 'key='+api_key,
    'content-length': (JSON.stringify(fields)).length
  };
  
  let options = {
    method: "POST",
    url: url,
    headers: headers,
    body: fields,
    json: true
  };
  //console.log(options);
  request(options, function (error, response, body) {
    if (error) throw new Error(error);
    console.log(body);
  });
}

let sendPNApple = (dtarray, msgtosend, c) => {
  
  let url    		  = config.pn.fcm.url;
  let api_key 		= config.pn.fcm.guestAppApiKey;

  let headers 		  = [];

  let arrayToSend 	= {
    "registration_ids": dtarray,
    "data": {
      "dataPacket": msgtosend
    },
    "priority": "high"
  };

  let json 			  = arrayToSend;
  headers = {
      "content-type": "application/json",
      "authorization": "key=" + api_key
  };

  let options = {
    method: "POST",
    url: url,
    headers: headers,
    body: json,
    json: true
  };

  request(options, function (error, response, body) {
    if (error) throw new Error(error);
    console.log(body);
    //console.log(error);
  });
}
