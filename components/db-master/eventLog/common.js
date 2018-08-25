let dbObj = require('../connection');

module.exports = {

    /*
     * Get All Common Query Data
     */
    select: (tableName, what, conditions, callback) => {

        let querySelect = dbObj.select(what)
                .from(tableName);

        if (conditions && conditions.where) {
            querySelect.where(conditions.where);
        }
        if (conditions && conditions.whereE) {
            (conditions.whereE).forEach((item) => {
                querySelect.where(item.f, item.m, item.l);
            });
        }
        querySelect.then((rows) => {
            //console.log(rows);
            callback(null, rows);
        })
                .catch((err) => {
                    console.log(err);
                    callback(err, null);
                });
    },

    /*
     
     * Get All Common Query Data
     */
    eventName: (tableName, what, conditions, callback) => {

        let querySelect = dbObj.select(what)
                .from(tableName);
        querySelect.groupBy(conditions);
        querySelect.then((rows) => {
            callback(null, rows);
        }).catch((err) => {
            console.log(err);
            callback(err, null);
        });
    },
    /*
     
     * Get All Common Query Data
     */
    lastRecord: (tableName, what, conditions,orderBy,limit, callback) => {

        let querySelect = dbObj.select(what)
                .from(tableName);
        querySelect.orderBy(orderBy, 'desc');
        querySelect.limit(limit);
        querySelect.then((rows) => {
            callback(null, rows);
        }).catch((err) => {
            console.log(err);
            callback(err, null);
        });
    },
    
  
};
