let roomProfileMaster = require(__base +
        'components/db-master/roomProfile/roomProfile'),
        htmlRendering = require(__base +
                'components/core/helper/roomProfileManagement/htmlRendering')({});
let fs = require('fs');
let config = require(__base + 'config');
let request = require("request");
let sock = '';
let roomProfile = {
    onConnect: (socket) => {
        sock = socket;
        socket.on('disconnect', function (response) {});

        socket.on('assignProfile', function (data) {            
            let assigned_details = {};
            let assigned_detailsArr = {};
            let data1 = data.roomsAssigmentArr;            
            data1 = data1[0];
            var i = 0;
            if (data1.guest_id.length > 0) {                
                data1.guest_id.forEach((guest_id) => {                    
                    assigned_details['filter'] = data1.filter;
                    assigned_details['filter_types'] = data1.filter_types.toString();
                    assigned_details['filter_details'] = data1.guest_key_id[guest_id];
                    assigned_details['checkout'] = data1.checkout;
                    assigned_details['never_expiry'] = data1.never_expiry;
                    assigned_details['expiry_date'] = data1.expiry_date;
                    assigned_details['is_publish'] = data1.is_publish;
                    assigned_details['guest_id'] = guest_id;
                    assigned_details['hotel_id'] = data1.hotel_id;
                    assigned_details['created_by'] = data1.created_by;
                    saveAssignedProfile(assigned_details, data1, data1.guest_key_id[guest_id], data1.profile_detail_id, (err, res) => {

                    });
                    assigned_details = {};
                });
            } else {                
                assigned_details['filter'] = data1.filter;
                assigned_details['filter_types'] = data1.filter_types;
                assigned_details['filter_details'] = data1.filter_details;
                assigned_details['key_category_floor'] = data1.keyCategory_floor;
                assigned_details['checkout'] = data1.checkout;
                assigned_details['never_expiry'] = data1.never_expiry;
                assigned_details['expiry_date'] = data1.expiry_date;
                assigned_details['is_publish'] = data1.is_publish;
                assigned_details['guest_id'] = 0;
                assigned_details['hotel_id'] = data1.hotel_id;
                assigned_details['created_by'] = data1.created_by;
                saveAssignedProfile(assigned_details, data1, 0, data1.profile_detail_id, (err, res) => {

                });
            }


            assigned_details = {};
            i++;                     
            socket.emit("profileAssignedNotification", {"message": "Profile Assigned Sucessfully!"});
        });

        socket.on('updateAssignProfile', function (data) {            
            let assigned_details = {};
            let assigned_detailsArr = {};
            let data1 = data.roomsAssigmentArr;            
            let assignment_id = data.assigmnet_id;
            console.log(data.assigmnet_id);
            data1 = data1[0];
            var i = 0;
            if (data1.guest_id.length > 0) {
                data1.guest_id.forEach((guest_id) => {
                    assigned_details['filter'] = data1.filter;
                    assigned_details['filter_types'] = data1.filter_types.toString();
                    assigned_details['filter_details'] = data1.guest_key_id[guest_id];
                    assigned_details['checkout'] = data1.checkout;
                    assigned_details['never_expiry'] = data1.never_expiry;
                    assigned_details['expiry_date'] = data1.expiry_date;
                    assigned_details['is_publish'] = data1.is_publish;
                    assigned_details['guest_id'] = guest_id;
                    assigned_details['hotel_id'] = data1.hotel_id;
                    assigned_details['modified_by'] = data1.modified_by;
                    updateAssignedProfile(assigned_details, assignment_id, data1, data1.guest_key_id[guest_id], data1.profile_detail_id, (err, res) => {

                    });
                    assigned_details = {};
                });
            } else {                
                assigned_details['filter'] = data1.filter;
                assigned_details['filter_types'] = data1.filter_types;
                assigned_details['filter_details'] = data1.filter_details;
                assigned_details['key_category_floor'] = data1.keyCategory_floor;
                assigned_details['checkout'] = data1.checkout;
                assigned_details['never_expiry'] = data1.never_expiry;
                assigned_details['expiry_date'] = data1.expiry_date;
                assigned_details['is_publish'] = data1.is_publish;
                assigned_details['guest_id'] = 0;
                assigned_details['hotel_id'] = data1.hotel_id;
                assigned_details['modified_by'] = data1.modified_by;
                updateAssignedProfile(assigned_details, assignment_id, data1, 0, data1.profile_detail_id, (err, res) => {

                });
            }

            socket.emit("profileAssignedNotification", {"message": "Profile Updated Sucessfully!"});
            assigned_details = {};
            i++;
        });

        /*
         * Get list of all profile module
         */
        socket.on('getprofileModule', (data) => {
            getProfiles(data, (rpErr, rpResult) => {
                if (rpResult) {
                    console.log(rpResult);
                    createProfileModuleHtml(rpResult, (htmlErr, htmlRes) => {
                        if (htmlRes) {
                            socket.emit('sendProfileModuleHtml', {
                                sendProfileModele: htmlRes
                            });
                        }
                    });
                } else {
                    socket.emit('sendProfile',
                            {'sendProfileModele': 'No Module Found'});
                }
            });
        });

        /*
         * check profile name is exist
         */
        socket.on('checkProfileName', (data) => {
            getProfilesName(data, (rpErr, rpResult) => {
                console.log("rpResultrpResult", rpResult);
                if (rpResult.length > 0) {
                    socket.emit('isCheckProfileName',
                            {'exist': 1});
                } else {
                    socket.emit('isCheckProfileName',
                            {'exist': 0});
                }
            });
        });

        socket.on('checkeditProfileName', (data) => {
            getEditProfilesName(data, (rpErr, rpResult) => {
                console.log("rpResultrpResult", rpResult);
                if (rpResult.length > 0) {
                    socket.emit('isEditCheckProfileName',
                            {'is_exist': 1});
                } else {
                    socket.emit('isEditCheckProfileName',
                            {'is_exist': 0});
                }
            });
        });



        /**
         * room profile list
         */
        socket.on('roomProfileList', (data) => {
            console.log("sort", data);
            let what = ['t1.profile_detail_id', 't1.profile_name', 't1.is_profile_type_enable', 't1.module_name', 't1.hotel_id', 't1.created_by', 't1.created_on', 't1.modified_by', 't1.modified_on', 't2.first_name', 't3.first_name AS update_by_name'];
            let search_word = {whereSearchWord: {}};
            if (typeof data.searchWord != 'undefined' && data.searchWord != '') {
                search_word = {whereSearchWord: {'search_word': data.searchWord}};
            }

            let prfile_name = {whereProfileName: {}};
            if (typeof data.profile_name != 'undefined' && data.profile_name != '') {
                prfile_name = {whereProfileName: {'profile_name': data.profile_name}};
            }

            let profile_type = {whereProfileType: {}};
            if (typeof data.profile_type != 'undefined' && data.profile_type != '') {
                profile_type = {whereProfileType: {'profile_type': data.profile_type}};
            }

            let module_name = {whereModuleName: {}};
            if (typeof data.module_name != 'undefined' && data.module_name != '') {
                module_name = {whereModuleName: {'module_name': data.module_name}};
            }

            let publish = {wherePublish: {}};
            if (typeof data.publish != 'undefined' && data.publish != '') {
                publish = {wherePublish: {'publish': data.publish}};
            }

            let created_on = {whereCreated_on: {}};
            if (typeof data.created_on != 'undefined' && data.created_on != '') {
                created_on = {whereCreated_on: {'created_on': data.created_on}};
            }


            let profile_conditions = {search_word, prfile_name, profile_type, module_name, publish, created_on}
            getProfiletList('profile_details as t1', what,
                    profile_conditions, data.filter.limit, data.filter.offset, (gcErr, profileList) => {
                if (profileList.length) {
                    logger.log({
                        level: 'info',
                        message: 'Room profile Record found!'
                    });
                    getProfileListHtml(profileList, data.profile_name, data.profile_type, data.module_name, data.publish, data.created_on, data.filter.page, (htmlErr, profileListHtml) => {
                        if (profileList) {
                            socket.emit('profileListView', {
                                profileListView: profileListHtml,
                                profileListCount: profileList.length
                            });
                        }
                    });
                } else {
                    logger.info('event list not found!');
                    let html = '';
                    html += '<div class="text-center">';
                    html += '<img src="../assets/dist/img/no_content.png"></div>';
                    html += '<p class="text-center m-10 text-muted">Room profile details unavailable.</p>';
                    html += '<p class="text-center m-10 text-muted">';
                    html += 'Record not found. Please contact ';
                    html += 'you administrator</p>';
                    socket.emit('profileListView', {
                        profileListView: html,
                        profileListCount: 0
                    });
                }
            })
        });

        /**
         * room profile assigment list
         */
        socket.on('roomProfileAssigmentList', (data) => {
            let what = ['t1.assignment_id', 't3.module_name', 't1.filter', 't1.filter_types', 't1.filter_details', 't1.guest_id', 't1.is_expiry', 't1.created_by', 't1.created_on', 't5.first_name'];
            let search_word = {whereSearchWord: {}};
            if (typeof data.searchWord != 'undefined' && data.searchWord != '') {
                search_word = {whereSearchWord: {'search_word': data.searchWord}};
            }

            let prfile_name = {whereProfileName: {}};
            if (typeof data.profile_name != 'undefined' && data.profile_name != '') {
                prfile_name = {whereProfileName: {'profile_name': data.profile_name}};
            }

            let profile_type = {whereProfileType: {}};
            if (typeof data.profile_type != 'undefined' && data.profile_type != '') {
                profile_type = {whereProfileType: {'profile_type': data.profile_type}};
            }

            let module_name = {whereModuleName: {}};
            if (typeof data.module_name != 'undefined' && data.module_name != '') {
                module_name = {whereModuleName: {'module_name': data.module_name}};
            }

            let publish = {wherePublish: {}};
            if (typeof data.publish != 'undefined' && data.publish != '') {
                publish = {wherePublish: {'publish': data.publish}};
            }

            let created_on = {whereCreated_on: {}};
            if (typeof data.created_on != 'undefined' && data.created_on != '') {
                created_on = {whereCreated_on: {'created_on': data.created_on}};
            }

            let profile_conditions = {search_word, prfile_name, profile_type, module_name, publish, created_on}
            getAssigmentProfiletList('profile_assignment as t1', what,
                    profile_conditions, data.filter.limit1, data.filter.offset1, (gcErr, profileList) => {
                if (profileList.length) {
                    logger.log({
                        level: 'info',
                        message: 'Room Assignment profile Record found!'
                    });                    
                    getAssignProfileListHtml(profileList, data.profile_name, data.module_name, data.publish, data.created_on, data.filter.page1, (htmlErr, profileListHtml) => {
                        if (profileList) {                            
                            socket.emit('profileAssignListView', {
                                profileListView: profileListHtml,
                                profileListCount: profileList.length
                            });
                        }
                    });
                } else {
                    logger.info('event list not found!');
                    let html = '';
                    html += '<div class="text-center">';
                    html += '<img src="../assets/dist/img/no_content.png"></div>';
                    html += '<p class="text-center m-10 text-muted">Room profile Assigment details unavailable.</p>';
                    html += '<p class="text-center m-10 text-muted">';
                    html += 'Record not found. Please contact ';
                    html += 'you administrator</p>';
                    socket.emit('profileAssignListView', {
                        profileListView: html,
                        profileListCount: 0
                    });
                }
            })
        });


        let getProfiletList = (tableName, what, conditions, limit, offset, callback) => {
            roomProfileMaster.getProfileLists(tableName, what, conditions, limit, offset, (tErr, tRes) => {
                if (tRes) {
                    callback(null, tRes);
                }
            });
        }

        let getAssigmentProfiletList = (tableName, what, conditions, limit, offset, callback) => {
            roomProfileMaster.getAssigmentProfiletList(tableName, what, conditions, limit, offset, (tErr, tRes) => {
                if (tRes) {
                    callback(null, tRes);
                }
            });
        }

        socket.on('pagination', function (data) {
            logger.log({
                level: 'info',
                message: 'Inside of pagination socket.on!'
            });
            let what = 'profile_detail_id';

            let search_word = {whereSearchWord: {}};
            if (typeof data.searchWord != 'undefined' && data.searchWord != '') {
                search_word = {whereSearchWord: {'search_word': data.searchWord}};
            }
            let room_profile_conditions = {search_word}

            roomFrofileCount('profile_details', what, room_profile_conditions, (gcErr, listCount) => {
                if (listCount[0].totalRows != 0) {
                    logger.log({
                        level: 'info',
                        message: 'Getting room profile record to make pagination!'
                    });
                    let countArr = {};
                    countArr['perpageLimit'] = data.filter.limit;
                    countArr['page'] = data.filter.page;
                    countArr['initial'] = data.filter.initial;
                    countArr['toPage'] = data.filter.toPage;
                    countArr['listCount'] = listCount[0].totalRows;
                    createPaginationHtml(countArr, (htmlErr, pagination) => {
                        if (pagination) {
                            socket.emit('pagination', {
                                pagination: pagination,
                                totalRecord: listCount[0].totalRows
                            });
                        } else {
                            socket.emit('pagination', {
                                pagination: pagination,
                                totalRecord: listCount[0].totalRows
                            });
                        }
                    });
                } else {
                    logger.log({
                        level: 'info',
                        message: 'Record not found for pagination!'
                    });
                    socket.emit('pagination', {
                        pagination: '',
                        totalRecord: ''
                    });
                }
            });
        });

        socket.on('pagination_assigment', function (data) {
            logger.log({
                level: 'info',
                message: 'Inside of asignment pagination!'
            });
            let what = 't1.assignment_id';

            let search_word = {whereSearchWord: {}};
            if (typeof data.searchWord != 'undefined' && data.searchWord != '') {
                search_word = {whereSearchWord: {'search_word': data.searchWord}};
            }
            let room_profile_conditions = {search_word}

            roomAssignmentProfileCount('profile_assignment', what, room_profile_conditions, (gcErr, listCount) => {
                if (listCount[0].totalRows != 0) {
                    logger.log({
                        level: 'info',
                        message: 'Getting room profile record to make pagination!'
                    });
                    let countArr = {};
                    countArr['perpageLimit'] = data.filter.limit1;
                    countArr['page'] = data.filter.page1;
                    countArr['initial'] = data.filter.initial1;
                    countArr['toPage'] = data.filter.toPage1;
                    countArr['listCount'] = listCount[0].totalRows;
                    createAssignmentPaginationHtml(countArr, (htmlErr, pagination) => {
                        if (pagination) {
                            socket.emit('pagination_assigment', {
                                pagination: pagination,
                                totalRecord: listCount[0].totalRows
                            });
                        } else {
                            socket.emit('pagination_assigment', {
                                pagination: pagination,
                                totalRecord: listCount[0].totalRows
                            });
                        }
                    });
                } else {
                    logger.log({
                        level: 'info',
                        message: 'Record not found for pagination!'
                    });
                    socket.emit('pagination_assigment', {
                        pagination: '',
                        totalRecord: ''
                    });
                }
            });
        });

        // paginationDropdown
        socket.on('searchHtmlTag', function (data) {
            let html = '';
            html += '<form action="#">';
            html += '    <div class="has-feedback has-feedback-right">';
            html += '        <input type="search" id="search_list" class="form-control dv-search-input" placeholder="Search">';
            html += '        <div class="form-control-feedback">';
            html += '            <i class="icon-search4 text-size-base text-muted"></i>';
            html += '        </div>';
            html += '    </div>';
            html += '</form>';
            socket.emit('searchList', {
                searchHtml: html
            });
        })

        socket.on('searchAssignmentHtmlTag', function (data) {
            let html = '';
            html += '<form action="#">';
            html += '    <div class="has-feedback has-feedback-right">';
            html += '        <input type="search" id="search_assign_list" class="form-control dv-search-input" placeholder="Search">';
            html += '        <div class="form-control-feedback">';
            html += '            <i class="icon-search4 text-size-base text-muted"></i>';
            html += '        </div>';
            html += '    </div>';
            html += '</form>';
            socket.emit('searchAssignList', {
                searchHtml: html
            });
        })

        socket.on('paginationDropdown', function (data) {
            logger.log({
                level: 'info',
                message: 'Inside of pagination dropdown!'
            });
            let dropDownArr = [10, 25, 50, "All"];
            let dropDownHtml = '<p style="display:none;" id="no_record">Showing 0 entries</p><p class="text-muted" id="record_found">Showing all ';
            dropDownHtml += '<select class="select-wsearch" id="pageinationDRP" style="width: 75px !important">';
            dropDownArr.forEach((item) => {
                dropDownHtml += '<option value="' + item + '">' + item + '</option>';
            });
            dropDownHtml += '</select>';
            dropDownHtml += ' entries</p>';
            socket.emit('paginationDropDown', {
                dropDownHtml: dropDownHtml
            });
        });

        socket.on('paginationAssignmentDropdown', function (data) {
            logger.log({
                level: 'info',
                message: 'Inside of pagination dropdown!'
            });
            let dropDownArr = [10, 25, 50, "All"];
            let dropDownHtml = '<p style="display:none;" id="no_asign_record">Showing 0 entries</p><p class="text-muted" id="record_assign_found">Showing all ';
            dropDownHtml += '<select class="select-wsearch" id="pageinationAssignDRP" style="width: 75px !important">';
            dropDownArr.forEach((item) => {
                dropDownHtml += '<option value="' + item + '">' + item + '</option>';
            });
            dropDownHtml += '</select>';
            dropDownHtml += ' entries</p>';
            socket.emit('paginationAssignmentDropDown', {
                dropDownHtml: dropDownHtml
            });
        });


        function createPaginationHtml(data, callback) {
            let paginationHTML = '';
            if (data.perpageLimit != null) {
                let eventCount = data.listCount;
                let totalPage = Math.ceil(data.listCount / data.perpageLimit);
                var i = 1;
                //console.log("datadatadatadatadatadatadata", data);
                var classActive = '';
                if (data.page <= totalPage) {
                    paginationHTML = '<a class="paginate_button previous disabled" style="cursor:pointer;">←</a>';
                    var pageNo = data.page;
                    //console.log(i);
                    for (i = data.initial; i <= (data.toPage); i++) {
                        if (data.page === i) {
                            classActive = 'current';
                        } else {
                            classActive = '';
                        }
                        paginationHTML += '<span><a class="paginate_button current_page ' + classActive + '" data-page="' + i + '">' + i + '</a></span>';
                        pageNo++;
//                    if (totalPage == i)
                        if (i == totalPage)
                            break;
                    }

                    if (i < totalPage) {
                        paginationHTML += '<a class="paginate_button next disabled" aria-controls="spa_tbl_subcategory" style="cursor:pointer;">→</a>';
                    }

                }
            }
            callback(null, paginationHTML);
        }

        function createAssignmentPaginationHtml(data, callback) {
            let paginationHTML = '';
            if (data.perpageLimit != null) {
                let eventCount = data.listCount;
                let totalPage = Math.ceil(data.listCount / data.perpageLimit);
                var i = 1;                
                var classActive = '';
                if (data.page <= totalPage) {
                    paginationHTML = '<a class="paginate_button previous_assign disabled" style="cursor:pointer;">←</a>';
                    var pageNo = data.page;                    
                    for (i = data.initial; i <= (data.toPage); i++) {
                        if (data.page === i) {
                            classActive = 'current';
                        } else {
                            classActive = '';
                        }
                        paginationHTML += '<span><a class="paginate_button current_assign_page ' + classActive + '" data-page="' + i + '">' + i + '</a></span>';
                        pageNo++;
//                    if (totalPage == i)
                        if (i == totalPage)
                            break;
                    }

                    if (i < totalPage) {
                        paginationHTML += '<a class="paginate_button next_assign disabled" aria-controls="spa_tbl_subcategory" style="cursor:pointer;">→</a>';
                    }

                }
            }
            callback(null, paginationHTML);
        }

        let roomFrofileCount = (tableName, what, condtion, callback) => {
            roomProfileMaster.getRoomProfileCounts(tableName, what, condtion, (tErr, tRes) => {
                if (tRes) {
                    callback(null, tRes);
                }
            });
        }

        let roomAssignmentProfileCount = (tableName, what, condtion, callback) => {
            roomProfileMaster.getAssignmentRoomProfileCounts(tableName, what, condtion, (tErr, tRes) => {
                if (tRes) {
                    callback(null, tRes);
                }
            });
        }
        /*
         * Get all iPad featute and subfeature
         */
        socket.on('getIpadFeature', (data) => {
            getAllIpadFeature(data, (rpErr, iPadFeature) => {
                if (iPadFeature) {
                    if (iPadFeature) {
                        getProfileTypeId(data, (rpErr, typeId) => {

                            createIpadFeatureHtml(data, iPadFeature, typeId,
                                    (htmlErr, iPadHtml) => {
                                if (iPadHtml) {
                                    socket.emit('sendIpadModuleHtml', {
                                        ipadFeatureHtml: iPadHtml
                                    });
                                } else {
                                    socket.emit('sendIpadModuleHtml', {
                                        ipadFeatureHtml: "<div style='text-align:center'>Ipad Details is not available, Please contact to administartor!</div>"
                                    });
                                }
                            });
                        });
                    }
//                    });
                }
            });
        });

        /*
         * Get all Room type detail 
         */
        socket.on('getRoomType', (data) => {
            getRoomType(data, (rpErr, roomType) => {
                if (roomType) {
                    createRoomTypeHtml(roomType, (htmlErr, roomTypeHtml) => {
                        if (roomTypeHtml) {
                            socket.emit('sendRoomType', {
                                roomTypeDropdown: roomTypeHtml
                            });
                        }
                    });
                }
            });
        });
        socket.on('getViewRoomType', (data) => {
            getRoomType(data, (rpErr, roomType) => {
                if (roomType) {
                    socket.emit('sendViewRoomType', {
                        roomTypeDropdown: roomType
                    });
                }
            });
        });

        socket.on('getEditRoomType', (data) => {
            getRoomType(data, (rpErr, roomType) => {
                if (roomType) {
                    createEditRoomTypeHtml(roomType, (htmlErr, roomTypeHtml) => {
                        if (roomTypeHtml) {
                            socket.emit('sendEditRoomType', {
                                roomEditTypeDropdown: roomTypeHtml
                            });
                        }
                    });
                }
            });
        });
        /*
         * Get all Room from room Type detail
         */
        socket.on('getRoom', (data) => {
            getRoomFromType(data, (rpErr, rooms) => {
                if (rooms) {
                    getInRoomDeviceId(data, (err, subRooms) => {
                        socket.emit('sendRoomHtml', {
                            roomDropdown: rooms,
                            subRoomDropdown: subRooms
                        });
                    });
                }
            });
        });

        socket.on('getEditRoom', (data) => {
            getRoomFromType(data, (rpErr, rooms) => {
                if (rooms) {
                    getInRoomDeviceId(data, (err, subRooms) => {
                        socket.emit('sendEditRoomHtml', {
                            roomDropdown: rooms,
                            subRoomDropdown: subRooms
                        });
                    });
                }
            });
        });

        /*
         * Get all floor type detail
         */
        socket.on('getFloorDetail', (data) => {
            getFloor(data, (rpErr, allFloordata) => {
                console.log("allFloordataallFloordata", allFloordata);
                if (allFloordata) {
                    socket.emit('sendAllFloorData', {
                        allFloorDropdown: allFloordata
                    });
                }
            });
        });

        socket.on('getAllRoom', (data) => {
            getAllRoomDetail(data, (rpErr, allRoomdata) => {
                if (allRoomdata) {
                    getInRoomDeviceId(data, (err, res) => {
                        socket.emit('sendAllRoomData', {
                            allRoomDropdown: allRoomdata,
                            inRoomDevice: res
                        });
                    })
                }
            });
        });

        socket.on('getEditFloorDetail', (data) => {
            getFloor(data, (rpErr, allFloordata) => {
                console.log("allFloordataallFloordata", allFloordata);
                if (allFloordata) {
                    socket.emit('sendEditAllFloorData', {
                        allFloorDropdown: allFloordata
                    });
                }
            });
        });

        socket.on('getEditAllRoom', (data) => {
            getAllRoomDetail(data, (rpErr, allRoomdata) => {
                if (allRoomdata) {
                    getInRoomDeviceId(data, (err, res) => {
                        socket.emit('sendEditAllRoomData', {
                            allRoomDropdown: allRoomdata,
                            inRoomDevice: res
                        });
                    })
                }
            });
        });


        socket.on('getGuestAllRoom', (data) => {
            getAllRoomDetail(data, (rpErr, allRoomdata) => {
                if (allRoomdata) {
                    getInRoomDeviceId(data, (err, res) => {
                        socket.emit('sendGuestAllRoomData', {
                            allRoomDropdown: allRoomdata,
                            inRoomDevice: res
                        });
                    })
                }
            });
        });

        socket.on('getEditGuestAllRoom', (data) => {
            getAllRoomDetail(data, (rpErr, allRoomdata) => {
                if (allRoomdata) {
                    getInRoomDeviceId(data, (err, res) => {
                        socket.emit('sendEditGuestAllRoomData', {
                            allRoomDropdown: allRoomdata,
                            inRoomDevice: res
                        });
                    })
                }
            });
        });
        socket.on('getViewFloorDetail', (data) => {
            getFloor(data, (rpErr, allFloordata) => {
                if (allFloordata) {
                    socket.emit('sendViewAllFloorData', {
                        allFloorDropdown: allFloordata
                    });
                }
            });
        });

        /*
         * Get all floor Rooms
         */
        socket.on('getFloorRoom', (data) => {
            getFloorRooms(data, (rpErr, allFloorRoomData) => {
                if (allFloorRoomData) {                    
                    createAllFloorRoomsHtml(allFloorRoomData,
                            (htmlErr, allFloorRoomsHtml) => {
                        if (allFloorRoomsHtml) {
                            socket.emit('sendAllFloorRoomsData', {
                                allFloorRoomsDropdown: allFloorRoomsHtml
                            });
                        }
                    });
                }
            });
        });
        /*
         * Get all IRD featute and subfeature
         */
        socket.on('getIrdFeature', (data) => {
            getIrdCatFeature(data, (rpErr, irdCat) => {
                if (irdCat.length) {
                    getIrdSubFeature(data, (htmlErr, irdSubCat) => {
                        if (irdSubCat) {
                            getIrdMenuItem(data, (htmlErr, irdmenuItem) => {
                                getProfileTypeId(data, (rpErr, typeId) => {
                                    createIrdFeatureHtml(data, irdCat, irdSubCat, irdmenuItem, typeId,
                                            (htmlErr, irdHtml) => {
                                        if (irdHtml) {
                                            socket.emit('sendIrdModuleHtml', {
                                                irdFeatureHtml: irdHtml
                                            });
                                        }
                                    });

                                });
                            });
                        }
                    });
                } else {
                    socket.emit('sendIrdModuleHtml', {
                        irdFeatureHtml: "<div style='text-align:center'>Ird Disable item is not available, Please contact to administartor!</div>"
                    });
                }
            });
        });

        socket.on('disableFeature', function (data) {
            if (data.module_name == "IRD") {

                getIrdCatFeature(data, (rpErr, irdCat) => {
                    if (irdCat.length) {
                        getIrdSubFeature(data, (htmlErr, irdSubCat) => {
                            if (irdSubCat) {
                                getIrdMenuItem(data, (htmlErr, irdmenuItem) => {                                    
                                    featureDetailsHtml(data, irdCat, irdSubCat, irdmenuItem,
                                            (htmlErr, irdHtml) => {
                                        if (irdHtml) {
                                            socket.emit('sendIrdViewModuleHtml', {
                                                irdDisableFeatureHtml: irdHtml
                                            });
                                        }
                                    });                                    
                                });
                            }
                        });
                    }
                });

            } else if (data.module_name == "TV CHANNEL") {
                type_idArr = data.type_idArr;
                item_idArr = data.item_idArr;
                getTvCat(data, (rpErr, tvCat) => {
                    if (tvCat.length) {
                        getTvChannel(data, (htmlErr, tvChannel) => {
                            featureTVDetailsHtml(data, tvCat, tvChannel,
                                    (htmlErr, tvHtml) => {
                                if (tvHtml) {
                                    socket.emit('sendTvChannelViewModuleHtml', {
                                        tvDisableFeatureHtml: tvHtml
                                    });
                                }
                            });

                        });
                    }
                });
            } else if (data.module_name == "IPAD FEATURE") {
                getIpadDisableItems(data, (rpErr, featureDetails) => {
                    if (featureDetails) {
                        featureIpadDetailsHtml(data, featureDetails,
                                (htmlErr, ipadHtml) => {
                            if (ipadHtml) {
                                socket.emit('sendIpadFeatureViewModuleHtml', {
                                    ipadDisableFeatureHtml: ipadHtml
                                });
                            }
                        });
                    } else {

                    }
                });
            }
        })

        /*
         * Get All profile module
         */
        let getIrdDisableItems = (data, callback) => {
            var what = [];
            var where = {subcat_id: data};
            roomProfileMaster.getIrdDisableItems(what, where, (iErr, iRes) => {
                if (iRes) {
                    callback(null, iRes);
                }
            });
        };

        let getTvChannelDisableItems = (data, callback) => {
            var what = [];
            var where = {tvch_id: data};
            roomProfileMaster.getTvChannelDisableItems(what, where, (iErr, iRes) => {
                if (iRes) {
                    callback(null, iRes);
                }
            });
        };

        let getIpadDisableItems = (data, callback) => {
            roomProfileMaster.getIpadItems((iErr, iRes) => {
                if (iRes) {
                    callback(null, iRes);
                }
            });
        };
        /*
         * Get all Tv channal and categories
         */
        socket.on('getTvFeature', (data) => {
            getTvCat(data, (rpErr, tvCat) => {
                if (tvCat.length) {
                    //console.log(iPadFeature);
                    getTvChannel(data, (htmlErr, tvChannel) => {
                        //console.log(iPadFeature);
                        if (tvChannel) {
                            getProfileTypeId(data, (rpErr, typeId) => {
                                createTvFeatureHtml(data, tvCat, tvChannel, typeId,
                                        (htmlErr, tvHtml) => {
                                    if (tvHtml) {
                                        socket.emit('sendTvModuleHtml', {
                                            tvFeatureHtml: tvHtml
                                        });
                                    } else {
                                        socket.emit('sendTvModuleHtml', {
                                            tvFeatureHtml: "Tv Channel details is not available, Please contact to administrator!"
                                        });
                                    }
                                });
                            });
                        }
                    });
                } else {
                    socket.emit('sendTvModuleHtml', {
                        tvFeatureHtml: "<div style='text-align:center'>Tv Channel details is not available, Please contact to administrator!</div>"
                    });
                }
            });
        });

        /**
         * get edit form data
         */
        socket.on('getEditRoomProfile', (data) => {
            getRoomProfileDetails('profile_details', data, (rpErr, editDetails) => {
                if (editDetails) {
                    socket.emit('profilesDetailsData', {'edit_details': editDetails[0], 'status': 1});
                } else {
                    socket.emit('profilesDetailsData', {'edit_details': editDetails[0], 'status': 0});
                }
            });
        });

        /*
         * Save profile function
         */
        socket.on('saveProfile', (data) => {
            saveProfileData(data, (rpErr, profileRes) => {
                if (profileRes) {

                }
            });
        });

        socket.on('update_prifile', function (data) {
            updateProfileData(data, (rpErr, updateRes) => {
                if (updateRes) {
                    socket.emit('updateProfileNotification', {'update_res': 'Profile data update succesfully!', 'update_flag': 1});
                } else {
                    socket.emit('updateProfileNotification', {'update_res': 'Profile data update failed!', 'update_flag': 0});
                }
            });
        });

        socket.on('deleteProfile', function (data) {

            getAssignementAndProfileDetails('profile_assignment_detail_mapping', data.profile_id, (rpErr, roomDetails) => {                
                if (roomDetails.length > 0) {                    
                    socket.emit('deleteProfileNotification', {'del_res': 'This Profile Can not be deleted,This profile may be assigned for any room or guest!', 'delete_flag': 0});
                } else {                    
                    var profile_id = data.profile_id;
                    deleteMappedProfileData('profile_detail_item_mapping', {profile_detail_id: profile_id}, (Err, Detail) => {
                        if (Detail) {

                        } else {

                        }
                    });

                    deleteMappedProfileData('profile_details', {profile_detail_id: profile_id}, (Err, Detail) => {
                        if (Detail) {
                            socket.emit('deleteProfileNotification', {'del_res': 'Profile deleted succesfully!', 'delete_flag': 1});
                        } else {
                            socket.emit('deleteProfileNotification', {'del_res': 'Profile deleted failed!', 'delete_flag': 0});
                        }
                    });
                }               
            });           
        })

        socket.on('deleteAssignProfile', function (data) {
            var assignment_id = data.assignment_id;
            deleteMappedProfileData('profile_assignment_inroomdevice_mapping', {assignment_id: assignment_id}, (Err, Detail) => {
                if (Detail) {

                } else {

                }
            });

            deleteMappedProfileData('profile_assignment_detail_mapping', {assignment_id: assignment_id}, (Err, Detail) => {
                if (Detail) {

                } else {

                }
            });

            deleteMappedProfileData('profile_assignment', {assignment_id: assignment_id}, (Err, Detail) => {
                if (Detail) {
                    socket.emit('deleteAssignProfileNotification', {'del_res': 'Profile deleted succesfully!', 'delete_flag': 1});
                } else {
                    socket.emit('deleteAssignProfileNotification', {'del_res': 'Profile deleted failed!', 'delete_flag': 0});
                }
            });

        })

        socket.on('getProfiledetails', function (data) {
            getRoomProfileDetails('profile_details', data, (rpErr, roomDetails) => {
                console.log("profilesDetailssssss", roomDetails);
                socket.emit('viewProfileDetails', {'details': roomDetails});
            });
        });

        socket.on('getAssignProfiledetails', function (data) {
            getAssignRoomProfileDetails('profile_assignment', data, (rpErr, roomDetails) => {                
                socket.emit('viewAssignProfileDetails', {'details': roomDetails});
            });
        });

        socket.on('getEditAssignRoomProfile', function (data) {
            getEditAssignRoomProfileDetails('profile_assignment', data, (rpErr, roomDetails) => {                
                socket.emit('editAssignProfileDetails', {'details': roomDetails});
            });
        });

        socket.on('profile_publish', function (data) {
            let profile_id = data.profile_id;
            let dataUpdate = [];
            dataUpdate.push({'is_publish': 1});
            updateProfileDetail('profile_details',
                    dataUpdate, profile_id, (iErr, pdDetail) => {
                if (pdDetail) {
                    socket.emit('updatePublishProfileNotification', {'update_res': 'Profile publish successfully!', 'update_flag': 1});
                } else {
                    socket.emit('updatePublishProfileNotification', {'update_res': 'Profile publish failed!', 'update_flag': 0});
                }
            });

        });

        /**
         * get getCheckedInGuest user
         */
        socket.on('getCheckedInGuest', function (data) {
            roomProfileMaster.getGuest(data, (iErr, iRes) => {
                if (iRes) {
                    socket.emit('guestDetails', {'guest_details': iRes});
                }
            });
        });

        socket.on('getEditCheckedInGuest', function (data) {
            roomProfileMaster.getGuest(data, (iErr, iRes) => {
                if (iRes) {
                    socket.emit('edit_guestDetails', {'guest_details': iRes});
                }
            });
        });
        /*
         * Get All profile module
         */
        let getProfiles = (data, callback) => {
            var what = ['module_name'];
            var where = {is_active: 1};
            roomProfileMaster.getProfileModules(what, where, (iErr, iRes) => {
                if (iRes) {
                    callback(null, iRes);
                }
            });
        };

        /*
         * Get profile name
         */
        let getProfilesName = (data, callback) => {
            var what = ['profile_name'];
            var where = {is_active: 1, 'profile_name': data.profile_name};
            roomProfileMaster.getProfilename(what, where, (iErr, iRes) => {
                if (iRes) {
                    callback(null, iRes);
                } else {
                    callback(null, iErr);
                }
            });
        };

        let getEditProfilesName = (data, callback) => {
            var what = ['profile_name'];
            var where = {is_active: 1, 'profile_name': data.profile_name};
            var whereNot = {'profile_detail_id': data.edit_profile_hid};
            roomProfileMaster.getEditProfilename(what, where, whereNot, (iErr, iRes) => {
                if (iRes) {
                    callback(null, iRes);
                } else {
                    callback(null, iErr);
                }
            });
        };
        /*
         * Rendering produle module html
         */
        let createProfileModuleHtml = (rpResult, callback) => {
            htmlRendering.profileModuleDropDown(rpResult, (htmlErr, htmlRes) => {
                if (htmlRes) {
                    callback(null, htmlRes);
                } else {
                    callback(htmlErr, null);
                }
            });
        };
        /*
         * Get all iPad feature
         */
        let getAllIpadFeature = (data, callback) => {
            var what = ['config_val'];
            var where = {config_key: 'ipad_features'};
            roomProfileMaster.getIpadFeature(what, where, (iErr, iRes) => {
                if (iRes) {                    
                    callback(null, iRes);
                }
            });
        };
        let getIpadSubFeature = (data, callback) => {
            var what = ['id', 'name', 'feature_images', 'parent_id'];
            var where = {enabled: 1};
            roomProfileMaster.getIpadSubFeature(what, where, (iErr, iRes) => {
                if (iRes) {
                    callback(null, iRes);
                }
            });
        };
        /*
         * Rendering iPad feature html
         */
        let createIpadFeatureHtml = (data, iPadFeature, typeId, callback) => {
            htmlRendering.ipadFeature(data, iPadFeature, typeId,
                    (htmlErr, htmlRes) => {
                if (htmlRes) {
                    callback(null, htmlRes);
                } else {
                    callback(htmlErr, null);
                }
            });
        };
        /*
         * Get all IRD feature
         */
        let getIrdCatFeature = (data, callback) => {
            var what = [];
            var where = {hotel_id: data.hotelId, 'is_active': data.is_active};
            roomProfileMaster.getIrdCat(what, where, (iErr, iRes) => {
                if (iRes) {
                    callback(null, iRes);
                }
            });
        };

        /*
         * Get profile type
         */
        let getProfileTypeId = (data, callback) => {
            var what = [];
            var where = {module_name: data.module_name};
            roomProfileMaster.getProfileTypeId(what, where, (iErr, iRes) => {
                if (iRes) {
                    callback(null, iRes);
                }
            });
        };
        let getIrdSubFeature = (data, callback) => {
            var what = [];
            var where = {hotel_id: data.hotelId, 'is_active': data.is_active};
            roomProfileMaster.getIrdSubcat(what, where, (iErr, iRes) => {
                if (iRes) {
                    callback(null, iRes);
                }
            });
        };

        let getIrdMenuItem = (data, callback) => {
            var what = [];
            var where = {hotel_id: data.hotelId, 'is_active': data.is_active};
            roomProfileMaster.getMenuItem(what, where, (iErr, iRes) => {
                if (iRes) {
                    callback(null, iRes);
                }
            });
        };
        /*
         * Rendering IRD feature html
         */
        let createIrdFeatureHtml = (data, irdCat, irdSubCat, irdMenuItem, typeId, callback) => {
            htmlRendering.irdFeature(data, irdCat, irdSubCat, irdMenuItem, typeId, (htmlErr, htmlRes) => {
                if (htmlRes) {
                    callback(null, htmlRes);
                } else {
                    callback(htmlErr, null);
                }
            });
        };
        /*
         * get room type 
         */
        let getRoomType = (data, callback) => {
            var what = ['key_category_id', 'name'];
            var where = {hotel_id: data.hotelId};
            roomProfileMaster.roomType(what, where, (iErr, iRes) => {
                if (iRes) {
                    callback(null, iRes);
                }
            });
        };
        /*
         * Create room type feature html
         */
        let createRoomTypeHtml = (roomT, callback) => {
            htmlRendering.roomType(roomT, (htmlErr, htmlRes) => {
                if (htmlRes) {
                    callback(null, htmlRes);
                } else {
                    callback(htmlErr, null);
                }
            });
        };

        /*
         * Create room type feature html
         */
        let createEditRoomTypeHtml = (roomT, callback) => {
            htmlRendering.editRoomType(roomT, (htmlErr, htmlRes) => {
                if (htmlRes) {
                    callback(null, htmlRes);
                } else {
                    callback(htmlErr, null);
                }
            });
        };
        /*
         * get room from room tyype
         */
        let getRoomFromType = (data, callback) => {
            console.log("roomTyperoomTyperoomTyperoomType", data.roomTypeId);
            var what = ['key_id', 'number', 'key_category_id'];
            var where = {hotel_id: data.hotelId, is_active: 1};
            if (data.roomTypeId == "All")
            {
                roomProfileMaster.roomsAll(what, where, (iErr, iRes) => {
                    if (iRes) {
                        callback(null, iRes);
                    }
                });
            } else {
                var whereIn = data.roomTypeId;
                roomProfileMaster.rooms(what, where, whereIn, (iErr, iRes) => {
                    if (iRes) {
                        callback(null, iRes);
                    }
                });
            }
        };

        let getInRoomDeviceId = (data, callback) => {
            var what = ['in_room_device_id', 'display_name', 'key_id'];
            var where = {hotel_id: data.hotelId, is_active: 1};
            roomProfileMaster.inroomDevice(what, where, (iErr, iRes) => {                
                callback(null, iRes);
            });
        };
        /*
         * Create room html
         */
        let createRoomHtml = (rooms, callback) => {
            htmlRendering.roomsHtml(rooms, (htmlErr, htmlRes) => {
                if (htmlRes) {
                    callback(null, htmlRes);
                } else {
                    callback(htmlErr, null);
                }
            });
        };

        let createSubRoomHtml = (rooms, subRooms, callback) => {
            htmlRendering.subRoomsHtml(rooms, subRooms, (htmlErr, htmlRes) => {
                if (htmlRes) {
                    callback(null, htmlRes);
                } else {
                    callback(htmlErr, null);
                }
            });
        };

        /*
         * Create room html
         */
        let createEditRoomHtml = (rooms, callback) => {
            htmlRendering.roomsEditHtml(rooms, (htmlErr, htmlRes) => {
                if (htmlRes) {
                    callback(null, htmlRes);
                } else {
                    callback(htmlErr, null);
                }
            });
        };
        /*
         * get All floor type 
         */
        let getFloor = (data, callback) => {
            var what = ['floor_id', 'name'];
            var where = {hotel_id: data.hotelId};
            roomProfileMaster.allFloorData(what, where, (iErr, iRes) => {
                if (iRes) {
                    callback(null, iRes);
                }
            });
        };
        /*
         * Create room type feature html
         */
        let createAllFloorHtml = (allFloordata, callback) => {
            htmlRendering.allFloor(allFloordata, (htmlErr, htmlRes) => {
                if (htmlRes) {
                    callback(null, htmlRes);
                } else {
                    callback(htmlErr, null);
                }
            });
        };

        /*
         * Get all TV feature
         */
        let getTvCat = (data, callback) => {
            var what = [];
            var where = {hotel_id: data.hotelId, 'is_active': data.is_active};
            roomProfileMaster.tvCat(what, where, (iErr, iRes) => {
                if (iRes) {
                    callback(null, iRes);
                }
            });
        };
        let getTvChannel = (data, callback) => {
            var what = [];
            var where = {hotel_id: data.hotelId, 'is_active': data.is_active};
            roomProfileMaster.tvChannel(what, where, (iErr, iRes) => {
                if (iRes) {
                    callback(null, iRes);
                }
            });
        };
        /*
         * Rendering TV feature html
         */
        let createTvFeatureHtml = (data, tvCat, tvChannel, typeId, callback) => {
            htmlRendering.tvFeature(data, tvCat, tvChannel, typeId, (htmlErr, htmlRes) => {
                if (htmlRes) {
                    callback(null, htmlRes);
                } else {
                    callback(htmlErr, null);
                }
            });
        };

        /*
         * get All floor Rooms type 
         */
        let getFloorRooms = (data, callback) => {
            var what = ['key_id', 'number'];
            var where = {hotel_id: data.hotelId, floor_id: data.floor_id};
            roomProfileMaster.getFloorRooms(what, where, (iErr, iRes) => {
                if (iRes) {
                    callback(null, iRes);
                }
            });
        };
        /*
         * Create room type feature html
         */
        let createAllFloorRoomsHtml = (allFloorRoomData, callback) => {
            htmlRendering.allFloorRooms(allFloorRoomData, (htmlErr, htmlRes) => {
                if (htmlRes) {
                    callback(null, htmlRes);
                } else {
                    callback(htmlErr, null);
                }
            });
        };
        /*
         * get All room details 
         */
        let getAllRoomDetail = (data, callback) => {
            var what = ['key_id', 'number', 'floor_id'];
            var where = {hotel_id: data.hotelId};
            roomProfileMaster.getFloorRooms(what, where, (iErr, iRes) => {
                if (iRes) {
                    callback(null, iRes);
                }
            });
        };
        /*
         * Create all floor rooms tabs html
         */
        let createAllFloorRoomsTabs = (floor, rooms, callback) => {
            htmlRendering.floorRoomTabs(floor, rooms, (htmlErr, htmlRes) => {
                if (htmlRes) {
                    callback(null, htmlRes);
                } else {
                    callback(htmlErr, null);
                }
            });
        };

        let createEditAllFloorRoomsTabs = (floor, rooms, callback) => {
            htmlRendering.editFloorRoomTabs(floor, rooms, (htmlErr, htmlRes) => {
                if (htmlRes) {
                    callback(null, htmlRes);
                } else {
                    callback(htmlErr, null);
                }
            });
        };
        /*
         * Save profile data
         */
        let saveProfileData = (data, callback) => {
            let dataInsert = [];
            let profileInsertData = {};
            // build insert query values            
            let expiry = '';
            profileDetails = JSON.parse(data.profileDetails);
            profileDetails = profileDetails[0];
            profileInsertData['profile_name'] = profileDetails.profile_name;
            profileInsertData['is_profile_type_enable'] = profileDetails.is_profile_type_enable;
            profileInsertData['module_name'] = profileDetails.module_name;
            profileInsertData['hotel_id'] = profileDetails.hotel_id;
            profileInsertData['profile_name'] = profileDetails.profile_name;
            profileInsertData['created_by'] = profileDetails.created_by;
            insertProfileDetail('profile_details',
                    profileInsertData, (iErr, pdDetail) => {
                if (pdDetail) {
                    console.log(pdDetail);
                    let profile_map = JSON.parse(profileDetails.profile_mapping);

                    let profileData = [];
                    let i = 0;
                    profile_map.profile_type_id.forEach((item) => {
                        profileData.push({'profile_detail_id': pdDetail[0], 'profile_type_id': item, 'profile_item_id': profile_map.profile_item_id[i], 'parent_id': profile_map.parent_id[i],
                            'created_by': profileDetails.created_by, 'hotel_id': profileDetails.hotel_id})
                        i++;
                    });
                    insertProfileDetail('profile_detail_item_mapping',
                            profileData, (iErr, pdDetailMapping) => {
                        if (pdDetailMapping) {
                            if (profileDetails.module_name == "TV CHANNEL") {
                                tvChannelProfileVisibleUpdation((htmlErr, tvChannelUpdateRes) => {
                                    //socket.emit('savedProfileNotification', {'res': 'Profile data saved successfully!', 'flag': 1});
                                });
                            } else if (profileDetails.module_name == "IRD") {
                                irdProfileVisibleUpdation((htmlErr, irdUpdateRes) => {
                                    //socket.emit('savedProfileNotification', {'res': 'Profile data saved successfully!', 'flag': 1});
                                });
                            } else {
                                //socket.emit('savedProfileNotification', {'res': 'Profile data saved successfully!', 'flag': 1});
                            }
                            //socket.emit('savedProfileNotification', {'res': 'Profile data saved successfully!', 'flag': 1});
                        } else {
                            //socket.emit('savedProfileNotification', {'res': 'Profile data saved failed!', 'flag': 0});
                        }

                    });
                    socket.emit('savedProfileNotification', {'res': 'Profile data saved successfully!', 'flag': 1});
                } else {
                    socket.emit('savedProfileNotification', {'res': 'Profile data saved failed!', 'flag': 0});
                }
            });
        };
        let updateProfileData = (data, callback) => {
            let dataUpdate = [];
            let profileUpdateData = {};
            // build insert query values            
            let expiry = '';
            let profile_id = data.edit_profile_hid;
            profileDetails = JSON.parse(data.profileDetails);
            profileDetails = profileDetails[0];
            profileUpdateData['profile_name'] = profileDetails.profile_name;
            profileUpdateData['is_profile_type_enable'] = profileDetails.is_profile_type_enable;
            profileUpdateData['module_name'] = profileDetails.module_name;
            profileUpdateData['hotel_id'] = profileDetails.hotel_id;
            profileUpdateData['profile_name'] = profileDetails.profile_name;
            profileUpdateData['modified_by'] = profileDetails.modified_by;

            updateProfileDetail('profile_details',
                    profileUpdateData, {profile_detail_id: profile_id}, (iErr, pdDetail) => {
                if (pdDetail) {
                    let profileData = [];

                    console.log("profile_mappingprofile_mapping", profileDetails.profile_mapping);
                    deleteMappedProfileData('profile_detail_item_mapping', {profile_detail_id: profile_id}, (Err, Detail) => {
                    });

                    let profile_map = JSON.parse(profileDetails.profile_mapping);

                    let i = 0;
                    profile_map.profile_type_id.forEach((item) => {
                        profileData.push({'profile_detail_id': profile_id, 'profile_type_id': item, 'profile_item_id': profile_map.profile_item_id[i], 'parent_id': profile_map.parent_id[i], 'hotel_id': profileDetails.hotel_id, 'created_by': profileDetails.modified_by})
                        i++;
                    });
                    insertProfileDetail('profile_detail_item_mapping',
                            profileData, (iErr, pdDetailMapping) => {
                        if (pdDetailMapping) {
                            if (profileDetails.module_name == "TV CHANNEL") {
                                tvChannelProfileVisibleUpdation((htmlErr, tvChannelUpdateRes) => {
                                    //socket.emit('savedProfileNotification', {'res': 'Profile data saved successfully!', 'flag': 1});
                                });
                            } else if (profileDetails.module_name == "IRD") {
                                irdProfileVisibleUpdation((htmlErr, irdUpdateRes) => {
                                    //socket.emit('savedProfileNotification', {'res': 'Profile data saved successfully!', 'flag': 1});
                                });
                            } else {
                                //socket.emit('savedProfileNotification', {'res': 'Profile data saved successfully!', 'flag': 1});
                            }
                            //socket.emit('savedProfileNotification', {'res': 'Profile data saved successfully!', 'flag': 1});
                        } else {
                            //socket.emit('savedProfileNotification', {'res': 'Profile data saved failed!', 'flag': 0});
                        }

                    });
                    callback(null, pdDetail);
                } else {
                    callback(iErr, null);
//                    socket.emit('updateProfileNotification', {'res': 'Profile data update failed!', 'flag': 0});
                }
            });
        };
        /*
         * Save profile data into dtatabase 
         */
        let insertProfileDetail = (tableName, insertParam, callback) => {
            roomProfileMaster.insert(tableName, insertParam, (iErr, iRes) => {
                if (iRes) {
                    callback(null, iRes);
                }
            });
        };

        let updateProfileDetail = (tableName, updateParam, id, callback) => {
            roomProfileMaster.update(tableName, updateParam, id, (iErr, iRes) => {
                if (iRes) {
                    callback(null, iRes);
                }
            });
        };

        let deleteMappedProfileData = (tableName, id, callback) => {
            roomProfileMaster.delete(tableName, id, (iErr, iRes) => {
                if (iRes) {
                    callback(null, iRes);
                }
            });
        };

        /*
         * get profile moduleid
         */
        let getProfileModuleId = (moduleName, callback) => {
            var what = ['profile_type_id', 'profile_type'];
            var where = {module_name: moduleName, is_active: 1};
            roomProfileMaster.tvCat(what, where, (iErr, iRes) => {
                if (iRes) {
                    callback(null, iRes);
                }
            });
        };

        /*
         * get profile moduleid
         */
        let getRoomProfileDetails = (tableName, data, callback) => {
            var what = [];
            var where = {'t1.is_deleted': 0, 't1.is_active': 1, 't1.profile_detail_id': data.profile_id};
            roomProfileMaster.editProfilesDetails(tableName, what, where, (tErr, tRes) => {
                if (tRes) {
                    callback(null, tRes);
                }
            });
        }

        let getAssignRoomProfileDetails = (tableName, data, callback) => {
            var what = [];
            var where = {is_deleted: 0, is_active: 1, 'assignment_id': data.assign_id};
            roomProfileMaster.getAssignProfilesDetails(tableName, what, where, (tErr, tRes) => {
                if (tRes) {
                    callback(null, tRes);
                }
            });
        }

        let getAssignementAndProfileDetails = (tableName, profile_id, callback) => {
            var what = [];
            var where = {'t1.is_deleted': 0, 't1.is_active': 1, 't1.profile_detail_id': profile_id,'t2.is_expiry':0};
            roomProfileMaster.getExistedProfilesDetails(tableName, what, where, (tErr, tRes) => {
                if (tRes) {
                    callback(null, tRes);
                }
            });
        }

        let getEditAssignRoomProfileDetails = (tableName, data, callback) => {
            var what = [];
            var where = {is_deleted: 0, is_active: 1, 'assignment_id': data.assign_id};
            roomProfileMaster.getEditAssignProfilesDetails(tableName, what, where, (tErr, tRes) => {
                if (tRes) {
                    callback(null, tRes);
                }
            });
        }
        /*
         * get room number
         */
        let getRoomNumber = (what, where, callback) => {
            roomProfileMaster.getRoomsNumber(what, where, (tErr, tRes) => {
                if (tRes) {
                    callback(null, tRes);
                }
            });
        }

        /**************************profile_assign*****************************/
        socket.on("getExistedProfile", function (callback) {
            roomProfileMaster.getProfilename(['profile_detail_id', 'profile_name'], {'is_deleted': 0}, (tErr, tRes) => {
                if (tRes) {
                    socket.emit('existedProfile', {'profile': tRes});
                } else {
                    socket.emit('existedProfile', {'profile': ""});
                }
            });
        })
    },
    expireAssigment: (callback) => {
        console.log("Moniter expir assigment of inroom_deviceId");
        let assignment_id = [];
        let assign_id = [];
        getProfileAssignemtToExpireGuest((guestAsignsErr, guestAsignsRes) => {
            if (guestAsignsRes[0].assignment_id) {
                assign_id = guestAsignsRes[0].assignment_id.split(',');
                assign_id.forEach((item) => {
                    assignment_id.push(item);
                });                
            }
            getProfileAssignemtToExpire((roomAsignsErr, roomAsignsRes) => {
                if (roomAsignsRes[0].assignment_id) {
                    assign_id = roomAsignsRes[0].assignment_id.split(',');
                }
                assign_id.forEach((item) => {
                    assignment_id.push(item);
                });                       
                if (assignment_id.length > 0)
                    expireAssigment(assignment_id, (err, res) => {

                    })
            })

        })
    },
    getProfileDetailsForJson: (what, in_room_device_id, guest_id, callback) => {
        getProfileListForJson(what, in_room_device_id, guest_id, (upsErr, upsRes) => {
            callback(null, upsRes);

        })
    },
    getIRDCategoryRoomProfile: (tableName, what, where, roomKey, callback) => {
        getIRDCatRoomProfileList(tableName, what, where, roomKey, (upsErr, upsRes) => {
            callback(null, upsRes);
        })
    },
    getIRDSubCategoryRoomProfile: (tableName, what, where, roomKey, callback) => {
        getIRDSubCategoryRoomProfile(tableName, what, where, roomKey, (upsErr, upsRes) => {
            callback(null, upsRes);
        })
    },
    getIpadCategoryRoomProfile: (tableName, what, where, roomKey, callback) => {
        getIpadCategoryRoomProfileList(tableName, what, where, roomKey, (upsErr, upsRes) => {
            callback(null, upsRes);
        })
    },
    getIpadSubCategoryRoomProfile: (tableName, what, where, roomKey, callback) => {
        getIpadSubCategoryRoomProfile(tableName, what, where, roomKey, (upsErr, upsRes) => {
            callback(null, upsRes);
        })
    },
    getTvCategoryRoomProfile: (tableName, what, where, roomKey, callback) => {
        getTvCategoryRoomProfileList(tableName, what, where, roomKey, (upsErr, upsRes) => {
            callback(null, upsRes);
        })
    },
    getTvSubCategoryRoomProfile: (tableName, what, where, roomKey, callback) => {
        getTvSubCategoryRoomProfile(tableName, what, where, roomKey, (upsErr, upsRes) => {
            callback(null, upsRes);
        })
    },
    assignProfile: (data, callback) => {
        let assigned_details = {};
        let assigned_detailsArr = {};
        let data1 = data[0].roomsAssigmentArr;        
        var i = 0;
        if (data1.guest_id.length > 0) {            
            data1.guest_id.forEach((guest_id) => {
                assigned_details['filter'] = data1.filter;
                assigned_details['filter_types'] = data1.filter_types.toString();
                assigned_details['filter_details'] = data1.guest_key_id[0][guest_id];
                assigned_details['checkout'] = data1.checkout;
                assigned_details['never_expiry'] = data1.never_expiry;
                assigned_details['expiry_date'] = data1.expiry_date;
                assigned_details['is_publish'] = data1.is_publish;
                assigned_details['guest_id'] = guest_id;
                assigned_details['hotel_id'] = data1.hotel_id;
                assigned_details['created_by'] = data1.created_by;                
                saveAssignedProfileByAPI(assigned_details, data1, data1.guest_key_id[0][guest_id], data1.profile_detail_id, (err, res) => {

                });
                assigned_details = {};
            });
        } else {            
            assigned_details['filter'] = data1.filter;
            assigned_details['filter_types'] = data1.filter_types;
            assigned_details['filter_details'] = JSON.stringify(data1.filter_details);
            assigned_details['key_category_floor'] = data1.keyCategory_floor;
            assigned_details['checkout'] = data1.checkout;
            assigned_details['never_expiry'] = data1.never_expiry;
            assigned_details['expiry_date'] = data1.expiry_date;
            assigned_details['is_publish'] = data1.is_publish;
            assigned_details['guest_id'] = 0;
            assigned_details['hotel_id'] = data1.hotel_id;
            assigned_details['created_by'] = data1.created_by;            
            saveAssignedProfileByAPI(assigned_details, data1, 0, data1.profile_detail_id, (err, res) => {

            });
        }

        assigned_details = {};
        i++;
        callback(null, 'Profile assigned successfully!');        
    }
};

