let config = require(__base + 'config'),
oneAuth = require(__base + 'components/one-auth/')({}),
DVStatus = require(__base + 'components/core/helper/http-status-codes');

module.exports = (req, res, next) => {
  if(
    typeof req.get('access-token')!=='undefined' &&
    (req.get('access-token')).trim()!=='') {
      oneAuth.verifyToken(req.get('access-token'), res, (vtErr, vtRes) => {
        next();
      });
    } else if(typeof req.get('access-token')=='undefined' ||
    req.get('access-token')=='') {
      next();
    }
};
