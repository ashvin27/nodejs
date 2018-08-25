/*******************************************************************************************************************
*
*                   Author: Paras Sahu
*                   Module: Message handler for DigiValet Content Management
*                   Email: paras.sahu@digivalet.com
*
********************************************************************************************************************/

let http                = require('http'),
    express             = require('express'),
    app                 = express(),
    server              = http.createServer(app),
    io                  = require('socket.io').listen(server),
    fs                  = require('fs'),
    mysql               = require('mysql'),
    bodyParser          = require('body-parser'),
    url                 = require('url'),
    config              = require('../../config'),
    request             = require('request'),
    crypto              = require('crypto'),
    md5                 = require('md5'),
    path                = require('path'),
    serverKey           = '',
    httpPort            = config.server.port,
    validator           = require('validator'),
    cron                = require('node-cron'),
    oneAuth             = require('../oneAuth')({config: config}),
    pN                  = require('./push-notifications')({config: config}),
    winston             = require('winston'),
    logPath             = path.join(__dirname, config.server.logs.path.accesslog),
    logger              = require('./logger')({winston: winston, logPath: logPath}),
    algorithm           = config.keys.aes.algorithm,
    winstonViewer       = require('winston-viewer'),
    key                 = config.keys.aes.key,
    connectionsArray    = [],
    moment              = require("moment"),
    btoa                = require('btoa'),
    net                 = require('net'),
    connection          = mysql.createConnection({
        host        : config.sql.host,
        user        : config.sql.user,
        password    : config.sql.password,
        database    : config.sql.database,
        port        : config.sql.port,
        multipleStatements: config.sql.multipleStatements
    }),
    butlerRequestMapId = 0,
    butler_records_string = 10;
    connection.connect(function(err) {
      if(err!='null'){}
    });

var butlerApp = {};

app.set('view engine', 'ejs');

app.use( bodyParser.json() );       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
}));

app.disable('x-powered-by');

app.post('/', function(req, res) {
    logger.log({
      level: 'debug',
      message: 'Butler App Server'
    });
    logger.info('printing info');
    res.write("Butler App Server");
    res.end();
});

app.post('/authenticate', function(req, res) {
  if("client_id" in req.body && "client_secret" in req.body) {
    oneAuth.token.getToken(req.body, function(eo, ro){
      if(ro) {
        getAuthenticate(req.body, res, function(err, a){
            if(err) {
                sendError(res, err);
            }
            else if(a.length > 0) {
                var resToSend = {};
                setUserLogin(a[0], req, res, function(err, sul){
                    if(sul) {
                        butlerApp.getButlerFullInfo((a[0]).butler_app_users_id,
                        req, function(err, r){
                            if(r) {
                                console.log(r);
                                butlerApp.getAlertsInfo(function(err, ai){
                                    if(ai) {
                                        r.alertInfo = ai;
                                        resToSend = {
                                            "status": true,
                                            "resText": "Successfully Authenticated",
                                            "access_token": ro.access_token,
                                            "refresh_token": '',
                                            "expires": ro.expires,
                                            "resData": r
                                        };
                                        res.write(JSON.stringify(resToSend),
                                        function(err){
                                            res.end();
                                        });
                                    }
                                });
                            }
                            else {
                                resToSend = {
                                    "status": false,
                                    "resText": err,
                                    "resData": {}
                                };
                                res.write(JSON.stringify(resToSend),
                                function(err){
                                    res.end();
                                });
                            }
                        });
                    }
                });
            }
            else {
                sendError(res, "Invalid Username/Password");
            }
        });
      }
      else {
        res.send(ro);
      }
    });
  } else {
    console.log('Bad request. No token found.');
    sendError(res, 'Bad request. No token found.');
  }
});

app.post('/rt', function(req, res) {
    var did     = req.body.device_id;
    var buid    = req.body.butler_app_users_id;
    var dt      = req.body.device_token;

    if(typeof did!=='undefined' && typeof buid!=='undefined' && typeof dt!=='undefined') {
        butlerApp.refreshToken(did, dt, res, function(err, r){

            if(err){ sendError(req, err); }
            else
            {
                var resToSend = {
                    "status": true,
                    "resText": "Token refreshed."
                };
                res.write(JSON.stringify(resToSend), function(err){
                    res.end();
                });
            }
        });
    }
});

app.post('/l', function(req, res) {
    var did = req.body.device_id;
    var buid = req.body.butler_app_users_id;
    console.log(did);
    console.log(buid);
    if(typeof did!=='undefined' && typeof buid!=='undefined')
    {
        butlerApp.logout(did, buid, res, function(err, r){
            console.log(err);
            if(err){ sendError(res, err); }
            else
            {
                var resToSend = {
                    "status": true,
                    "resText": "Successfully logged out."
                };
                console.log(resToSend);
                res.write(JSON.stringify(resToSend), function(err){
                    res.end();
                });
            }
        });
    }
});

app.post('/rp', function(req, res) {
    var buid = req.body.butler_app_users_id;
    var op = req.body.old_password;
    var np = req.body.new_password;
    var cp = req.body.confirm_new_password;
    if(
      typeof buid!=='undefined' &&
      typeof op!=='undefined' &&
      typeof np!=='undefined' &&
      typeof cp!=='undefined')
    {
        butlerApp._changePassword(res, buid, op, np, cp, function(err, r){
            if(err){ sendError(res, err); }
            else
            {
                var resToSend = {
                    "status": true,
                    "resText": r
                };
                res.write(JSON.stringify(resToSend), function(err){
                    res.end();
                });
            }
        });
    }
    else
    {
        sendError(res, 'Invalid Parameters for reset password.');
    }
});

app.post('/actionafterreset', function(req, res) {

    var buid    = req.body.butler_app_users_id;
    if(typeof buid!=='undefined')
    {
        butlerApp._logoutDevices(buid, function(err, r){
            var resToSend = {
                "status": true,
                "resText": 'Logout Processed'
            };
            res.write(JSON.stringify(resToSend), function(err){
                res.end();
            });
            butlerApp._sendPN('logout_devices', r);
        });
    }
    else
    {
        sendError(res, 'Invalid Parameters for reset password.');
    }
});

app.post('/receive-pn', function(req, res) {

    var deviceid    = req.body.device_id;
    var isenable    = req.body.is_enable;

    if(typeof deviceid!=='undefined' && typeof isenable!=='undefined')
    {
        butlerApp._receivepn(deviceid, isenable, function(err, r){
            if(r)
            {
                var resToSend = {
                    "status": true,
                    "resText": 'Push Notifications request updated.'
                };
                res.write(JSON.stringify(resToSend), function(err){
                    res.end();
                });
            }
        });
    }
    else
    {
        sendError(res, 'Invalid Parameters for reset password.');
    }
});

app.post('/ir', function(req, res) {

    if(typeof req.body.limit!=='undefined')
    {
        var butlerNameF = req.body.searchByButlerName;
        var roomNumberF = req.body.searchByRoomNo;
        var shiftF      = req.body.shiftFilter;
        var alertF      = req.body.alertFilter;

        if(butlerNameF!='')
        {
            butlerNameF = JSON.stringify(butlerNameF);
        }
        if(roomNumberF!='')
        {
            roomNumberF = JSON.stringify(roomNumberF);
        }
        if(shiftF!='')
        {
            shiftF = JSON.stringify(shiftF);
        }
        if(alertF!='')
        {
            alertF = JSON.stringify(alertF);
        }
        var data = {
            limit: req.body.limit,
            filter: {
              'alert': alertF,
              'shift': shiftF,
              'searchByDateFrom': req.body.searchByDateFrom,
              'searchByDateTo': req.body.searchByDateTo,
              'searchByButlerName': butlerNameF,
              'searchByRoomNo': roomNumberF
            },
            noRecent: 1
        };

        incomingRequestProcess(data, function(err, d){
            if(typeof JSON.stringify(d))
            {
                res.write(JSON.stringify(d));
            }
            res.end();
        });
    }
    else
    {
        sendError(res, 'No limit value found in request.');
    }
});

app.post('/cr', function(req, res) {
    if(typeof req.body.limit!=='undefined')
    {
        var butlerNameF = req.body.searchByButlerName;
        var roomNumberF = req.body.searchByRoomNo;
        var shiftF      = req.body.shiftFilter;
        var alertF      = req.body.alertFilter;

        if(butlerNameF!='')
        {
            butlerNameF = JSON.stringify(butlerNameF);
        }
        if(roomNumberF!='')
        {
            roomNumberF = JSON.stringify(roomNumberF);
        }
        if(shiftF!='')
        {
            shiftF = JSON.stringify(shiftF);
        }
        if(alertF!='')
        {
            alertF = JSON.stringify(alertF);
        }

        var data = {
            limit: req.body.limit,
            filter: {
              'alert': alertF,
              'shift': shiftF,
              'searchByDateFrom': req.body.searchByDateFrom,
              'searchByDateTo': req.body.searchByDateTo,
              'searchByButlerName': butlerNameF,
              'searchByRoomNo': roomNumberF
            },
            noRecent: 1
        };
        completedRequestProcess(data, function(err, d){

            res.write(JSON.stringify(d));
            res.end();
        });
    }
    else
    {
        sendError(res, 'No limit value found in request.');
    }
});

app.post('/rh', function(req, res) {
    if(typeof req.body.limit!=='undefined')
    {
        var butlerNameF = req.body.searchByButlerName;
        var roomNumberF = req.body.searchByRoomNo;
        var shiftF      = req.body.shiftFilter;
        var alertF      = req.body.alertFilter;

        if(butlerNameF!='')
        {
            butlerNameF = JSON.stringify(butlerNameF);
        }
        if(roomNumberF!='')
        {
            roomNumberF = JSON.stringify(roomNumberF);
        }
        if(shiftF!='')
        {
            shiftF = JSON.stringify(shiftF);
        }
        if(alertF!='')
        {
            alertF = JSON.stringify(alertF);
        }

        var data = {
            limit: req.body.limit,
            filter: {
              'alert': alertF,
              'shift': shiftF,
              'searchByDateFrom': req.body.searchByDateFrom,
              'searchByDateTo': req.body.searchByDateTo,
              'searchByButlerName': butlerNameF,
              'searchByRoomNo': roomNumberF
            },
            noRecent: 1
        };
        requestHistoryProcess(data, function(err, d){
            res.write(JSON.stringify(d));
            res.end();
        });
    }
    else
    {
        sendError(res, 'No limit value found in request.');
    }
});

app.post('/dcr', function(req, res) {
    var bid = req.body.butler_id;
    var rid = req.body.request_id;
    var remark = req.body.remark;

    if(typeof bid!=='undefined' && typeof rid!='undefined' && typeof remark!='undefined')
    {
        connection.query('SELECT is_deleted FROM `butler_info` WHERE butler_id="'+bid+'"', function(err, rows, fields) {
          if (err) { sendError(res, "Server error occurred. Please try after some time."); }
          if(rows.length > 0)
          {
            if(!(rows[0]).is_deleted)
            {
                let resText = {};
                connection.query('UPDATE `butler_request_map` SET resolution_time=NOW() WHERE request_id="'+rid+'"', function(err, rows, fields) {
                    connection.query('SELECT resolution_time, request_id, key_number FROM `butler_request_map` WHERE request_id="'+rid+'"', function(err, brmrows, fields) {

                      if(brmrows.length > 0) {
                          brmrows = brmrows[0];
                          resText = {'request_id': brmrows.request_id,'resolution_time': brmrows.resolution_time}
                          closeRequestCall(brmrows.key_number, remark, rid, function(err, r){
                            console.log('Request complete');
                          });
                      }

                      if (err) { sendError(res, "Server error occurred. Please try after some time."); }
                      let resToSend = {
                          "status": true,
                          "resText": resText
                      };
                      res.write(JSON.stringify(resToSend), function(err){
                          res.end();
                      });
                  });
                });
            }
            else
            {
                sendError(res, "Requesting Butler has been deleted by the Admin.");
            }
          }
          else
          {
            sendError(res, "Its an API attack. Not a physical Butler.");
          }
        });
    }
    else
    {
        sendError(res, "Invalid Parameters");
    }
});

app.post('/fp', function(req, res) {
    var eid = req.body.email_address;
    if(typeof eid!=='undefined')
    {
        butlerApp._forgotPassword(eid, function(err, r){
            if(err){ sendError(res, err); }
            else
            {
                var resToSend = {
                    "status": true,
                    "resText": r
                };
                res.write(JSON.stringify(resToSend), function(err){
                    res.end();
                });
            }
        });
    }
    else
    {
        sendError(res, 'Invalid Parameters for forgot password.');
    }
});

butlerApp._receivepn = function(deviceid, isenable, callback) {
    connection.query('update butler_app_active_devices set push_notifications="'+isenable+'" where device_id="'+deviceid+'"', function(err, rows, fields) {
      if (err) { sendError(res, "Server error occurred. Please try after some time."); }
      if(rows.affectedRows)
      {
        callback(null, true);
      }
      else
      {
        callback('Receice Push Notifications: ' + ' device_id = ' + deviceid + ' - ' + isenable, null);
      }
    });
}

butlerApp._logoutDevices = function(buid, callback) {
    connection.query('select device_token from butler_app_active_devices where butler_app_users_id="'+buid+'"', function(err, devicetokens, fields) {
      if (err) { sendError(res, "Server error occurred. Please try after some time."); }
      if(devicetokens.length)
      {
        connection.query('update butler_app_active_devices set is_logged_in=0, last_logout=NOW() where butler_app_users_id="'+buid+'"', function(err, rows, fields) {
          if (err) { sendError(res, "Server error occurred. Please try after some time."); }
          if(rows.affectedRows)
          {
            callback(null, devicetokens);
          }
          else
          {
            callback('Logout devices: No Butler associated with this butler_app_users_id', null);
          }
        });
      }
      else
      {
        callback('Logout devices: No Butler associated with this butler_app_users_id', null);
      }
    });
} //

butlerApp.sendInfo = function(tag, data) {
    if(tag=='editshift')
    {
        connection.query('select DISTINCT(bsm.shift_id) as sid, bsm.butler_info_id as bid, bst.shift_id, bi.butler_app_users_id as bauid, baad.device_token, baad.device_type from butler_shift_map as bsm inner join butler_shift_timing as bst on bsm.shift_id=bst.shift_id inner join butler_info as bi on bi.butler_info_id=bsm.butler_info_id inner join butler_app_active_devices as baad on bi.butler_app_users_id=baad.butler_app_users_id where bi.is_deleted=0 and bst.is_deleted=0 and baad.is_logged_in=1 and bsm.shift_id="'+data.shift_id+'"', function(err, rows, fields) {
          if (err) { sendError(res, "Server error occurred. Please try after some time."); }
          if(rows.length)
          {
            var tokenArray = array();
            rows.forEach(function(item){
                array_push(tokenArray, item.device_token);
            });
            butlerApp._sendPNProcess(tokenArray, data, function(err, r){});
          }
          else
          {
            callback('No butler associated with this email address.', null);
          }
        });
    }
    else if(tag=='editzone')
    {
        var zoneid = decrypt_str(data.zone_id);
        if(zoneid)
        {
            connection.query('select DISTINCT(bsm.butler_info_id) as bid, bsm.zone_id as zid, bzm.butler_zones_master_id, bi.butler_app_users_id as bauid, baad.device_token, baad.device_type from butler_shift_map as bsm inner join butler_zones_master as bzm on bsm.zone_id=bzm.butler_zones_master_id inner join butler_info as bi on bi.butler_info_id=bsm.butler_info_id inner join butler_app_active_devices as baad on bi.butler_app_users_id=baad.butler_app_users_id where bi.is_deleted=0 and bzm.is_deleted=0 and baad.is_logged_in=1 and bsm.zone_id=1', function(err, rows, fields) {
              if (err) { sendError(res, "Server error occurred. Please try after some time."); }
              if(rows.length)
              {
                var tokenArray = array();
                rows.forEach(function(item){
                    array_push(tokenArray, item.device_token);
                });
                butlerApp._sendPNProcess(tokenArray, data, function(err, r){});
              }
              else
              {
                callback('No butler associated with this email address.', null);
              }
            });
        }
    }
    else if(tag=='editbutler')
    {
        var d = JSON.parse(data.dataPacket);
        var butlerid = d.butler_info_id;

        if(butlerid)
        {
            connection.query('select DISTINCT(bsm.butler_info_id) as bid, bi.butler_app_users_id as bauid, baad.device_token, baad.device_type from butler_shift_map as bsm inner join butler_info as bi on bsm.butler_info_id=bi.butler_info_id inner join butler_app_active_devices as baad on bi.butler_app_users_id=baad.butler_app_users_id where bi.is_deleted=0 and baad.is_logged_in=1 and bsm.butler_info_id="'+butlerid+'"', function(err, rows, fields) {
              if (err) { sendError(res, "Server error occurred. Please try after some time."); }
              if(rows.length)
              {
                var tokenArray = [];
                rows.forEach(function(item){
                    tokenArray.push(item.device_token);
                });
                console.log(tokenArray);
                butlerApp._sendPNProcess(tokenArray, data, function(err, r){});
              }
              else
              {
                callback('No butler associated with this email address.', null);
              }
            });
        }
    }
}

butlerApp._forceLogout = function(buid) {}

butlerApp._forgotPassword = function(eid, callback) {
    if(typeof eid!='undefined')
    {
        connection.query('select butler_email from butler_info where butler_email="'+eid+'"', function(err, rows, fields) {
          if (err) { sendError(res, "Server error occurred. Please try after some time."); }
          if(rows.length)
          {
            callback(null, 'An email has been sent to the registered email address to proceed further.');
          }
          else
          {
            callback('No butler associated with this email address.', null);
          }
        });
    }
}

butlerApp._changePassword = function(res, buid, op, np, cp, callback) {
    if(typeof buid!='undefined' && typeof op!='undefined' && typeof np!='undefined' && typeof cp!='undefined')
    {
        if(np===cp)
        {
            connection.query('select password from butler_app_users where password="'+op+'" and butler_app_users_id="'+buid+'"', function(err, rows, fields) {
              if (err) { sendError(res, "Server error occurred. Please try after some time."); }
              if(rows.length)
              {
                connection.query('update butler_app_users set password="'+np+'" where password="'+op+'" and butler_app_users_id="'+buid+'"', function(err, rows, fields) {
                  if (err) { sendError(res, "Server error occurred. Please try after some time."); }
                  if(rows.affectedRows)
                  {
                    callback(null, 'Password reset successfully');
                  }
                  else
                  {
                    callback('Error in updating password. Try again.', null);
                  }
                });
              }
              else
              {
                callback('Wrong old password.', null);
              }
            });
        }
        else
        {
            callback('New password and confirm password does not match.', null);
        }
    }
}

butlerApp._getPNMsg = function(msgtype, data, callback) {
    connection.query('select message from `butler_push_notification_messages` where type="'+msgtype+'"', function(err, rows, fields) {
      if (err) { sendError(res, "Server error occurred. Please try after some time."); }
      if(rows.length > 0)
      {
        var msg = (rows[0]).message;
        if(msgtype=='new_call')
        {
            msg = msg.replace("%%room_no%%", 'Room no. ' + data.key_number);
            msg = msg.replace("%%msgtype%%", msgtype);
            msg = JSON.parse(msg);
            msg.dataPacket = data;
        }
        else if(msgtype=='butler_info_change')
        {
            msg = msg.replace("%%msgtype%%", msgtype);
            msg = JSON.parse(msg);
            msg.dataPacket = data;
        }
        else if(msgtype=='alert_level_change')
        {
            msg = msg.replace("%%msgtype%%", msgtype);
            msg = JSON.parse(msg);
            msg.dataPacket = {};
            msg.dataPacket.alertInfo = data;
        }
        else if(msgtype=='escalation_level_update')
        {
            msg = msg.replace("%%msgtype%%", msgtype);
            msg = JSON.parse(msg);
            msg.dataPacket = {};
            msg.dataPacket.escalation_level_update = data;
        }
        callback(null, msg);
      }
      else
      {
        callback('Error in getting messages with the requested type.', null);
      }
    });
}

butlerApp._sendPNProcess = function(deviceTokenList, msgtosend, callback){
    if(deviceTokenList.length > 0)
    {
        pN.send(deviceTokenList, msgtosend);
        callback(null, true);
    }
}

butlerApp.getDeviceTokens = function(params, callback) {
    var query = '';
    if(typeof params.butler_app_users_id!=='undefined')
    {
        query = 'select device_token, device_type from `butler_app_active_devices` where butler_app_users_id="'+params.butler_app_users_id+'"';
    }
    else
    {
        query = 'select device_token, device_type from `butler_app_active_devices`';
    }
    connection.query(query, function(err, rows, fields) {
      if (err) { sendError(res, "Server error occurred. Please try after some time."); }
      var deviceTokenList = [];
      if(rows.length > 0)
      {
        rows.forEach(function(item){
            deviceTokenList.push({
                'device_token': item.device_token,
                'device_type': item.device_type
            });
        });
        callback(null, deviceTokenList);
      }
      else
      {
        callback(null, deviceTokenList);
      }
    });
}

butlerApp._sendPNBulk = function (msgtype, params) {
    if(params.length > 0)
    {
        params.forEach(function(item){
            butlerApp._sendPN('escalation_level_update', item);
        });
    }
}

butlerApp._sendPN = function (msgtype, params) {
    if(msgtype=='butler_info_change')
    {
        params = JSON.parse(params);
    }
    //console.log(params);
    butlerApp.getDeviceTokens(params, function(e, dtlist){    // We should have butler_app_users_id to get the Active device tokens.

        if(dtlist.length > 0 || msgtype=='alert_level_change')
        {
            butlerApp._getPNMsg(msgtype, params, function(err, message){
                if(message)
                {
                    butlerApp._sendPNProcess(dtlist, message, function(e, r){
                        if(e) { console.log(e); }
                        console.log(r);
                    });
                }
            });
        }
    });
}

butlerApp.refreshToken = function(did, dt, res, callback) {
    if(typeof buid !=='undefined' && typeof did!=='undefined')
    {
        connection.query('update `butler_app_active_devices` set device_token="'+dt+'" where device_id="'+did+'"', function(err, rows, fields) {
          if (err) { sendError(res, "Server error occurred. Please try after some time."); }
          if(rows.affectedRows)
          {
            callback(null, rows);
          }
          else
          {
            callback('Error in refreshing token.', null);
          }
        });
    }
}

butlerApp.logout = function(did, buid, res, callback) {
    connection.query('update `butler_app_active_devices` set is_logged_in=0 and last_logout=now() where device_id="'+did+'" and butler_app_users_id="'+buid+'"', function(err, rows, fields) {
      if (err) { sendError(res, "Server error occurred. Please try after some time."); }
      if(rows.affectedRows)
      {
        callback(null, rows);
      }
      else
      {
        callback('Error in updating logout information.', null);
      }
    });
}

butlerApp.getButlerFullInfo = function(butler_app_users_id, req, callback) {
    if(butler_app_users_id)
    {
        connection.query('select bi.*, bst.*, bsm.*, bzm.*, zonemap.*, baad.butler_app_active_devices_id, baad.push_notifications, baad.device_id from butler_info as bi inner join butler_shift_map as bsm on bi.butler_info_id=bsm.butler_info_id inner join butler_shift_timing as bst on bst.shift_id=bsm.shift_id inner join butler_zones_master as bzm on bzm.butler_zones_master_id=bsm.zone_id inner join butler_zone_map as zonemap on zonemap.zone_id=bsm.zone_id inner join butler_app_active_devices as baad on bi.butler_app_users_id="'+butler_app_users_id+'" where bi.is_deleted=0 and bst.is_deleted=0 and bzm.is_deleted=0 and bi.butler_app_users_id="'+butler_app_users_id+'" and baad.device_id="'+req.body.device_id+'"', function(err, rows, fields) {
          if (err) { sendError(res, ""); }
          if(rows.length > 0)
          {
            var d = rows[0];
            var dataPacket = {};
            dataPacket.butler = {
                'butler_app_users_id': butler_app_users_id,
                'butler_app_active_devices_id': d.butler_app_active_devices_id,
                'butler_info_id': d.butler_info_id,
                'butler_id': d.butler_id,
                'butler_name': d.butler_name,
                'butler_sms_number': d.butler_sms_number,
                'butler_email': d.butler_email,
                'push_notifications': d.push_notifications
            };
            dataPacket.zone = {
                'zone_id': d.zone_id,
                'zone_name': d.zone_name
            };
            var shiftArray = [];
            var roomArray = [];

            rows.forEach(function(item){
                shiftArray.push({
                    'shift_id': item.shift_id,
                    'shift_name': item.shift_name,
                    'shift_start_time': item.time_start,
                    'shift_end_time': item.time_end
                });
                roomArray.push({
                    'key_number': item.key_number
                });
            });
            dataPacket.shift = shiftArray;
            dataPacket.room = roomArray;
            callback(null, dataPacket);
          }
          else
          {
            callback('No records for this Butler.', null);
          }
        });
    }
    else
    {
        callback('Its as API attack. No butler_app_users_id found.', null);
    }
}

butlerApp.getAlertsInfo = function(callback) {
    getAlertMap(function(err, data){
        if(data.length > 0)
        {
            var alertArray = [];
            data.forEach(function(item){
                alertArray.push({
                    'alert_level': item.level_of_alert,
                    'time_limit': item.time_limit,
                    'color': item.alert_bg_color
                });
            });
            callback(null, alertArray);
        }
        else
        {
            callback('No Alert Level configured till yet.', null);
        }
    });
}

butlerApp._cPN = function (sendto, dataobj, msgtitle, msgbody, callback) { // create a push notification message
    console.log({
        to: sendto,
        data: {
            "testkey": "testvalue"
        },
        notification: {
            title: msgtitle,
            body: msgbody
        }
    });
    callback(null, {
        to: sendto,
        data: {
            "testkey": "testvalue"
        },
        notification: {
            title: msgtitle,
            body: msgbody
        }
    });
}

var fetchButlerInfo = function(data, req, callback) {
    getButlerInfo();
}

var setUserLogin = function(data, req, res, callback) {
    connection.query('SELECT count(*) as adcount FROM `butler_app_active_devices` WHERE butler_app_users_id="'+data.butler_app_users_id+'" AND device_id="'+req.body.device_info.uniqueDeviceID+'"', function(err, rows, fields) {
      if (err) { sendError(res, "Server error occurred. Please try after some time."); }
      var adcount = (rows[0]).adcount;
      if(adcount)
      {
        connection.query('UPDATE `butler_app_active_devices` SET is_logged_in=1, last_login=NOW(), device_token="'+req.body.device_token+'", device_type="'+req.body.device_type+'" WHERE butler_app_users_id="'+data.butler_app_users_id+'" AND device_id="'+req.body.device_info.uniqueDeviceID+'"', function(err, rows, fields) {
          if (err) { sendError(res, "Server error occurred. Please try after some time."); }
          callback(null, rows);
        });
      }
      else
      {
        connection.query('INSERT INTO `butler_app_active_devices`(butler_app_users_id, is_logged_in, last_login, device_token, device_info, device_id, device_type) VALUES("'+data.butler_app_users_id+'", 1, NOW(), "'+req.body.device_token+'", "'+encrypt_str(JSON.stringify(req.body.device_info))+'", "'+req.body.device_info.uniqueDeviceID+'", "'+req.body.device_type+'")', function(err, rows, fields) {
          if (err) { sendError(res, "Server error occurred. Please try after some time."); }
          callback(null, rows);
        });
      }
    });
}

