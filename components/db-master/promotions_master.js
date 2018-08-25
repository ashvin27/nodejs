let dbObj = require('./connection'),
config = require(__base + '/config'),
moment = require('moment');
module.exports = {
  select: (callback) => {
    dbObj
    .select( 'promo_id' )
    .from('promotions_master')
    .where('is_deleted', 0)
    .where('is_active', 1)
    .where('is_sent', 0)
    .where('end_date', '>', moment().format('YYYY-MM-DD HH:mm:ss'))
    .where('start_date', '<=', moment().format('YYYY-MM-DD HH:mm:ss'))
    .then((data) => {
     callback(null, data);
    })
    .catch((err) => {
      console.log(err);
      callback(err, null);
    })
  },
  update: (what, where, callback) => { 
    dbObj('promotions_master')
    .where(where)
    .update(what)
    .then((ack) => {
      callback(null, true);
    })
    .catch((err) => {
      callback(err, null);
    });
  }
};
