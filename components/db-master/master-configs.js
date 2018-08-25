let dbObj = require('./connection'),
logger    = require(__base + 'components/logger').log(),
logFormat = require(__base + 'components/logger').format;

let msc = {
  tables: {
    dashboard: "dashboard_configs"
  },
  
  select: (module, what, where, callback) => {
    dbObj.select(what)
    .from(msc.tables[module])
    .where(where)
    .then((rows) => {
      callback(null, rows);
    })
    .catch((err) => {
      logger.log(logFormat('error', err));
      console.log(err);
      callback(err, null);
    });
  },
  
  getConfigValue: (mod, configKey, callback) => {
    dbObj.select()
    .from('master_configs')
    .where({
      'config_key': configKey,
      'module': mod
    })
    .then((rows) => {
      callback(null, rows[0]);
    })
    .catch((error) => {
      callback(error, null);
    });
  },

  patch: (module, what, where, callback) => {
    console.log(what);
    console.log(where);
    dbObj(msc.tables[module])
    .where(where)
    .update(what)
    .then((ack) => {
      callback(null, ack);
    })
    .catch((err) => {
      logger.log(logFormat('error', err));
      callback(err, null);
    });
  }

};

module.exports = msc