let getIRDCatRoomProfileList = (tableName, what, where, roomKey, callback) => {
    roomProfileMaster.profileIRDCategoryList(tableName, what, where, roomKey, (tErr, tRes) => {
        if (tRes) {
            callback(null, tRes);
        }
    });
}

let getIRDSubCategoryRoomProfile = (tableName, what, where, roomKey, callback) => {
    roomProfileMaster.getIRDSubCategoryRoomProfile(tableName, what, where, roomKey, (tErr, tRes) => {
        if (tRes) {
            callback(null, tRes);
        }
    });
}

let getIpadCategoryRoomProfileList = (tableName, what, where, roomKey, callback) => {
    roomProfileMaster.profileIpadCategoryList(tableName, what, where, roomKey, (tErr, tRes) => {
        if (tRes) {
            callback(null, tRes);
        }
    });
}

let getIpadSubCategoryRoomProfile = (tableName, what, where, roomKey, callback) => {
    roomProfileMaster.ipadSubCategoryRoomProfile(tableName, what, where, roomKey, (tErr, tRes) => {
        if (tRes) {
            callback(null, tRes);
        }
    });
}

let getTvCategoryRoomProfileList = (tableName, what, where, roomKey, callback) => {
    roomProfileMaster.profileTvCategoryList(tableName, what, where, roomKey, (tErr, tRes) => {
        if (tRes) {
            callback(null, tRes);
        }
    });
}

