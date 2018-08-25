let config    = require(__base + '/config'),
irdOrders  = require(__base +
  '/components/db-master/irdOrderAlert/irdOrders'),
moment = require('moment')

let irdOrderMonitor = setInterval(() => {
  setIRDOrderAutoComplete();
}, config.inpremise.irdOrderSetComplete.monitoringTime);

let setIRDOrderAutoComplete = () => {
  irdOrders.setAutoDeliveryStatus();
};
