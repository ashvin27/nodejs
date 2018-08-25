/*
* Author: Paras Sahu
* Module: Update Manager APIs
* Email: paras.sahu@digivalet.com
*
/

/*
*  Tables
*
*   Push Update Features
*   Push Update Records
*   Push Update Schedules
*/

/*
*  Major Operations:
*
*   Insert (create or add) - C
*   Select (read or get) - R
*   Update (update) - U
*   Delete (delete) - D
*
*/

let scripts = {};
let dbObj = {};
let hotelid = ''
module.exports = function (params) {
  dbObj     = params.db;
  hotelid   = params.hid;

  let api = {
    'features': {
      'create': '',
      'get': '',
      'update': '',
      'delete': ''
    },
    'records': {
      'create': '',
      'get': '',
      'update': '',
      'delete': ''
    },
    'status': {
      'create': '',
      'get': {
        toPush: statusGetToPush
      },
      'update': '',
      'delete': ''
    },
    'audit': {
      'create': '',
      'get': '',
      'update': '',
      'delete': ''
    }
  };
  return api;
};

let statusGetToPush = (res, c) => { // select or read records from the database
  dbObj.select([
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
    't1.hotel_id': hotelid,
    't2.is_reachable': 1,
    't1.status': 0
  })
  .orderBy('t2.key_id', 'asc')
  .orderBy('t2.device_category', 'asc')
  .then(function(rows){
    scripts.generatePushUpdateJSON(rows, (e, d) => {
      if(!e) {
          c(null, d);
      }
    });
  });
}

scripts.generatePushUpdateJSON = (rows, c) => {
  let keys = [], devices = [], result = [], tempArray = [], deviceid = [];
  let temp = {}, deviceIndex = 0;
  //console.log(rows);
  for (var i = 0; i < rows.length; i++) {

    if(keys.indexOf(rows[i].key_id) == -1) {
      if((Object.keys(temp)).length !== 0) {
        result.push(temp);
      }

      temp = {};

      devices = [];
      deviceid = [];
      keys.push(rows[i].key_id);

      temp['key_number'] = rows[i].room_number;
      temp['comm_key'] = rows[i].communication_token;
      temp['data'] = [];
    }

    if(devices.indexOf(rows[i].device_category) == -1) {
      devices.push(rows[i].device_category);
      tempArray = [];
    }

    tempArray.push({
      'type': rows[i].feature_code,
      'version': rows[i].feature_version,
      'isFullUpdate': rows[i].update_type
    });

    if(deviceid.indexOf(rows[i].in_room_device_id)== -1) {
      (temp.data).push({ //[rows[i].device_category]
        'device_category': rows[i].device_category,
        'device_id': rows[i].in_room_device_id,
        'room_type': rows[i].room_type_name,
        'ip': rows[i].ip,
        'port': rows[i].update_port,
        'update': tempArray
      });
      deviceid.push(rows[i].in_room_device_id);
    }

    if(i == rows.length -1) { // For the last record
      result.push(temp);
    }

  }
  c(null, JSON.stringify(result));
}
