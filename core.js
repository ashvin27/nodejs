/*******************************************************************************************************************
*
*                   Author: Paras Sahu
*                   Module: Utilites Front Controller
*                   Email: paras.sahu@digivalet.com
*
********************************************************************************************************************/

global.__base = __dirname + '/';

const https                = require('https'),
    express             = require('express'),
    app                 = express(),
    fs                  = require('fs'),
    config              = require(__base + 'config'),
    cors                = require('cors'),
    server              = https.createServer({
      key: fs.readFileSync(
        config.inpremise.server.ssl.certificate.key
      ),
      cert: fs.readFileSync(
        config.inpremise.server.ssl.certificate.pem
      ),
      ca: (config.inpremise.server.ssl.certificate.ca != false )
        ? fs.readFileSync(config.inpremise.server.ssl.certificate.ca) : false,
      rejectUnauthorized: config.inpremise.server.ssl.certificate.rejectUnauthorized
    }, app),
    io                  = require('socket.io').listen(server),
    mysql               = require('mysql'),
    bodyParser          = require('body-parser'),
    url                 = require('url'),
    path                = require('path'),
    crypto              = require('crypto'),
    request             = require('request'),
    serverKey           = '',
    serverPort          = config.inpremise.server.port,
    reqParam            = '',
    hotelid             = config.hotelProperties.hotelid,
    logger              = require(__base + 'components/logger').log(),
    logFormat           = require(__base + 'components/logger').format,
    //logViewer           = require('winston-logs-display')(app, logger),
    cron                = require('node-cron'),
    algorithm           = config.keys.aes.algorithm,
    key                 = config.keys.aes.key,
    moment              = require("moment"),
    fileSave            = require('save-file'),
    siofu               = require("socketio-file-upload"),
    /* **** MIDDLEWARES **** */

    /*  Request parsing middleware */

    requestParser = require('./middlewares/request-parser'),

    /*  oneAuth middleware */

    oneAuth = require('./middlewares/one-auth'),

    environment = require('./environment'),

    /* **** COMPONENTS **** */

    /** Component for Push Update APIs
    *  It will perform the operations for Create / Read / Update / Delete
    *  in behalf of Notification Manager and Sync Manager
    */

    pushUpdate = require('./components/core/push-update')({
      hid: process.env.HOTELID || hotelid
    }),

    /* ***** PUSH UPDATES ***** */

    /** Component for Push Update
    *  It will hold the responsibility of Push Updates
    */

    pu = require('./routes/push-updates'),

    /* ***** NOTIFICATIONS MANAGER ***** */

    /** Component for Notification Manager
    *  It will hold the responsibility of Management of Notifications
    *  on both the Instances (for CLOUD and IN-PREMISE)
    */

    nm = require('./routes/notifications'),

    /* ***** PROMOTIONS ***** */

    /** Component for Fetching and Updating PROMOTIONS
    */

    pr = require('./routes/promotions'),

    prMonitor = require('./components/core/promotions/monitor'),


    /* ***** COMMUNICATION CENTER ***** */

    /** Component for Fetch and Insert/Update Events in Communication Center
    *  Fetch All Events
    *  Insert/Update Guest info with room name as per Events
    */

    cc = require('./routes/communication-center'),

    /* ***** WEB RADIO ***** */

    /** Component for Fetch Radio Station Data from VTuner
    *  Fetch All Events
    */

    wr = require('./routes/web-radio'),

    /* ***** GUEST APP ***** */

    /** Component for serving Guest App with the services
    */

    ga = require('./routes/guest-app'),

    /* ***** Room Profile RADIO ***** */

    /** Component for Fetch Room Profiles
    *  Fetch All Events
    */

    rp = require('./routes/room-profile'),

    /* ***** NOTIFICATION MONITOR ***** */

    /** Component for Monitoring the Notifications
    *  It will hold the responsibility for monitoring the sync_requests
    *  between IN-PREMISE and CLOUD
    */

    nmMonitor = require('./components/core/notification-monitor');

    /* ***** PUSH UPDATE MONITOR ***** */

    /** Component for Monitoring the Push Updates
    *  It will hold the responsibility for monitoring
    *  the pus_update_records table to synchronize with
    *  push_update_schedules table on IN-PREMISE
    */

    pusrMonitor = require('./components/core/push-update/monitor'),

    /* ***** COMMUNICATION CENTER ***** */

    /** Component for making the logical flow for Messages
    */

    cEvents = require('./components/core/communication-center/events'),

    cMessages = require('./components/core/communication-center/messages'),

    eLog = require('./components/core/event-log'),

    /* ***** Messages MONITOR ***** */

    /** Component for Monitoring the messages
    *  It will hold the responsibility for monitoring
    *  the cmc_messages table to synchronize with
    *  cmc_message_delivery_mapping table on IN-PREMISE
    */

    msgMonitor = require('./components/core/communication-center/messages/monitor'),
      /* ***** Room Profile Management Controller ***** */

    roomprofile = require('./components/core/room-profile'),


    ioa = require(__base +
      '/components/core/irdOrderAlert/'),

    iogf = require(__base +
      '/components/core/guest-feedback/'),

    serviceAss = require(__base +
      '/components/core/serviceAssistanceAlert/'),
    ioMonitor = require(__base + '/components/core/irdOrderAlert/monitor'),

    /* ***** doorLock log event MONITOR ***** */

    /** Component for Monitoring the latest and updated record
    */

    evlogMonitor = require('./components/core/event-log/monitor');

    /** Component for Monitoring the profile assigment is expire or not
    */
    roomProfileMonitor = require('./components/core/room-profile/monitor');

