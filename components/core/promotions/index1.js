let config = require(__base + '/config'),
promotions = require(__base + 'components/db-master/promotions'),
moment     = require('moment');

module.exports = (params) => {
  return {
    list: (callback) => {
      getPromotionsToSend((err, data) => {
        if(data) {
          callback(null, data);
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
    }
  }
};

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

let composeJSON = (list, devices, callback) => {
  let outputArray = [];
  if(devices.length > 0 && list.length > 0) {
   var ip = [];
   for (var i = 0; i < devices.length; i++) {
       var ip =(devices[i].ip).split(',');
    }
    devices.forEach((i) => {
      let ipAdd = i.ip;
      let jsonObj = {
        key_number: i.room_number,
        comm_key: i.communication_token,
        data: [{
          device_category: i.device_category,
          device_id: i.in_room_device_id,
          ip_addresses: ip,
          port: i.update_port
        }]
      };

      let promotions = [];
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
              (i.feature_code).toLowerCase() + '/' +
              config.hotelProperties.hotelid + '/templates/' + k.template_path
              + '/generated/' + k.promo_path + '/' + k.lang_code + '.html'
            });
          }
        });

        let packet = {
          promo_id: j.promotion_id,
          thumb_img_path: pathPrefix + '/assets/uploads/' +
          (i.feature_code).toLowerCase() + '/' +
          config.hotelProperties.hotelid + '/assets/' + j.file_path,
          large_thumb_img_path: pathPrefix + '/assets/uploads/' +
          (i.feature_code).toLowerCase() + '/' +
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
      jsonObj.data[0].promotions = promotions;
      outputArray.push(jsonObj);
    });
  }
  callback(outputArray);
};