var sendError = function(resObj, resText) {
    var resToSend = {
        "status": false,
        "resText": resText
    };
    resObj.write(JSON.stringify(resToSend), function(err){
        resObj.end();
    });
}

var getAuthenticate = function(data, res, callback) {
    var u = data.username;
    var p = data.password;
    var dt = data.device_token;

    if(typeof u!=='undefined' && typeof p!=='undefined' && typeof dt!=='undefined')
    {
        console.log('SELECT butler_app_users_id FROM `butler_app_users` WHERE username="'+u+'" AND password="'+p+'" AND is_active=1');
        connection.query('SELECT butler_app_users_id FROM `butler_app_users` WHERE username="'+u+'" AND password="'+p+'" AND is_active=1', function(err, rows, fields) {
          if (err) { sendError(res, "Server error occurred. Please try after some time."); }
          callback(null, rows);
        });
    }
    else
    {
        callback('Invalid Parameters', null);
    }
}

server.listen(httpPort);

/**** CRON SCHEDULE ****/

 // This CRON will run in every minute
/*cron.schedule('* * * * *', function(){
  getMessagesToSend(function(err, data){
    if(err) throw err;
    if(data.length > 0)
    {
        data.forEach(function(item){
            var dataPacket = JSON.parse(decrypt_str(item.track_status));
            processMessage(item.message_id, dataPacket, '', function(err, processedResult){
                if(processedResult)
                {
                    messageProcessed(item.message_id, function(err, d){
                        if(d.affectedRows)
                        {
                            //console.log('Message has been processed and marked as processed');
                            callMessageAPI();
                        }
                        else
                        {
                            //console.log('Message has been processed but unable to marked as processed .... Message id = ' + item.message_id);
                            callMessageAPI();
                        }
                    });
                }
            });
        });
    }
    else
    {
        callMessageAPI();
    }
  });
});*/

function callMessageAPI()
{
    request({
      uri: "http://his/webservices/services/sendMessage",
      headers: {
        'Auth': 'pa1451156rag484521521gon45635189515451'
      },
      method: "POST",
  },function(error, response, body) {
        //console.log(response);
    });
}

function closeRequestCall(roomno, remarks, requestId, callback)
{
    console.log('Entered in cloase request call');
    let headers = {
      'content-type': 'application/vnd.digivalet.v1+json',
      'cache-control': 'no-cache'
    };

    let dataString = {
      "details": [{
          "ButlerData": [
            {
              "roomNumber": roomno,
              "requestId": requestId,
              "remark": remarks
            }
          ]
      }],
      "operation": "close_request",
      "feature": "butlercall"
    };

    request({
      uri: config.url.butlerInterface.closeRequest,
      headers: headers,
      body: JSON.stringify(dataString),
      qs: { access_token: 'saddsd' },
      method: "POST"
    },function(error, response, body) {
        //console.log(response);
        console.log(body);
        callback(null, true);
    });
}

function messageProcessed(msgid, callback)
{
    connection.query('UPDATE `messaging_message` SET schedule=2 WHERE message_id="'+msgid+'"', function(err, rows, fields) {
        callback(null, rows);
    });
}

/**********************/

//var io = require('socket.io').listen(httpServer);
//io.set('origins', httpsServerURL+':'+httpsPort);

var nsp = io.of('/m');
var sck = {};

var butlerC      = io.of('/b');

var dgSpider      = io.of('/dgSpider');
var dgSpiderSocket = {};

dgSpider.on('connection', function (socket) {
    dgSpiderSocket = socket;
    socket.on('amIBlocked', function(data){
        amIBlocked(data, function(err, res){
            if(res.length > 0)
            {
                res = res[0];
                socket.emit('amIBlocked', { 'blocked': res.block, 'errorMessage': 'Your account has been blocked!' });
            }
            else if(res.length==0)
            {
                socket.emit('amIBlocked', { 'blocked': 1, 'errorMessage': 'Your account has been deleted.' });
            }
        });
    });
});

var butlerNotifications = function(title, message) {

};

var getMaxButlerRequestId = function(callback) {
    connection.query('SELECT `AUTO_INCREMENT` as butlerRequestMapId FROM  INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = "'+config.sql.database+'" AND TABLE_NAME = "butler_request_map"', function(err, rows, fields) {
        if(err) console.log(err);
        if(rows.length > 0)
        {
            callback(null, rows[0]);
        }
        else
        {
            callback('Error in fetching max butler_request_map_id from butler_request table.', null);
        }
    });
}

var setMaxButlerRequestId = function(callback) {
    connection.query('SELECT `AUTO_INCREMENT` as butlerRequestMapId FROM  INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = "'+config.sql.database+'" AND TABLE_NAME = "butler_request_map"', function(err, rows, fields) {
        if(err) console.log(err);
        if(rows.length > 0)
        {
            callback(null, rows[0]);
        }
    });
}

getMaxButlerRequestId(function (err, d){
    if(d)
    {
        butlerRequestMapId = d.butlerRequestMapId;
        setInterval(function(){
            var data = { butlerRequestMapId: butlerRequestMapId };
            recentRequestProcessForMobileApps(data, function (error, recentRequestData){
                //console.log(data);
                if(recentRequestData)
                {
                    //console.log(recentRequestData);
                    getUpdatedStatus(data, function(err, updatedData){
                        //console.log(updatedData);
                        var butlerView = '';
                        var lastButlerReqId = 0;
                        var recentRequestRooms = [];
                        if(recentRequestData.length)
                        {
                            var itemsProcessed = 0;
                            recentRequestData.forEach(function(obj){
                                if(lastButlerReqId==0)
                                {
                                    lastButlerReqId = obj.butler_request_map_id;
                                }
                                recentRequestRooms.push("[data-room='"+obj.key_number+"']");
                                var escalationLevel = obj.escalation_level > 0 ? ' Level ' + obj.escalation_level : ' Just Arrived ';
                                butlerView += '<tr data-alertlevel-'+obj.escalation_level+'="1" id="'+obj.request_id+'" data-room="'+obj.key_number+'">';
                                butlerView += '<td>' + obj.key_number + '</td>';
                                butlerView += '<td>' + obj.butler_id + '</td>';
                                butlerView += '<td>' + obj.butler_name + '</td>';
                                butlerView += '<td>' + moment(obj.time_of_request).format('LLL') + '</td>';
                                butlerView += '<td>' + obj.zone_name + '</td>';
                                butlerView += '<td>' + obj.shift_name + '</td>';
                                butlerView += '<td data-alert'+obj.request_id+'>' + escalationLevel + '</td>';
                                butlerView += '<td> <button class="btn btn-green" data-closecall="'+obj.key_number+'"> Close Call </button> </td>';
                                butlerView += '</tr>';
                                itemsProcessed++;
                                if(itemsProcessed==recentRequestData.length)
                                {
                                    setMaxButlerRequestId(function(err, res){
                                        butlerRequestMapId = res.butlerRequestMapId;
                                    });
                                }
                                console.log('FCM called Start');
                                butlerApp._sendPN('new_call', obj);
                                console.log('FCM called End');
                            });
                        }
                        butlerApp._sendPNBulk('escalation_level_update', updatedData);
                    });
                }
            });
        }, 5000);
    }
});

