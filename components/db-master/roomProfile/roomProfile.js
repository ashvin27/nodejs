let dbObj = require('../connection');
let moment = require('moment');
module.exports = {
    /*
     * Get Profiler module
     */
    getProfilename: (what, where, callback) => {
        dbObj.select(what)
                .from('profile_details')
                .where(where)
                .then((rows) => {
                    callback(null, rows);
                })
                .catch((err) => {
                    console.log(err);
                    callback(err, null);
                });
    },

    /*
     * Get Profiler module
     */
    getGuest: (data, callback) => {
        dbObj.select(['t1.pmsi_guest_id', 't1.key_id', 't1.guest_id', 't1.guest_name', 't1.guest_departure', 't2.number'])
                .from('pmsi_guests as t1')
                .join('keys as t2', 't1.key_id', '=', 't2.key_id')
                //.where(data)
                .whereRaw('t1.hotel_id=' + data.hotel_id + ' and t1.is_deleted=0 and t1.guest_departure > "' + moment().format('YYYY-MM-DD H:mm:ss') + '"')
                .then((rows) => {
                    callback(null, rows);
                })
                .catch((err) => {
                    console.log(err);
                    callback(err, null);
                });
    },

    getEditProfilename: (what, where, whereNot, callback) => {
        dbObj.select(what)
                .from('profile_details')
                .where(where)
                .whereNot(whereNot)
                .then((rows) => {
                    callback(null, rows);
                })
                .catch((err) => {
                    console.log(err);
                    callback(err, null);
                });
    },
    /*
     * Get Profiler module
     */
    getProfileModules: (what, where, callback) => {
        dbObj.select(what)
                .from('profile_types')
                .where(where)
                .groupBy('module_name')
                .then((rows) => {
                    callback(null, rows);
                })
                .catch((err) => {
                    console.log(err);
                    callback(err, null);
                });
    },
    /*
     * Get Profiler module
     */
    getProfileTypeId: (what, where, callback) => {
        dbObj.select(what)
                .from('profile_types')
                .where(where)
                .where('is_deleted', 0)
                .where('is_active', 1)
                .then((rows) => {
                    callback(null, rows);
                })
                .catch((err) => {
                    console.log(err);
                    callback(err, null);
                });
    },
    /* get iPad feature*/
    getIpadFeature: (what, where, callback) => {
        dbObj.select(what)
                .from('master_configs')
                .where(where)
                //.orderBy('position', 'asc')
                .then((rows) => {
                    callback(null, rows);
                })
                .catch((err) => {
                    console.log(err);
                    callback(err, null);
                });
    },
    /* get iPad subcat feature*/
    getIpadSubFeature: (what, where, callback) => {
        dbObj.select(what)
                .from('ipad_main_features')
                .where(where)
                .where('parent_id', '>', 0)
                .orderBy('position', 'asc')
                .then((rows) => {
                    callback(null, rows);
                })
                .catch((err) => {
                    console.log(err);
                    callback(err, null);
                });
    },
    /* get IRD cat */
    getIrdCat: (what, where, callback) => {
        dbObj.select(what)
                .from('v_profile_ird_categories')
                .where(where)
                .then((rows) => {
                    callback(null, rows);
                })
                .catch((err) => {
                    console.log(err);
                    callback(err, null);
                });
    },
    /* get IRD subcat */
    getIrdSubcat: (what, where, callback) => {
        dbObj.select(what)
                .from('v_profile_ird_sub_categories')
                .where(where)
                .then((rows) => {
                    callback(null, rows);
                })
                .catch((err) => {
                    console.log(err);
                    callback(err, null);
                });
    },
    /* get IRD subcat */
    getMenuItem: (what, where, callback) => {
        dbObj.select(what)
                .from('v_profile_ird_menuitems')
                .where(where)
                .then((rows) => {
                    callback(null, rows);
                })
                .catch((err) => {
                    console.log(err);
                    callback(err, null);
                });
    },
    /* get IRD subcat */
    getIrdDisableItems: (what, where, callback) => {
        console.log(where.subcat_id);
        dbObj.select(what)
                .from('v_profile_ird_sub_categories')
                .whereIn('subcat_id', where.subcat_id)
                .then((rows) => {
                    callback(null, rows);
                })
                .catch((err) => {
                    console.log(err);
                    callback(err, null);
                });
    },
    /* get Room type  */
    roomType: (what, where, callback) => {
        dbObj.select(what)
                .from('key_categories')
                .where(where)
                .then((rows) => {
                    callback(null, rows);
                })
                .catch((err) => {
                    console.log(err);
                    callback(err, null);
                });
    },
    /* get All floor data */
    allFloorData: (what, where, callback) => {
        dbObj.select(what)
                .from('floors')
                .where(where)
                .then((rows) => {
                    callback(null, rows);
                })
                .catch((err) => {
                    console.log(err);
                    callback(err, null);
                });
    },
    /* get tv cat */
    tvCat: (what, where, callback) => {
        dbObj.select(what)
                .from('v_profile_tvchannel_category')
                .where(where)
                .then((rows) => {
                    callback(null, rows);
                })
                .catch((err) => {
                    console.log(err);
                    callback(err, null);
                });
    },
    tvCategory: (callback) => {
        dbObj.select(dbObj.raw("GROUP_CONCAT(tvchannel_category_id) as tvchannel_category_id"))
                .from('v_profile_tvchannel_category')
                //.where(where)
                .then((rows) => {
                    callback(null, rows);
                })
                .catch((err) => {
                    console.log(err);
                    callback(err, null);
                });
    },
    tvSubCategory: (callback) => {
        dbObj.select(dbObj.raw("GROUP_CONCAT(tvchannel_id) as tvchannel_id"))
                .from('v_profile_tvchannels')
                //.where(where)
                .then((rows) => {
                    callback(null, rows);
                })
                .catch((err) => {
                    console.log(err);
                    callback(err, null);
                });
    },
    irdCategory: (callback) => {
        dbObj.select(dbObj.raw("GROUP_CONCAT(category_id) as category_id"))
                .from('v_profile_ird_categories')
                //.where(where)
                .then((rows) => {
                    callback(null, rows);
                })
                .catch((err) => {
                    console.log(err);
                    callback(err, null);
                });
    },
    irdSubCategory: (callback) => {
        dbObj.select(dbObj.raw("GROUP_CONCAT(subcat_id) as subcat_id"))
                .from('v_profile_ird_sub_categories')
                //.where(where)
                .then((rows) => {
                    callback(null, rows);
                })
                .catch((err) => {
                    console.log(err);
                    callback(err, null);
                });
    },
    irdMenuCategory: (callback) => {
        dbObj.select(dbObj.raw("GROUP_CONCAT(menuitem_id) as menuitem_id"))
                .from('v_profile_ird_menuitems')
                //.where(where)
                .then((rows) => {
                    callback(null, rows);
                })
                .catch((err) => {
                    console.log(err);
                    callback(err, null);
                });
    },
    checkItemIsExistInProfile: (profile_type, category_id, callback) => {
        dbObj.select(
                dbObj.raw("GROUP_CONCAT(t2.is_profile_type_enable) as is_profile_type_enable,GROUP_CONCAT(t1.profile_item_id) as item_id")
                )
                .from('profile_detail_item_mapping as t1')
                .join('profile_details as t2', 't1.profile_detail_id', '=', 't2.profile_detail_id')
                .whereRaw('t1.profile_type_id = ' + profile_type + ' and t1.profile_item_id in (' + category_id + ') and t2.is_deleted = 0')
                .then((res) => {
                    callback(null, res);
                })
                .catch((err) => {
                    logger.log(logFormat('error', err));
                    callback(err, null);
                })
    },
    updateProfileVisible: (table, pkey, where_in, updateData, callback) => {
        console.log(table);
        console.log(where_in);
        console.log(updateData);
        dbObj(table)
                .whereRaw(pkey + ' in (' + where_in + ')')
                .update(updateData)
                .then((d) => {
                    if (d) {
                        callback(null, d);
                    } else {
                        callback(1, null);
                    }
                })
                .catch((err) => {
                    console.log(err);
                    callback(1, null);
                });
    },
    /* get IRD subcat */
    tvChannel: (what, where, callback) => {
        dbObj.select(what)
                .from('v_profile_tvchannels')
                .where(where)
                .then((rows) => {
                    callback(null, rows);
                })
                .catch((err) => {
                    console.log(err);
                    callback(err, null);
                });
    },
    getTvChannelDisableItems: (what, where, callback) => {
        dbObj.select(what)
                .from('v_profile_tvchannels')
                .whereIn('tvchannel_id', where.tvch_id)
                .then((rows) => {
                    callback(null, rows);
                })
                .catch((err) => {
                    console.log(err);
                    callback(err, null);
                });
    },
    getIpadItems: (callback) => {
        dbObj.select('config_val')
                .from('master_configs')
                .where('config_key', 'ipad_features')
                .then((rows) => {
                    callback(null, rows);
                })
                .catch((err) => {
                    console.log(err);
                    callback(err, null);
                });
    },
    /* get Floor Rooms */
    getFloorRooms: (what, where, callback) => {
        dbObj.select(what)
                .from('keys')
                .where(where)
                .orderBy('floor_id', 'asc')
                .orderBy('number', 'asc')
                .then((rows) => {
                    callback(null, rows);
                })
                .catch((err) => {
                    console.log(err);
                    callback(err, null);
                });
    },
    getRoomsNumber: (what, where, callback) => {
        dbObj.select(what)
                .from('keys')
                .whereIn('key_id', where)
                .then((rows) => {
                    callback(null, rows);
                })
                .catch((err) => {
                    console.log(err);
                    callback(err, null);
                });
    },
    /* get Rooms */
    rooms: (what, where, whereIN, callback) => {
        if (whereIN != 'all' && whereIN != null) {
            dbObj.select(what)
                    .from('keys')
                    .where(where)
                    .whereIn('key_category_id', whereIN)
                    .orderBy('key_id', 'asc')
                    .then((rows) => {
                        callback(null, rows);
                    })
                    .catch((err) => {
                        console.log(err);
                        callback(err, null);
                    });
        } else if (whereIN != null) {
            dbObj.select(what)
                    .from('keys')
                    .where(where)
                    .orderBy('key_id', 'asc')
                    .then((rows) => {
                        callback(null, rows);
                    })
                    .catch((err) => {
                        console.log(err);
                        callback(err, null);
                    });
        }

    },
    roomsAll: (what, where, callback) => {
        dbObj.select(what)
                .from('keys')
                .where(where)
                .orderBy('key_id', 'asc')
                .then((rows) => {
                    callback(null, rows);
                })
                .catch((err) => {
                    console.log(err);
                    callback(err, null);
                });
    },
    inroomDevice: (what, where, callback) => {
        dbObj.select(what)
                .from('in_room_devices')
                .where(where)
                .orderBy('key_id', 'asc')
                .orderBy('in_room_device_id', 'asc')
                .then((rows) => {
                    callback(null, rows);
                })
                .catch((err) => {
                    console.log(err);
                    callback(err, null);
                });
    },
    /*
     * Insert query into roomProfile table table
     */
    insert: (tableName, insertParam, callback) => {
        dbObj(tableName)
                .returning('id')
                .insert(insertParam)
                .then(function (rows) {
                    callback(null, rows);
                })
                .catch((err) => {
                    console.log(err);
                    callback(err, null);
                });
    },
    /*
     * Update query into roomProfile table table
     */
    update: (tableName, what, where, callback) => {
        dbObj(tableName)
                .where(where)
                .update(what)
                .then((d) => {
                    if (d) {
                        callback(null, d);
                    } else {
                        callback(1, null);
                    }
                })
                .catch((err) => {
                    console.log(err);
                    callback(1, null);
                });
    },
    delete: (tableName, where_id, callback) => {
        dbObj(tableName)
                .where(where_id)
                .del()
                .then((d) => {
                    if (d) {
                        callback(null, d);
                    } else {
                        callback(1, null);
                    }
                })
                .catch((err) => {
                    console.log(err);
                    callback(1, null);
                });
    }, /*
     * Get All Room Profile
     */
    getProfileLists: (tableName, what, conditions, limit, offset, callback) => {
        let querySelect = dbObj.select(what)
                .from(tableName);

        if (conditions && !isEmptyObject(conditions.search_word.whereSearchWord) && !isEmptyObject(conditions.search_word.whereSearchWord.search_word)) {
            let word = conditions.search_word.whereSearchWord.search_word;
            let whrOrCondition = '`profile_name` LIKE "%' + word + '%" OR module_name like "%' + word + '%" OR t1.created_on like "%' + word + '%" OR t1.modified_on like "%' + word + '%" OR t2.first_name like "%' + word + '%"';
            querySelect.whereRaw(whrOrCondition);
        }

        if (limit != '' && limit != 'All')
            querySelect.limit(limit);
        if (offset != '' && limit != 'All')
            querySelect.offset(offset);
        querySelect.join('uac_users as t2', 't1.created_by', '=', 't2.user_id');
        querySelect.leftJoin('uac_users as t3', 't1.modified_by', '=', 't3.user_id');
        if (conditions && !isEmptyObject(conditions.prfile_name.whereProfileName) && !isEmptyObject(conditions.prfile_name.whereProfileName.profile_name)) {
            let prfile_name = conditions.prfile_name.whereProfileName.profile_name;
            querySelect.orderBy('t1.profile_name', prfile_name);
        } else if (conditions && !isEmptyObject(conditions.profile_type.whereProfileType) && !isEmptyObject(conditions.profile_type.whereProfileType.profile_type)) {
            let profile_type = conditions.profile_type.whereProfileType.profile_type;
            querySelect.orderBy('t1.is_profile_type_enable', profile_type);
        } else if (conditions && !isEmptyObject(conditions.module_name.whereModuleName) && !isEmptyObject(conditions.module_name.whereModuleName.module_name)) {
            let module_name = conditions.module_name.whereModuleName.module_name;
            querySelect.orderBy('t1.module_name', module_name);
        } else if (conditions && !isEmptyObject(conditions.publish.wherePublish) && !isEmptyObject(conditions.publish.wherePublish.publish)) {
            let publish = conditions.publish.wherePublish.publish;
            querySelect.orderBy('t1.is_publish', publish);
        } else if (conditions && !isEmptyObject(conditions.created_on.whereCreated_on) && !isEmptyObject(conditions.created_on.whereCreated_on.created_on)) {
            let created_on = conditions.created_on.whereCreated_on.created_on;
            querySelect.orderBy('t1.created_on', created_on);
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
    getAssigmentProfiletList: (tableName, what, conditions, limit, offset, callback) => {
        let querySelect = dbObj.select('t1.assignment_id', 't1.filter', 't1.filter_types', 't1.filter_details', 't1.guest_id', 't8.guest_name', 't1.is_expiry', 't1.created_by', 't1.created_on', 't5.first_name', dbObj.raw("GROUP_CONCAT(DISTINCT(t3.profile_name)) as profile_name"), dbObj.raw("GROUP_CONCAT(DISTINCT(t3.module_name)) as module_name"), dbObj.raw("GROUP_CONCAT(DISTINCT(t7.number)) as number"))
                .from(tableName);
        if (conditions && !isEmptyObject(conditions.search_word.whereSearchWord) && !isEmptyObject(conditions.search_word.whereSearchWord.search_word)) {
            let word = conditions.search_word.whereSearchWord.search_word;
            let whrOrCondition = 't3.profile_name LIKE "%' + word + '%" OR t3.module_name like "%' + word + '%" OR t1.created_on like "%' + word + '%" OR t5.first_name like "%' + word + '%"';
            querySelect.whereRaw(whrOrCondition);
        }

        if (limit != '' && limit != 'All')
            querySelect.limit(limit);
        if (offset != '' && limit != 'All')
            querySelect.offset(offset);
        querySelect.leftJoin('profile_assignment_detail_mapping as t2', 't1.assignment_id', '=', 't2.assignment_id');
        querySelect.join('profile_details as t3', 't2.profile_detail_id', '=', 't3.profile_detail_id');
        querySelect.join('profile_detail_item_mapping as t4', 't2.profile_detail_id', '=', 't4.profile_detail_id');
        querySelect.leftJoin('uac_users as t5', 't1.created_by', '=', 't5.user_id');
        querySelect.leftJoin('profile_assignment_inroomdevice_mapping as t6', 't1.assignment_id', '=', 't6.assignment_id');
        querySelect.leftJoin('keys as t7', 't6.key_id', '=', 't7.key_id');
        querySelect.leftJoin('pmsi_guests as t8', 't1.guest_id', '=', 't8.guest_id');
        if (conditions && !isEmptyObject(conditions.prfile_name.whereProfileName) && !isEmptyObject(conditions.prfile_name.whereProfileName.profile_name)) {
            let prfile_name = conditions.prfile_name.whereProfileName.profile_name;
            querySelect.orderBy('t2.profile_name', prfile_name);
        } else if (conditions && !isEmptyObject(conditions.module_name.whereModuleName) && !isEmptyObject(conditions.module_name.whereModuleName.module_name)) {
            let module_name = conditions.module_name.whereModuleName.module_name;
            querySelect.orderBy('t2.module_name', module_name);
        } else if (conditions && !isEmptyObject(conditions.created_on.whereCreated_on) && !isEmptyObject(conditions.created_on.whereCreated_on.created_on)) {
            let created_on = conditions.created_on.whereCreated_on.created_on;
            querySelect.orderBy('t1.created_on', created_on);
        } else {
            querySelect.orderBy('t1.created_on', 'desc');
        }
        querySelect.groupBy('t1.assignment_id');

        querySelect.then((rows) => {
            //console.log(rows);
            callback(null, rows);
        })
                .catch((err) => {
                    console.log(err);
                    callback(err, null);
                });
    },
    userDetails: (what, where, callback) => {
        dbObj.select(what)
                .from('uac_users')
                .where(where)
                .then((rows) => {
                    callback(null, rows);
                })
                .catch((err) => {
                    console.log(err);
                    callback(err, null);
                });
    }, getRoomProfileCounts: (tableName, what, conditions, callback) => {
        let querySelect = dbObj.count(what + ' as totalRows')
                .from(tableName + ' as t1');

        querySelect.join('uac_users as t2', 't1.created_by', '=', 't2.user_id');
        querySelect.leftJoin('uac_users as t3', 't1.modified_by', '=', 't3.user_id');

        if (conditions && !isEmptyObject(conditions.search_word.whereSearchWord) && !isEmptyObject(conditions.search_word.whereSearchWord.search_word)) {
            let word = conditions.search_word.whereSearchWord.search_word;
            let whrOrCondition = '`profile_name` LIKE "%' + word + '%" OR module_name like "%' + word + '%" OR t1.created_on like "%' + word + '%" OR t1.modified_on like "%' + word + '%" OR t2.first_name like "%' + word + '%"';
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
    getAssignmentRoomProfileCounts: (tableName, what, conditions, callback) => {
        let querySelect = dbObj.select(dbObj.raw('count(distinct(' + what + ')) as totalRows'))
                .from(tableName + ' as t1');

        querySelect.join('profile_assignment_detail_mapping as t2', 't1.assignment_id', '=', 't2.assignment_id');
        querySelect.join('profile_details as t3', 't2.profile_detail_id', '=', 't3.profile_detail_id');
        querySelect.join('uac_users as t4', 't1.created_by', '=', 't4.user_id');
        querySelect.leftJoin('uac_users as t5', 't3.modified_by', '=', 't5.user_id');
        if (conditions && !isEmptyObject(conditions.search_word.whereSearchWord) && !isEmptyObject(conditions.search_word.whereSearchWord.search_word)) {
            let word = conditions.search_word.whereSearchWord.search_word;
            let whrOrCondition = 't3.profile_name LIKE "%' + word + '%" OR t3.module_name like "%' + word + '%" OR t1.created_on like "%' + word + '%" OR t4.first_name like "%' + word + '%"';
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
    editProfilesDetails: (tableName, what, conditions, callback) => {

        dbObj.select(
                '*',
                't1.profile_detail_id',
                dbObj.raw("GROUP_CONCAT(t2.profile_type_id) as type_id"),
                dbObj.raw("GROUP_CONCAT(t2.profile_item_id) as item_id")
                )
                .from(tableName + ' as t1')
                .join('profile_detail_item_mapping as t2', 't1.profile_detail_id', '=', 't2.profile_detail_id')
                .where(conditions)
                .then((res) => {
                    callback(null, res);
                })
                .catch((err) => {
                    logger.log(logFormat('error', err));
                    callback(err, null);
                })
    },

    getAssignProfilesDetails: (tableName, what, conditions, callback) => {
        dbObj.select(
                dbObj.raw("GROUP_CONCAT(DISTINCT(CONCAT(t4.profile_detail_id,'_',t1.is_expiry))) as is_expiry"),
                dbObj.raw("GROUP_CONCAT(DISTINCT(t4.profile_detail_id)) as profile_detail_id"),
                dbObj.raw("GROUP_CONCAT(DISTINCT(t4.profile_name)) as profile_name"),
                dbObj.raw("GROUP_CONCAT(DISTINCT(CONCAT(t4.profile_detail_id,'_',t4.module_name))) as module_name"),
                dbObj.raw("GROUP_CONCAT(DISTINCT(t2.key_id)) as key_id"),
                dbObj.raw("GROUP_CONCAT(DISTINCT(t2.in_room_device_id)) as in_room_device_id"),
                dbObj.raw("GROUP_CONCAT(DISTINCT(t5.display_name)) as display_name"),
                dbObj.raw("GROUP_CONCAT(DISTINCT(t6.number)) as number")
                )
                .from(tableName + ' as t1')
                .join('profile_assignment_inroomdevice_mapping as t2', 't1.assignment_id', '=', 't2.assignment_id')
                .join('profile_assignment_detail_mapping as t3', 't3.assignment_id', '=', 't1.assignment_id')
                .join('profile_details as t4', 't3.profile_detail_id', '=', 't4.profile_detail_id')
                .join('in_room_devices as t5', 't2.in_room_device_id', '=', 't5.in_room_device_id')
                .join('keys as t6', 't2.key_id', '=', 't6.key_id')
                //.where(conditions)
                .whereRaw('t1.assignment_id=' + conditions.assignment_id + ' and t1.is_deleted=0')
                .then((res) => {
                    callback(null, res);
                })
                .catch((err) => {
                    logger.log(logFormat('error', err));
                    callback(err, null);
                })
    },
    getEditAssignProfilesDetails: (tableName, what, conditions, callback) => {
        dbObj.select(
                't1.assignment_id', 't1.filter', 't1.filter_types', 't1.key_category_floor', 't1.filter_details', 't1.checkout', 't1.never_expiry', 't1.expiry_date',
                dbObj.raw("GROUP_CONCAT(Distinct(t1.guest_id)) as guest_id"),
                dbObj.raw("GROUP_CONCAT(Distinct(t1.is_expiry)) as is_expiry"),
                dbObj.raw("GROUP_CONCAT(Distinct(t2.in_room_device_id)) as in_room_device_id"),
                dbObj.raw("GROUP_CONCAT(Distinct(t3.profile_detail_id)) as profile_detail_id")
                )
                .from(tableName + ' as t1')
                .join('profile_assignment_inroomdevice_mapping as t2', 't1.assignment_id', '=', 't2.assignment_id')
                .join('profile_assignment_detail_mapping as t3', 't3.assignment_id', '=', 't1.assignment_id')
                //.where(conditions)
                .whereRaw('t1.assignment_id=' + conditions.assignment_id + ' and t1.is_deleted=0')
                .groupBy('t1.assignment_id')
                .then((res) => {
                    callback(null, res);
                })
                .catch((err) => {
                    logger.log(logFormat('error', err));
                    callback(err, null);
                })
    },
    profileIRDCategoryList: (tableName, what, conditions, roomKey, callback) => {

        if (roomKey != 0) {
            let whrOrCondition = "t1.key_numbers LIKE '%" + '"' + roomKey + '"' + "%'";
            querySelect = dbObj.select(
                    '*',
                    dbObj.raw("GROUP_CONCAT(t2.profile_type_id) as profile_type_id"),
                    dbObj.raw("GROUP_CONCAT(t4.category_name) as category_name"),
                    dbObj.raw("GROUP_CONCAT(t4.category_id) as category_id")
                    )
                    .from(tableName + ' as t1')
                    .join('profile_detail_item_mapping as t2', 't1.profile_detail_id', '=', 't2.profile_details_id')
                    .join('profile_types as t3', 't2.profile_type_id', '=', 't3.profile_type_id')
                    .join('v_profile_ird_categories as t4', 't2.profile_item_id', '=', 't4.category_id')
                    .where(conditions);


            querySelect.whereRaw(whrOrCondition);
            querySelect.groupBy('t1.profile_detail_id')
                    .then((res) => {
                        callback(null, res);
                    })
                    .catch((err) => {
                        logger.log(logFormat('error', err));
                        callback(err, null);
                    })
        } else {
            dbObj.select(
                    '*',
                    dbObj.raw("GROUP_CONCAT(t2.profile_type_id) as profile_type_id"),
                    dbObj.raw("GROUP_CONCAT(t4.category_name) as category_name"),
                    dbObj.raw("GROUP_CONCAT(t4.category_id) as category_id")
                    )


                    .from(tableName + ' as t1')
                    .join('profile_detail_item_mapping as t2', 't1.profile_detail_id', '=', 't2.profile_details_id')
                    .join('profile_types as t3', 't2.profile_type_id', '=', 't3.profile_type_id')
                    .join('v_profile_ird_categories as t4', 't2.profile_item_id', '=', 't4.category_id')
                    .where(conditions)
                    //.whereIn('t3.profile_type_id', [1,2])
                    .groupBy('t1.profile_detail_id')
                    .then((res) => {
                        callback(null, res);
                    })
                    .catch((err) => {
                        logger.log(logFormat('error', err));
                        callback(err, null);
                    })
        }
    }, getIRDSubCategoryRoomProfile: (tableName, what, conditions, roomKey, callback) => {
        if (roomKey != 0) {
            let whrOrCondition = "t1.key_numbers LIKE '%" + '"' + roomKey + '"' + "%'";
            querySelect = dbObj.select(
                    '*',
                    dbObj.raw("GROUP_CONCAT(t4.category_id) as category_id"),
                    dbObj.raw("GROUP_CONCAT(t2.profile_type_id) as profile_type_id"),
                    dbObj.raw("GROUP_CONCAT(t4.subcat_name) as subcat_name"),
                    dbObj.raw("GROUP_CONCAT(t4.subcat_id) as subcat_id")
                    )
                    .from(tableName + ' as t1')
                    .join('profile_detail_item_mapping as t2', 't1.profile_detail_id', '=', 't2.profile_details_id')
                    .join('profile_types as t3', 't2.profile_type_id', '=', 't3.profile_type_id')
                    .join('v_profile_ird_sub_categories as t4', 't2.profile_item_id', '=', 't4.subcat_id')
                    .where(conditions)
            querySelect.whereRaw(whrOrCondition);
            //.whereIn('t3.profile_type_id', [1,2])
            querySelect.groupBy('t1.profile_detail_id')
                    .then((res) => {
                        callback(null, res);
                    })
                    .catch((err) => {
                        logger.log(logFormat('error', err));
                        callback(err, null);
                    })
        } else {
            dbObj.select(
                    '*',
                    dbObj.raw("GROUP_CONCAT(t4.category_id) as category_id"),
                    dbObj.raw("GROUP_CONCAT(t2.profile_type_id) as profile_type_id"),
                    dbObj.raw("GROUP_CONCAT(t4.subcat_name) as subcat_name"),
                    dbObj.raw("GROUP_CONCAT(t4.subcat_id) as subcat_id")
                    )
                    .from(tableName + ' as t1')
                    .join('profile_detail_item_mapping as t2', 't1.profile_detail_id', '=', 't2.profile_details_id')
                    .join('profile_types as t3', 't2.profile_type_id', '=', 't3.profile_type_id')
                    .join('v_profile_ird_sub_categories as t4', 't2.profile_item_id', '=', 't4.subcat_id')
                    .where(conditions)
                    //.whereIn('t3.profile_type_id', [1,2])
                    .groupBy('t1.profile_detail_id')
                    .then((res) => {
                        callback(null, res);
                    })
                    .catch((err) => {
                        logger.log(logFormat('error', err));
                        callback(err, null);
                    })
        }
    },
    profileIpadCategoryList: (tableName, what, conditions, roomKey, callback) => {

        if (roomKey != 0) {
            let whrOrCondition = "t1.key_numbers LIKE '%" + '"' + roomKey + '"' + "%'";
            querySelect = dbObj.select(
                    '*',
                    dbObj.raw("GROUP_CONCAT(t2.profile_type_id) as profile_type_id"),
                    dbObj.raw("GROUP_CONCAT(t4.name) as name"),
                    dbObj.raw("GROUP_CONCAT(t4.id) as id")
                    )
                    .from(tableName + ' as t1')
                    .join('profile_detail_item_mapping as t2', 't1.profile_detail_id', '=', 't2.profile_details_id')
                    .join('profile_types as t3', 't2.profile_type_id', '=', 't3.profile_type_id')
                    .join('ipad_main_features as t4', 't2.profile_item_id', '=', 't4.id')
                    .where(conditions);


            querySelect.whereRaw(whrOrCondition);
            //.whereIn('t3.profile_type_id', [1,2])
            querySelect.groupBy('t1.profile_detail_id')
                    .then((res) => {
                        callback(null, res);
                    })
                    .catch((err) => {
                        logger.log(logFormat('error', err));
                        callback(err, null);
                    })
        } else {
            dbObj.select(
                    '*',
                    dbObj.raw("GROUP_CONCAT(t2.profile_type_id) as profile_type_id"),
                    dbObj.raw("GROUP_CONCAT(t4.name) as name"),
                    dbObj.raw("GROUP_CONCAT(t4.id) as id")
                    )


                    .from(tableName + ' as t1')
                    .join('profile_detail_item_mapping as t2', 't1.profile_detail_id', '=', 't2.profile_details_id')
                    .join('profile_types as t3', 't2.profile_type_id', '=', 't3.profile_type_id')
                    .join('ipad_main_features as t4', 't2.profile_item_id', '=', 't4.id')
                    .where(conditions)
                    //.whereIn('t3.profile_type_id', [1,2])
                    .groupBy('t1.profile_detail_id')
                    .then((res) => {
                        callback(null, res);
                    })
                    .catch((err) => {
                        logger.log(logFormat('error', err));
                        callback(err, null);
                    })
        }
    },
    ipadSubCategoryRoomProfile: (tableName, what, conditions, roomKey, callback) => {

        if (roomKey != 0) {
            let whrOrCondition = " t4.parent_id > 0  and t1.key_numbers LIKE '%" + '"' + roomKey + '"' + "%'";
            querySelect = dbObj.select(
                    '*',
                    dbObj.raw("GROUP_CONCAT(t2.profile_type_id) as profile_type_id"),
                    dbObj.raw("GROUP_CONCAT(t4.name) as name"),
                    dbObj.raw("GROUP_CONCAT(t4.id) as id")
                    )
                    .from(tableName + ' as t1')
                    .join('profile_detail_item_mapping as t2', 't1.profile_detail_id', '=', 't2.profile_details_id')
                    .join('profile_types as t3', 't2.profile_type_id', '=', 't3.profile_type_id')
                    .join('ipad_main_features as t4', 't2.profile_item_id', '=', 't4.id')
                    .where(conditions);


            querySelect.whereRaw(whrOrCondition);
            //.whereIn('t3.profile_type_id', [1,2])
            querySelect.groupBy('t1.profile_detail_id')
                    .then((res) => {
                        callback(null, res);
                    })
                    .catch((err) => {
                        logger.log(logFormat('error', err));
                        callback(err, null);
                    })
        } else {
            let whrOrCondition = "t4.parent_id > 0 ";
            querySelect = dbObj.select(
                    '*',
                    dbObj.raw("GROUP_CONCAT(t2.profile_type_id) as profile_type_id"),
                    dbObj.raw("GROUP_CONCAT(t4.name) as name"),
                    dbObj.raw("GROUP_CONCAT(t4.id) as id")
                    )
                    .from(tableName + ' as t1')
                    .join('profile_detail_item_mapping as t2', 't1.profile_detail_id', '=', 't2.profile_details_id')
                    .join('profile_types as t3', 't2.profile_type_id', '=', 't3.profile_type_id')
                    .join('ipad_main_features as t4', 't2.profile_item_id', '=', 't4.id')
                    .where(conditions);
            querySelect.whereRaw(whrOrCondition);
            //.whereIn('t3.profile_type_id', [1,2])
            querySelect.groupBy('t1.profile_detail_id')
                    .then((res) => {
                        callback(null, res);
                    })
                    .catch((err) => {
                        logger.log(logFormat('error', err));
                        callback(err, null);
                    })
        }
    },
    profileTvCategoryList: (tableName, what, conditions, roomKey, callback) => {

        if (roomKey != 0) {
            let whrOrCondition = "t1.key_numbers LIKE '%" + '"' + roomKey + '"' + "%'";
            querySelect = dbObj.select(
                    '*',
                    dbObj.raw("GROUP_CONCAT(t2.profile_type_id) as profile_type_id"),
                    dbObj.raw("GROUP_CONCAT(t4.category_name) as category_name"),
                    dbObj.raw("GROUP_CONCAT(t4.tvchannel_category_id) as tvchannel_category_id")
                    )
                    .from(tableName + ' as t1')
                    .join('profile_detail_item_mapping as t2', 't1.profile_detail_id', '=', 't2.profile_details_id')
                    .join('profile_types as t3', 't2.profile_type_id', '=', 't3.profile_type_id')
                    .join('v_profile_tvchannel_category as t4', 't2.profile_item_id', '=', 't4.tvchannel_category_id')
                    .where(conditions);


            querySelect.whereRaw(whrOrCondition);
            //.whereIn('t3.profile_type_id', [1,2])
            querySelect.groupBy('t1.profile_detail_id')
                    .then((res) => {
                        callback(null, res);
                    })
                    .catch((err) => {
                        logger.log(logFormat('error', err));
                        callback(err, null);
                    })
        } else {
            dbObj.select(
                    '*',
                    dbObj.raw("GROUP_CONCAT(t2.profile_type_id) as profile_type_id"),
                    dbObj.raw("GROUP_CONCAT(t4.category_name) as category_name"),
                    dbObj.raw("GROUP_CONCAT(t4.tvchannel_category_id) as tvchannel_category_id")
                    )


                    .from(tableName + ' as t1')
                    .join('profile_detail_item_mapping as t2', 't1.profile_detail_id', '=', 't2.profile_details_id')
                    .join('profile_types as t3', 't2.profile_type_id', '=', 't3.profile_type_id')
                    .join('v_profile_tvchannel_category as t4', 't2.profile_item_id', '=', 't4.tvchannel_category_id')
                    .where(conditions)
                    //.whereIn('t3.profile_type_id', [1,2])
                    .groupBy('t1.profile_detail_id')
                    .then((res) => {
                        callback(null, res);
                    })
                    .catch((err) => {
                        logger.log(logFormat('error', err));
                        callback(err, null);
                    })
        }
    },
    tvSubCategoryRoomProfile: (tableName, what, conditions, roomKey, callback) => {
        if (roomKey != 0) {
            let whrOrCondition = "t1.key_numbers LIKE '%" + '"' + roomKey + '"' + "%'";
            querySelect = dbObj.select(
                    '*',
                    dbObj.raw("GROUP_CONCAT(t4.tvchannel_category_id) as tvchannel_category_id"),
                    dbObj.raw("GROUP_CONCAT(t2.profile_type_id) as profile_type_id"),
                    dbObj.raw("GROUP_CONCAT(t4.tvchannel_name) as tvchannel_name"),
                    dbObj.raw("GROUP_CONCAT(t4.tvchannel_id) as tvchannel_id")
                    )
                    .from(tableName + ' as t1')
                    .join('profile_detail_item_mapping as t2', 't1.profile_detail_id', '=', 't2.profile_details_id')
                    .join('profile_types as t3', 't2.profile_type_id', '=', 't3.profile_type_id')
                    .join('v_profile_tvchannels as t4', 't2.profile_item_id', '=', 't4.tvchannel_id')
                    .where(conditions)
            querySelect.whereRaw(whrOrCondition);
            querySelect.groupBy('t1.profile_detail_id')
                    .then((res) => {
                        callback(null, res);
                    })
                    .catch((err) => {
                        logger.log(logFormat('error', err));
                        callback(err, null);
                    })
        } else {
            dbObj.select(
                    '*',
                    dbObj.raw("GROUP_CONCAT(t4.tvchannel_category_id) as tvchannel_category_id"),
                    dbObj.raw("GROUP_CONCAT(t2.profile_type_id) as profile_type_id"),
                    dbObj.raw("GROUP_CONCAT(t4.tvchannel_name) as tvchannel_name"),
                    dbObj.raw("GROUP_CONCAT(t4.tvchannel_id) as tvchannel_id")
                    )
                    .from(tableName + ' as t1')
                    .join('profile_detail_item_mapping as t2', 't1.profile_detail_id', '=', 't2.profile_details_id')
                    .join('profile_types as t3', 't2.profile_type_id', '=', 't3.profile_type_id')
                    .join('v_profile_tvchannels as t4', 't2.profile_item_id', '=', 't4.tvchannel_id')
                    .where(conditions)
                    .groupBy('t1.profile_detail_id')
                    .then((res) => {
                        callback(null, res);
                    })
                    .catch((err) => {
                        logger.log(logFormat('error', err));
                        callback(err, null);
                    })
        }
    },
    getAssignedProfileDate: (what, in_room_device_id, guest_id, callback) => {
        if (guest_id != 0) {
            dbObj.select(
                    dbObj.raw(what),
                    dbObj.raw("GROUP_CONCAT( p4.profile_type_id ) AS profile_type_id"),
                    dbObj.raw("GROUP_CONCAT( p4.profile_item_id ) AS profile_item_id"),
                    dbObj.raw("GROUP_CONCAT( p4.parent_id ) as parent_id")
                    )
                    .from('profile_assignment_inroomdevice_mapping as p1')
                    .join('profile_assignment as p2', 'p1.assignment_id', '=', 'p2.assignment_id')
                    .join('profile_assignment_detail_mapping as p5', 'p2.assignment_id', '=', 'p5.assignment_id')
                    .join('profile_details as p3', 'p5.profile_detail_id', '=', 'p3.profile_detail_id')
                    .join('profile_detail_item_mapping as p4', 'p3.profile_detail_id', '=', 'p4.profile_detail_id')
                    .whereRaw('p1.in_room_device_id = ' + in_room_device_id + ' and p3.is_profile_type_enable = 0 and p2.guest_id = 0 and p2.is_deleted = 0 and p2.is_expiry = 0 group by p3.profile_detail_id')
                    .unionAll(function () {
                        this.select(dbObj.raw(what),
                                dbObj.raw("GROUP_CONCAT( p4.profile_type_id ) AS profile_type_id"),
                                dbObj.raw("GROUP_CONCAT( p4.profile_item_id ) AS profile_item_id"),
                                dbObj.raw("GROUP_CONCAT( p4.parent_id ) as parent_id"))
                                .from('profile_assignment_inroomdevice_mapping as p1')
                                .join('profile_assignment as p2', 'p1.assignment_id', '=', 'p2.assignment_id')
                                .join('profile_assignment_detail_mapping as p5', 'p2.assignment_id', '=', 'p5.assignment_id')
                                .join('profile_details as p3', 'p5.profile_detail_id', '=', 'p3.profile_detail_id')
                                //.join('profile_assignment_detail_mapping as p5', 'p3.assignment_id', '=', 'p5.assignment_id')
                                .join('profile_detail_item_mapping as p4', 'p3.profile_detail_id', '=', 'p4.profile_detail_id')
                                .where({'p1.in_room_device_id': in_room_device_id, 'p3.is_profile_type_enable': 1, 'p2.guest_id': '0', 'p2.is_deleted': 0, 'p2.is_expiry': 0})
                                .groupBy(dbObj.raw('p3.profile_detail_id'))
                    }).unionAll(function () {
                this.select(dbObj.raw(what),
                        dbObj.raw("GROUP_CONCAT( p4.profile_type_id ) AS profile_type_id"),
                        dbObj.raw("GROUP_CONCAT( p4.profile_item_id ) AS profile_item_id"),
                        dbObj.raw("GROUP_CONCAT( p4.parent_id ) as parent_id"))
                        .from('profile_assignment_inroomdevice_mapping as p1')
                        .join('profile_assignment as p2', 'p1.assignment_id', '=', 'p2.assignment_id')
                        .join('profile_assignment_detail_mapping as p5', 'p2.assignment_id', '=', 'p5.assignment_id')
                        .join('profile_details as p3', 'p5.profile_detail_id', '=', 'p3.profile_detail_id')
                        //.join('profile_assignment_detail_mapping as p5', 'p3.assignment_id', '=', 'p5.assignment_id')
                        .join('profile_detail_item_mapping as p4', 'p3.profile_detail_id', '=', 'p4.profile_detail_id')
                        .where({'p1.in_room_device_id': in_room_device_id, 'p3.is_profile_type_enable': 0, 'p2.guest_id': guest_id, 'p2.is_deleted': 0, 'p2.is_expiry': 0})
                        .groupBy(dbObj.raw('p3.profile_detail_id'))
            }).unionAll(function () {
                this.select(dbObj.raw(what),
                        dbObj.raw("GROUP_CONCAT( p4.profile_type_id ) AS profile_type_id"),
                        dbObj.raw("GROUP_CONCAT( p4.profile_item_id ) AS profile_item_id"),
                        dbObj.raw("GROUP_CONCAT( p4.parent_id ) as parent_id"))
                        .from('profile_assignment_inroomdevice_mapping as p1')
                        .join('profile_assignment as p2', 'p1.assignment_id', '=', 'p2.assignment_id')
                        .join('profile_assignment_detail_mapping as p5', 'p2.assignment_id', '=', 'p5.assignment_id')
                        .join('profile_details as p3', 'p5.profile_detail_id', '=', 'p3.profile_detail_id')
                        //.join('profile_assignment_detail_mapping as p5', 'p3.assignment_id', '=', 'p5.assignment_id')
                        .join('profile_detail_item_mapping as p4', 'p3.profile_detail_id', '=', 'p4.profile_detail_id')
                        .where({'p1.in_room_device_id': in_room_device_id, 'p3.is_profile_type_enable': 1, 'p2.guest_id': guest_id, 'p2.is_deleted': 0, 'p2.is_expiry': 0})
                        .groupBy(dbObj.raw('p3.profile_detail_id'))
            })
                    .then((res) => {
                        callback(null, res);
                    })
                    .catch((err) => {
                        logger.log(logFormat('error', err));
                        callback(err, null);
                    })
        } else {
            dbObj.select(
                    //'p3.profile_detail_id,p3.profile_name,p3.module_name,p2.checkout,p2.never_expiry,p2.expiry_date,p2.guest_id,p3.is_profile_type_enable, p1.in_room_device_id',

                    dbObj.raw(what),
                    dbObj.raw("GROUP_CONCAT( p4.profile_type_id ) AS profile_type_id"),
                    dbObj.raw("GROUP_CONCAT( p4.profile_item_id ) AS profile_item_id"),
                    dbObj.raw("GROUP_CONCAT( p4.parent_id ) as parent_id")
                    )
                    .from('profile_assignment_inroomdevice_mapping as p1')
                    .join('profile_assignment as p2', 'p1.assignment_id', '=', 'p2.assignment_id')
                    .join('profile_assignment_detail_mapping as p5', 'p2.assignment_id', '=', 'p5.assignment_id')
                    .join('profile_details as p3', 'p5.profile_detail_id', '=', 'p3.profile_detail_id')
                    //.join('profile_assignment_detail_mapping as p5', 'p3.assignment_id', '=', 'p5.assignment_id')
                    .join('profile_detail_item_mapping as p4', 'p3.profile_detail_id', '=', 'p4.profile_detail_id')
                    .whereRaw('p1.in_room_device_id = ' + in_room_device_id + ' and p3.is_profile_type_enable = 0 and p2.guest_id = 0 and p2.is_deleted = 0 and p2.is_expiry = 0 group by p3.profile_detail_id')                    
                    .unionAll(function () {
                        this.select(dbObj.raw(what),
                                dbObj.raw("GROUP_CONCAT( p4.profile_type_id ) AS profile_type_id"),
                                dbObj.raw("GROUP_CONCAT( p4.profile_item_id ) AS profile_item_id"),
                                dbObj.raw("GROUP_CONCAT( p4.parent_id ) as parent_id"))
                                .from('profile_assignment_inroomdevice_mapping as p1')
                                .join('profile_assignment as p2', 'p1.assignment_id', '=', 'p2.assignment_id')
                                .join('profile_assignment_detail_mapping as p5', 'p2.assignment_id', '=', 'p5.assignment_id')
                                .join('profile_details as p3', 'p5.profile_detail_id', '=', 'p3.profile_detail_id')
                                //.join('profile_assignment_detail_mapping as p5', 'p3.assignment_id', '=', 'p5.assignment_id')
                                .join('profile_detail_item_mapping as p4', 'p3.profile_detail_id', '=', 'p4.profile_detail_id')
                                .where({'p1.in_room_device_id': in_room_device_id, 'p3.is_profile_type_enable': 1, 'p2.guest_id': '0', 'p2.is_deleted': 0, 'p2.is_expiry': 0})
                                .groupBy(dbObj.raw('p3.profile_detail_id'))
                    })
                    .then((res) => {
                        callback(null, res);
                    })
                    .catch((err) => {
                        logger.log(logFormat('error', err));
                        callback(err, null);
                    })
        }

    }, getGuestAssignmentIdToExpire: (callback) => {
        let querySelect = dbObj.select(dbObj.raw("GROUP_CONCAT( p1.assignment_id ) AS assignment_id"))
                .from('profile_assignment as p1');
        querySelect.join('pmsi_guests as p2', 'p1.guest_id', '=', 'p2.pmsi_guest_id');
        let whrOrCondition = 'p1.is_deleted =0 and p1.is_expiry =0 AND (p2.guest_departure < "' + moment().format('YYYY-MM-DD H:mm:ss') + '" || p1.`expiry_date` < "' + moment().format('YYYY-MM-DD H:mm:ss') + '")';
        querySelect.whereRaw(whrOrCondition);
        querySelect.then((rows) => {
            callback(null, rows);
        })
                .catch((err) => {
                    console.log(err);
                    callback(err, null);
                });
    }, getByRoomAssignmentIdToExpire: (callback) => {
        let querySelect = dbObj.select(dbObj.raw("GROUP_CONCAT( assignment_id ) AS assignment_id"))
                .from('profile_assignment');
        let whrOrCondition = 'is_deleted = 0 and is_expiry =0 and `checkout` = 0 and `never_expiry` != 1 and `expiry_date` < "' + moment().format('YYYY-MM-DD H:mm:ss') + '"';
        querySelect.whereRaw(whrOrCondition);
        querySelect.then((rows) => {
            callback(null, rows);
        })
                .catch((err) => {
                    console.log(err);
                    callback(err, null);
                });
    },
    expireAssignId: (assignId, callback) => {
        dbObj('profile_assignment')
                .whereIn('assignment_id', assignId)
                .update({'is_expiry': 1})
                .then((d) => {
                    if (d) {
                        callback(null, d);
                    } else {
                        callback(1, null);
                    }
                })
                .catch((err) => {
                    console.log(err);
                    callback(1, null);
                });
    }
    , getExistedProfilesDetails: (tableName, what, where, callback) => {
        dbObj.select(what)
                .from(tableName + ' as t1')
                .join('profile_assignment as t2', 't1.assignment_id', '=', 't2.assignment_id')
                .where(where)
                .then((res) => {
                    callback(null, res);
                })
                .catch((err) => {
                    logger.log(logFormat('error', err));
                    callback(err, null);
                })

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
