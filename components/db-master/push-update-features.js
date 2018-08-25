let dbObj = require('./connection'),
config    = require(__base + '/config');

module.exports = {
  get: (what, where, callback) => {
    dbObj.select(what)
    .from('push_update_features')
    .where(where)
    .then((res) => {
      console.log(res);
      callback(null, res);
    })
    .catch((err) => {
      console.log(err);
      callback(err, null);
    })
  },
  select: (what, conditions, callback) => {
    let query = dbObj.select(what)
    .from('push_update_features');

    if(conditions && conditions.where)
      query.where(conditions.where);

    if(conditions && conditions.whereIn)
      query.whereIn(conditions.whereIn.col, conditions.whereIn.vals.split(','));
    
    query.orderBy('feature_id', 'asc');

    query.then((data) => {
      callback(null, data);
    })
    .catch((err) => {
      console.log(err);
      callback(err, null);
    })
  }
};
