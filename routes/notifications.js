let express     = require('express'),
router          = express.Router(),
syncRequests    = require(__base + '/components/db-master/sync-requests'),
DVStatus = require(__base + 'components/core/helper/http-status-codes');

router.use((err, req, res, next) => {
  next();
  res.status(500).send('Something broke !');
});

/* ****
* End Point: 'notifications'
* Route: '/'
**** */

/* CREATE request */
router.post('/', (req, res, next) => {
    let body = req.body;
    if("requests" in body) {
      syncRequests.insert(body.requests, (r) => {
        console.log('*********************************syncRequests.insert', body.requests)
        if(r && r.constructor === Object) {
          res
          .status(DVStatus.CREATED)
          .send({
              status: true,
              message: DVStatus.getMessage(DVStatus.RECORD_CREATION_SUCCESS,
              'Notification'),
              description: '',
              data: r,
              response_tag: DVStatus.RECORD_CREATION_SUCCESS
          });
        } else {
          res
          .status(DVStatus.ACCEPTED)
          .send({
              status: false,
              message: DVStatus.getMessage(DVStatus.RECORD_CREATION_FAILURE,
              'Notification'),
              description: nErr,
              data: [],
              response_tag: DVStatus.RECORD_CREATION_FAILURE
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

/* PUT request */
router.put('/', function(req, res, next) {
  let body = req.body;
  console.log('PUT REQUEST');
  console.log(body);
  syncRequests.updateSyncRequests({
    state: body.state
  }, {
    sync_requests_id: body.sync_requests_id
  }, (response) => {
    if(response) {
      res
      .status(DVStatus.NO_CONTENT)
      .send({
          status: true,
          message: DVStatus.getMessage(DVStatus.RECORD_UPDATE_SUCCESS,
          'Notification'),
          data: [],
          response_tag: DVStatus.RECORD_UPDATE_SUCCESS
      });
    } else {
      res
      .status(DVStatus.ACCEPTED)
      .send({
          status: false,
          message: DVStatus.getMessage(DVStatus.RECORD_UPDATE_FAILURE,
          'Notification'),
          data: [],
          response_tag: DVStatus.RECORD_UPDATE_FAILURE
      });
    }
  });
});

router.use((err, req, res, next) => {
  res
  .status(DVStatus.INTERNAL_SERVER_ERROR)
  .send({
      status: false,
      message: DVStatus.getMessage(DVStatus.INTERNAL_SERVER_ERROR),
      data: [],
      response_tag: DVStatus.INTERNAL_SERVER_ERROR
  });
});

/* Exporting module */
module.exports = router;
