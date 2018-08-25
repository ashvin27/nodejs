let hotelDetail = require(__base +
  'components/db-master/hotels.js');
let eventsMaster = require(__base +
  'components/db-master/communicationCenter/events.js');
let eventsRecurringMaster = require(__base +
  'components/db-master/communicationCenter/events-recurring.js');
let eventsGuests = require(__base +
  'components/db-master/communicationCenter/events-guests.js');
let commonMaster = require(__base +
  'components/db-master/communicationCenter/common.js');
let config       = require(__base + 'config');
let inpremiseHostAddress = '';
let cloudServerAddress = '';
let moment     = require('moment');
let Jimp = require("jimp");
let fileSave = require('save-file');

let imageUploadPath = '';
let contentUploadPath = config.projects.name.apiRootPath +
config.projects.name.inpremiseApi+ '/assets/uploads/communication_center/'+
config.hotelProperties.hotelid+'/events/assets/';
let templateUploadPath = config.projects.name.apiRootPath+
config.projects.name.inpremiseApi+ '/assets/uploads/communication_center/'+
config.hotelProperties.hotelid+'/messages/';
let templatePath = '';

let communicationCenter = {
  onConnect: (socket) => {
    socket.on('disconnect', function (response) {});

    let conditions_hotel = {
      where: {
        hotel_id: config.hotelProperties.hotelid,
        is_deleted: 0
      }
    };
    let what_hotel = [];
    getHotel('hotels', what_hotel, conditions_hotel, (hErr, hRes) => {
      if(hRes) {
        cloudServerAddress = hRes[0].ip_address;
        inpremiseHostAddress = hRes[0].ip_address;
        imageUploadPath = config.inpremise.server.protocol + '://' +
        inpremiseHostAddress+'/'+config.projects.name.inpremiseApi+
        '/assets/uploads/communication_center/'+config.hotelProperties.hotelid+
        '/events/assets/';
        templatePath = config.inpremise.server.protocol + '://' +
        inpremiseHostAddress+'/'+config.projects.name.inpremiseApi+
        '/assets/uploads/communication_center/'+config.hotelProperties.hotelid+
        '/messages/';
      }
    });

    /**************************** Start Hotel Events  ***********************/

    /*
     * Get All Recurring Events Response
     * is_recurring can be 0 and 1
     */
    socket.on('getRecurringEvents', function(data){
      let conditions = {
        where: {
          is_recurring: data.isRecurring,
          is_deleted: 0
        }
      };
      let what = [];
      getSelectEvents('v_cmc_events', what, conditions, (evErr, evRes) => {
        if(evRes) {
          getEventsHTML(evRes, (htmlErr, eventListView) => {
            console.log('In get recurring events HTML View.');
            if(eventListView) {
              socket.emit('getRecurringEvents', {
                eventListView: eventListView,
                totalEventCount: evRes.length
              });
            }
          });
        }else{
          socket.emit('getRecurringEvents',
          { 'eventListView':
           '<p data-notifyMessage>'+
           'Currently, there are no "Recurring Events" available.</p>'
          });
        }
      });
    });

    /*
     * Get All Recurring Events Response
     * is_recurring can be 0 and 1
     */
    socket.on('getOneTimeEvents', function(data){
      let what = [];
      let conditions = {
        where: {
          is_recurring: data.isRecurring,
          is_deleted: 0
        }
      };
      getSelectEvents('v_cmc_events', what, conditions, (evErr, evRes) => {
        if(evRes) {
          getEventsHTML(evRes, (htmlErr, eventListView) => {
            console.log('In get one time events HTML View.');
            if(eventListView) {
              socket.emit('getRecurringEvents', {
                eventListView: eventListView,
                totalEventCount: evRes.length
              });
            }
          });
        }else{
          socket.emit('getRecurringEvents',
           { 'eventListView':
           '<p data-notifyMessage>'+
           'Currently, there are no "One Time Events" available.</p>'});
        }
      });
    });

    /*
     * Get All Recurring Events Response
     * is_recurring can be 0 and 1
     */
    socket.on('getAddEventFormView', function(data){
      getAddEventsHtmlView(data, (htmlErr, addEventFormView) => {
        console.log('In get add events HTML View.');
        if(addEventFormView) {
          socket.emit('renderEventsHtmlView', {
            addEventFormView: addEventFormView
          });
        }
      });
    });

    /*
     * Get response of posted data from add events form view
     * and passed into saveAddEventsData function
     */
    socket.on('saveAddEventsView', function(data){
      //console.log("AFTER SAVE EVENT FORM : " + data.dataPacket);
      let objData = JSON.parse(data.dataPacket);
      var repeatsEveryDay = objData.repeatsEveryDay;
      objData['hotel_id'] = config.hotelProperties.hotelid;
      delete objData.repeatsEveryDay;

      insertEvents('cmc_events', objData, (iErr, iRes) => {
        if(iRes){
          if(objData.is_recurring == "1") {
            let dataPacket = [];
            let recurringData = {};
            repeatsEveryDay.forEach((item) => {
              recurringData['cmc_event_id'] = iRes[0],
              recurringData['recurring_days'] = item.recurring_days,
              recurringData['start_time'] = item.start_time,
              recurringData['end_time'] = item.end_time,
              recurringData['hotel_id'] = config.hotelProperties.hotelid,
              recurringData['is_active'] = 1,
              recurringData['created_by'] = 1
              dataPacket.push(recurringData);
              recurringData = {};
            });

            //console.log('FINAL ARRAY INSERT INTO DB : '+
            //JSON.stringify(dataPacket));
            insertRecurringEvents('cmc_events_recurring_mapping',
            dataPacket, (iErr, cmcERRes) => {
              if(cmcERRes) {
                console.log('Events Saved Successfully.');
                socket.emit('saveAddEventsView', { 'res': 1 });
              }
            });
          }else {
            console.log('Events Saved Successfully.');
            socket.emit('saveAddEventsView', { 'res': 1 });
          }
        }
      });
    });

    /*
     * Get response of posted data from add events form view
     * and passed into saveEditEventsData function
     */
    socket.on('saveEditEventsView', function(data){
      //console.log("AFTER SAVE EVENT FORM : " + data.dataPacket);
      let objData = JSON.parse(data.dataPacket);
      let repeatsEveryDay = objData.repeatsEveryDay;
      let eventID = objData.event_id;
      objData['hotel_id'] = config.hotelProperties.hotelid;
      delete objData.repeatsEveryDay;
      let conditions = {
        where: {
          event_id: objData.event_id
        }
      };

      // console.log('SEND JSON FOR UPDATE : '+
      // JSON.stringify('PRINT UPDATE DATA : ' + objData));
      updateEvents('cmc_events', conditions, objData, (iErr, iRes) => {
        if(iRes){
          if(objData.is_recurring == "1") {
            let deleteParam = {
              'cmc_event_id': eventID
            }
            deleteRecurringEvents('cmc_events_recurring_mapping',
            deleteParam, (iErr, dRes) => {
              if(dRes){
                delete objData.event_id;
                let dataPacket = [];
                let recurringData = {};
                repeatsEveryDay.forEach((item) => {
                  recurringData['cmc_event_id'] = eventID,
                  recurringData['recurring_days'] = item.recurring_days,
                  recurringData['start_time'] = item.start_time,
                  recurringData['end_time'] = item.end_time,
                  recurringData['hotel_id'] = config.hotelProperties.hotelid,
                  recurringData['is_active'] = 1,
                  recurringData['created_by'] = 1
                  dataPacket.push(recurringData);
                  recurringData = {};
                });

                // console.log('FINAL ARRAY INSERT INTO DB : '+
                // JSON.stringify(dataPacket));
                insertRecurringEvents('cmc_events_recurring_mapping',
                dataPacket, (iErr, cmcERRes) => {
                  if(cmcERRes) {
                    console.log('Events Updated Successfully.');
                    socket.emit('saveEditEventsView', { 'res': 1 });
                  }
                });
              }
            });
          }else {
    				console.log('Events Updated Successfully.');
    				socket.emit('saveEditEventsView', { 'res': 1 });
    			}
        }
      });
    });

    /*
     * Get response of delete events id from posted data
     */
    socket.on('deleteEvents', function(data){
      let updateParam = {
        is_deleted: 1
      };
      let conditions = {
        where: {
          event_id: data.eventId
        }
      };

      deleteEvents('cmc_events', conditions, updateParam, (iErr, iRes) => {
        if(iRes){
          console.log('Events Deleted Successfully.');
            socket.emit('deleteEvents', { 'res': data.eventId });
        }
      });
    });

    /*
     * Get response of render events detail on events calendar
     */
    socket.on('editEvents', function(data){
      let conditions = {
        where: {
          event_id: data.eventId
        }
      };
      let what = [];
      getSelectEvents('cmc_events', what, conditions, (evErr, evRes) => {
        if(evRes) {
          let editEventsHtmlView = showEditEventsHtmlView(evRes);
          if(eventsDetailOnCalendar) {
              socket.emit('renderEditEventHtmlView', {
                editEventsView: editEventsView
              });
          }

        }else{
          socket.emit('renderEditEventHtmlView',
           { 'editEventsView':
           '<p data-notifyMessage>'+
           'Currently, there are no "Events" available.</p>'});
        }
      });
    });

    /*
     * Save Events Image
     */
   socket.on('saveImage', (data) => {
      uploadFilePath = contentUploadPath + data.filename;
      fileSave(data.imageData, uploadFilePath , (err, data) => {
        // Resize Image
        Jimp.read(uploadFilePath, function (err, response) {
          if (err) throw err;
              response.resize(770, 400)            // resize
                 .write(uploadFilePath); // save
          });
      })

   });

    /**************************** End Hotel Events **************************/

    /*
     * Upload Image Files
     */
   socket.on('uploadFile', (data) => {
     if(data.moduleName == "messages") {
       uploadFilePath = templateUploadPath + data.appendPath + '/' + data.filename;
       uploadContent = data.data;
     }

      console.log("Content Upload File Path : "+uploadFilePath);
      fileSave(uploadContent, uploadFilePath , (err, data) => {

      })

   });

    /************************ Start Events Calendar *************************/

    /*
     * Get response of rending events calendar
     */
    socket.on('getEventsCalendar', function(data){
      let conditions = {
        where: {
          is_deleted: 0
        }
      };
      let what = [];
      getSelectEvents('v_cmc_events', what, conditions, (evErr, evRes) => {
        if(evRes) {
          getEventsCalendarHtmlView(evRes, data.month, data.year,
            (htmlErr, eventsCalendarHtmlView) => {
            if(eventsCalendarHtmlView) {
              socket.emit('renderEventsCalendarHtmlView', {
                eventsCalendarHtmlView: eventsCalendarHtmlView
              });
            }
          });
        }else{
          socket.emit('renderEventsCalendarHtmlView',
           { 'eventsCalendarHtmlView':
           '<p data-notifyMessage>'+
           'Currently, there are no "Events" available.</p>'});
        }
      });
    });

    /*
     * Get response of render events detail on events calendar
     */
    socket.on('renderViewEventsOnCalendar', function(data){
      let conditions = {
        where: {
          event_id: data.event_id
        }
      };
      let what = [];
      getSelectEvents('v_cmc_events', what, conditions, (evErr, evRes) => {
        if(evRes) {
          //console.log('RESULT SET : '+ evRes);
          renderEventsDetailOnCalendar(evRes, data,
            (htmlErr, eventsDetailOnCalendar) => {
            if(eventsDetailOnCalendar) {
              socket.emit('renderViewEventsOnCalendar', {
                eventsDetailOnCalendar: eventsDetailOnCalendar,
                referrer: data.referrer
              });
            }
          });
        }else{
          //console.log("ELSE ALL EVENTS DETAIL: " + evRes);
          socket.emit('renderViewEventsOnCalendar',
           { 'eventsDetailOnCalendar':
           '<p data-notifyMessage>'+
           'Currently, there are no "Events Detail" available.</p>'});
        }
      });
    });

    /************************ End Events Calendar *************************/
  },

  /*
   * REST API for get all events called from outside
   */
  events: (pmsi_guest_id,user_id, callback) => {
    let allEvents = {};
    let events = [];

    let conditions_hotel = {
      where: {
        hotel_id: config.hotelProperties.hotelid,
        is_deleted: 0
      }
    };
    let what_hotel = [];
    getHotel('hotels', what_hotel, conditions_hotel, (hErr, hRes) => {
      if(hRes) {
        cloudServerAddress = hRes[0].ip_address;
        inpremiseHostAddress = hRes[0].ip_address;
        imageUploadPath = config.inpremise.server.protocol + '://' +
        inpremiseHostAddress+'/'+config.projects.name.inpremiseApi+
        '/assets/uploads/communication_center/'+config.hotelProperties.hotelid+
        '/events/assets/';
        templatePath = config.inpremise.server.protocol + '://' +
        inpremiseHostAddress+'/'+config.projects.name.inpremiseApi+
        '/assets/uploads/communication_center/'+config.hotelProperties.hotelid+
        '/messages/';
      }
    });

    if(pmsi_guest_id == "") {
      // Event Data
      let conditions = {
        where: {
          is_deleted: 0
        }
      };
      let what = [];
      getSelectEvents('v_cmc_events', what, conditions, (evErr, evRes) => {
        if(evRes) {
             var i =0;     
          getselectUserintrest=()=>{
        
              let condition = {
                where: {
                  pmsi_guest_id : user_id,
                  event_id:evRes[i].event_id
                }
              };
              let whats = [];
            getSelectEvents('cmc_events_guests', whats, condition, (intrestErr, intrestRes) => {
               if(intrestRes.length>0) {
                  evRes[i].intrested_user_status= true;
                  if(i<evRes.length-1){
                          i=i+1;
                          getselectUserintrest();
                  }else{
                   
                    composeEventsNewJSON(evRes,user_id, (iErr, eventsJSON) => {
                      if(eventsJSON) {
                        allEvents['events'] = eventsJSON;
                        events.push(allEvents);
                        callback(null, events);
                      }
                    });
                  }
                }else{  
                  evRes[i].intrested_user_status= false;
                   if(i<evRes.length-1){

                    i=i+1;
                  
                    getselectUserintrest();
                  }else{
                    
                    composeEventsNewJSON(evRes,user_id, (iErr, eventsJSON) => {
                      if(eventsJSON) {
                        allEvents['events'] = eventsJSON;
                        events.push(allEvents);
                        callback(null, events);
                      }
                    });
                  }
                }
              });
          }
          getselectUserintrest();           
        } else {
          callback(evErr, null);
        }
      });
    }else {
      // Ready data for My Calendar
      let cal_conditions = {
        where: {
          pmsi_guest_id: pmsi_guest_id
        }
      };
      let cal_what = [];
      getSelectEvents('v_cmc_events_guests', cal_what, cal_conditions,
      (cErr, cRes) => {
        if(cRes) {
          console.log("--------------------------------",cRes)
          composeCalendarJSON(cRes, (cjErr, calendarJSON) => {
            if(calendarJSON) {
              allEvents['my_calendar'] = calendarJSON;
              events.push(allEvents);
              callback(null, events);
            }
          });
        } else {
          callback(cErr, null);
        }
      });
    }
  },

  insertInterestedGuestNew: (data, callback) => {
    //let objData = JSON.parse(data);
    // Get Keys/PMSI guest Id
    let conditions_key = {
      where: {
        number: data.key_id
      }
    };
    let what_key = [];
    let conditionEvent ={
      where: {
        event_id: data.event_id,
        is_deleted:0
      }
    };

    getSelectEvents('cmc_events', what_key, conditionEvent, (eventErr, eventRes) => {
      if(eventRes.length>0){
        fetchUniqueId('keys', what_key, conditions_key, (kErr, kRes) => {
          if(kRes) {
            data.key_id = kRes[0].key_id;
            console.log('FETCH KEY ID : '+JSON.stringify(kRes));
            let conditions_pmsi = {
              where: {
                guest_id: data.pmsi_guest_id,
                key_id: kRes[0].key_id,
                guest_type: 'primary',
                is_deleted:0,
                hotel_id: 1
              }
            };
            let what_pmsi = [];
            fetchUniqueId('pmsi_guests', what_pmsi, conditions_pmsi, (pErr, pRes) => {
              if(pRes) {
                 data.pmsi_guest_id = pRes[0].pmsi_guest_id;
                let condition = {
                  where: {
                    pmsi_guest_id: data.pmsi_guest_id ,
                    key_id: data.key_id,
                    event_id:data.event_id
                  }
                };
                let whats = [];
                  getSelectEvents('cmc_events_guests', whats, condition, (intrestErr, intrestRes) => {
                  if(intrestRes.length>0){
                    callback(null,0);
                  }else{
                    insertEventsGuests('cmc_events_guests', data, (iErr, iRes) => {
                    
                      if (iRes) {
                        iRes.status=1
                        callback(null, iRes);
                      }else {
                        callback(iErr, null);
                      }
                    });
                  }
               });
              }
            })
          }
        })
      }else{
        callback(null,1);
      }
    })  
  },
    // events: (pmsi_guest_id, callback) => {
    //   let allEvents = {};
    //   let events = [];

    //   let conditions_hotel = {
    //     where: {
    //       hotel_id: config.hotelProperties.hotelid,
    //       is_deleted: 0
    //     }
    //   };
    //   let what_hotel = [];
    //   getHotel('hotels', what_hotel, conditions_hotel, (hErr, hRes) => {
    //     if(hRes) {
    //       cloudServerAddress = hRes[0].ip_address;
    //       inpremiseHostAddress = hRes[0].ip_address;
    //       imageUploadPath = config.inpremise.server.protocol + '://' +
    //       inpremiseHostAddress+'/'+config.projects.name.inpremiseApi+
    //       '/assets/uploads/communication_center/'+config.hotelProperties.hotelid+
    //       '/events/assets/';
    //       templatePath = config.inpremise.server.protocol + '://' +
    //       inpremiseHostAddress+'/'+config.projects.name.inpremiseApi+
    //       '/assets/uploads/communication_center/'+config.hotelProperties.hotelid+
    //       '/messages/';
    //     }
    //   });

    //   if(pmsi_guest_id == "") {
    //     // Event Data
    //     let conditions = {
    //       where: {
    //         is_deleted: 0
    //       }
    //     };
    //     let what = [];
    //     getSelectEvents('v_cmc_events', what, conditions, (evErr, evRes) => {
    //       if(evRes) {
    //         composeEventsJSON(evRes, (iErr, eventsJSON) => {
    //           if(eventsJSON) {
    //             allEvents['events'] = eventsJSON;
    //             events.push(allEvents);
    //             callback(null, events);
    //           }
    //         });
    //       } else {
    //         callback(evErr, null);
    //       }
    //     });
    //   }else {
    //     // Ready data for My Calendar
    //     let cal_conditions = {
    //       where: {
    //         pmsi_guest_id: pmsi_guest_id
    //       }
    //     };
    //     let cal_what = [];
    //     getSelectEvents('v_cmc_events_guests', cal_what, cal_conditions,
    //     (cErr, cRes) => {
    //       if(cRes) {
    //         composeCalendarJSON(cRes, (cjErr, calendarJSON) => {
    //           if(calendarJSON) {
    //             allEvents['my_calendar'] = calendarJSON;
    //             events.push(allEvents);
    //             callback(null, events);
    //           }
    //         });
    //       } else {
    //         callback(cErr, null);
    //       }
    //     });
    //   }
    // }
};

