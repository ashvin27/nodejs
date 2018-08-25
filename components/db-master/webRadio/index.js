let dbObj = require('../connection'),
  logger = require(__base + 'components/logger').log(),
  logFormat = require(__base + 'components/logger').format;

module.exports = {
        webRadioCountry:(where,what,callback)=>{
            dbObj.select(what)
            .from('web_radio_country')
            .where(where)
            .then((rows) => {
              callback(null, rows);
            })
            .catch((err) => {
              logger.log(logFormat('error', err));
              console.log(err);
              callback(err, null);
            });


        },

        webRadioGenre:(where,what,callback)=>{
            dbObj.select(what)
            .from('web_radio_genre')
            .where(where)
            .then((rows) => {
              callback(null, rows);
            })
            .catch((err) => {
              logger.log(logFormat('error', err));
              console.log(err);
              callback(err, null);
            });


        }



};