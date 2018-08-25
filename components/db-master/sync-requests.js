let dbObj = require('./connection');

module.exports = {
  insert: (params, c) => {

    /** We are using Insert Query using loop
    * but not using through Batch Insert System
    * because knex mysql batch Insert not returns all the
    * insert_ids
    */

    if(params.constructor === Array && params.length > 0) {
      params.forEach((i) => {
        let meta_info = i.meta_info;
        console.log('sync requests in-premise start');
        console.log(i);
        console.log('sync requests in-premise end');
        dbObj('sync_requests')
        .insert({
          state: i.state_to_update,
          request_type: meta_info.request_type,
          push_update_schedule_id: meta_info.push_update_schedule_id,
          error_occurred: '',
          module_name: meta_info.module_name,
          direction: meta_info.direction,
          module_tables: meta_info.module_tables,
          sync_from: meta_info.sync_from,
          sync_to: meta_info.sync_to,
          hotel_id: meta_info.hotel_id,
          sync_tables: meta_info.sync_tables,
          generate_sqlite: meta_info.generate_sqlite,
          generate_push: meta_info.generate_push,
          devices: meta_info.devices,
          created_by: meta_info.created_by,
          relative_sync_requests_id: i.cloud_sync_requests_id
        })
        .then((res) => {
          if(res.constructor === Array && res.length > 0) {
            let insertRes = {
              insert_id: res[0],
              state_to_update: 2,
              cloud_sync_requests_id: i.cloud_sync_requests_id
            };

            c(insertRes);
          } else {
            c(false);
          }
        });
      });
    }
  },

  getRequestsByState: (state, callback) => {
    dbObj.select()
    .from('sync_requests')
    .where({
      'state': state
    })
    .then((rows) => {
      callback(null, rows);
    })
    .catch((error) => {
      callback(error, null);
    });
  },

  updateSyncRequests: (what, where, callback) => {
    dbObj('sync_requests')
    .where(where)
    .update(what)
    .then((response) => {
      callback(response);
    })
    .catch((error) => {
      console.log(error);
    });
  }

};
