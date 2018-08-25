let dbObj = require('../connection'),
logger    = require(__base + 'components/logger').log(),
logFormat = require(__base + 'components/logger').format;

let dashboardAlerts = {
  alertEvents: ["unoccupied", "checkout"],
  get: (callback) => {
    dbObj.select([
      "dashboard_alert_id",
      "key_id",
      "alert_event",
      "alert_emails",
      "alert_mobile_numbers"
    ])
    .from('dashboard_alerts')
    .where({
      "is_sent": 0,
      "is_active": 1,
      "is_deleted": 0
    })
    .then((rows) => {
      callback(null, rows);
    })
    .catch((err) => {
      logger.log(logFormat('error', err));
      console.log(err);
      callback(err, null);
    });
  },
  select: (what, where, callback) => {
    dbObj.select(what)
    .from('dashboard_alerts')
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
  setAlert: (data, callback) => {
    let alertEvents = data.alert_event;
    dashboardAlerts.delete({
      key_id: data.key_id,
      is_sent: 0,
      is_active: 1,
      is_deleted: 0
    }, (err, res) => {
      if(err){
        callback(err, null);
      }else{
        let insertData = [];
        alertEvents.forEach((event) => {
          insertData.push({
            key_id: data.key_id,
            alert_event: event,
            alert_emails: data.alert_emails,
            created_by: 1
          });
        });
        if(insertData.length > 0){
          dashboardAlerts.insert(insertData, (err, res) => {
            if(res){
              callback(null, res);
            }else{
              callback(err, null);
            }
          });
        }else{
          callback(null, true);
        }
      }
    });
  },
  insert: (data, callback) => {
    dbObj('dashboard_alerts')
    .insert(data)
    .then((res) => {
      callback(null, res);
    })
    .catch((err) => {
      logger.log(logFormat('error', err));
      console.log(err);
      callback(err, null);
    });
  },
  delete: (where, callback) => {
    dbObj('dashboard_alerts')
    .where(where)
    .del()
    .then((res) => {
      callback(null, res);
    })
    .catch((err) => {
      logger.log(logFormat('error', err));
      console.log(err);
      callback(err, null);
    });
  }
}
module.exports = dashboardAlerts;
