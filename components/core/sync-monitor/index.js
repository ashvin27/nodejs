/*******************************************************************************************************************
*
*                   Author: Paras Sahu
*                   Module: Message handler for DigiValet Content Management
*                   Email: paras.sahu@digivalet.com
*
********************************************************************************************************************/
const HOTELID = 1;
let http                = require('http'),
    express             = require('express'),
    app                 = express(),
    server              = http.createServer(app),
    io                  = require('socket.io').listen(server),
    fs                  = require('fs'),
    mysql               = require('mysql'),
    bodyParser          = require('body-parser'),
    url                 = require('url'),
    config              = require('../../../config'),
    crypto              = require('crypto'),
    request             = require('request'),
    serverKey           = '',
    serverPort            = '8017',
    reqParam            = "",
    validator           = require('validator'),
    cron                = require('node-cron'),
    algorithm = 'aes256',
    key = '3C8F9670ED060D24502F17A58F1C9F6F37BED9A98FD23664EA4D0FFE86A0491B',
    connectionsArray    = [],
    moment = require("moment"),
    lightRoomNoArray = [],
    acRoomNoArray = [],
    tvRoomNoArray = [],
    sPRoomNoArray = [],
    pollingTimerContainer,
    btoa = require('btoa'),
    net = require('net'),

    dbmanager = require('./dbmanager'),
    db      = require('knex')({
      client: 'mysql',
      connection: {
        host : config.sql.host,
        user : config.sql.user,
        password : config.sql.password,
        database : config.sql.database,
        debug: config.sql.debugmode
      },
      pool: {min: config.sql.pool.min, max: config.sql.pool.max}
    }),
    pushUpdate = require('./apis')({
      db: db,
      hid: HOTELID
    });
app.set('view engine', 'ejs');

app.use( bodyParser.json() );       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
}));

app.disable('x-powered-by');

server.listen(serverPort); // starting web server

app.post('/', function(req, res) {
    console.log(req);
    res.write("Update Manager");
    res.end();
});

app.post('/push-update/records/to-sync/get', function(req, res) {
  pushUpdate.status.get.toPush(res, function(err, r){
    if(!err) {
      res.status(200).send(r);
    }
  });
});

app.get('*', function(req, res) {
  res.status(404).send('Sorry, Page not found.');
});
