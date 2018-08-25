let
isJSON                  = require('is-valid-json'),
config                  = require(__base + 'config'),
serviceAssistance       = require(__base +
                            'components/db-master/serviceAssistanceAlert/serviceAssistance');

let serviceAssistanceData = (options) => {
  return {
    getServiceAssistance: (filters, callback) => {
        getServiceAssistanceProcess(filters, (opErr, opRes) => {
        callback(opErr, opRes);
      });
    },
    getServiceAssistanceRecent: (filters, callback) => {
      getServiceAssistanceRecentProcess(filters, (opErr, opRes) => {
      callback(opErr, opRes);
    });
  },
    getLastServiceId: (callback) => {
        getLastServiceIdProcess((loErr, loRes) => {
        callback(null, loRes);
      });
    },
    getPendingServiceCount: (callback) => {
        getPendingServiceCountProcess((poErr, poRes) => {
          callback(null, poRes);
        });
      },
      getCompletedServiceCount: (callback) => {
        getCompletedServiceCountProcess((coErr,coRes) => {
          callback(null, coRes);
        });
      },
      getCancelledServiceCount: (callback) => {
        getCancelledServiceCountProcess((cnErr,cnRes) => {
          callback(null, cnRes);
        });
      },
      getFiltersCount: (filters, callback) => {
        getFiltersCountProcess(filters, (fcErr, fcRes) => {
        callback(fcErr, fcRes);
      });
    },
      
      getServiceDetails: (servceId, callback) => {
        getServiceDetailsProcess(servceId, (srErr, srRes) => {
          callback(srErr, srRes);
        });
      },
      getServiceAssToMove: (moveOrderAfter, callback) => {
        getServiceAssToMoveProcess(moveOrderAfter, (moErr, moRes) => {
          callback(null, moRes);
        });
      },
      serviceActions: (data, callback) => {
        applyServiceActions(data, (oaErr, oaRes) => {
          callback(null, oaRes);
        });
      },
     

  }
};


let getFiltersCountProcess = (filters, callback) =>{
  serviceAssistance.getFiltersCount(filters, (filterErr, filterRes) => {
  if(filterErr) {
    callback(filterErr, null);
  }
  else{
    callback(null, filterRes);
  }
});
};


let getServiceAssistanceProcess = (filters, callback) => {
 
    serviceAssistance.getServiceAssistance(filters, (ordersErr, ordersRes) => {
    if(ordersErr) {
      callback(ordersErr, null);
    }
    if(ordersRes) {
      callback(null, ordersRes);
    }
  });
};

let getServiceAssistanceRecentProcess = (filters, callback) => {
 
  serviceAssistance.getServiceAssistanceRecent(filters, (ordersErr, ordersRes) => {
  if(ordersErr) {
    callback(ordersErr, null);
  }
  if(ordersRes) {
    callback(null, ordersRes);
  }
});
};


let getLastServiceIdProcess = (callback) => {
    serviceAssistance.getLastServiceId((loErr, loRes) => {
    if(loErr) {
      callback(loErr, null);
    }
    if(loRes) {
      callback(null, loRes);
    }
  });
};


let getPendingServiceCountProcess = (callback) => {
    serviceAssistance.getPendingServiceCount((poErr, poRes) => {
      console.log(poRes);
      if(poErr) {
        callback(poErr, null);
      } else {
        callback(null, poRes);
      }
    });
  };


  let getCancelledOrdersCountProcess = (callback) => {
    serviceAssistance.getCancelledOrdersCount((csErr, csRes) => {
      console.log('completed orders count');
      if(csErr) {
        callback(csErr, null);
      }
      else {
        callback(null, csRes);
      }
    });
  };
  

  let getCompletedServiceCountProcess = (callback) => {
    serviceAssistance.getCompletedServiceCount((coErr, coRes) => {
     
      if(coErr) {
        callback(coErr, null);
      }
      else {
        callback(null, coRes);
      }
    });
  };

  let getCancelledServiceCountProcess = (callback) => {
    serviceAssistance.getCancelledServiceCount((cnErr, cnRes) => {
      if(cnErr) {
        callback(cnErr, null);
      }else{
       callback(null, cnRes);
      }
      
    });
  };

  let getServiceDetailsProcess = (serviceId, callback) => {
    serviceAssistance.getServiceDetails(serviceId, (serviceErr, serviceRes) => {
      if(serviceErr) {
        callback(serviceErr, null);
      }
      if(serviceRes) {
        callback(null, serviceRes);
      }
    });
  };


let getServiceAssToMoveProcess = (moveOrderAfter, callback) => {
  serviceAssistance.getServiceAssToMove(moveOrderAfter, (moErr, moRes) => {
    if(moErr) {
      callback(moErr, null);
    }
    if(moRes) {
      callback(null, moRes);
    }
  });
}
  

let applyServiceActions = (data, callback) => {
  serviceAssistance.applyServiceActions(data, (oaErr, oaRes) => {
    if(oaRes) {
      callback(oaErr, null);
    }
    if(oaRes) {
      callback(null, oaRes);
    }
  });
}




module.exports = serviceAssistanceData;
