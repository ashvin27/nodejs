let config    = require(__base + '/config'),
syncRequests  = require(__base + '/components/db-master/sync-requests'),
masterConfig  = require(__base + '/components/db-master/master-configs'),
pushUpdateSchedule = require(__base +
  'components/db-master/push-update-schedules')({}),
syncManager   = require(__base + '/components/core/sync-manager')({}),
logger              = require(__base + 'components/logger').log(),
logFormat           = require(__base + 'components/logger').format,
statusUpdater   = require(__base +
  '/components/core/helper/status-updater')({});

let nmMonitorFor2 = setInterval(() => {
  syncRequests.getRequestsByState(2, (err, rows) => {
    if(rows && rows.constructor === Array && rows.length > 0) {
      proceedISM(rows);
    }
  });
}, config.inpremise.notificationManager.monitoringTime2);

let nmMonitorFor6 = setInterval(() => {
  syncRequests.getRequestsByState(6, (err, rows) => {
    if(rows && rows.constructor === Array && rows.length > 0) {
      ISMBackupTables(rows);
    }
  });
}, config.inpremise.notificationManager.monitoringTime6);

let nmMonitorFor8 = setInterval(() => {
  syncRequests.getRequestsByState(8, (err, rows) => {
    if(rows.constructor === Array && rows.length > 0) {
      ISMTruncateTables(rows);
    }
  });
}, config.inpremise.notificationManager.monitoringTime8);

let nmMonitorFor10 = setInterval(() => {
  syncRequests.getRequestsByState(10, (err, rows) => {
    if(rows.constructor === Array && rows.length > 0) {
      ISMImportTables(rows);
    }
  });
}, config.inpremise.notificationManager.monitoringTime10);

let nmMonitorFor12 = setInterval(() => {
  syncRequests.getRequestsByState(12, (err, rows) => {
    if(rows.constructor === Array && rows.length > 0) {
      ISMGenerateSqlite(rows);
    }
  });
}, config.inpremise.notificationManager.monitoringTime12);

let nmMonitorFor14 = setInterval(() => {
  syncRequests.getRequestsByState(14, (err, openSyncReqs) => {
    if(openSyncReqs.constructor === Array && openSyncReqs.length > 0) {
      ISMSchedulePushUpdate(openSyncReqs);
    }
  });
}, config.inpremise.notificationManager.monitoringTime14);

let proceedISM = (rows) => {
  rows.forEach((item) => {
    if(item.sync_tables==0 &&
      item.generate_sqlite==0 &&
      item.generate_push==0) {
        let d = {
          state: 16,
          syncRequestsId: item.sync_requests_id,
          remoteSyncRequestId: item.relative_sync_requests_id,
          hotelId: item.hotel_id
        };

        statusUpdater.updateStatus(d, (err, response) => {
          if(response) {
            // need to write logger functions
          } else {
            // need to write logger functions
          }
        });
    } else {
      if(item.sync_tables==1) {
        if((item.request_type).toLowerCase()=='sync') {
          syncManager.proceedCSM(item);
        } else if((item.request_type).toLowerCase()=='import') {}
      } else if(item.sync_tables==0) {
        if(item.generate_sqlite==1) {
          let d = {
            state: 12,
            syncRequestsId: item.sync_requests_id,
            remoteSyncRequestId: item.relative_sync_requests_id,
            hotelId: item.hotel_id
          };

          statusUpdater.updateStatus(d, (err, response) => {
            if(response) {
              // need to write logger functions
            } else {
              // need to write logger functions
            }
          });
        } else if(item.generate_sqlite==0) {
          if(item.generate_push==1) {
            let d = {
              state: 14,
              syncRequestsId: item.sync_requests_id,
              remoteSyncRequestId: item.relative_sync_requests_id,
              hotelId: item.hotel_id
            };

            statusUpdater.updateStatus(d, (err, response) => {
              if(response) {
                // need to write logger functions
              } else {
                // need to write logger functions
              }
            });
          } else {
            let d = {
              state: 16,
              syncRequestsId: item.sync_requests_id,
              remoteSyncRequestId: item.relative_sync_requests_id,
              hotelId: item.hotel_id
            };

            statusUpdater.updateStatus(d, (err, response) => {
              if(response) {
                // need to write logger functions
              } else {
                // need to write logger functions
              }
            });
          }
        }
      }
    }
  });
};

let ISMBackupTables = (data) => {
  data.forEach((item) => {
    if((item.request_type).toLowerCase()=='sync') {
      syncManager.backupData(item, (backupDataErr, backupDataRes) => {
        // need to write logger functions
      });
    } else if((item.request_type).toLowerCase()=='import') {}
  });
};

let ISMTruncateTables = (data) => {
  data.forEach((item) => {
    if((item.request_type).toLowerCase()=='sync') {
      syncManager.truncateTables(item, (truncateDataErr,
        truncateDataRes) => {
        // need to write logger functions
      });
    } else if((item.request_type).toLowerCase()=='import') {}
  });
};

let ISMImportTables = (data) => {
  data.forEach((item) => {

    if((item.request_type).toLowerCase()=='sync') {
      syncManager.importTables(item, (importDataErr, importDataRes) => {
        // need to write logger functions
      });
    } else if((item.request_type).toLowerCase()=='import') {}

  });
};

let ISMGenerateSqlite = (data) => {
  data.forEach((item) => {
    if(item.generate_sqlite==1) {
      if((item.request_type).toLowerCase()=='sync') {
        syncManager.generateSQLITE(item, (gsErr, gsRes) => {
          // need to write logger functions
        });
      } else if((item.request_type).toLowerCase()=='import') {}
    }
  });
};

let ISMSchedulePushUpdate = (openSyncReqs) => {
  let what = ['schedule_id', 'feature_ids', 'feature_versions', 'applied_filters', 'checkin_filter', 'schedule_for', 'schedule_for_date', 'update_type', 'is_processed', 'hotel_id', 'created_by'];
  openSyncReqs.forEach((syncReqInfo) => {
    if(syncReqInfo.generate_push == 1) {
      if((syncReqInfo.request_type).toLowerCase() == 'sync') {
        let where = {
          schedule_id: syncReqInfo.push_update_schedule_id,
          is_active: 1,
          is_deleted: 0
        };
        pushUpdateSchedule.get(what, where, (puSErr, pusSRes) => {
          if (pusSRes[0]) {
            let d = {
              state: 16,
	      syncRequestsId: syncReqInfo.sync_requests_id,
	      remoteSyncRequestId: syncReqInfo.relative_sync_requests_id,
              hotelId: syncReqInfo.hotel_id
            };

            statusUpdater.updateStatus(d, (err, response) => {
              if(response) {
                // need to write logger functions
              } else {
                // need to write logger functions
              }
            });
          }
        });
      } else if((syncReqInfo.request_type).toLowerCase() == 'import') {}
    }
  });
};
