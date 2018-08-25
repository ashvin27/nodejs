let dbObj = require('../connection');

module.exports = {
  select: (what, where, callback) => {
    dbObj.select(what)
    .from('hotel_language')
    .where(where)
    .then((rows) => {
      callback(null, rows);
    })
    .catch((err) => {
      console.log(err);
      callback(err, null);
    });
  }
};
