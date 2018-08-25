let
isJSON  = require('is-valid-json'),
config      = require(__base + 'config'),
irdOrdersTbl   = require(__base +
  'components/db-master/irdOrderAlert/irdOrders');

let irdOrders = (options) => {
  return {
    getOrders: (filters, callback) => {
      getOrdersProcess(filters, (opErr, opRes) => {
        callback(opErr, opRes);
      });
    },
    getOrderDetails: (orderId, callback) => {
      getOrderDetailsProcess(orderId, (opErr, opRes) => {
        callback(opErr, opRes);
      });
    },
    getLastOrderId: (callback) => {
      getLastOrderIdProcess((loErr, loRes) => {
        callback(null, loRes);
      });
    },
    getPendingOrdersCount: (callback) => {
      getPendingOrdersCountProcess((poErr, poRes) => {
        callback(null, poRes);
      });
    },
    getCompletedOrdersCount: (callback) => {
      getCompletedOrdersCountProcess((coErr, coRes) => {
        callback(null, coRes);
      });
    },
    getCancelledOrdersCount: (callback) => {
      getCancelledOrdersCountProcess((coErr, coRes) => {
        callback(null, coRes);
      });
    },
    orderActions: (data, callback) => {
      applyOrderActions(data, (oaErr, oaRes) => {
        callback(null, oaRes);
      });
    },
    getIRDOrdersToMove: (moveOrderAfter, callback) => {
      getIRDOrdersToMoveProcess(moveOrderAfter, (moErr, moRes) => {
        callback(null, moRes);
      });
    }
  }
};

let getOrdersProcess = (filters, callback) => {
  irdOrdersTbl.getOrders(filters, (ordersErr, ordersRes) => {
    if(ordersErr) {
      callback(ordersErr, null);
    }
    if(ordersRes) {
      callback(null, ordersRes);
    }
  });
};

let getOrderDetailsProcess = (orderId, callback) => {
  irdOrdersTbl.getOrderDetails(orderId, (ordersErr, ordersRes) => {
    if(ordersErr) {
      callback(ordersErr, null);
    }
    if(ordersRes) {
      callback(null, ordersRes);
    }
  });
};

let getLastOrderIdProcess = (callback) => {
  irdOrdersTbl.getLastOrderId((loErr, loRes) => {
    if(loErr) {
      callback(loErr, null);
    }
    if(loRes) {
      callback(null, loRes);
    }
  });
};

let getPendingOrdersCountProcess = (callback) => {
  irdOrdersTbl.getPendingOrdersCount((poErr, poRes) => {
    console.log(poRes);
    if(poErr) {
      callback(poErr, null);
    } else {
      callback(null, poRes);
    }
  });
};

let getCompletedOrdersCountProcess = (callback) => {
  irdOrdersTbl.getCompletedOrdersCount((coErr, coRes) => {
    console.log('completed orders count');
    if(coErr) {
      callback(coErr, null);
    }
    if(coRes) {
      callback(null, coRes);
    }
  });
};

let getCancelledOrdersCountProcess = (callback) => {
  irdOrdersTbl.getCancelledOrdersCount((coErr, coRes) => {
    console.log('completed orders count');
    if(coErr) {
      callback(coErr, null);
    }
    if(coRes) {
      callback(null, coRes);
    }
  });
};

let applyOrderActions = (data, callback) => {
  irdOrdersTbl.applyOrderActions(data, (oaErr, oaRes) => {
    if(oaRes) {
      callback(oaErr, null);
    }
    if(oaRes) {
      callback(null, oaRes);
    }
  });
}

let getIRDOrdersToMoveProcess = (moveOrderAfter, callback) => {
  irdOrdersTbl.getIRDOrdersToMove(moveOrderAfter, (moErr, moRes) => {
    if(moErr) {
      callback(moErr, null);
    }
    if(moRes) {
      callback(null, moRes);
    }
  });
}

module.exports = irdOrders;
