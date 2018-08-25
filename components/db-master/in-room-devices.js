let dbObj = require('./connection');

module.exports = {
  select: (what, conditions, callback) => {
    let query = dbObj.select(what)
    .from('v_push_update_devices');
  
    if(conditions) {
      if("where" in conditions) {
        query.where(conditions.where)
      }
      if("where_in" in conditions) {
        query.whereIn(
          conditions.where_in.key,
          conditions.where_in.value
        );
      }
      if("where_in2" in conditions) {
        query.whereIn(
          conditions.where_in2.key,
          conditions.where_in2.value
        );
      }
      if("where_raw" in conditions)
        query.whereRaw(conditions.where_raw);
    }
    query.then((rows) => {
      callback(null, rows);
    })
    .catch((err) => {
      console.log(err);
      callback(err, null);
    });
  }
};
