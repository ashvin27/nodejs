let isJSON  = require('is-valid-json'),
config      = require(__base + 'config'),
irdOrdersTbl   = require(__base +
  'components/db-master/irdOrderAlert/irdOrders'),
irdOrders   = require(__base +
  'components/core/irdOrderAlert/irdOrders')({}),
language   = require(__base +
    '/components/core/language'),
htmlGenerator   = require(__base +
  'components/core/helper/irdOrderAlert/htmlGenerator')({});

let irdOrderAlert = {
  onConnect: (socket) => {
    socket.on('disconnect', function () {});
      socket.on('renderPage', function (data) {
        init((initErr, initRes) => {
          if(initRes) {
            let languageText = initRes.languageText;
            // getPageTitle(languageText, (pgErr, pgRes) => {
            //     socket.emit('pageTitle', {
            //       view: pgRes
            //     });
            // });
            // getTabOptions(languageText, (pgErr, pgRes) => {
            //     socket.emit('tabOptions', {
            //       view: pgRes
            //     });
            // });
            getFilters(languageText, (pgErr, pgRes) => {
                socket.emit('filters', {
                  view: pgRes
                });
            });
        } else if(initErr) {
          console.log('Error occurred in fetching Language Text from DB');
          console.log(initErr);
        }
        });
      });

      socket.on('irdOrders', function(data) {
        try {
          let filters = {
            limit: data.filter.limit,
            offset: data.filter.offset,
            sortOrderTime: data.sort.sortOrderTime ?
            data.sort.sortOrderTime: '',
            sortDeliveryTime: data.sort.sortDeliveryTime ?
            data.sort.sortDeliveryTime: '',
            pageView: data.pageView,
            byOrder: data.sort.byOrder,
            byDelivery: data.sort.byDelivery,
            lastOrderId: data.lastOrderId,
            recentOrder: data.recentOrder
          };
          
          getIrdOrders(filters, (pgErr, pgRes) => {
            getLastOrderId((loErr, loRes) => {
              if(filters.recentOrder==1) {
                if(pgRes) {
                  socket.emit('recentOrder', {
                    view: pgRes,
                    lastOrderId: loRes
                  });
                }

                getIRDOrdersToMove(
                  config.inpremise.irdOrderSetComplete.moveOrderAfter,
                  (tmErr, tmRes) => {
                    getPendingOrdersCount((err, pCount) => {
                      getCompletedOrdersCount((err, cCount) => {
                        socket.emit('removeDeliveredOrders', {
                          orderIdArray: tmRes ? tmRes : [],
                          pCount: pCount,
                          cCount: cCount
                        });
                      });
                    });
                });
              } else {
                if(filters.pageView=='pending') {
                  getPendingOrdersCount((err, count) => {
                    socket.emit('irdOrders', {
                      view: pgRes,
                      lastOrderId: loRes,
                      totalCount: count,
                      pageView: filters.pageView
                    });
                  });
                } else if(filters.pageView=='completed') {
                  getCompletedOrdersCount((err, count) => {
                    socket.emit('irdOrders', {
                      view: pgRes,
                      lastOrderId: loRes,
                      totalCount: count,
                      pageView: filters.pageView
                    });
                  });
                } else if(filters.pageView=='cancelled') {
                  getCancelledOrdersCount((err, count) => {
                    socket.emit('irdOrders', {
                      view: pgRes,
                      lastOrderId: loRes,
                      totalCount: count,
                      pageView: filters.pageView
                    });
                  });
                }
              }
            });
          });
        } catch(err) {
          console.log(err.message);
        }
      });

      socket.on('irdOrderDetails', function(data) {
        try {
          let orderId = data.orderId;
          if(orderId) {
            getOrderDetails(orderId, (pgErr, pgRes) => {
              socket.emit('irdOrderDetails', {
                view: pgRes,
                orderId: orderId
              });
            });
          }
        } catch(err) {
          console.log(err.message);
        }
      });
      socket.on('orderActions', function(data) {
        try {
          if(data.orderId && data.action) {
            orderActions(data, (pgErr, pgRes) => {
              socket.emit('orderActions', {
                view: pgRes,
                orderId: data.orderId,
                action: data.action
              });
            });
          }
        } catch(err) {
          console.log(err.message);
        }
      });
  }
};