let getTvSubCategoryRoomProfile = (tableName, what, where, roomKey, callback) => {
    roomProfileMaster.tvSubCategoryRoomProfile(tableName, what, where, roomKey, (tErr, tRes) => {
        if (tRes) {
            callback(null, tRes);
        }
    });
}

let getProfileListForJson = (what, in_room_device_id, guest_id, callback) => {
    roomProfileMaster.getAssignedProfileDate(what, in_room_device_id, guest_id, (tErr, tRes) => {
        if (tRes) {
            callback(null, tRes);
        }
    });
}

let getProfileAssignemtToExpireGuest = (callback) => {
    roomProfileMaster.getGuestAssignmentIdToExpire((tErr, tRes) => {
        if (tRes) {
            callback(null, tRes);
        }
    });
}

let getProfileAssignemtToExpire = (callback) => {
    roomProfileMaster.getByRoomAssignmentIdToExpire((tErr, tRes) => {
        if (tRes) {
            callback(null, tRes);
        }
    });
}

let expireAssigment = (assigned_id, callback) => {
    roomProfileMaster.expireAssignId(assigned_id, (tErr, tRes) => {
        if (tRes) {
            callback(null, tRes);
        }
    });
}

/*
 * Save assignment data into database 
 */
let saveAssignedProfile = (assignProfile, data, key, profile_id, callback) => {
    roomProfileMaster.insert('profile_assignment', assignProfile, (iErr, iRes) => {
        if (iRes) {            
            let profile_Assign_ARR = {};
            let created_by = JSON.parse(data.created_by);
            let hotel_id = JSON.parse(data.hotel_id);
            profile_id.forEach((item) => {
                console.log("profile_idprofile_idprofile_idprofile_idprofile_id", item);
                profile_Assign_ARR['assignment_id'] = iRes[0];
                profile_Assign_ARR['profile_detail_id'] = item;
                profile_Assign_ARR['hotel_id'] = hotel_id;
                profile_Assign_ARR['created_by'] = created_by;
                roomProfileMaster.insert('profile_assignment_detail_mapping', profile_Assign_ARR, (iErr, iRes) => {

                });
                profile_Assign_ARR = {};
            });            
            let in_room_device_id = JSON.parse(data.in_room_device_id);
            let assignMappingArr = {};
            for (var myKey in in_room_device_id) {
                if (in_room_device_id[myKey].key == key || key == 0) {
                    assignMappingArr['assignment_id'] = iRes[0];
                    assignMappingArr['key_id'] = in_room_device_id[myKey].key;
                    assignMappingArr['in_room_device_id'] = in_room_device_id[myKey].val;
                    assignMappingArr['hotel_id'] = hotel_id;
                    assignMappingArr['created_by'] = created_by;
                    roomProfileMaster.insert('profile_assignment_inroomdevice_mapping', assignMappingArr, (iErr, iRes) => {

                    });
                }                
                assignMappingArr = {};
            }
        }
    });
};

