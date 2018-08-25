let express     = require('express'),
router      = express.Router(),
bodyParser  = require('body-parser'),
records     = require(__base +
  'components/db-master/push-update-records'),
helper      = require(__base +
        'components/core/helper/push-updates')({}),
cmcEvents  = require(__base +
  'components/core/communication-center/events'),
cmcMessages  = require(__base +
  'components/core/communication-center/messages'),
cmcMessageDeliver      = require(__base +
    'components/db-master/communicationCenter/message-deliver.js'),
DVStatus = require(__base + 'components/core/helper/http-status-codes'),
logger      = require(__base + 'components/logger').log(),
logFormat   = require(__base + 'components/logger').format;


/* GET Method list of all events send to ipad */
router.get('/events/all/:user_id', (req, res) => {
  cmcEvents.events(0,req.params.user_id, (iErr, iRes) => {
    if(iRes) {
      //console.log('PRINT ALL DATA GET FROM SERVER : '+iRes[0]);
      res
      .status(DVStatus.OK)
      .send({
          status: true,
          message: DVStatus.getMessage(DVStatus.RECORDS_AVAILABLE,
          'Events'),
          description: '',
          data: iRes[0],
          response_tag: DVStatus.RECORDS_AVAILABLE
      });
    } else {
      res
      .status(DVStatus.ACCEPTED)
      .send({
          status: false,
          message: DVStatus.getMessage(DVStatus.RECORDS_NOT_AVAIALBE,
          'Events'),
          description: '',
          data: {},
          response_tag: DVStatus.RECORDS_NOT_AVAIALBE
      });
    }
  });
});


/* GET Method list of all events send to ipad */
// router.get('/events/', (req, res) => {
//   cmcEvents.events(0, (iErr, iRes) => {
//     if(iRes) {
//       //console.log('PRINT ALL DATA GET FROM SERVER : '+iRes[0]);
//       res
//       .status(DVStatus.OK)
//       .send({
//           status: true,
//           message: DVStatus.getMessage(DVStatus.RECORDS_AVAILABLE,
//           'Events'),
//           description: '',
//           data: iRes[0],
//           response_tag: DVStatus.RECORDS_AVAILABLE
//       });
//     } else {
//       res
//       .status(DVStatus.ACCEPTED)
//       .send({
//           status: false,
//           message: DVStatus.getMessage(DVStatus.RECORDS_NOT_AVAIALBE,
//           'Events'),
//           description: '',
//           data: {},
//           response_tag: DVStatus.RECORDS_NOT_AVAIALBE
//       });
//     }
//   });
// });

/* GET Method list of all events send to ipad */
router.get('/events/:id', (req, res) => {
  cmcEvents.events(req.params.id,"", (iErr, iRes) => {
    if(iRes) {
      //console.log('PRINT ALL DATA GET FROM SERVER : '+iRes[0]);
      res
      .status(DVStatus.OK)
      .send({
          status: true,
          message: DVStatus.getMessage(DVStatus.RECORDS_AVAILABLE,
          'Events'),
          description: '',
          data: iRes[0],
          response_tag: DVStatus.RECORDS_AVAILABLE
      });
    } else {
      res
      .status(DVStatus.ACCEPTED)
      .send({
          status: false,
          message: DVStatus.getMessage(DVStatus.RECORDS_NOT_AVAIALBE,
          'Events'),
          description: '',
          data: {},
          response_tag: DVStatus.RECORDS_NOT_AVAIALBE
      });
    }
  });
});


/* POST method used for guest interest show on events */
router.post('/events/interest', (req, res) => {
  let body = req.body;
  let data = {
    pmsi_guest_id: body.pmsi_guest_id,
    event_id: body.event_id,
    hotel_id: body.hotel_id,
    key_id: body.key_id,
    recurring_map_id: body.recurring_map_id,
    created_by: 1,
    device_type: body.device_type,
    in_room_device_id: body.in_room_device_id
  };

  cmcEvents.insertInterestedGuestNew(data, (iErr, iRes) => {

    if(iRes && iRes!=0 && iRes!=1) {
      res
      .status(DVStatus.OK)
      .send({
          status: true,
          message: DVStatus.getMessage(DVStatus.RECORD_CREATION_SUCCESS,
          'Interested guest'),
          description: '',
          data: {
            insertId: iRes
          },
          response_tag: DVStatus.RECORD_CREATION_SUCCESS
      });
    }   else if(iRes==0){
     res
       .status(DVStatus.OK)
       .send({
           status: true,
           message: DVStatus.getMessage(DVStatus.ALREADY_REQUESTED,
           'Interested guest'),
           description: '',
           data: {
             insertId: [0]
           },
           response_tag: DVStatus.ALREADY_REQUESTED
       });
    }else if(iRes==1){
       res
       .status(DVStatus.OK)
       .send({
           status: true,
           message: DVStatus.getMessage(DVStatus.NOT_AVAILABLE_EVENT,
           'Interested guest'),
           description: '',
           data: {
             insertId: [0]
           },
           response_tag: DVStatus.NOT_AVAILABLE_EVENT
       });
    }else {
     res
      .status(DVStatus.ACCEPTED)
      .send({
          status: false,
          message: DVStatus.getMessage(DVStatus.RECORD_CREATION_FAILURE,
          'Interested guest'),
          description: '',
          data: {},
          response_tag: DVStatus.RECORD_CREATION_FAILURE
      });
    }
  });
});


/* GET Method list of all messages send to ipad */
router.get('/messages/', (req, res) => {
    cmcMessages.messages((iErr, iRes) => {
      if (iRes) {
          res
          .status(DVStatus.OK)
          .send({
              status: true,
              message: DVStatus.getMessage(DVStatus.RECORDS_AVAILABLE,
                  'Messages'),
              description: '',
              data: iRes[0],
              response_tag: DVStatus.RECORDS_AVAILABLE
          });
      } else {
          res
          .status(DVStatus.ACCEPTED)
          .send({
              status: false,
              message: DVStatus.getMessage(DVStatus.RECORDS_NOT_AVAIALBE,
                  'Messages'),
              description: iErr,
              data: {},
              response_tag: DVStatus.RECORDS_NOT_AVAIALBE
          });
      }
  });
});

/* PATCH deliver update - SINGLE */
router.patch('/messages/deliver/:id', (req, res) => {
  if(req.body.delivery_status != 0) {
    cmcMessageDeliver.patch({
      what: req.body,
      where: req.params.id
    }, (err, response) => {
        if(response) {
          res
          .status(DVStatus.CREATED)
          .send({
              status: true,
              message: DVStatus.getMessage(DVStatus.RECORD_UPDATE_SUCCESS,
              'Message delivered'),
              description: '',
              data: response,
              response_tag: DVStatus.RECORD_UPDATE_SUCCESS
          });
        } else {
          res
          .status(DVStatus.ACCEPTED)
          .send({
              status: false,
              message: DVStatus.getMessage(DVStatus.RECORD_UPDATE_FAILURE,
              'Message not delivered'),
              description: '',
              data: response,
              response_tag: DVStatus.RECORD_UPDATE_FAILURE
          });
        }
    });
  }else {
    res
    .status(DVStatus.ACCEPTED)
    .send({
        status: false,
        message: DVStatus.getMessage(DVStatus.RECORD_UPDATE_FAILURE,
        'Please Enter correct deliver status!'),
        description: '',
        data: '',
        response_tag: DVStatus.RECORD_UPDATE_FAILURE
    });
  }
});

/* Exporting module */
module.exports = router;
