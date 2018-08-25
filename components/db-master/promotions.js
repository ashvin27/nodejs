let dbObj = require('./connection'),
config = require(__base + '/config'),
moment = require('moment');
module.exports = {
  getList: (callback) => {
    dbObj
    .select(
    'T1.promo_id as promotion_id',
    'T1.is_featured',
    'T4.lang_code',
    'T5.category_name',
    'T5.category_code',
    'T2.string as title',
    'T3.string as description',
    'T4.string as remarks',
    'T1.promo_path',
    'T7.file_path',
    'T6.template_path',
    'T1.modified_on',
    'T1.created_on',
    'T1.start_date',
    'T1.hotel_id',
    'T1.end_date'
    )
    .from('promotions_master as T1')
    .leftJoin('promotions_locale as T2', 'T1.title', 'T2.string_key')
    .leftJoin('promotions_locale as T3', 'T1.description', 'T3.string_key')
    .leftJoin('promotions_locale as T4', 'T1.remarks', 'T4.string_key')
    .leftJoin('promotions_category as T5', 'T1.cat_id', 'T5.cat_id')
    .leftJoin('promotions_template as T6', 'T1.template_id', 'T6.template_id')
    .leftJoin('promotions_assets as T7', 'T1.asset_key', 'T7.asset_key')
    .where('T1.is_sent', 1)
    .where('T1.is_deleted', 0)
    .where('T1.is_active', 1)
    .where('T1.end_date', '>', moment().format('YYYY-MM-DD HH:mm:ss'))
    .where('T1.start_date', '<=', moment().format('YYYY-MM-DD HH:mm:ss'))
    .where('T4.lang_code', 'en')
    .where('T7.type', 'image')
    .then((data) => {
      callback(null, data);
    })
    .catch((err) => {
      console.log(err);
      callback(err, null);
    })
  },
  getDevices: (callback) => {
    dbObj.select(['t1.push_update_record_id',
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
    't1.feature_version'
    ])
    .from('push_update_records as t1')
    .innerJoin('v_push_update_devices as t2', 't1.in_room_device_id', 't2.in_room_device_id')
    .innerJoin('room_types as t3', 't3.room_type_id', 't3.room_type_id')
    .innerJoin('push_update_features as t4', 't1.feature_id', 't4.feature_id')
    .where({
      't1.hotel_id': config.hotelProperties.hotelid,
      't2.is_reachable': 1,
      't1.status': 0,
      't4.feature_code': 'PROMOTIONS'
    })
    .orderBy('t2.key_id', 'asc')
    .orderBy('t2.device_category', 'asc')
    .then((rows) => {
      callback(null, rows);
    }).
    catch((err) => {
      console.log(err);
      callback(err, null);
    });
  },

  getDevicesWithInroomDeviceId: (data, callback) => {
    console.log('given in room device id is ===', data)
  dbObj.select(['t1.push_update_record_id',
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
    't1.feature_version'
    ])
    .from('push_update_records as t1')
    .innerJoin('v_push_update_devices as t2', 't1.in_room_device_id', 't2.in_room_device_id')
    .innerJoin('room_types as t3', 't3.room_type_id', 't3.room_type_id')
    .innerJoin('push_update_features as t4', 't1.feature_id', 't4.feature_id')
    .where({
      't1.hotel_id': config.hotelProperties.hotelid,
      't1.in_room_device_id':data.in_room_device_id,
      't2.is_reachable': 1,
      't1.status': 0,
      't4.feature_code': 'PROMOTIONS'
    })
    .orderBy('t2.key_id', 'asc')
    .orderBy('t2.device_category', 'asc')
    .then((rows) => {
      callback(null, rows);
    }).
    catch((err) => {
      console.log(err);
      callback(err, null);
    }); 
  },
  promotionReceived: (params, callback) => {
    dbObj
    .select('feature_id')
    .from('push_update_features')
    .where({
      feature_code: 'PROMOTIONS'
    })
    .then((rows) => {

      if(rows) {
        console.log(rows);
        let row = rows[0];
        console.log({
          in_room_device_id: params.in_room_device_id,
          feature_id: row.feature_id
        });
        dbObj('push_update_records')
        .where({
          in_room_device_id: params.in_room_device_id,
          feature_id: row.feature_id
        })
        .update({
          status: 1
        })
        .then((res) => {
          if(res) {
            callback(null, res);
          } else {
            callback('Error in updating status for the promotion.', false);
          }
        })
        .catch((err) => {
          console.log(err);
          callback(err, false);
        });
      } else {
        callback('No records found in push update features table.', false);
      }
    })
    .catch((err) => {
      console.log(err);
      callback(err, false);
    })
  }
};