let saveAssignedProfileByAPI = (assignProfile, data, key, profile_id, callback) => {
    roomProfileMaster.insert('profile_assignment', assignProfile, (iErr, iRes) => {
        if (iRes) {
            let profile_Assign_ARR = {};
            let created_by = JSON.parse(data.created_by);
            let hotel_id = JSON.parse(data.hotel_id);
            profile_id.forEach((item) => {
                profile_Assign_ARR['assignment_id'] = iRes[0];
                profile_Assign_ARR['profile_detail_id'] = item;
                profile_Assign_ARR['hotel_id'] = hotel_id;
                profile_Assign_ARR['created_by'] = created_by;
                roomProfileMaster.insert('profile_assignment_detail_mapping', profile_Assign_ARR, (iErr, iRes) => {

                });
                profile_Assign_ARR = {};
            });            
            let in_room_device_id = (data.in_room_device_id);
            let assignMappingArr = {};
            for (var myKey in in_room_device_id) {               
                assignMappingArr['assignment_id'] = iRes[0];
                assignMappingArr['key_id'] = in_room_device_id[myKey].key;
                assignMappingArr['in_room_device_id'] = in_room_device_id[myKey].val;
                assignMappingArr['hotel_id'] = hotel_id;
                assignMappingArr['created_by'] = created_by;
                roomProfileMaster.insert('profile_assignment_inroomdevice_mapping', assignMappingArr, (iErr, iRes) => {

                });                 
                assignMappingArr = {};
            }
        }
    });
};

