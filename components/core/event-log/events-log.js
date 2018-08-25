let dbObj = require('../connection');

module.exports = {

    /*
     * Get All Event Log
     */
    select: (tableName, what, conditions, limit, offset, callback) => {

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
        if (offset != '')
            querySelect.offset(offset);
        if (limit != '')
            querySelect.limit(limit);
        querySelect.then((rows) => {
            console.log(rows);
            callback(null, rows);
        })
                .catch((err) => {
                    console.log(err);
                    callback(err, null);
                });
    }
};
