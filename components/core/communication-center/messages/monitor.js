let config    = require(__base + '/config'),
messageCore = require(__base +
  'components/core/communication-center/messages/'),
messagesMaster = require(__base +
  'components/db-master/communicationCenter/messages.js'),
messagesRecurringMaster = require(__base +
  'components/db-master/communicationCenter/messages-recurring.js'),
moment = require('moment');

let msgMonitor = setInterval(() => {
  getMessageRecords((msgErr, msgRes) => {
  });
}, config.inpremise.syncMessage.monitoringTime);

let getMessageRecords = (callback) => {

  let what = [];
  let conditions = {
    where: {
      is_deleted: 0
    },
    whereE: [{
      f: 'start_date',
      m: '<=',
      l: moment().format('YYYY-MM-DD HH:mm:ss')
    },{
      f: 'sent_time',
      m: '<=',
      l: moment().format('HH:mm:ss')
    }]
  };
  messagesMaster.select('v_cmc_message', what, conditions, (msgErr, msgRes) => {
    if(msgRes && msgRes.length > 0) {
      let rowCount = msgRes.length;
      insertMessageDelivery(msgRes, rowCount, (imdErr, imdRes) => {
        if(imdRes) {
          callback(null, true);
        } else {
          callback(imdErr, null);
        }
      });
    } else {
      callback(msgErr, null);
    }
  });
};

let insertMessageDelivery = (data, count, callback) => {
  let dataToPacket = {};
  let keyArr = [];
  let floorArr = [];
  data.forEach((item) =>{
    if(item.message_type_id != 1) {
      if(item.is_synced == 0) {
        let fetchKey = item.key_id.split(',');
        if(fetchKey.length > 1){
          for(let k=0; k<fetchKey.length; k++){
            keyArr.push(fetchKey[k]);
          }
          insDeliveryMsg(keyArr, item, count, '', (idmErr, idmRes) => {
            if(idmRes) {
              //Do Somthing
            } else {
              callback(idmErr, null);
            }
          });
        }else {
          if(item.key_id == 'all') {
            if(item.floor_id == 'all') {
              let what_floor = [];
              let conditions_floor = {
                where: {
                  is_deleted: 0
                },
              };
              messagesMaster.select('keys', what_floor, conditions_floor,
              (kErr, kRes) => {
                kRes.forEach((keyItem) =>{
                  keyArr.push(keyItem.key_id);
                })
                insDeliveryMsg(keyArr, item, count, '', (idmErr, idmRes) => {
                  if(idmRes) {
                    //Do Somthing
                  } else {
                    callback(idmErr, null);
                  }
                });
              })
            }else {
              let fetchFloor = item.floor_id.split(',');
              if(fetchFloor.length > 1){
                for(let f=0; f<fetchFloor.length; f++){
                  floorArr.push(fetchFloor[f]);
                }
              }else{
                floorArr.push(item.floor_id);
              }
              let what_floor = [];
              let conditions_floor = {
                where: {
                  is_deleted: 0
                },
                where_in: {
                  key: 'floor_id',
                  value: floorArr
                }
              };
              messagesMaster.select('keys', what_floor, conditions_floor,
              (kErr, kRes) => {
                kRes.forEach((keyItem) =>{
                  keyArr.push(keyItem.key_id);
                })
                insDeliveryMsg(keyArr, item, count, '', (idmErr, idmRes) => {
                  if(idmRes) {
                    //Do Somthing
                  } else {
                    callback(idmErr, null);
                  }
                });
              })
            }
          }else {
            keyArr.push(item.key_id);
            insDeliveryMsg(keyArr, item, count, '', (idmErr, idmRes) => {
              if(idmRes) {
                //Do Somthing
              } else {
                callback(idmErr, null);
              }
            });
          }
        }
      }
    }else {
      let dayNo = moment().weekday();
      let currentTime = moment().format('HH:mm:ss');//moment().add(1, 'd')
      let currentDate = moment().format('YYYY-MM-DD');
      let recTime = item.recurring_time.split('#');
      if(recTime) {
        for(let r=0; r<recTime.length; r++){
          let getTime = recTime[r].split(',');
          if(currentDate <= moment(item.until_date).format('YYYY-MM-DD')) {
            if(dayNo == getTime[0]){
              if(getTime[1] <= currentTime) {
                if(getTime[2] == 0) {
                  /*
                  * Start Recurring Message stored in delivery table
                  */
                  let fetchKey = item.key_id.split(',');
                  if(fetchKey.length > 1){
                    for(let k=0; k<fetchKey.length; k++){
                      keyArr.push(fetchKey[k]);
                    }
                    insDeliveryMsg(keyArr, item, count, getTime[3],
                      (idmErr, idmRes) => {
                      if(idmRes) {
                        //Do Somthing
                      } else {
                        callback(idmErr, null);
                      }
                    });
                  }else {
                    if(item.key_id == 'all') {
                      if(item.floor_id == 'all') {
                        let what_floor = [];
                        let conditions_floor = {
                          where: {
                            is_deleted: 0
                          },
                        };
                        messagesMaster.select('keys', what_floor,
                        conditions_floor, (kErr, kRes) => {
                          kRes.forEach((keyItem) =>{
                            keyArr.push(keyItem.key_id);
                          })
                          insDeliveryMsg(keyArr, item, count, getTime[3],
                            (idmErr, idmRes) => {
                            if(idmRes) {
                              //Do Somthing
                            } else {
                              callback(idmErr, null);
                            }
                          });
                        })
                      }else {
                        let fetchFloor = item.floor_id.split(',');
                        if(fetchFloor.length > 1){
                          for(let f=0; f<fetchFloor.length; f++){
                            floorArr.push(fetchFloor[f]);
                          }
                        }else{
                          floorArr.push(item.floor_id);
                        }
                        let what_floor = [];
                        let conditions_floor = {
                          where: {
                            is_deleted: 0
                          },
                          where_in: {
                            key: 'floor_id',
                            value: floorArr
                          }
                        };
                        messagesMaster.select('keys', what_floor,
                        conditions_floor, (kErr, kRes) => {
                          kRes.forEach((keyItem) =>{
                            keyArr.push(keyItem.key_id);
                          })
                          insDeliveryMsg(keyArr, item, count, getTime[3],
                            (idmErr, idmRes) => {
                            if(idmRes) {
                              //Do Somthing
                            } else {
                              callback(idmErr, null);
                            }
                          });
                        })
                      }
                    }else {
                      keyArr.push(item.key_id);
                      insDeliveryMsg(keyArr, item, count, getTime[3],
                        (idmErr, idmRes) => {
                        if(idmRes) {
                          //Do Somthing
                        } else {
                          callback(idmErr, null);
                        }
                      });
                    }
                  }
                  /*
                  * End Recurring Message stored in delivery table
                  */
                }else{
                  //console.log('IS SYNCED IF TIME DOWNS::::::::::::'+getTime[3]);
                }
              }else {
                //console.log('TIME IF TIME DOWNS::::::::::::::::::'+getTime[3]);
              }
            }else{
              //console.log('DAY IF TIME DOWNS::::::::::::::::::::::'+getTime[3]);
              updateCmcMessage(item.message_id, item.message_type_id,
                getTime[3], 1, (umErr, umRes) => {
                if(umRes) {
                  //insertMessageDelivery(data, count, callback);
                } else {
                  callback(umErr, null);
                }
              });
            }
          }
        }
      }
    }
    keyArr = [];
    floorArr = [];
  })
};

