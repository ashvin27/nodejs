let express     = require('express'),
router      = express.Router(),
bodyParser  = require('body-parser'),
pnSender    = require(__base + 
  'components/core/guest-app/push-notifications')({}),
pmsiGuestsDB    = require(__base + 
  'components/db-master/pmsi-guests'),
DVStatus = require(__base + 
  'components/core/helper/http-status-codes'),
logger      = require(__base + 
  'components/logger').log(),
logFormat   = require(__base + 
  'components/logger').format;

router.post('/services', (req, res) => {
  let params = req.body;
  if(params.feature=='pushNotification') {
    if(params.hasOwnProperty('details')) {
      getKey(params, res, (keyId) => {
        getGuestId(keyId, res, (err, guestIdArray) => {
          getDeviceToken(guestIdArray, res, (err, deviceTokenArray) => {
            console.log('DEVICE TOKEN ARRAY');
            console.log(deviceTokenArray);
            getMessage(params, (message) => {
              sendPushNotification(deviceTokenArray, message, (response) => {
                res
                .status(DVStatus.CREATED)
                .send({
                    status: true,
                    message: DVStatus.getMessage(DVStatus.RECORD_CREATION_SUCCESS,
                    'Push Notification'),
                    description: '',
                    data: response,
                    response_tag: DVStatus.RECORD_CREATION_SUCCESS
                });
              });
            });
          });
        });
      });
    } else {
      res
      .status(DVStatus.NOT_ACCEPTABLE)
      .send({
          status: false,
          message: DVStatus.getMessage(DVStatus.REQUEST_BODY_NOT_ACCEPTABLE,
          'Push Notification'),
          description: '',
          data: [],
          response_tag: DVStatus.REQUEST_BODY_NOT_ACCEPTABLE
      });
    }
  }
});

router.post('/fcm-registration', (req, res) => {
  let params = req.body;
  registerGuestDevice(params, res, (err, resData) => {

  });
});

let sendPushNotification = (deviceTokenArray, message, callback) => {
  pnSender.send(deviceTokenArray, message);
  callback(true);
};

let getKey = (params, res, callback) => {
  let details = params.details;
  if(details instanceof Array) {
    details = details[0];
    if(details.hasOwnProperty('notificationDetails')) {
      let notificationDetails = details.notificationDetails;
        notificationDetails = notificationDetails[0];
        console.log(notificationDetails);
        if(notificationDetails.hasOwnProperty('keyId')) {
          callback(notificationDetails.keyId);
        } else {
          res
          .status(DVStatus.NOT_ACCEPTABLE)
          .send({
              status: false,
              message: DVStatus.getMessage(DVStatus.REQUEST_BODY_NOT_ACCEPTABLE,
              'Push Notification'),
              description: '',
              data: [],
              response_tag: DVStatus.REQUEST_BODY_NOT_ACCEPTABLE
          });
        }
    } else {
      res
        .status(DVStatus.NOT_ACCEPTABLE)
        .send({
            status: false,
            message: DVStatus.getMessage(DVStatus.REQUEST_BODY_NOT_ACCEPTABLE,
            'Push Notification'),
            description: '',
            data: [],
            response_tag: DVStatus.REQUEST_BODY_NOT_ACCEPTABLE
        });
    }
  } else {
    res
        .status(DVStatus.NOT_ACCEPTABLE)
        .send({
            status: false,
            message: DVStatus.getMessage(DVStatus.REQUEST_BODY_NOT_ACCEPTABLE,
            'Push Notification'),
            description: '',
            data: [],
            response_tag: DVStatus.REQUEST_BODY_NOT_ACCEPTABLE
        });
  }
};

let getGuestId = (keyId, res, callback) => {
  let what = ['guest_id'];
  let conditions = {
    where: {
      key_id: keyId
    }
  };

  pmsiGuestsDB
  .select('pmsi_guests', what, conditions, (err, resData) => {
    if(resData && resData.length > 0) {
      console.log('GUEST recods exists for the KEY ID = ' + keyId);
      callback(null, resData);
    }
  });
};

