let config              = require(__base + 'config'),
hotelLanguage = require(__base +
  '/components/db-master/siteLanguage/hotelLanguage');

let siteLanguage = {
  getLanguageText: (options, callback) => {
      getLanguageText(options,
        (cLErr, clRes) => {
          if(cLErr) {
            callback(cLErr, null);
          } else {
            callback(null, clRes);
          }
      })
  }
};

let getLanguageText = (options, callback) => {
  let what = ['tag_key', 'tag_val'];
  let where = {
    module: 'service_assistance',
    hotel_code: options.hotelCode ? options.hotelCode : config.hotelProperties.hotelCode,
    lang_code: options.langCode ? options.langCode : config.hotelProperties.defaultLangCode
  };
  options.tagType ? where.tagType = options.tagType : '';

  hotelLanguage.select(what, where, (hlErr, hlRes) => {
    if(hlErr) {
      callback(hlErr, null);
    } else {
      callback(null, hlRes);
    }
  });
};

module.exports = siteLanguage;
