let dbObj = require('../connection'),
  config = require(__base + 'config'),
  rp = require('request-promise'),
  logger = require(__base + 'components/logger').log(),
  logFormat = require(__base + 'components/logger').format;

let frontOffice = {
  get: (callback) => {
    dbObj.select(
        "floor_id",
        "floor_name",
        "floor_keys"
      )
      .from('v_frontoffice_dashboard')
      .orderByRaw('LENGTH(`floor_name`), `floor_name`')
      .then((res) => {
        callback(null, res);
      })
      .catch((err) => {
        logger.log(logFormat('error', err));
        callback(err, null);
      })
  }
};

module.exports = frontOffice;