let getLanguageText = (data, callback) => {

  let options = {
    hotelCode: config.hotelProperties.hotelCode,
    moduleName: 'irdOrderAlert',
    langCode: data.langCode,
    tagType: data.tagType
  };
  language.getLanguageText(options, (langErr, langRes) => {
    if(langErr) {
      callback(langErr, null);
    } else if(langRes) {
      if(langRes.length > 0) {
        let languageTextArray = {};
        langRes.forEach((item) => {
          languageTextArray[item.tag_key] = item.tag_val;
        });
        callback(null, languageTextArray);
      }
    }
  });
};

let init = (callback) => {

  let options = {
    langCode: 'en',
    tagType: ''
  };

  let dataPacket = {
    languageText: ''
  };

  getLanguageText(options, (gLErr, gLRes) => {
    if(gLErr) {
      console.log(gLErr);
    }
    if(gLRes) {
      dataPacket.languageText = gLRes;
      callback(null, dataPacket);
    } else if(gLErr) {
      callback(gLErr, null);
    }
  });
};

let getPageTitle = (languageText, callback) => {
  console.log('calling page title');
  htmlGenerator.getPageTitle(languageText, (htmlErr, htmlRes) => {
    if(htmlRes) {
      callback(null, htmlRes);
    } else {
      callback(htmlErr, null);
    }
  });
};

let getTabOptions = (languageText, callback) => {
  htmlGenerator.getTabOptions(languageText, (htmlErr, htmlRes) => {
    if(htmlRes) {
      callback(null, htmlRes);
    } else {
      callback(htmlErr, null);
    }
  });
};

let getShowingRecords = (languageText, callback) => {
  htmlGenerator.getShowingRecords(languageText, (htmlErr, htmlRes) => {
    if(htmlRes) {
      callback(null, htmlRes);
    } else {
      callback(htmlErr, null);
    }
  });
};

let getFilters = (languageText, callback) => {
  htmlGenerator.getFilters(languageText, (htmlErr, htmlRes) => {
    if(htmlRes) {
      callback(null, htmlRes);
    } else {
      callback(htmlErr, null);
    }
  });
};

let getIrdOrders = (filters, callback) => {
  irdOrders.getOrders(filters, (ordersErr, ordersRes) => {
    if(ordersRes) {
      htmlGenerator.getOrders(ordersRes, (htmlErr, htmlRes) => {
        if(htmlRes) {
          callback(null, htmlRes);
        } else {
          callback(htmlErr, null);
        }
      });
    } else {
      callback(ordersErr, null);
    }
  });
};

let getOrderDetails = (orderId, callback) => {
  irdOrders.getOrderDetails(orderId, (ordersErr, ordersRes) => {
    if(ordersRes) {
      htmlGenerator.getOrderDetails(ordersRes, (htmlErr, htmlRes) => {
        if(htmlRes) {
          callback(null, htmlRes);
        } else {
          callback(htmlErr, null);
        }
      });
    } else {
      callback(ordersErr, null);
    }
  });
};

let getLastOrderId = (callback) => {
  irdOrders.getLastOrderId((loErr, loRes) => {
    console.log(loRes);
    callback(null, loRes);
  });
};

let getPendingOrdersCount = (callback) => {
  irdOrders.getPendingOrdersCount((poErr, poRes) => {
    callback(null, poRes);
  });
};

let getCompletedOrdersCount = (callback) => {
  irdOrders.getCompletedOrdersCount((coErr, coRes) => {
    callback(null, coRes);
  });
};

let getCancelledOrdersCount = (callback) => {
  irdOrders.getCancelledOrdersCount((coErr, coRes) => {
    callback(null, coRes);
  });
};

let orderActions = (data, callback) => {
  irdOrders.orderActions(data, (oaErr, oaRes) => {
    callback(null, oaRes);
  });
};

let getIRDOrdersToMove = (moveOrderAfter, callback) => {
  irdOrders.getIRDOrdersToMove(moveOrderAfter, (moErr, moRes) => {
    if(moErr) {
      callback(moErr, null);
    }
    if(moRes) {
      if(moRes.length > 0) {
        let orderIdArray = [];
        moRes.forEach((i) => {
          orderIdArray.push(i.order_id);
        });
        callback(null, orderIdArray);
      }
    }
  });
};
module.exports = irdOrderAlert;