let getDeviceToken = (guestIdObjArray, res, callback) => {
  let what = ['device_token', 'device_type'];
  let guestIdArray = guestIdObjArray.map(a => a.guest_id);
  console.log(guestIdArray);
  let conditions = {
    where_in: {
      key: 'pmsi_guest_id',
      value: guestIdArray
    }
  };

  pmsiGuestsDB
  .select('guest_app_device_tokens', what, conditions, (err, resData) => {
    if(resData && resData.length > 0) {
      //let deviceTokenArray = resData.map(a => a.device_token);
      callback(null, resData);
    }
  });
};

let getMessage = (params, callback) => {
  callback(JSON.stringify(params.details[0].notificationDetails));
};

let registerGuestDevice = (params, res, callback) => {
  if( 
    typeof params.guest_id=='undefined' || params.guest_id=='' || 
    typeof params.device_id=='undefined' || params.device_id=='' || 
    typeof params.device_token=='undefined' || params.device_token=='' || 
    typeof params.device_type=='undefined' || params.device_type==''
  ) {
    res
      .status(DVStatus.NOT_ACCEPTABLE)
      .send({
          status: false,
          message: DVStatus.getMessage(DVStatus.REQUEST_BODY_NOT_ACCEPTABLE,
          'FCM Registration'),
          description: '',
          data: [],
          response_tag: DVStatus.REQUEST_BODY_NOT_ACCEPTABLE
      });
  } else {

    let guestId     = params.guest_id;
    let deviceId    = params.device_id;
    let deviceToken = params.device_token;
    let deviceType  = params.device_type;

    console.log('Fn registerGuestDevice CALLED');
    console.log(' === PARAMS === ');
    console.log(' 1. Guest Id = ' + guestId);
    console.log(' 2. Device Id = ' + deviceId);
    console.log(' 3. Device Token = ' + deviceToken);
    console.log(' 4. Device Type = ' + deviceType);

    let what = ['device_token'];
    let conditions = {
      where: {
        pmsi_guest_id: guestId,
        device_id: deviceId
      }
    };

    console.log(' ==== CONDITION FOR SELECT STATEMENTS START ==== ');
    console.log(what);
    console.log(conditions);
    console.log(' ==== CONDITION FOR SELECT STATEMENTS END ==== ');

    pmsiGuestsDB
    .select('guest_app_device_tokens', what, conditions, 
    (err, resData) => {
      if(resData && resData.length > 0) {
        let what = {
          device_token: deviceToken
        };
        let conditions = {
          where: {
            pmsi_guest_id: guestId,
            device_id: deviceId
          }
        };
        console.log(' ==== CONDITION FOR UPDATE STATEMENTS START ==== ');
        console.log(what);
        console.log(conditions);
        console.log(' ==== CONDITION FOR UPDATE STATEMENTS END ==== ');

        pmsiGuestsDB.update('guest_app_device_tokens', 
        conditions, 
        what, (err, updateRes) => {
          if(err){
            console.log(err);
          }
          if(updateRes) {
            console.log(updateRes);
            res
            .status(DVStatus.CREATED)
            .send({
                status: true,
                message: DVStatus.getMessage(DVStatus.RECORD_CREATION_SUCCESS,
                'FCM Registration'),
                description: '',
                data: {},
                response_tag: DVStatus.RECORD_CREATION_SUCCESS
            });
          }
        });
      } else {

        let insertParam = {
          pmsi_guest_id: guestId,
          device_token: deviceToken,
          device_id: deviceId,
          device_type: deviceType
        };

        console.log(' ==== CONDITION FOR INSERT STATEMENTS START ==== ');
        console.log(insertParam);
        console.log(' ==== CONDITION FOR INSERT STATEMENTS END ==== ');

        pmsiGuestsDB.insert('guest_app_device_tokens', 
        insertParam, (err, insertRes) => {
          if(err) {
            console.log(err);
          }
          if(insertRes) {
            res
            .status(DVStatus.CREATED)
            .send({
                status: true,
                message: DVStatus.getMessage(DVStatus.RECORD_CREATION_SUCCESS,
                'FCM Registration'),
                description: '',
                data: {},
                response_tag: DVStatus.RECORD_CREATION_SUCCESS
            });
          }
        });
      }
    });
  }
};

/* Exporting module */
module.exports = router;
