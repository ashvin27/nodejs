let dbObj = require('../connection'),
config    = require(__base + '/config');

module.exports = {
  patch: (data, callback) => {
    dbObj('cmc_message_delivery_mapping')
    .where({
      'delivery_map_id': data.where
    })
    .update(data.what)
    .then((d) => {
      if(d) {
        callback(null, d);
      } else {
        callback(1, null);
      }
    })
    .catch((e) => {
      callback(e, null);
    });
  },
};
