let isJSON        = require('is-valid-json'),
config            = require(__base + 'config'),
moment            = require('moment'),
language          = require(__base +
                          '/components/core/language/serviceAssistance'),
serviceAss        = require(__base +
                          'components/core/serviceAssistanceAlert/serviceAssistance')({}),
htmlGenerator     = require(__base +
                          'components/core/helper/serviceAssistence/htmlGenerator')({});

let serviceAssistance = {
    onConnect: (socket) => {
        socket.on('disconnect', function () {});
        socket.on('renderServicePage', function (data) {
           init((initErr, initRes) => {
            if(initRes) {
              let languageText = initRes.languageText;
              socket.emit('servicepageTitle', {
                title: languageText.page_title,
          
              });
          } else if(initErr) {
            console.log('Error occurred in fetching Language Text from DB');
            console.log(initErr);
          }
          });
        });

        socket.on('serviceAssistanceResent', function (data) {
          let filters = {
            limit: data.filter.limit,
            offset: data.filter.offset,
            sortOrderTime: data.sort.sortOrderTime ?
            data.sort.sortOrderTime: '',
            sortDeliveryTime: data.sort.sortDeliveryTime ?
            data.sort.sortDeliveryTime: '',
            pageView: data.pageServiceView,
            byOrder: data.sort.byOrder,
            byDelivery: data.sort.byDelivery,
            lastServiceId: data.lastServieId,
            recentOrder: data.recentOrder,
            searchBy :data.sort.searchBy ? data.sort.searchBy:''
          };
         
          getServiceAssistanceRecent(filters,(pgErr, pgRes)=>{
          getLastServiceId((loErr, loRes) => {
                socket.emit('resentServiceData', {
                  view: pgRes,
                  lastServiceId: loRes
                });
              })  
            })
            getPendingServiceCount((err, pCount) => {
              getCompletedServiceCount((err, cCount) => {
                getCancelledServiceCount((err, cnCount) => {
                  socket.emit('removeDeliveredService', {
                  
                    pCount: pCount,
                    cCount: cCount,
                    canCount :cnCount
                  });
                });
              });
            });
        });
        
          
        socket.on('serviceAssistance', function(data) {
              try{
               let filters = {
                    limit: data.filter.limit,
                    offset: data.filter.offset,
                    sortOrderTime: data.sort.sortOrderTime ?
                    data.sort.sortOrderTime: '',
                    sortDeliveryTime: data.sort.sortDeliveryTime ?
                    data.sort.sortDeliveryTime: '',
                    pageView: data.pageServiceView,
                    byOrder: data.sort.byOrder,
                    byDelivery: data.sort.byDelivery,
                    lastServiceId: data.lastServieId,
                    recentOrder: data.recentOrder,
                    searchBy :data.sort.searchBy ? data.sort.searchBy:''
                  };
                  getFiltersCount(filters,(countErr,countRes)=>{
                   getServiceAssistance(filters,(pgErr, pgRes)=>{
                      getLastServiceId((loErr, loRes) => {
                        if(filters.pageView=='pending') {
                          getPendingServiceCount((err, count) => {
                              socket.emit('serviceAssistance', {
                                view: pgRes,
                                lastServiceId: loRes,
                                totalCount: count,
                                pageServiceView: filters.pageView,
                                dataFilterCount:countRes
                              });
                            });
                        } else if(filters.pageView=='completed') {
                            getCompletedServiceCount((err, count) => {
                              socket.emit('serviceAssistance', {
                                view: pgRes,
                                lastServiceId: loRes,
                                totalCount: count,
                                pageServiceView: filters.pageView,
                                dataFilterCount:countRes
                            });
                        })
                        }
                        else if(filters.pageView=='cancelled') {
                          getCancelledServiceCount((err, count) => {
                              socket.emit('serviceAssistance', {
                                view: pgRes,
                                lastServiceId: loRes,
                                totalCount: count,
                                pageServiceView: filters.pageView,
                                dataFilterCount:countRes
                              });
                          });
                        }
                      });
                    })
                })
               }
            catch(err) {
          console.log(err.message);
        }
        });

      socket.on('serviceDetails', function(data) {
              try {
                let serviceId = data.serviceId;
                if(serviceId) {
                  getServiceDetails(serviceId, (pgErr, pgRes) => {
                      pgRes[0].created_on =moment(pgRes[0].created_on ).format("YYYY-MM-DD hh:mm:ss")
                      socket.emit('serviceDetails', {
                        view: pgRes,
                        serviceId: serviceId
                      });
                  });
                }
              } catch(err) {
                console.log(err.message);
              }
            });

            socket.on('serviceActions', function(data) {
              try {
                if(data.serviceId && data.action) {
                  serviceActions(data, (pgErr, pgRes) => {
                    socket.emit('serviceActions', {
                      view: pgRes,
                      serviceId: data.serviceId,
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

let getFiltersCount = (filters, callback) => {
  serviceAss.getFiltersCount(filters, (ordersErr, ordersRes) => {
    if(ordersRes) {
      callback(null, ordersRes);
       } else {
      callback(ordersErr, null);
    }
  });
};


let getServiceAssistance = (filters, callback) => {
  serviceAss.getServiceAssistance(filters, (ordersErr, ordersRes) => {
    if(ordersRes) {
      callback(null, ordersRes);
       } else {
      callback(ordersErr, null);
    }
  });
};

let getServiceAssistanceRecent = (filters, callback) => {
  serviceAss.getServiceAssistanceRecent(filters, (ordersErr, ordersRes) => {
    if(ordersRes) {
      callback(null, ordersRes);
       } else {
      callback(ordersErr, null);
    }
  });
};


let getLastServiceId = (callback) => {
  serviceAss.getLastServiceId((loErr, loRes) => {
      console.log(loRes);
      callback(null, loRes);
    });
  };
  
  let getServiceAssToMove = (moveOrderAfter, callback) => {
    serviceAss.getServiceAssToMove(moveOrderAfter, (msErr, msRes) => {
      if(msErr) {
        callback(msErr, null);
      }
      if(msRes) {
        if(msRes.length > 0) {
          let orderIdArray = [];
          msRes.forEach((i) => {
            orderIdArray.push(i.serivce_id);
          });
          callback(null, orderIdArray);
        }
      }
    });
  };

  let getPendingServiceCount = (callback) => {
    serviceAss.getPendingServiceCount((psErr, psRes) => {
      callback(null, psRes);
    });
  };

  let getCompletedServiceCount = (callback) => {
    serviceAss.getCompletedServiceCount((csErr, csRes) => {
      callback(null, csRes);
    });
  };
  let getCancelledServiceCount = (callback) => {
    serviceAss.getCancelledServiceCount((cnErr, cnRes) => {
      callback(null, cnRes);
    });
  };

  let serviceActions = (data, callback) => {
    serviceAss.serviceActions(data, (saErr, saRes) => {
      callback(null, saRes);
    });
  };

  let getServiceDetails = (serviceId, callback) => {
    serviceAss.getServiceDetails(serviceId, (serviceErr, serviceRes) => {
      if(serviceRes) {
        callback(null, serviceRes);
          } else {
        callback(serviceErr, null);
      }
    });
  };
  
  let getLanguageText = (data, callback) => {

    let options = {
      hotelCode: config.hotelProperties.hotelCode,
      moduleName: 'serviceAssistence',
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
   
let getServiceData = (data,pageServiceView, callback) => {
    htmlGenerator.getServiceData(data,pageServiceView, (htmlErr, htmlRes) => {
      if(htmlRes) {
        callback(null, htmlRes);
      } else {
        callback(htmlErr, null);
      }
    });
  };


  let htmlServiceDetails = (data, callback) => {
    htmlGenerator.getServiceDetails(data, (htmlErr, htmlRes) => {
      if(htmlRes) {
        callback(null, htmlRes);
      } else {
        callback(htmlErr, null);
      }
    });
  };


  // let htmlShowingTotalRecord = (data, callback) => {
  //   htmlGenerator.htmlShowingTotalRecord(data, (htmlErr, htmlRes) => {
  //     if(htmlRes) {
  //       callback(null, htmlRes);
  //     } else {
  //       callback(htmlErr, null);
  //     }
  //   });
  // };


  

  module.exports = serviceAssistance;
