let request = require('request');
let config = {};

module.exports = function (params) {
  config = params.config;
  return {
    'send': sendPushNotifications
  };
};

let sendPushNotifications = (dtarray, msgtosend) => {
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

let sendPNAndroid = (dtarray, msgtosend, c) => {
  console.log('sendPNAndroid');
  let url    		= config.pn.fcm.url;
  let api_key 	= config.pn.fcm.apiKey;

  let registrationIDs = dtarray;
  console.log(dtarray);
  console.log(msgtosend);
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
  console.log(headers);
  let options = {
    method: "POST",
    url: url,
    headers: headers,
    body: fields,
    json: true
  };

  request(options, function (error, response, body) {
    if (error) throw new Error(error);
    console.log(body);
  });
}

let sendPNApple = (dtarray, msgtosend, c) => {
  console.log('sendPNApple');
  let url    		  = config.pn.fcm.url;
  let api_key 		= config.pn.fcm.apiKey;

  let arrayToSend 	= {};
  let headers 		  = [];

  let title     = msgtosend['title'];
  let message   = msgtosend['message'];

  if(msgtosend['msgtype']=='new_call')
  {
      let notification 	= {
        "title": title,
        "text": message,
        "data": {
          "msgtype": msgtosend['msgtype'],
          "dataPacket": msgtosend['dataPacket']
        }
      };

      arrayToSend 	= {
        "registration_ids": dtarray,
        "notification": notification,
        "priority": "high"
      }
  }
  else
  {
    arrayToSend 	= {
      "registration_ids": dtarray,
      "data": {
        "msgtype": msgtosend['msgtype'],
        "dataPacket": msgtosend['dataPacket']
      }
    };
  }
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
