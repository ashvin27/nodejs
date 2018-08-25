let mysqldump = require(__base + 'components/core/helper/mysqldump'),
dbObj = require(__base + 'components/db-master/connection'),
config        = require(__base + 'config'),
fs            = require('fs'),
statusUpdater = require(__base +
  'components/core/helper/status-updater')({}),
importer      = require('node-mysql-importer'),
cmd           =  require('node-cmd'),
fx            = require('mkdir-recursive');

let connectionObj = {
    host: config.sql.host,
    user: config.sql.user,
    password: config.sql.password,
    database: config.sql.database,
    connectionLimit: 10
};

module.exports = (params) => {
  return {
    tablesBackup: (params, callback) => {
      console.log('Fn tablesBackup start :: CLOUD AND INPREMISE');
      let syncRequests = params;
      if('module_tables' in syncRequests) {
        let directoryToStore =  __base + config.sql.backup.path +
        syncRequests.sync_requests_id;

        console.log('directoryToStore :: CLOUD AND INPREMISE = ' + directoryToStore);
        if (!fs.existsSync(directoryToStore)){
          fx.mkdir(directoryToStore, function(err) {
            processMysqlDUMP(connectionObj, syncRequests, (e, r) => {
              callback(e, r);
            });
          });
        } else {
            processMysqlDUMP(connectionObj, syncRequests, (e, r) => {
              callback(e, r);
            });
        }
      }
    },
    truncateTables: (params, callback) => {
      let syncRequests = params;
      let moduleTables = JSON.parse(syncRequests.module_tables);

      let directoryToStore = config.sql.truncate.path +
      syncRequests.sync_requests_id;

      if (!fs.existsSync(directoryToStore)){
        fx.mkdir(directoryToStore, function(err) {
          processTruncateTables(syncRequests, moduleTables, (e, r) => {
            callback(e, r);
          });
        });
      } else {
          processTruncateTables(syncRequests, moduleTables, (e, r) => {
            callback(e, r);
          });
      }
    },
    importTables: (params, callback) => {
      try {
        let syncRequests = params;
        let sqlToImport =  config.sql.dump.path +
        syncRequests.module_name + '/' +
        syncRequests.hotel_id + '/' +
        syncRequests.module_name +
        '.sql';

        let rebuild_file = sqlToImport;

        runSqlScript(rebuild_file, function(pr) {
            if(!pr) {
              callback('Error occured while importing sql file', false);
            } else {
              pr.kill('SIGINT');
              callback(null, true);  
            }
        });
      } catch(err) {
        callback(err.message, false);
      }
    }
  }
};

let setDBVariables = (statement, callback) => {
  dbObj.raw(statement)
  .then((setVarRes) => {
    if(setVarRes) {
      callback(null, true);
    }
  })
  .catch((err) => {
    callback(err, false);
  });
};

let truncateTableRecursion = (moduleTables, callback) => {
  let tableArray = moduleTables;
  let arrayLength = tableArray.length;
  let tableName = tableArray[arrayLength-1];

  if(typeof tableName!== 'undefined') {
    setDBVariables('SET FOREIGN_KEY_CHECKS = 0',
    (setVarErr, setVarRes) => {
      console.log('setVarRes = ' + setVarRes);
      if(setVarRes) {
        dbObj(tableName).truncate()
        .then((truncateRes) => {
          if(truncateRes) {
            tableArray.splice(-1, 1);
            truncateTableRecursion(tableArray, callback);
          }
        })
        .catch((err) => {
          console.log(err);
          callback(err, false);
        });
      }
    });
  } else {
    console.log('truncating tables stoppped');
    callback(false, true);
  }
};

let runSqlScript = function(file, callback) {
    let exec        = require('child_process').exec;
    let rebuild_db  = config.sql.mysqlBinary +
    ' --force ' +
    ' -u ' + connectionObj.user +
    ' -h ' + connectionObj.host +
    ' -p' + connectionObj.password +
    ' ' + connectionObj.database + ' < ' +
    file;
    let child = '';
    console.log('executing runSqlScript');
    console.log(rebuild_db);
    child = exec(rebuild_db, function(error, stdout, stderr) {
        if (error !== null) {
            console.log('Rebuild Error: ' + error);
            console.log('stdout: ' + stdout);
            console.log('stderr: ' + stderr);
            process.exit(1);
            callback(false);
            return;
        }
        console.log('Successfully Rebuild Database using: ');
        console.log('   ' + file);
        callback(child);
    });
};

let processMysqlDUMP = (connectionObj, syncRequests, dumpCallback) => {
  console.log('Fn processMysqlDUMP start :: CLOUD AND INPREMISE');
  connectionObj.tables      = JSON.parse(syncRequests.module_tables);
  connectionObj.where       = {};
  connectionObj.ifNotExist  = {};
  connectionObj.dest        = config.sql.backup.path +
  syncRequests.sync_requests_id + '/' +
  syncRequests.module_name +
  '.sql';

  console.log('DESTINATION :: CLOUD AND INPREMISE = ' + connectionObj.dest);
  console.log('DIRECTORY :: CLOUD AND INPREMISE = ' + config.sql.backup.path + syncRequests.sync_requests_id);
  if (!fs.existsSync(config.sql.backup.path + syncRequests.sync_requests_id)){
    fx.mkdir(config.sql.backup.path + syncRequests.sync_requests_id, function(err) {
      runMysqlDUMP((e, r) => {
        dumpCallback(e, r);
      });
    });
  } else {
      runMysqlDUMP((e, r) => {
        dumpCallback(e, r);
      });
  }
};

let processTruncateTables = (syncRequests, moduleTables, dumpCallback) => {
  let fileToWrite = config.sql.truncate.path + 
  syncRequests.sync_requests_id + '/' + 
  syncRequests.module_name + 
  '.sql';

  if (!fs.existsSync(config.sql.truncate.path + syncRequests.sync_requests_id)){
    fx.mkdir(config.sql.truncate.path + syncRequests.sync_requests_id, function(err) {
      writeTruncateStream(fileToWrite, moduleTables, (e, r) => {
        dumpCallback(e, r);
      });
    });
  } else {
    writeTruncateStream(fileToWrite, moduleTables, (e, r) => {
      dumpCallback(e, r);
    });
  }
};

let writeTruncateStream = (fileToWrite, moduleTables, truncateCallback) => {
  let writeStream = 'SET FOREIGN_KEY_CHECKS = 0;\n';
  moduleTables.forEach((table) => {
    writeStream += 'TRUNCATE table `' + table + '`;\n';
  });
  writeStream += 'SET FOREIGN_KEY_CHECKS = 1;\n';

  fs.writeFile(fileToWrite, writeStream, (err) => {
    let rebuild_file = fileToWrite;

    runSqlScript(rebuild_file, function(pr) {
        if(!pr) {
          truncateCallback('Error occured while importing sql file', false);
        } else {
          pr.kill('SIGINT');
          console.log('---- writeTruncateStream ----');
          truncateCallback(null, true);
        }
    });
  });
};

let runMysqlDUMP = (mysqlCallback) => {
  console.log('Fn runMysqlDUMP start :: CLOUD AND INPREMISE');
  mysqldump(connectionObj, (err) => {
    if(!err) {
      mysqlCallback(null, true);
    } else {
      console.log('ERROR @ runMysqlDUMP :: CLOUD AND INPREMISE - ERROR HEAD START');
      console.log(err.message);      
      console.log('ERROR @ runMysqlDUMP :: CLOUD AND INPREMISE - ERROR HEAD END');
      mysqlCallback(err, false);
    }
  });
};