butlerC.on('connection', function (socket) {

    socket.on('incomingRequest', function (data) {

        incomingRequestProcess(data, function(error, justArrivedRequests, t){
            var lastButlerReqId = 0;
            if(justArrivedRequests.length)
            {
                var butlerView = '';
                butlerView += '<table class="table table-bordered table-hover">';
                butlerView += '<thead>';
                butlerView += '<tr class="heading"><th width="220px">Room Number</th>';
                butlerView += '<th width="220px">Butler Id</th>';
                butlerView += '<th width="220px">Butler Name</th>';
                butlerView += '<th width="220px" class="text-large">Time of Request</th>';
                butlerView += '<th width="150px" class="text-center">Zone</th>';
                butlerView += '<th width="150px" class="text-center">Shift</th>';
                butlerView += '<th width="150px" class="text-center">Status</th>';
                butlerView += '<th width="220px" class="text-center">Action</th>';
                butlerView += '</tr>';
                butlerView += '</thead>';
                butlerView += '<tbody>';

                var butlerDeleted = '';
                var zoneDeleted = '';
                var shiftDeleted = '';

                getAlertMap(function(err, a){
                    var temp = [];
                    a.forEach(function(i){
                        temp[i.level_of_alert] = i.alert_bg_color;
                    });

                    justArrivedRequests.forEach(function(obj){
                        if(lastButlerReqId==0 && data.noRecent==1)
                        {
                            lastButlerReqId = obj.butler_request_map_id;
                        }

                        obj.is_deleted ? butlerDeleted = '<b> - Deleted</b>' : butlerDeleted = '';
                        obj.zone_is_deleted ? zoneDeleted = '<b> - Deleted</b>' : zoneDeleted = '';
                        obj.shift_is_deleted ? shiftDeleted = '<b> - Deleted</b>' : shiftDeleted = '';

                        var escalationLevel = obj.escalation_level > 0 ? ' Level ' + obj.escalation_level : ' Just Arrived ';
                        butlerView += '<tr data-alertlevel-'+obj.escalation_level+'="1" id="'+obj.request_id+'" data-room="'+obj.key_number+'" style="background:'+temp[obj.escalation_level]+'"><td>' + obj.key_number + '</td>';
                        butlerView += '<td>' + obj.butler_id+ ' ' + butlerDeleted + '</td>';
                        butlerView += '<td>' + obj.butler_name + '</td>';
                        butlerView += '<td>' + moment(obj.time_of_request).format('LLL') + '</td>';
                        butlerView += '<td>' + obj.zone_name + ' ' + zoneDeleted + '</td>';
                        butlerView += '<td>' + obj.shift_name + ' ' + shiftDeleted + '</td>';
                        butlerView += '<td data-alert'+obj.request_id+'>' + escalationLevel + '</td>';
                        butlerView += '<td> <button class="btn btn-green" data-closecall="'+obj.key_number+'"> Close Call </button> </td>';

                    });
                    butlerView += '</tbody>';
                    butlerView += '</table>';
                    socket.emit('incomingRequest', { 'butlerView': butlerView, 'lastButlerReqId': lastButlerReqId, 'totalRecords': t.total, 'noRecent': data.noRecent });
                });
            }
            else
            {
                socket.emit('incomingRequest', { 'butlerView': '<img src="components/com_butler/assets/img/no_new_butler_calls.png"><p>&nbsp;</p><p data-notifyMessage>Currently, there are no "New Calls" available.</p>', 'lastButlerReqId': lastButlerReqId });
            }
        });
    });

    socket.on('completedRequest', function (data) {
        completedRequestProcess(data, function(error, data, t){
            if(data.length)
            {
                var butlerView = '';
                butlerView += '<table class="table table-bordered table-hover">';
                butlerView += '<thead>';
                butlerView += '<tr class="heading"><th width="220px">Room Number</th>';
                butlerView += '<th width="220px">Butler Id</th>';
                butlerView += '<th width="220px">Butler Name</th>';
                butlerView += '<th width="220px" class="text-large">Time of Request</th>';
                butlerView += '<th width="220px" class="text-large">Time of Completion</th>';
                butlerView += '<th width="150px" class="text-center">Zone</th>';
                butlerView += '<th width="150px" class="text-center">Shift</th>';
                butlerView += '<th width="150px" class="text-center">Status</th>';
                butlerView += '<th width="220px" class="text-center">Remark</th>';
                butlerView += '</tr>';
                butlerView += '</thead>';
                butlerView += '<tbody>';

                var butlerDeleted = '';
                var zoneDeleted = '';
                var shiftDeleted = '';

                getAlertMap(function(err, a){
                    var temp = [];
                    a.forEach(function(i){
                        temp[i.level_of_alert] = i.alert_bg_color;
                    });

                    data.forEach(function(obj){

                        obj.is_deleted ? butlerDeleted = '<b> - Deleted</b>' : butlerDeleted = '';
                        obj.zone_is_deleted ? zoneDeleted = '<b> - Deleted</b>' : zoneDeleted = '';
                        obj.shift_is_deleted ? shiftDeleted = '<b> - Deleted</b>' : shiftDeleted = '';

                        var escalationLevel = obj.escalation_level > 0 ? ' Level ' + obj.escalation_level : ' Just Arrived ';
                        butlerView += '<tr data-alertlevel-'+obj.escalation_level+'="1" style="background:'+temp[obj.escalation_level]+'"><td>' + obj.key_number + '</td>';
                        butlerView += '<td>' + obj.butler_id + ' ' + butlerDeleted + '</td>';
                        butlerView += '<td>' + obj.butler_name + '</td>';
                        butlerView += '<td>' + moment(obj.time_of_request).format('LLL') + '</td>';
                        butlerView += '<td>' + moment(obj.resolution_time).format('LLL') + '</td>';
                        butlerView += '<td>' + obj.zone_name + ' ' + zoneDeleted + '</td>';
                        butlerView += '<td>' + obj.shift_name + ' ' + shiftDeleted + '</td>';
                        butlerView += '<td> Completed at '+ escalationLevel +' state</td>';
                        butlerView += '<td style="position:relative;" data-requestid="'+obj.request_id+'" data-editremark="'+obj.remark+'"><span style="position: absolute;top: 4px;left: 4px;" class="tooltips" data-original-title="Edit Remark" data-placement="top"><i class="fa fa-pencil"></i></span>' + obj.remark + '</td></tr>';
                    });
                    butlerView += '</tbody>';
                    butlerView += '</table>';
                    socket.emit('completedRequest', { 'butlerView': butlerView, 'totalRecords': t.total });
                });
            }
            else
            {
                socket.emit('completedRequest', { 'butlerView': '<img src="components/com_butler/assets/img/no_new_butler_calls.png"><p>&nbsp;</p><p data-notifyMessage>Currently, there are no "Completed Calls" available.</p>' });
            }
        });
    });

    socket.on('requestHistory', function (data) {
        requestHistoryProcess(data, function(error, data ,t){
            if(data.length)
            {
                var butlerView = '';
                butlerView += '<table class="table table-bordered table-hover">';
                butlerView += '<thead>';

                butlerView += '<tr class="heading">';
                butlerView += '<th class="dosort" width="10%" data-prop="key_number">Room Number </th>';
                butlerView += '<th width="10%" class="dosort">Butler Id  </th>';
                butlerView += '<th width="12%" class="dosort">Butler Name </th>';
                butlerView += '<th width="16%" class="text-large dosort">Time of Request</th>';
                butlerView += '<th width="16%" class="text-large dosort">Time of Completion</th>';
                butlerView += '<th width="10%" class="text-center">Zone </th>';
                butlerView += '<th width="10%" class="text-center">Shift </th>';
                butlerView += '<th width="10%" class="text-center">Status </th>';
                butlerView += '<th class="text-center">Remark</th>';
                butlerView += '</tr>';
                butlerView += '</thead>';

                butlerView += '<tbody>';
                var zoneDeleted = '';
                var shiftDeleted = '';
                var butlerDeleted = '';

                getAlertMap(function(err, a){
                    var temp = [];
                    a.forEach(function(i){
                        temp[i.level_of_alert] = i.alert_bg_color;
                    });

                    data.forEach(function(obj){
                        obj.is_deleted ? butlerDeleted = '<b> - Deleted</b>' : butlerDeleted = '';
                        obj.zone_is_deleted ? zoneDeleted = '<b> - Deleted</b>' : zoneDeleted = '';
                        obj.shift_is_deleted ? shiftDeleted = '<b> - Deleted</b>' : shiftDeleted = '';

                        var escalationLevel = obj.escalation_level > 0 ? ' Level ' + obj.escalation_level : ' Just Arrived ';
                        var timeOfRequest = obj.resolution_time ? moment(obj.resolution_time).format('LLL') : '-';
                        var requestStatus = obj.resolution_time ? 'Completed at '+ escalationLevel +' state' : 'Incomplete Request';
                        var requestStatusColor = obj.resolution_time ? 'completedRequestBg' : 'incompletRequestBg';
                        butlerView += '<tr data-alertlevel-'+obj.escalation_level+'="1" data-requestBg="'+requestStatusColor+'" style="background:'+temp[obj.escalation_level]+'"><td>' + obj.key_number + '</td>';
                        butlerView += '<td>' + obj.butler_id + ' ' + butlerDeleted + '</td>';
                        butlerView += '<td>' + obj.butler_name + '</td>';
                        butlerView += '<td>' + moment(obj.time_of_request).format('LLL') + '</td>';
                        butlerView += '<td>' + timeOfRequest + '</td>';
                        butlerView += '<td>' + obj.zone_name + ' ' + zoneDeleted + '</td>';
                        butlerView += '<td>' + obj.shift_name + ' ' + shiftDeleted + '</td>';
                        butlerView += '<td> ' + requestStatus + '</td>';
                        butlerView += '<td>' + obj.remark + '</td></tr>';
                    });

                    butlerView += '</tbody>';
                    butlerView += '</table>';
                    socket.emit('requestHistory', { 'butlerView': butlerView, 'totalRecords': t.total });
                });
            }
            else
            {
                socket.emit('requestHistory', { 'butlerView': '<img src="components/com_butler/assets/img/no_new_butler_calls.png"><p>&nbsp;</p><p data-notifyMessage>Currently, there are no "New or Completed Calls" available.</p>' });
            }
        });
    });

    socket.on('recentRequest', function (data) {
        recentRequestProcess(data, function(error, recentRequestData){
            getClosedRequest(function(err, closedRequests){
                if(recentRequestData)
                {
                    getUpdatedStatus(data.limit, function(err, updatedData){
                        var butlerView = '';
                        var lastButlerReqId = 0;
                        var recentRequestRooms = [];
                        if(recentRequestData.length)
                        {
                            getAlertMap(function(err, a){
                                var temp = [];
                                a.forEach(function(i){
                                    temp[i.level_of_alert] = i.alert_bg_color;
                                });
                                recentRequestData.forEach(function(obj){
                                    if(lastButlerReqId==0)
                                    {
                                        lastButlerReqId = obj.butler_request_map_id;
                                    }
                                    recentRequestRooms.push("[data-room='"+obj.key_number+"']");
                                    var escalationLevel = obj.escalation_level > 0 ? ' Level ' + obj.escalation_level : ' Just Arrived ';
                                    butlerView += '<tr data-alertlevel-'+obj.escalation_level+'="1" id="'+obj.request_id+'" data-room="'+obj.key_number+'" style="background:'+temp[obj.escalation_level]+'">';
                                    butlerView += '<td>' + obj.key_number + '</td>';
                                    butlerView += '<td>' + obj.butler_id + '</td>';
                                    butlerView += '<td>' + obj.butler_name + '</td>';
                                    butlerView += '<td>' + moment(obj.time_of_request).format('LLL') + '</td>';
                                    butlerView += '<td>' + obj.zone_name + '</td>';
                                    butlerView += '<td>' + obj.shift_name + '</td>';
                                    butlerView += '<td data-alert'+obj.request_id+'>' + escalationLevel + '</td>';
                                    butlerView += '<td> <button class="btn btn-green" data-closecall="'+obj.key_number+'"> Close Call </button> </td>';
                                    butlerView += '</tr>';
                                });
                                socket.emit('recentRequest', { 'butlerView': butlerView, 'updatedData': updatedData, 'lastButlerReqId': lastButlerReqId, 'recentRequestRooms': recentRequestRooms });
                            });
                        }

                        if(updatedData.length > 0)
                        {
                            socket.emit('recentRequest', { 'butlerView': butlerView, 'updatedData': updatedData, 'lastButlerReqId': lastButlerReqId, 'recentRequestRooms': recentRequestRooms });
                        }
                        if(recentRequestData.length==0 && updatedData.length == 0)
                        {
                            socket.emit('recentRequest', { 'butlerView': butlerView, 'updatedData': updatedData, 'lastButlerReqId': lastButlerReqId, 'recentRequestRooms': recentRequestRooms });
                        }
                    });
                }
                socket.emit('closedRequests', { 'closedRequests': closedRequests });
            });
        });
    });

    socket.on('renderButlerList', function (data) {
        getButlerList(function(error, butlerList){
            if(error) throw error;
            socket.emit('renderButlerList', { 'butlerList': butlerList });
        });
    });

    socket.on('renderRoomNoList', function (data) {
        getRoomNoList(null, function(error, roomNoList){
            if(error) throw error;
            socket.emit('renderRoomNoList', { 'roomNoList': roomNoList });
        });
    });

    socket.on('renderRoomNoListForFilter', function (data) {
        getRoomNumbersForFilter(function(error, roomNoList){
            if(error) throw error;
            socket.emit('renderRoomNoListForFilter', { 'roomNoList': roomNoList });
        });
    });

    socket.on('getButlerZones', function(data){

        getZoneNames(function(err, d){
            var zoneCount = d.length;
            var zoneView = '<button style="float: right; margin-bottom: 10px;" class="btn btn-blue" data-zoneadd="add"><span style="float: left;padding: 0 15px;"><i class="fa fa-plus"></i> Zone </span></button>';

            if(d.length > 0)
            {
                d.forEach(function(i){
                    getZoneShiftMap(i.butler_zones_master_id, function(err, res){
                        if(res.length > 0)
                        {
                            var zoneId = 0, shiftId = 0, serialNo = 0;
                            connection.query('SELECT zonemap.zone_id, bst.shift_id, zonemaster.zone_name, zonemaster.is_deleted as is_shift_deleted, zonemap.key_number, bi.butler_info_id, bi.butler_id, bi.butler_name, bi.butler_sms_number, bi.butler_email, bst.shift_name, bst.time_start, bst.time_end FROM `butler_zones_master` zonemaster INNER JOIN `butler_zone_map` as zonemap ON zonemaster.butler_zones_master_id=zonemap.zone_id INNER JOIN butler_shift_map as shiftmap ON zonemap.zone_id=shiftmap.zone_id INNER JOIN butler_info as bi ON shiftmap.butler_info_id=bi.butler_info_id INNER JOIN `butler_shift_timing` as bst ON shiftmap.shift_id=bst.shift_id WHERE zonemap.zone_id = "'+i.butler_zones_master_id+'" AND bi.is_deleted=0 AND zonemaster.is_deleted=0 GROUP BY shift_id ORDER BY zonemaster.butler_zones_master_id ASC, shiftmap.shift_id, zonemap.key_number ASC', function(err, rows, fields) {
                                if (err) throw err;
                                if(rows.length > 0)
                                {
                                    rows.forEach(function(item){
                                        if(zoneId!=item.zone_id)
                                        {
                                            if(zoneId!=0)
                                            {
                                                zoneView += '</tbody></table></div></div></div></div>';
                                                shiftId = 0;
                                                serialNo = 0;
                                            }

                                            zoneId      = item.zone_id;
                                            zoneView    += '<div class="portlet box blue"><div class="portlet-title">';
                                            zoneView    += '<div class="caption">';
                                            zoneView    += '<i class="fa fa-flag"></i>';
                                            zoneView    += item.zone_name + '</div>';
                                            zoneView    += '<div class="tools">';
                                            zoneView    += '<a href="javascript:;" style="float: left;padding: 0 15px;color: #fff;" data-zoneassignemails="'+encrypt_str(item.zone_id)+'"><i class="fa fa-envelope-o"></i> Assign Emails</a>';
                                            zoneView    += '<a href="javascript:;" style="float: left;padding: 0 15px;color: #fff;" data-zoneedit="'+encrypt_str(item.zone_id)+'"><i class="fa fa-pencil"></i> Edit Zone</a>';
                                            zoneView    += '<a href="javascript:;" style="float: left;padding: 0 15px;color: #fff;" data-zonedelete="'+encrypt_str(item.zone_id)+'"><i class="fa fa-trash"></i> Delete Zone</a>';
                                            zoneView    += '<a href="javascript:;" class="collapse">';
                                            zoneView    += '</a>';
                                            zoneView    += '</div></div>';
                                            zoneView    += '<div class="portlet-body">';
                                        }

                                        if(shiftId!=item.shift_id)
                                        {
                                            if(shiftId!=0)
                                            {
                                                zoneView    += '</tbody></table></div></div>';
                                            }

                                            shiftId = item.shift_id;
                                            zoneView    += '<div>';
                                            zoneView    += '<h4>'+item.shift_name+'</h4>';
                                            zoneView    += '<div class="table-responsive">';
                                            zoneView    += '<table class="table table-bordered table-hover" width="100%">';
                                            zoneView    += '<thead>';
                                            zoneView    += '<tr>';
                                            zoneView    += '<th width="5%">#</th>';
                                            zoneView    += '<th width="10%">Room Number</th>';
                                            zoneView    += '<th width="10%">Butler ID</th>';
                                            zoneView    += '<th width="25%">Butler Name</th>';
                                            zoneView    += '<th width="10%">Butler Email</th>';
                                            zoneView    += '<th width="20%">Butler SMS Number</th>';
                                            zoneView    += '<th width="20%">Action</th>';
                                            zoneView    += '</thead></tr>';
                                            zoneView    += '<tbody>';
                                        }
                                        serialNo++;
                                        zoneView    += '<tr>';
                                        zoneView    += '<td>'+serialNo+'</td>';
                                        zoneView    += '<td>'+item.key_number+'</td>';
                                        zoneView    += '<td>'+item.butler_id+'</td>';
                                        zoneView    += '<td>'+item.butler_name+'</td>';
                                        zoneView    += '<td><span class="butlerEmail">'+item.butler_email+'</span></td>';
                                        zoneView    += '<td>'+item.butler_sms_number+'</td>';
                                        zoneView    += '<td><button type="button" class="btn btn-blue tooltips" data-butleredit="'+encrypt_str(item.butler_info_id)+'" data-original-title="Edit Butler" data-placement="top"> <i class="fa fa-pencil"></i> </button>';
                                        zoneView    += '<button type="button" class="btn btn-blue tooltips" data-butlerdelete="'+encrypt_str(item.butler_info_id)+'" data-original-title="Delete Butler" data-placement="top"> <i class="fa fa-trash"></i> </button></td>';
                                        zoneView    += '</tr>';
                                    });
                                    zoneView    += '</tbody></table></div></div></div></div>';
                                    socket.emit('getButlerZones', { 'zoneView': zoneView });
                                }
                            });
                        }
                        else
                        {
                            zoneId      = i.butler_zones_master_id;
                            zoneView    += '<div class="portlet box blue"><div class="portlet-title">';
                            zoneView    += '<div class="caption">';
                            zoneView    += '<i class="fa fa-flag"></i>';
                            zoneView    += i.zone_name + '</div>';
                            zoneView    += '<div class="tools">';
                            zoneView    += '<a href="javascript:;" style="float: left;padding: 0 15px;color: #fff;" data-zoneassignemails="'+encrypt_str(i.butler_zones_master_id)+'"><i class="fa fa-envelope-o"></i> Assign Emails</a>';
                            zoneView    += '<a href="javascript:;" style="float: left;padding: 0 15px;color: #fff;" data-zoneedit="'+encrypt_str(i.butler_zones_master_id)+'"><i class="fa fa-pencil"></i> Edit Zone</a>';
                            zoneView    += '<a href="javascript:;" style="float: left;padding: 0 15px;color: #fff;" data-zonedelete="'+encrypt_str(i.butler_zones_master_id)+'"><i class="fa fa-trash"></i> Delete Zone</a>';
                            zoneView    += '</div></div>';
                            zoneView    += '</div></div>';
                            socket.emit('getButlerZones', { 'zoneView': zoneView });
                        }
                    });
                    zoneCount--;
                });
            }
            else
            {
                zoneView = '<div class="col-md-12"><button style="float: right; margin-bottom: 10px;" class="btn btn-blue" data-zoneadd="add"><span style="float: left;padding: 0 15px;"><i class="fa fa-plus"></i> Add a Zone </span></button></div><div><img src="components/com_butler/assets/img/no_new_butler_calls.png"><p>&nbsp;</p><p data-notifyMessage>Currently, there are no Zones available.</p></div>';
                socket.emit('getButlerZones', { 'zoneView': zoneView });
            }
        });
    });

    socket.on('getShifts', function(data){
        getShifts(function(error, shifts){
            var sNo = 1;
            var shiftsView = '';

            var zoneId = 0;
            var shiftId = 0;
            var serialNo = 0;

            shiftsView += '<button style="float: right; margin-bottom: 10px;" class="btn btn-blue" data-shiftadd=""><span style="float: left;padding: 0 15px;" ><i class="fa fa-plus"></i> Shift </span></button>';
            if(shifts.length > 0)
            {

                shiftsView    += '<div class="portlet box blue"><div class="portlet-title"><div class="caption"><i class="fa fa-clock-o"></i>Shifts</div>';
                shiftsView    += '<div class="tools">';
                //shiftsView    += '<a href="javascript:;" style="float: left;padding: 0 15px;color: #fff;" data-shiftadd=""><i class="fa fa-plus"></i> Add </a>';
                shiftsView    += '<a href="javascript:;" class="collapse"></a></div></div><div class="portlet-body">';
                shiftsView    += '<div class="table-responsive"><table class="table table-bordered table-hover" width="100%">';
                shiftsView    += '<thead>';
                shiftsView    += '<tr>';
                shiftsView    += '<th width="5%">#</th>';
                shiftsView    += '<th width="10%">Shift Name</th>';
                shiftsView    += '<th width="10%">Shift Start Time</th>';
                shiftsView    += '<th width="10%">Shift End Time</th>';
                shiftsView    += '<th width="10%">Action</th>';
                shiftsView    += '</thead></tr>';
                shiftsView    += '<tbody>';

                shifts.forEach(function(item){
                    shiftsView    += '<tr>';
                    shiftsView    += '<td>'+sNo+'</td>';
                    shiftsView    += '<td>'+item.shift_name+'</td>';
                    shiftsView    += '<td>'+item.time_start+'</td>';
                    shiftsView    += '<td>'+item.time_end+'</td>';
                    shiftsView    += '<td>';
                    shiftsView    += '<button type="button" class="btn btn-blue tooltips" data-shiftedit="'+encrypt_str(item.shift_id)+'" data-original-title="Edit Shift" data-placement="top"> <i class="fa fa-pencil"></i> </button>';
                    shiftsView    += '<button type="button" class="btn btn-blue tooltips" data-shiftdelete="'+encrypt_str(item.shift_id)+'" data-original-title="Delete Shift" data-placement="top"> <i class="fa fa-trash"></i> </button>';
                    shiftsView    += '</td>';
                    sNo++;
                });
                shiftsView    += '</tbody></table></div></div></div>';
                socket.emit('getShifts', { 'shiftsView': shiftsView });
            }
            else
            {
                shiftsView = '<div class="col-md-12"><button style="float: right; margin-bottom: 10px;" class="btn btn-blue" data-shiftadd=""><span style="float: left;padding: 0 15px;" ><i class="fa fa-plus"></i> Add a Shift </span></button></div><div><img src="components/com_butler/assets/img/no_new_butler_calls.png"><p>&nbsp;</p><p data-notifyMessage>Currently, there are no Shifts available.</p></div>';
                socket.emit('getShifts', { 'shiftsView': shiftsView });
            }
        });
    });

    socket.on('getButlers', function(data){
        getButlerNames(function(error, butlers){ //getButlerZones
            var sNo = 1;
            var butlersView = '';

            var zoneId = 0, shiftId = 0, serialNo = 0;

            butlersView += '<button style="float: right; margin-bottom: 10px;" class="btn btn-blue" data-butleradd=""><span style="float: left;padding: 0 15px;" ><i class="fa fa-plus"></i> Butler </span></button>';
            if(butlers.length > 0)
            {

                butlersView    += '<div class="portlet box blue"><div class="portlet-title"><div class="caption"><i class="fa fa-user"></i>Butlers</div>';
                butlersView    += '<div class="tools">';
                //butlersView    += '<a href="javascript:;" style="float: left;padding: 0 15px;color: #fff;" data-butleradd=""><i class="fa fa-plus"></i> Add </a>';
                butlersView    += '<a href="javascript:;" class="collapse"></a></div></div><div class="portlet-body">';
                butlersView    += '<div class="table-responsive"><table class="table table-bordered table-hover" width="100%">';
                butlersView    += '<thead>';
                butlersView    += '<tr>';
                butlersView    += '<th width="5%">#</th>';
                butlersView    += '<th width="10%">ID of Butler</th>';
                butlersView    += '<th width="10%">Name of Butler</th>';
                butlersView    += '<th width="10%">Phone Number for SMS</th>';
                butlersView    += '<th width="10%">Email Address</th>';
                //butlersView    += '<th width="10%">Shift</th>';
                butlersView    += '<th width="10%">Action</th>';
                butlersView    += '</thead></tr>';
                butlersView    += '<tbody>';

                butlers.forEach(function(item){
                    butlersView    += '<tr>';
                    butlersView    += '<td>'+sNo+'</td>';
                    butlersView    += '<td>'+item.butler_id+'</td>';
                    butlersView    += '<td>'+item.butler_name+'</td>';
                    butlersView    += '<td>'+item.butler_sms_number+'</td>';
                    butlersView    += '<td><span class="butlerEmail">'+item.butler_email+'</span></td>';
                    //butlersView    += '<td>'+item.shift_name+'</td>';
                    butlersView    += '<td>';
                    butlersView    += '<button type="button" class="btn btn-blue tooltips" data-butleredit="'+encrypt_str(item.butler_info_id)+'" data-original-title="Edit Butler Info" data-placement="top"> <i class="fa fa-pencil"></i> </button>';
                    butlersView    += '<button type="button" class="btn btn-blue tooltips" data-butlerdelete="'+encrypt_str(item.butler_info_id)+'" data-original-title="Delete this Butler" data-placement="top"> <i class="fa fa-trash"></i> </button>';
                    butlersView    += '<button type="button" class="btn btn-blue tooltips" data-butlermobileapp="'+encrypt_str(item.butler_info_id)+'" data-original-title="Manage Mobile App User" data-placement="top"> <i class="fa fa-android"></i> </button></td>';
                    sNo++;
                });

                butlersView    += '</tbody></table></div></div></div>';
                socket.emit('getButlers', { 'butlersView': butlersView });
            }
            else
            {
                butlersView = '<div class="col-md-12"><button style="float: right; margin-bottom: 10px;" class="btn btn-blue" data-butleradd=""><span style="float: left;padding: 0 15px;" ><i class="fa fa-plus"></i> Add a Butler </span></button></div><div><img src="components/com_butler/assets/img/no_new_butler_calls.png"><p>&nbsp;</p><p data-notifyMessage>Currently, there are no Butlers available.</p></div>';
                socket.emit('getButlers', { 'butlersView': butlersView });
            }
        });
    });

    socket.on('getConfigurations', function(data){
        getConfigurations(function(error, alertMap, alertText){
            var sNo = 1;
            var configView = '';

            configView += '<div class="col-md-12 "><button style="float: right; margin-bottom: 10px;" class="btn btn-blue" data-leveladd=""><span style="float: left;padding: 0 15px;" ><i class="fa fa-plus"></i> Alert Level </span></button></div>';
            if(alertMap)
            {
                var alertMapLength = alertMap.length;
                if(alertMapLength > 0)
                {
                    configView    += '<div class="portlet box blue"><div class="portlet-title"><div class="caption"><i class="fa fa-wrench"></i>Alert Levels</div>';
                    configView    += '<div class="tools">';
                    configView    += '<a href="javascript:;" class="collapse"></a></div></div><div class="portlet-body">';
                    configView    += '<div class="table-responsive"><table class="table table-bordered table-hover" width="100%">';
                    configView    += '<thead>';
                    configView    += '<tr>';
                    configView    += '<th width="10%">Alert Name</th>';
                    configView    += '<th width="20%">Time Limit (in seconds)</th>';

                    configView    += '<th width="20%">Alert Color</th>';
                    configView    += '<th width="10%">Action</th>';
                    configView    += '</thead></tr>';
                    configView    += '<tbody>';

                    var deleteAlert = '';
                    var disableDelete = 'disableDelete';
                    var toolTip = 'Can\'t Delete - You can only delete the last level.';
                    var alertLevelText = '';
                    var alertExecuteTime = 0;
                    alertMap.forEach(function(item){

                        item.level_of_alert!=0 ? alertLevelText = item.level_of_alert : alertLevelText = 'Butler Request';

                        if(sNo==alertMapLength && item.level_of_alert!=0)
                        {
                            deleteAlert = 'data-leveldelete="'+encrypt_str(item.level_of_alert)+'"';
                            disableDelete = '';
                            toolTip = 'Delete Level';
                        }
                        else
                        {
                            deleteAlert = '';
                            disableDelete = 'disableDelete';
                            toolTip = 'Can\'t Delete - You can only delete the last level.';
                        }
                        alertExecuteTime = alertExecuteTime + parseInt(item.time_limit);
                        configView    += '<tr>';
                        configView    += '<td>Level: <b>'+alertLevelText+'</b></td>';
                        configView    += '<td><b>' + item.time_limit + '</b> ( Execution time: '+alertExecuteTime+' )</td>';
                        configView    += '<td><div style="background:'+item.alert_bg_color+'; height: 30px;width:80px;margin:0 auto;" >&nbsp;</div></td>';
                        configView    += '<td>';
                        configView    += '<button type="button" class="btn btn-blue tooltips" data-leveledit="'+encrypt_str(item.level_of_alert)+'" data-original-title="Edit Level" data-placement="top"> <i class="fa fa-pencil"></i> </button>';


                        configView    += '<button type="button" class="btn btn-blue tooltips '+disableDelete+'" ' + deleteAlert + ' data-original-title="'+toolTip+'" data-placement="top"> <i class="fa fa-trash"></i> </button></td>';
                        sNo++;
                    });
                    configView    += '</tbody></table></div></div></div>';
                }
            }
            else
            {
                configView += '<div class="col-md-12"><img src="components/com_butler/assets/img/no_new_butler_calls.png"><p>&nbsp;</p><p data-notifyMessage>Currently, there are no Alert Levels available.</p></div>';
            }

            configView    += '<div class="col-md-12"><button style="float: right; margin-bottom: 10px;" class="btn btn-blue" data-configadd=""><span style="float: left;padding: 0 15px;" ><i class="fa fa-plus"></i> Alert Text </span></button></div>';
            if(alertText)
            {
                var alertTextLength = alertText.length;
                if(alertTextLength > 0)
                {
                    sNo = 1;
                    configView    += '<div class="portlet box blue"><div class="portlet-title"><div class="caption"><i class="fa fa-wrench"></i>Alert Text </div>';
                    configView    += '<div class="tools">';
                    configView    += '<a href="javascript:;" class="collapse"></a></div></div><div class="portlet-body">';
                    configView    += '<div class="table-responsive"><table class="table table-bordered table-hover" width="100%">';
                    configView    += '<thead>';
                    configView    += '<tr>';
                    configView    += '<th width="10%">Alert Name</th>';
                    configView    += '<th width="20%">Mail Subject</th>';
                    configView    += '<th width="20%">Mail Body</th>';
                    configView    += '<th width="20%">SMS Body</th>';
                    configView    += '<th width="10%">Action</th>';
                    configView    += '</thead></tr>';
                    configView    += '<tbody>';

                    alertMapLength = alertMapLength + 1;
                    var alertLevelText = '';
                    var deleteAlert = '';
                    var disableDelete = 'disableDelete';
                    var toolTip = 'Can\'t Delete - You can only delete the last level.';

                    alertText.forEach(function(item){
                        item.alert_level!=0 ? alertLevelText = item.alert_level : alertLevelText = 'Butler Request';


                        if(item.alert_level!=0 && item.alert_level!='checkin' && item.alert_level!='checkout' && item.alert_level!='precheckin' && item.alert_level!='precheckout')
                        {

                            deleteAlert = 'data-configdelete="'+encrypt_str(item.alert_level)+'"';
                            disableDelete = '';
                            toolTip = 'Delete Level';
                        }
                        else
                        {
                            deleteAlert = '';
                            disableDelete = 'disableDelete';
                            toolTip = 'Can\'t Delete - You can only delete the last level.';
                        }

                        configView    += '<tr>';
                        configView    += '<td>Level: <b>'+alertLevelText+'</b></td>';
                        configView    += '<td>'+item.mail_subject+'</td>';
                        configView    += '<td>'+item.mail_text+'</td>';
                        configView    += '<td>'+item.sms_text+'</td>';
                        configView    += '<td>';
                        configView    += '<button type="button" class="btn btn-blue tooltips" data-original-title="Edit Config" data-configedit="'+encrypt_str(item.alert_level)+'" data-placement="top"> <i class="fa fa-pencil"></i> </button>';

                        configView    += '<button type="button" class="btn btn-blue tooltips '+disableDelete+'" ' + deleteAlert + ' data-original-title="'+toolTip+'" data-placement="top"> <i class="fa fa-trash"></i> </button></td>';
                        sNo++;
                    });

                    configView    += '</tbody></table></div></div></div>';
                }
            }
            else
            {
                configView += '<div class="col-md-12"><img src="components/com_butler/assets/img/no_new_butler_calls.png"><p>&nbsp;</p><p data-notifyMessage>Currently, there are no Text Config available.</p></div>';
            }
            socket.emit('getConfigurations', { 'configView': configView });
        });
    });

    socket.on('getEditZoneView', function(data){
        getEditZoneView(data, function(error, view){
            if(error){  }
            if(view.length)
            {
                var tableView = '';
                var shiftName = '';
                var zoneName = '';
                var zoneid = 0;
                var butlerNameList = [];
                var roomNumbersList = [];
                var roomNumbersArray = [];

                getShifts(function(error, s){
                    s.forEach(function(i){
                        if(shiftName!=i.shift_name)
                        {
                            shiftName = i.shift_name;
                        }

                        tableView += '<tr>';
                        tableView += '<td valign="middle" class="text-center" style="vertical-align: middle;">'+shiftName+'</td>';
                        tableView += '<td><input class="form-control" type="text" name="butler_names_'+i.shift_id+'" data-butlershift="'+i.shift_id+'"></td>';
                        tableView += '</tr>';
                    });

                    view.forEach(function(item){
                        zoneName = item.zone_name;
                        zoneid = item.zone_id;
                        var temp = '';
                        var tempArray = [];

                        if(typeof item.butler_info!=='undefined')
                        {
                            ((item.butler_info).split(';')).forEach(function(b){
                                temp = b.split('%%');
                                tempArray.push({
                                    id: temp[0],
                                    name: temp[1]
                                });
                            });

                            butlerNameList[item.shift_id] = {
                                id: item.shift_id,
                                list: tempArray
                            };

                            temp = item.shift_id;
                        }

                        roomNumbersList = item.key_number;
                    });

                    var roomArray = [];

                    var tempArray = roomNumbersList.split(',');

                    tempArray = tempArray.unique();

                    tempArray.forEach(function(r){
                        roomArray = {
                            id: r,
                            name: 'Room No. ' + r
                        };
                        roomNumbersArray.push(roomArray);
                    });

                    var editZoneView = '<div class="row">';
                    editZoneView += '<div class="col-md-6">';

                    editZoneView += '<label>Name *</label>';
                    editZoneView += '<input class="form-control" type="text" name="edit_zone_name" data-zone="'+encrypt_str(zoneid)+'" value="'+zoneName+'">';
                    editZoneView += '</div>';

                    editZoneView += '<div class="col-md-6">';
                    editZoneView += '<label>Room Numbers *</label>';
                    editZoneView += '<input class="form-control" type="text" name="edit_zone_key_numbers">';
                    editZoneView += '</div>';

                    editZoneView += '<div class="col-md-12">';

                    editZoneView += '<table class="table table-bordered" style="margin-top: 20px;">';
                    editZoneView += '<thead>';

                    editZoneView += '<tr>';
                    editZoneView += '<th class="text-center" width="40%">Shift Name *</th>';
                    editZoneView += '<th class="text-center" width="60%">Associated Butlers</th>';
                    editZoneView += '</tr>';

                    editZoneView += '</thead>';

                    editZoneView += '<tbody>';

                    editZoneView += tableView;

                    editZoneView += '</tbody>';
                    editZoneView += '</table>';

                    editZoneView += '</div>';
                    editZoneView += '</div>';

                    getButlerList(function(err, b){
                        getRoomNoList(data.zoneid, function(err, r){
                            getShifts(function(error, s){
                                socket.emit('getEditZoneView', {
                                        'editZoneView': editZoneView,
                                        'prePopuldate': {
                                            'butlerNameList': butlerNameList,
                                            'roomNumbersList': roomNumbersArray
                                        },
                                        'store': {
                                          'butlerNameList': b,
                                          'roomNumbersList': r,
                                          'shiftList': s
                                        }
                                });
                            });
                        });
                    });

                });
            }
        });
    });

    socket.on('getAddZoneView', function(data){
        getShifts(function(error, view){
            if(error){}
            if(view.length)
            {
                var tableView = '';
                var shiftName = '';
                var zoneName = '';
                var zoneid = 0;
                var butlerNameList = [];
                var roomNumbersList = '';
                var roomNumbersArray = [];

                view.forEach(function(item){
                    if(shiftName!=item.shift_name)
                    {
                        shiftName = item.shift_name;
                    }

                    tableView += '<tr>';
                    tableView += '<td valign="middle" class="text-center" style="vertical-align: middle;">'+shiftName+'</td>';
                    tableView += '<td>';
                    tableView += '<div class="hasInputToken">';
                    tableView += '<input class="form-control" type="text" name="butler_names_'+item.shift_id+'" data-butlershift="'+item.shift_id+'"></td>';
                    tableView += '</div>';
                    tableView += '</tr>';
                });

                var addZoneView = '<div class="row">';
                addZoneView += '<div class="col-md-6">';

                addZoneView += '<label>Name *</label>';
                addZoneView += '<input class="form-control" type="text" name="add_zone_name" onkeypress="return _sC(event)">';
                addZoneView += '</div>';

                addZoneView += '<div class="col-md-6">';
                addZoneView += '<label>Room Numbers *</label>';
                addZoneView += '<div class="hasInputToken">';
                addZoneView += '<input class="form-control" type="text" name="add_zone_key_numbers">';
                addZoneView += '</div>';
                addZoneView += '</div>';

                addZoneView += '<div class="col-md-12">';

                addZoneView += '<table class="table table-bordered" style="margin-top: 20px;">';
                addZoneView += '<thead>';

                addZoneView += '<tr>';
                addZoneView += '<th class="text-center" width="40%">Shift Name *</th>';
                addZoneView += '<th class="text-center" width="60%">Associated Butlers</th>';
                addZoneView += '</tr>';

                addZoneView += '</thead>';

                addZoneView += '<tbody>';

                addZoneView += tableView;

                addZoneView += '</tbody>';
                addZoneView += '</table>';

                addZoneView += '</div>';
                addZoneView += '</div>';
            }
            getButlerList(function(err, b){
                getRoomNoList(null, function(err, r){
                    getShifts(function(error, s){
                        socket.emit('getAddZoneView', {
                                'addZoneView': addZoneView,
                                'store': {
                                  'butlerNameList': b,
                                  'roomNumbersList': r,
                                  'shiftList': s
                                }
                        });
                    });
                });
            });
        });
    });

    socket.on('getAssignEmailsView', function(data){

        getShifts(function(error, shifts){
            getAlertTextConfiguration(function(err, alertLevel){
                getZoneAlertMap(data, function(err, alertMap){
                    if(error){}
                    if(shifts.length)
                    {
                        var tabView = '';
                        var detailView = '';
                        var shiftName = '';
                        var counter = 0;
                        var alertObj = '';
                        var htmlView = '';
                        var activeShift = 'active';
                        var activeContent = 'active in';
                        tabView += '<ul class="nav nav-tabs">';
                        console.log(shifts);
                        shifts.forEach(function(item){
                            if(shiftName!=item.shift_name)
                            {
                                shiftName = item.shift_name;
                            }

                            tabView += '<li class="'+activeShift+'">';
                            tabView += '<a href="#shifttab_1_'+item.shift_id+'" data-toggle="tab">'+shiftName+'</a>';
                            tabView += '</li>';

                            detailView += '<div class="tab-pane fade text-center emailZone '+activeContent+'" id="shifttab_1_'+item.shift_id+'">';

                            if(!counter)
                            {
                                activeShift = '';
                                activeContent = '';
                            }

                            counter++;

                            if(alertMap)
                            {
                                alertMap.forEach(function(al){
                                    var expColTitle = 'expand';
                                    var expColContent = 'collapse';

                                    if(al.shift_id==item.shift_id)
                                    {
                                        if(al.alert_level==0)
                                        {
                                            expColTitle = 'collapse';
                                            expColContent = 'expand';
                                        }

                                        detailView += '<div class="assignEmail">';
                                        detailView += '<div class="portlet">';

                                        detailView += '<div class="portlet-title">';
                                        detailView += '<div class="caption">';
                                        detailView += '<label>Alert Level: '+al.alert_level+'</label>';
                                        detailView += '</div>';
                                        detailView += '<div class="tools">';


                                        detailView += '<a href="javascript:;" class="'+expColTitle+'"></a>';
                                        detailView += '</div>';
                                        detailView += '</div>';

                                        detailView += '<div class="portlet-body '+expColContent+'">';
                                        detailView += '<div class="row">';
                                        detailView += '<div class="col-md-6"><label>Email Address</label>';
                                        detailView += '<input class="form-control" id="assign_email_address_'+al.alert_level+'" value="'+al.mail_ids+'" data-alertlevel="'+al.alert_level+'" data-shiftid="'+item.shift_id+'">';

                                        detailView += '</div>';

                                        detailView += '<div class="col-md-6"><label>SMS numbers</label>';
                                        detailView += '<input class="form-control" id="assign_sms_'+al.alert_level+'" value="'+al.sms_ids+'" data-alertlevel="'+al.alert_level+'" data-shiftid="'+item.shift_id+'">';
                                        detailView += '</div>';
                                        detailView += '</div>';
                                        detailView += '</div>';

                                        detailView += '</div>';
                                        detailView += '</div>';
                                    }
                                });
                            }
                            else
                            {
                                alertLevel.forEach(function(al){
                                    var expColTitle = 'expand';
                                    var expColContent = 'collapse';
                                    detailView += '<div class="assignEmail">';
                                    detailView += '<div class="portlet">';

                                    detailView += '<div class="portlet-title">';
                                    detailView += '<div class="caption">';
                                    detailView += '<label>Alert Level: '+al.alert_level+'</label>';
                                    detailView += '</div>';
                                    detailView += '<div class="tools">';
                                    if(al.alert_level==0)
                                    {
                                        expColTitle = 'collapse';
                                        expColContent = 'expand';
                                    }

                                    detailView += '<a href="javascript:;" class="'+expColTitle+'"></a>';
                                    detailView += '</div>';
                                    detailView += '</div>';

                                    detailView += '<div class="portlet-body '+expColContent+'">';
                                    detailView += '<div class="row">';
                                    detailView += '<div class="col-md-6"><label>Email Address</label>';
                                    detailView += '<input class="form-control" id="assign_email_address_'+al.alert_level+'" data-alertlevel="'+al.alert_level+'" data-shiftid="'+item.shift_id+'">';

                                    detailView += '</div>';

                                    detailView += '<div class="col-md-6"><label>SMS numbers</label>';
                                    detailView += '<input class="form-control" id="assign_sms_'+al.alert_level+'" data-alertlevel="'+al.alert_level+'" data-shiftid="'+item.shift_id+'">';
                                    detailView += '</div>';
                                    detailView += '</div>';
                                    detailView += '</div>';

                                    detailView += '</div>';
                                    detailView += '</div>';
                                });
                            }
                            detailView += '</div>';
                        });

                        tabView += '</ul>';

                        htmlView = tabView + '<div class="tab-content">' + detailView + '</div>';

                        socket.emit('getAssignEmailsView', {
                                'zone_id': data.zone_id,
                                'htmlView': htmlView,
                                'shifts': shifts,
                                'prePopuldate': alertMap
                        });
                    }
                });
            });
        });
    });

    socket.on('getAddShiftView', function(data){
        var addShiftView = '<div class="row">';

        addShiftView += '<div class="col-md-12">';
        addShiftView += '<label>Name *</label>';
        addShiftView += '<input class="form-control" type="text" name="add_shift_name" onkeypress="return _sC(event)">';
        addShiftView += '</div>';

        addShiftView += '<div class="col-md-12">';
        addShiftView += '<label>Shift Start Time *</label>';
        addShiftView += '<input class="form-control" type="text" name="add_shift_start_time" readonly>';
        addShiftView += '</div>';

        addShiftView += '<div class="col-md-12">';
        addShiftView += '<label>Shift End Time *</label>';
        addShiftView += '<input class="form-control" type="text" name="add_shift_end_time" readonly>';
        addShiftView += '</div>';

        addShiftView += '</div>';

        socket.emit('getAddShiftView', { 'addShiftView': addShiftView });
    });

    socket.on('getAddButlerView', function(data){
        var addButlerView = '<div class="row">';

        addButlerView += '<div class="col-md-6">';
        addButlerView += '<label>Butler ID *</label>';
        addButlerView += '<input class="form-control" type="text" name="add_butler_id" onkeypress="return _a(event)">';
        addButlerView += '</div>';

        addButlerView += '<div class="col-md-6">';
        addButlerView += '<label>Name *</label>';
        addButlerView += '<input class="form-control" type="text" name="add_butler_name" onkeypress="return _sC(event)">';
        addButlerView += '</div>';

        addButlerView += '<div class="col-md-6">';
        addButlerView += '<label> Email Address *</label>';
        addButlerView += '<input class="form-control" type="text" name="add_butler_email_address">';
        addButlerView += '</div>';

        addButlerView += '<div class="col-md-6">';
        addButlerView += '<label> SMS Number * (Format: 91xxxxxxxxxx)</label>';
        addButlerView += '<input class="form-control" type="text" name="add_butler_sms_number" onkeypress="return _pH(event)">';
        addButlerView += '</div>';

        addButlerView += '</div>';

        socket.emit('getAddButlerView', { 'addButlerView': addButlerView });
    });

    socket.on('getAddLevelView', function(data){

        getAddLevel(data, function(error, view){
            if(error){}
            var levelid = 1;
            if(view.length)
            {
                view = view[0];
                if(view.level_of_alert)
                {
                    levelid = parseInt(view.level_of_alert) + 1;
                }
            }

            var addLevelView = '<div class="row">';

            addLevelView += '<div class="col-md-6">';
            addLevelView += '<label>Alert Level *</label>';
            addLevelView += '<input class="form-control" type="text" name="add_level_name" value="'+levelid+'" readonly>';
            addLevelView += '</div>';

            addLevelView += '<div class="col-md-6">';
            addLevelView += '<label> Time Limit *</label>';
            addLevelView += '<input class="form-control" type="text" name="add_level_time_limit" value="" onkeypress="return numbersOnly(event)">';
            addLevelView += '</div>';

            addLevelView += '<div class="col-md-6">';
            addLevelView += '<label> Alert Color *</label>';
            addLevelView += '<input class="form-control jscolor" type="text" name="add_level_color" value="">';
            addLevelView += '</div>';

            addLevelView += '</div>';

            socket.emit('getAddLevelView', { 'addLevelView': addLevelView, 'level_id': levelid });
        });
    });

    socket.on('getAddTextConfigView', function(data){

        getAddLevel(data, function(error, view){
            if(error){  }
            var levelid = 1;
            if(view.length)
            {
                view = view[0];
                if(view.level_of_alert)
                {
                    levelid = parseInt(view.level_of_alert) + 1;
                }

                var addTextConfigView = '<div class="row">';

                addTextConfigView += '<div class="col-md-6">';
                addTextConfigView += '<label>Alert Level *</label>';
                addTextConfigView += '<input class="form-control" type="text" name="add_level_name" value="'+levelid+'" readonly>';
                addTextConfigView += '</div>';

                addTextConfigView += '<div class="col-md-6">';
                addTextConfigView += '<label> Mail Subject *</label>';
                addTextConfigView += '<textarea class="form-control" rows="4" name="add_mail_subject"></textarea>';
                addTextConfigView += '</div>';

                addTextConfigView += '<div class="col-md-6">';
                addTextConfigView += '<label> Mail Body *</label>';
                addTextConfigView += '<textarea class="form-control" rows="4" name="add_mail_body"></textarea>';
                addTextConfigView += '</div>';

                addTextConfigView += '<div class="col-md-6">';
                addTextConfigView += '<label> SMS Body *</label>';
                addTextConfigView += '<textarea class="form-control" rows="4" name="add_sms_body"></textarea>';
                addTextConfigView += '</div>';

                addTextConfigView += '</div>';
            }

            socket.emit('getAddTextConfigView', { 'addTextConfigView': addTextConfigView, 'level_id': levelid });
        });
    });

    socket.on('getEditButlerView', function(data){
        getEditButler(data, function(error, view){
            if(error){  }
            if(view.length)
            {
                var tableView = '';
                var shiftName = '';
                var zoneName = '';
                var shiftNameList = [];
                var zoneNameList = [];
                var butlerId = '';
                var butlerInfoId = '';
                var butlerAppUsersId = '';
                view = view[0];

                /*((view.shift_info).split(';')).forEach(function(s){
                    var tempS = s.split('%%');
                    shiftNameList.push({
                        id: tempS[0],
                        name: tempS[1]
                    });
                });

                ((view.zone_info).split(';')).forEach(function(z){
                    var tempZ = z.split('%%');
                    zoneNameList.push({
                        id: tempZ[0],
                        name: tempZ[1]
                    });
                });*/

                var editButlerView = '<div class="row">';

                editButlerView += '<div class="col-md-6">';
                editButlerView += '<label>Name *</label>';
                editButlerView += '<input class="form-control" type="text" name="edit_butler_name" value="'+view.butler_name+'" onkeypress="return _sC(event)">';
                editButlerView += '</div>';

                editButlerView += '<div class="col-md-6">';
                editButlerView += '<label> Email Address *</label>';
                editButlerView += '<input class="form-control" type="text" name="edit_butler_email_address" value="'+view.butler_email+'">';
                editButlerView += '</div>';

                editButlerView += '<div class="col-md-6">';
                editButlerView += '<label> SMS Number * (Format: 91xxxxxxxxxx)</label>';
                editButlerView += '<input class="form-control" type="text" name="edit_butler_email_sms_number" value="'+view.butler_sms_number+'">';
                editButlerView += '</div>';

                /*editButlerView += '<div class="col-md-6">';
                editButlerView += '<label> Shifts </label>';
                editButlerView += '<input class="form-control" type="text" name="edit_butler_shifts">';
                editButlerView += '</div>';

                editButlerView += '<div class="col-md-6">';
                editButlerView += '<label> Zones </label>';
                editButlerView += '<input class="form-control" type="text" name="edit_butler_zones">';
                editButlerView += '</div>';*/

                editButlerView += '</div>';

                butlerId = view.butler_id;
                butlerInfoId = view.butler_info_id;
                butlerAppUsersId = view.butler_app_users_id;
            }

            getShiftList(function(err, s){
                getZoneList(function(err, z){
                    socket.emit('getEditButlerView', {
                        'editButlerView': editButlerView,
                        'prePopuldate': {
                            'shiftNameList': shiftNameList,
                            'zoneNameList': zoneNameList
                        },
                        'store': {
                          'shiftNameList': s,
                          'zoneNameList': z
                        },
                        'butlerId': butlerId,
                        'butlerInfoId': butlerInfoId,
                        'butlerAppUsersId': butlerAppUsersId
                    });
                });
            });
        });
    });

    socket.on('getEditShiftView', function(data){
        getEditShiftView(data, function(error, view){
            if(error){  }
            if(view.length)
            {
                view = view[0];
                var editShiftView = '<div class="row">';

                editShiftView += '<div class="col-md-12">';
                editShiftView += '<label>Name *</label>';
                editShiftView += '<input class="form-control" type="text" name="edit_shift_name" value="'+view.shift_name+'">';
                editShiftView += '</div>';

                editShiftView += '<div class="col-md-12">';
                editShiftView += '<label>Shift Start Time *</label>';
                editShiftView += '<input class="form-control" type="text" name="edit_shift_start_time" value="'+view.time_start+'">';
                editShiftView += '</div>';

                editShiftView += '<div class="col-md-12">';
                editShiftView += '<label>Shift End Time *</label>';
                editShiftView += '<input class="form-control" type="text" name="edit_shift_end_time"  value="'+view.time_end+'">';
                editShiftView += '</div>';

                editShiftView += '</div>';

                socket.emit('getEditShiftView', { 'editShiftView': editShiftView, 'shift_id': view.shift_id });
            }
        });
    });

    socket.on('getButlerStats', function(data){
        getButlerStats(function(error, stats){
            if(error){  }


            if(stats.length)
            {
                typeof stats[0]!=='undefined' ? stats = stats[0] : '' ;

                var zc = parseInt(stats.zonecount) || 0;
                var sc = parseInt(stats.shiftcount) || 0;
                var bc = parseInt(stats.butlercount) || 0;
                socket.emit('getButlerStats', { 'butlerStats': { 'zonecount': '<span style="font-size: 11px;">(Number of Zones) </span>' +  zc, 'shiftcount':  '<span style="font-size: 11px;">(Number of Shifts) </span>' + sc, 'butlercount': '<span style="font-size: 11px;">(Number of Butlers) </span>' + bc }  });
            }
        });
    });

    socket.on('saveEditedZoneView', function(data){
        saveEditedZoneView(data, function(error, response){
            if(error){}
            if(response)
            {
                //butlerApp.sendInfo('editzone', data);
                socket.emit('saveEditedZoneView', { 'res': 1 });
            }
        });
    });

    socket.on('saveAddZoneView', function(data){
        saveAddZoneView(data, function(error, response){
            if(error){}
            if(response)
            {
                //butlerApp.sendInfo('addzone', data);
                socket.emit('saveAddZoneView', { 'res': 1 });
            }
        });
    });

    socket.on('saveAddShiftView', function(data){
        saveAddShiftView(data, function(error, response){
            if(error){}
            if(response)
            {
                //butlerApp.sendInfo('addshift', data);
                socket.emit('saveAddShiftView', { 'res': 1 });
            }
        });
    });

    socket.on('saveAddButlerView', function(data){
        saveAddButlerView(data, function(error, response){
            if(error){}
            if(response)
            {
                socket.emit('saveAddButlerView', { 'res': 1 });
            }
        });
    });

    socket.on('saveAddLevelView', function(data){
        saveAddLevelView(data, function(error, response){
            if(error){}
            if(response)
            {
                butlerApp.getAlertsInfo(function(err, ai){
                    if(ai)
                    {
                        butlerApp._sendPN('alert_level_change', ai);
                    }
                });

                socket.emit('saveAddLevelView', { 'res': 1 });
            }
        });
    });

    socket.on('saveAddTextConfigView', function(data){
        saveAddTextConfigView(data, function(error, response){
            if(error){}
            if(response)
            {
                socket.emit('saveAddTextConfigView', { 'res': 1 });
            }
        });
    });

    socket.on('saveEditedButlerView', function(data){
        saveEditedButlerView(data, function(error, response){
            if(error){}
            if(response)
            {
                console.log('save edited butler view');
                //butlerApp.sendInfo('editbutler', data);
                socket.emit('saveEditedButlerView', { 'res': 1 });
            }
        });
    });

    socket.on('saveEditedShiftView', function(data){
        saveEditedShiftView(data, function(error, response){
            if(error){}
            if(response)
            {
                //butlerApp.sendInfo('editshift', data);
                socket.emit('saveEditedShiftView', { 'res': 1 });
            }
        });
    });

    socket.on('saveEditRemark', function(data){
        saveEditRemark(data, function(error, response){
            if(error){}
            if(response)
            {
                socket.emit('saveEditRemark', { 'res': 1 });
            }
        });
    });

    socket.on('saveEditedLevelView', function(data){
        saveEditedLevelView(data, function(error, response){
            if(error){}
            if(response)
            {
                butlerApp.getAlertsInfo(function(err, ai){
                    if(ai)
                    {
                        butlerApp._sendPN('alert_level_change', ai);
                    }
                });
                socket.emit('saveEditedLevelView', { 'res': 1 });
            }
        });
    });

    socket.on('saveEditedTextConfigView', function(data){
        saveEditedTextConfigView(data, function(error, response){
            if(error){}
            if(response)
            {
                socket.emit('saveEditedTextConfigView', { 'res': 1 });
            }
        });
    });

    socket.on('isButlerIdAlreadyExist', function(data){
        if(data.butlerid)
        {
            isButlerIdAlreadyExist(data.butlerid, function(err, res){
                res = res[0];
                socket.emit('isButlerIdAlreadyExist', { 'res': res.butlerexist });
            });
        }
    });

    socket.on('getDeleteZoneView', function(data){
        var zoneid = decrypt_str(data.zoneid);
        if(zoneid)
        {
            var zoneName = '';
            getDeleteZoneView(data, function(error, res){
            if(error){  }

            if(res.length)
            {
                res = res[0];
                if(res.zone_room_count)
                {
                    var deleteZoneView = '<div class="row">';

                    deleteZoneView += '<div class="col-md-12">';
                    deleteZoneView += '<p>This Zone is having <b>' + res.zone_room_count + ' ROOM(s)</b> as TOTAL ASSIGNED. Do you want to <b>Move the Zone</b> to other zone OR <b>Delete it Completely</b> with data. ?</p>';
                    deleteZoneView += '</div>';

                    deleteZoneView += '<div class="col-md-12">&nbsp;</div>';

                    deleteZoneView += '<div class="col-md-6 text-center vcenter">';
                    deleteZoneView += 'Move to';
                    deleteZoneView += '</div>';

                    deleteZoneView += '<div class="col-md-6">';

                    getZoneNames(function(err, z){
                        var arr = [];
                        if( ( z.length - 1 ) > 0)
                        {
                            deleteZoneView += '<select class="select form-control" data-selectZone>';
                            deleteZoneView += '<option value="">Select a Zone</option>';
                            z.forEach(function(item){
                                if(item.butler_zones_master_id!=zoneid)
                                {
                                    deleteZoneView += '<option value="'+encrypt_str(item.butler_zones_master_id)+'">' + item.zone_name + '</option>';
                                }
                                else
                                {
                                    zoneName = item.zone_name;
                                }
                            });

                            deleteZoneView += '</select>';
                        }
                        else
                        {
                            deleteZoneView += 'No other Zone available to move.';
                        }

                        deleteZoneView += '</div>';
                        socket.emit('getDeleteZoneView', { 'deleteZoneView': deleteZoneView, 'zoneid': encrypt_str(zoneid), 'zonename': zoneName });
                    });
                }
            }
        });
        }
    });

    socket.on('deleteZoneAction', function(d){
        var obj = JSON.parse(d.dataPacket);
        if(obj.moveZone)
        {
            moveZone(obj, function(err, res){
                socket.emit('deleteZoneAction', { 'actionObj': 'moveZone', 'res': res });
            });
        }
        else if(obj.deletepermanently)
        {
            deleteZonePermanently(obj, function(err, res){
                socket.emit('deleteZoneAction', { 'actionObj': 'deletepermanently', 'res': res });
            });
        }
    });

    socket.on('getDeleteButlerView', function(data){
        var deleteButlerView = '<div class="row">';

        deleteButlerView += '<div class="col-md-12">';
        deleteButlerView += '<p>Do you want to delete this Butler ?</p>';
        deleteButlerView += '</div>';

        socket.emit('getDeleteButlerView', { 'deleteButlerView': deleteButlerView, 'butlerId': data.butlerid });
    });

    socket.on('getDeleteLevelView', function(data){
        var deleteLevelView = '<div class="row">';

        deleteLevelView += '<div class="col-md-12">';
        deleteLevelView += '<p>Do you want to delete this Level ?</p>';
        deleteLevelView += '</div>';

        socket.emit('getDeleteLevelView', { 'deleteLevelView': deleteLevelView, 'levelid': data.levelid });
    });

    socket.on('getDeleteTextConfigView', function(data){
        var deleteTextConfigView = '<div class="row">';

        deleteTextConfigView += '<div class="col-md-12">';
        deleteTextConfigView += '<p>Do you want to delete this Text Config ?</p>';
        deleteTextConfigView += '</div>';

        socket.emit('getDeleteTextConfigView', { 'deleteTextConfigView': deleteTextConfigView, 'levelid': data.levelid });
    });

    socket.on('deleteAButler', function(data){
        var data = JSON.parse(data.dataPacket);

        deleteAButler(data, function(err, r){
            if(r)
            {
                socket.emit('butlerDeleted', { 'res': 1 });
            }
            else
            {
                socket.emit('butlerDeleted', { 'res': 0, 'responseText': err });
            }
        });
    });

    socket.on('deleteALevel', function(data){
        var data = JSON.parse(data.dataPacket);

        deleteALevel(data, function(err, res){
            if(res)
            {
                butlerApp.getAlertsInfo(function(err, ai){
                    if(ai)
                    {
                        butlerApp._sendPN('alert_level_change', ai);
                    }
                });
                socket.emit('levelDeleted', { 'res': 1 });
            }
        });
    });

    socket.on('deleteATextConfig', function(data){
        var data = JSON.parse(data.dataPacket);

        deleteATextConfig(data, function(err, res){
            if(res)
            {
                socket.emit('textConfigDeleted', { 'res': 1 });
            }
        });
    });

    socket.on('getDeleteShiftView', function(data){
        var deleteShiftView = '<div class="row">';

        deleteShiftView += '<div class="col-md-12">';
        deleteShiftView += '<p>Do you want to delete this Shift ?</p>';
        deleteShiftView += '</div>';

        socket.emit('getDeleteShiftView', { 'deleteShiftView': deleteShiftView, 'shiftId': data.shiftid });
    });

    socket.on('deleteAShift', function(data){
        var data = JSON.parse(data.dataPacket);

        deleteAShift(data, function(err, res){
            if(res)
            {
                socket.emit('shiftDeleted', { 'res': 1 });
            }
            else
            {
                 socket.emit('shiftDeleted', { 'res': 0 });
            }
        });
    });

    socket.on('getEditLevelView', function(data){

        getEditLevel(data, function(error, view){
            if(error){  }
            if(view.length)
            {
                view = view[0];

                var editLevelView = '<div class="row">';

                editLevelView += '<div class="col-md-6">';
                editLevelView += '<label>Alert Level *</label>';
                editLevelView += '<input class="form-control" type="text" name="edit_level_name" value="'+view.level_of_alert+'" readonly>';
                editLevelView += '</div>';

                editLevelView += '<div class="col-md-6">';
                editLevelView += '<label> Time Limit *</label>';
                editLevelView += '<input class="form-control" type="text" name="edit_level_time_limit" value="'+view.time_limit+'" onkeypress="return numbersOnly(event)">';
                editLevelView += '</div>';

                editLevelView += '<div class="col-md-6">';
                editLevelView += '<label> Alert Color *</label>';
                editLevelView += '<input class="form-control jscolor" type="text" name="edit_level_color" value="'+view.alert_bg_color+'">';
                editLevelView += '</div>';

                editLevelView += '</div>';
            }
            socket.emit('getEditLevelView', { 'editLevelView': editLevelView, 'level_id': view.level_of_alert });
        });
    });

    socket.on('getEditTextConfigView', function(data){
        getTextConfig(data, function(error, view){
            if(error){  }
            if(view.length)
            {
                view = view[0];

                var editTextConfigView = '<div class="row">';

                editTextConfigView += '<div class="col-md-6">';
                editTextConfigView += '<label>Alert Level *</label>';
                editTextConfigView += '<input class="form-control" type="text" name="edit_level_name" value="'+view.alert_level+'" readonly>';
                editTextConfigView += '</div>';

                editTextConfigView += '<div class="col-md-6">';
                editTextConfigView += '<label> Mail Subject *</label>';
                editTextConfigView += '<textarea class="form-control" rows="4" name="edit_mail_subject">'+view.mail_subject+'</textarea>';
                editTextConfigView += '</div>';

                editTextConfigView += '<div class="col-md-6">';
                editTextConfigView += '<label> Mail Body *</label>';
                editTextConfigView += '<textarea class="form-control" rows="4" name="edit_mail_body">'+view.mail_text+'</textarea>';
                editTextConfigView += '</div>';

                editTextConfigView += '<div class="col-md-6">';
                editTextConfigView += '<label> SMS Body *</label>';
                editTextConfigView += '<textarea class="form-control" rows="4" name="edit_sms_body">'+view.sms_text+'</textarea>';
                editTextConfigView += '</div>';

                editTextConfigView += '</div>';
            }

            socket.emit('getEditTextConfigView', { 'editTextConfigView': editTextConfigView, 'level_id': view.alert_level });
        });
    });

    socket.on('saveAssignedEmailsAndSMSView', function(data){
        processSaveAssignedEmailsAndSMS(data, function(res){
            socket.emit('saveAssignedEmailsAndSMSView', {});
        });
    });

    socket.on('saveMobileAppUser', function(data){
        var data = JSON.parse(data.dataPacket);
        if(data.mode=='add')
        {
            checkButlerAppUsernameDuplicacy(data, function(e, d){
                if(d)
                {
                    processSaveMobileAppUser(data, function(err, r){
                        if(r)
                        {
                            socket.emit('saveMobileAppUser', { 'res': 1, 'resText': 'Mobile App user created successfully.' });
                        }
                    });
                }
                else
                {
                    socket.emit('saveMobileAppUser', { 'res': 0, 'resText': 'Username already exist.' });
                }
            });
        }
        else if(data.mode=='edit')
        {
            processSaveMobileAppUser(data, function(err, r){
                if(r)
                {
                    socket.emit('saveMobileAppUser', { 'res': 1, 'resText': 'Mobile App user updated successfully.' });
                }
            });
        }
    });

    socket.on('getMobileAppView', function(data){

        getMobileAppView(data, function(err, r){
            var mobileAppView = '<ul class="nav nav-tabs">';
            mobileAppView += '<li class="active">';
            mobileAppView += '<a href="#tab_1" data-toggle="tab">User Info</a>';
            mobileAppView += '</li>';
            mobileAppView += '<li>';
            mobileAppView += '<a href="#tab_2" data-toggle="tab">User Devices</a>';
            mobileAppView += '</li>';
            mobileAppView += '</ul>';

            var username    = '';
            var password    = '';
            var butlername  = '';
            var butlerid    = '';
            var active      = '';
            var mode        = 'add';
            var inactive    = 'checked';
            var disabled    = '';
            var hide        = '';
            var butlerinfoid = '';
            var butlerappusersid = '';

            if(r)
            {
                console.log(r);
                if(r.length)
                {
                    var userinfo = r[0];
                    username    = userinfo.username ? userinfo.username : '';
                    password    = userinfo.username ? '******': '';
                    butlername  = userinfo.butler_name;
                    butlerid    = userinfo.butler_id;
                    disabled    = userinfo.username ? 'disabled': '';
                    hide        = userinfo.username ? 'hide' : '';
                    status      = userinfo.is_active ? userinfo.is_active : 0;
                    mode        = userinfo.username ? 'edit' : 'add';
                    butlerinfoid = userinfo.butler_info_id;
                    butlerappusersid = userinfo.butler_app_users_id;

                    if(userinfo.is_active)
                    {
                        active = 'checked';
                        inactive = '';
                    }
                }
            }

            mobileAppView += '<div class="tab-content">';
            mobileAppView += '<div class="tab-pane fade text-center active in" id="tab_1">';
            mobileAppView += '<div class="manage-butler">';
            mobileAppView += '<div class="row">';
            mobileAppView += '<div class="col-md-3 text-left">';
            mobileAppView += '<label>Username*</label>';
            mobileAppView += '</div>';
            mobileAppView += '<div class="col-md-6">';
            mobileAppView += '<input class="form-control" '+disabled+' name="app_username" value="'+username+'" onpaste="return false;" onkeypress="return _a(event)" type="text">';
            mobileAppView += '</div>';

            if(disabled)
            {
                mobileAppView += '<div class="col-md-3 text-left"><span class="change-butler-details text-primary" data-changeappusername>Change Username</span>';
                mobileAppView += '</div>';
            }

            mobileAppView += '</div>';
            mobileAppView += '<div class="row">';
            mobileAppView += '<div class="col-md-3 text-left">';
            mobileAppView += '<label>Password*</label>';
            mobileAppView += '</div>';
            mobileAppView += '<div class="col-md-6">';
            mobileAppView += '<input class="form-control" '+disabled+' value="'+password+'" name="app_password" onpaste="return false;" onkeypress="return _a(event)" type="password">';
            mobileAppView += '</div>';

            if(disabled)
            {
                mobileAppView += '<div class="col-md-3 text-left"><span class="change-butler-details text-primary" data-changeapppassword>Change Password</span>';
                mobileAppView += '</div>';
            }

            mobileAppView += '</div>';
            mobileAppView += '<div class="row">';
            mobileAppView += '<div class="col-md-3 text-left">';
            mobileAppView += '<label>Confirm Password*</label>';
            mobileAppView += '</div>';
            mobileAppView += '<div class="col-md-6">';
            mobileAppView += '<input class="form-control" '+disabled+' value="'+password+'" name="app_confirm_password" onpaste="return false;" onkeypress="return _a(event)" type="password">';
            mobileAppView += '</div>';
            mobileAppView += '</div>';
            mobileAppView += '<div class="row">';
            mobileAppView += '<div class="col-md-3 text-left">';
            mobileAppView += '<label>Status</label>';
            mobileAppView += '</div>';
            mobileAppView += '<div class="col-md-6 text-left">';
            mobileAppView += '<label class="col-md-4"><input type="radio" name="user_status" '+active+' value="1"> Active </label>';
            mobileAppView += '<label class="col-md-4"><input type="radio" name="user_status" '+inactive+' value="0"> Inactive </label>';
            mobileAppView += '</div>';
            mobileAppView += '</div>';

            mobileAppView += '</div>';
            mobileAppView += '</div>';

            mobileAppView += '<div class="tab-pane fade text-center" id="tab_2">';
            mobileAppView += '<div class="row">';
            mobileAppView += '<div class="col-sm-12">';

            var androidView = '';
            var iosView = '';
            var a=0,b=0;
            if(r)
            {
                if(r.length)
                {
                    r.forEach(function(item){
                        var _d = decrypt_str(item.device_info);
                        if(_d)
                        {
                            _d = JSON.parse(_d);
                            if(item.device_type=='android')
                            {
                                a++;
                                androidView += '<tr id="2" data-defaulttype="0">';
                                androidView += '<td class="text-center all_letter">'+a+'</td>';
                                androidView += '<td>'+ _d.brandName + ' ' + _d.phoneModal +'</td>';
                                androidView += '<td class="text-center">';
                                if(r.status)
                                {
                                    androidView += 'Active';
                                }
                                else
                                {
                                    androidView += 'Inactive';
                                }
                                androidView += '</td>';
                                androidView += '<td class="text-center">'+moment(item.last_login).format("MMM Do, YYYY - H:mm A")+'</td>';
                                androidView += '</tr>';
                            }
                            else if(item.device_type=='ios')
                            {
                                b++
                                iosView += '<tr id="2" data-defaulttype="0">';
                                iosView += '<td class="text-center all_letter">'+b+'</td>';
                                iosView += '<td>'+ _d.brandName + ' ' + _d.phoneModal +'</td>';
                                iosView += '<td class="text-center">';
                                if(r.status)
                                {
                                    iosView += 'Active';
                                }
                                else
                                {
                                    iosView += 'Inactive';
                                }
                                iosView += '</td>';
                                iosView += '<td class="text-center">'+moment(item.last_login).format("MMM Do, YYYY - H:mm A")+'</td>';
                                iosView += '</tr>';
                            }
                        }
                    });

                    if(androidView)
                    {
                        mobileAppView += '<h5 class="align-l">Android Devices</h5>';
                        mobileAppView += '<table class="table table-bordered table-hover">';
                        mobileAppView += '<thead>';
                        mobileAppView += '<tr class="heading">';
                        mobileAppView += '<th class="text-center" width="3%">#</th>';
                        mobileAppView += '<th width="20%" class="text-center">Device Name</th>';
                        mobileAppView += '<th class="text-center" width="10%">Status</th>';
                        mobileAppView += '<th class="text-center" width="10%">Last Login</th>';
                        mobileAppView += '</tr>';
                        mobileAppView += '</thead>';
                        mobileAppView += '<tbody id="letter_body" class="letterBody1">';
                        mobileAppView += androidView;
                        mobileAppView += '</tbody>';
                        mobileAppView += '</table>';
                        mobileAppView += '</div>';
                    }
                    if(iosView)
                    {
                        mobileAppView += '<div class="col-sm-12">';
                        mobileAppView += '<h5 class="align-l">iPhone Devices</h5>';
                        mobileAppView += '<table class="table table-bordered table-hover">';
                        mobileAppView += '<thead>';
                        mobileAppView += '<tr class="heading">';
                        mobileAppView += '<th class="text-center" width="3%">#</th>';
                        mobileAppView += '<th width="20%" class="text-center">Device Name</th>';
                        mobileAppView += '<th class="text-center" width="10%">Push</th>';
                        mobileAppView += '<th class="text-center" width="10%">Last Login</th>';
                        mobileAppView += '</tr>';
                        mobileAppView += '</thead>';
                        mobileAppView += '<tbody id="letter_body" class="letterBody1">';
                        mobileAppView += iosView;
                        mobileAppView += '</tbody>';
                        mobileAppView += '</table>';
                        mobileAppView += '</div>';
                    }
                }
            }

            mobileAppView += '</div>';
            mobileAppView += '</div>';
            socket.emit('getMobileAppView', { 'mobileAppView': mobileAppView, 'username': username, 'butlerid': butlerid, 'butlername': butlername, 'mode': mode, 'butlerinfoid': butlerinfoid, 'butlerappusersid': butlerappusersid });
        });
    });
});