/*
 * Compose JSON of events for API response
 */
let composeEventsNewJSON = (data,user_id, callback) => {
  let eventsJSON = {};
  let todayJSON = {};
  let datetimeJSON = {};
  let timeJSON = {};
  let events = [];
  let today = [];
  let datetime = [];
  let event_metadata = [];
  eventsJSON['today'] = [];
  eventsJSON['tomorrow'] = [];
  eventsJSON['later'] = [];
  
  data.forEach((item) =>{
    var time = [];
    todayJSON['event_id'] = item.event_id;
    todayJSON['title'] = item.event_title;
    todayJSON['location'] = item.event_location;
    if(item.event_photos == null){
      todayJSON['image'] = imageUploadPath+'event.jpg';
    }else {
      todayJSON['image'] = imageUploadPath + item.event_photos;
    }

    if(item.guest_interested) {
      let interested_guest_list = item.guest_interested.split('#');
      todayJSON['interested_guest_count'] = interested_guest_list.length;
    }else {
      todayJSON['interested_guest_count'] = 0;
    }

    todayJSON['description'] = item.description;
    todayJSON['event_start_date'] = moment(item.event_start_date,
      "M/D/YYYY H:mm").unix();
    todayJSON['event_end_date'] = moment(item.event_until_date,
       "M/D/YYYY H:mm").unix();
    todayJSON['event_metadata'] = event_metadata;
    // item.event_start_date= moment(item.event_start_date, 'YYYY-MM-DD').format('YYYY-MM-DD HH:mm:ss');
    // item.event_until_date= moment(item.event_until_date, 'YYYY-MM-DD').format('YYYY-MM-DD HH:mm:ss');
    // Start Date Time Array
    if(item.is_recurring == 1) {
      let getFinalDate = '';
      let eventStartDate = item.event_start_date;
      let eventEndDate = item.event_until_date;
      let compStartDate = new Date(eventStartDate);
      let compEndDate = new Date(eventEndDate);
      let startDateUTC = new Date(compStartDate);
      let day = 60 * 60 * 24 * 1000;
      let totalDays = (compEndDate - compStartDate)/1000/60/60/24;
      let dayNo = '';
      let recTime = item.recurring_time.split("#");
      for (let rd = 0; rd <= totalDays; rd++)
      {
        if(rd != 0) {
          getFinalDate = new Date(startDateUTC.getTime() + rd * day);
          dayNo = getDayNoFromDate(convert(getFinalDate));
          datetimeJSON['date'] = moment(getFinalDate, "M/D/YYYY H:mm").unix();
        } else {
          getFinalDate = eventStartDate;
          dayNo = getDayNoFromDate(eventStartDate);
          datetimeJSON['date'] = moment(getFinalDate, "M/D/YYYY H:mm").unix();
        }
        for(let rt=0; rt<recTime.length;rt++) {
         
          let getRecDayStartEndTimeArr = recTime[rt].split(",");
         if(dayNo == getRecDayStartEndTimeArr[0]) {
            timeJSON.recurring_map_id = parseInt(getRecDayStartEndTimeArr[3]);
            timeJSON['start_time ']= moment(getRecDayStartEndTimeArr[1],
              "H:mm:ss").unix();
            timeJSON['end_time ']= moment(getRecDayStartEndTimeArr[2],
              "H:mm:ss").unix();
              timeJSON['intrested_user_status'] = item.intrested_user_status;
              time.push(timeJSON);
           
            timeJSON = {};
          }
        }
        datetimeJSON.time = time;
        if(datetimeJSON.time.length>0){
          datetime.push(datetimeJSON);
          time = [];
          datetimeJSON = {};
        }
      }
      todayJSON['datetime'] = datetime;
       datetime = [];

      var startDate1 = moment(item.event_start_date, 'YYYY-MM-DD'),
          endDate1   = moment(new Date(), 'YYYY-MM-DD').format('YYYY-MM-DD');

     var  result= startDate1.diff(endDate1, "days") ,
          startDate2 = moment(item.event_until_date, 'YYYY-MM-DD'),
          resultUntil =  startDate2.diff(endDate1, "days") ;
          if(startDate1.isSame(endDate1, 'day')){
            eventsJSON['today'].push(todayJSON)
           }
           else{
             if(resultUntil>=0 && result<0 ){
              eventsJSON['today'].push(todayJSON)
             }
           }
          if(result<=0){
              if(resultUntil==1 || resultUntil>=1) {
                eventsJSON['tomorrow'].push(todayJSON)
              }
              if(resultUntil>=2){
                eventsJSON['later'].push(todayJSON)
              }
                todayJSON = {};
          }else{
              if(result>=1 ||  result==1 ){
              eventsJSON['tomorrow'].push(todayJSON)
            }
              if(resultUntil>=2){
                eventsJSON['later'].push(todayJSON)
            }
            if(result>=2){
              eventsJSON['later'].push(todayJSON)
            }
            todayJSON = {};
          }
    }
      if(item.is_recurring == 0) {
       datetimeJSON['date'] = moment(item.event_start_date,
        "M/D/YYYY H:mm").unix();
      timeJSON['recurring_map_id'] = parseInt(item.event_id);
      timeJSON['start_time'] = moment(item.start_time, "H:mm:ss").unix();
      timeJSON['end_time'] = moment(item.end_time, "H:mm:ss").unix();
      timeJSON['intrested_user_status'] = item.intrested_user_status;
      time.push(timeJSON);
      timeJSON = {};


      datetimeJSON['time'] = time;
      time = [];
      datetime.push(datetimeJSON);
      datetimeJSON = {};
      todayJSON['datetime'] = datetime;
      datetime = [];
  var startDate1 = moment(item.event_start_date, 'YYYY-MM-DD'),
          endDate1   = moment(new Date(), 'YYYY-MM-DD').format('YYYY-MM-DD');
      if(startDate1.isSame(endDate1, 'day')){
        eventsJSON['today'].push(todayJSON)
        todayJSON = {};
    }
    var  result= startDate1.diff(endDate1, "days") ;
        if(result==1){
          eventsJSON['tomorrow'].push(todayJSON)
          todayJSON = {};
        }
        if(result>=1){
          eventsJSON['later'].push(todayJSON)
          todayJSON = {};
        }
          
    }
    
  });
    events.push(eventsJSON);
    callback('null', events);
};