let updateAssignedProfile = (assignProfile, assigment_id, data, key, profile_id, callback) => {
    roomProfileMaster.update('profile_assignment', assignProfile, {assignment_id: assigment_id}, (iErr, iRes) => {
        if (iRes) {
            deleteMappedProfileData('profile_assignment_detail_mapping', {assignment_id: assigment_id}, (Err, Detail) => {
            });

            deleteMappedProfileData('profile_assignment_inroomdevice_mapping', {assignment_id: assigment_id}, (Err, Detail) => {
            });

            let profile_Assign_ARR = {};
            let created_by = JSON.parse(data.modified_by);
            let hotel_id = JSON.parse(data.hotel_id);
            profile_id.forEach((item) => {                
                profile_Assign_ARR['assignment_id'] = assigment_id;
                profile_Assign_ARR['profile_detail_id'] = item;
                profile_Assign_ARR['created_by'] = created_by;
                profile_Assign_ARR['hotel_id'] = hotel_id;
                roomProfileMaster.insert('profile_assignment_detail_mapping', profile_Assign_ARR, (iErr, iRes) => {

                });
                profile_Assign_ARR = {};
            });            

            let in_room_device_id = JSON.parse(data.in_room_device_id);            
            let assignMappingArr = {};
            for (var myKey in in_room_device_id) {
                if (in_room_device_id[myKey].key == key || key == 0) {
                    assignMappingArr['assignment_id'] = assigment_id;
                    assignMappingArr['key_id'] = in_room_device_id[myKey].key;
                    assignMappingArr['in_room_device_id'] = in_room_device_id[myKey].val;
                    assignMappingArr['created_by'] = created_by;
                    assignMappingArr['hotel_id'] = hotel_id;                    
                    roomProfileMaster.insert('profile_assignment_inroomdevice_mapping', assignMappingArr, (iErr, iRes) => {

                    });
                }                
                assignMappingArr = {};
            }
        } else {
            console.log("errorerrorerrorerrorerrorerror", iErr);
        }
    });
};

