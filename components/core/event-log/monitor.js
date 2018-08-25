let config = require(__base + '/config'),
        eventLog = require(__base +
                '/components/core/event-log'),
        moment = require('moment');

let eventLogMonitor = setInterval(() => {
    eventLog.newEvent((purErr, purRes) => {
  });
}, config.inpremise.eventLog.monitoringTime);