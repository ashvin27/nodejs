let config = require(__base + '/config');

module.exports = (params) => {
  return {
    pushUpdateJson: (rows, c) => {
      let result = [];
      let keyIDs = {};
      let tempData = {};
      let tempKeyData = {};
      rows.map((puRecord) => {
        let tempKeyUpdateData = {
          type: puRecord.feature_code,
          version: puRecord.feature_version,
          isFullUpdate: puRecord.update_type,
          statusId: puRecord.push_update_record_id
        };

        if (puRecord.extra_data != null) {
          let extra_data = JSON.parse(puRecord.extra_data);
          if (Object.keys(extra_data).length > 0) {
            if (puRecord.feature_code == 'RESET_IP')
              tempKeyUpdateData.value = extra_data[puRecord.feature_code].ipad_update_path;
            else if (puRecord.feature_code == 'SINGLE_APP')
              tempKeyUpdateData.value = extra_data[puRecord.feature_code].enabled;
            else if (puRecord.feature_code == 'CUSTOM_QUERY')
              tempKeyUpdateData.value = {
                database_name: extra_data[puRecord.feature_code].db_name,
                query: extra_data[puRecord.feature_code].query
              };
          }
        }
        
        let ipArray = [];
        if (puRecord.ip != null)
          ipArray = puRecord.ip.split(',');

        if (ipArray.length > 0) {
          if ((keyIDs[puRecord.key_id] == undefined) || (!keyIDs[puRecord.key_id].includes(puRecord.in_room_device_id))) {
            tempKeyData = {
              device_category: puRecord.device_category,
              device_id: puRecord.in_room_device_id.toString(),
              room_type: puRecord.room_type_name,
              ip_addresses: ipArray,
              port: puRecord.update_port,
              update: [tempKeyUpdateData]
            };
          }

          if (keyIDs[puRecord.key_id] == undefined) {
            keyIDs[puRecord.key_id] = [];
            keyIDs[puRecord.key_id].push(puRecord.in_room_device_id);

            tempData = {
              keyId:puRecord.key_id,
              key_number: puRecord.room_number,
              comm_key: puRecord.communication_token,
              data: [tempKeyData]
            };
            result.push(tempData);
          } else {
            if (keyIDs[puRecord.key_id].includes(puRecord.in_room_device_id))
              tempKeyData.update.push(tempKeyUpdateData);
            else {
              keyIDs[puRecord.key_id].push(puRecord.in_room_device_id);
              tempData.data.push(tempKeyData);
            }
          }
        }
      });
      c(null, result);
    }
  }
};