let deleteMappedProfileData = (tableName, id, callback) => {
    roomProfileMaster.delete(tableName, id, (iErr, iRes) => {
        if (iRes) {
            callback(null, iRes);
        }
    });
};

function getProfileListHtml(data, profile_name, profile_type, module_name, publish, created_on, page, callback) {
    console.log("publish", publish);
    logger.log({
        level: 'info',
        message: 'Inside of profile List preparing datatable!'
    });
    let profile_name_order = '';
    if (profile_name == 'desc') {
        profile_name_order = 'asc';
    } else if (profile_name == 'asc') {
        profile_name_order = 'desc';
    }

    let profile_type_order = '';
    if (profile_type == 'desc') {
        profile_type_order = 'asc';
    } else if (profile_type == 'asc') {
        profile_type_order = 'desc';
    }

    let module_name_order = '';
    if (module_name == 'desc') {
        module_name_order = 'asc';
    } else if (module_name == 'asc') {
        module_name_order = 'desc';
    }

    let publish_order = '';
    if (publish == 'desc') {
        publish_order = 'asc';
    } else if (publish == 'asc') {
        publish_order = 'desc';
    }

    let created_order = '';
    if (created_on == 'desc') {
        created_order = 'asc';
    } else if (created_on == 'asc') {
        created_order = 'desc';
    }

    let profileList = '';
    let event_order = '';
    let date_order = '';
    profileList += '<table class="table alternate-color full-width panel dataTable no-footer dtr-inline" id="">';
    profileList += ' <thead>';
    profileList += '  <tr>';
    if (profile_name_order != '') {
        profileList += '    <th class="sorting_' + profile_name_order + ' profile_name" data-sort_profile_name="' + profile_name_order + '">Profile Name</th>';
    } else {
        profileList += '    <th class="sorting profile_name" data-sort_profile_name="asc">Profile Name</th>';
    }

    if (profile_type_order != '') {
        profileList += '    <th class="sorting_' + profile_type_order + ' profile_type" data-sort_profile_type="' + profile_type_order + '">Profile Type</th>';
    } else {
        profileList += '    <th class="sorting profile_type" data-sort_profile_type="asc">Profile Type</th>';
    }

    if (module_name_order != '') {
        profileList += '    <th class="sorting_' + module_name_order + ' module_name" data-sort_module_name="' + module_name_order + '">Module</th>';
    } else {
        profileList += '    <th class="sorting module_name" data-sort_module_name="asc">Module</th>';
    }

    if (created_order != '') {
        profileList += '    <th class="sorting_' + created_order + ' created_on" data-created_order="' + created_order + '">Created On</th>';
    } else {
        profileList += '    <th class="sorting created_on" data-created_order="asc">Created On</th>';
    }
    if (event_order != '') {
        profileList += '    <th class="sorting_' + event_order + ' event" data-event="' + event_order + '">Created By</th>';
    } else {
        profileList += '    <th class="event" data-event="asc">Created By</th>';
    }
    if (event_order != '') {
        profileList += '    <th class="sorting_' + event_order + ' event" data-event="' + event_order + '">Modified On</th>';
    } else {
        profileList += '    <th class="event" data-event="asc">Modified On</th>';
    }

    if (date_order != '') {
        profileList += '    <th class="sorting_' + date_order + ' event_time" data-event_time="' + date_order + '">Modified By</th>';
    } else {
        profileList += '    <th class="event_time" data-event_time="asc">Modified By</th>';
    }

    profileList += '    <th class=""></th>';
    profileList += '  </tr>';
    profileList += ' </thead>';
    profileList += ' <tbody>';
    data.forEach((item) => {
        profileList += '<tr id="tr_' + item.profile_detail_id + '">';
        profileList += '<td>' + item.profile_name + '</td>';
        if (item.is_profile_type_enable == 1) {
            profileList += '<td>Enable</td>';
        } else {
            profileList += '<td>Disable</td>';
        }
        profileList += '<td>' + item.module_name + '</td>';
        profileList += '<td>' + moment(item.created_on, 'YYYY-MM-DD HH:mm:ss').format('YYYY-MM-DD HH:mm:ss') + '</td>';
        if (item.created_by != null) {
            profileList += '<td>' + item.first_name + '</td>';
        } else {
            profileList += '<td>-</td>';
        }
        if (item.modified_on != null) {
            profileList += '<td>' + moment(item.modified_on, 'YYYY-MM-DD HH:mm:ss').format('YYYY-MM-DD HH:mm:ss') + '</td>';
        } else {
            profileList += '<td>-</td>';
        }
        if (item.update_by_name != null) {
            profileList += '<td>' + item.update_by_name + '</td>';
        } else {
            profileList += '<td>-</td>';
        }
        profileList += '<td class="text-right">';
        profileList += '    <div class="col-md- text-right">';
        profileList += '        <ul class="icons-list">';
        profileList += '            <li class="dropdown">';
        profileList += '                <a href="#" class="dropdown-toggle" data-toggle="dropdown">';
        profileList += '                    <i class="icon-more2"></i>';
        profileList += '                </a>';
        profileList += '        <ul class="dropdown-menu dropdown-menu-right">';
        profileList += '            <li class="viewProfileData" data-profile_id="' + item.profile_detail_id + '"><a href="#" data-profile_id="' + item.profile_detail_id + '">View</a></li>';
        profileList += '            <li class="edit_rm" data-profile_id="' + item.profile_detail_id + '"><a href="#">Edit</a></li>';
        if (item.is_publish == 0) {
            profileList += '            <li class="profile_publish" data-profile_id="' + item.profile_detail_id + '"><a href="#">Publish</a></li>';
        }
        profileList += '            <li class="deletedata" data-profile_id="' + item.profile_detail_id + '"><a dataid="1" href="#" data-target="#DeleteModal" data-toggle="modal">Delete</a></li>';
        profileList += '        </ul>';
        profileList += '            </li>';
        profileList += '        </ul>';
        profileList += '    </div>';
        profileList += '</td>';
        
        profileList += '</tr>';
    });
    profileList += ' </tbody>';
    profileList += '</table>';
    callback(null, profileList);
}

