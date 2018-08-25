let
scheduler = require('./scheduler')({}),
isJSON = require('is-valid-json'),
masterConfigs = require(__base +
        'components/db-master/master-configs'),
deviceTypes = require(__base +
                'components/db-master/device-types'),
pushUpdateSchedule = require(__base +
  'components/db-master/push-update-schedules')({}),
pushUpdateFeatures = require(__base +
        'components/db-master/push-update-features'),
inRoomDevices = require(__base +
  'components/db-master/in-room-devices');

// publish or push
module.exports = (params) => {
  return {
    publish: (scheduleData, callback) => {
      getAllowedDeviceIds((dvErr, dvRes) => {
        if(dvRes) {
          let featureIds = scheduleData.feature_ids.split(',');
          featureIds.map((featureId) => {
            getInRoomDevices(featureId, dvRes, scheduleData, (irErr, devices) => {
              let what = {
                is_processed: 1,
                device_list: JSON.stringify(devices),
                modified_by: scheduleData.created_by
              };
              let where = {
                schedule_id: scheduleData.schedule_id
              };
              
              if (devices.length > 0) {
                  scheduler.schedule(scheduleData, featureId, devices, (sErr, sRes) => {
                    if(sRes) {
                      pushUpdateSchedule.update(what, where, (puSErr, puSRes) => {
                        if(puSRes)
                          callback(null, true);
                        else
                          callback(puSErr, null);
                      });
                    } else
                      callback(sErr, null);
                });
              } else {
                pushUpdateSchedule.update(what, where, (puSErr, puSRes) => {
                  if(puSRes)
                    callback(null, true);
                  else
                    callback(puSErr, null);
                });
              }
            });
          });
        }
      });
    },
    createRecords: (scheduleData, callback) => {
      let devices = JSON.parse(scheduleData.device_list);
      let irdIDs = [];
      devices.map((ird) => {irdIDs.push(ird.in_room_device_id)});
      
      if (scheduleData.schedule_for == 0) {
        let checked_in = 1;
        if (scheduleData.checkin_filter == 3)
          checked_in = 0;

        let inrdWhat = ['in_room_device_id'];
        let inrdConditions = {
          where: {
            hotel_id: scheduleData.hotel_id,
            is_checked_in: checked_in
          },
          where_in: {
            key: 'in_room_device_id',
            value: irdIDs
          }
        };
        
        if (scheduleData.checkin_filter == 1)
          delete inrdConditions.where.is_checked_in;

        inRoomDevices.select(inrdWhat, inrdConditions, (inrdErr, inrdRes) => {
          if(inrdRes) {
            insertPushRecords(scheduleData, inrdRes, irdIDs, (ipudErr, ipudRes) => {
              if(ipudRes)
                callback(null, true);
              else
                callback(ipudErr, null);
            });
          }
        });
      } else {
        insertPushRecords(scheduleData, devices, irdIDs, (ipudErr, ipudRes) => {
          if(ipudRes)
            callback(null, true);
          else
            callback(ipudErr, null);
        });
      }
    }
  }
};

let getAllowedDeviceIds = (callback) => {
  getAllowedDeviceTypes((deviceTypeErr, deviceTypeObj) => {
    if(deviceTypeObj) {
      let where = {
        is_active: 1,
        is_deleted: 0
      };

      deviceTypes.select(['device_type_id', 'device_type', 'device_category'], where, (dtErr, dtRes) => {
        if(dtRes.length > 0) {
          let deviceIds = {};

          let module = '';
          for(type in deviceTypeObj) {
            if(module == '' || module != type) {
              module = type;
              deviceIds[module] = [];
            }

            if(deviceTypeObj.hasOwnProperty(type)){
              for(innerType in (deviceTypeObj[type])) {
                dtRes.forEach((deviceTypeInfo) => {
                    if(innerType.toLowerCase() ==
                      (deviceTypeInfo.device_category).toLowerCase() &&
                      (
                        (deviceTypeObj[type])[innerType]
                      ).indexOf(
                        (deviceTypeInfo.device_type).toLowerCase()
                      ) >= 0
                    ) {
                      deviceIds[module].push(deviceTypeInfo.device_type_id);
                    }
                });
              }
            }
          }

          callback(null, deviceIds);
        } else {
          callback(dtErr, false);
        }
      });
    } else {
      console.log(deviceTypeErr);
      callback(deviceTypeErr, false);
    }
  });
};

let getAllowedDeviceTypes = (callback) => {
  masterConfigs.getConfigValue(
    'push-update',
    'push_update_device_types', (cvErr, cvRes) => {
      if(cvRes) {
        if(cvRes.config_val) {
          if(isJSON(cvRes.config_val)) {
            callback(null, JSON.parse(cvRes.config_val));
          } else {
            callback('Master config value for \
            `push_update_device_types` \
            is not a valid JSON value in database.', null);
          }
        } else {
          callback('Master config value \
          `push_update_device_types` \
          is empty in database.', null);
        }
      } else {
        callback(cvErr, null);
      }
    });
};