/*
 * Compose JSON of events for API response
 */
let composeEventsJSON = (data, callback) => {
  let eventsJSON = {};
  let todayJSON = {};
  let datetimeJSON = {};
  let timeJSON = {};
  let events = [];
  let today = [];
  let datetime = [];
  let time = [];
  let event_metadata = [];
  // let event_metadata = [{
  //    "asset_type": "pdf",
  //    "title": "Show PDF",
  //    "secondary_title": "Value Title",
  //    "asset_link": "PDF URL"
  // },{
  //    "asset_type": "video",
  //    "title": "Show Video",
  //    "secondary_title": "Value Title",
  //    "asset_link": "PDF URL"
  // }];

  data.forEach((item) =>{
    todayJSON['event_id'] = item.event_id;
    todayJSON['title'] = item.event_title;
    todayJSON['location'] = item.event_location;
    if(item.event_photos == null){
      todayJSON['image'] = imageUploadPath+'event.jpg';
    }else {
      todayJSON['image'] = imageUploadPath + item.event_photos;
    }

    if(item.guest_interested) {
      let interested_guest_list = item.guest_interested.split('#');
      todayJSON['interested_guest_count'] = interested_guest_list.length;
    }else {
      todayJSON['interested_guest_count'] = 0;
    }

    todayJSON['description'] = item.description;
    todayJSON['event_start_date'] = moment(item.event_start_date,
      "M/D/YYYY H:mm").unix();
    todayJSON['event_end_date'] = moment(item.event_until_date,
       "M/D/YYYY H:mm").unix();
    todayJSON['event_metadata'] = event_metadata;

    // Start Date Time Array
    if(item.is_recurring == "1") {
      let getFinalDate = '';
      let eventStartDate = item.event_start_date;
      let eventEndDate = item.event_until_date;
      let compStartDate = new Date(eventStartDate);
      let compEndDate = new Date(eventEndDate);
      let startDateUTC = new Date(compStartDate);
      let day = 60 * 60 * 24 * 1000;
      let totalDays = (compEndDate - compStartDate)/1000/60/60/24;
      let dayNo = '';
      let recTime = item.recurring_time.split("#");

      for (let rd = 0; rd <= totalDays; rd++)
      {
        if(rd != 0) {
          getFinalDate = new Date(startDateUTC.getTime() + rd * day);
          dayNo = getDayNoFromDate(convert(getFinalDate));
          datetimeJSON['date'] = moment(getFinalDate, "M/D/YYYY H:mm").unix();
        } else {
          getFinalDate = eventStartDate;
          dayNo = getDayNoFromDate(eventStartDate);
          datetimeJSON['date'] = moment(getFinalDate, "M/D/YYYY H:mm").unix();
        }

        for(let rt=0; rt<recTime.length;rt++) {
	        let getRecDayStartEndTimeArr = recTime[rt].split(",");
          if(dayNo == getRecDayStartEndTimeArr[0]) {
            timeJSON['recurring_map_id'] = getRecDayStartEndTimeArr[3];
            timeJSON['start_time'] = moment(getRecDayStartEndTimeArr[1],
              "H:mm:ss").unix();
            timeJSON['end_time'] = moment(getRecDayStartEndTimeArr[2],
              "H:mm:ss").unix();
            time.push(timeJSON);
            timeJSON = {};
          }
        }

        datetimeJSON['time'] = time;
        time = [];

        datetime.push(datetimeJSON);
        datetimeJSON = {};
      }

      todayJSON['datetime'] = datetime;
      datetime = [];
    }else {
      datetimeJSON['date'] = moment(item.event_start_date,
        "M/D/YYYY H:mm").unix();
      timeJSON['recurring_map_id'] = item.event_id;
      //timeJSON['start_time'] = item.start_time;
      timeJSON['start_time'] = moment(item.start_time, "H:mm:ss").unix();
      timeJSON['end_time'] = moment(item.end_time, "H:mm:ss").unix();
      time.push(timeJSON);
      timeJSON = {};


      datetimeJSON['time'] = time;
      time = [];
      // datetimeJSON['date'] = item.event_start_date;
      datetime.push(datetimeJSON);
      datetimeJSON = {};
      todayJSON['datetime'] = datetime;
      datetime = [];
    }
    // End Date Time Array

    today.push(todayJSON);
    todayJSON = {};

  });

  eventsJSON['today'] = today;
  eventsJSON['tomorrow'] = today;
  eventsJSON['later'] = today;
  events.push(eventsJSON);

  callback('null', events);
};




/*
 * Compose JSON of My Calendar for API response
 */
let composeCalendarJSON = (data, callback) => {
  let myCalendarJSON = {};
  let myCalendar = [];
  let datetimeJSON = {};
  let timeJSON = {};
  let datetime = [];
  let time = [];
  let event_metadata = [];
  data.forEach((item) =>{
    myCalendarJSON['event_id'] = item.event_id;
    myCalendarJSON['title'] = item.event_title;
    myCalendarJSON['type'] = 'event';
    myCalendarJSON['location'] = item.event_location;
    myCalendarJSON['image'] = imageUploadPath + item.event_photos;
    myCalendarJSON['description'] = item.description;
    myCalendarJSON['event_start_date'] = moment(item.event_start_date,
      "M/D/YYYY H:mm").unix();
    myCalendarJSON['event_end_date'] = moment(item.event_until_date,
      "M/D/YYYY H:mm").unix();
    myCalendarJSON['event_metadata'] = event_metadata;
    datetimeJSON['date'] = moment(item.event_start_date, "M/D/YYYY H:mm").unix();
    timeJSON['recurring_map_id'] = item.recurring_map_id;
    timeJSON['start_time'] = moment(item.start_time, "H:mm:ss").unix();
    timeJSON['end_time'] = moment(item.start_time, "H:mm:ss").unix();
    time.push(timeJSON);
    timeJSON = {};
    datetimeJSON['time'] = time;
    time = [];
    datetime.push(datetimeJSON);
    datetimeJSON = {};
    myCalendarJSON['datetime'] = datetime;
    datetime = [];
    myCalendar.push(myCalendarJSON);
    myCalendarJSON = {};
  });

  callback('null', myCalendar);
};

/*
 * Get Hotel Details
 */
let getHotel = (tableName, what, conditions, callback) => {
  hotelDetail.select(tableName, what, conditions, (iErr, iRes) => {
    if (iRes) {
      callback(null, iRes);
    }
  });
}

/*
 * Get All Events data from model and send for create HTML
 */
let fetchUniqueId = (tableName, what, conditions, callback) => {
  eventsMaster.select(tableName, what, conditions, (iErr, iRes) => {
    if (iRes) {
      callback(null, iRes);
    }
  });
}

/*
 * Get All Events data from model and send for create HTML
 */
let getSelectEvents = (tableName, what, conditions, callback) => {
  eventsMaster.select(tableName, what, conditions, (iErr, iRes) => {
    if (iRes) {
      callback(null, iRes);
    }
  });
}

/*
 * Insert data into event table
 * If events type is recurring then
 * data must be insert into cmc_events_recurring_mapping table
 */
 let insertEvents = (tableName, insertParam, callback) => {
    eventsMaster.insert(tableName, insertParam, (iErr, iRes) => {
      if (iRes) {
        callback(null, iRes);
      }
    });
 }

 /*
  * Insert data into event table
  * If events type is recurring then
  * data must be insert into cmc_events_recurring_mapping table
  */
  let insertEventsGuests = (tableName, insertParam, callback) => {
     eventsGuests.insert(tableName, insertParam, (iErr, iRes) => {
       if (iRes) {
         callback(null, iRes);
       }
     });
  }

 /*
  * Get All Recurring Events data from model JOIN QUERY
  */
 let getSelectRecEvents = (callback) => {
   eventsMaster.getSelectRecEvents((iErr, iRes) => {
     if (iRes) {
       callback(null, iRes);
     }
   });
 }

 /*
  * Get All Events data from model and send for create HTML
  */
 let getSelectRecurringEvents = (tableName, what, conditions, callback) => {
   eventsRecurringMaster.select(tableName, what, conditions, (iErr, iRes) => {
     if (iRes) {
       callback(null, iRes);
     }
   });
 }

 /*
  * Insert data into events recurring table
  * If events type is recurring then
  * data must be insert into cmc_events_recurring_mapping table
  */
 let insertRecurringEvents = (tableName, insertParam, callback) => {
    eventsRecurringMaster.insert(tableName, insertParam, (iErr, iRes) => {
      if (iRes) {
        callback(null, iRes);
      }
    });
 }

 /*
  * Delete data from event table
  * If events type is recurring then
  * data must be deleted from cmc_events_recurring_mapping table
  */
 let deletePEvents = (tableName, deleteParam, callback) => {
   eventsMaster.deleteP(tableName, deleteParam, (iErr, iRes) => {
     if(iRes) {
       callback(null, iRes);
     }
   });
 }

 /*
  * Parmanent Delete data from recurring table
  * If events type is recurring then
  * data must be deleted from cmc_events_recurring_mapping table
  */
 let deleteRecurringEvents = (tableName, deleteParam, callback) => {
   eventsRecurringMaster.deleteP(tableName, deleteParam, (iErr, iRes) => {
     if(iRes) {
       callback(null, iRes);
     }
   });
 }

 /*
  * Delete data from event table
  * If events type is recurring then
  * data must be deleted from cmc_events_recurring_mapping table
  */
 let deleteEvents = (tableName, conditions, updateParam, callback) => {
   eventsMaster.delete(tableName, conditions, updateParam, (iErr, iRes) => {
     if(iRes) {
       callback(null, iRes);
     }
   });
 }

 /*
  * Update data from event table
  * If events type is recurring then
  * data must be deleted from cmc_events_recurring_mapping table
  */
 let updateEvents = (tableName, conditions, updateParam, callback) => {
   eventsMaster.update(tableName, conditions, updateParam, (iErr, iRes) => {
     if(iRes) {
       callback(null, iRes);
     }
   });
 }

 /*
  * Update data from event table
  * If events type is recurring then
  * data must be deleted from cmc_events_recurring_mapping table
  */
 let updateRecurringEvents = (tableName, conditions, updateParam, callback) => {
   eventsRecurringMaster.update(tableName, conditions, updateParam,
     (iErr, iRes) => {
     if(iRes) {
       callback(null, iRes);
     }
   });
 }

/*
 * Render HTML View of All Events fetched from cms_events
 */
