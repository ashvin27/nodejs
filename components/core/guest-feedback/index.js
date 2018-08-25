/***********************************************************
 * Author: vandana chouhan
 * Module: Socket.io Services for the new guest feedback notification
 ***********************************************************/

let feedbackDBObj = require(__base +
    '/components/db-master/guest-feedback'),
  DVStatus = require(__base + 'components/core/helper/http-status-codes'),
  config = require(__base + 'config'),
  feedbackUpdateConnectionsArray = [],
  pollingTimerForContainer;

let guestFeedback = {
  onConnect: (socket) => {
    if (!feedbackUpdateConnectionsArray.length) {
      pollingLoop();
    }

    feedbackUpdateConnectionsArray.push(socket);

    socket.on('disconnect', () => {
      let socketIndex = feedbackUpdateConnectionsArray.indexOf(socket);
      if (socketIndex >= 0) {
        feedbackUpdateConnectionsArray.splice(socketIndex, 1);
      }
    });
  }
};

let pollingLoop = () => {
  feedbackDBObj.getRecords((iErr, iRes) => {
    if (iRes) {
      if (feedbackUpdateConnectionsArray.length) {
        pollingTimerForContainer = setTimeout(pollingLoop,
          config.inpremise.dashboard.polling_interval);
        feedbackUpdateConnectionsArray.forEach((tmpSocket) => {
          tmpSocket.emit('receivedata', {
            feedbackRecords: iRes
          });
        });
      }
    }
  });
};

module.exports = guestFeedback;