let getInRoomDevices = (featureId, deviceTypesIds, scheduleData, callback) => {
  let what = ['sqlite_name'];
  let where = {
    feature_id: parseInt(featureId),
    is_active: 1,
    is_deleted: 0
  };
  
  pushUpdateFeatures.get(what, where, (fErr, fRes) => {
    if(fRes) {
      let inrdConditions = {
        where: {
          hotel_id: scheduleData.hotel_id
        },
        where_in: {
          key: 'device_type_id',
          value: deviceTypesIds[fRes[0].sqlite_name]
        },
        where_raw: ''
      };

    //  scheduleData.checkin_filter -- pending
      let currentAndKey = null;
      console.log('scheduleData.applied_filters*****************************************', scheduleData.applied_filters);
      let applied_filters = JSON.parse(scheduleData.applied_filters);
      console.log('applied_filters*****************************************', applied_filters);
      inrdConditions.where_raw = '(';
      applied_filters.map((andFilterAry, andKey) => {
        let currentOrKey = null;

        if (andFilterAry.length > 1)
          inrdConditions.where_raw += '(';

        if (currentAndKey != null && currentAndKey != andKey)
          inrdConditions.where_raw += ' AND (';

        andFilterAry.forEach((orFilterInfo, orKey) => {
          let by, condition, options = '';
          options = orFilterInfo.options;
          
          //----------------------by---------------------------
          if (orFilterInfo.by == 'wing') {
            by = 'wing_id';
            if (orFilterInfo.condition == 'contains' && options == 'all')
              condition = ' IS NOT NULL ';
          } else if (orFilterInfo.by == 'floor') {
            by = 'floor_id';
            if (orFilterInfo.condition == 'contains' && options == 'all')
              condition = ' IS NOT NULL ';
          } else if (orFilterInfo.by == 'roomType') {
            by = 'room_type_id';
            if (orFilterInfo.condition == 'contains' && options == 'all')
              condition = ' IS NOT NULL ';
          } else if (orFilterInfo.by == 'keyCategory') {
            by = 'key_category_id';
            if (orFilterInfo.condition == 'contains' && options == 'all')
              condition = ' IS NOT NULL ';
          } else if (orFilterInfo.by == 'key') {
            by = 'key_id';
            if (orFilterInfo.condition == 'contains' && options == 'all')
              condition = ' IS NOT NULL ';
          } else if (orFilterInfo.by == 'occupancy') {
            by = 'is_checked_in';
            if (options == 'any') {
              options = '1,0';
              condition = ' IN (#c) ';
            } else if (options == 'checked_in')
              options = 1;
            else if (options == 'checked_out')
              options = 0;
          } else if (orFilterInfo.by == 'appVersion') {
            by = 'app_version';
            if (orFilterInfo.condition == 'contains' && options == 'all')
              condition = ' IS NOT NULL ';
          }

          //----------------------conditions---------------------------
          if (condition == undefined) {
            if (orFilterInfo.condition == 'contains')
              condition = ' IN (#c) ';
            else if (orFilterInfo.condition == 'does_not_contain')
              condition = ' NOT IN (#c) ';
            else if (orFilterInfo.condition == 'equal_to')
              condition = ' = #c ';
            else if (orFilterInfo.condition == 'not_equal_to')
              condition = ' != #c ';
            else if (orFilterInfo.condition == 'like')
              condition = " LIKE '%#c%' ";
            else if (orFilterInfo.condition == 'not_like')
              condition = " NOT LIKE '%#c%' ";
          }

          //----------------------final or query---------------------------
          if (currentOrKey != null && currentOrKey != orKey)
            inrdConditions.where_raw += ' OR ';

          inrdConditions.where_raw += '(' + by + condition.replace('#c', options) + ')';
          currentOrKey = orKey;
        });

        if (andFilterAry.length > 1)
          inrdConditions.where_raw += ')';

        if (currentAndKey != null && currentAndKey != andKey)
          inrdConditions.where_raw += ')';

        currentAndKey = andKey;
      });

      inrdConditions.where_raw += ')';
      let inrdWhat = ['in_room_device_id'];
      console.log('inrdConditions*****************************************', inrdConditions);
      inRoomDevices.select(inrdWhat, inrdConditions, (inrdErr, inrdRes) => {
        if(inrdRes) {
          callback(null, inrdRes);
        }
      });
    }
    else
      callback(fErr, null);
  });
};

let insertPushRecords = (scheduleData, devices, irdIDs, callback) => {
  let featureIds = scheduleData.feature_ids.split(',');
  let what = {
    is_processed: 3,
    device_list: JSON.stringify(devices),
    modified_by: scheduleData.created_by
  };
  let pufWhat = ['sqlite_name'];
  let where = {
    schedule_id: scheduleData.schedule_id
  };
  
  getAllowedDeviceIds((dvErr, dvRes) => {
    if(dvRes) {
      featureIds.map((featureId) => {
        let pufWhere = {
          feature_id: parseInt(featureId),
          is_active: 1,
          is_deleted: 0
        };

        pushUpdateFeatures.get(pufWhat, pufWhere, (fErr, fRes) => {
          if(fRes) {
            if (dvRes[fRes[0].sqlite_name] != undefined) {
              let inrdWhat = ['in_room_device_id'];
              let inrdConditions = {
                where: {
                  hotel_id: scheduleData.hotel_id
                },
                where_in: {
                  key: 'in_room_device_id',
                  value: irdIDs
                },
                where_in2: {
                  key: 'device_type_id',
                  value: dvRes[fRes[0].sqlite_name]
                }
              };

              inRoomDevices.select(inrdWhat, inrdConditions, (inrdErr, fDevices) => {
                if(fDevices) {
                  if (fDevices.length > 0) {
                    scheduler.schedule(scheduleData, featureId, fDevices, (sErr, sRes) => {
                      if(sRes) {
                        pushUpdateSchedule.update(what, where, (puSErr, puSRes) => {
                          if(puSRes)
                            callback(null, true);
                          else
                            callback(puSErr, null);
                        });
                      } else
                        callback(sErr, null);
                    });
                  } else {
                    pushUpdateSchedule.update(what, where, (puSErr, puSRes) => {
                      if(puSRes)
                        callback(null, true);
                      else
                        callback(puSErr, null);
                    });
                  }
                }
              });
            } else
              callback(fErr, null);
          } else
            callback(fErr, null);
        });
      });
    }
  });
};
