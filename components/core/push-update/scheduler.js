let pushUpdateRecords = require(__base +
    'components/db-master/push-update-records'),
pushUpdateFeatures = require(__base +
        'components/db-master/push-update-features'),
moment = require('moment');

module.exports = (params) => {
  return {
    schedule: (scheduleInfo, featureId, devices, callback) => {
      getFeatureInfo(featureId, (fErr, featureInfo) => {
        if(featureInfo) {
          storePushUpdateRecords(scheduleInfo, featureInfo, devices,
            (storeRecErr, storeRecRes) => {
              if(storeRecRes) {
                callback(null, storeRecRes);
              } else {
                callback(storeRecErr, null);
              }
          });
        }
      });
    }
  }
};

let getFeatureInfo = (featureId, callback) => {
  let what = ['feature_id', 'version'];
  let where = {
    feature_id: featureId,
    is_active: 1,
    is_deleted: 0
  };

  pushUpdateFeatures.get(what, where, (fErr, fRes) => {
    if(fRes) {
      let response = fRes[0];
      callback(null, response);
    } else {
      callback(fErr, false);
    }
  });
};

let storePushUpdateRecords = (scheduleInfo, featureInfo, devices, c) => {
  let records = [];
  if(devices.length > 0) {
    let deviceList = [];
    devices.forEach((deviceInfo) => {
      let when_to_send = '';
      if (scheduleInfo.schedule_for == 1)
        when_to_send = moment().format('YYYY-MM-DD HH:mm:ss');
      else
        when_to_send = scheduleInfo.schedule_for_date;

      deviceList.push(deviceInfo.in_room_device_id);      
      records.push({
        feature_id: featureInfo.feature_id,
        feature_version: featureInfo.version,
        schedule_id: scheduleInfo.schedule_id,
        in_room_device_id: deviceInfo.in_room_device_id,
        update_type: scheduleInfo.update_type,
        when_to_send: when_to_send,
        status: 0,
        hotel_id: scheduleInfo.hotel_id,
        is_active: 1,
        is_deleted: 0,
        created_by: scheduleInfo.created_by,
        created_on: moment().format('YYYY-MM-DD HH:mm:ss')
      });
    });
    
    let what = {
      status: 3,
      modified_by: scheduleInfo.created_by
    };
    let where = {
      status: 0,
      feature_id: featureInfo.feature_id
    };
    pushUpdateRecords.update(what, where, deviceList, (puruErr, puruRes) => {
      if (puruRes) {
        pushUpdateRecords.insert(records, (iErr, iRes) => {
          if(iRes)
            c(null, true);
          else
            c(iErr, null);
        });
      }
    });
  }
};
