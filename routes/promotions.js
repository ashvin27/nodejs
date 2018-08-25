let express     = require('express'),
router      = express.Router(),
bodyParser  = require('body-parser'),
promotions  = require(__base +
  'components/core/promotions')({}),
DVStatus = require(__base + 'components/core/helper/http-status-codes'),
logger      = require(__base + 'components/logger').log(),
logFormat   = require(__base + 'components/logger').format;

/* GET list of promotions to send */
router.get('/list', (req, res) => {
  promotions.list((plErr, plRes) => {
    if(plRes) {
      res
      .status(DVStatus.OK)
      .send({
          status: true,
          message: DVStatus.getMessage(DVStatus.RECORDS_AVAILABLE,
          'Promotions Fetched'),
          description: '',
          data: plRes,
          response_tag: DVStatus.RECORDS_AVAILABLE
      });
    } else {
      res
      .status(DVStatus.NO_CONTENT)
      .send({
          status: false,
          message: DVStatus.getMessage(DVStatus.RECORDS_NOT_AVAIALBE,
          'Promotions Received'),
          description: '',
          data: {},
          response_tag: DVStatus.RECORDS_NOT_AVAIALBE
      });
    }
  });
});

/* PATCH for marking the promotion as receieved */

router.patch('/received/', (req, res) => {
  let body = req.body;
  if(typeof body.in_room_device_id!=='undefined' &&
  body.in_room_device_id!="") {
    let where = {
      in_room_device_id: body.in_room_device_id
    };
    promotions.promotionReceived(where, (plErr, plRes) => {
      if(plRes) {
        res
        .status(DVStatus.OK)
        .send({
            status: true,
            message: DVStatus.getMessage(DVStatus.RECORD_UPDATE_SUCCESS,
            'Promotions Received'),
            description: '',
            data: {},
            response_tag: DVStatus.RECORD_UPDATE_SUCCESS
        });
      } else {
        res
        .status(DVStatus.ACCEPTED)
        .send({
            status: false,
            message: DVStatus.getMessage(DVStatus.RECORD_UPDATE_FAILURE,
            'Promotions Received'),
            description: '',
            data: {},
            response_tag: DVStatus.RECORD_UPDATE_FAILURE
        });
      }
    });
  } else {
    res
    .status(DVStatus.NOT_ACCEPTABLE)
    .send({
        status: false,
        message: DVStatus.getMessage(DVStatus.REQUEST_BODY_NOT_ACCEPTABLE,
        'Notification'),
        description: '',
        data: [],
        response_tag: DVStatus.REQUEST_BODY_NOT_ACCEPTABLE
    });
  }
});
/*************************getAllPromotions according to in_room_device id*********************/
router.post('/getAllPromotions/', (req, res) => {
  let body = req.body;
  console.log('body is ===', body)
  if(typeof body.in_room_device_id!=='undefined' &&
  body.in_room_device_id!="") {
    let where = {
      in_room_device_id: body.in_room_device_id
    };
    promotions.getAllPromotions(where, (plErr, plRes) => {
       //console.log('final res'+plErr,"----------------------", plRes);
      if(plRes) {
        res
        .status(DVStatus.OK)
        .send({
            status: true,
            message: DVStatus.getMessage(DVStatus.RECORD_UPDATE_SUCCESS,
            'Promotions Received'),
            description: '',
            details: plRes,
            response_tag: DVStatus.RECORD_UPDATE_SUCCESS
        });
      } else {
        res
        .status(DVStatus.ACCEPTED)
        .send({
            status: false,
            message: DVStatus.getMessage(DVStatus.RECORD_UPDATE_FAILURE,
            'Promotions Received'),
            description: '',
            data: {},
            response_tag: DVStatus.RECORD_UPDATE_FAILURE
        });
      }
    });
  } else {
    res
    .status(DVStatus.NOT_ACCEPTABLE)
    .send({
        status: false,
        message: DVStatus.getMessage(DVStatus.REQUEST_BODY_NOT_ACCEPTABLE,
        'Notification'),
        description: '',
        data: [],
        response_tag: DVStatus.REQUEST_BODY_NOT_ACCEPTABLE
    });
  }
});
/* Exporting module */
module.exports = router;
