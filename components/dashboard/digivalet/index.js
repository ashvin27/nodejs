/*******************************************************************************************************************
 *
 * Author: Ashvin Patel
 * Module: Socket.io Services for the Digivalet Dashboard (Ideally will reside In-premise)
 *
 ********************************************************************************************************************/

let digivaletDashboard = require(__base + '/components/db-master/dashboards/digivalet'),
masterConfig = require(__base + '/components/db-master/master-configs'),
floor = require(__base + '/components/db-master/floors'),
roomType = require(__base + '/components/db-master/room-types'),
keyCategories = require(__base + '/components/db-master/key-categories'),
dashboardAlert = require(__base + '/components/db-master/dashboards/dashboard-alerts'),
DVStatus = require(__base + 'components/core/helper/http-status-codes'),
config = require(__base + 'config'),
digivaletConnectionsArray = [],
pollingTimerForContainer;

let digivalet = {
  onConnect: (socket) => {
    if (!digivaletConnectionsArray.length) {
      pollingLoop();
    }

    digivaletConnectionsArray.push(socket);

    socket.on('disconnect', () => {
      let socketIndex = digivaletConnectionsArray.indexOf(socket);
      if (socketIndex >= 0) {
        digivaletConnectionsArray.splice(socketIndex, 1);
      }
    });

    socket.on('muteUnmute', (data) => {
      digivaletDashboard.muteUnmute({mute: data.mute}, {key_id: data.key_id},
      (iErr, iRes) => {
        if (iRes) {
          socket.emit('muteUnmute' + data.key_id, {
            status: true,
            message: DVStatus.getMessage(DVStatus.RECORD_UPDATE_SUCCESS,
            'Mute'),
            description: '',
            data: iRes,
            response_tag: DVStatus.RECORD_UPDATE_SUCCESS
          });
        } else {
          socket.emit('muteUnmute' + data.key_id, {
            status: false,
            message: DVStatus.getMessage(DVStatus.RECORD_UPDATE_FAILURE,
            'Mute'),
            description: '',
            data: iRes,
            response_tag: DVStatus.RECORD_UPDATE_FAILURE
          });
        }
      });
    });

    socket.on('getFloors', (data) => {
      floor.select(["floor_id", "name"],
      {is_active: 1, is_deleted: 0}, (iErr, iRes) => {
        if (iRes) {
          socket.emit('getFloors', {
            status: true,
            message: DVStatus.getMessage(DVStatus.RECORDS_AVAILABLE,
            'Floors'),
            description: '',
            data: iRes,
            response_tag: DVStatus.RECORDS_AVAILABLE
          });
        } else {
          socket.emit('getFloors', {
            status: false,
            message: DVStatus.getMessage(DVStatus.RECORDS_NOT_AVAIALBE,
            'Floors'),
            description: '',
            data: iRes,
            response_tag: DVStatus.RECORDS_NOT_AVAIALBE
          });
        }
      });
    });

    socket.on('getKeyCategories', (data) => {
      keyCategories.select(["key_category_id", "name"], {
        is_active: 1,
        is_deleted: 0
      }, (iErr, iRes) => {
        if (iRes) {
          socket.emit('getKeyCategories', {
            status: true,
            message: DVStatus.getMessage(DVStatus.RECORDS_AVAILABLE,
              'Key Categories'),
            description: '',
            data: iRes,
            response_tag: DVStatus.RECORDS_AVAILABLE
          });
        } else {
          socket.emit('getKeyCategories', {
            status: false,
            message: DVStatus.getMessage(DVStatus.RECORDS_NOT_AVAIALBE,
              'Key Categories'),
            description: '',
            data: iRes,
            response_tag: DVStatus.RECORDS_NOT_AVAIALBE
          });
        }
      });
    });

    socket.on('updateConfig', (data) => {
      let what = {config_val: data.config_val},
      where = {config_key: data.config_key};
      masterConfig.patch('dashboard', what, where, (iErr, iRes) => {
        if (iRes) {
          let what = ["config_id", "config_key", "config_val"];
          let where = {
            is_active: 1,
            is_deleted: 0,
            config_key: "digivalet_alert_sound"
          };
          masterConfig.select("dashboard", what, where, (iErr, iRes) => {
            if (iRes) {
              digivaletConnectionsArray.forEach((tmpSocket) => {
                tmpSocket.emit('updateConfig', {
                  status: true,
                  message: DVStatus.getMessage(DVStatus.RECORDS_AVAILABLE,
                  'Config'),
                  description: '',
                  data: iRes,
                  response_tag: DVStatus.RECORDS_AVAILABLE
                });
              });
            } else {
              socket.emit('updateConfig', {
                status: false,
                message: DVStatus.getMessage(DVStatus.RECORDS_NOT_AVAIALBE,
                'Config'),
                description: '',
                data: iRes,
                response_tag: DVStatus.RECORDS_NOT_AVAIALBE
              });
            }
          });
        } else {
          socket.emit('updateConfig', {
            status: false,
            message: DVStatus.getMessage(DVStatus.RECORD_UPDATE_FAILURE,
            'Mute'),
            description: '',
            data: iRes,
            response_tag: DVStatus.RECORD_UPDATE_FAILURE
          });
        }
      });
    });

    socket.on('setAlert', (data) => {
      console.log(data);
      dashboardAlert.setAlert(data, (iErr, iRes) => {
        if (iRes) {
          socket.emit('setAlert' + data.key_id, {
            status: true,
            message: DVStatus.getMessage(DVStatus.ALERT_CREATED,
            'Alert'),
            description: '',
            data: iRes,
            response_tag: DVStatus.ALERT_CREATED
          });
        } else {
          socket.emit('setAlert', {
            status: false,
            message: DVStatus.getMessage(DVStatus.RECORD_CREATION_FAILURE,
            'Alert'),
            description: '',
            data: iRes,
            response_tag: DVStatus.RECORD_CREATION_FAILURE
          });
        }
      });
    });

    socket.on('getAlert', (data) => {
      let keyId = data.key_id;
      dashboardAlert.select([
        "dashboard_alert_id",
        "key_id",
        "alert_event",
        "alert_emails",
        "alert_mobile_numbers"
      ], {
        is_sent: 0,
        is_active: 1,
        is_deleted: 0,
        key_id: keyId
      }, (iErr, iRes) => {
        if (iRes) {
          socket.emit('getAlert' + keyId, {
            status: true,
            message: DVStatus.getMessage(DVStatus.RECORDS_AVAILABLE,
            'Alert'),
            description: '',
            data: iRes,
            response_tag: DVStatus.RECORDS_AVAILABLE
          });
        } else {
          socket.emit('getAlert' + keyId, {
            status: false,
            message: DVStatus.getMessage(DVStatus.RECORDS_NOT_AVAIALBE,
            'Alert'),
            description: '',
            data: iRes,
            response_tag: DVStatus.RECORDS_NOT_AVAIALBE
          });
        }
      });
    });

    masterConfig.select("dashboard",
    ["config_id", "config_key", "config_val"],
    {is_active: 1, is_deleted: 0}, (iErr, iRes) => {
      if (iRes) {
        socket.emit('getConfig', {
          status: true,
          message: DVStatus.getMessage(DVStatus.RECORDS_AVAILABLE,
          'Config'),
          description: '',
          data: iRes,
          response_tag: DVStatus.RECORDS_AVAILABLE
        });
      } else {
        socket.emit('getConfig', {
          status: false,
          message: DVStatus.getMessage(DVStatus.RECORDS_NOT_AVAIALBE,
          'Config'),
          description: '',
          data: iRes,
          response_tag: DVStatus.RECORDS_NOT_AVAIALBE
        });
      }
    });
  }

};

let pollingLoop = () => {
  digivaletDashboard.get((iErr, iRes) => {
    if (iRes) {
      if (digivaletConnectionsArray.length) {
        pollingTimerForContainer = setTimeout(pollingLoop,
        config.inpremise.dashboard.polling_interval);
        digivaletConnectionsArray.forEach((tmpSocket) => {
          tmpSocket.emit('receivedata', {rooms: iRes});
        });
      }
    }
  });
};

module.exports = digivalet;
