let config = require(__base + '/config'),
        roomProfile = require(__base +
                '/components/core/room-profile'),
        moment = require('moment');

let roomProfileMonitor = setInterval(() => {
    roomProfile.expireAssigment((purErr, purRes) => {
        console.log("Monitor to expire profile..................prototype");
  });
}, config.inpremise.roomProfile.monitoringTime);