function processSaveMobileAppUser(data, callback)
{
    var username = data.app_username;
    var password = data.app_password;
    var isactive = parseInt(data.app_status);

    if(data.mode=='edit')
    {
        var querystring = '';
        if(typeof username!=='undefined')
        {
            querystring += 'username="'+username+'",';
        }
        if(typeof password!=='undefined')
        {
            querystring += 'password="'+md5(password)+'",';
        }
        if(typeof isactive!=='undefined')
        {
            querystring += 'is_active="'+isactive+'"';
        }
        querystring = querystring.replace(/,\s*$/, "");

        connection.query('update butler_app_users set '+querystring+' where butler_app_users_id="'+data.butlerappusersid+'"', function(err, rows, fields) {
            if (err) throw err;
            if(rows.affectedRows)
            {
                if(typeof isactive!=='undefined')
                {
                    if(!isactive)
                    {
                        butlerApp._logoutDevices(data.butlerappusersid, function(err, r){
                            butlerApp._sendPN('logout_devices', r);
                        });
                    }
                }

                callback(null, true);
            }
            else
            {
                callback(null, false);
            }
        });
    }
    else if(data.mode=='add')
    {
        connection.query('insert into butler_app_users(username, password, is_active) values("'+username+'", "'+md5(password)+'", "'+isactive+'")', function(err, rows, fields) {
            if (err) throw err;

            if(rows.insertId)
            {
                connection.query('update butler_info set butler_app_users_id="'+rows.insertId+'" where butler_info_id="'+data.butlerinfoid+'"', function(err, rows, fields) {
                    if (err) throw err;

                    if(rows.affectedRows)
                    {
                        callback(null, true);
                    }
                    else
                    {
                        callback('Not able to update butler app users id', null);
                    }
                });
            }
            else
            {
                callback(null, false);
            }
        });
    }
}