app.use(cors());

// parse application/json
app.use(bodyParser.raw({
  type: config.cloud.headers.contentType
}));

/** Integrating Request Parser middleware with Express HTTP Server */
app.use(requestParser);

/** Integrating oneAuth middleware with Express HTTP Server */
app.use(oneAuth);

/** Integrating Push Update API Route with Express HTTP Server */
app.use('/push-updates', pu);

/** Integrating Notification Manager API Route with Express HTTP Server */
app.use('/notifications', nm);

/** Integrating Promotions API Route with Express HTTP Server */
app.use('/promotions', pr);

/** Integrating Communication Center API Route with Express HTTP Server */
app.use('/communication-center', cc);

/** Integrating web-radio API Route with Express HTTP Server */
app.use('/web-radio', wr);

/** Integrating Guest App API Route with Express HTTP Server */
app.use('/guest-app', ga);

/** Integrating room-profile API Route with Express HTTP Server */
app.use('/room-profiles', rp);

if (config.server.environment != 'development') {
  let access = fs.createWriteStream(config.inpremise.server.logs.path.debuglog);
  process.stdout.write = process.stderr.write = access.write.bind(access);
}

app.use(function (err, req, res, next) {
  //if(!err.statusCode) err.statusCode = 500;
  console.log(err.stack);
  res.status(401).send('<h2>Unauthorized Access !</h2>')
});

/** Disabling  x-powered-by Response header of Express HTTP Server */
app.disable('x-powered-by');

let socketAuth = function socketAuth(socket, next) {
    try {
        let access_token = socket.handshake.query.access_token;
    } catch (e) {
        e.getMessage();
        return next(new Error(JSON.stringify({
            status: false,
            message: "Not Authenticated",
            data: [],
            response_tag: 1
        })));
    }
    return next();
};

const irdOrderAlert = io.of('/irdOrderAlert');
irdOrderAlert.use(socketAuth);
irdOrderAlert.on('connection', ioa.onConnect);


const serviceAssistance = io.of('/serviceAssistanceAlert');
serviceAssistance.use(socketAuth);
serviceAssistance.on('connection', serviceAss.onConnect);

const communicationCenterIO = io.of('/communicationCenter');
communicationCenterIO.on('connection', cEvents.onConnect);
communicationCenterIO.on('connection', cMessages.onConnect);

const eventLogIO = io.of('/eventLog');
eventLogIO.on('connection', eLog.onConnect);

const rProfileServiceIO = io.of('/roomProfile');
rProfileServiceIO.on('connection', roomprofile.onConnect);

const guestFeedback = io.of('/guest-feedback');

guestFeedback.use(socketAuth);
guestFeedback.on('connection', iogf.onConnect);
/*guestFeedback.on('connection', () => {
  console.log("guestFeedback", 'connected');
});*/

/** Starting to listen Express HTTP Server on defined port (in config.js) */
server.listen(serverPort); // starting web server
