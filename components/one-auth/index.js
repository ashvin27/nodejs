let config = require(__base + 'config'),
rp = require('request-promise'),
DVStatus = require(__base + 'components/core/helper/http-status-codes');

module.exports = (params) => {
  return {
    verifyToken: (token, res, c) => {
      let options = {
        method: 'POST',
        url: config.url.authenticate.verifyTokenURL,
        headers: {
         'content-type': config.cloud.headers.contentType,
         'access-token': process.env.access_token
        },
        body: JSON.stringify({
          auth_token: token
        }),
        rejectUnauthorized: config.server.rejectUnauthorized
      };
      rp(options)
      .then((response) => {
        let r = JSON.parse(response);
        if(r.status) {
          c(null, true);
        } else {
          res
          .status(DVStatus.UNAUTHORIZED)
          .send({
              status: true,
              message: DVStatus.getMessage(DVStatus.ACCESS_TOKEN_EXPIRED),
              description: '',
              data: '',
              response_tag: DVStatus.ACCESS_TOKEN_EXPIRED
          });
        }
      })
      .catch((err) => {
        console.log(err);
        c(err, null);
      });
    },
    getToken: (params, c) => {
      let options = {
        method: 'POST',
        url: config.url.authenticate.getTokenURL,
        headers: {
         'content-type': config.cloud.headers.contentType
        },
        body: JSON.stringify({
          client_id: params.client_id,
          client_secret: params.client_secret
        }),
        rejectUnauthorized: config.server.rejectUnauthorized
      };
      rp(options)
      .then((response) => {
        let r = JSON.parse(response);
        console.log(response);
        if(r.status) {
          c(null, r.data);
        } else {
          c('Error in getting response for getToken from OneAuth server.'
          ,null);
        }
      })
      .catch((err) => {
        console.log(err);
        c(err, null);
      });
    }
  };
};