function loadButlerZoneAlertMap(mode, shiftid, zoneid)
{
    if(mode=='addzone')
    {
        getShifts(function(e, s){
            s.forEach(function(si){
                getAlertTextConfiguration(function(err, a){
                    a.forEach(function(ai){
                        connection.query('call butler_alert_emails_sms("'+zoneid+'", "'+si.shift_id+'", "'+ai.alert_level+'", "", "");', function(err, rows, fields) {
                            if (err) throw err;
                        });
                    });
                });
            });
        });
    }

    if(mode=='addshift')
    {
        getZoneNames(function(e, z){
            z.forEach(function(zi){
                getAlertTextConfiguration(function(err, a){
                    a.forEach(function(ai){
                        connection.query('call butler_alert_emails_sms("'+zi.butler_zones_master_id+'", "'+shiftid+'", "'+ai.alert_level+'", "", "");', function(err, rows, fields) {
                            if (err) throw err;
                        });
                    });
                });
            });
        });
    }
    else if(mode=='deleteshift')
    {
        connection.query('delete from butler_zone_alert_map where shift_id="'+shiftid+'"', function(err, rows, fields) {
            if (err) throw err;
        });
    }
    else if(mode=='deletezone')
    {
        connection.query('delete from butler_zone_alert_map where zone_id="'+zoneid+'"', function(err, rows, fields) {
            if (err) throw err;
        });
    }
}

function checkButlerAppUsernameDuplicacy(data, callback)
{
    console.log('select username from butler_app_users where username="'+data.app_username+'"');
    connection.query('select username from butler_app_users where username="'+data.app_username+'"', function(err, rows, fields) {
        if (err) throw err;
        console.log(rows);
        if(rows.length > 0)
        {
            callback(null, false);
        }
        else
        {
            callback(null, true);
        }
    });
}

function getMobileAppView(d, callback)
{
    var _bi = decrypt_str(d.butler_info_id);
    if(_bi)
    {
        connection.query('select bi.butler_app_users_id, bi.butler_name, bi.butler_info_id, bi.butler_id, bau.username, bau.is_active, baad.push_notifications, baad.last_login, baad.device_type, baad.device_info, baad.device_type, baad.last_login from butler_info as bi left join butler_app_users as bau on bi.butler_app_users_id=bau.butler_app_users_id left join butler_app_active_devices as baad on baad.butler_app_users_id=bau.butler_app_users_id where bi.butler_info_id="'+_bi+'" order by baad.last_login', function(err, rows, fields) {
            if (err) throw err;
            console.log(rows);
            if(rows.length > 0)
            {
                callback(null, rows);
            }
            else
            {
                callback('No mobile users configured for this butler yet.', null);
            }
        });
    }
}



function processSaveAssignedEmailsAndSMS(data, callback)
{
    var _d = data._d;
    var _z = decrypt_str(data._z);

    if(_z)
    {
        var querystring = '';
        var _c = [];

        _d.forEach(function(i){
            (i.data).forEach(function(ii){
                querystring += 'call butler_alert_emails_sms("'+_z+'", "'+i.shift_id+'", "'+ii.alert_level+'", "'+ii.email_list+'", "'+ii.sms_list+'");';
            });
        });
        connection.query(querystring, function(err, rows, fields) {
            if (err) throw err;
            callback(null, 1);
        });
    }
}

function getEditLevel(data, callback)
{
    var alertLevel = decrypt_str(data.alertLevel);
    if(alertLevel)
    {
        connection.query('SELECT * FROM butler_alert_time_map WHERE level_of_alert="'+alertLevel+'"', function(err, rows, fields) {
            if (err) throw err;
            if(rows.length > 0)
            {
                callback(null, rows);
            }
            else
            {
                callback('No Alert Level defined till yet.', null);
            }
        });
    }
}

function getTextConfig(data, callback)
{
    var alertLevel = decrypt_str(data.alertLevel);
    if(alertLevel)
    {
        connection.query('SELECT * FROM butler_alert_text_configuration WHERE alert_level="'+alertLevel+'"', function(err, rows, fields) {
            if (err) throw err;
            if(rows.length > 0)
            {
                callback(null, rows);
            }
            else
            {
                callback('No Alert Level defined till yet.', null);
            }
        });
    }
}

function getAddLevel(data, callback)
{
     connection.query('SELECT max(level_of_alert) as level_of_alert FROM butler_alert_time_map', function(err, rows, fields) {
        if (err) throw err;
        if(rows.length > 0)
        {
            callback(null, rows);
        }
        else
        {
            callback('No Alert Level defined till yet.', null);
        }
    });
}

function getConfigurations(callback)
{
    getAlertMap(function(err, data){
        getAlertTextConfiguration(function(e, d){
            callback(null, data, d);
        });
    });
}

function getAlertMap(callback)
{
    connection.query('SELECT * FROM butler_alert_time_map ORDER BY level_of_alert ASC', function(err, rows, fields) {
        if (err) throw err;
        if(rows.length > 0)
        {
            callback(null, rows);
        }
        else
        {
            callback('No Alert Level defined till yet.', null);
        }
    });
}

function getAlertTextConfiguration(callback)
{
    connection.query('SELECT * FROM butler_alert_text_configuration', function(err, rows, fields) {
        if (err) throw err;
        if(rows.length > 0)
        {
            callback(null, rows);
        }
        else
        {
            callback('No Alert Text Configurations defined till yet.', null);
        }
    });
}

function getZoneAlertMap(data, callback)
{
    var zoneid = decrypt_str(data.zone_id);
    if(zoneid)
    {
        connection.query('SELECT * FROM butler_zone_alert_map WHERE zone_id="'+zoneid+'" ORDER BY alert_level ASC, zone_id ASC, shift_id ASC', function(err, rows, fields) {
            if (err) throw err;
            if(rows.length > 0)
            {
                callback(null, rows);
            }
            else
            {
                callback('No Alert Emails and SMS Configurations defined till yet.', null);
            }
        });
    }
    else
    {
        callback('Invalid Zone ID for fetching zone alert map', null);
    }
}

function deleteAButler(data, callback)
{
    var butlerid = decrypt_str(data.butlerid);
    if(butlerid)
    {
        connection.query('SELECT * FROM `butler_request_map` WHERE butler_info_id="'+butlerid+'" AND resolution_time IS NULL', function(err, rows, fields) {
                if(rows.length > 0)
                {
                    callback('This butler is currently serving the request. You cannot delete the butler right now.', null);
                }
                else if(rows.length == 0)
                {
                    connection.query('UPDATE `butler_info` SET is_deleted=1 WHERE butler_info_id="'+butlerid+'"', function(err, rows, fields) {
                        if (err) throw err;
                        if(rows.affectedRows)
                        {
                            getZoneViaButler(butlerid, function(err, res){
                                if(res.length > 0)
                                {
                                    var zoneIdArray = [];
                                    res.forEach(function(item){
                                        zoneIdArray.push(item.zone_id);
                                    });
                                    /*connection.query('DELETE FROM `butler_shift_map` WHERE butler_info_id="'+butlerid+'"', function(err, rows, fields) {
                                        if (err) throw err;
                                        if(zoneIdArray.length > 0)
                                        {

                                        }
                                        else
                                        {
                                            callback(null, 1);
                                        }
                                    });*/
                                    checkForEmptyZones(zoneIdArray, function(error, r){
                                        callback(null, 1);
                                    });
                                }
                                else
                                {
                                    callback(null, 1);
                                }
                            });
                        }
                    });
                }
                else
                {
                    callback('Some error occured in deleting a butler', null);
                }
        });
    }
}

function deleteALevel(data, callback)
{
    var levelid = decrypt_str(data.levelid);
    if(levelid)
    {
        connection.query('DELETE FROM butler_alert_time_map WHERE level_of_alert="'+levelid+'"', function(err, rows, fields) {
            if (err) throw err;
            if(rows.affectedRows)
            {
                connection.query('DELETE FROM butler_alert_text_configuration WHERE alert_level="'+levelid+'"', function(err, rows, fields) {
                    if (err) throw err;
                    if(rows.affectedRows)
                    {
                        connection.query('DELETE FROM butler_filteroptions WHERE status="callAlertFilter" AND value="'+levelid+'"', function(err, rows, fields) {
                            connection.query('DELETE FROM butler_zone_alert_map WHERE alert_level="'+levelid+'"', function(err, rows, fields) {
                                if(!err)
                                {
                                    callback(null, 1);
                                }
                                else
                                {
                                    callback(err, null);
                                }
                            });
                        });
                    }
                });
            }
        });
    }
}

function deleteATextConfig(data, callback)
{
    var levelid = decrypt_str(data.levelid);
    if(levelid)
    {
        connection.query('DELETE FROM butler_alert_text_configuration WHERE alert_level="'+levelid+'"', function(err, rows, fields) {
            if (err) throw err;
            if(rows.affectedRows)
            {
                if(!err)
                {
                    connection.query('DELETE FROM butler_alert_time_map WHERE level_of_alert="'+levelid+'"', function(err, rows, fields) {
                        if (err) throw err;
                        if(rows.affectedRows)
                        {
                            connection.query('DELETE FROM butler_filteroptions WHERE status="callAlertFilter" AND value="'+levelid+'"', function(err, rows, fields) {
                            if(!err)
                            {
                                callback(null, 1);
                            }
                            else
                            {
                                callback(err, null);
                            }
                        });
                        }
                    });
                }
                else
                {
                    callback(err, null);
                }
            }
        });
    }
}

function deleteAShift(data, callback)
{
    var shiftid = decrypt_str(data.shiftid);
    if(shiftid)
    {
        connection.query('SELECT count(*) as butlerCount FROM `butler_shift_map` as bsm INNER JOIN `butler_info` as bi ON bsm.butler_info_id=bi.butler_info_id WHERE shift_id="'+shiftid+'" AND bi.is_deleted=0', function(err, rows, fields) {
            if (err) throw err;
            var r = rows[0];
            if(r.butlerCount==0)
            {
                connection.query('UPDATE `butler_shift_timing` SET is_deleted=1 WHERE shift_id="'+shiftid+'"', function(err, rows, fields){
                    connection.query('DELETE FROM `butler_filteroptions` WHERE status="callShiftFilter" AND value="'+shiftid+'"', function(err, rows, fields){
                        loadButlerZoneAlertMap('deleteshift', shiftid, '');
                        callback(null, 1);
                    });
                });
            }
            else
            {
                callback('You cannot delete a non-empty shift.', 0);
            }
        });
    }
}

function checkForEmptyZones(zoneIdArray, callback)
{
    if(zoneIdArray.length > 0)
    {
        zoneIdArray.forEach(function(item){
            connection.query('SELECT COUNT(`zone_id`) as zc FROM `butler_shift_map` WHERE zone_id="'+item+'"', function(err, rows, fields) {
                if (err) throw err;
                var zc = rows[0];
                if(!zc.zc)
                {
                    connection.query('UPDATE `butler_zones_master` SET is_deleted=1 WHERE butler_zones_master_id="'+item+'"', function(err, rows, fields) {
                        callback(null, rows);
                    });
                }
                else
                {
                    callback(null, 1);
                }
            });
        });
    }
}

function moveZone(data, callback)
{
    var srcZoneid = decrypt_str(data.srcZoneid);
    var destZoneid = decrypt_str(data.destZoneid);

    if(srcZoneid && destZoneid)
    {
        cloneZoneMap(srcZoneid, destZoneid, function(err, zm){
            if(zm)
            {
                cloneShiftMap(srcZoneid, destZoneid, function(err, sm){
                    if(sm)
                    {
                        deleteZone(srcZoneid, function(err, dz){
                            loadButlerZoneAlertMap('deletezone', '', srcZoneid);
                            updateButlerRequestMap(srcZoneid, destZoneid, function(err, brm){
                                callback(null, 1);
                            });
                        });
                    }
                });
            }
        });
    }
}

function deleteZonePermanently(data, callback)
{
    var srcZoneid = decrypt_str(data.srcZoneid);
    if(srcZoneid)
    {
        deleteZone(srcZoneid, function(err, res){
            if(res)
            {
                loadButlerZoneAlertMap('deletezone', '', srcZoneid);
                callback(null, 1);
            }
        });
    }
}

function cloneZoneMap(srcZoneid, destZoneid, callback)
{
    connection.query('SELECT key_number FROM `butler_zone_map` WHERE zone_id="'+srcZoneid+'"', function(err, rows, fields) {
        if(rows.length > 0)
        {
            var roomNumberList = '';
            var rl = rows.length;

            rows.forEach(function(item){
                roomNumberList = ' ( ' + destZoneid + ', ' + item.key_number + ' ) ';rl--;
                rl ? roomNumberList += ', ': '';
            });
            if(roomNumberList)
            {
                connection.query('INSERT INTO butler_zone_map (zone_id, key_number) VALUES ' + roomNumberList, function(err, rows, fields) {
                    if(!err)
                    {
                        callback(null, 1);
                    }
                });
            }
            else
            {
                callback('Error in creating room number list to clone zone map for zone id = ' + srcZoneid, 1);
            }
        }
        else
        {
            callback(null, 1);
        }
    });
}

function cloneShiftMap(srcZoneid, destZoneid, callback)
{
    connection.query('SELECT shift_id, butler_info_id FROM `butler_shift_map` WHERE zone_id="'+srcZoneid+'"', function(err, rows, fields) {
        if(rows.length > 0)
        {
            var valueList = '';
            var rl = rows.length;

            rows.forEach(function(item){
                valueList = ' ( ' + destZoneid + ', ' + item.shift_id + ', ' + item.butler_info_id + ' )';rl--;
                rl ? valueList += ', ': '';
            });
            if(valueList)
            {
                console.log('INSERT INTO butler_shift_map (zone_id, shift_id, butler_info_id) VALUES ' + valueList );
                connection.query('INSERT INTO butler_shift_map (zone_id, shift_id, butler_info_id) VALUES ' + valueList, function(err, rows, fields) {
                    if(!err)
                    {
                        callback(null, 1);
                    }
                });
            }
            else
            {
                callback('Error in creating shift id and butler id info list to clone shift map for zone id = ' + srcZoneid, 1);
            }
        }
        else
        {
            callback(null, 1);
        }
    });
}

function deleteZone(srcZoneid, callback)
{
    connection.query('UPDATE `butler_zones_master` SET is_deleted=1 WHERE butler_zones_master_id="'+srcZoneid+'"', function(err, rows, fields) {
        if(!err)
        {
            callback(null, 1);
        }
        else
        {
            callback('Zone not availabe in master', null);
        }
    });
}

function updateButlerRequestMap(srcZoneid, destZoneid, callback)
{
    connection.query('UPDATE `butler_request_map` SET zone_id="'+destZoneid+'" WHERE zone_id="'+srcZoneid+'" AND resolution_time is NULL', function(err, rows, fields) {
        callback(null, 1);
    });
}
function getZoneViaButler(butlerId, callback)
{
    if(butlerId)
    {
        connection.query('SELECT DISTINCT(`zone_id`) as zone_id FROM butler_shift_map WHERE butler_info_id="'+butlerId+'"', function(err, rows, fields) {
            if (err) throw err;
            callback(null, rows);
        });
    }
}

function getDeleteZoneView(data, callback)
{
    var zoneid = decrypt_str(data.zoneid);
    if(zoneid)
    {
        connection.query('SELECT count(*) as zone_room_count FROM `butler_zone_map` WHERE zone_id="'+zoneid+'"', function(err, rows, fields) {
          if (err) throw err;
            callback(null, rows);
        });
    }
}

function amIBlocked(data, callback)
{
    if(data.userid)
    {
        connection.query('SELECT block FROM migrate_users WHERE id="'+data.userid+'"', function(err, rows, fields) {
          if (err) throw err;
            callback(null, rows);
        });
    }
}

function saveEditRemark(data, callback)
{
    if(data.requestid)
    {
        connection.query('UPDATE `butler_request_map` SET remark="'+data.remark+'" WHERE request_id="'+data.requestid+'"', function(err, rows, fields) {
          if (err) throw err;
            callback(null, rows);
        });
    }
}

function getClosedRequest(callback)
{
    //'SELECT DISTINCT(`key_number`) FROM reporting.butler WHERE event_status="OFF" AND date_time >= DATE_SUB(NOW(), INTERVAL 5 SECOND) ORDER BY butler_id DESC'
    connection.query('SELECT DISTINCT(`key_number`) FROM butler_request_map WHERE timestamp > DATE_SUB(NOW(), INTERVAL 10 SECOND) AND resolution_time IS NOT NULL', function(err, rows, fields) {
      if (err) throw err;
        var closedRequestsArray = [];
        if(rows.length > 0)
        {
            rows.forEach(function(item){
                closedRequestsArray.push({
                    key: item.key_number,
                    val: 'OFF'
                });
            });

        }
        callback(null, closedRequestsArray);
    });
}

function getButlerStats(callback)
{
    connection.query('SELECT ( SELECT COUNT( bzm.butler_zones_master_id ) FROM `butler_zones_master` AS bzm WHERE bzm.is_deleted=0 ) as zonecount, ( SELECT count(bst.shift_id) FROM `butler_shift_timing` as bst WHERE bst.is_deleted=0 ) as shiftcount, ( SELECT count(bi.butler_info_id) FROM `butler_info` as bi WHERE bi.is_deleted=0 ) as butlercount', function(err, rows, fields) {
      if (err) throw err;
        callback(null, rows);
    });
}

function saveEditedButlerView(data, callback)
{
    var obj = JSON.parse(data.dataPacket);
    saveEditButler(obj, function(err, b){
        if(b)
        {
            callback(null, 1);
        }
    });
}

function saveEditedLevelView(data, callback)
{
    var obj = JSON.parse(data.dataPacket);
    saveEditLevel(obj, function(err, b){
        if(b)
        {
            callback(null, 1);
        }
    });
}

function saveEditedTextConfigView(data, callback)
{
    var obj = JSON.parse(data.dataPacket);
    saveEditTextConfig(obj, function(err, b){
        if(b)
        {
            callback(null, 1);
        }
    });
}

function saveEditedShiftView(data, callback)
{
    var obj = JSON.parse(data.dataPacket);
    saveEditShift(obj, function(err, s){
        if(s)
        {
            callback(null, 1);
        }
    });
}

function saveEditButler(data, callback)
{
    var butlerid = data.butler_info_id;
    if(butlerid)
    {
        connection.query('UPDATE `butler_info` SET `butler_name` = "'+data.butler_name+'", `butler_email` = "'+data.butler_email+'", `butler_sms_number` = "'+data.butler_sms_number+'" WHERE `butler_info_id` = "'+butlerid+'"', function(err, rows, fields) {
          if (err) throw err;
            callback(null, !err);
        });
    }
}

function saveEditLevel(data, callback)
{
    var levelid = data.level_id;
    if(levelid)
    {
        connection.query('UPDATE `butler_alert_time_map` SET `time_limit` = "'+data.level_time_limit+'", `alert_bg_color` = "#'+data.level_color+'" WHERE `level_of_alert` = "'+levelid+'"', function(err, rows, fields) {
          if (err) throw err;
            callback(null, !err);
        });
    }
}

function saveEditTextConfig(data, callback)
{
    var levelid = data.level_id;
    if(levelid)
    {
        connection.query('UPDATE `butler_alert_text_configuration` SET `mail_subject` = "'+data.mail_subject+'", `mail_text` = "'+data.mail_body+'", `sms_text` = "'+data.sms_body+'" WHERE `alert_level` = "'+levelid+'"', function(err, rows, fields) {
          if (err) throw err;
            callback(null, !err);
        });
    }
}

function saveEditShift(data, callback)
{
    var shiftid = data.shift_id;
    if(shiftid)
    {
        connection.query('UPDATE `butler_shift_timing` SET `shift_name` = "'+data.shift_name+'", `time_start` = "'+data.shift_start_time+'", `time_end` = "'+data.shift_end_time+'" WHERE `shift_id` = "'+shiftid+'"', function(err, rows, fields) {
            connection.query('UPDATE `butler_filteroptions` SET `title` = "'+data.shift_name+'" WHERE `status` = "callShiftFilter" AND value="'+data.shift_id+'"', function(err, rows, fields) {

                if (err) throw err;
                callback(null, !err);
            });
        });
    }
}

function saveEditedZoneView(data, callback)
{
    var obj = JSON.parse(data.dataPacket);

    saveEditZone(obj, function(err, z){
        if(z)
        {
            saveEditRoomNumberZoneMap(obj, function(err, r){
                if(r)
                {
                    saveEditButlerZoneMap(obj, function(err, b){
                        if(b)
                        {
                            callback(null, b);
                        }
                    });
                }
            });
        }
    });
}

function saveAddZoneView(data, callback)
{
    var obj = JSON.parse(data.dataPacket);
    addZone(obj, function(err, z){
        if(z)
        {
            addZoneRoomNumber(obj, z, function(error, r){
                if(r)
                {
                    addZoneButlers(obj, z, function(e, b){
                        if(b)
                        {
                            loadButlerZoneAlertMap('addzone', '', z);
                            callback(null, b);
                        }
                    });
                }
            });
        }
    });
}

function saveAddShiftView(data, callback)
{
    var obj = JSON.parse(data.dataPacket);
    addShift(obj, function(err, z){
        if(z)
        {
            callback(null, z);
        }
    });
}

function checkShiftDuplicacy(data, callback)
{

}

function saveAddButlerView(data, callback)
{
    var obj = JSON.parse(data.dataPacket);
    if(obj.butler_id && obj.butler_name && obj.butler_email && obj.butler_sms_number)
    {
        connection.query('INSERT INTO `butler_info`(butler_id, butler_name, butler_email, butler_sms_number) VALUES ("'+obj.butler_id+'", "'+obj.butler_name+'", "'+obj.butler_email+'", "'+obj.butler_sms_number+'")', function(err, rows, fields) {
          if (err) throw err;
            callback(null, !err);
        });
    }
}

function saveAddLevelView(data, callback)
{
    var obj = JSON.parse(data.dataPacket);
    if(obj.level_id && obj.level_time_limit && obj.level_color)
    {
        var levelid = obj.level_id;
        connection.query('INSERT INTO `butler_alert_time_map`(level_of_alert, time_limit, alert_bg_color) VALUES ("'+levelid+'", "'+obj.level_time_limit+'", "#'+obj.level_color+'")', function(err, rows, fields) {
            if (err) throw err;
            if(!err)
            {
                connection.query('INSERT INTO `butler_alert_text_configuration`(alert_level, mail_subject, mail_text, sms_text) VALUES ("'+levelid+'", "Alert Level '+levelid+'", "Alert Level '+levelid+' Guest yyyy from Room xxxx Has asked for Butler Service Assistance.", "Alert Level '+levelid+'/Butler Assistance Request/Room:xxxx/Guest:yyyy")', function(err, rows, fields) {
                    if (err) throw err;
                    connection.query('INSERT INTO `butler_filteroptions`(filter_heading_id, title, status, sort_order, value) VALUES (1, "Level '+levelid+'", "callAlertFilter", 1, '+levelid+')', function(err, rows, fields) {
                      if (err) throw err;
                        callback(null, !err);
                    });
                });
            }
        });
    }
}

