let config = require(__base + 'config');
commonMaster = require(__base +
        'components/db-master/eventLog/common.js'),
        events = require(__base +
                'components/db-master/eventLog/events-log.js'),
        moment = require('moment'),
        // winston = require('winston'),
        // bodyParser = require('body-parser'),
        // path = require('path'),
        logger = require(__base + 'components/logger').log(),
        logFormat = require(__base + 'components/logger').format;

let sc = '';
let filterVal = '';
let latestCreatedOn = '';

let eventLog = {
    onConnect: (socket) => {
        sc = socket;
        socket.on('disconnect', function (response) {});
        /**
         * 
         */
        socket.on('pageFilter', function (data) {
            let dataArr = {};
            logger.log({
                level: 'info',
                message: 'Inside of doorlock pageFilter'
            });
            getEventName('zigbee_events', 'event',
                    'event', (gcErr, eventName) => {
                if (eventName) {
                    logger.log({
                        level: 'info',
                        message: 'Getting event name for pageFilter'
                    });
                    dataArr['eventName'] = eventName;
                    let what = ['key_id', 'number'];
                    let conditions = {where: {is_deleted: 0}};
                    getRoomNumber('keys', what,
                            conditions, (gcErr, keysRoom) => {
                        logger.log({
                            level: 'info',
                            message: 'Getting room number for pageFilter'
                        });
                        dataArr['keysRoom'] = keysRoom;
                        getEventFilterHTMLView(dataArr, (htmlErr, eventFilterHtmlView) => {
                            if (eventFilterHtmlView) {
                                socket.emit('setPageFilter', {
                                    eventFilterHtmlView: eventFilterHtmlView
                                });
                            }
                        })
                    });
                }
            })
        });



        /*
         * Render All Filter Type (event Log Left Panel View)
         */
        let getEventFilterHTMLView = (data, callback) => {

            let searchView = '';
            searchView += '<div class="category-content text-semibold">';
            searchView += '<h5>Filter';
            searchView += '<a href="javascript:void();" data-animation="bounce" class="search-btn text-grey pull-right clear"><i class="icon-search4 text-size-base"></i></a>';
            searchView += '</h5>';
            searchView += '<div class="search-input bounce row" style="display:none">';
            searchView += '<input type="text" class="form-control" id="search_event" placeholder="Search">';
            searchView += '</div>';
            searchView += '</div>';
            searchView += '</div>';
            searchView += '<div class="sidebar-content dv-customScroll1">';
            searchView += '<div class="sidebar-category">';
            searchView += '<div class="category-content pt-10 pb-10">';
            searchView += '<div class="category-title mb-10">';
            searchView += '<span>Search by Event Name</span>';
            searchView += '</div>';
            searchView += '<form action="#">';
            searchView += '<div class="check-filter dv-list schedule_push_form">';
            searchView += '<div class="row">';
            searchView += '<div class="col-md-12">';
            searchView += '<select data-placeholder="Search by Event Name" multiple="multiple" id="event_name" class="select">';
            data.eventName.forEach((item) => {
                searchView += '<option value="' + item.event + '">' + item.event + '</option>';
            })
            searchView += '</select>';
            searchView += '</div>';
            searchView += '</div>';
            searchView += '</div>';
            searchView += '</form>';
            searchView += '</div>';
            searchView += '</div>';
            searchView += '<div class="sidebar-category">';
            searchView += '<div class="category-content pt-10 pb-10">';
            searchView += '<div class="category-title mb-10">';
            searchView += '<span>Search by Room Number</span>';
            searchView += '</div>';
            searchView += '<form action="#">';
            searchView += '<div class="check-filter dv-list schedule_push_form">';
            searchView += '<div class="row">';
            searchView += '<div class="col-md-12">';
            searchView += '<select data-placeholder="Search by Room Number" multiple="multiple" id="room_no" class="select">';
            data.keysRoom.forEach((item) => {
                searchView += '<option value="' + item.key_id + '">' + item.number + '</option>';
            })
            searchView += '</select>';
            searchView += '</div>';
            searchView += '</div>';
            searchView += '</div>';
            searchView += '</form>';
            searchView += '</div>';
            searchView += '</div>';
            searchView += '<div class="sidebar-category">';
            searchView += '<div class="category-content pt-10 pb-10">';
            searchView += '<div class="category-title mb-10">';
            searchView += '<span>From Event Date-Time</span>';
            searchView += '</div>';
            searchView += '<form action="#">';
            searchView += '<div class="check-filter dv-list schedule_push_form">';
            searchView += '<div class="row">';
            searchView += '<div class="col-md-12 date_time_picker">';
            searchView += '<input type="text" class="form-control" id="datetimepicker_from" placeholder="Search From Event Date-Time" />';
            searchView += '</div>';
            searchView += '</div>';
            searchView += '</div>';
            searchView += '</form>';
            searchView += '</div>';

            searchView += '<div class="category-title mb-10">';
            searchView += '<span>To Event Date-Time</span>';
            searchView += '</div>';
            searchView += '<form action="#">';
            searchView += '<div class="check-filter dv-list schedule_push_form">';
            searchView += '<div class="row">';
            searchView += '<div class="col-md-12 date_time_picker">';
            searchView += '<input type="text" class="form-control" id="datetimepicker_to" placeholder="Search To Event Date-Time" />';
            searchView += '</div>';
            searchView += '</div>';
            searchView += '</div>';
            searchView += '</form>';
            searchView += '</div>';

            searchView += '</div>';
            searchView += '</div>';
            callback(null, searchView);
        }

// Fetch All Event name from zigbee_events table
        let getEventName = (tableName, what, conditions, callback) => {
            commonMaster.eventName(tableName, what, conditions, (tErr, tRes) => {
                if (tRes) {
                    callback(null, tRes);
                }
            });
        }

// Fetch All Room number for logs
        let getRoomNumber = (tableName, what, conditions, callback) => {
            commonMaster.select(tableName, what, conditions, (tErr, tRes) => {
                if (tRes) {
                    callback(null, tRes);
                }
            });
        }


// event List
        socket.on('eventList', function (data) {
            logger.log({
                level: 'info',
                message: 'Inside of eventlist socket.on'
            });
            filterVal = data;
            let what = ['t1.event', 't1.created_on', 't2.number'];
            let event_name_conditions = {whereEventName: {}};
            if (typeof data.eventName != 'undefined' && data.eventName != null) {
                event_name_conditions = {whereEventName: {'event_name': data.eventName}};
            }

            let room_no_conditions = {whereRoom: {}};
            if (typeof data.room_no != 'undefined') {
                room_no_conditions = {whereRoom: {'room_no': data.room_no}};
            }

            let event_from_date = {whereDate: {}};
            if (typeof data.fromDate != 'undefined' && data.fromDate != '') {
                event_from_date = {whereDate: {'dateTime': moment(data.fromDate).format('YYYY-MM-DD HH:mm:ss')}};
            }

            let event_to_date = {whereDate: {}};
            if (typeof data.fromDate != 'undefined' && data.toDate != '') {
                event_to_date = {whereDate: {'dateTime': moment(data.toDate).format('YYYY-MM-DD HH:mm:ss')}};
            }

            let search_word = {whereSearchWord: {}};
            if (typeof data.searchWord != 'undefined' && data.searchWord != '') {
                search_word = {whereSearchWord: {'search_word': data.searchWord}};
            }

            let room_order = {whereRoomOrder: {}};
            if (typeof data.room != 'undefined' && data.room != '') {
                room_order = {whereRoomOrder: {'room_order_by': data.room}};
            }

            let event_order = {whereEventOrder: {}};
            if (typeof data.event != 'undefined' && data.event != '') {
                event_order = {whereEventOrder: {'event_order_by': data.event}};
            }

            let date_order = {whereDateOrder: {}};
            if (typeof data.date_time != 'undefined' && data.date_time != '') {
                date_order = {whereDateOrder: {'datetime_order_by': data.date_time}};
            }
            let event_conditions = {event_name_conditions, room_no_conditions, event_from_date, event_to_date, search_word, room_order, event_order, date_order}
            //console.log(event_conditions);
            getEventList('zigbee_events as t1', what,
                    event_conditions, data.filter.limit, data.filter.offset, (gcErr, EventList) => {
                if (EventList.length) {
                    logger.log({
                        level: 'info',
                        message: 'Event Record found!'
                    });
                    getEventListHtml(EventList, data.room, data.event, data.date_time, data.filter.page, (htmlErr, eventList) => {
                        if (eventList) {
                            //console.log(eventList);
                            socket.emit('evntListView', {
                                evntListView: eventList,
                                eventListCount: EventList.length
                            });
                        }
                    });
                } else {
                    logger.info('event list not found!');
                    let html = '';
                    html += '<div class="text-center">';
                    html += '<img src="../assets/dist/img/no_content.png"></div>';
                    html += '<p class="text-center m-10 text-muted">Details unavailable.</p>';
                    html += '<p class="text-center m-10 text-muted">';
                    html += 'Record not found. Please contact ';
                    html += 'you administrator</p>';
                    socket.emit('evntListView', {
                        evntListView: html,
                        eventListCount: 0
                    });
                }
            })
        })


        let getEventList = (tableName, what, conditions, limit, offset, callback) => {
            events.getEventLists(tableName, what, conditions, limit, offset, (tErr, tRes) => {
                if (tRes) {
                    callback(null, tRes);
                }
            });
        }

        socket.on('lastRecord', function (data) {
            logger.info('inside of last record socket.on!');
            let what = ['created_on'];
            let conditions = {where: {}};
            getLastCreatedOn('zigbee_events', what,
                    conditions, 'created_on', '1', (gcErr, createdOn) => {
                logger.log({
                    level: 'info',
                    message: 'Getting last record created on!'
                });
                latestCreatedOn = moment(createdOn[0].created_on).format('YYYY-MM-DD HH:mm:ss');
            });
        });

        socket.on('pagination', function (data) {
            logger.log({
                level: 'info',
                message: 'Inside of pagination socket.on!'
            });
            let what = 'event_id';
            let event_name_conditions = {whereEventName: {}};
            if (typeof data.eventName != 'undefined' && data.eventName != null) {
                event_name_conditions = {whereEventName: {'event_name': data.eventName}};
            }

            let room_no_conditions = {whereRoom: {}};
            if (typeof data.room_no != 'undefined') {
                room_no_conditions = {whereRoom: {'room_no': data.room_no}};
            }

            let event_from_date = {whereDate: {}};
            if (typeof data.fromDate != 'undefined' && data.fromDate != '') {
                event_from_date = {whereDate: {'dateTime': moment(data.fromDate).format('YYYY-MM-DD HH:mm:ss')}};
            }

            let event_to_date = {whereDate: {}};
            if (typeof data.fromDate != 'undefined' && data.toDate != '') {
                event_to_date = {whereDate: {'dateTime': moment(data.toDate).format('YYYY-MM-DD HH:mm:ss')}};
            }

            let search_word = {whereSearchWord: {}};
            if (typeof data.searchWord != 'undefined' && data.searchWord != '') {
                search_word = {whereSearchWord: {'search_word': data.searchWord}};
            }
            let event_conditions = {event_name_conditions, room_no_conditions, event_from_date, event_to_date, search_word}

            eventCount('zigbee_events', what, event_conditions, (gcErr, eventCount) => {

                if (eventCount[0].totalRows != 0) {
                    logger.log({
                        level: 'info',
                        message: 'Getting record to make pagination!'
                    });
                    let countArr = {};
                    countArr['perpageLimit'] = data.filter.limit;
                    countArr['page'] = data.filter.page;
                    countArr['initial'] = data.filter.initial;
                    countArr['toPage'] = data.filter.toPage;
                    countArr['eventCount'] = eventCount[0].totalRows;
                    createPaginationHtml(countArr, (htmlErr, pagination) => {
                        if (pagination) {
                            socket.emit('pagination', {
                                pagination: pagination,
                                totalRecord: eventCount[0].totalRows
                            });
                        } else {

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
        let eventCount = (tableName, what, condtion, callback) => {
            events.getEventCounts(tableName, what, condtion, (tErr, tRes) => {
                if (tRes) {
                    callback(null, tRes);
                }
            });
        }

        function createPaginationHtml(data, callback) {
            let eventCount = data.eventCount;
            let totalPage = Math.ceil(data.eventCount / data.perpageLimit);
            var i = 1;
            //console.log(totalPage);
            let paginationHTML = '';
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
            callback(null, paginationHTML);
        }

// paginationDropdown
        socket.on('paginationDropdown', function (data) {
            logger.log({
                level: 'info',
                message: 'Inside of pagination dropdown!'
            });
            let dropDownArr = [10, 25, 50, 100];
            let dropDownHtml = '<p class="text-muted">Showing all';
            dropDownHtml += '<select class="select-wsearch" id="pageinationDRP" style="width: 75px !important">';
            dropDownArr.forEach((item) => {
                dropDownHtml += '<option value="' + item + '">' + item + '</option>';
            });
            dropDownHtml += '</select>';
            dropDownHtml += 'entries</p>';
            socket.emit('paginationDropDown', {
                dropDownHtml: dropDownHtml,
            });
        });
    },
    newEvent: (callback) => {
        getEvent('', (upsErr, upsRes) => {

        })
    }
}

let getEvent = (callback) => {
    //console.log("latestCreatedOnmmmmmmmmmmmmmmmmmmmmmmmm", latestCreatedOn);    
    let what = 'event_id';
    let condition = {byCreatedOn: {latestCreatedOn}};
    if (latestCreatedOn) {
        getLatestEventCount('zigbee_events', what, condition, (gcErr, eventCount) => {
            if (eventCount[0].newRows > 0) {
                logger.log({
                    level: 'info',
                    message: 'Getting new event!'
                });
                sc.emit('getNewEvent', {});
                let what = ['created_on'];
                let conditions = {where: {}};
                getLastCreatedOn('zigbee_events', what,
                        conditions, 'created_on', '1', (gcErr, createdOn) => {
                    logger.log({
                        level: 'info',
                        message: 'Updating latest created on!'
                    });
                    latestCreatedOn = moment(createdOn[0].created_on).format('YYYY-MM-DD HH:mm:ss');
                });
            }

            //console.log("eventCounttttttttttttttttttttttttttttttttttt", eventCount[0].newRows);
        });
    }
}

let getLatestEventCount = (tableName, what, condtion, callback) => {
    events.getLatestEventCount(tableName, what, condtion, (tErr, tRes) => {
        if (tRes) {
            callback(null, tRes);
        }
    });
}

let getLastCreatedOn = (tableName, what, conditions, order_by, limit, callback) => {
    commonMaster.lastRecord(tableName, what, conditions, order_by, limit, (tErr, tRes) => {
        if (tRes) {
            callback(null, tRes);
        }
    });
}

function getEventListHtml(data, room, event, date, page, callback) {
    logger.log({
        level: 'info',
        message: 'Inside of event List preparing datatable!'
    });
    let room_order = '';
    if (room == 'desc') {
        room_order = 'asc';
    } else if (room == 'asc') {
        room_order = 'desc';
    }

    let event_order = '';
    if (event == 'desc') {
        event_order = 'asc';
    } else if (event == 'asc') {
        event_order = 'desc';
    }

    let date_order = '';
    if (date == 'desc') {
        date_order = 'asc';
    } else if (date == 'asc') {
        date_order = 'desc';
    }
    let eventList = '';
    eventList += '<table class="table alternate-color full-width panel dataTable no-footer dtr-inline" id="">';
    eventList += ' <thead>';
    eventList += '  <tr>';
    if (room_order != '') {
        eventList += '    <th class="sorting_' + room_order + ' room" data-room="' + room_order + '">Room No.</th>';
    } else {
        eventList += '    <th class="sorting room" data-room="asc">Room No.</th>';
    }

    if (event_order != '') {
        eventList += '    <th class="sorting_' + event_order + ' event" data-event="' + event_order + '">Event</th>';
    } else {
        eventList += '    <th class="sorting event" data-event="asc">Event</th>';
    }

    if (date_order != '') {
        eventList += '    <th class="sorting_' + date_order + ' event_time" data-event_time="' + date_order + '">Event Occurred Time</th>';
    } else {
        eventList += '    <th class="sorting event_time" data-event_time="asc">Event Occurred Time</th>';
    }

    eventList += '  </tr>';
    eventList += ' </thead>';
    eventList += ' <tbody>';
    data.forEach((item) => {
        eventList += '<tr>';
        eventList += '<td>' + item.number + '</td>';
        eventList += '<td>' + item.event + '</td>';
        eventList += '<td>' + moment(item.created_on).format('LLL') + '</td>';
        eventList += '</tr>';
    });
    eventList += ' </tbody>';
    eventList += '</table>';
    callback(null, eventList);
}

module.exports = eventLog;