let getEventsHTML = (data, callback) => {
  var eventListView = '';
  var active = '';
  //eventListView += '<div class="tab-pane" id="solid-rounded-tab2">';
  //eventListView += '<div class="dv-thumb-section fadeInUp animated eventSection">';
  eventListView += '<div id="sortable-ird-category" class="main-sort-div popover-arrow eventWrapTime">';
  data.forEach((item) =>{

    eventListView += '<div class="col-lg-3 col-sm-6 col-md-5thumb single-category-box" data-catName="' + item.event_title.toLowerCase() + '" id="event-' + item.event_id + '">';
    eventListView += '<div class="thumbnail thumb-view">';
    if(item.event_photos == null) {
      eventListView += '<div class="thumb"> <img src="'+imageUploadPath+'event.jpg" alt=""> </div>';
    }else {
      eventListView += '<div class="thumb"> <img src="' + imageUploadPath + item.event_photos + '" alt=""> </div>';
    }
    eventListView += '<div class="thumb-footer p-15 row">';
    eventListView += '<div class="col-md-12 col-xs-9">';
    eventListView += '<h5 class="no-margin truncate thumbTitle">' + item.event_title + '</h5>';
    eventListView += '</div>';
    eventListView += '<div class="col-md-12">';
    eventListView += '<ul class="list-inline eventTime-ul">';
    // Day Name of Event Start
    let eventsStartDate = convert(item.event_start_date);
    let compareEventsStartDate = new Date(eventsStartDate);
    let eventsEndDate = convert(item.event_until_date);
    let comapreEventsEndDate = new Date(eventsEndDate);

    let popoverStartTime = convertTimeFrom24To12(item.start_time).split(" ");
    let popoverEndTime = convertTimeFrom24To12(item.end_time).split(" ");
    let popoverRecStartTime = '';
    let popoverRecEndTime = '';

    if(item.is_recurring == "1") {
      let recDays = item.recurring_days.split(",");
      let recTime = item.recurring_time.split("#");
      for(let r=0; r<recDays.length; r++) {
        eventListView += '<li class="event-popover-section">';
        eventListView += '<a href="javascript:void(0);" class="popover-detail-main" rel="popover" data-original-title="" title="">' + getDayNameFromNumber(recDays[r], 'single') + '</a>';

        eventListView += '<div class="detail-popover hide">';
        eventListView += '<div class="arrow-div"></div>';
        eventListView += '<h3 class="popover-title" style="display: none;"></h3>';
        eventListView += '<div class="popover-content">';
        eventListView += '<h6 class="mt-0 text-center">Repeats Every '+getDayNameFromNumber(recDays[r], 'full')+'</h6>';
        eventListView += '<hr class="border-class-dash">';
        eventListView += '<div class="row">';
        eventListView += '<div class="col-md-6 text-left">Start Date</div>';
        eventListView += '<div class="col-md-6 text-right">'+convert(item.event_start_date)+'</div>';
        eventListView += '</div>';
        eventListView += '<div class="row">';
        eventListView += '<div class="col-md-6 text-left">End Date</div>';
        eventListView += '<div class="col-md-6 text-right">'+convert(item.event_until_date)+'</div>';
        eventListView += '</div>';
        eventListView += '<div class="row">';
        eventListView += '<div class="col-md-3 text-left">Time</div>';
        eventListView += '<div class="col-md-9 text-right">';
        for(let rt=0; rt<recTime.length;rt++) {
          let getRecDayStartEndTimeArr = recTime[rt].split(",");
            if(recDays[r] == getRecDayStartEndTimeArr[0]) {
            popoverRecStartTime = convertTimeFrom24To12(getRecDayStartEndTimeArr[1]).split(" ");
            popoverRecEndTime = convertTimeFrom24To12(getRecDayStartEndTimeArr[2]).split(" ");
            if(popoverRecStartTime[1] == popoverRecEndTime[1]) {
              eventListView += popoverRecStartTime[0] + ' - ' + popoverRecEndTime[0] + ' ' + popoverRecStartTime[1] +'</br>';
            }else{
              eventListView += convertTimeFrom24To12(getRecDayStartEndTimeArr[1]) + ' - ' + convertTimeFrom24To12(getRecDayStartEndTimeArr[2]) + '</br>';
            }
          }
        }
        eventListView += '</div>';
        eventListView += '</div>';
        eventListView += '</div>';
        eventListView += '</div>';

        // eventListView += '<div class="detail-popover hide " id="popover-wrap">';
        // eventListView += '<h5 class="mt-0 text-center">Repeats Every '+getDayNameFromNumber(recDays[r], 'full')+'</h5>';
        // eventListView += '<hr class="border-class-dash">';
        // eventListView += '<div class="row">';
        // eventListView += '<div class="col-md-6 text-left">Start Date</div>';
        // eventListView += '<div class="col-md-6 text-right">'+convert(item.event_start_date)+'</div>';
        // eventListView += '</div>';
        // eventListView += '<div class="row">';
        // eventListView += '<div class="col-md-6 text-left">End Date</div>';
        // eventListView += '<div class="col-md-6 text-right">'+convert(item.event_until_date)+'</div>';
        // eventListView += '</div>';
        // eventListView += '<div class="row">';
        // eventListView += '<div class="col-md-3 text-left">Time</div>';
        //
        // // 9:00 AM to 10:00 AM - 1,07:00:00,09:00:00#,1,13:00:00,14:00:00#,5,02:00:00,06:00:00#,5,16:00:00,20:00:00#
        // eventListView += '<div class="col-md-9 text-right">';
        // for(let rt=0; rt<recTime.length;rt++) {
        //   let getRecDayStartEndTimeArr = recTime[rt].split(",");
        //   if(recDays[r] == getRecDayStartEndTimeArr[0]) {
        //     popoverRecStartTime = convertTimeFrom24To12(getRecDayStartEndTimeArr[1]).split(" ");
        //     popoverRecEndTime = convertTimeFrom24To12(getRecDayStartEndTimeArr[2]).split(" ");
        //     if(popoverRecStartTime[1] == popoverRecEndTime[1]) {
        //       eventListView += popoverRecStartTime[0] + ' - ' + popoverRecEndTime[0] + ' ' + popoverRecStartTime[1] +'</br>';
        //     }else{
        //       eventListView += convertTimeFrom24To12(getRecDayStartEndTimeArr[1]) + ' - ' + convertTimeFrom24To12(getRecDayStartEndTimeArr[2]) + '</br>';
        //     }
        //   }
        // }
        // eventListView += '</div>';
        // // Time Div End Here
        //
        // eventListView += '</div>';
        // eventListView += '</div>';

        eventListView += '</li>';
      }

    }else {
      if(compareEventsStartDate <= comapreEventsEndDate) {
        //console.log('COMPARE EVENT START DATE : '+compareEventsStartDate+'----------------------------- COMPARE EVENT END DATE : '+comapreEventsEndDate + '+++++++ : '+item.event_title);
        eventListView += '<li class="event-popover-section">';
        eventListView += '<a href="javascript:void(0);" class="popover-detail-main" rel="popover" data-original-title="" title="">' + getDayNameFromDate(compareEventsStartDate, 'single') + '</a>';

        eventListView += '<div class="detail-popover hide">';
        eventListView += '<div class="arrow-div"></div>';
        eventListView += '<h3 class="popover-title" style="display: none;"></h3>';
        eventListView += '<div class="popover-content">';
        eventListView += '<h6 class="mt-0 text-center">Repeats Every '+getDayNameFromDate(compareEventsStartDate, 'full')+'</h6>';
        eventListView += '<hr class="border-class-dash">';
        eventListView += '<div class="row">';
        eventListView += '<div class="col-md-6 text-left">Start Date</div>';
        eventListView += '<div class="col-md-6 text-right">'+convert(item.event_start_date)+'</div>';
        eventListView += '</div>';
        eventListView += '<div class="row">';
        eventListView += '<div class="col-md-3 text-left">Time</div>';
        if(popoverStartTime[1] == popoverEndTime[1])
        {
          eventListView += '<div class="col-md-9 text-right">'+popoverStartTime[0]+' - '+ popoverEndTime[0] + ' ' + popoverStartTime[1] +'</div>';
        }else {
          eventListView += '<div class="col-md-9 text-right">'+convertTimeFrom24To12(item.start_time)+' - '+ convertTimeFrom24To12(item.end_time) +'</div>';
        }
        eventListView += '</div>';
        eventListView += '</div>';
        eventListView += '</div>';

        // eventListView += '<div class="detail-popover hide " id="popover-wrap">';
        // eventListView += '<h5 class="mt-0 text-center">Repeats Every '+getDayNameFromDate(compareEventsStartDate, 'full')+'</h5>';
        // eventListView += '<hr class="border-class-dash">';
        // eventListView += '<div class="row">';
        // eventListView += '<div class="col-md-6 text-left">Start Date</div>';
        // eventListView += '<div class="col-md-6 text-right">'+convert(item.event_start_date)+'</div>';
        // eventListView += '</div>';
        // eventListView += '<div class="row">';
        // eventListView += '<div class="col-md-3 text-left">Time</div>';
        //
        // // 9:00 AM to 10:00 AM
        // if(popoverStartTime[1] == popoverEndTime[1])
        // {
        //   eventListView += '<div class="col-md-9 text-right">'+popoverStartTime[0]+' - '+ popoverEndTime[0] + ' ' + popoverStartTime[1] +'</div>';
        // }else {
        //   eventListView += '<div class="col-md-9 text-right">'+convertTimeFrom24To12(item.start_time)+' - '+ convertTimeFrom24To12(item.end_time) +'</div>';
        // }
        //
        // eventListView += '</div>';
        // eventListView += '</div>';

        eventListView += '</li>';
      }
    }
    // Day Name of Event End
    eventListView += '</ul>';
    eventListView += '</div>';
    eventListView += '<div class="col-md-12">';
    eventListView += '<div class="row">';
    eventListView += '<div class="col-md-10 col-xs-9 truncate">';
    eventListView += '<span class="truncate">' + item.description + '</span>';
    eventListView += '</div>';
    eventListView += '<div class="col-md-2 col-xs-2 text-right">';
    eventListView += '<ul class="icons-list pull-right mt-5">';
    eventListView += '<li class="dropdown">';
    eventListView += '<a href="javascript:void(0)" class="dropdown-toggle" data-toggle="dropdown"> <i class="icon-more2"></i> </a>';
    eventListView += '<ul class="dropdown-menu dropdown-menu-right">';
    eventListView += '<li><a data-toggle="modal" data-editEvents="' + item.event_id + '" data-target="#editEventModal">Edit</a></li>';
    eventListView += '<li class="deletedata"><a data-toggle="modal" data-deleteEvents="' + item.event_id + '" data-deleteModuleName="events" data-target="#DeleteModal" dataid="1">Delete</a></li>';
    eventListView += '</ul>';
    eventListView += '</li>';
    eventListView += '</ul>';
    eventListView += '</div>';
    eventListView += '</div>';
    eventListView += '</div>'

    eventListView += '</div>';
    eventListView += '</div>';
    eventListView += '</div>';
  });
  eventListView += '</div>';
  // Start Add New Event Button
  eventListView += '<div class="col-lg-3 col-sm-6 col-md-5thumb add-channel" data-addevent>';
  eventListView += '<div class="thumbnail thumb-view">';
  eventListView += '<div class="thumb add-thumb-section"> <a class="dv-addd-thumb">';
  eventListView += '<div class="manage-add-thumb"> <i class="icon-plus2"></i> <span>Add Event</span> </div>';
  eventListView += '</a> </div>';
  eventListView += '</div>';
  eventListView += '</div>';
  // End Add New Event Button
  //eventListView += '</div>';
  //eventListView += '</div>';
  callback(null, eventListView);
}

/*
 * Render HTML View of All Events fetched from cms_events
 */
