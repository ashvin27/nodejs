let dbObj = require('../connection'),
  logger = require(__base + 'components/logger').log(),
  logFormat = require(__base + 'components/logger').format;

let pushUpdate = {
  getRecords: (callback) => {
    dbObj.select(
        "t1.push_update_record_id", "t1.feature_id", "t1.schedule_id", "t1.in_room_device_id", "t1.update_type", "t1.status", "t1.hotel_id", "t1.created_by", "t1.created_on", "t2.device_category", "t2.device_type", "t2.display_name", "t2.ip", "t2.is_checked_in", "t2.room_number", "t2.is_reachable"
      )
      .from('push_update_records as t1')
      .join('v_push_update_devices as t2', 't1.in_room_device_id', '=', 't2.in_room_device_id')
      .whereRaw('t1.status NOT IN (3) and t1.is_active = 1 and t1.is_deleted = 0')
      .orderByRaw('t1.push_update_record_id desc')
      .then((res) => {
        callback(null, res);
      })
      .catch((err) => {
        logger.log(logFormat('error', err));
        callback(err, null);
      })
  }, 
  getFeatures: (callback) => {
    dbObj.select(
        "feature_id","feature_name","feature_code","sqlite_name","version",
        "hotel_id","is_active","delete_msg","is_deleted","created_by",
        "created_on","modified_by","modified_on"
      )
      .from('push_update_features')
      .where({
        is_active:  1,
        is_deleted:  0
      })
//      .where('when_to_send', '<=', moment().format('YYYY-MM-DD HH:mm:ss'))
      .orderByRaw('feature_name asc')
      .then((res) => {
        callback(null, res);
      })
      .catch((err) => {
        logger.log(logFormat('error', err));
        callback(err, null);
      })
  }
};

module.exports = pushUpdate;
