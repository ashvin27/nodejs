let config    = require(__base + '/config'),
dbObj = require(__base + 'components/db-master/connection'),
pushUpdateSchedule = require(__base +
  'components/db-master/push-update-schedules')({}),
pushUpdate   = require(__base +
        'components/core/push-update')({}),
moment = require('moment');

let pusrMonitor = setInterval(() => {
  insertScheduledRecords((purErr, purRes) => {});
}, config.inpremise.pushupdate.monitoringTime);

let insertScheduledRecords = (callback) => {
  let what = ['schedule_id', 'feature_ids', 'feature_versions', 'applied_filters', 'extra_data', 'checkin_filter', 'schedule_for', 'schedule_for_date', 'update_type', 'is_processed', 'device_list', 'from_sync', 'hotel_id', 'created_by'];
  let where = {
    is_active: 1,
    is_deleted: 0
  };
  let wherein = [0,2];
  
  pushUpdateSchedule.getSchedules(what, where, wherein, (puSErr, pusSRes) => {
    if (pusSRes) {
      pusSRes.map((openSchedule) => {
        if ((openSchedule.is_processed == 0) && (openSchedule.device_list == null)) {
          dbObj.select(['sync_requests_id', 'state']).from('sync_requests').where({push_update_schedule_id: openSchedule.schedule_id})
          .then((srRows) => {
            let isProcessable = false;
            if (srRows.length > 0) {
              if (srRows[0].state >= 14)
                  isProcessable = true;
            } else if (openSchedule.from_sync == 0)
              isProcessable = true;

            if (isProcessable) {
              if (openSchedule.schedule_for == 0) {
                if (moment(openSchedule.schedule_for_date).subtract(10, 'minutes').format('YYYY-MM-DD HH:mm:ss') <= moment().format('YYYY-MM-DD HH:mm:ss'))
                  pushUpdate.publish(openSchedule, (pubErr, pubRes) => {});
              } else
                  pushUpdate.publish(openSchedule, (pubErr, pubRes) => {});
            }
          })
          .catch((error) => {
            callback(error, null);
          });
        } else if ((openSchedule.is_processed == 2) && (openSchedule.device_list.length > 0)) {          
          if (openSchedule.schedule_for == 0) {
            if (moment(openSchedule.schedule_for_date).subtract(10, 'minutes').format('YYYY-MM-DD HH:mm:ss') <= moment().format('YYYY-MM-DD HH:mm:ss'))
              pushUpdate.createRecords(openSchedule, (pubErr, pubRes) => {});
          } else
              pushUpdate.createRecords(openSchedule, (pubErr, pubRes) => {});
        }
      });
    }          
  });
};