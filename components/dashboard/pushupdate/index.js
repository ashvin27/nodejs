/***********************************************************
 * Author: Pankaj Pandey
 * Module: Socket.io Services for the push update dashboard (Ideally will
 reside In-premise)
 ***********************************************************/

let puDBObj = require(__base +
    '/components/db-master/dashboards/push-update'),
  DVStatus = require(__base + 'components/core/helper/http-status-codes'),
  config = require(__base + 'config'),
  pushUpdateConnectionsArray = [],
  pollingTimerForContainer;

let pushUpdate = {
  onConnect: (socket) => {
    if (!pushUpdateConnectionsArray.length) {
      pollingLoop();
    }

    pushUpdateConnectionsArray.push(socket);

    socket.on('disconnect', () => {
      let socketIndex = pushUpdateConnectionsArray.indexOf(socket);
      if (socketIndex >= 0) {
        pushUpdateConnectionsArray.splice(socketIndex, 1);
      }
    });
    
    socket.on('getFeatures', (data) => {
      puDBObj.getFeatures((iErr, iRes) => {
        if (iRes) {
          socket.emit('getFeatures', {
            status: true,
            message: DVStatus.getMessage(DVStatus.RECORDS_AVAILABLE,
              'push features'),
            description: '',
            data: iRes,
            response_tag: DVStatus.RECORDS_AVAILABLE
          });
        } else {
          socket.emit('getFeatures', {
            status: false,
            message: DVStatus.getMessage(DVStatus.RECORDS_NOT_AVAIALBE,
              'push features'),
            description: '',
            data: iRes,
            response_tag: DVStatus.RECORDS_NOT_AVAIALBE
          });
        }
      });
    });
  }

};

let pollingLoop = () => {
  puDBObj.getRecords((iErr, iRes) => {
    if (iRes) {
      if (pushUpdateConnectionsArray.length) {
        pollingTimerForContainer = setTimeout(pollingLoop,
          config.inpremise.dashboard.polling_interval);
        pushUpdateConnectionsArray.forEach((tmpSocket) => {
          tmpSocket.emit('receivedata', {
            puRecords: iRes
          });
        });
      }
    }
  });
};

module.exports = pushUpdate;