function saveAddTextConfigView(data, callback)
{
    var obj = JSON.parse(data.dataPacket);
    if(obj.level_id && obj.mail_subject && obj.mail_body && obj.sms_body)
    {
        var levelid = obj.level_id;
        connection.query('INSERT INTO `butler_alert_text_configuration`(alert_level, mail_subject, mail_text, sms_text) VALUES ("'+levelid+'", "'+obj.mail_subject+'", "'+obj.mail_body+'", "'+obj.sms_body+'")', function(err, rows, fields) {            if (err) throw err;
            if(!err)
            {
                connection.query('INSERT INTO `butler_alert_time_map`(level_of_alert, time_limit, alert_bg_color) VALUES ("'+levelid+'", "60", "#fff")', function(err, rows, fields) {            if (err) throw err;
                    if(!err)
                    {
                        connection.query('INSERT INTO `butler_filteroptions`(filter_heading_id, title, status, sort_order, value) VALUES (1, "Level '+levelid+'", "callAlertFilter", 1, '+levelid+')', function(err, rows, fields) {
                          if (err) throw err;
                            callback(null, !err);
                        });
                    }
                });
            }
        });
    }
}

function isButlerIdAlreadyExist(butlerId, callback)
{
    if(butlerId)
    {
        connection.query('SELECT count(*) as butlerexist FROM `butler_info` WHERE butler_info_id = "'+butlerId+'" and is_deleted=0', function(err, rows, fields) {
          if (err) throw err;
            callback(null, rows);
        });
    }
}

function addZone(data, callback)
{
    if(data.zone_name)
    {
        connection.query('INSERT INTO `butler_zones_master`(zone_name, is_deleted) VALUES ("'+data.zone_name+'", 0)', function(err, rows, fields) {
          if (err) throw err;
            callback(null, rows.insertId);
        });
    }
}
function addShift(data, callback)
{
    if(data.shift_name && data.shift_start_time && data.shift_end_time)
    {
        connection.query('INSERT INTO `butler_shift_timing`(time_start, time_end, shift_name) VALUES ("'+data.shift_start_time+'", "'+data.shift_end_time+'", "'+data.shift_name+'")', function(err, rowsP, fields) {      if (err) throw err;
            connection.query('INSERT INTO `butler_filteroptions`(filter_heading_id, title, status, sort_order, value) VALUES ("2", "'+data.shift_name+'", "callShiftFilter", 3, "'+rowsP.insertId+'")', function(err, rowsA, fields) {      if (err) throw err;
                loadButlerZoneAlertMap('addshift', rowsP.insertId, '');
                callback(null, rowsA.insertId);
            });
        });
    }
}

function addZoneRoomNumber(data, zone_id, callback)
{
    if(data.key_number)
    {
        var values = '';
        var roomNumberCount = (data.key_number).length;
        (data.key_number).forEach(function(item){
            values += ' ( ' + item.id + ', ' + zone_id + ' ) ';
            roomNumberCount--;
            if(roomNumberCount)
            {
                values += ', ';
            }
        });
        connection.query('INSERT INTO `butler_zone_map`(key_number, zone_id) VALUES ' + values, function(err, rows, fields) {
          if (err) throw err;
            callback(null, !err);
        });
    }
}

function addZoneButlers(data, zone_id, callback)
{
    if(data.butlers)
    {
        var values = '';
        var shiftCount = (data.butlers).length;
        (data.butlers).forEach(function(item){
            var butlersCount = (item.butlers).length;
            (item.butlers).forEach(function(subitem){
                values += ' ( ' + zone_id + ', ' + item.shiftid + ', "' + subitem.id + '" ) ';
                butlersCount--;
                if(butlersCount)
                {
                    values += ', ';
                }
            });
            shiftCount--;
            if(shiftCount)
            {
                values += ', ';
            }
        });
        if(values)
        {
            connection.query('INSERT INTO `butler_shift_map`(zone_id, shift_id, butler_info_id) VALUES ' + values, function(err, rows, fields) {
              if (err) throw err;
                callback(null, !err);
            });
        }
        else
        {
            callback(null, 1);
        }
    }
}

function saveEditZone(data, callback)
{
    var zoneid = decrypt_str(data.zone_id);
    if(zoneid)
    {
        connection.query('UPDATE `butler_zones_master` SET `zone_name` = "'+data.zone_name+'" WHERE `butler_zones_master_id` = "'+zoneid+'"', function(err, rows, fields) {
          if (err) throw err;
            callback(null, !err);
        });
    }
}

function saveEditRoomNumberZoneMap(data, callback)
{
    var zoneid = decrypt_str(data.zone_id);
    if(zoneid)
    {
        connection.query('DELETE FROM `butler_zone_map` WHERE zone_id="'+zoneid+'"', function(err, rows, fields) {
          if (err) throw err;
          if(!err)
          {
            var values = '';
            var roomNumberCount = (data.key_number).length;
            (data.key_number).forEach(function(item){
                values += ' ( "' + item.id +'", ' + zoneid + ' )';
                roomNumberCount--;
                if(roomNumberCount)
                {
                    values += ', ';
                }
            });

            connection.query('INSERT INTO `butler_zone_map` (`key_number`, `zone_id`) VALUES ' + values, function(err, rows, fields) {
              if (err) throw err;
              if(!err)
              {
                callback(null, rows.affectedRows);
              }
            });
          }
        });
    }
}

function saveEditButlerZoneMap(data, callback)
{
    var zoneid = decrypt_str(data.zone_id);
    if(data.zone_id)
    {
        connection.query('DELETE FROM `butler_shift_map` WHERE zone_id="'+zoneid+'"', function(err, rows, fields) {
          if (err) throw err;
          if(!err)
          {
            var values = '';
            var shiftCount = (data.butlers).length;

            (data.butlers).forEach(function(item){
                    var butlersCount = (item.butlers).length;
                    if(butlersCount)
                    {
                        (item.butlers).forEach(function(subitem){
                            values += ' ( "'+zoneid+'", "'+ item.shiftid+'", "'+subitem.id+'" ),';
                        });
                    }
            });
            values = values.replace(/,\s*$/, "");
            if(values)
            {
                connection.query('INSERT INTO `butler_shift_map` (`zone_id`, `shift_id`, `butler_info_id`) VALUES ' + values, function(err, rows, fields) {
                  if (err) throw err;
                  if(!err)
                  {
                    callback(null, 1);
                  }
                });
            }
            else
            {
                callback(null, 1);
            }
          }
        });
    }
}

/*function saveEditedZoneView(data, callback)
{
    var obj = JSON.parse(data.dataPacket);

    CRUDActions(
            'edit',
            'butler_zones_master',
            [
                { key: 'zone_name', val: obj.zone_name }
            ],
            [
                { key: 'butler_zones_master_id', val: obj.zone_id }
            ],
            function(err, z){
                if(z)
                {
                    CRUDActions('delete_in', 'butler_zone_map', '',[
                    {
                        key: 'zone_id':
                        val: obj.zone_id
                    },
                    {
                        key: 'key_number',
                        val: obj.key_number
                    }
                    ]
                    ], function(err, r){
                        (obj.key_number).forEach(function(item){
                            CRUDActions(
                                'add_batch',
                                'butler_zone_map',
                                [{ key: 'key_number'}, {key: 'zone_id'}],
                                ,
                                function
                            );
                        });
                    });
                }
            });
}*/

function CRUDActions(mode, table, params, conditions, callback)
{
    if(mode=='edit')
    {
        var columns = ' SET ';
        var where = 'WHERE';

        var conditionCount = conditions.length;
        params.forEach(function(item){
            columns += '`' + item.key + '`' + ' = ' + item.val + ', '
        });
        columns = columns.replace(/,+$/, '');

        conditions.forEach(function(item){
            where += ' `' + item.key + '`' + ' = ' + item.val;
            conditionCount--;
            if(conditionCount > 0)
            {
                where = ' AND ';
            }
        });

        if(where != 'WHERE')
        {
            connection.query('UPDATE `'+table+'` ' + fieldsToUpdate + where , function(err, rows, fields) {
              if (err) throw err;
                callback(null, !err);
            });
        }
    }
    else if(mode=='add')
    {
        var columns = ' ( ';
        var values  = ' VALUES ( ';

        params.forEach(function(item){
            columns += ' `' + item.key + '`, ';
        });
        columns = columns.replace(/,+$/, '');
        columns += ' ) ';

        conditions.forEach(function(item){
            values += ' `' + item.val + '`, ';
        });

        values = values.replace(/,+$/, '');
        values += ' ) ';

        connection.query('INSERT INTO `'+table+'` ' + columns + values, function(err, rows, fields) {
          if (err) throw err;
            callback(null, fields.insertId);
        });
    }
    else if(mode=='add_batch')
    {
        var columns = ' ( ';
        var values  = ' VALUES ';

        params.forEach(function(item){
            columns += ' `' + item.key + '`, ';
        });
        columns = columns.replace(/,+$/, '');
        columns += ' ) ';

        conditions.forEach(function(items){
            values +=' ( ';
            items.forEach(function(secondaryItem){
                values += ' `' + secondaryItem + '`, ';
            });
            values = values.replace(/,+$/, '');
            values +=' ) ';
        });

        values = values.replace(/,+$/, '');

        connection.query('INSERT INTO `'+table+'` ' + columns + values, function(err, rows, fields) {
          if (err) throw err;
            callback(null, fields.insertId);
        });
    }
    else if(mode=='delete')
    {
        var where = 'WHERE';
        var conditionCount = conditions.length;

        conditions.forEach(function(item){
            where += ' `' + item.key + '`' + ' = ' + item.val;
            conditionCount--;
            if(conditionCount > 0)
            {
               where = ' AND ';
            }
        });

        if(where != 'WHERE')
        {
            connection.query('DELETE FROM `'+table+'` ' + where, function(err, rows, fields) {
              if (err) throw err;
                callback(null, !err);
            });
        }
    }
    else if(mode=='delete_in')
    {
        var where = 'WHERE';
        var conditionCount = conditions.length;

        where += ' `' + item.key + '`' + ' IN ( ';
        conditions.forEach(function(item){
             where += item.id + ', ';
        });
        where = where.replace(/,+$/, '');
        where += ' ) ';

        if(where != 'WHERE')
        {
            connection.query('DELETE FROM `'+table+'` ' + where, function(err, rows, fields) {
              if (err) throw err;
                callback(null, !err);
            });
        }
    }
}

var incomingRequestProcess = function(data, callback)
{
    var filter = '';

   if(data.filter.alert!='')
   {
        var parsedAlertJSON = JSON.parse(data.filter.alert);

        if(parsedAlertJSON.length > 0)
        {
            filter += ' AND brm.escalation_level IN ( ';
            filter += parsedAlertJSON.join() + ' ) ';
        }
   }
   if(data.filter.shift!='')
   {
        var parsedShiftJSON = JSON.parse(data.filter.shift);

        if(parsedShiftJSON.length > 0)
        {
            filter += ' AND bsm.shift_id IN ( ';
            filter += parsedShiftJSON.join() + ' ) ';
        }
   }

   if(data.filter.searchByDateFrom!='' && data.filter.searchByDateTo!='')
   {
    filter += ' AND brm.`time_of_request` BETWEEN "'+data.filter.searchByDateFrom+'" AND "'+data.filter.searchByDateTo+'" ';
   }
   if(data.filter.searchByButlerName!='')
   {
    var butlerIds = [];
    var temp = JSON.parse(data.filter.searchByButlerName);
    temp.forEach(function(item){
        butlerIds.push("'"+item.id+"'");
    });

    filter += ' AND brm.`butler_info_id` IN ( '+butlerIds.join()+' ) ' ;
   }

   if(data.filter.searchByRoomNo!='')
   {
        var roomNos = [];
        var temp = JSON.parse(data.filter.searchByRoomNo);
        temp.forEach(function(item){
            roomNos.push("'"+item.id+"'");
        });

        filter += ' AND brm.`key_number` IN ( '+roomNos.join()+' ) ' ;
   }

   getTotalIncomingRequest(filter, function(err, t){
        connection.query("SELECT bi.*, zonemaster.zone_name, zonemaster.is_deleted as zone_is_deleted, bst.is_deleted as shift_is_deleted, brm.butler_request_map_id, brm.key_number, brm.request_id, brm.escalation_level, brm.time_of_request, brm.butler_info_id, brm.remark, bsm.shift_id, bst.shift_name FROM butler_request_map as brm INNER JOIN butler_shift_map as bsm on brm.butler_info_id = bsm.butler_info_id INNER JOIN butler_shift_timing as bst ON bst.shift_id=bsm.shift_id INNER JOIN butler_info as bi ON bi.butler_info_id=brm.butler_info_id INNER JOIN butler_zones_master as zonemaster ON zonemaster.butler_zones_master_id=brm.zone_id WHERE brm.resolution_time IS NULL AND brm.shift_id=bst.shift_id AND brm.zone_id=bsm.zone_id AND bi.is_deleted=0 " + filter + " ORDER BY brm.butler_request_map_id DESC, brm.escalation_level DESC LIMIT " + data.limit, function(err, rows, fields) {
           callback(null, rows, t[0]);
       });
   });
}

var getTotalIncomingRequest = function(filter, callback) {
    connection.query("SELECT count(*) as total FROM butler_request_map as brm INNER JOIN butler_shift_map as bsm on brm.butler_info_id = bsm.butler_info_id INNER JOIN butler_shift_timing as bst ON bst.shift_id=bsm.shift_id INNER JOIN butler_info as bi ON bi.butler_info_id=brm.butler_info_id INNER JOIN butler_zones_master as bzm ON brm.zone_id=bzm.butler_zones_master_id WHERE brm.resolution_time IS NULL AND brm.shift_id=bst.shift_id AND brm.zone_id=bsm.zone_id AND brm.zone_id=bsm.zone_id AND brm.butler_info_id=bi.butler_info_id AND bst.shift_id=brm.shift_id " + filter + " ORDER BY brm.butler_request_map_id DESC", function(err, rows, fields) {
    callback(null, rows);
   });
}

var completedRequestProcess = function(data, callback)
{
    var filter = '';

    if(data.filter.alert!='')
    {
        var parsedAlertJSON = JSON.parse(data.filter.alert);

        if(parsedAlertJSON.length > 0)
        {
            filter += ' AND brm.escalation_level IN ( ';
            filter += parsedAlertJSON.join() + ' ) ';
        }
    }
    if(data.filter.shift!='')
    {
        var parsedShiftJSON = JSON.parse(data.filter.shift);

        if(parsedShiftJSON.length > 0)
        {
            filter += ' AND bsm.shift_id IN ( ';
            filter += parsedShiftJSON.join() + ' ) ';
        }
    }
    if(data.filter.searchByDateFrom!='' && data.filter.searchByDateTo!='')
    {
        filter += ' AND brm.`time_of_request` BETWEEN "'+data.filter.searchByDateFrom+'" AND "'+data.filter.searchByDateTo+'" ';
    }
    if(data.filter.searchByButlerName!='')
    {
        var butlerIds = [];
        var temp = JSON.parse(data.filter.searchByButlerName);
        temp.forEach(function(item){
            butlerIds.push("'"+item.id+"'");
        });

        filter += ' AND brm.`butler_info_id` IN ( '+butlerIds.join()+' ) ' ;
    }
    if(data.filter.searchByRoomNo!='')
    {
	    var roomNos = [];
	    var temp = JSON.parse(data.filter.searchByRoomNo);
	    temp.forEach(function(item){
	        roomNos.push("'"+item.id+"'");
	    });

	    filter += ' AND brm.`key_number` IN ( '+roomNos.join()+' ) ' ;
    }
    getTotalCompletedRequest(filter, function(err, t){
        connection.query("SELECT bi.*, zonemaster.zone_name, zonemaster.is_deleted as zone_is_deleted, bst.is_deleted as shift_is_deleted, brm.butler_request_map_id, brm.resolution_time, brm.key_number, brm.request_id, brm.escalation_level, brm.time_of_request, brm.butler_info_id, brm.remark, bsm.shift_id, bst.shift_name FROM butler_request_map as brm INNER JOIN butler_shift_map as bsm on brm.butler_info_id = bsm.butler_info_id INNER JOIN butler_shift_timing as bst ON bst.shift_id=bsm.shift_id INNER JOIN butler_info as bi ON bi.butler_info_id=brm.butler_info_id INNER JOIN butler_zones_master as zonemaster ON brm.zone_id=zonemaster.butler_zones_master_id WHERE brm.resolution_time IS NOT NULL " + filter + " AND date(brm.time_of_request)=date(NOW()) AND brm.shift_id=bst.shift_id AND brm.zone_id=bsm.zone_id ORDER BY brm.butler_request_map_id DESC LIMIT " + data.limit, function(err, rows, fields) {
            if (err) throw err;
            callback(null, rows, t[0]);
        });
    });
}

var getTotalCompletedRequest = function(filter, callback) {
    connection.query("SELECT count(*) as total FROM butler_request_map as brm INNER JOIN butler_shift_map as bsm on brm.butler_info_id = bsm.butler_info_id INNER JOIN butler_shift_timing as bst ON bst.shift_id=bsm.shift_id INNER JOIN butler_info as bi ON bi.butler_info_id=brm.butler_info_id WHERE brm.resolution_time IS NOT NULL " + filter + " AND date(brm.time_of_request)=date(NOW()) AND brm.shift_id=bst.shift_id AND brm.zone_id=bsm.zone_id AND brm.zone_id=bsm.zone_id AND brm.butler_info_id=bi.butler_info_id ORDER BY brm.butler_request_map_id ", function(err, rows, fields) {
       callback(null, rows);
   });
}

var requestHistoryProcess = function(data, callback)
{
    var filter = '';

    if(data.filter.alert!='')
    {
        var parsedAlertJSON = JSON.parse(data.filter.alert);

        if(parsedAlertJSON.length > 0)
        {
            filter += ' AND brm.escalation_level IN ( ';
            filter += parsedAlertJSON.join() + ' ) ';
        }
    }
    if(data.filter.shift!='')
    {
        var parsedShiftJSON = JSON.parse(data.filter.shift);

        if(parsedShiftJSON.length > 0)
        {
            filter += ' AND bsm.shift_id IN ( ';
            filter += parsedShiftJSON.join() + ' ) ';
        }
    }
    if(data.filter.searchByDateFrom!='' && data.filter.searchByDateTo!='')
    {
        filter += ' AND brm.`time_of_request` BETWEEN "'+data.filter.searchByDateFrom+'" AND "'+data.filter.searchByDateTo+'" ';
    }
    if(data.filter.searchByButlerName!='')
    {
        var butlerIds = [];
        var temp = JSON.parse(data.filter.searchByButlerName);
        temp.forEach(function(item){
            butlerIds.push("'"+item.id+"'");
        });

        filter += ' AND brm.`butler_info_id` IN ( '+butlerIds.join()+' ) ' ;
    }
    if(data.filter.searchByRoomNo!='')
    {
	    var roomNos = [];
	    var temp = JSON.parse(data.filter.searchByRoomNo);
	    temp.forEach(function(item){
	        roomNos.push("'"+item.id+"'");
	    });

	    filter += ' AND brm.`key_number` IN ( '+roomNos.join()+' ) ' ;
    }
    getTotalRequestHistory(filter, function(err, t){
        connection.query("SELECT bi.*, zonemaster.zone_name, zonemaster.is_deleted as zone_is_deleted, brm.butler_request_map_id, brm.resolution_time, brm.key_number, brm.request_id, brm.escalation_level, brm.time_of_request, brm.butler_info_id, brm.remark, bsm.shift_id, bst.shift_name, bst.is_deleted as shift_is_deleted FROM butler_request_map as brm INNER JOIN butler_shift_map as bsm on brm.butler_info_id = bsm.butler_info_id INNER JOIN butler_shift_timing as bst ON bst.shift_id=bsm.shift_id INNER JOIN butler_info as bi ON bi.butler_info_id=brm.butler_info_id INNER JOIN butler_zones_master as zonemaster ON brm.zone_id=zonemaster.butler_zones_master_id WHERE 1 " + filter + " AND brm.resolution_time IS NOT NULL AND brm.shift_id=bst.shift_id AND brm.zone_id = bsm.zone_id ORDER BY brm.butler_request_map_id DESC LIMIT " + data.limit, function(err, rows, fields) {
            if (err) throw err;
            callback(null, rows, t[0]);
        });
    });
}

var getTotalRequestHistory = function(filter, callback) {
    connection.query("SELECT count(*) as total FROM butler_request_map as brm INNER JOIN butler_shift_map as bsm on brm.butler_info_id = bsm.butler_info_id INNER JOIN butler_shift_timing as bst ON bst.shift_id=bsm.shift_id LEFT JOIN butler_info as bi ON bi.butler_info_id=brm.butler_info_id WHERE 1 " + filter + " AND brm.shift_id=bst.shift_id AND brm.zone_id=bsm.zone_id AND brm.butler_info_id=bi.butler_info_id AND brm.resolution_time IS NOT NULL ORDER BY brm.butler_request_map_id ", function(err, rows, fields) {
       callback(null, rows);
   });
}

var recentRequestProcess = function(data, callback)
{
    if(typeof data.lastReqId!='undefined')
    {
        var filter = '';

        if(data.filter.alert!='' && data.filter.shift!='')
        {
            var parsedAlertJSON = JSON.parse(data.filter.alert);
            var parsedShiftJSON = JSON.parse(data.filter.shift);


            if(parsedAlertJSON.length > 0)
            {
                filter += ' AND brm.escalation_level IN ( ';
                filter += parsedAlertJSON.join() + ' ) ';
            }
            if(parsedShiftJSON.length > 0)
            {
                filter += ' AND bsm.shift_id IN ( ';
                filter += parsedShiftJSON.join() + ' ) ';
            }
        }
        if(data.filter.searchByDateFrom!='' && data.filter.searchByDateTo!='')
        {
            filter += ' AND brm.`time_of_request` BETWEEN "'+data.filter.searchByDateFrom+'" AND "'+data.filter.searchByDateTo+'" ';
        }
        if(data.filter.searchByButlerName!='')
        {
            var butlerIds = [];
            var temp = JSON.parse(data.filter.searchByButlerName);
            temp.forEach(function(item){
                butlerIds.push("'"+item.id+"'");
            });

            filter += ' AND brm.`butler_info_id` IN ( '+butlerIds.join()+' ) ' ;
        }
        if(data.filter.searchByRoomNo!='')
        {
            var roomNos = [];
            var temp = JSON.parse(data.filter.searchByRoomNo);
            temp.forEach(function(item){
                roomNos.push("'"+item.id+"'");
            });

            filter += ' AND brm.`key_number` IN ( '+roomNos.join()+' ) ' ;
        }
        connection.query("SELECT bi.*, brm.butler_request_map_id, brm.key_number, brm.request_id, brm.escalation_level, brm.time_of_request, brm.butler_info_id, bsm.shift_id, bst.shift_name, bzm.zone_name FROM butler_request_map as brm INNER JOIN butler_shift_map as bsm on brm.butler_info_id = bsm.butler_info_id INNER JOIN butler_shift_timing as bst ON bst.shift_id=bsm.shift_id INNER JOIN butler_info as bi ON bi.butler_info_id=brm.butler_info_id INNER JOIN butler_zones_master as bzm ON bzm.butler_zones_master_id=brm.zone_id WHERE 1 AND brm.resolution_time IS NULL AND brm.butler_request_map_id > " + data.lastReqId + " AND brm.shift_id=bsm.shift_id AND brm.zone_id=bsm.zone_id AND brm.butler_info_id=bsm.butler_info_id ORDER BY brm.butler_request_map_id DESC LIMIT " + data.limit, function(err, rows, fields) {
            if (err) throw err;
            callback(null, rows);
        });
    }
    else
    {
        callback('error', null);
    }
}

var recentRequestProcessForMobileApps = function(data, callback)
{
    connection.query("SELECT bi.*, brm.butler_request_map_id, brm.key_number, brm.request_id, brm.escalation_level, brm.time_of_request, brm.butler_info_id, bsm.shift_id, bst.shift_name, bzm.zone_name FROM butler_request_map as brm INNER JOIN butler_shift_map as bsm on brm.butler_info_id = bsm.butler_info_id INNER JOIN butler_shift_timing as bst ON bst.shift_id=bsm.shift_id INNER JOIN butler_info as bi ON bi.butler_info_id=brm.butler_info_id INNER JOIN butler_zones_master as bzm ON bzm.butler_zones_master_id=brm.zone_id WHERE 1 AND brm.resolution_time IS NULL AND brm.butler_request_map_id >= " + data.butlerRequestMapId + " AND brm.shift_id=bsm.shift_id AND brm.zone_id=bsm.zone_id AND brm.butler_info_id=bsm.butler_info_id ORDER BY brm.butler_request_map_id DESC", function(err, rows, fields) {
        if (err) throw err;
        callback(null, rows);
    });
}

//time_of_request > DATE_SUB(NOW(), INTERVAL 5 SECOND)

var getUpdatedStatus = function(limit, callback)
{
    connection.query("SELECT brm.butler_request_map_id, brm.key_number, brm.request_id, brm.escalation_level, brm.time_of_request, brm.butler_info_id, bsm.shift_id, bst.shift_name, bi.butler_app_users_id FROM butler_request_map as brm INNER JOIN butler_shift_map as bsm on brm.butler_info_id = bsm.butler_info_id INNER JOIN butler_shift_timing as bst ON bst.shift_id=bsm.shift_id INNER JOIN butler_info as bi ON bsm.butler_info_id=bi.butler_info_id where brm.resolution_time IS NULL AND brm.timestamp > DATE_SUB(NOW(), INTERVAL 5 SECOND) AND bsm.zone_id = brm.zone_id ORDER BY brm.request_id DESC", function(err, rows, fields) {
        if (err) throw err;
        callback(null, rows);
    });
}

