let config    = require(__base + 'config'),
masterConfig  = require(__base + 'components/db-master/master-configs'),
rp            = require('request-promise'),
statusUpdater   = require(__base +
  'components/core/helper/status-updater')({}),
tableOperations   = require(__base +
    'components/db-master/table-operations')({}),
pushUpdate   = require(__base +
        'components/core/push-update')({}),
isJSON      = require('is-valid-json'),
isReachable = require('is-reachable'),
logger      = require(__base + 'components/logger').log(),
logFormat   = require(__base + 'components/logger').format;

module.exports = (params) => {
  return {
    proceedCSM: (data) => {
      console.log('================ proceedCSM data');
      masterConfig.getConfigValue('core', 'cloud_his_url', (err, row) => {
        console.log('================ proceedCSM' + row);
        if(row) {
          let cloudUrl = row.config_val;
          console.log('================ proceedCSM' + cloudUrl);
          isReachable(cloudUrl).then(reachable => {
            console.log('================ IS REACHABLE');
            let d = {
              state: 4,
              syncRequestsId: data.sync_requests_id,
              remoteSyncRequestId: data.relative_sync_requests_id,
              hotelId: data.hotel_id
            };
            console.log('================ PRINTING DATA PACKET TO UPDATE');
            console.log(d);
            statusUpdater.updateStatus(d, (err, response) => {
              console.log('================ REPONSE FROM UPDATE');
              if(err) {
                let d = {
                  state: 2,
                  syncRequestsId: data.sync_requests_id,
                  remoteSyncRequestId: data.relative_sync_requests_id,
                  hotelId: data.hotel_id
                };
                statusUpdater.updateStatus(d, (err, response) => {
                  //return true;
                });
              }
            });
          });
        }
      });
    },
    backupData: (data, callback) => {
      let d = {
        state: 7,
        syncRequestsId: data.sync_requests_id,
        remoteSyncRequestId: data.relative_sync_requests_id,
        hotelId: data.hotel_id
      };
      statusUpdater.updateStatus(d, (err, response) => {
        if(response) {
          console.log('STATUS = 7 UPDATED @ CLOUD AND INPREMISE :: CLOUD AND INPREMISE');
          tableOperations.tablesBackup(data, (err, tablesBackupRes) => {
            if(tablesBackupRes) {
              let d = {
                state: 8,
                syncRequestsId: data.sync_requests_id,
                remoteSyncRequestId: data.relative_sync_requests_id,
                hotelId: data.hotel_id
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
                state: 6,
                syncRequestsId: data.sync_requests_id,
                remoteSyncRequestId: data.relative_sync_requests_id,
                hotelId: data.hotel_id
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
        } else {
          let d = {
            state: 6,
            syncRequestsId: data.sync_requests_id,
            remoteSyncRequestId: data.relative_sync_requests_id,
            hotelId: data.hotel_id
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
    },
    truncateTables: (data, callback) => {
      let d = {
        state: 9,
        syncRequestsId: data.sync_requests_id,
        remoteSyncRequestId: data.relative_sync_requests_id,
        hotelId: data.hotel_id
      };
      statusUpdater.updateStatus(d, (err, response) => {
        if(response) {
          tableOperations.truncateTables(data, (err, truncateDataRes) => {
            console.log('RESPONSE FROM truncateTables :: CLOUD TO INPREMISE - HEAD START');
            console.log(truncateDataRes);
            console.log('RESPONSE FROM truncateTables :: CLOUD TO INPREMISE - HEAD END');
            if(truncateDataRes) {
              console.log('ENTED IN IF CONDITION truncateTables');
              let d = {
                state: 10,
                syncRequestsId: data.sync_requests_id,
                remoteSyncRequestId: data.relative_sync_requests_id,
                hotelId: data.hotel_id
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
                state: 8,
                syncRequestsId: data.sync_requests_id,
                remoteSyncRequestId: data.relative_sync_requests_id,
                hotelId: data.hotel_id
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
        } else {
          let d = {
            state: 8,
            syncRequestsId: data.sync_requests_id,
            remoteSyncRequestId: data.relative_sync_requests_id,
            hotelId: data.hotel_id
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
    },
    importTables: (data, callback) => {
      let d = {
        state: 11,
        syncRequestsId: data.sync_requests_id,
        remoteSyncRequestId: data.relative_sync_requests_id,
        hotelId: data.hotel_id
      };
      statusUpdater.updateStatus(d, (err, response) => {
        if(response) {
          tableOperations.importTables(data, (err, importDataRes) => {
            if(importDataRes) {
              let stateValue = 12;

              if(data.generate_sqlite==0 && data.generate_push==0) {
                stateValue = 16;
              } else if(data.generate_sqlite==0 && data.generate_push==1) {
                stateValue = 14;
              }
              console.log('REQUEST FROM importTables Fn');
              console.log('WRITING TO CLOUD and IN-PREMISE');
              let d = {
                state: stateValue,
                syncRequestsId: data.sync_requests_id,
                remoteSyncRequestId: data.relative_sync_requests_id,
                hotelId: data.hotel_id
              };

              statusUpdater.updateStatus(d, (err, response) => {
                if(response) {
                  return true;
                } else {
                  return false;
                }
              });
            }
          });
        } else {
          let d = {
            state: 8,
            syncRequestsId: data.sync_requests_id,
            remoteSyncRequestId: data.relative_sync_requests_id,
            hotelId: data.hotel_id
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
    },
    generateSQLITE: (data, callback) => {
      let d = {
        state: 13,
        syncRequestsId: data.sync_requests_id,
        remoteSyncRequestId: data.relative_sync_requests_id,
        hotelId: data.hotel_id
      };
      statusUpdater.updateStatus(d, (err, response) => {
        if(response) {
          masterConfig.getConfigValue('core', 'inpremise_his_url', (err, row) => {
            let generateSqliteUrl =
              config.inpremise.syncManager.url.generateSqlite;
              console.log(generateSqliteUrl);
              let options = {
                method: 'POST',
                uri: generateSqliteUrl,
                headers: {
                  'Content-Type': config.inpremise.headers.contentType,
                  'Access-Token': process.env.access_token
                },
                body: JSON.stringify({
                  files: data.module_name,
                  hotel_id: data.hotel_id
                }),
                rejectUnauthorized: config.server.rejectUnauthorized
              };

              rp(options)
                .then((getSqliteRes) => {
                  console.log(getSqliteRes);
                  if(isJSON(getSqliteRes)) {
                    console.log(getSqliteRes);
                    let parsedRes = JSON.parse(getSqliteRes);

                    if(parsedRes.status) {
                      let stateValue = 14;

                      if(data.generate_push==0) {
                        stateValue = 16;
                      }

                      let d = {
                        state: stateValue,
                        syncRequestsId: data.sync_requests_id,
                        remoteSyncRequestId: data.relative_sync_requests_id,
                        hotelId: data.hotel_id
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
                        state: 12,
                        syncRequestsId: data.sync_requests_id,
                        remoteSyncRequestId: data.relative_sync_requests_id,
                        hotelId: data.hotel_id
                      };

                      statusUpdater.updateStatus(d, (err, response) => {
                        if(response) {
                          // need to write logger functions
                        } else {
                          // need to write logger functions
                        }
                      });
                    }
                  } else {
                    console.log('not a valid JSON');
                  }
                })
                .catch((err) => {
                  console.log(err);
                  let d = {
                    state: 12,
                    syncRequestsId: data.sync_requests_id,
                    remoteSyncRequestId: data.relative_sync_requests_id,
                    hotelId: data.hotel_id
                  };
                  statusUpdater.updateStatus(d, (err, response) => {
                    if(response) {
                      // need to write logger functions
                    } else {
                      // need to write logger functions
                    }
                  });
                });
          });
        } else {
          // need to write logger functions
        }
      });
    }
  };
}
