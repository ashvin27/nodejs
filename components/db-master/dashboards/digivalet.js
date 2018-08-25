let dbObj = require('../connection'),
  logger = require(__base + 'components/logger').log(),
  logFormat = require(__base + 'components/logger').format;

module.exports = {
  get: (callback) => {
    let roomDetail = "CONCAT('[',\
    GROUP_CONCAT(CONCAT('{\
    \"in_room_device_id\":\"', IFNULL(in_room_device_id, 'NA'), '\",\
    \"device_type_id\":\"', IFNULL(device_type_id, 'NA'), '\",\
    \"device_type\":\"', IFNULL(device_type, 'NA'), '\",\
    \"room_type_id\":\"', IFNULL(room_type_id, 'NA'), '\",\
    \"room_type\":\"', IFNULL(room_type, 'NA'), '\",\
    \"is_reachable\":\"',IFNULL(is_reachable, 'NA'),'\",\
    \"up_time\":\"',IFNULL(up_time, 'NA'),'\",\
    \"down_time\":\"',IFNULL(down_time, 'NA'),'\",\
    \"battery_percentage\":\"',IFNULL(battery_percentage, ''),'\",\
    \"battery_state\":\"',IFNULL(battery_state, ''),'\",\
    \"last_seen\":\"',IFNULL(last_seen, 'NA'),'\",\\n\
    \"last_updated\":\"',IFNULL(last_updated, 'NA'),'\",\
    \"app_version\":\"',IFNULL(app_version, 'NA'),'\",\
    \"one_app_mode\":\"',IFNULL(one_app_mode, 'NA'),'\",\
    \"tv_status\":\"', IFNULL(tv_status, 'NA'), '\",\
    \"tv_up_time\":\"', IFNULL(tv_up_time, 'NA'), '\",\
    \"tv_down_time\":\"', IFNULL(tv_down_time, 'NA'), '\"\
    }')), ']') as room_detail";

    dbObj.select(
        "number",
        "key_id",
        "mute",
        "is_automation",
        "floor_id",
        "floor_name",
        "dnd",
        "mmr",
        "keytag",
        "rented",
        "key_category_id",
        "key_category_name",
        "automation",
        "guest_first_name",
        "guest_last_name",
        "guest_name",
        "checkin_time",
        "checkout_time",
        dbObj.raw("GROUP_CONCAT(room_type_id) as room_type_id"),
        dbObj.raw("GROUP_CONCAT(room_type) as room_type"),
        dbObj.raw(roomDetail)
      )
      .from('v_digivalet_dashboard')
      .groupByRaw('key_id')
      .orderByRaw('LENGTH( `floor_name` ), `floor_name`')
      .orderByRaw('LENGTH( `number` ), `number`')
      //.orderByRaw('cast(number as unsigned) asc')
      .then((res) => {
        callback(null, res);
      })
      .catch((err) => {
        logger.log(logFormat('error', err));
        callback(err, null);
      })
  },

  muteUnmute: (what, where, callback) => {
    dbObj('keys')
      .where(where)
      .update(what)
      .then((ack) => {
        callback(null, ack);
      })
      .catch((err) => {
        logger.log(logFormat('error', err));
        callback(err, null);
      });
  }
};
