let
express     = require('express'),
router      = express.Router(),
pushUpdateRecords     = require(__base +
  'components/db-master/push-update-records'),
status      = require(__base +
    'components/db-master/push-update-status'),
helper          = require(__base +
        'components/core/helper/push-updates')({}),
pushUpdateSchedule = require(__base +
  'components/db-master/push-update-schedules')({}),
pushUpdateFeatures = require(__base +
        'components/db-master/push-update-features'),
DVStatus = require(__base + 'components/core/helper/http-status-codes'),
logger              = require(__base + 'components/logger').log(),
logFormat           = require(__base + 'components/logger').format;

/* GET push update records */
router.get('/records', (req, res, next) => {
  pushUpdateRecords.get((err, puRecord) => {
    if(puRecord && puRecord.constructor === Array && puRecord.length > 0) {
      helper.pushUpdateJson(puRecord, (err, response) => {
        if(response) {
          logger.log(logFormat('info', DVStatus.getMessage(
            DVStatus.RECORDS_NOT_AVAIALBE, 'Push update')));
          res
          .status(DVStatus.OK)
          .send({
              status: true,
              message: DVStatus.getMessage(DVStatus.RECORDS_AVAILABLE,
              'Push update records'),
              description: '',
              data: response,
              response_tag: DVStatus.RECORDS_AVAILABLE
          });

        } else {
          res
          .status(DVStatus.ACCEPTED)
          .send({
              status: false,
              message: DVStatus.getMessage(DVStatus.RECORD_CREATION_FAILURE,
              'Push update records'),
              description: err,
              data: [],
              response_tag: DVStatus.RECORD_CREATION_FAILURE
          });

        }
      });
    } else {
      logger.log(logFormat('info', DVStatus.getMessage(
        DVStatus.RECORDS_NOT_AVAIALBE, 'Push update')));

      res.status(DVStatus.NO_CONTENT).send({
        status: false,
        message: DVStatus.getMessage(
          DVStatus.RECORDS_NOT_AVAIALBE),
        description: '',
        data: [],
        response_tag: DVStatus.RECORDS_NOT_AVAIALBE
      });
    }
  });
});

/* PATCH push update - SINGLE */
router.patch('/status/:id', (req, res) => {
  status.patch({
    what: req.body,
    where: req.params.id
  }, (err, response) => {
      if(response) {
        res
        .status(DVStatus.CREATED)
        .send({
            status: true,
            message: DVStatus.getMessage(DVStatus.RECORD_UPDATE_SUCCESS,
            'Push update records'),
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
            'Push update records'),
            description: '',
            data: response,
            response_tag: DVStatus.RECORD_UPDATE_FAILURE
        });
      }
  });
});

/* PATCH push update  - BULK */
router.patch('/status/', (req, res) => {
  status.bulkPatch(req.body, (err, response) => {
      console.log(response);
      if(response) {
        logger.log(logFormat('info', DVStatus.getMessage(
          DVStatus.RECORD_UPDATE_SUCCESS, 'Push update')));
        res
        .status(DVStatus.OK)
        .send({
            status: true,
            message: DVStatus.getMessage(
              DVStatus.RECORD_UPDATE_SUCCESS,
            'Push update status'),
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
            'Push update status'),
            description: '',
            data: response,
            response_tag: DVStatus.RECORD_UPDATE_FAILURE
        });
      }
  });
});

/* POST push update */
router.post('/scheduler/', (req, res) => {
  if (req.body.generate_push == 1) {
    let data = {
      ip_addr: req.body.ip_addr,
      browser: req.body.browser,
      description: req.body.description,
      applied_filters: JSON.stringify(req.body.filters_applied),
      schedule_for: req.body.schedule_for,
      update_type: req.body.push_type,
      is_processed: 0,
      is_active: 1,
      is_deleted: 0,
      hotel_id: req.body.hotel_id,
      created_by: req.body.created_by
    };
    
    if ((req.body.generate_sqlite == 1) || (req.body.sync_tables == 1))
      data.from_sync = 1;
      
    if (req.body.checkin_status != undefined)
      data.checkin_filter = req.body.checkin_status;

    if (data.schedule_for == '0')
      data.schedule_for_date = require('moment')(req.body.push_date + ' ' + req.body.push_time).format('YYYY-MM-DD HH:mm:ss');

    if (data.browser.includes("Postman") || data.browser.includes("postman"))
      data.platform = 'postman';
    else
      data.platform = 'cms-tool';

    let what = ['feature_id', 'version'];
    let conditions = {
      where: {
        is_active: 1,
        is_deleted: 0
      },
      whereIn: {
        col: 'sqlite_name',
        vals: req.body.module_name
      }
    };

    pushUpdateFeatures.select(what, conditions, (fErr, fRes) => {
      if(fRes) {
        let feature_ids = '';
        let feature_versions = '';

        fRes.forEach((singleFeature, index) => {
          feature_ids += (index + 1) == fRes.length ? singleFeature.feature_id : (singleFeature.feature_id + ',');
          feature_versions += (index + 1) == fRes.length ? singleFeature.version : (singleFeature.version + ',');
        });

        data.feature_ids = feature_ids;
        data.feature_versions = feature_versions;
        pushUpdateSchedule.insert(data, (iErr, iRes) => {
          if(iRes) {
            res.status(DVStatus.OK).send({
              status: true,
              message: DVStatus.getMessage(DVStatus.RECORD_CREATION_SUCCESS,
              'Push update schedule'),
              description: '',
              data: {
                insertId: iRes
              },
              response_tag: DVStatus.RECORD_CREATION_SUCCESS
            });
          } else {
            res.status(DVStatus.ACCEPTED).send({
              status: false,
              message: DVStatus.getMessage(DVStatus.RECORD_CREATION_FAILURE,
              'Push update schedule'),
              description: '',
              data: {},
              response_tag: DVStatus.RECORD_CREATION_FAILURE
            });
          }
        });
      } else {
        res.status(DVStatus.ACCEPTED).send({
          status: false,
          message: DVStatus.getMessage(DVStatus.RECORD_CREATION_FAILURE,
          'Push update schedule'),
          description: fErr,
          data: {},
          response_tag: DVStatus.RECORD_CREATION_FAILURE
        });
      }
    });
  } else {
    res.status(DVStatus.ACCEPTED).send({
      status: true,
      message: 'Schedule not required for this request.',
      description: '',
      data: {
        insertId: [null]
      },
      response_tag: DVStatus.RECORD_CREATION_SUCCESS
    });
  }
});

/* Middleware for error handling */
router.use((err, req, res, next) => {
  console.log(err.stack);
  res.status(500).send('Something broke !');
});

/* Exporting module */
module.exports = router;
