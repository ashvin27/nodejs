let dbObj = require('./connection');

module.exports = (options) => {
  return {
    get: (what, where, callback) => {
      dbObj.select(what)
      .from('push_update_schedules')
      .where(where)
      .then((res) => {
        //console.log(res);
        callback(null, res);
      })
      .catch((err) => {
        console.log(err);
        callback(err, null);
      })
    },
    getSchedules: (what, where, wherein, callback) => {
      dbObj.select(what)
      .from('push_update_schedules')
      .where(where)
      .whereIn('is_processed', wherein)
      .then((res) => {
        //console.log(res);
        callback(null, res);
      })
      .catch((err) => {
        console.log(err);
        callback(err, null);
      })
    },
    insert: (params, callback) => {
      dbObj('push_update_schedules')
      .insert(params)
      .then((res) => {
        callback(null, res);
      })
      .catch((err) => {
        console.log(err);
        callback(err, null);
      });
    },
    update: (what, where, callback) => {
      dbObj('push_update_schedules')
      .where(where)
      .update(what)
      .then((ack) => {
        callback(null, true);
      })
      .catch((err) => {
        callback(err, null);
      });
    }
  }
};

