let dbObj = require('./connection'),
config    = require(__base + '/config'),
moment = require('moment');

module.exports = {
  get: (callback) => {
    dbObj.select([
    't1.push_update_record_id',
    't1.update_type',
    't2.key_id',
    't2.room_number',
    't2.in_room_device_id',
    't2.ip',
    't2.device_category',
    't2.update_port',
    't2.communication_token',    
    't3.name as room_type_name',
    't4.feature_code',
    't1.feature_version',
    't5.extra_data'
    ])
    .from('push_update_records as t1')
    .innerJoin(
      'v_push_update_devices as t2',
      't1.in_room_device_id',
      't2.in_room_device_id')
    .innerJoin(
      'room_types as t3',
      't3.room_type_id',
      't2.room_type_id')
    .innerJoin(
      'push_update_features as t4',
      't1.feature_id',
      't4.feature_id')
    .innerJoin(
      'push_update_schedules as t5',
      't1.schedule_id',
      't5.schedule_id')
    .where({
      't1.hotel_id': config.hotelProperties.hotelid,
      't2.is_reachable': 1,
      't1.status': 0
    })
    .where('t1.when_to_send', '<=', moment().format('YYYY-MM-DD HH:mm:ss'))
    .orderBy('t2.key_id', 'asc')
    .orderBy('t2.in_room_device_id', 'asc')
    .groupByRaw('t2.in_room_device_id, t4.feature_code')
    .then((rows) => {


      //console.log('rows',rows);
      callback(null, rows);
    }).
    catch((err) => {
      console.log(err);
      callback(err, null);
    });
  },
  insert: (data, callback) => {
    dbObj('push_update_records')
    .insert(data)
    .then((res) => {
      //console.log(res);
      if(res) {
        callback(null, true);
      } else {
        callback('Error occured in batch insertion of push update records.',
        false);
      }
    })
    .catch((err) => {
      console.log(err);
    });
  },
  select: (what, conditions, callback) => {
    let query = dbObj.select(what)
    .from('push_update_records');

    if(conditions && conditions.where) {
      query.where(conditions.where);
    }
    if(conditions && conditions.whereE) {
      (conditions.whereE).forEach((item) => {
        query.where(item.f, item.m, item.l);
      });
    }

    query.then((data) => {
      callback(null, data);
    })
    .catch((err) => {
      console.log(err);
      callback(err, false);
    })
  },
  update: (what, where, devices, callback) => {
    dbObj('push_update_records')
    .where(where)
    .whereIn('in_room_device_id', devices)
    .update(what)
    .then((ack) => {
      callback(null, true);
    })
    .catch((err) => {
      callback(err, null);
    });
  }
};