var messageToDevice = function()
{
    connection.query("SELECT d . * , m . * , u . *, ds.*, users.name FROM  `messaging_msg_to_delivery` AS d INNER JOIN  `messaging_user_message` AS u ON d.conversation_id = u.conversation_id INNER JOIN  `messaging_message` AS m ON m.message_id = u.message_id INNER JOIN `digivalet_status` AS ds ON d.roomno = ds.room_no AND d.ip=ds.pc_ip INNER JOIN migrate_users as users ON users.id=m.author_id WHERE (m.schedule=0 OR m.schedule=1) AND u.delivery_status =  'pending' AND u.is_deleted =0 AND ds.iremote=1", function(err, rows, fields) {
        if (err) {return false; };
        var i = 0;
        connectionsArray = [];
        rows.forEach(function(item){
            var messagePacket = '';
            var msgBody = '';
            messagePacket = "";
            messagePacket += "message:<root><msg>";
            messagePacket +="<id>" + item.conversation_id + "</id>";
            messagePacket += "<sub>" + (item.subject).replace("&", "&amp;") + "</sub>";
            messagePacket += "<to>" + item.user_name + "</to>";
            messagePacket += "<from>" + item.name + "</from>";
            messagePacket += "<body>";

            msgBody = item.body;
            msgBody = msgBody.replace("&", "&amp;");
            msgBody = msgBody.replace("\r", "&#13;");
            msgBody = msgBody.replace("\n", "&#13;");

            msgBody = msgBody.replace(":", "col;");
            msgBody = msgBody.replace("=", "eql;");
            msgBody = msgBody.replace("<", "&lt;");
            msgBody = msgBody.replace(">", "&gt;");

            var now = moment(item.sent);

            messagePacket += msgBody;
            messagePacket += "</body>";
            messagePacket += "<datetime>" + now.format("YMMDHHmm") + "</datetime>";
            messagePacket += "<token>" + item.token + "</token>";
            messagePacket += "</msg></root>";
            //console.log("Xml : " + messagePacket + "\n");

            var address = "";

            var roomNo      = item.roomNo;
            var macAddress  = (item.MAC).toLowerCase();
            var key         = roomNo + macAddress;

           /* var msgCipher = _e(messagePacket, key);
            msgCipher     = msgCipher + "\n";*/
            var msgCipher = messagePacket + "\n";

            address       = item.ip;
            var _c = item.conversation_id;
            queueMessage(connectionsArray, address, msgCipher, _c);
        });
        _s(connectionsArray);
        //console.log(connectionsArray);
    });
}

function queueMessage(connectionsArray, address, msgCipher, cid)
{
    if(connectionsArray.length==0)
    {
        var messages = [];
        messages.push(msgCipher);
        connectionsArray.push({
            'to': address,
            'msg': messages,
            'cid': cid
        });
    }
    else
    {
        connectionsArray.some(function (el, index, array) {
            var result = el.to === address;
            if(!result)
            {
                var messages = [];
                messages.push(msgCipher);
                connectionsArray.push({
                    'to': address,
                    'msg': messages,
                    'cid': cid
                });
            }
            else if(result)
            {
                connectionsArray[index]['msg'].push(msgCipher);
            }
        });
    }
}

function _e(e,t){$result="";for($i=0;$i<e.length;$i++){$char=substr(e,$i,1);$keychar=substr(t,$i%t.length-1,1);$char=chr(ord($char)+ord($keychar));$result+=$char}$result=btoa($result);return $result}function chr(e){if(e>65535){e-=65536;return String.fromCharCode(55296+(e>>10),56320+(e&1023))}return String.fromCharCode(e)}function ord(e){var t=e+"",n=t.charCodeAt(0);if(55296<=n&&n<=56319){var r=n;if(t.length===1){return n}var i=t.charCodeAt(1);return(r-55296)*1024+(i-56320)+65536}if(56320<=n&&n<=57343){return n}return n}function substr(e,t,n){var r=0,i=true,s=0,o=0,u=0,a="";e+="";var f=e.length;this.php_js=this.php_js||{};this.php_js.ini=this.php_js.ini||{};switch(this.php_js.ini["unicode.semantics"]&&this.php_js.ini["unicode.semantics"].local_value.toLowerCase()){case"on":for(r=0;r<e.length;r++){if(/[\uD800-\uDBFF]/.test(e.charAt(r))&&/[\uDC00-\uDFFF]/.test(e.charAt(r+1))){i=false;break}}if(!i){if(t<0){for(r=f-1,s=t+=f;r>=s;r--){if(/[\uDC00-\uDFFF]/.test(e.charAt(r))&&/[\uD800-\uDBFF]/.test(e.charAt(r-1))){t--;s--}}}else{var l=/[\uD800-\uDBFF][\uDC00-\uDFFF]/g;while(l.exec(e)!=null){var c=l.lastIndex;if(c-2<t){t++}else{break}}}if(t>=f||t<0){return false}if(n<0){for(r=f-1,o=f+=n;r>=o;r--){if(/[\uDC00-\uDFFF]/.test(e.charAt(r))&&/[\uD800-\uDBFF]/.test(e.charAt(r-1))){f--;o--}}if(t>f){return false}return e.slice(t,f)}else{u=t+n;for(r=t;r<u;r++){a+=e.charAt(r);if(/[\uD800-\uDBFF]/.test(e.charAt(r))&&/[\uDC00-\uDFFF]/.test(e.charAt(r+1))){u++}}return a}break};case"off":default:if(t<0){t+=f}f=typeof n==="undefined"?f:n<0?n+f:n+t;return t>=e.length||t<0||t>f?!1:e.slice(t,f)}return undefined}
function _s(connectionsArray)
{
    connectionsArray.forEach(function(item){
        //console.log(item);
        if(item.msg.length == 1)
        {
            //console.log(item.msg.length);
            messageDelivered(item.cid);
            tcpClient.connect(7008, item.to, function() {
                tcpClient.write((item.msg)[0]);

            });

        }
        else if(item.msg.length > 1)
        {
            tcpClient.connect(7008, item.to, function() {
                item.msg.forEach(function(m){
                    tcpClient.write(m);
                    messageDelivered(item.cid);
                });
            });        }
    });
    //tcpClient.destroy();
}

function messageDelivered(cid)
{
    connection.query("update `messaging_user_message` set delivery_status='delivered' where conversation_id='"+cid+"'", function(err, rows, fields) {      if (err) throw err;
        //callback(null, rows);
    });
}

nsp.on('connection', function (socket) {
    sck = socket;
    var tempSocket = socket;
    socket.on('recipient', function (data) {
        expandsTo(data, tempSocket, function(err, expandedView){
            if(expandedView){}
        });
    });

    socket.on('saveNewMessage', function (data) {
        if(data.msgPacket.action=='edit')
        {
            flushAMessage(data.msgPacket.msgid, tempSocket, function(err, res){
                if(err) { console.log(err); }
                messageRequestProcess(data, socket, function(err, processedResult, od){
                    if(processedResult)
                    {
                        socket.emit('saveNewMessage', { 'status': 1, 'responseText': 'Your message has been edited successfully.', 'od': od });
                    }
                    else
                    {
                        socket.emit('saveNewMessage', { 'status': 0, 'responseText': err, 'od': od });
                    }
                });
            });
        }
        else
        {
            messageRequestProcess(data, socket, function(err, processedResult, od){
                if(err) { console.log(err); }
                if(processedResult)
                {
                    socket.emit('saveNewMessage', { 'status': 1, 'responseText': 'You message has been processed successfully.', 'od': od });
                }
                else
                {
                    socket.emit('saveNewMessage', { 'status': 0, 'responseText': err, 'od': od });
                }
            });
        }
    });

    socket.on('getSentMessages', function (data) {
        getSentMessages(data, function(err, res) {
            readySentMessagesView(res, function(err, view){
                tempSocket.emit('getSentMessages', { messages: view });
            });
        });
    });

    socket.on('getScheduledMessages', function (data) {
        getScheduledMessages(data, function(err, res) {
            readyScheduledMessagesView(res, function(err, view){
                tempSocket.emit('getScheduledMessages', { messages: view });
            });
        });
    });
    socket.on('deleteMessage', function (data) {
        deleteMessage(data, function(err, res){
            if(err) { console.log(err); tempSocket.emit('deleteMessage', { deleteResponse: 0 }); return false; }
            if(res){
               tempSocket.emit('deleteMessage', { deleteResponse: 1, ref: data.ref });
            }
        });
    });
    socket.on('editMessage', function (data) {
        editMessage(data.cid, function(err, res){
            if(err) { console.log(err); tempSocket.emit('editMessage', { editResponse: 0 }); return false; }
            if(res){
                var trackStatus = JSON.parse(decrypt_str(res.track_status));
                tempSocket.emit('editMessage', { editResponse: trackStatus, msgid: data.cid });
            }
        });
    });
});

function messageRequestProcess(data, tempSocket, callback)
{
    messageRequest(data.msgPacket, function(err, res, od) {

        if(data.msgPacket.schedule.mode=='right-now')
        {
            if(err)
            {
                callback(err, null, '');
            }
            else
            {
                processMessage(res.insertId, data.msgPacket, tempSocket, function(err, processedResult){
                    if(processedResult)
                    {
                        callback(null, 1, '');
                    }
                    else
                    {
                        callback(err, null, '');
                    }
                });
            }
        }
        else if(data.msgPacket.schedule.mode=='later')
        {
            callback(err, res, od);
        }
    });
}

function flushAMessage(cid, sck, callback)
{
    var msgid = decrypt_str(cid);
    connection.query("DELETE FROM messaging_message WHERE message_id='" + msgid + "'", function(err, rows, fields) {
        if (err) { callback('Some error occurred', null); return false; };
        callback(null, rows);
    });
}

function editMessage(tid, callback)
{
    isValidToken(tid, function(err, res){
        if(err) { console.log(err.message); return false; }
        if(res) {
            connection.query("SELECT track_status FROM messaging_message WHERE message_id='" + res + "'", function(err, rows, fields) {
                if (err) { callback('Some error occurred', null); return false; };

                callback(null, rows[0]);
            });
        }
    });
}

function deleteMessage(data, callback)
{
    isValidToken(data.cid, function(err, res){
        if(err) { console.log(err); return false; }
        if(res) {
            if(data.mtype) // For scheduled messages.
            {
                connection.query("DELETE FROM `messaging_message` WHERE message_id='"+res+"'", function(err, rows, fields) {
                    if (err) { callback('Some error occurred', null); return false; };
                    //console.log(rows);
                    callback(null, rows);
                });
            }
            else // For sent messages.
            {
                connection.query("UPDATE messaging_user_message SET is_deleted='1' WHERE message_id='" + res + "'", function(err, rows, fields) {
                    if (err) { callback('Some error occurred', null); return false; };
                    //console.log(rows);
                    callback(null, rows);
                });
            }
        }
    });
}

function isValidToken(t, callback)
{
    var token = decrypt_str(t);

    if(token) {
        callback(null, token);
    }
    else {
        callback('Invalid Token', null);
    }
}

function scheduledMessageRequest(data, callback)
{
    connection.query("INSERT INTO messaging_scheduled_message ( subject, body, recipientlist, author_id, sent_time ) VALUES ( '"+data.subject+"', '"+data.compose+"', '$recipientlist', '"+data.authorId+"', '"+data.date+"')", function(err, rows, fields) {
      if (err) throw err;
        callback(null, rows);
    });
}

function readySentMessagesView(data, callback)
{
    var view = '';
    var rowcount = 1;
    var dynaView = '';
    var trackStatus = '';
    var contentView = '';
    var activeClass = 'active';
    var encryptedMsgId = '';
    var guestNames = '';
    if(data.length > 0 )
    {
        view += '<div class="col-md-12 col-xs-12 msg-tab-container">';
        view += '<div class="col-lg-3 col-md-3 col-sm-3 col-xs-3 msg-tab-menu">';
        view += '<div class="list-group Msg-list-group scroller" style="height:450px;">';

        data.forEach(function(item){
            if(rowcount!=1){ activeClass=''; }

            trackStatus = JSON.parse(decrypt_str(item.track_status));

            if((trackStatus.contains).length > 0)
            {
                guestNames += '<span class="text-muted">';
                (trackStatus.contains).forEach(function(j){
                    guestNames += j.name + ', '
                });
                guestNames += '</span>';
            }

            encryptedMsgId = encrypt_str(item.message_id);
            view += '<a href="javascript:void(0);" class="list-group-item '+activeClass+' msg-Left-Section" data-messagelist="'+encryptedMsgId+'">';
            view += '<p><b>' + ( (trackStatus.sendto).replace(/-/g, " ") ).toUpperCase() + '</b></p>';
            view += '<p class="Msg-Time">' + moment(item.sent).format("MMM Do YYYY") + ' <br>' + moment(item.sent).format("h:mm A") + '</p>';
            view += '<p class="msg-subject">' + item.subject + '</p>';
            view += '<p class="msg-Descrption">' + item.body + '</p>';
            view += '</a>';

            contentView += '<div class="MSG-tab-content '+activeClass+'" data-messagecontent="'+encryptedMsgId+'">';
            contentView += '<div class="inbox-content">';
            contentView += '<div class="inbox-header inbox-view-header clearfix">';
            contentView += '<h4 class="text-primary">' + ( (trackStatus.sendto).replace(/-/g, " ") ).toUpperCase() + '</h4>';
            contentView += guestNames;
            contentView += '</div>';

            contentView += '<div class="inbox-view-info clearfix">';
            contentView += '<div class="row">';
            contentView += '<div class="col-md-7">';
            //contentView += '<span><i class="fa fa-clock-o" aria-hidden="true"></i></span>&nbsp;';
            //contentView += moment(item.sent).format("MMM Do YYYY") + ' ' + moment(item.sent).format("h:mm A");
            contentView += '<ul class="list-unstyled">';
            contentView += '<li><span><i class="fa fa-clock-o" aria-hidden="true"></i></span>&nbsp; Composition Time: <b>' + moment(item.sent).format("MMM Do YYYY") + ' ' + moment(item.sent).format("h:mm A") + '</b></li>';
            contentView += '<li><span><i class="fa fa-hourglass-half" aria-hidden="true"></i></span>&nbsp; Scheduled Time: <b>' + moment(item.when_to_send).format("MMM Do YYYY") + ' ' + moment(item.when_to_send).format("h:mm A") + '</b></li>';
            contentView += '<li><span><i class="fa fa-user" aria-hidden="true"></i></span>&nbsp; Author: <b>' + item.name + '</b></li>';
            contentView += '&nbsp;';
            contentView += '<li>Subject: <b>' + item.subject + '</b></li>';
            contentView += '</ul>';
            contentView += '</div>';
            contentView += '<div class="col-md-5 inbox-info-btn">';
            contentView += '<div class="btn-group pull-right">';
            contentView += '<button class="btn btn-blue reply-btn" style="border-right: 2px solid rgb(221, 221, 221);">';
            contentView += '<i class="fa fa-reply"></i> Actions</button>';
            contentView += '<button class="btn btn-blue dropdown-toggle" data-toggle="dropdown">';
            contentView += '<i class="fa fa-angle-down"></i>';
            contentView += '</button>';
            contentView += '<ul class="dropdown-menu pull-right">';
            //contentView += '<li><a href="javascript:void(0);" class="edit-c" data-action="edit" data-t="'+encryptedMsgId+'"><i class="fa fa-edit"></i> Edit </a></li>';
            contentView += '<li><a href="javascript:void(0);" class="edit-c" data-action="delete" data-t="'+encryptedMsgId+'"><i class="fa fa-trash"></i> Delete </a></li>';
            contentView += '</ul>';
            contentView += '</div>';
            contentView += '</div>';
            contentView += '</div>';
            contentView += '</div>';
            contentView += '<div class="inbox-view scroller" style="height: 200px;">';
            contentView += '<p>';
            contentView += convertSCToHTML(item.body);

            contentView += '</div>';

            contentView += ' </div>';
            contentView += ' </div>';
            rowcount++;
        });
        view += '</div></div>';

        view += '<div class="col-lg-9 col-md-9 col-sm-9 col-xs-9 MSG-tab">';
        view += '<div class="MSG-tab-content active">';
        view += contentView;
        view += '</div></div>';
        view += '</div>';
    }
    else
    {
        view += '<div class="text-center"><img src="components/com_messages/assets/img/no_new_messages.png"><p>&nbsp;</p><p data-notifyMessage>No Sent Messages </p><p class="text-muted">You can a send a message by composing a new one via Compose New Message section.</p></div>';
    }
    callback(null, view);
}

function readyScheduledMessagesView(data, callback)
{
    var view = '';
    var rowcount = 1;
    var dynaView = '';
    var trackStatus = '';
    var contentView = '';
    var activeClass = 'active';
    var encryptedMsgId = '';
    var guestNames = '';
    if(data.length > 0 )
    {
        view += '<div class="col-md-12 col-xs-12 msg-tab-container">';
        view += '<div class="col-lg-3 col-md-3 col-sm-3 col-xs-3 msg-tab-menu">';
        view += '<div class="list-group Msg-list-group scroller" style="height:450px;">';

        data.forEach(function(item){
            if(rowcount!=1){ activeClass=''; }

            trackStatus = JSON.parse(decrypt_str(item.track_status));

            if((trackStatus.contains).length > 0)
            {
                guestNames += '<span class="text-muted">';
                (trackStatus.contains).forEach(function(j){
                    guestNames += j.name + ', '
                });
                guestNames += '</span>';
            }

            encryptedMsgId = encrypt_str(item.message_id);
            view += '<a href="javascript:void(0);" class="list-group-item '+activeClass+' msg-Left-Section" data-messagelist="'+encryptedMsgId+'">';
            view += '<p><b>' + ( (trackStatus.sendto).replace(/-/g, " ") ).toUpperCase() + '</b></p>';
            view += '<p class="Msg-Time">' + moment(item.sent).format("MMM Do YYYY") + ' <br>' + moment(item.sent).format("h:mm A") + '</p>';
            view += '<p class="msg-subject">' + item.subject + '</p>';
            view += '<p class="msg-Descrption">' + item.body + '</p>';
            view += '</a>';

            contentView += '<div class="MSG-tab-content '+activeClass+'" data-messagecontent="'+encryptedMsgId+'">';
            contentView += '<div class="inbox-content">';
            contentView += '<div class="inbox-header inbox-view-header clearfix">';
            contentView += '<h4 class="text-primary">' + ( (trackStatus.sendto).replace(/-/g, " ") ).toUpperCase() + '</h4>';
            contentView += guestNames;
            contentView += '</div>';

            contentView += '<div class="inbox-view-info clearfix">';
            contentView += '<div class="row">';
            contentView += '<div class="col-md-7">';
            //contentView += '<span><i class="fa fa-clock-o" aria-hidden="true"></i></span>&nbsp;';
            //contentView += moment(item.sent).format("MMM Do YYYY") + ' ' + moment(item.sent).format("h:mm A");
            contentView += '<ul class="list-unstyled">';
            contentView += '<li><span><i class="fa fa-clock-o" aria-hidden="true"></i></span>&nbsp; Composition Time: <b>' + moment(item.sent).format("MMM Do YYYY") + ' ' + moment(item.sent).format("h:mm A") + '</b></li>';
            contentView += '<li><span><i class="fa fa-hourglass-half" aria-hidden="true"></i></span>&nbsp; Scheduled Time: <b>' + moment(item.when_to_send).format("MMM Do YYYY") + ' ' + moment(item.when_to_send).format("h:mm A") + '</b></li>';
            contentView += '<li><span><i class="fa fa-user" aria-hidden="true"></i></span>&nbsp; Author: <b>' + item.name + '</b></li>';
            contentView += '&nbsp;';
            contentView += '<li>Subject: <b>' + item.subject + '</b></li>';
            contentView += '</ul>';
            contentView += '</div>';
            contentView += '<div class="col-md-5 inbox-info-btn">';
            contentView += '<div class="btn-group pull-right">';
            contentView += '<button class="btn btn-blue reply-btn" style="border-right: 2px solid rgb(221, 221, 221);">';
            contentView += '<i class="fa fa-reply"></i> Actions</button>';
            contentView += '<button class="btn btn-blue dropdown-toggle" data-toggle="dropdown">';
            contentView += '<i class="fa fa-angle-down"></i>';
            contentView += '</button>';
            contentView += '<ul class="dropdown-menu pull-right">';
            contentView += '<li><a href="javascript:void(0);" class="edit-c" data-action="edit" data-t="'+encryptedMsgId+'"><i class="fa fa-edit"></i> Edit </a></li>';
            contentView += '<li><a href="javascript:void(0);" class="edit-c" data-action="delete" data-t="'+encryptedMsgId+'"><i class="fa fa-trash"></i> Delete </a></li>';
            contentView += '</ul>';
            contentView += '</div>';
            contentView += '</div>';
            contentView += '</div>';
            contentView += '</div>';
            contentView += '<div class="inbox-view scroller" style="height: 200px;">';
            contentView += '<p>';
            contentView += convertSCToHTML(item.body);

            contentView += '</div>';

            contentView += ' </div>';
            contentView += ' </div>';
            rowcount++;
        });
        view += '</div></div>';

        view += '<div class="col-lg-9 col-md-9 col-sm-9 col-xs-9 MSG-tab">';
        view += '<div class="MSG-tab-content active">';
        view += contentView;
        view += '</div></div>';
        view += '</div>';
    }
    else
    {
        view += '<div class="text-center"><img src="components/com_messages/assets/img/no_new_messages.png"><p>&nbsp;</p><p data-notifyMessage>No Scheduled Messages </p><p class="text-muted">You can a schedule a message by composing a new one via Compose New Message section and schedule that to send later.</p></div>';
    }
    callback(null, view);
}