let getAddEventsHtmlView = (data, callback) => {
  var addEventFormView = '';

  addEventFormView += '<form class="form-validation form-validate form-horizontal" action="javascript:void(0)" data-addEventsForm>';
  addEventFormView += '<fieldset class="step pa-0" id="step1">';
  addEventFormView += '<div class="col-md-12">';
  addEventFormView += '<div class="panel panel-white">';
  addEventFormView += '<div class="addevent-panel-body">';
  addEventFormView += '<div class="form-group">';
  addEventFormView += '<label class="col-md-3 control-label">Event Or Activity Title</label>';
  addEventFormView += '<div class="col-md-9">';
  addEventFormView += '<input type="text" name="eventsTitle" id="eventsTitle" class="form-control" placeholder="">';
  addEventFormView += '</div>';
  addEventFormView += '</div>';
  addEventFormView += '<div class="form-group">';
  addEventFormView += '<label class="col-md-3 control-label">Location</label>';
  addEventFormView += '<div class="col-md-9">';
  addEventFormView += '<input type="text" name="eventsLocation" id="eventsLocation" class="form-control" placeholder="">';
  addEventFormView += '</div>';
  addEventFormView += '</div>';
  addEventFormView += '<div class="form-group">';
  addEventFormView += '<label class="col-md-3 control-label">Short Description</label>';
  addEventFormView += '<div class="col-md-9">';
  addEventFormView += '<textarea name="eventsDescription" id="eventsDescription" class="form-control" placeholder=""></textarea>';
  addEventFormView += '</div>';
  addEventFormView += '</div>';
  addEventFormView += '<div class="form-group">';
  addEventFormView += '<label class="col-md-3 control-label">Photo</label>';
  addEventFormView += '<div class="col-lg-6">';
  addEventFormView += '<div class="row">';
  addEventFormView += '<div class="col-sm-6" id="resultImg"> <img id="cropedImgId" src="'+config.cloud.server.protocol+'://'+cloudServerAddress+'/'+config.projects.name.dashboard+'/assets/dist/img/default-image.png" class="img-responsive dv-upload-img"> </div>';

  addEventFormView += '<div class="col-sm-6 dv-upoad-btn">';
  addEventFormView += '<div class="inputFileUploadButton">';
  addEventFormView += '<p class="custom-para">Upload Photo</p>';
  addEventFormView += '<input id="inputEventImage" type="file" class="upload imgUpload">';
  //addEventFormView += '<input id="edituploadBtn uploadBtn" type="file" class="upload imgUpload">';
  addEventFormView += '</div></div>';

  addEventFormView += '</div>';
  addEventFormView += '</div>';
  addEventFormView += '</div>';

  addEventFormView += '<div class="form-group">';
  addEventFormView += '<label class="col-md-3 mt-10 control-label">Event Type</label>';
  addEventFormView += '<div class="col-md-9">';
  addEventFormView += '<div class="radio-inline">';
  if(data.eventType == 0){
    addEventFormView += '<label class="truncate"><input type="radio" id="onetime" class="styled event_type ui-wizard-content" value="0"  name="event-type" checked="checked">One Time</label>';
  }else {
    addEventFormView += '<label class="truncate"><input type="radio" id="onetime" class="styled event_type ui-wizard-content" value="0"  name="event-type">One Time</label>';
  }

  addEventFormView += '</div>';
  addEventFormView += '<div class="radio-inline">';
  if(data.eventType == 1){
    addEventFormView += '<label class="truncate"><input type="radio" id="recurring" class="styled event_type" value="1" name="event-type" checked>Recurring</label>';
  }else{
    addEventFormView += '<label class="truncate"><input type="radio" id="recurring" class="styled event_type" value="1" name="event-type">Recurring</label>';
  }
  addEventFormView += '</div>';

  addEventFormView += '</div>';
  addEventFormView += '</div>';
  addEventFormView += '<div class="form-group">';
  addEventFormView += '<label class="col-md-3 mt-10 control-label">Event Date</label>';
  addEventFormView += '<div class="col-md-9">';
  addEventFormView += '<div class="row">';
  addEventFormView += '<div class="col-md-6">';
  addEventFormView += '<div class="input-group">';
  addEventFormView += '<span class="input-group-addon">Start Date</span>';
  let today = getCurrentDate();
  let todayDate = new Date(today);
  addEventFormView += '<input type="text" id="eventStartDate" name="eventStartDate" class="form-control" placeholder="Select Date" style="text-align: right" value="'+today+'"/>';
  addEventFormView += '</div>';

  addEventFormView += '</div>';
  addEventFormView += '<div class="col-md-6">';
  addEventFormView += '<div class="input-group">';
  addEventFormView += '<span class="input-group-addon">End Date</span>';
  // if($.trim($(":input[name='event-type']:checked").val()) == "1") {
  //   addEventFormView += '<input type="text" id="eventEndDate" name="eventEndDate" class="form-control" placeholder="Select Date" style="text-align: right"/>';
  // }else if($.trim($(":input[name='event-type']:checked").val()) == "0"){
    addEventFormView += '<input type="text" id="eventEndDate" name="eventEndDate" class="form-control" placeholder="Select Date" disabled style="text-align: right" value="'+today+'"/>';
  // }
  addEventFormView += '</div>';
  addEventFormView += '</div>';
  addEventFormView += '</div>';
  addEventFormView += '</div>';
  addEventFormView += '</div>';
  addEventFormView += '<div class="single_event_colum clearfix">';
  addEventFormView += '<div class="form-group">';
  addEventFormView += '<label class="col-md-3 control-label">Event Time </label>';
  addEventFormView += '<div class="col-md-9">';
  addEventFormView += '<div class="col-md-6 pl-0">';
  addEventFormView += '<div class="input-group">';
  addEventFormView += '<span class="input-group-addon">Start Time</span>';
  addEventFormView += '<input type="text" id="eventStartTime" class="form-control eventStartTime" name="" placeholder="Select Time" style="text-align: right" value=""/>';
  addEventFormView += '</div>';
  addEventFormView += '</div>';
  addEventFormView += '<div class="col-md-6 pr-0">';
  addEventFormView += '<div class="input-group">';
  addEventFormView += '<span class="input-group-addon">End Time</span>';
  addEventFormView += '<input type="text" id="eventEndTime" class="form-control eventEndTime" name="" placeholder="Select Time" style="text-align: right" value=""/>';
  addEventFormView += '</div>';
  addEventFormView += '</div>';
  addEventFormView += '</div>';
  addEventFormView += '</div>';
  addEventFormView += '</div>';

  addEventFormView += '<div class="form-group repeatEevent" style="display: none">';
  addEventFormView += '<label class="col-md-3 control-label">Repeats Every </label>';
  addEventFormView += '<div class="col-md-9">';

  // Start From Monday To Sunday Event Start and End Time for Recurring Events
  for(let i=1; i<=7; i++) {
    // Recurring Event Start and End Time Start
    addEventFormView += '<div class="repeatEverySection row clearfix" id="day-'+i+'" attr-day='+i+'>';
    addEventFormView += '<div class="col-md-2">';
    addEventFormView += '<div class="checkbox-inline">';
    addEventFormView += '<label>';
    addEventFormView += '<input type="checkbox" name="days[]" class="styled recurring_days" value="'+i+'">'+getDayNameFromNumber(i, "full")+' ';
    addEventFormView += '</label>';
    addEventFormView += '</div>';
    addEventFormView += '</div>';
    addEventFormView += '<div class="col-md-10">';
    addEventFormView += '<div class="row RepeatTimeSection">';
    addEventFormView += '<div class="col-md-5">';
    addEventFormView += '<div class="input-group">';
    addEventFormView += '<span class="input-group-addon">Start Time</span>';
    addEventFormView += '<input type="text" class="form-control eventStartTime eventStartTime-'+i+'" name="eventStartTime-day-'+i+'[]" placeholder="Select Time" style="text-align: right" value=""/>';
    addEventFormView += '</div>';
    addEventFormView += '</div>';
    addEventFormView += '<div class="col-md-5">';
    addEventFormView += '<div class="input-group">';
    addEventFormView += '<span class="input-group-addon">End Time</span>';
    addEventFormView += '<input type="text" id="" class="form-control eventEndTime eventEndTime-'+i+'" name="eventEndTime-day-'+i+'[]" placeholder="Select Time" style="text-align: right" value=""/>';
    addEventFormView += '</div>';
    addEventFormView += '</div>';
    addEventFormView += '<div class="col-md-2">';
    addEventFormView += '<a class="btn dv-custom-btn btn-xs" id="edit-addeventTime" data-addEditEventTime="'+i+'" href="javascript:void(0);">';
    addEventFormView += '<i class="icon-plus2"></i>';
    addEventFormView += '</a>';
    addEventFormView += '</div>';
    addEventFormView += '</div>';
    addEventFormView += '<div id="repeat-eventdayTime-container-day-'+i+'">';

    addEventFormView += '</div>';
    addEventFormView += '</div>';
    addEventFormView += '</div>';
    // Recurring Event Start and End Time End
  }

  addEventFormView += '</div>';
  addEventFormView += '</div>';
  addEventFormView += '</div>';
  addEventFormView += '</div>';
  addEventFormView += '</div>';
  addEventFormView += '</fieldset>';

  addEventFormView += '<div class="form-wizard-actions communication-wizard fadeIn animated">';
  //addEventFormView += '<input class="btn btn-default dv-custom-btn btn-xs legitRipple pull-left" id="basic-back" type="reset" value="Back" />';
  //addEventFormView += '<input class="btn dv-custom-btn btn-xs legitRipple btn-themeClr" id="basic-next" type="submit" value="Next" />';
  addEventFormView += '<input class="btn dv-custom-btn btn-xs legitRipple btn-themeClr" id="basic-next" type="button" value="Save" data-saveEvent />';
  addEventFormView += '</div>';

  addEventFormView += '<div class="notification_custom_submit clearfix" style="display: none;width: 98.3%;margin: 0 10px;padding: 5px 10px;background: #fff;box-shadow: 0 4px 8px rgba(0,0,0,.05), 0 0 10px rgba(0,0,0,.03);border-radius: 4px;">';

  addEventFormView += '</div>';
  addEventFormView += '</form>';

  callback(null, addEventFormView);
}

/*
 * Render HTML View of Events Calendar
 */
