let dbObj = require('../connection');

module.exports = {

    /*
     * Get Events List
     */
    getEventLists: (tableName, what, conditions, limit, offset, callback) => {
        let querySelect = dbObj.select(what)
                .from(tableName);

        if (conditions && !isEmptyObject(conditions.event_name_conditions.whereEventName) && !isEmptyObject(conditions.event_name_conditions.whereEventName.event_name)) {
            querySelect.whereIn('event', conditions.event_name_conditions.whereEventName.event_name);
        }

        if (conditions && !isEmptyObject(conditions.room_no_conditions.whereRoom) && !isEmptyObject(conditions.room_no_conditions.whereRoom.room_no)) {
            querySelect.whereIn('t1.key_id', conditions.room_no_conditions.whereRoom.room_no);
        }

        if (conditions && !isEmptyObject(conditions.event_from_date.whereDate) && !isEmptyObject(conditions.event_from_date.whereDate.dateTime)) {
            querySelect.whereBetween('t1.created_on', [conditions.event_from_date.whereDate.dateTime, conditions.event_to_date.whereDate.dateTime]);
        }

        if (conditions && !isEmptyObject(conditions.search_word.whereSearchWord) && !isEmptyObject(conditions.search_word.whereSearchWord.search_word)) {
            let word = conditions.search_word.whereSearchWord.search_word;
            let whrOrCondition = '`event` LIKE "%' + word + '%" OR t1.key_id like "%' + word + '%" OR t1.created_on like "%' + word + '%"';
            querySelect.whereRaw(whrOrCondition);
        }

        if (limit != '')
            querySelect.limit(limit);
        if (offset != '')
            querySelect.offset(offset);
        querySelect.leftJoin('keys as t2', 't1.key_id', '=', 't2.key_id');

        if (conditions && !isEmptyObject(conditions.room_order.whereRoomOrder) && !isEmptyObject(conditions.room_order.whereRoomOrder.room_order_by)) {
            let room_order_by = conditions.room_order.whereRoomOrder.room_order_by;
            querySelect.orderBy('t1.key_id', room_order_by);
        } else if (conditions && !isEmptyObject(conditions.event_order.whereEventOrder) && !isEmptyObject(conditions.event_order.whereEventOrder.event_order_by)) {
            let event_order_by = conditions.event_order.whereEventOrder.event_order_by;
            querySelect.orderBy('event', event_order_by);
        } else if (conditions && !isEmptyObject(conditions.date_order.whereDateOrder) && !isEmptyObject(conditions.date_order.whereDateOrder.datetime_order_by)) {
            let datetime_order_by = conditions.date_order.whereDateOrder.datetime_order_by;
            querySelect.orderBy('t1.created_on', datetime_order_by);
        } else {
            querySelect.orderBy('t1.created_on', 'desc');
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

    /**
     * event Count
     */

    getEventCounts: (tableName, what, conditions, callback) => {
        let querySelect = dbObj.count(what + ' as totalRows')
                .from(tableName);
        if (conditions && !isEmptyObject(conditions.event_name_conditions.whereEventName) && !isEmptyObject(conditions.event_name_conditions.whereEventName.event_name)) {
            querySelect.whereIn('event', conditions.event_name_conditions.whereEventName.event_name);
        }

        if (conditions && !isEmptyObject(conditions.room_no_conditions.whereRoom) && !isEmptyObject(conditions.room_no_conditions.whereRoom.room_no)) {
            querySelect.whereIn('key_id', conditions.room_no_conditions.whereRoom.room_no);
        }

        if (conditions && !isEmptyObject(conditions.event_from_date.whereDate) && !isEmptyObject(conditions.event_from_date.whereDate.dateTime)) {
            querySelect.whereBetween('created_on', [conditions.event_from_date.whereDate.dateTime, conditions.event_to_date.whereDate.dateTime]);
        }

        if (conditions && !isEmptyObject(conditions.search_word.whereSearchWord) && !isEmptyObject(conditions.search_word.whereSearchWord.search_word)) {
            let word = conditions.search_word.whereSearchWord.search_word;
            let whrOrCondition = '`event` LIKE "%' + word + '%" OR key_id like "%' + word + '%" OR created_on like "%' + word + '%"';
            querySelect.whereRaw(whrOrCondition);
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

    /**
     * getLatestEventCount function is used to check latest event
     * @param {string} tableName , it contain tablename where DB related opration will perform
     * @param {string} what, it contain field to fetch from table
     * @param {string} conditions, it contain where condition to fetch the record from table
     * @param {type} callback, it will hold the status of the result
     * @returns {undefined}
     */
    getLatestEventCount: (tableName, what, conditions, callback) => {
        let querySelect = dbObj.count(what + ' as newRows')
                .from(tableName);
        if (conditions && !isEmptyObject(conditions)) {
            querySelect.where('created_on','>', conditions.byCreatedOn.latestCreatedOn);
            //querySelect.whereRaw(whrOrCondition);
        }
        querySelect.then((rows) => {
            //console.log(rows);
            callback(null, rows);
        })
                .catch((err) => {
                    console.log(err);
                    callback(err, null);
                });
        
        
    }

};

function isEmptyObject(obj) {
    for (var key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            return false;
        }
    }
    return true;
}