let insDeliveryMsg = (keyArr, data, count, recurringMapId, callback) => {
  let conditions_pmsi = {};
  if(data.message_type_id == 2) {
    conditions_pmsi = {
      where: {
        guest_type: 'primary',
        group_code: data.group_code,
        is_deleted: 0
      }
    };
  }else {
    conditions_pmsi = {
      where: {
        guest_type: 'primary',
        is_deleted: 0
      },
      where_in: {
        key: 'key_id',
        value: keyArr
      }
    };
  }

  let what_pmsi = ['pmsi_guest_id', 'key_id'];
  //if(item.key_id!='all'){
    messagesMaster.select('pmsi_guests', what_pmsi, conditions_pmsi,
    (pmsiErr, pmsiRes) => {
      if(pmsiRes) {
        let dataPacket = [];
        let deliveryMappingData = {};
        pmsiRes.forEach((pmsiItem) => {
          deliveryMappingData['message_id'] = data.message_id,
          deliveryMappingData['key_id'] = pmsiItem.key_id,
          deliveryMappingData['pmsi_guest_id'] = pmsiItem.pmsi_guest_id,
          deliveryMappingData['delivery_status'] = 0,
          deliveryMappingData['hotel_id'] = data.hotel_id,
          deliveryMappingData['created_by'] = 1
          dataPacket.push(deliveryMappingData);
          deliveryMappingData = {};
        });

        messagesMaster.insert('cmc_message_delivery_mapping', dataPacket,
         (imdErr, imdRes) => {
          if(imdRes) {
            count--;
            if(count >= 0) {
              updateCmcMessage(data.message_id, data.message_type_id,
                recurringMapId, '', (umErr, umRes) => {
                if(umRes) {
                  //insertMessageDelivery(data, count, callback);
                } else {
                  callback(umErr, null);
                }
              });
            } else {
              callback(null, true);
            }
          } else {
            callback(null, true);
          }
        });
      }
    })
};

let updateCmcMessage = (id, messageTypeId, recurringMapId, notSimilarDay,
   callback) => {

  if(messageTypeId == 1) {
    let what = {};
    if(notSimilarDay == 1){
      what = {
        is_synced: 0
      };
    }else {
      what = {
        is_synced: 1
      };
    }

    let conditions = {
      where: {
        recurring_map_id: recurringMapId
      }
    };
    messagesMaster.update('cmc_message_recurring_mapping', conditions, what,
    (umErr, umRes) => {
      if(umRes) {
        callback(null, true);
      } else {
        callback(umErr, false);
      }
    });
  }else {
    let what = {
      is_synced: 1
    };
    let conditions = {
      where: {
        message_id: id
      }
    };
    messagesMaster.update('cmc_message', conditions, what, (umErr, umRes) => {
      if(umRes) {
        callback(null, true);
      } else {
        callback(umErr, false);
      }
    });
  }

};

/*let hdValetMonitor = setInterval(() => {
  messageCore.msgToHDValet();
}, 6000);*/