let getEventsCalendarHtmlView = (data, month, year, callback) => {
  let eventsCalendarHtmlView = '';
  let popOverEventsCalendarHtmlView = '';

  // let month = data.month;
  // let year = data.year;
  let date = new Date();
  let currMonth = date.getMonth() + 1;
  let currYear = date.getFullYear();
  let currDay = date.getDay();

  let createCurrDate = currYear+'-'+currMonth+'-'+currDay;
  let currentDate = new Date(createCurrDate);
  let firstDate = 1;
  let recurringDatesArr = [];

  if(month.length == undefined) {
    if(month < 10) {
      month = "0" + month;
    }
  }

  let displayDate = year + "-" + month + "-01";

  //let utcTime = strtotime ('2018-4-01');
  //console.log('UTC : ' + utcTime);
  let monthDays = daysInMonth(month, year);
  console.log('Days in Month : '+monthDays);
  let monthWeekStartDay = daysOfWeek(displayDate);
  monthWeekStartDay = monthWeekStartDay + 1;
  console.log('Day of the Week : ' + monthWeekStartDay);
  let monthName = getMonthNameFromNumber(month - 1);
  console.log('Month Name : ' + monthName);

  console.log('FINAL : '+ (monthDays + monthWeekStartDay -1));


  //eventsCalendarHtmlView += '<div class="tab-pane" id="solid-rounded-tab3">';
  // Start Display Panel of Month and year
  eventsCalendarHtmlView += '<div class="row mb-15 caldendar-panel">';
  eventsCalendarHtmlView += '<div class="col-md-12 pl-30 pr-30">';
  eventsCalendarHtmlView += '<div class="col-md-11">';
  eventsCalendarHtmlView += '<div class="dv-currentMonth">';
  eventsCalendarHtmlView += '<button type="button" class="btn btn-default dv-custom-btn btn-xs" id="calendarDown" data-calMonthDown="' + month + '" data-calYearDown="' + year + '">';
  eventsCalendarHtmlView += '<span class="fc-icon fc-icon-left-single-arrow"></span>';
  eventsCalendarHtmlView += '</button>';
  eventsCalendarHtmlView += '<span class="show-current-month">' + monthName + ' ' + year + '</span>';
  eventsCalendarHtmlView += '<button type="button" class="btn btn-default dv-custom-btn btn-xs" id="calendarUp" data-calMonthUp="' + month + '" data-calYearUp="' + year + '">';
  eventsCalendarHtmlView += '<span class="fc-icon fc-icon-right-single-arrow"></span>';
  eventsCalendarHtmlView += '</button>';
  eventsCalendarHtmlView += '</div>';
  eventsCalendarHtmlView += '</div>';
  eventsCalendarHtmlView += '<div class="col-md-1 text-right">';
  eventsCalendarHtmlView += '<div class="dv-custom-search">';
  eventsCalendarHtmlView += '<form action="#">';
  eventsCalendarHtmlView += '<div class="has-feedback has-feedback-right">';
  eventsCalendarHtmlView += '<input type="search" class="form-control dv-search-input" placeholder="Search">';
  eventsCalendarHtmlView += '<div class="form-control-feedback"> <i class="icon-search4 text-size-base text-muted"></i> </div>';
  eventsCalendarHtmlView += '</div>';
  eventsCalendarHtmlView += '</form>';
  eventsCalendarHtmlView += '</div>';
  eventsCalendarHtmlView += '</div>';
  eventsCalendarHtmlView += '</div>';
  eventsCalendarHtmlView += '</div>';
  // End Display Panel of Month and year
  eventsCalendarHtmlView += '<div class="panel pl-15 pr-15 caldendar-body">';
  eventsCalendarHtmlView += '<div class="dv-calendar-header">';
  eventsCalendarHtmlView += '<div class="row">';
  eventsCalendarHtmlView += '<div class="col-sm-12">';
  eventsCalendarHtmlView += '<div class="col-md-1 dv-col-md-7">';
  eventsCalendarHtmlView += '<label>Sun</label>';
  eventsCalendarHtmlView += '</div>';
  eventsCalendarHtmlView += '<div class="col-md-1 dv-col-md-7">';
  eventsCalendarHtmlView += '<label>mon</label>';
  eventsCalendarHtmlView += '</div>';
  eventsCalendarHtmlView += '<div class="col-md-1 dv-col-md-7">';
  eventsCalendarHtmlView += '<label>tue</label>';
  eventsCalendarHtmlView += '</div>';
  eventsCalendarHtmlView += '<div class="col-md-1 dv-col-md-7">';
  eventsCalendarHtmlView += '<label>Wed</label>';
  eventsCalendarHtmlView += '</div>';
  eventsCalendarHtmlView += '<div class="col-md-1 dv-col-md-7">';
  eventsCalendarHtmlView += '<label>Thu</label>';
  eventsCalendarHtmlView += '</div>';
  eventsCalendarHtmlView += '<div class="col-md-1 dv-col-md-7">';
  eventsCalendarHtmlView += '<label>Fri</label>';
  eventsCalendarHtmlView += '</div>';
  eventsCalendarHtmlView += '<div class="col-md-1 dv-col-md-7">';
  eventsCalendarHtmlView += '<label>Sat</label>';
  eventsCalendarHtmlView += '</div>';
  eventsCalendarHtmlView += '</div>';
  eventsCalendarHtmlView += '</div>';
  eventsCalendarHtmlView += '</div>';
  eventsCalendarHtmlView += '<div class="dv-calendar-month-view">';
  eventsCalendarHtmlView += '<div class="row">';
  eventsCalendarHtmlView += '<div class="clearfix calendar-wrapper">';

  for (let i = 1; i <= (monthDays + monthWeekStartDay -1); i++) {
      if (i < monthWeekStartDay) {
        eventsCalendarHtmlView += '<div class="col-md-1 dv-col-md-7 dv-cal-date-main-section">';
        eventsCalendarHtmlView += '<div class="dv-cal-date">';
        eventsCalendarHtmlView += '</div>';
        eventsCalendarHtmlView += '</div>';
      }
      else {
        eventsCalendarHtmlView += '<div class="col-md-1 dv-col-md-7 dv-cal-date-main-section">';
        eventsCalendarHtmlView += '<div class="dv-cal-date popover-arrow">';
        eventsCalendarHtmlView += '<span>' + firstDate + '</span>';
        eventsCalendarHtmlView += '<ul>';
        if(firstDate < 10) {
          firstDate = "0" + firstDate;
        }

        let eventDate = year + '-' + month + '-' + firstDate;
        let liCount = 1;
        let popOverRecCount = 1;
        if(data) {
            data.forEach((item) =>{
              let convertedStartDate = convert(item.event_start_date);
              let compFirstDate = new Date(convertedStartDate);
              let firstDateUTC = new Date(compFirstDate);
              let convertedEndDate = convert(item.event_until_date);
              let compSecondDate = new Date(convertedEndDate);
              let secondDateUTC = new Date(compSecondDate);
              var day = 60 * 60 * 24 * 1000;
              //console.log("PRINT START DATE : "+item.event_start_date+ "---- SECOND DATE : "+item.event_until_date);

              let totalDays = (compSecondDate - compFirstDate)/1000/60/60/24;

              // Start Make Array of Dates from Start to End Date
              if(item.is_recurring == "1") {
                let getLatestDate = new Date(item.event_start_date);
                for (let rd = 0; rd <= totalDays; rd++)
                {
                      if(rd != 0) {
                        var getFinalDate = new Date(firstDateUTC.getTime() + rd * day);
                        recurringDatesArr.push(convert(getFinalDate));
                      } else {
                        recurringDatesArr.push(convertedStartDate);
                      }
                }
                //console.log('EVENT DATE : =========='+eventDate +'---INDEX : '+i+'--- CONDITION : '+(monthDays + monthWeekStartDay -1) +'-- ARRAY : '+recurringDatesArr);
                if(recurringDatesArr.indexOf(eventDate) > -1) {
                  convertedStartDate = eventDate;
                }

              }
              // End Make Array of Dates from Start to End Date

              let compareEventsDate = new Date(convertedStartDate);
              //console.log("Event Title : " + item.event_start_date + '---------------------' + eventDate +'======================'+convertedTime);

              if(convertedStartDate == eventDate)
              {
                if(item.is_recurring == "1") {
                  // Recurring Days If Event on Same Day then Display
                  let recDays = item.recurring_days.split(",");
                  let recDayNo = getDayNoFromDate(convertedStartDate);
                  for(let r=0; r<recDays.length; r++) {
                    if(recDays[r] == recDayNo) {
                      if(liCount > 4) {
                        if(liCount < 6) {
                          eventsCalendarHtmlView += '<li class="show_all_event"><a class="showAll popover-detail-main" rel="popover" data-original-title="" title=""> + Show all </a>';

                          eventsCalendarHtmlView += '<div class="detail-popover hide" id="popover-wrap"><div class="arrow-div"></div>';
                          eventsCalendarHtmlView += '<div class="popover-content">';

                          eventsCalendarHtmlView += '<h5 class="mt-0 text-center">'+getDayNameFromDate(eventDate, 'full')+','+firstDate+' '+monthName+' '+year+'</h5>';
                          eventsCalendarHtmlView += '<div class=" dv-cal-date-main-section">';
                          eventsCalendarHtmlView += '<div class="dv-cal-date">';
                          eventsCalendarHtmlView += '<ul>';
                          data.forEach((itemPopover) =>{
                            if(convert(itemPopover.event_start_date) == eventDate || dateCheck(convert(itemPopover.event_start_date),convert(itemPopover.event_until_date),convertedStartDate)) {
                              //eventsCalendarHtmlView += popOverEventsCalendarHtmlView;
                              eventsCalendarHtmlView += '<li><a class="truncate" data-toggle="modal" data-target="#editEventModal" data-eventId="'+itemPopover.event_id+'" href="javascript:void(0);">'+itemPopover.event_title+'</a></li>';
                            }
                          });
                          eventsCalendarHtmlView += '</ul>';
                          eventsCalendarHtmlView += '</div>'; //dv-cal-date End
                          eventsCalendarHtmlView += '</div>'; // dv-cal-date-main-section End
                          eventsCalendarHtmlView += '</div>'; // popover-content End
                          eventsCalendarHtmlView += '</div>'; // detail-popover End
                          eventsCalendarHtmlView += '</li>'; // Li end
                        }
                      }else {
                        eventsCalendarHtmlView += '<li><a data-toggle="modal" data-target="#editEventModal" data-day="'+getDayNoFromDate(eventDate)+'" data-eventId="'+item.event_id+'" href="javascript:void(0);">' + item.event_title + '</a></li>';
                      }
                      liCount++;
                    }
                  }
                }else {
                  if(liCount > 4) {
                    if(liCount < 6) {
                      eventsCalendarHtmlView += '<li class="show_all_event"><a class="showAll popover-detail-main" rel="popover" data-original-title="" title=""> + Show all </a>';

                      eventsCalendarHtmlView += '<div class="detail-popover hide" id="popover-wrap"><div class="arrow-div"></div>';
                      eventsCalendarHtmlView += '<div class="popover-content">';

                      eventsCalendarHtmlView += '<h5 class="mt-0 text-center">'+getDayNameFromDate(eventDate, 'full')+','+firstDate+' '+monthName+' '+year+'</h5>';
                      eventsCalendarHtmlView += '<div class=" dv-cal-date-main-section">';
                      eventsCalendarHtmlView += '<div class="dv-cal-date">';
                      eventsCalendarHtmlView += '<ul>';
                      data.forEach((itemPopover) =>{
                        if(convert(itemPopover.event_start_date) == eventDate || dateCheck(convert(itemPopover.event_start_date),convert(itemPopover.event_until_date),convertedStartDate)) {
                          //eventsCalendarHtmlView += popOverEventsCalendarHtmlView;
                          eventsCalendarHtmlView += '<li><a class="truncate" data-toggle="modal" data-target="#editEventModal" data-eventId="'+itemPopover.event_id+'" href="javascript:void(0);">'+itemPopover.event_title+'</a></li>';
                        }
                      });
                      eventsCalendarHtmlView += '</ul>';
                      eventsCalendarHtmlView += '</div>'; //dv-cal-date End
                      eventsCalendarHtmlView += '</div>'; // dv-cal-date-main-section End
                      eventsCalendarHtmlView += '</div>'; // popover-content End
                      eventsCalendarHtmlView += '</div>'; // detail-popover End
                      eventsCalendarHtmlView += '</li>'; // Li end
                    }
                  }else {
                    eventsCalendarHtmlView += '<li><a data-toggle="modal" data-target="#editEventModal" data-day="'+getDayNoFromDate(eventDate)+'" data-eventId="'+item.event_id+'" href="javascript:void(0);">' + item.event_title + '</a></li>';
                  }
                  liCount++;
                }
              }

              recurringDatesArr = [];

            });

        }
        eventsCalendarHtmlView += '</ul>';
        eventsCalendarHtmlView += '</div>';
        eventsCalendarHtmlView += '</div>';
        firstDate++;
      }
  }
  callback(null, eventsCalendarHtmlView);
}

/*
 * Render Events Detail On Events Calendar
 */
let renderEventsDetailOnCalendar = (data, dataPacket, callback) => {
  let today = getCurrentDate();
  let todayDate = new Date(today);

  let date = new Date();
  let currMonth = date.getMonth() + 1;
  let currYear = date.getFullYear();
  let currDay = date.getDay();

  let createCurrDate = currYear+'-'+currMonth+'-'+currDay;
  let currentDate = new Date(createCurrDate);

  let convertedDate = convert(data[0].event_start_date);
  let compareEventsDate = new Date(convertedDate);

  let convertedEndDate = convert(data[0].event_until_date);
  let compareEventsEndDate = new Date(convertedEndDate);

  //console.log('CURRENT DATE : ' + createCurrDate + '----------'  +todayDate + ' SECOND DATE : ' + compareEventsDate);

  let viewEventsDetail = '';

  viewEventsDetail += '<div class="modal-content">';
  viewEventsDetail += '<div class="modal-header">';
  viewEventsDetail += '<span class="event-Uploadtext" style="display: none">';
  viewEventsDetail += '<button type="button" class="close back photoBackBtn">';
  viewEventsDetail += '<i class="icon-arrow-left8"></i>';
  viewEventsDetail += '</button>';
  viewEventsDetail += '<h4 class="modal-title pull-left">Photo</h4>';
  viewEventsDetail += '</span>';
  viewEventsDetail += '<h4 class="modal-title pull-left event-title">';
  viewEventsDetail += '<button type="button" class="close event-close" data-dismiss="modal">&times;</button>';
  viewEventsDetail += 'Event Details </h4>';
  if(todayDate <= compareEventsDate || compareEventsEndDate >= todayDate) {
    viewEventsDetail += '<button type="button" class="btn btn-default dv-custom-btn btn-xs pull-right editEventBtn">Edit Event</button>';
  }else {
     //viewEventsDetail += '<button type="button" disabled class="btn btn-default dv-custom-btn btn-xs pull-right editEventBtn">Edit Event</button>';
  }

  viewEventsDetail += '</div>';
  viewEventsDetail += '<div class="modal-body overflow-hidden form-horizontal">';
  viewEventsDetail += '<div class="view-event-info">';
  viewEventsDetail += '<div class="row">';
  viewEventsDetail += '<div class="col-md-5">';
  viewEventsDetail += '<div class="view-event-left-section">';
  if(data[0].event_photos == null) {
    viewEventsDetail += '<img src="'+imageUploadPath+'event.jpg" alt="" class="img-responsive mb-10">';
  }else {
    viewEventsDetail += '<img src="' + imageUploadPath + data[0].event_photos + '" alt="" class="img-responsive mb-10">';
  }
  viewEventsDetail += '<img src="" alt="" class="img-responsive mb-10">';
  viewEventsDetail += '<div class="col-md-12 col-xs-12">';
  viewEventsDetail += '<h5 class="no-margin truncate thumbTitle">' + data[0].event_title + '</h5>';
  viewEventsDetail += '</div>';
  viewEventsDetail += '<div class="col-md-12 truncate">' + data[0].event_location + '</div>';
  if(data[0].is_recurring == "1") {
    viewEventsDetail += '<div class="col-md-12 truncate">' + convertedDate + ' - ' + convertedEndDate + '</div>';
    viewEventsDetail += '<div class="col-md-12 truncate">';
    let recDays = data[0].recurring_days.split(",");
    let recTime = data[0].recurring_time.split("#");
    let popoverRecStartTime = '';
    let popoverRecEndTime = '';
    for(let r=0; r<recDays.length; r++) {

      for(let rt=0; rt<recTime.length;rt++) {
        if(recDays[r] == dataPacket.dayNo) {
        let getRecDayStartEndTimeArr = recTime[rt].split(",");
        if(recDays[r] == getRecDayStartEndTimeArr[0]) {
          popoverRecStartTime = convertTimeFrom24To12(getRecDayStartEndTimeArr[1]).split(" ");
          popoverRecEndTime = convertTimeFrom24To12(getRecDayStartEndTimeArr[2]).split(" ");
          if(popoverRecStartTime[1] == popoverRecEndTime[1]) {
            viewEventsDetail += popoverRecStartTime[0] + ' - ' + popoverRecEndTime[0] + ' ' + popoverRecStartTime[1] +'</br>';
          }else{
            viewEventsDetail += convertTimeFrom24To12(getRecDayStartEndTimeArr[1]) + ' - ' + convertTimeFrom24To12(getRecDayStartEndTimeArr[2]) + '</br>';
          }
        }
      }
      }

    }
    viewEventsDetail += '</div>';
  }else {
    viewEventsDetail += '<div class="col-md-12 truncate">' + convertedDate + '</div>';
    viewEventsDetail += '<div class="col-md-12 truncate">' + convertTimeFrom24To12(data[0].start_time) + ' - ' + convertTimeFrom24To12(data[0].end_time) + '</div>';
  }

  viewEventsDetail += '<div class="col-md-12 color-black mt-5">' + data[0].description + '</div>';

  viewEventsDetail += '</div>';
  viewEventsDetail += '</div>';
  // Interested Guest List Start example - 109,Ms. Kate Rebecca McMahon Margaret#822,Mrs. Andrea Riecken
  if(data[0].guest_interested) {
    let interested_guest_list = data[0].guest_interested.split('#');

    viewEventsDetail += '<div class="col-md-7">';
    viewEventsDetail += '<table class="table table-responsive">';
    viewEventsDetail += '<thead>';
    viewEventsDetail += '<tr>';
    viewEventsDetail += '<th>Interested Guests ('+interested_guest_list.length+')</th>';
    viewEventsDetail += '<th>Room #</th>';
    viewEventsDetail += '</tr>';
    viewEventsDetail += '</thead>';
    viewEventsDetail += '<tbody>';

    if(interested_guest_list) {
      for (let ig=0; ig<interested_guest_list.length;ig++) {
        let igArr = interested_guest_list[ig].split(',');
        viewEventsDetail += '<tr>';
        viewEventsDetail += '<td>'+igArr[1]+'</td>';
        viewEventsDetail += '<td>'+igArr[0]+'</td>';
        viewEventsDetail += '</tr>';
      }
    }else {
      viewEventsDetail += 'No data available.';
    }

    viewEventsDetail += '</tbody>';
    viewEventsDetail += '</table>';
    viewEventsDetail += '</div>';
  }else {
    viewEventsDetail += '<div class="col-md-7">';
    viewEventsDetail += '<table class="table table-responsive">';
    viewEventsDetail += '<thead>';
    viewEventsDetail += '<tr>';
    viewEventsDetail += '<th>Interested Guests (0)</th>';
    viewEventsDetail += '<th>Room #</th>';
    viewEventsDetail += '</tr>';
    viewEventsDetail += '</thead>';
    viewEventsDetail += '<tbody>';

    viewEventsDetail += '</tbody>';
    viewEventsDetail += '</table>';
    viewEventsDetail += '</div>';
    viewEventsDetail += 'No data available.';
  }
  // Interested Guest List End
  viewEventsDetail += '</div>';
  viewEventsDetail += '</div>';
  // Start Edit Form
  let viewEditEvents = showEditEventsHtmlView(data);
  viewEventsDetail += viewEditEvents;
  // End Edit Form
  viewEventsDetail += '<div class="modal-footer">';
  viewEventsDetail += '<button class="btn btn-flat btn-border pull-left btn-xs" id="backtoEventView" style="display:none">View</button>';
  if(todayDate <= compareEventsDate || compareEventsEndDate >= todayDate) {
    viewEventsDetail += '<button class="btn btn-default btn-themeClr btn-xs saveEvent" id="saveEditEvent" data-editEventId="" style="visibility:hidden">Save</button>';
  }else {
    viewEventsDetail += '<button class="btn btn-default btn-themeClr btn-xs saveEvent" id="saveEditEvent" data-editEventId="" disabled style="visibility:hidden">Save</button>';
  }
  viewEventsDetail += '</div>';
  viewEventsDetail += '</div>';
  callback(null, viewEventsDetail);
}

