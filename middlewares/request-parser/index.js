module.exports = (req, res, next) => {
  if(req.get('content-type').indexOf('application/vnd.digivalet.v1+json') != 0) {
    res.status(406).send();
  } else {
    if(req.method!=='GET') {
      let body = (req.body).toString();
      req.body = JSON.parse(body);
      next();
    } else {
      next();
    }
  }
};
