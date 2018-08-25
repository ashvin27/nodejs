/*******************************************************************************************************************
 *
 * Author: Ashvin Patel
 * Module: Socket.io Services for the Engineering Dashboard (Ideally will reside In-premise)
 *
 ********************************************************************************************************************/

let engineeringDashboard = require(__base + '/components/db-master/dashboards/engineering'),
  masterConfig = require(__base + '/components/db-master/master-configs'),
  floor = require(__base + '/components/db-master/floors'),
  roomType = require(__base + '/components/db-master/room-types'),
  keyCategories = require(__base + '/components/db-master/key-categories'),
  DVStatus = require(__base + 'components/core/helper/http-status-codes'),
  config = require(__base + 'config'),
  engineeringConnectionsArray = [],
  pollingTimerForContainer;

let engineering = {
  onConnect: (socket) => {
    if (!engineeringConnectionsArray.length) {
      pollingLoop();
    }

    engineeringConnectionsArray.push(socket);

    socket.on('disconnect', () => {
      let socketIndex = engineeringConnectionsArray.indexOf(socket);
      if (socketIndex >= 0) {
        engineeringConnectionsArray.splice(socketIndex, 1);
      }
    });


    socket.on('getFloors', (data) => {
      floor.select(["floor_id", "name"], {
        is_active: 1,
        is_deleted: 0
      }, (iErr, iRes) => {
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

    socket.on('setTemperature', (data) => {
      engineeringDashboard.setTemperature(data, (iErr, iRes) => {
        if (iRes) {
          socket.emit('setTemperature', {
            status: true,
            message: DVStatus.getMessage(DVStatus.RECORD_UPDATE_SUCCESS,
              'Temperature'),
            description: '',
            data: iRes,
            response_tag: DVStatus.RECORD_UPDATE_SUCCESS
          });
        } else {
          socket.emit('setTemperature', {
            status: false,
            message: DVStatus.getMessage(DVStatus.RECORD_UPDATE_FAILURE,
              'Temperature'),
            description: '',
            data: iRes,
            response_tag: DVStatus.RECORD_UPDATE_FAILURE
          });
        }
      });
    })

    masterConfig.select("dashboard", [
      "config_id",
      "config_key",
      "config_val"
    ], {
      is_active: 1,
      is_deleted: 0
    }, (iErr, iRes) => {
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
  engineeringDashboard.get((iErr, iRes) => {
    if (iRes) {
      if (engineeringConnectionsArray.length) {
        pollingTimerForContainer = setTimeout(pollingLoop,
        config.inpremise.dashboard.polling_interval);
        engineeringConnectionsArray.forEach((tmpSocket) => {
          tmpSocket.emit('receivedata', {
            rooms: iRes
          });
        });
      }
    }
  });
};

module.exports = engineering;
