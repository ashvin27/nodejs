let dbObj = require('./connection'),
config    = require(__base + '/config');

module.exports = {
  patch: (data, callback) => {
    dbObj('push_update_records')
    .where({
      'push_update_record_id': data.where
    })
    .update(data.what)
    .then((d) => {
      if(d) {
        callback(null, d);
      } else {
        callback(1, null);
      }
    })
    .catch((e) => {
      callback(e, null);
    });
  },
  bulkPatch: (data, callback) => {
    let updateArray = [];
    let itemProcessed = 1;
    updateStatus(data, data.length, (usErr, usRes) => {
      if(usRes) {
        callback(null, true);
      } else {
        callback(usErr, false);
      }
    });
  }
};

let updateStatus = (data, dCount, callback) => {
  console.log('************************************status update data', data);
  if(dCount > 0) {
    dbObj.select('feature_id')
    .from('push_update_features')
    .where({
      feature_code: (data[dCount-1].feature_code).toUpperCase()
    })
    .then((featureRes) => {
      if(featureRes && featureRes.length > 0) {
        dbObj('push_update_records')
        .where({
          feature_id: featureRes[0].feature_id,
          in_room_device_id: data[dCount-1].in_room_device_id
        })
        .orderBy('push_update_record_id', 'desc').select('*').limit(1).offset(0)
        .then((purRes) => {
          let status = 0;
          if (data[dCount-1].type.toLowerCase() == 'auto')
            status = 1;
          else if (data[dCount-1].type.toLowerCase() == 'manual')
            status = 2;
                 
          if (purRes.length > 0) {
            let statusLogData = purRes[0];
            
            if (statusLogData.status == 0) {
              dbObj('push_update_records')
              .where({
                in_room_device_id: data[dCount-1].in_room_device_id,
                feature_id: featureRes[0].feature_id,
                push_update_record_id: statusLogData.push_update_record_id
              })
              .update({
                status: status
              })
              .then((purNewRes) => {
                updateStatus(data, dCount-1, callback);
              })
              .catch((err) => {
                console.log(err);
                callback(e, null);
              });
            } else {
              if (status == 2) {
                delete statusLogData.push_update_record_id;
                delete statusLogData.created_on;
                delete statusLogData.modified_by;
                delete statusLogData.modified_on;
                statusLogData.status = 2;
                dbObj('push_update_records').
                insert(statusLogData).then((pusRes) => {
                  if(pusRes)
                    updateStatus(data, dCount-1, callback);
                  else
                    callback('Error occured in insertion of manual update.', null);
                })
                .catch((err) => {
                  console.log(err);
                });
              } else
                updateStatus(data, dCount-1, callback);
            }
          }
        })
        .catch((err) => {
          console.log(err);
          callback(e, null);
        });               
      } else {
        callback('No feature id is associated with the feature code = ' +
        data[dCount-1].feature_code, null);
      }
    })
    .catch((err) => {
      callback(err, null);
    });

  } else {
    callback(null, true);
  }
};
