/***********************************************************
 * Author: Ashvin Patel
 * Module: Socket.io Services for the FrontOffice Dashboard (Ideally will
 reside In-premise)
 ***********************************************************/

let frontOfficeDashboard = require(__base +
    '/components/db-master/dashboards/front-office'),
  masterConfig = require(__base + '/components/db-master/master-configs'),
  floor = require(__base + '/components/db-master/floors'),
  roomType = require(__base + '/components/db-master/room-types'),
  keyCategories = require(__base + '/components/db-master/key-categories'),
  DVStatus = require(__base + 'components/core/helper/http-status-codes'),
  config = require(__base + 'config'),
  frontOfficeConnectionsArray = [],
  pollingTimerForContainer;

let frontOffice = {
  onConnect: (socket) => {
    if (!frontOfficeConnectionsArray.length) {
      pollingLoop();
    }

    frontOfficeConnectionsArray.push(socket);

    socket.on('disconnect', () => {
      let socketIndex = frontOfficeConnectionsArray.indexOf(socket);
      if (socketIndex >= 0) {
        frontOfficeConnectionsArray.splice(socketIndex, 1);
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
  frontOfficeDashboard.get((iErr, iRes) => {
    if (iRes) {
      if (frontOfficeConnectionsArray.length) {
        pollingTimerForContainer = setTimeout(pollingLoop,
          config.inpremise.dashboard.polling_interval);
        frontOfficeConnectionsArray.forEach((tmpSocket) => {
          tmpSocket.emit('receivedata', {
            rooms: iRes
          });
        });
      }
    }
  });
};

module.exports = frontOffice;
