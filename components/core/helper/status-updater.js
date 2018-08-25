let config    = require(__base + '/config'),
rp            = require('request-promise'),
syncRequests  = require(__base + '/components/db-master/sync-requests'),
masterConfig   = require(__base +
  '/components/db-master/master-configs');

module.exports = (params) => {
  return {
    updateStatus: (data, callback) => {
      updateOnLocal(data, (err, responseOne) => {
        if(responseOne) {
          updateOnRemote(data, (err, responseTwo) => {
            if(responseTwo) {
              console.log('execution - 2 true');
              callback(null, true);
            } else {
              console.log('execution - 2 false');
              callback(false, null);
            }
          });
        } else {
          console.log('execution - 1 false');
          callback(null, false);
        }
      });
    }
  }
};

let updateOnLocal = (data, callback) => {
  syncRequests.updateSyncRequests({
    state: data.state
  }, {
    sync_requests_id: data.syncRequestsId
  }, (updated) => {
    callback(null, updated);
  });
};

let updateOnRemote = (data, callback) => {
    console.log('==== updateOnRemote called ------ ');
    masterConfig.getConfigValue(
      'core',
      'cloud_his_url',
      (err, row) => {
        if(row) {
          let address = row.config_val;
          let remoteAccessUrl =
            config.cloud.server.protocol +
            '://' +
            address +
            ':' +
            config.cloud.server.port +
            config.cloud.notificationManager.url.callToCloud;
            console.log('==== updateOnRemote called ------ ' + address);
            console.log('==== updateOnRemote called ------ ' + remoteAccessUrl);
            let options = {
              method: 'PUT',
              uri: remoteAccessUrl,
              headers: {
                'content-type': config.cloud.headers.contentType,
                'access-token': process.env.access_token
              },
              body: JSON.stringify({
                state: data.state,
                sync_requests_id: data.remoteSyncRequestId
              }),
              rejectUnauthorized: config.server.rejectUnauthorized
            };

            rp(options)
              .then((response) => {
                console.log('Got response');
                callback(null, true);
              })
              .catch((err) => {
                console.log(err);
                console.log('Got error');
                callback(null, false);
              });
        }
    });
};
