/*********************************************************
 *  Author: Ashvin Patel
 *  Module: Dashboards Front Controller
 *  Email: ashvin.patel@digivalet.com
 *********************************************************/

global.__base = __dirname + '/';
const https = require('https'),
      express = require('express'),
      app = express(),
      fs = require('fs'),
      config = require(__base + 'config'),
      server = https.createServer({
        key: fs.readFileSync(
          config.inpremise.server.ssl.certificate.key
        ),
        cert: fs.readFileSync(
          config.inpremise.server.ssl.certificate.pem
        ),
        ca: (config.inpremise.server.ssl.certificate.ca != false )
          ? fs.readFileSync(config.inpremise.server.ssl.certificate.ca) : false,
        requestCert: config.inpremise.server.ssl.certificate.requestCert,
        rejectUnauthorized: config.inpremise.server.ssl.certificate.rejectUnauthorized
      }, app),
      io = require('socket.io').listen(server, { wsEngine: 'ws' }),
      mysql = require('mysql'),
      url = require('url'),
      path = require('path'),
      serverKey = '',
      serverPort = config.inpremise.server.port,
      reqParam = '',
      hotelid = config.hotelProperties.hotelid,
      algorithm = config.keys.aes.algorithm,
      key = config.keys.aes.key,
      digivaletDashboard = require(__base + '/components/dashboard/digivalet');
      engineeringDashboard = require(__base +
        '/components/dashboard/engineering');
      frontOfficeDashboard = require(__base +
          '/components/dashboard/frontoffice');
      pushUpdateDashboard = require(__base +
          '/components/dashboard/pushupdate');


if (config.server.environment != 'development') {
  let access = fs.createWriteStream(config.inpremise.server.logs.path.debuglog);
  process.stdout.write = process.stderr.write = access.write.bind(access);
}

/** Disabling  x-powered-by Response header of Express HTTP Server */
app.disable('x-powered-by');

/** Digivalet dashboard socket connection initialization **/
const digivaletIO = io.of('/dashboard-digivalet');
/** Engineering dashboard socket connection initialization **/
const engineeringIO = io.of('/dashboard-engineering');
/** FrontOffice dashboard socket connection initialization **/
const frontOfficeIO = io.of('/dashboard-frontoffice');
/** push update dashboard socket connection initialization **/
const pushUpdateIO = io.of('/dashboard-pushupdate');

/** Set environment varibales **/
const environment = require('./environment');

//digivaletIO.use(socketAuth);
//engineeringIO.use(socketAuth);
//frontOfficeIO.use(socketAuth);

/** Initialize socket connection for DigiValet Dashboard **/
digivaletIO.on('connection', digivaletDashboard.onConnect);
/** Initialize socket connection for Engineering  Dashboard **/
engineeringIO.on('connection', engineeringDashboard.onConnect);
/** Initialize socket connection for FrontOffice  Dashboard **/
frontOfficeIO.on('connection', frontOfficeDashboard.onConnect)
/** Initialize socket connection for push update Dashboard **/
pushUpdateIO.on('connection', pushUpdateDashboard.onConnect)

/** Starting to listen Express HTTP Server on defined port (in config.js) */
server.listen(config.inpremise.dashboard.port); // starting web server