function showEditEventsHtmlView(data) {

  let viewEditEvents = '';
  viewEditEvents += '<div class="edit-event-form" style="display: none">';
  viewEditEvents += '<div class="form-group">';
  viewEditEvents += '<label class="col-md-3 control-label">Event Or Activity Title</label>';
  viewEditEvents += '<div class="col-md-9">';
  viewEditEvents += '<input type="text" name="eventsTitle" id="eventsTitle" class="form-control" placeholder="" value="'+data[0].event_title+'">';
  viewEditEvents += '</div>';
  viewEditEvents += '</div>';
  viewEditEvents += '<div class="form-group">';
  viewEditEvents += '<label class="col-md-3 control-label">Location</label>';
  viewEditEvents += '<div class="col-md-9">';
  viewEditEvents += '<input type="text" name="eventsLocation" id="eventsLocation" class="form-control" placeholder="" value="'+data[0].event_location+'">';
  viewEditEvents += '</div>';
  viewEditEvents += '</div>';
  viewEditEvents += '<div class="form-group">';
  viewEditEvents += '<label class="col-md-3 control-label">Short Description</label>';
  viewEditEvents += '<div class="col-md-9">';
  viewEditEvents += '<textarea name="eventsDescription" id="eventsDescription" class="form-control" placeholder="">'+data[0].description+'</textarea>';
  viewEditEvents += '</div>';
  viewEditEvents += '</div>';
  viewEditEvents += '<div class="form-group">';
  viewEditEvents += '<label class="col-md-3 control-label">Photo</label>';
  viewEditEvents += '<div class="col-lg-6">';
  viewEditEvents += '<div class="row">';
  if(data[0].event_photos == null) {
    viewEditEvents += '<div class="col-sm-6" id="resultImg"> <img id="cropedImgId" src="'+config.cloud.server.protocol+'://'+cloudServerAddress+'/'+config.projects.name.dashboard+'/assets/dist/img/default-image.png" class="img-responsive dv-upload-img"> </div>';
  }else {
    viewEditEvents += '<div class="col-sm-6" id="resultImg"> <img id="cropedImgId" src="'+ imageUploadPath + data[0].event_photos+'" class="img-responsive dv-upload-img"> </div>';
  }
  viewEditEvents += '<div class="col-sm-6 dv-upoad-btn">';
  viewEditEvents += '<div class="inputFileUploadButton">';
  viewEditEvents += '<p class="custom-para">Upload Photo</p>';
  viewEditEvents += '<input id="inputEventImage" type="file" class="upload imgUpload" />';
  viewEditEvents += '</div>';
  viewEditEvents += '</div>';

  viewEditEvents += '</div>';
  viewEditEvents += '</div>';
  viewEditEvents += '</div>';
  viewEditEvents += '<div class="form-group">';
  viewEditEvents += '<label class="col-md-3 mt-10 control-label">Event Type</label>';
  viewEditEvents += '<div class="col-md-9">';
  viewEditEvents += '<div class="radio-inline">';
  if(data[0].is_recurring == "0") {
    viewEditEvents += '<label class="truncate"><input type="radio" id="onetime" class="styled event_type" value="0"  name="event-type" checked="checked">One Time</label>';
  }else{
    viewEditEvents += '<label class="truncate"><input type="radio" id="onetime" class="styled event_type" value="0"  name="event-type">One Time</label>';
  }
  viewEditEvents += '</div>';
  viewEditEvents += '<div class="radio-inline">';
  if(data[0].is_recurring == "1") {
    viewEditEvents += '<label class="truncate"><input type="radio" id="recurring" class="styled event_type" value="1" name="event-type" checked="checked">Recurring</label>';
  }else {
    viewEditEvents += '<label class="truncate"><input type="radio" id="recurring" class="styled event_type" value="1" name="event-type">Recurring</label>';
  }
  viewEditEvents += '</div>';

  viewEditEvents += '</div>';
  viewEditEvents += '</div> ';
  viewEditEvents += '<div class="form-group">';
  viewEditEvents += '<label class="col-md-3 mt-10 control-label">Event Date</label>';
  viewEditEvents += '<div class="col-md-9">';
  viewEditEvents += '<div class="row">';
  viewEditEvents += '<div class="col-md-6">';
  viewEditEvents += '<div class="input-group">';
  viewEditEvents += '<span class="input-group-addon">Start Date</span>';
  viewEditEvents += '<input type="text" name="eventStartDate" id="eventStartDate" class="form-control" placeholder="Select Date" value="'+convert(data[0].event_start_date)+'" style="text-align: right"/>';
  viewEditEvents += '</div>';

  viewEditEvents += '</div>';
  viewEditEvents += '<div class="col-md-6">';
  viewEditEvents += '<div class="input-group">';
  viewEditEvents += '<span class="input-group-addon">End Date</span>';
  viewEditEvents += '<input type="text" id="eventEndDate" class="form-control" placeholder="Select Date" name="eventEndDate" value="'+convert(data[0].event_until_date)+'" style="text-align: right"/>';
  viewEditEvents += '</div>';
  viewEditEvents += '</div>';
  viewEditEvents += '</div>';
  viewEditEvents += '</div>';
  viewEditEvents += '</div>';
  viewEditEvents += '<div class="single_event_colum clearfix">';
  viewEditEvents += '<div class="form-group">';
  viewEditEvents += '<label class="col-md-3 control-label">Event Time </label>';
  viewEditEvents += '<div class="col-md-9">';
  viewEditEvents += '<div class="col-md-6 pl-0">';
  viewEditEvents += '<div class="input-group">';
  viewEditEvents += '<span class="input-group-addon">Start Time</span>';
  viewEditEvents += '<input type="text" id="eventStartTime" class="form-control eventStartTime" name="" placeholder="Select Time" style="text-align: right" value="'+convertTimeFrom24To12(data[0].start_time)+'"/>';
  viewEditEvents += '</div>';
  viewEditEvents += '</div>';
  viewEditEvents += '<div class="col-md-6 pr-0">';
  viewEditEvents += '<div class="input-group">';
  viewEditEvents += '<span class="input-group-addon">End Time</span>';
  viewEditEvents += '<input type="text" id="eventEndTime" class="form-control eventEndTime" name="" placeholder="Select Time" style="text-align: right" value="'+convertTimeFrom24To12(data[0].end_time)+'"/>';
  viewEditEvents += '</div>';
  viewEditEvents += '</div>';
  viewEditEvents += '</div>';
  viewEditEvents += '</div>';
  viewEditEvents += '</div>';

  viewEditEvents += '<div class="form-group repeatEevent" style="display: none">';
  viewEditEvents += '<label class="col-md-3 control-label">Repeats Every </label>';
  viewEditEvents += '<div class="col-md-9">';

  let recDays = data[0].recurring_days.split(",");
  var recTime = data[0].recurring_time.split('#');
  var checkDaysNo='';
  var checkTimeIndex='';
  var checkRecTimeIndex='';
  // Start From Monday To Sunday Event Start and End Time for Recurring Events
  for(let i=1; i<=7; i++) {
    // Recurring Event Start and End Time Start

    // viewEditEvents += '<div class="repeatEverySection row clearfix" id="day-'+i+'">';
    // viewEditEvents += '<div class="col-md-2">';
    // viewEditEvents += '<div class="checkbox-inline">';
    // viewEditEvents += '<label>';
    for(let r=0; r<recDays.length; r++) {
      if(i == recDays[r]) {
        viewEditEvents += '<div class="repeatEverySection row clearfix" id="day-'+i+'">';
        viewEditEvents += '<div class="col-md-2">';
        viewEditEvents += '<div class="checkbox-inline">';
        viewEditEvents += '<label>';

        viewEditEvents += '<input type="checkbox" name="days[]" class="styled recurring_days" checked value="'+i+'">'+getDayNameFromNumber(i, "full")+' ';

        viewEditEvents += '</label>';
        viewEditEvents += '</div>';
        viewEditEvents += '</div>';
        viewEditEvents += '<div class="col-md-10">';
        // Repeats Every Section Start With Default FIRST INDEX
        for(let t=0;t<recTime.length;t++)
        {
          let recurringDayStartEndTimeArr = recTime[t].split(',');
           if(checkTimeIndex == '' || checkTimeIndex != recurringDayStartEndTimeArr[0]) {
           if(i == recurringDayStartEndTimeArr[0]) {
             //console.log('PRINT START TIME : '+recurringDayStartEndTimeArr[1] + ' ---- END TIME : ' + recurringDayStartEndTimeArr[2]);
             viewEditEvents += '<div class="row RepeatTimeSection">';
             viewEditEvents += '<div class="col-md-5">';
             viewEditEvents += '<div class="input-group">';
             viewEditEvents += '<span class="input-group-addon">Start Time</span>';
             viewEditEvents += '<input type="text" class="form-control eventStartTime eventStartTime-'+i+'" name="eventStartTime-day-'+i+'[]" placeholder="Select Time" style="text-align: right" value="'+convertTimeFrom24To12(recurringDayStartEndTimeArr[1])+'"/>';
             viewEditEvents += '</div>';
             viewEditEvents += '</div>';
             viewEditEvents += '<div class="col-md-5">';
             viewEditEvents += '<div class="input-group">';
             viewEditEvents += '<span class="input-group-addon">End Time</span>';
             viewEditEvents += '<input type="text" id="" class="form-control eventEndTime eventEndTime-'+i+'" name="eventEndTime-day-'+i+'[]" placeholder="Select Time" style="text-align: right" value="'+convertTimeFrom24To12(recurringDayStartEndTimeArr[2])+'"/>';
             viewEditEvents += '</div>';
             viewEditEvents += '</div>';
             viewEditEvents += '<div class="col-md-2">';
             viewEditEvents += '<a class="btn dv-custom-btn btn-xs" id="edit-addeventTime" data-addEditEventTime="'+i+'" href="javascript:void(0);">';
             viewEditEvents += '<i class="icon-plus2"></i>';
             viewEditEvents += '</a>';
             viewEditEvents += '</div>';
             viewEditEvents += '</div>';

           }
            checkTimeIndex = recurringDayStartEndTimeArr[0];
          }
        }
        // Repeats Every Section END With Default FIRST INDEX

        // Repeats Every Section Start With Dynamic in Same Day
        viewEditEvents += '<div id="repeat-eventdayTime-container-day-'+i+'">';
        for(let rt=0;rt<recTime.length;rt++)
        {
         let recurringDayStartEndTimeArr = recTime[rt].split(',');
         //console.log('CHECK TIME INDEX : '+checkRecTimeIndex + '-----------------'+recurringDayStartEndTimeArr[0]);

         //if(i == recurringDayStartEndTimeArr[0]) {
           if(checkRecTimeIndex!='') {
             if(checkRecTimeIndex == recurringDayStartEndTimeArr[0]) {
               if(i == recurringDayStartEndTimeArr[0]) {
               viewEditEvents += '<div class="row RepeatTimeSection">';
               viewEditEvents += '<div class="col-md-5">';
               viewEditEvents += '<div class="input-group">';
               viewEditEvents += '<span class="input-group-addon">Start Time</span>';
               viewEditEvents += '<input type="text" class="form-control ';
               viewEditEvents += 'eventStartTime eventStartTime-'+i+'"';
               viewEditEvents += ' name="eventStartTime-day-'+i+'[]"';
               viewEditEvents += ' placeholder="Select Time" style="text-align: right"';
               viewEditEvents += ' value="'+convertTimeFrom24To12(recurringDayStartEndTimeArr[1])+'"/>';
               viewEditEvents += '</div>';
               viewEditEvents += '</div>'
               viewEditEvents += '<div class="col-md-5">';
               viewEditEvents += '<div class="input-group">';
               viewEditEvents += '<span class="input-group-addon">End Time</span>';
               viewEditEvents += '<input type="text" id="" class="form-control eventEndTime ';
               viewEditEvents += 'eventEndTime-'+i+'" name="eventEndTime-day-'+i+'[]"';
               viewEditEvents += ' placeholder="Select Time" style="text-align: right"'
               viewEditEvents += ' value="'+convertTimeFrom24To12(recurringDayStartEndTimeArr[2])+'"/>';
               viewEditEvents += '</div>';
               viewEditEvents += '</div>';
               viewEditEvents += '<div class="col-md-2">';
               viewEditEvents += '<a class="btn dv-custom-btn btn-xs remove-edit-addevent" id="edit-addeventTime_remove" data-addEditEventTime="'+i+'"';
               viewEditEvents += ' href="javascript:void(0);">';
               viewEditEvents += '<i class="icon-trash"></i> </a>';
               viewEditEvents += '</div>';
               viewEditEvents += '</div>';
             }
             }else {
               checkRecTimeIndex = recurringDayStartEndTimeArr[0];
             }
           }else {
             checkRecTimeIndex = recurringDayStartEndTimeArr[0];
           }
         //}
       }
        // Repeats Every Section End With Dynamic in Same Day
        viewEditEvents += '</div>';
        // Repeats Every Section End

        viewEditEvents += '</div>';

        viewEditEvents += '</div>';
        checkDaysNo=i;
        //console.log('PRINT INDEX VALUE : CHECKED');
        break;
      }
    }
    if (i != checkDaysNo) {
      viewEditEvents += '<div class="repeatEverySection row clearfix" id="day-'+i+'">';
      viewEditEvents += '<div class="col-md-2">';
      viewEditEvents += '<div class="checkbox-inline">';
      viewEditEvents += '<label>';

      viewEditEvents += '<input type="checkbox" name="days[]" class="styled recurring_days" value="'+i+'">'+getDayNameFromNumber(i, "full")+' ';

      viewEditEvents += '</label>';
      viewEditEvents += '</div>';
      viewEditEvents += '</div>';
      viewEditEvents += '<div class="col-md-10">';
      viewEditEvents += '<div class="row RepeatTimeSection">';
      viewEditEvents += '<div class="col-md-5">';
      viewEditEvents += '<div class="input-group">';
      viewEditEvents += '<span class="input-group-addon">Start Time</span>';
      viewEditEvents += '<input type="text" class="form-control eventStartTime eventStartTime-'+i+'" name="eventStartTime-day-'+i+'[]" placeholder="Select Time" style="text-align: right" value=""/>';
      viewEditEvents += '</div>';
      viewEditEvents += '</div>';
      viewEditEvents += '<div class="col-md-5">';
      viewEditEvents += '<div class="input-group">';
      viewEditEvents += '<span class="input-group-addon">End Time</span>';
      viewEditEvents += '<input type="text" id="" class="form-control eventEndTime eventEndTime-'+i+'" name="eventEndTime-day-'+i+'[]" placeholder="Select Time" style="text-align: right" value=""/>';
      viewEditEvents += '</div>';
      viewEditEvents += '</div>';
      viewEditEvents += '<div class="col-md-2">';
      viewEditEvents += '<a class="btn dv-custom-btn btn-xs" id="edit-addeventTime" data-addEditEventTime="'+i+'" href="javascript:void(0);">';
      viewEditEvents += '<i class="icon-plus2"></i>';
      viewEditEvents += '</a>';
      viewEditEvents += '</div>';
      viewEditEvents += '</div>';
      viewEditEvents += '<div id="repeat-eventdayTime-container-day-'+i+'">';

      viewEditEvents += '</div>';
      viewEditEvents += '</div>';
      viewEditEvents += '</div>';
      //console.log('Print Days Number : '+i);
    }
    // Recurring Event Start and End Time End
  }

  viewEditEvents += '</div>';
  viewEditEvents += '</div>';

  viewEditEvents += '</div>';
  viewEditEvents += '<div class="event-uploader-crop" style="display: none;">';
  viewEditEvents += '<div class="no-padding imgUploadSec">';
  viewEditEvents += '<div class="col-md-12">';
  viewEditEvents += '<div class="panel-flat">';
  viewEditEvents += '<div class="panel-body">';
  viewEditEvents += '<div class="form-group editCropTools">';
  viewEditEvents += '<div class="btn-group">';
  viewEditEvents += '<label class="btn btn-xs dv-custom-btn btn-upload" for="editInputImage" title="Upload image file">';
  viewEditEvents += '<input type="file" class="sr-only" id="editInputImage" name="file" accept=".jpg,.jpeg,.png,.gif,.bmp,.tiff">';
  viewEditEvents += '<span class="docs-tooltip"  title="Upload Image">';
  viewEditEvents += '<span class="fa fa-upload"></span>';
  viewEditEvents += '</span>';
  viewEditEvents += '</label>';
  viewEditEvents += '<div class="btn-group">';
  viewEditEvents += '<button type="button" class="btn btn-xs dv-custom-btn" data-method="zoom" data-option="0.1" title="Zoom In">';
  viewEditEvents += '<span class="docs-tooltip" data-toggle="tooltip" title="">';
  viewEditEvents += '<span class="fa fa-search-plus"></span>';
  viewEditEvents += '</span>';
  viewEditEvents += '</button>';
  viewEditEvents += '</div>';

  viewEditEvents += '<div class="btn-group">';
  viewEditEvents += '<button type="button" class="btn btn-xs dv-custom-btn" data-method="zoom" data-option="-0.1" title="Zoom Out">';
  viewEditEvents += '<span class="docs-tooltip" data-toggle="tooltip" title="">';
  viewEditEvents += '<span class="fa fa-search-minus"></span>';
  viewEditEvents += '</span>';
  viewEditEvents += '</button>';
  viewEditEvents += '</div>';
  viewEditEvents += '</div>';
  viewEditEvents += '</div>';
  viewEditEvents += '<div class="content-group cropImage overflow-hidden" style="height: 400px;">';
  viewEditEvents += '<img src="" alt="" id="editCropImagedefault" class="">';
  viewEditEvents += '</div>';
  viewEditEvents += '</div>';
  viewEditEvents += '</div>';
  viewEditEvents += '</div>';
  viewEditEvents += '</div>';
  viewEditEvents += '</div>';
  viewEditEvents += '</div>';

  return viewEditEvents;
}