function convertSCToHTML(targetValue)
{
    var msgText = targetValue;
    msgText = msgText.replace(/&quot;/g, '"');
    msgText = msgText.replace(/&lt;/g, '<');
    msgText = msgText.replace(/&gt;/g, '>');
    msgText = msgText.replace(/col;/g, ':');
    msgText = msgText.replace(/&amp;/g, '&');
    msgText = msgText.replace(/&#13;/g, '<br>');
    msgText = msgText.replace(/&#13;/g, '<br>');
    msgText = msgText.replace(/&#13;/g, '<br>');
    msgText = msgText.replace(/eql;/g, '=');
    msgText = msgText.replace(/&#39;/g, "'");
    return msgText;
}

function expandsTo(data, tempSocket, callback)
{
    var expandedView = '';
    var action = '';
    var actionAttr = '';

    if(data.type=='guest-name')
    {
        expandedView = '<label class="control-label col-md-2"><span>Guest Name</span></label><div class="col-md-10"><input type="text" class="form-control" data-guest-name name="guest_name_list" placeholder="Write Guest Name here... You can add multiple names."/></div>';
        action = 'render';
        actionAttr = 'data-guest-name';

        getGuestNames(function(err, data){
            var arr = [];

            data.forEach(function(item){
                var roomdesc = 'Standard Room';
                if(item.room_description!=""){ roomdesc=item.room_description; }
                arr.push({
                    id: item.guestid,
                    name: item.guestname + '  - Room ' + item.roomno // + ' - ' + item.room_description
                });
            });
            tempSocket.emit('recipient', { action: action, view: expandedView, actionAttr: actionAttr, dataList: arr });
        });
    }
    else if(data.type=='room-number')
    {
        expandedView = '<label class="control-label col-md-2"><span>Room Number</span></label><div class="col-md-10"><input type="text" class="form-control" data-room-number name="key_number_list" placeholder="Write Room Number here... You can add multiple rooms."/></div>';
        action = 'render';
        actionAttr = 'data-room-number';


        getRooms(function(err, data){
            //console.log(data);
            var arr = [];
            data.forEach(function(item){
                arr.push({
                    id: item.room_id,
                    name: 'Room ' + item.roomno + ' - ' + item.guestname // + ' - ' + item.room_description
                });
            });
            tempSocket.emit('recipient', { action: action, view: expandedView, actionAttr: actionAttr, dataList: arr });
        });
    }
    else if(data.type=='all-rooms')
    {
        action = 'destroy';
        tempSocket.emit('recipient', { action: action, view: expandedView, actionAttr: actionAttr, dataList: '' });
    }
    else if(data.type=='floor')
    {
        action = 'render';
        prepareRecipientView(data.type, function(err, floorView){
            tempSocket.emit('recipient', { action: action, view: floorView, actionAttr: actionAttr });
        });
    }
    else if(data.type=='group-code')
    {
        action = 'render';
        expandedView = '<label class="control-label col-md-2"><span>&nbsp;</span></label><div class="col-md-10">Currently, we don\'t have any Group Checkin available.</div>';
        getGroupCodes(function(err, data){
            if(err){ console.log('Error occurred at Get Group Codes'); }

            if(data.length > 0)
            {
                expandedView = '<label class="control-label col-md-2"><span>Group Code</span></label>';
                expandedView += '<div class="col-md-10">';
                expandedView += '<select class="form-control select" data-group-code name="group_code_list" placeholder="Write Group Code here... You can add Group Codes.">';
                expandedView += '<option value=""> Select a Group Code </option>';
                data.forEach(function(item){
                    expandedView += '<option value="'+encrypt_str(item.groupcode)+'">';
                    expandedView += item.groupcode;
                    expandedView += '</option>';
                });

                expandedView += '</select>';
                expandedView += '</div>';
            }

            tempSocket.emit('recipient', { action: action, view: expandedView });
        });
    }
    else if(data.type=='due-out')
    {
        action = 'destroy';
        tempSocket.emit('recipient', { action: action, view: expandedView, actionAttr: actionAttr, dataList: '' });
    }
    else if(data.type=='stay-over')
    {
        action = 'destroy';
        tempSocket.emit('recipient', { action: action, view: expandedView, actionAttr: actionAttr, dataList: '' });
    }
}

function getGroupCodes(callback)
{
    connection.query('SELECT distinct(`groupcode`) as groupcode FROM pmsi_guest WHERE groupcode!="NA" AND groupcode IS NOT NULL GROUP BY groupcode ORDER BY groupcode ASC', function(err, rows, fields) {
      if (err) throw err;
        callback(null, rows);
    });
}

function getCurrentTime(callback)
{
    var now = moment(new Date());
    callback(now.format("YYYY-MM-DD HH:mm:ss"));
}

function getMessagesToSend(callback)
{
    connection.query('SELECT * FROM messaging_message as mm WHERE UNIX_TIMESTAMP(mm.when_to_send) <= UNIX_TIMESTAMP(now()) AND mm.schedule=1', function(err, rows, fields) {
      if (err) throw err;
        callback(null, rows);
    });
}

function messageRequest(data, callback)
{
    var now = moment(new Date());
    var datetime = now.format("YYYY-MM-DD HH:mm:ss");
    var schedule = 0;
    var whenToSend = datetime;
    var trackStatus = encrypt_str(JSON.stringify(data));

    if(data.schedule.mode=='later')
    {
        whenToSend = data.schedule.date;
        schedule = 1;

        if(data.sendto=='guest-name')
        {
            checkGuestsCheckinTime(data, function(err, r){
                if(r.length==0)
                {
                    createMessagingMessage(data, datetime, whenToSend, schedule, trackStatus, function(err, rows){
                        callback(null, rows, '');
                    });
                }
                else if(r.length >= 1 && data.contains.length==r.length)
                {
                    callback(2, null, r);
                }
                else if(r.length >= 1 && data.contains.length!=r.length)
                {
                    callback(2, null, r);//callback(1, null, '');
                }
            });
        }
        else
        {
            createMessagingMessage(data, datetime, whenToSend, schedule, trackStatus, function(err, rows){
                callback(null, rows, '');
            });
        }
    }
    else
    {
        createMessagingMessage(data, datetime, whenToSend, schedule, trackStatus, function(err, rows){
            callback(null, rows, '');
        });
    }
}

function createMessagingMessage(data, datetime, whenToSend, schedule, trackStatus, callback)
{
    connection.query('INSERT INTO messaging_message (subject, body, sent, author_id, when_to_send, schedule, track_status, is_notification ) VALUES ("'+data.subject+'", "'+data.compose+'", "' + datetime + '", "'+data.authorId+'", "' + whenToSend + '", "' + schedule + '", "' + trackStatus + '", "' + data.isNotification + '")', function(err, rows, fields) {
        if (err) throw err;
        callback(null, rows);
    });
}

function checkGuestsCheckinTime(data, callback)
{
    var guestList = data.contains;
    if(guestList.length > 0)
    {
        var checkouttime = '11:45';
        var available = 0;
        var unavailable = 0;
        var guestArray = [];
        guestList.forEach(function(item){
            guestArray.push("'"+item.id+"'");
        });
        guestArray = ' ( ' + guestArray.join(',') + ' ) ';
        connection.query('SELECT * FROM `pmsi_guest` WHERE DATE(`guest_departure`) < DATE("' + data.schedule.date + '") AND `guestid` IN ' + guestArray , function(err, rows, fields) {
            if (err) throw err;
            callback(null, rows);
        });
    }
}

function processMessage(mid, data, tempSocket, callback)
{
    switch(data.sendto) {
        case 'all-rooms':
            actionOnAllRooms(mid, data, function(err, actionResponse){
                relateMessageAndGuest(mid, actionResponse, function(err, result){
                    if(result)
                    {
                        messageToDeliver(mid, actionResponse, result, function(err, response){
                            response.affectedRows ? callback(null, 1) : callback('Error in saving message', 0);
                        });
                    }
                    else
                    {
                        callback('Error in saving message', 0);
                    }
                });
            });
        break;
        case 'guest-name':
             actionOnGuestName(mid, data, function(err, actionResponse){
                relateMessageAndGuest(mid, actionResponse, function(err, result){
                  if(result)
                  {
                    messageToDeliver(mid, actionResponse, result, function(err, response){
                        response.affectedRows ? callback(null, 1) : callback('Error in saving message', 0);
                    });
                  }
                  else
                  {
                    callback('Error in saving message', 0);
                  }
                });
            });
        break;
        case 'room-number':
            actionOnRoomNumber(mid, data, function(err, actionResponse){
                relateMessageAndGuest(mid, actionResponse, function(err, result){
                   if(result)
                   {
                        messageToDeliver(mid, actionResponse, result, function(err, response){
                            response.affectedRows ? callback(null, 1) : callback('Error in saving message', 0);
                        });
                   }
                   else
                   {
                        callback('Error in saving message', 0);
                   }
                });
            });
        break;
        case 'floor':
            actionOnFloor(mid, data, function(err, actionResponse){
                relateMessageAndGuest(mid, actionResponse, function(err, result){
                 if(result)
                 {
                    messageToDeliver(mid, actionResponse, result, function(err, response){
                        response.affectedRows ? callback(null, 1) : callback('Error in saving message', 0);
                    });
                 }
                 else
                 {
                    callback('Error in saving message', 0);
                 }
                });
            });
        break;
        case 'group-code':
            actionOnGroupCode(mid, data, function(err, actionResponse){
                if(actionResponse)
                {
                    relateMessageAndGuest(mid, actionResponse, function(err, result){
                        if(result)
                        {
                            messageToDeliver(mid, actionResponse, result, function(err, response){
                                response.affectedRows ? callback(null, 1) : callback('Error in saving message', 0);
                            });
                        }
                        else
                        {
                            callback('Error in saving message', 0);
                        }
                    });
                }
                else
                {
                    callback('No guest available as checked-in for the supplied group code.', 0);
                }
            });
        case 'due-out':
            actionOnDueOut(mid, data, function(err, actionResponse){
                if(actionResponse)
                {
                    relateMessageAndGuest(mid, actionResponse, function(err, result){
                        if(result)
                        {
                            messageToDeliver(mid, actionResponse, result, function(err, response){
                                response.affectedRows ? callback(null, 1) : callback('Error in saving message', 0);
                            });
                        }
                        else
                        {
                            callback('Error in saving message', 0);
                        }
                    });
                }
                else
                {
                    callback('No guest available as Due Out', 0);
                }
            });
        break;
        case 'stay-over':
            actionOnStayOver(mid, data, function(err, actionResponse){
                if(actionResponse)
                {
                    relateMessageAndGuest(mid, actionResponse, function(err, result){
                        if(result)
                        {
                            messageToDeliver(mid, actionResponse, result, function(err, response){
                                response.affectedRows ? callback(null, 1) : callback('Error in saving message', 0);
                            });
                        }
                        else
                        {
                            callback('Error in saving message', 0);
                        }
                    });
                }
                else
                {
                    callback('No guest available as StayOver', 0);
                }
            });
        break;
        default:
        break;
    }
}

function messageToDeliver(mid, data, result, callback)
{
    var qValue = '';
    var itemCount = data.length;
    var conversationid = result.insertId;

    data.forEach(function(item){
            qValue += ' ( ';
            qValue += '"' + item.roomno + '" , "' + item.guestid + '" , "' + mid +'", "' + conversationid +'", "' + item.pc_ip +'" ';
            qValue += ' )';
            itemCount--;
            itemCount!=0 ? qValue += ',': '';
            conversationid++;
    });
    connection.query('INSERT INTO messaging_msg_to_delivery ( roomno, guestid, message_id, conversation_id, ip ) VALUES ' + qValue, function(err, rows, fields) {
      if (err) throw err;
        callback(null, rows);
    });
}

function actionOnAllRooms(mid, data, callback)
{
    connection.query('SELECT pg.roomno, pg.guestid, pg.guestname, pg.pc_ip, dv.room_no, dv.room_description FROM pmsi_guest as pg INNER JOIN digivalet_status as dv ON pg.pc_ip=dv.pc_ip WHERE pg.changeflag=0 AND dv.room_description NOT LIKE "%MstController%" GROUP BY pc_ip', function(err, rows, fields) {
      if (err) throw err;
        callback(null, rows);
    });
}

function actionOnDueOut(mid, data, callback)
{
    connection.query('SELECT * FROM `pmsi_guest` as pg WHERE DATE(pg.`guest_departure`)=DATE(NOW()) ', function(err, rows, fields) {
            if (err) throw err;
            if(rows.length)
            {
                callback(null, rows);
            }
            else
            {
                callback('Currently, No guest available as DueOut', null);
            }
        });
}

function actionOnStayOver(mid, data, callback)
{
    connection.query('SELECT * FROM `pmsi_guest` as pg WHERE DATE(pg.`guest_departure`)!=DATE(NOW()) ', function(err, rows, fields) {
            if (err) throw err;
            if(rows.length)
            {
                callback(null, rows);
            }
            else
            {
                callback('Currently, No guest available as StayOver', null);
            }
        });
}

function actionOnGroupCode(mid, data, callback)
{
    var groupcode = decrypt_str(data.contains);
    if(groupcode)
    {
        connection.query('SELECT pg.roomno, pg.guestid, pg.guestname, pg.pc_ip, dv.room_no, dv.room_description FROM pmsi_guest as pg INNER JOIN digivalet_status as dv ON pg.pc_ip=dv.pc_ip WHERE pg.changeflag=0 AND dv.room_description NOT LIKE "%MstController%" AND pg.groupcode="' + groupcode + '" GROUP BY pc_ip', function(err, rows, fields) {
            if (err) throw err;
            if(rows.length)
            {
                callback(null, rows);
            }
            else
            {
                callback('No guest available as checkedin for the supplied group code.', null);
            }
        });
    }
    else
    {
        callback('Invalid request. Calling for Group code without having group code.', null);
    }
}

function actionOnGuestName(mid, data, callback)
{
    var guestIdList = ' ( ';
    var itemCount = data.contains.length;
    data.contains.forEach(function(item){
        guestIdList += '"' + item.id + '"';
        itemCount--;
        itemCount!=0 ? guestIdList += ', ': '';
    });
    guestIdList += ' ) ';
    connection.query('SELECT pg.roomno, pg.guestid, pg.guestname, pg.pc_ip, dv.room_no, dv.room_description FROM pmsi_guest as pg INNER JOIN digivalet_status as dv ON pg.pc_ip=dv.pc_ip WHERE pg.changeflag=0 AND dv.room_description NOT LIKE "%MstController%" AND pg.guestid IN ' + guestIdList , function(err, rows, fields) {
      if (err) throw err;
        callback(null, rows);
    });
}

function actionOnRoomNumber(mid, data, callback)
{
    var roomIdList = ' ( ';
    var itemCount = data.contains.length;

    data.contains.forEach(function(item){

        roomIdList += '"' + item.id + '"';
        itemCount--;
        itemCount!=0 ? roomIdList += ', ': '';
    });
    roomIdList += ' ) ';
    connection.query('SELECT pg.roomno, pg.guestid, pg.guestname, pg.pc_ip, dv.room_no, dv.room_description FROM pmsi_guest as pg RIGHT JOIN digivalet_status as dv ON pg.pc_ip=dv.pc_ip INNER JOIN rooms as r ON r.room_name=pg.roomno WHERE pg.changeflag=0 AND dv.room_description NOT LIKE "%MstController%" AND r.room_id IN ' + roomIdList +'  GROUP BY pg.pc_ip' , function(err, rows, fields) {
      if (err) throw err;
        callback(null, rows);
    });
}

function actionOnFloor(mid, data, callback)
{
    var floorIdList = ' ( ';
    var itemCount = data.contains.length;
    data.contains.forEach(function(item){
        floorIdList += item.floorid;
        itemCount--;
        itemCount!=0 ? floorIdList += ', ': '';
    });
    floorIdList += ' ) ';
    connection.query('SELECT pg.*, f.*, r.*, fr.*, dv.room_no, dv.room_description FROM pmsi_guest as pg INNER JOIN digivalet_status as dv ON pg.pc_ip=dv.pc_ip INNER JOIN rooms as r ON pg.roomno=r.room_name INNER JOIN floor_rooms as fr ON fr.room_id=r.room_id INNER JOIN floors as f ON f.fid=fr.fid WHERE f.fid IN '+floorIdList+' AND pg.changeflag=0 AND dv.room_description NOT LIKE "%MstController%" GROUP BY pg.pc_ip', function(err, rows, fields) {
      if (err) throw err;
        callback(null, rows);
   });
}

function relateMessageAndGuest(mid, data, callback)
{
    if(data.length > 0)
    {
        var qValue = '';
        var itemCount = data.length;

        data.forEach(function(item){
                qValue += ' ( ';
                qValue += '"' + item.guestid + '" , "' + item.guestname + '" , "' + mid +'" ';
                qValue += ' )';
                itemCount--;
                itemCount!=0 ? qValue += ',': '';
        });
        connection.query('INSERT INTO messaging_user_message ( user_id, user_name, message_id) VALUES ' + qValue, function(err, rows, fields) {
          if (err) throw err;
            callback(null, rows);
        });
    }
    else
    {
    callback(null, null);
    }
}

function prepareRecipientView($type, callback)
{
    if($type=='floor')
    {
        var resView = '<label class="control-label col-md-2"> Floors </label><div class="col-md-10">';
        getRecipientData('', function(err, fetchedData){
            fetchedData.forEach(function(value){
                    resView += '<div class="col-md-3 nopadLeft">';
                    resView += '<div class="checkbox-list">';
                    resView += '<label>';
                    resView += '<input type="checkbox" value="'+value.fid+'" name="floor'+value.fid+'" data-floor='+value.fid+'>';
                    resView += value.fname;
                    resView += '</label>';
                    resView += '</div>';
                    resView += '</div>';
                });
            callback(null, resView);
        });
    }
}

function getRecipientData(data, callback)
{
    connection.query('SELECT * FROM iremote.floors WHERE 1', function(err, rows, fields) {
      if (err) throw err;
        callback(null, rows);
    });
}

function getRooms(callback)
{
    connection.query('SELECT * FROM iremote.pmsi_guest as pg INNER JOIN iremote.rooms as r ON pg.roomno=r.room_name WHERE pg.changeflag=0 OR pg.changeflag=1 group by pg.roomno', function(err, rows, fields) {
      if (err) throw err;
        callback(null, rows);
    });
}

function getGuestNames(callback)
{
    connection.query('SELECT pg.*, dv.room_description, dv.pc_ip FROM iremote.pmsi_guest as pg INNER JOIN digivalet_status as dv ON dv.pc_ip=pg.pc_ip WHERE changeflag=0 OR changeflag=1', function(err, rows, fields) {
      if (err) throw err;
        callback(null, rows);
    });
}

/*function getSentMessages(limit, callback)
{
    connection.query("SELECT um.message_id, um.conversation_id AS conversationId, GROUP_CONCAT(um.user_name SEPARATOR ', ') AS 'to', m.author_id AS authorId, m.subject, m.body, m.sent, u.name FROM messaging_user_message um, messaging_message m INNER JOIN migrate_users as u ON u.id=m.author_id WHERE m.message_id = um.message_id AND um.is_deleted=0 AND schedule=0 GROUP BY m.message_id ORDER BY m.sent DESC LIMIT " + limit, function(err, rows, fields) {
      if (err) throw err;
        callback(null, rows);
    });
}*/

function getSentMessages (data, callback)
{
    var filter = '';

    if(data.filter.searchByTCFrom && data.filter.searchByTCTo)
    {
        filter += " AND DATE_FORMAT(mm.`sent`, '%Y-%m-%d %H:%i') BETWEEN '" + data.filter.searchByTCFrom + "' AND '" + data.filter.searchByTCTo + "'";
    }
    if(data.filter.searchByTSFrom && data.filter.searchByTSTo)
    {
        filter += " AND DATE_FORMAT(mm.`when_to_send`, '%Y-%m-%d %H:%i') BETWEEN '" + data.filter.searchByTSFrom + "' AND '" + data.filter.searchByTSTo + "'";
    }
    if(data.filter.searchByNT!="")
    {
        filter += " AND mm.`is_notification` = " + data.filter.searchByNT;
    }
    connection.query("SELECT mm.*, mu.name FROM `messaging_message` as mm INNER JOIN migrate_users as mu ON mm.author_id=mu.id WHERE mm.schedule=0  " + filter + " ORDER BY mm.sent DESC LIMIT " + data.limit, function(err, rows, fields) {
      if (err) throw err;
        callback(null, rows);
    });
}

function getScheduledMessages (data, callback)
{
    var filter = '';

    if(data.filter.searchByTCFrom && data.filter.searchByTCTo)
    {
        filter += " AND DATE_FORMAT(mm.`sent`, '%Y-%m-%d %H:%i') BETWEEN '" + data.filter.searchByTCFrom + "' AND '" + data.filter.searchByTCTo + "'";
    }
    if(data.filter.searchByTSFrom && data.filter.searchByTSTo)
    {
        filter += " AND DATE_FORMAT(mm.`when_to_send`, '%Y-%m-%d %H:%i') BETWEEN '" + data.filter.searchByTSFrom + "' AND '" + data.filter.searchByTSTo + "'";
    }
    if(data.filter.searchByNT!="")
    {
        filter += " AND mm.`is_notification` = " + data.filter.searchByNT;
    }
    connection.query("SELECT mm.*, mu.name FROM `messaging_message` as mm INNER JOIN migrate_users as mu ON mm.author_id=mu.id WHERE mm.schedule=1  " + filter + " ORDER BY mm.sent DESC LIMIT " + data.limit, function(err, rows, fields) {
      if (err) throw err;
        callback(null, rows);
    });
}

function decrypt_str(encStr)
{
    try {
        var decipher    = crypto.createDecipher(algorithm, key);
        var decrypted   = decipher.update(encStr, 'hex', 'utf8') + decipher.final('utf8');

        return decrypted;
    }
    catch(err){
        return false;
    }
}

function encrypt_str(str)
{
    try {
        var cipher      = crypto.createCipher(algorithm, key);
        var encrypted   = cipher.update(str.toString(), 'utf8', 'hex') + cipher.final('hex');

        return encrypted;
    }
    catch(err){
        return false;
    }
}

function getButlerNames(callback)
{
    connection.query('SELECT * FROM `butler_info` WHERE is_deleted=0', function(err, rows, fields) {
      if (err) throw err;
        callback(null, rows);
    });
}

function getRoomNumbersForFilter(callback)
{
    connection.query('SELECT DISTINCT(`room_name`) as key_number FROM `rooms`', function(err, rows, fields) {
      if (err) throw err;
        var arr = [];
        if(rows.length > 0)
        {
            rows.forEach(function(item){
                arr.push({
                    id: item.key_number,
                    name: 'Room No. ' + item.key_number
                });
            });
            callback(null, arr);
        }
        else
        {
            callback('No Room Number found', null);
        }
    });
}

function getRoomNumbers(zoneid, callback)
{
    var zone_id = '';
    if(zoneid)
    {
        zone_id = decrypt_str(zoneid);
    }

    getRegisteredRooms(zone_id, function(err, data){
        var roomNumberString = '';
        var dl = data.length;
        var inClause = '';
        data.forEach(function(item){
            dl--;
            roomNumberString += '"' + item.key_number + '"';
            if(dl > 0){ roomNumberString  += ',' }
        });
        if(roomNumberString){ inClause = ' WHERE  room_name NOT IN ( ' + roomNumberString + ' ) '; }
        connection.query('SELECT DISTINCT(`room_name`) as key_number FROM `rooms` ' + inClause + ' ORDER BY key_number ASC', function(err, rows, fields) {
          if (err) throw err;
            callback(null, rows);
        });
    });
}

function getRegisteredRooms(zone_id, callback)
{
    //SELECT key_number FROM `butler_zone_map` as bzm INNER JOIN `butler_shift_map` as bsm ON bsm.zone_id=bzm.zone_id WHERE bzm.zone_id!="'+zone_id+'"
    connection.query('SELECT * FROM butler_zone_map as bzmap INNER JOIN butler_zones_master as bzmaster ON bzmaster.butler_zones_master_id=bzmap.zone_id WHERE bzmaster.is_deleted=0', function(err, rows, fields) {
      if (err) throw err;
        callback(null, rows);
    });
}

function getButlerList(callback)
{
    getButlerNames(function(err, data){
        var arr = [];

        data.forEach(function(item){
            arr.push({
                id: item.butler_info_id,
                name: item.butler_name
            });
        });

        callback(null, arr);
    });
}
function getShiftList(callback)
{
    getShiftNames(function(err, data){
        var arr = [];

        data.forEach(function(item){
            arr.push({
                id: item.shift_id,
                name: item.shift_name
            });
        });

        callback(null, arr);
    });
}

function getShiftNames(callback)
{
    connection.query('SELECT * FROM `butler_shift_timing` WHERE is_deleted=0', function(err, rows, fields) {
      if (err) throw err;
        callback(null, rows);
    });
}
function getZoneList(callback)
{
    getZoneNames(function(err, data){
        var arr = [];

        data.forEach(function(item){
            arr.push({
                id: item.shift_id,
                name: item.shift_name
            });
        });

        callback(null, arr);
    });
}

function getZoneNames(callback)
{
    connection.query('SELECT * FROM `butler_zones_master` WHERE is_deleted=0', function(err, rows, fields) {
      if (err) throw err;
        callback(null, rows);
    });
}

function getRoomNoList(zoneid, callback)
{
	getRoomNumbers(zoneid, function(err, data){
        var arr = [];

        data.forEach(function(item){
            arr.push({
                id: item.key_number,
                name: 'Room No. ' + item.key_number
            });
        });

        callback(null, arr);
    });
}

/** Manage Butler Section **/

//count(zonemap.zone_id) as zone_count, count(bst.shift_id) as shift_count, count(bi.butler_info_id) as butler_count,

function getButlerZones(callback)
{
    connection.query('SELECT zonemap.zone_id, bst.shift_id, zonemaster.zone_name, zonemaster.is_deleted as is_shift_deleted, key_number, bi.butler_info_id, bi.butler_name, bi.butler_sms_number, bi.butler_email, bst.shift_name, bst.time_start, bst.time_end FROM `butler_zones_master` zonemaster INNER JOIN `butler_zone_map` as zonemap ON zonemaster.butler_zones_master_id=zonemap.zone_id INNER JOIN butler_shift_map as shiftmap ON zonemap.zone_id=shiftmap.zone_id INNER JOIN butler_info as bi ON shiftmap.butler_info_id=bi.butler_info_id INNER JOIN `butler_shift_timing` as bst ON shiftmap.shift_id=bst.shift_id WHERE bi.is_deleted=0 ORDER BY zonemaster.butler_zones_master_id ASC, shiftmap.shift_id ASC', function(err, rows, fields) {
      if (err) throw err;
        callback(null, rows);
    });
}

function getShifts(callback)
{
    connection.query('SELECT * FROM butler_shift_timing as bst WHERE is_deleted=0 ORDER BY bst.shift_id ASC', function(err, rows, fields) {
      if (err) throw err;
        callback(null, rows);
    });
}

function getEditZoneView(data, callback)
{
    var zoneid = decrypt_str(data.zoneid);
    if(zoneid)
    {
        getZoneShiftMap(zoneid, function(err, zs){
            if(zs.length > 0)
            {
                connection.query('SELECT zonemap.zone_id, bst.shift_id, zonemaster.zone_name, zonemaster.is_deleted as is_shift_deleted, GROUP_CONCAT(key_number) as key_number, GROUP_CONCAT(DISTINCT CONCAT(bi.butler_info_id, "%%", bi.butler_name) ORDER BY bi.butler_info_id SEPARATOR ";") as butler_info, bi.butler_sms_number, bi.butler_email, bst.shift_name, bst.time_start, bst.time_end FROM `butler_zones_master` zonemaster INNER JOIN `butler_zone_map` as zonemap ON zonemaster.butler_zones_master_id=zonemap.zone_id INNER JOIN butler_shift_map as shiftmap ON zonemap.zone_id=shiftmap.zone_id INNER JOIN butler_info as bi ON shiftmap.butler_info_id=bi.butler_info_id INNER JOIN `butler_shift_timing` as bst ON shiftmap.shift_id=bst.shift_id WHERE zonemap.zone_id = "'+zoneid+'" AND zonemaster.is_deleted=0 AND bi.is_deleted=0 GROUP BY shift_id ORDER BY zonemaster.butler_zones_master_id ASC, shiftmap.shift_id, zonemap.key_number ASC', function(err, rows, fields) {
                  if (err) throw err;
                    callback(null, rows);
                });
            }
            else
            {
                connection.query('SELECT bz.butler_zones_master_id, bz.zone_name, bz.is_deleted, GROUP_CONCAT(bzm.key_number) as key_number, bzm.zone_id FROM butler_zones_master as bz INNER JOIN butler_zone_map as bzm ON bz.butler_zones_master_id=bzm.zone_id WHERE bzm.zone_id="'+zoneid+'" AND bz.is_deleted=0 ORDER BY bzm.key_number ASC', function(err, rows, fields) {
                  if (err) throw err;
                    callback(null, rows);
                });
            }
        });
    }
    else
    {
        callback('Invalid zone Id.', null);
    }
}

function getZoneShiftMap(zoneid, callback)
{
    if(zoneid)
    {
        connection.query('SELECT zone_id FROM `butler_shift_map` as bsm INNER JOIN butler_info as bi ON bi.butler_info_id=bsm.butler_info_id WHERE bsm.zone_id="'+zoneid+'" AND bi.is_deleted=0', function(err, rows, fields) {
          if (err) throw err;
            callback(null, rows);
        });
    }
    else
    {
        callback('Invalid zone Id.', null);
    }
}

function getEditButler(data, callback)
{
    var butlerid = decrypt_str(data.butlerid);
    if(butlerid)
    {
        //'SELECT zonemap.zone_id, GROUP_CONCAT(DISTINCT CONCAT(bst.shift_id, "%%", bst.shift_name) ORDER BY bst.shift_id SEPARATOR ";") as shift_info, GROUP_CONCAT(DISTINCT CONCAT(zonemap.zone_id, "%%", zonemaster.zone_name) ORDER BY zonemap.zone_id SEPARATOR ";") as zone_info, zonemaster.is_deleted as is_shift_deleted, key_number, bi.butler_info_id, bi.butler_name, bi.butler_sms_number, bi.butler_email, bst.time_start, bst.time_end FROM `butler_zones_master` zonemaster INNER JOIN `butler_zone_map` as zonemap ON zonemaster.butler_zones_master_id=zonemap.zone_id INNER JOIN butler_shift_map as shiftmap ON zonemap.zone_id=shiftmap.zone_id INNER JOIN butler_info as bi ON shiftmap.butler_info_id=bi.butler_info_id INNER JOIN `butler_shift_timing` as bst ON shiftmap.shift_id=bst.shift_id WHERE bi.butler_info_id = "'+butlerid+'" ORDER BY bst.shift_id ASC'
        connection.query('SELECT * FROM `butler_info` WHERE butler_info_id="'+butlerid+'" AND is_deleted=0', function(err, rows, fields) {
          if (err) throw err;
            callback(null, rows);
        });
    }
    else
    {
        callback('Invalid zone Id.', null);
    }
}

function getEditShiftView(data, callback)
{
    var shiftId = decrypt_str(data.shiftid);
    if(shiftId)
    {
        connection.query('SELECT * FROM butler_shift_timing as bst WHERE bst.shift_id="'+shiftId+'" ORDER BY bst.shift_id ASC', function(err, rows, fields) {
          if (err) throw err;
            callback(null, rows);
        });
    }
}
Array.prototype.unique = function() {
    var arr = [];
    for(var i = 0; i < this.length; i++) {
        if(!arr.contains(this[i])) {
            arr.push(this[i]);
        }
    }
    return arr;
}
Array.prototype.unique = function() {
    var arr = [];
    for(var i = 0; i < this.length; i++) {
        if(!arr.contains(this[i])) {
            arr.push(this[i]);
        }
    }
    return arr;
}
Array.prototype.contains = function(v) {
    for(var i = 0; i < this.length; i++) {
        if(this[i] === v) return true;
    }
    return false;
};
