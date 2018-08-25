let dbObj = require('./connection'),
  logger = require(__base + 'components/logger').log(),
  logFormat = require(__base + 'components/logger').format;

let guestFeedback = {
  getRecords: (callback) => {
    dbObj.count("guest_feedback_id as total_count")
      .from('guest_feedback')
      .whereRaw('is_active = 1 and is_deleted = 0')
      .then((res) => {
        callback(null, res);
      })
      .catch((err) => {
        logger.log(logFormat('error', err));
        callback(err, null);
      })
  }
};

module.exports = guestFeedback;