/*******************************************************************
 **************** Message Section Html View ************************
 *******************************************************************/

function noContent() {
  let noContent = '';
  noContent += '<p class="text-center mt-20">No data available.</p>';
  // noContent += '<img src="'+config.cloud.server.protocol+'://'+
  // cloudServerAddress+'/'+config.projects.name.dashboard+'/assets/dist/img/no_content.png" />';
  // noContent += '</div>';
  // noContent += '<p class="text-center m-10 text-muted">Details Unavailable.</p>';
  // noContent += '<p class="text-center m-10 text-muted">There is no detail available.</p>';

  return noContent;
}

function getCurrentDate() {
  var today = new Date();
  var dd = today.getDate();
  var mm = today.getMonth()+1; //January is 0!
  var yyyy = today.getFullYear();

  if(dd<10) {
      dd = '0'+dd
  }

  if(mm<10) {
      mm = '0'+mm
  }

  today = yyyy + '-' + mm + '-' + dd;
  return today;
}

function convertTimeFrom24To12(timeString) {
  let H = +timeString.substr(0, 2);
  let h = (H % 12) || 12;
  let ampm = H < 12 ? " AM" : " PM";
  timeString = h + timeString.substr(2, 3) + ampm;
  return timeString;
}

function convert(str) {
    var date = new Date(str),
        mnth = ("0" + (date.getMonth()+1)).slice(-2),
        day  = ("0" + date.getDate()).slice(-2);
    return [ date.getFullYear(), mnth, day ].join("-");
}

function daysInMonth(month,year) {
    return new Date(year, month, 0).getDate();
}

function daysOfWeek(displayDate) {
  let date = new Date(displayDate);
  return date.getDay();
}

function getMonthNameFromNumber(month) {
  var monthArr = new Array();
  monthArr[0] = "January";
  monthArr[1] = "February";
  monthArr[2] = "March";
  monthArr[3] = "April";
  monthArr[4] = "May";
  monthArr[5] = "June";
  monthArr[6] = "July";
  monthArr[7] = "August";
  monthArr[8] = "September";
  monthArr[9] = "October";
  monthArr[10] = "November";
  monthArr[11] = "December";
  let monthName = monthArr[month];
  return monthName;
}

function getDayNameFromNumber(day, type) {
  let dayName = '';
  day = day - 1;
  var singleDayArr = new Array();
  singleDayArr[0] = "M";
  singleDayArr[1] = "T";
  singleDayArr[2] = "W";
  singleDayArr[3] = "T";
  singleDayArr[4] = "F";
  singleDayArr[5] = "S";
  singleDayArr[6] = "S";

  var halfDayArr = new Array();
  halfDayArr[0] = "Mon";
  halfDayArr[1] = "Tue";
  halfDayArr[2] = "Wed";
  halfDayArr[3] = "Thu";
  halfDayArr[4] = "Fri";
  halfDayArr[5] = "Sat";
  halfDayArr[6] = "Sun";

  var fullDayArr = new Array();
  fullDayArr[0] = "Monday";
  fullDayArr[1] = "Tuesday";
  fullDayArr[2] = "Wednesday";
  fullDayArr[3] = "Thursday";
  fullDayArr[4] = "Friday";
  fullDayArr[5] = "Saturday";
  fullDayArr[6] = "Sunday";

  if(type == 'single') {
    dayName = singleDayArr[day];
  }else if(type == 'half') {
    dayName = halfDayArr[day];
  }else if (type == 'full') {
    dayName = fullDayArr[day];
  }
  return dayName;
}

function getDayNameFromDate(dateString, type) {
  let dayName = '';
  var singleDayArr = new Array();
  singleDayArr[0] = "M";
  singleDayArr[1] = "T";
  singleDayArr[2] = "W";
  singleDayArr[3] = "T";
  singleDayArr[4] = "F";
  singleDayArr[5] = "S";
  singleDayArr[6] = "S";

  var halfDayArr = new Array();
  halfDayArr[0] = "Mon";
  halfDayArr[1] = "Tue";
  halfDayArr[2] = "Wed";
  halfDayArr[3] = "Thu";
  halfDayArr[4] = "Fri";
  halfDayArr[5] = "Sat";
  halfDayArr[6] = "Sun";

  var fullDayArr = new Array();
  fullDayArr[0] = "Monday";
  fullDayArr[1] = "Tuesday";
  fullDayArr[2] = "Wednesday";
  fullDayArr[3] = "Thursday";
  fullDayArr[4] = "Friday";
  fullDayArr[5] = "Saturday";
  fullDayArr[6] = "Sunday";

  let d = new Date(dateString);
  let dayNo = d.getDay();
  if(dayNo == 0) {
    dayNo = 7;
  }

  if(type == 'single') {
     dayName = singleDayArr[dayNo - 1];
  }else if(type == 'half') {
    dayName = halfDayArr[dayNo - 1];
  }else if(type == 'full'){
    dayName = fullDayArr[dayNo - 1];
  }

  return dayName;
}

function getDayNoFromDate(dateString) {
  let d = new Date(dateString);
  let dayNo = d.getDay();
  if(dayNo == 0) {
    dayNo = 7;
  }

  return dayNo;
}

function dateCheck(from,to,check) {

    var fDate,lDate,cDate;
    fDate = Date.parse(from);
    lDate = Date.parse(to);
    cDate = Date.parse(check);

    if((cDate <= lDate && cDate >= fDate)) {
        return true;
    }
    return false;
}

function getForeverDate(date) {
  let day = 60 * 60 * 24 * 1000;
  let addDays = 18250; // 365 * 50;
  let startDate = new Date(date);
  let foreverDate = new Date(startDate.getTime() + addDays * day);

  return foreverDate;
}

String.prototype.ucfirst = function()
{
    return this.charAt(0).toUpperCase() + this.substr(1);
}

module.exports = communicationCenter;
