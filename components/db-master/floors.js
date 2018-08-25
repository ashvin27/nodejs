let dbObj = require('./connection'),
logger    = require(__base + 'components/logger').log(),
logFormat = require(__base + 'components/logger').format;

module.exports = {
  select: (what, where, callback) => {
    dbObj.select(what)
    .from('floors')
    .where(where)
    .orderByRaw('LENGTH( `name` ) , `name`')
    .then((rows) => {
      callback(null, rows);
    })
    .catch((err) => {
      logger.log(logFormat('error', err));
      console.log(err);
      callback(err, null);
    });
  }
};
