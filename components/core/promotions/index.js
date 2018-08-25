let config = require(__base + '/config'),
promotions = require(__base + 'components/db-master/promotions'),
promotionsMaster = require(__base + 'components/db-master/promotions_master'),
moment     = require('moment');

module.exports = (params) => {
  return {
    list: (callback) => { 
      getPromotionsToSend((err, data) => {
        if(data) {

          callback(null, {"details":data});
        } else {
          callback(err, null);
        }
      });
    },
    promotionReceived: (data, callback) => {
      promotions.promotionReceived(data, (prErr, prRes) => {
        if(prRes) {
          callback(null, true);
        } else {
          callback(prErr, null);
        }
      });
    },
    // getPromotionsToSend: (callback) => {
    //   promotions.getList((glErr, glRes) => {
    //     if(glRes) {
    //         promotions.getDevices((gdErr, gdRes) => {
    //           if(gdRes) {
    //             composeJSON(glRes, gdRes, (outputJSON) => {
    //               callback(null, outputJSON);
    //             });
    //           }
    //         });
    //     } else {
    //         callback(glErr, glRes);
    //     }
    //   });
    // },
    /*******************************************/
    getAllPromotions: (data, callback) => {
      getAllPromotionsToSend(data, (prErr, prRes) => {

        if(prRes) {
          callback(null, {"details":prRes});
        } else {
          callback(prErr, null);
        }
      });
    },
    /*******************************************/
    promotionsMonitor: (callback) => {
      promotionsMaster.select((err, data) => {
        if(data) {
           updatePromotionsIsSent(data, (upsErr, upsRes) => {
          if(upsRes) {
            console.log(upsRes)
          } else {
            callback(upsErr, null);
          }
        });
        } else {
             console.log(err);    
            }
      });
    },
  }
};
/******getAll Promotions according to given inroom_device_id*********/
let getAllPromotionsToSend = (data,callback) => {
  console.log('test getAllPromotionsToSend')
  promotions.getList((glErr, glRes) => {
    if(glRes) {
         promotions.getDevicesWithInroomDeviceId(data,(gdErr, gdRes) => {
          if(gdRes) {

            composeJSON(glRes, gdRes, (outputJSON) => {

              callback(null, outputJSON);
            });
          }
        });
    } else {
        callback(glErr, glRes);
    }
  });
};
/********************************************************************/
let getPromotionsToSend = (callback) => {
  promotions.getList((glErr, glRes) => {
    if(glRes) {
        promotions.getDevices((gdErr, gdRes) => {
          if(gdRes) {
            composeJSON(glRes, gdRes, (outputJSON) => {
              callback(null, outputJSON);
            });
          }
        });
    } else {
        callback(glErr, glRes);
    }
  });
};
   let updatePromotionsIsSent = (data, callback) => 
   {
          data.forEach(function(e){
          console.log('promoid is =='+ e.promo_id);
          let what = {
          is_sent: 1
        };
        let where = {
          promo_id: e.promo_id
        };
        promotionsMaster.update(what, where, (puuErr, puuRes) => {
          if(puuRes) {
            callback(null, true);
          } else {
            callback(puuErr, false);
          }
         });
        });
    }

let composeJSON = (list, devices, callback) => {
let promotions = [];
  if(devices.length > 0 && list.length > 0) {
   var ip = [];
   for (var i = 0; i < devices.length; i++) {
       var ip =(devices[i].ip).split(',');
    }
        
    // devices.forEach((i) => {
      let ipAdd = devices[0].ip;
      let jsonObj = {
        key_number: devices[0].room_number,
        keyId:i.key_id,
        comm_key: devices[0].communication_token,
        data: [{
          device_category: devices[0].device_category,
          device_id: devices[0].in_room_device_id,
          ip_addresses: ip,
          port: i.update_port
        }]
      };

  
      let pathPrefix = config.inpremise.server.protocol +
      '://' + config.server.fqdn + '/' +
      config.projects.name.inpremiseApi;

      list.forEach((j) => {
        let language = [];

        list.forEach((k) => {
          if(j.promotion_id==k.promotion_id) {
            language.push({
              title: k.title,
              description: k.description,
              language_code: k.lang_code,
              promo_path: pathPrefix + '/assets/uploads/' +
              ( devices[0].feature_code).toLowerCase() + '/' +
              config.hotelProperties.hotelid + '/templates/' + k.template_path
              + '/generated/' + k.promo_path + '/' + k.lang_code + '.html'
            });
          }
        });

        let packet = {
          promo_id: j.promotion_id,
          thumb_img_path: pathPrefix + '/assets/uploads/' +
          ( devices[0].feature_code).toLowerCase() + '/' +
          config.hotelProperties.hotelid + '/assets/' + j.file_path,
          large_thumb_img_path: pathPrefix + '/assets/uploads/' +
          ( devices[0].feature_code).toLowerCase() + '/' +
          config.hotelProperties.hotelid + '/assets/' + j.file_path,
          category_name: j.category_name,
          category_code: j.category_code,
          is_featured: j.is_featured,
          type: j.category_code=='HOMESCREEN' ? 'homescreen' : 'module',
          modified_on: moment(j.modified_on, "M/D/YYYY H:mm").unix() ?
          moment(j.modified_on, "M/D/YYYY H:mm").unix() :
          moment(j.created_on, "M/D/YYYY H:mm").unix(),
          end_date: moment(j.end_date, "M/D/YYYY H:mm").unix(),
          language: language
        };
        promotions.push(packet);
      });
      jsonObj.data.promotions = promotions;
 console.log('aaaaaaaa**********************',promotions);
  }

  callback(promotions);
};