function getAssignProfileListHtml(data, profile_name, profile_type, module_name, created_on, page, callback) {
    logger.log({
        level: 'info',
        message: 'Inside of assigment List preparing datatable!'
    });
    let profile_name_order = '';
    if (profile_name == 'desc') {
        profile_name_order = 'asc';
    } else if (profile_name == 'asc') {
        profile_name_order = 'desc';
    }

    let profile_type_order = '';
    if (profile_type == 'desc') {
        profile_type_order = 'asc';
    } else if (profile_type == 'asc') {
        profile_type_order = 'desc';
    }

    let module_name_order = '';
    if (module_name == 'desc') {
        module_name_order = 'asc';
    } else if (module_name == 'asc') {
        module_name_order = 'desc';
    }

    let created_order = '';
    if (created_on == 'desc') {
        created_order = 'asc';
    } else if (created_on == 'asc') {
        created_order = 'desc';
    }

    let profileList = '';
    let assigned_by_order = '';
    let date_order = '';
    profileList += '<table class="table alternate-color full-width panel dataTable no-footer dtr-inline" id="">';
    profileList += ' <thead>';
    profileList += '  <tr>';
    if (profile_name_order != '') {
        profileList += '    <th class="profile_assign_name" data-sort_profile_name="' + profile_name_order + '">Profile Name</th>';
    } else {
        profileList += '    <th class="profile_assign_name" data-sort_profile_name="asc">Profile Name</th>';
    }

    if (module_name_order != '') {
        profileList += '    <th class="module_name" data-sort_module_name="' + module_name_order + '">Module</th>';
    } else {
        profileList += '    <th class="module_name" data-sort_module_name="asc">Module</th>';
    }

    if (module_name_order != '') {
        profileList += '    <th class="text-center" data-publish_order="">Status</th>';
    } else {
        profileList += '    <th class="text-center" data-publish_order="asc">Status</th>';
    }

    if (module_name_order != '') {
        profileList += '    <th class=" text-center" data-publish_order="">Assigned For</th>';
    } else {
        profileList += '    <th class="text-center" data-publish_order="asc">Assigned For</th>';
    }

    if (module_name_order != '') {
        profileList += '    <th class="text-center" data-publish_order="">Assigned To</th>';
    } else {
        profileList += '    <th class="text-center" data-publish_order="asc">Assigned To</th>';
    }

    if (created_order != '') {
        profileList += '    <th class="sorting_' + created_order + ' assign_created_on" data-created_order="' + created_order + '">Assigned Date</th>';
    } else {
        profileList += '    <th class="sorting assign_created_on" data-created_order="asc">Assigned Date</th>';
    }
    if (assigned_by_order != '') {
        profileList += '    <th class="sorting_' + assigned_by_order + ' event" data-event="' + assigned_by_order + '">Assigned By</th>';
    } else {
        profileList += '    <th class="event" data-event="asc">Assigned By</th>';
    }

    profileList += '    <th class=""></th>';
    profileList += '  </tr>';
    profileList += ' </thead>';
    profileList += ' <tbody>';    
    let pname = "";
    let mname = "";
    data.forEach((item) => {
        profileList += '<tr id="tr_' + item.assignment_id + '">';
        pname = item.profile_name.split(',');
        mname = item.module_name.split(',');
        var pname = pname.filter(function (itm, i, a) {
            return i == pname.indexOf(itm);
        });

        var mname = mname.filter(function (itm, i, a) {
            return i == mname.indexOf(itm);
        });
        
        profileList += '<td><span data-toggle="tooltip" title="" data-original-title="' + pname + '">' + pname + '</span></td>';
        profileList += '<td><span data-toggle="tooltip" title="" data-original-title="' + mname + '">' + mname + '</span></td>';
        if (item.is_expiry == 1) {
            profileList += '<td align="center">Expire</td>';
        } else {
            profileList += '<td align="center">Active</td>';
        }
        if (item.filter == 1) {
            profileList += '<td align="center"> Room </td>';
        } else if (item.filter == 2) {
            profileList += '<td align="center"> Guest </td>';
        }

        if (item.filter == 1) {           
            profileList += '<td align="center"><span data-toggle="tooltip" title="" data-original-title="' + item.number + '"> ' + item.number + ' </span></td>';            
        } else if (item.filter == 2) {
            profileList += '<td align="center"> ' + item.guest_name + ' </td>';
        }

        profileList += '<td>' + moment(item.created_on, 'YYYY-MM-DD HH:mm:ss').format('YYYY-MM-DD HH:mm:ss') + '</td>';
        if (item.created_by != null) {
            profileList += '<td>' + item.first_name + '</td>';
        } else {
            profileList += '<td>-</td>';
        }
        profileList += '<td class="text-right">';
        profileList += '    <div class="col-md- text-right">';
        profileList += '        <ul class="icons-list">';
        profileList += '            <li class="dropdown">';
        profileList += '                <a href="#" class="dropdown-toggle" data-toggle="dropdown">';
        profileList += '                    <i class="icon-more2"></i>';
        profileList += '                </a>';
        profileList += '        <ul class="dropdown-menu dropdown-menu-right">';
        profileList += '            <li class="viewAssignProfileData" data-assign_id="' + item.assignment_id + '"><a href="#" data-profile_id="' + item.assignment_id + '">View</a></li>';
        profileList += '            <li class="edit_assignment_rm" data-assign_id="' + item.assignment_id + '"><a href="#">Edit</a></li>';
        profileList += '            <li class="deleteAssigndata" data-assign_id="' + item.assignment_id + '"><a dataid="1" href="#" data-target="#DeleteAssignModal" data-toggle="modal">Delete</a></li>';
        profileList += '        </ul>';
        profileList += '            </li>';
        profileList += '        </ul>';
        profileList += '    </div>';
        profileList += '</td>';
        
        profileList += '</tr>';
    });
    profileList += ' </tbody>';
    profileList += '</table>';
    callback(null, profileList);
}

let userDetails = (userSelectData, userSelectCondition, callback) => {
    var what = [userSelectData.select];
    var where = {hotel_id: userSelectCondition.hotel_id, user_id: userSelectCondition.user_id};
    roomProfileMaster.userDetails(what, where, (iErr, iRes) => {
        if (iRes) {
            callback(null, iRes);
        }
    });
};


function featureDetailsHtml(data, category, subcategory, menuitem, callback) {
    var htmlView = '';
    let type_idArr = data.type_idArr;
    let item_idArr = data.item_idArr;
    var htmlView = '';
    if (category.length > 0) {
        CatArr = {};
        category.forEach((item) => {
            CatArr[item.category_id] = item.category_name;
        });
        var i = 0;
        type_idArr.forEach((item) => {
            if (item == 1) {
                htmlView += '<div class="col-md-2">';
                htmlView += '   <div class="inner_subcategory">';
                htmlView += '       <div class="modulename_subcategory_name">';
                htmlView += '           <p class="truncate" title="' + CatArr[item_idArr[i]] + '" data-toggle="tooltip">' + CatArr[item_idArr[i]] + '</p>';
                htmlView += '       </div>';
                htmlView += '   </div>';
                htmlView += '</div>';
            }
            i++;

        });
    }
    if (subcategory.length > 0) {
        subCatArr = {};
        subcategory.forEach((item) => {
            subCatArr[item.subcat_id] = item.subcat_name;
        });
        var i = 0;
        type_idArr.forEach((item) => {
            if (item == 2) {
                htmlView += '<div class="col-md-2">';
                htmlView += '   <div class="inner_subcategory">';
                htmlView += '       <div class="modulename_subcategory_name">';
                htmlView += '           <p class="truncate" title="' + subCatArr[item_idArr[i]] + '" data-toggle="tooltip">' + subCatArr[item_idArr[i]] + '</p>';
                htmlView += '       </div>';
                htmlView += '   </div>';
                htmlView += '</div>';
            }
            i++;

        });
    }
    if (menuitem.length > 0) {
        menuItemArr = {};
        menuitem.forEach((item) => {
            menuItemArr[item.menuitem_id] = item.menuitem_name;
        });
        var i = 0;
        type_idArr.forEach((item) => {
            if (item == 3) {
                htmlView += '<div class="col-md-2">';
                htmlView += '   <div class="inner_subcategory">';
                htmlView += '       <div class="modulename_subcategory_name">';
                htmlView += '           <p class="truncate" title="' + menuItemArr[item_idArr[i]] + '" data-toggle="tooltip">' + menuItemArr[item_idArr[i]] + '</p>';
                htmlView += '       </div>';
                htmlView += '   </div>';
                htmlView += '</div>';
            }
            i++;

        });
    }
    callback(null, htmlView);
}

