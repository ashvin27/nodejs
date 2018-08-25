let config    = require(__base + '/config'),
promotionsMaster  = require(__base +
  '/components/core/promotions')({}),
moment = require('moment');
/**
* promotions monitoring
* actions
*/
let psMonitor = setInterval(() => {
  promotionsMaster.promotionsMonitor((purErr, purRes) => {
  });
}, config.inpremise.promotions.monitoringTime);

