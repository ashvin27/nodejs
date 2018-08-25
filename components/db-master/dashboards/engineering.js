let dbObj = require('../connection'),
  config = require(__base + 'config'),
  rp = require('request-promise'),
  logger = require(__base + 'components/logger').log(),
  logFormat = require(__base + 'components/logger').format;

let engineering = {
  get: (callback) => {
    dbObj.select(
        "key_id",
        "number",
        "guest_first_name",
        "guest_last_name",
        "guest_name",
        "checkin_time",
        "checkout_time",
        "dnd",
        "mmr",
        "keytag",
        "rented",
        "key_category_id",
        "key_category_name",
        "floor_id",
        "floor_name",
        "ac_detail"
      )
      .from('v_engineering_dashboard')
      //.orderByRaw('cast(floor_name as unsigned) asc')
      .orderByRaw('LENGTH( `floor_name` ), `floor_name`')
      .orderByRaw('LENGTH( `number` ), `number`')
      //.orderByRaw('cast(number as unsigned) asc')
      .then((res) => {
        callback(null, res);
      })
      .catch((err) => {
        console.log(err);
        logger.log(logFormat('error', err));
        callback(err, null);
      })
  },
  operateAc: (operation, data, callback) => {
    console.log("operationData:", data);
    let keys = {};
    for (let i in data.keys) {
      let sKey = data.keys[i];
      if (typeof keys[sKey.key_id] == "undefined") {
        keys[sKey.key_id] = {
          "keyId": sKey.key_id,
          "acIds": []
        }
      }
      keys[sKey.key_id]["acIds"].push(sKey.ac_id);
    }
    let keysAry = [];
    for (var key in keys) {
      if (keys.hasOwnProperty(key)) {
        keysAry.push(keys[key]);
      }
    }
    console.log("config.url.dashboard", config.url.dashboard);
    switch (operation) {
      case "operateAc":
        let options = {
          method: 'POST',
          url: config.url.dashboard.operateAc,
          headers: {
            'content-type': config.cloud.headers.contentType,
            'access-token': process.env.access_token
          },
          body: JSON.stringify({
            "details": [{
              "data": [{
                "temperature": data.temperature,
                "temperatureUnit": data.temperature_unit,
                "operation": "setTemperature",
                "keys": keysAry
              }]
            }],
            "operation": "operateAc",
            "feature": "ac"
          })
        };
        rp(options)
          .then(function(parsedBody) {
            let responseData = JSON.parse(parsedBody);
            console.log("parsedBody:", responseData);
            logger.log(logFormat('info', responseData));
            callback(null, responseData.message);
          })
          .catch(function(err) {
            console.log("operateAc Error:", err);
            logger.log(logFormat('error', err));
            callback(err, null);
          });
        break;
      default:
        let logData = {
          message: 'Invalid ac operation',
          operation: operation,
          data: data
        };
        console.log("operateAc Error:", logData);
        logger.log(logFormat('error', logData));
        callback(true, null);
    }
  },
  setTemperature: (data, callback) => {
    console.log("setTemperature", data);
    if (typeof data == "object") {
      let operationData = {
        temperature: data.temperature,
        temperature_unit: data.temperature_unit,
        keys: []
      };
      switch (data.temp_event) {
        case "all":
          dbObj.select("key_id", "ac_id")
            .from('ac_status')
            .then((res) => {
              operationData.keys = res;
              engineering.operateAc("operateAc", operationData,
                (err, res) => {
                  callback(err, res);
                });
            })
            .catch((err) => {
              console.log("setTemperature ALL", err);
              logger.log(logFormat('error', err));
              callback(err, null);
            })
          break;
        case "unrented":
          dbObj.select(dbObj.raw('t1.key_id'), "ac_id")
            .from(dbObj.raw('ac_status t1'))
            .innerJoin(dbObj.raw('key_status t2 ON(t1.key_id = t2.key_id)'))
            .where('rented', 0)
            .then((res) => {
              operationData.keys = res;
              engineering.operateAc("operateAc", operationData,
                (err, res) => {
                  callback(err, res);
                });
            })
            .catch((err) => {
              console.log("setTemperature unrented", err);
              logger.log(logFormat('error', err));
              callback(err, null);
            })
          break;
        case "floor":
          dbObj.select(dbObj.raw('t1.key_id'), "ac_id")
            .from(dbObj.raw('ac_status t1'))
            .innerJoin(dbObj.raw('`keys` t2 ON(t1.key_id = t2.key_id)'))
            .whereIn('floor_id', data.floors)
            .then((res) => {
              operationData.keys = res;
              engineering.operateAc("operateAc", operationData,
                (err, res) => {
                  callback(err, res);
                });
            })
            .catch((err) => {
              console.log("setTemperature floor", err);
              logger.log(logFormat('error', err));
              callback(err, null);
            })
          break;
        case "room":
          dbObj.select("key_id", "ac_id")
            .from('ac_status')
            .whereIn('key_id', data.rooms)
            .then((res) => {
              console.log('All ACs of selected keys:', JSON.stringify(res))
              operationData.keys = res;
              engineering.operateAc("operateAc", operationData,
                (err, res) => {
                  callback(err, res);
                });
            })
            .catch((err) => {
              console.log("setTemperature room", err);
              logger.log(logFormat('error', err));
              callback(err, null);
            })
          break;
        default:
          logger.log(logFormat('error', {
            message: 'Invalid input data, invalid temperature event',
            data: data
          }));
          callback(true, null);
      }
    } else {
      logger.log(logFormat('error', {
        message: 'Invalid input data',
        data: data
      }));
      callback(true, null);
    }
  }
};

module.exports = engineering;