function featureTVDetailsHtml(data, tvCat, TvChannnel, callback) {
    let type_idArr = data.type_idArr;
    let item_idArr = data.item_idArr;
    var htmlView = '';
    if (tvCat.length > 0) {
        tvCatArr = {};
        tvCat.forEach((item) => {
            tvCatArr[item.tvchannel_category_id] = item.category_name;
        });
        var i = 0;
        type_idArr.forEach((item) => {
            if (item == 4) {
                htmlView += '<div class="col-md-2">';
                htmlView += '   <div class="inner_subcategory">';
                htmlView += '       <div class="modulename_subcategory_name">';
                htmlView += '           <p class="truncate" title="' + tvCatArr[item_idArr[i]] + '" data-toggle="tooltip">' + tvCatArr[item_idArr[i]] + '</p>';
                htmlView += '       </div>';
                htmlView += '   </div>';
                htmlView += '</div>';
            }
            i++;

        });
    }
    if (TvChannnel.length > 0) {
        tvSubCatArr = {};
        TvChannnel.forEach((item) => {
            tvSubCatArr[item.tvchannel_id] = item.tvchannel_name;
        });
        var i = 0;
        type_idArr.forEach((item) => {
            if (item == 5) {
                htmlView += '<div class="col-md-2">';
                htmlView += '   <div class="inner_subcategory">';
                htmlView += '       <div class="modulename_subcategory_name">';
                htmlView += '           <p class="truncate" title="' + tvSubCatArr[item_idArr[i]] + '" data-toggle="tooltip">' + tvSubCatArr[item_idArr[i]] + '</p>';
                htmlView += '       </div>';
                htmlView += '   </div>';
                htmlView += '</div>';
            }
            i++;

        });
    }
    callback(null, htmlView);
}

function featureIpadDetailsHtml(data, feature, callback) {
    var htmlView = '';
    feature = feature[0].config_val;
    category = JSON.parse(feature);
    let item_idArr = data.item_idArr;
    category.forEach((cat) => {
        for (var myKey in cat) {
            if (item_idArr.indexOf(myKey.toString()) != -1) {
                htmlView += '<div class="col-md-2">';
                htmlView += '   <div class="inner_subcategory">';
                htmlView += '       <div class="modulename_subcategory_name">';
                htmlView += '           <p class="truncate" title="' + cat[myKey].name + '" data-toggle="tooltip">' + cat[myKey].name + '</p>';
                htmlView += '       </div>';
                htmlView += '   </div>';
                htmlView += '</div>';
            }
        }
    });
    callback(null, htmlView);
}

/**
 * tvChannelProfileVisibleUpdation function is used to check item is exist in any profile and update profile_visible value in specific table of tvchannel
 */
function tvChannelProfileVisibleUpdation(callback) {
    roomProfileMaster.tvCategory((tErr, tRes) => {
        if (tRes) {
            let category_id = tRes[0].tvchannel_category_id;
            roomProfileMaster.checkItemIsExistInProfile(4, category_id, (tErr, tcRes) => {
                let is_profile_type_enable = tcRes[0].is_profile_type_enable.split(',');
                let result = tcRes[0].item_id.split(',');
                category_id = category_id.split(',');
                let enable = [];
                let disable = [];

                let i = 0;
                result.forEach((item) => {
                    if (is_profile_type_enable[i] == 1) {
                        enable.push(item);
                    } else if (is_profile_type_enable[i] == 0) {
                        disable.push(item);
                    }
                    i++;
                });

                disable.push(2);
                let tempArr = [];
                disable.forEach((d) => {
                    if (enable.indexOf(d.toString()) == -1) {
                        tempArr.push(d);
                    }
                    i++;
                });

                let updateData = '';
                disable = tempArr;                
                let length = enable.length;
                roomProfileMaster.update('tvchannel_category', {'profile_visible': 1}, {'is_active': 1}, (err, res) => {
                })

                if (length) {
                    enableArr = enable.filter(function (elem, pos) {
                        return enable.indexOf(elem) == pos;
                    })
                    roomProfileMaster.updateProfileVisible('tvchannel_category', 'tvchannel_category_id', enableArr, {'profile_visible': 1}, (err, res) => {

                    })
                }
                length = disable.length;
                if (length) {
                    disableArr = disable.filter(function (elem, pos) {
                        return disable.indexOf(elem) == pos;
                    })
                    roomProfileMaster.updateProfileVisible('tvchannel_category', 'tvchannel_category_id', disableArr, {'profile_visible': 0}, (err, res) => {

                    })
                }
            })
            //callback(null, tRes);
        }

        // room profile subcategory
        roomProfileMaster.tvSubCategory((tErr, tRes) => {
            if (tRes) {
                let subCategory_id = tRes[0].tvchannel_id;                
                roomProfileMaster.checkItemIsExistInProfile(5, subCategory_id, (tErr, tcRes) => {
                    let result = tcRes[0].item_id.split(',');
                    subCategory_id = subCategory_id.split(',');
                    let enable = [];
                    let disable = [];
                    subCategory_id.forEach((item) => {
                        if (result.indexOf(item) > -1) {
                            enable.push(item);
                        } else {
                            disable.push(item);
                        }
                    });
                    let updateData = '';                    
                    let length = enable.length;

                    roomProfileMaster.update('tvchannel_master', {'profile_visible': 1}, {'is_active': 1}, (err, res) => {
                    })

                    if (length) {
                        enableArr = enable.filter(function (elem, pos) {
                            return enable.indexOf(elem) == pos;
                        })
                        roomProfileMaster.updateProfileVisible('tvchannel_master', 'tvchannel_id', enableArr, {'profile_visible': 1}, (err, res) => {

                        })
                    }
                    length = disable.length;
                    if (length) {
                        disableArr = disable.filter(function (elem, pos) {
                            return disable.indexOf(elem) == pos;
                        })
                        roomProfileMaster.updateProfileVisible('tvchannel_master', 'tvchannel_id', disableArr, {'profile_visible': 0}, (err, res) => {

                        })
                    }
                })

                //callback(null, tRes);
            }
        });


    });
}

/**
 * irdProfileVisibleUpdation function is used to check item is exist in any profile and update profile_visible value in specific table of ird
 */
function irdProfileVisibleUpdation(callback) {
    roomProfileMaster.irdCategory((tErr, tRes) => {
        if (tRes) {
            let category_id = tRes[0].category_id;
            //console.log("category_idcategory_id", category_id);
            roomProfileMaster.checkItemIsExistInProfile(1, category_id, (tErr, tcRes) => {
                let result = tcRes[0].item_id.split(',');
                category_id = category_id.split(',');
                let enable = [];
                let disable = [];
                category_id.forEach((item) => {
                    if (result.indexOf(item) > -1) {
                        enable.push(item);
                    } else {
                        disable.push(item);
                    }
                });
                let updateData = '';
                //console.log(enable, " array ", disable);
                let length = enable.length;
                roomProfileMaster.update('ird_categories', {'profile_visible': 1}, {'is_active': 1}, (err, res) => {
                })
                if (length) {
                    enableArr = enable.filter(function (elem, pos) {
                        return enable.indexOf(elem) == pos;
                    })
                    roomProfileMaster.updateProfileVisible('ird_categories', 'category_id', enableArr, {'profile_visible': 1}, (err, res) => {

                    })
                }
                length = disable.length;
                if (length) {
                    disableArr = disable.filter(function (elem, pos) {
                        return disable.indexOf(elem) == pos;
                    })
                    roomProfileMaster.updateProfileVisible('ird_categories', 'category_id', disableArr, {'profile_visible': 0}, (err, res) => {

                    })
                }
            })
            //callback(null, tRes);
        }

        // room profile subcategory
        roomProfileMaster.irdSubCategory((tErr, tRes) => {
            if (tRes) {
                let subCategory_id = tRes[0].subcat_id;                
                roomProfileMaster.checkItemIsExistInProfile(2, subCategory_id, (tErr, tcRes) => {
                    let result = tcRes[0].item_id.split(',');
                    subCategory_id = subCategory_id.split(',');
                    let enable = [];
                    let disable = [];
                    subCategory_id.forEach((item) => {
                        if (result.indexOf(item) > -1) {
                            enable.push(item);
                        } else {
                            disable.push(item);
                        }
                    });
                    let updateData = '';                    
                    let length = enable.length;
                    roomProfileMaster.update('ird_sub_categories', {'profile_visible': 1}, {'is_active': 1}, (err, res) => {
                    })
                    if (length) {
                        enableArr = enable.filter(function (elem, pos) {
                            return enable.indexOf(elem) == pos;
                        })
                        roomProfileMaster.updateProfileVisible('ird_sub_categories', 'subcat_id', enableArr, {'profile_visible': 1}, (err, res) => {

                        })
                    }
                    length = disable.length;
                    if (length) {
                        disableArr = disable.filter(function (elem, pos) {
                            return disable.indexOf(elem) == pos;
                        })
                        roomProfileMaster.updateProfileVisible('ird_sub_categories', 'subcat_id', disableArr, {'profile_visible': 0}, (err, res) => {

                        })
                    }
                })

                //callback(null, tRes);
            }
        });

        // room profile subcategory
        roomProfileMaster.irdMenuCategory((tErr, tRes) => {
            if (tRes) {
                let menuItem_id = tRes[0].menuitem_id;                
                roomProfileMaster.checkItemIsExistInProfile(3, menuItem_id, (tErr, tcRes) => {
                    //if(item_id){
                    let result = "";
                    if (tcRes[0].item_id == null) {
                        result = [];
                    } else {
                        result = tcRes[0].item_id.split(',');
                    }
                    menuItem_id = menuItem_id.split(',');
                    let enable = [];
                    let disable = [];
                    menuItem_id.forEach((item) => {
                        if (result.indexOf(item) > -1) {
                            enable.push(item);
                        } else {
                            disable.push(item);
                        }
                    });
                    let updateData = '';                    
                    let length = enable.length;
                    roomProfileMaster.update('ird_menuitems', {'profile_visible': 1}, {'is_active': 1}, (err, res) => {
                    })
                    if (length) {
                        enableArr = enable.filter(function (elem, pos) {
                            return enable.indexOf(elem) == pos;
                        })
                        roomProfileMaster.updateProfileVisible('ird_menuitems', 'menuitem_id', enableArr, {'profile_visible': 1}, (err, res) => {

                        })
                    }
                    length = disable.length;
                    if (length) {
                        disableArr = disable.filter(function (elem, pos) {
                            return disable.indexOf(elem) == pos;
                        })
                        roomProfileMaster.updateProfileVisible('ird_menuitems', 'menuitem_id', disableArr, {'profile_visible': 0}, (err, res) => {

                        })
                    }
                })

                //callback(null, tRes);
            }
        });


    });
}



module.exports = roomProfile;
