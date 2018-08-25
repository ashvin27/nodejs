let hotelDetail = require(__base +
  'components/db-master/hotels.js'),
  eventsMaster = require(__base +
  'components/db-master/communicationCenter/events.js'),
  eventsRecurringMaster = require(__base +
  'components/db-master/communicationCenter/events-recurring.js'),
  eventsGuests = require(__base +
  'components/db-master/communicationCenter/events-guests.js'),
  messagesMaster = require(__base +
  'components/db-master/communicationCenter/messages.js'),
  messagesRecurringMaster = require(__base +
  'components/db-master/communicationCenter/messages-recurring.js'),
  commonMaster = require(__base +
  'components/db-master/communicationCenter/common.js'),
config = require(__base + 'config'),
inpremiseHostAddress = '',
cloudServerAddress = '',
moment     = require('moment'),
fileSave = require('save-file'),
express = require('express'),
app = express(),
siofu = require("socketio-file-upload"),
fs = require('fs'),
path = require('path'),
Promise = require('bluebird');

app.use(siofu.router);

var imageUploadPath = '';
var contentUploadPath = config.projects.name.apiRootPath+
config.projects.name.inpremiseApi+
 '/assets/uploads/communication_center/'+config.hotelProperties.hotelid+
 '/messages/assets/';
var tempContentUploadPath = config.projects.name.apiRootPath+
config.projects.name.inpremiseApi+
'/assets/uploads/communication_center/'+config.hotelProperties.hotelid+
'/messages/assets/temp/';
var templateUploadPath = config.projects.name.apiRootPath+
config.projects.name.inpremiseApi+
 '/assets/uploads/communication_center/'+config.hotelProperties.hotelid+
 '/messages/';
var templatePath = '';

let fileUploader = (uploaderObj, socket, path) => {

  uploaderObj.dir = path;
  uploaderObj.listen(socket);

  // Do something when a file is saved:
  uploaderObj.on("saved", function(event){
      // renameUploadedFile(event.file.name, (Err, newname) => {
      //     console.log("file name new===" + newname);
      //     if (newname)
      //     {
      //         uploadFile = tempContentUploadPath + newname;
      //     } else {
      //         uploadFile = " ";
      //     }
      // });
  });

  // Error handler:
  uploaderObj.on("error", function(event){
      console.log("Error from uploader", event);
  });

}

let  renameUploadedFile = (filename, callback) => {
    console.log(filename);
    let file = path.parse(filename).name; // hello
    let ext = path.parse(filename).ext;  // .html
    let oldname = tempContentUploadPath + filename;
    console.log("oldname========" + tempContentUploadPath);
    let rendnu = Math.floor(Math.random() * 6909909) + 1;
    let string = file.replace(/[^a-zA-Z0-9]/g, '');
    let newname = string + "_" + rendnu + ext;
    let newpath = tempContentUploadPath + newname;

    console.log(newpath)
    fs.rename(oldname, newpath, (err) => {
        callback(null, newname);
    });
}

let message = {
  // Start Socket Connect
  onConnect: (socket) => {
    /*
    * File Uploader Start
    */
    var uploader = new siofu();
    fileUploader(uploader, socket, tempContentUploadPath);
    /*
    * File Uploader End
    */

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
        imageUploadPath = config.inpremise.server.protocol +
         '://' +inpremiseHostAddress+
         '/'+config.projects.name.inpremiseApi+
          '/assets/uploads/communication_center/'+
          config.hotelProperties.hotelid+'/messages/assets/';
        temporaryUploadPath = config.inpremise.server.protocol +
         '://' +inpremiseHostAddress+
         '/'+config.projects.name.inpremiseApi+
          '/assets/uploads/communication_center/'+
          config.hotelProperties.hotelid+'/messages/assets/temp/';
        templatePath = config.inpremise.server.protocol +
         '://' +inpremiseHostAddress+'/'+
         config.projects.name.inpremiseApi+
          '/assets/uploads/communication_center/'+
          config.hotelProperties.hotelid+'/messages/';
      }
    });



    /*
     * Upload Image Files
     */
   socket.on('uploadFile', (data) => {
     if(data.moduleName == "messages") {
       uploadFilePath = templateUploadPath + data.appendPath +
        '/' + data.filename;
       uploadContent = data.data;
     }

      console.log("Content Upload File Path ====== : "+uploadFilePath);
      fileSave(uploadContent, uploadFilePath , (err, data) => {

      })

   });

    /************************ Start Hotel Messages *************************/

    /*
     * Render all message types
     */
    socket.on('getMessageTypes', function(){
      getMessageTypesHTMLView((htmlErr, messageTypesHtmlView) => {
        if(messageTypesHtmlView) {
          socket.emit('renderMessageTypesHtmlView', {
            messageTypesHtmlView: messageTypesHtmlView
          });
        }
      });
    });

    /*
     * Add New Messages Form View
     */
    socket.on('getAddMessageFormView', function(dataToPacket){
      let data = {};
      data['messageType'] = dataToPacket.messageType;
      // Get All Wings
      let what_wing = [];
      let conditions_wing = {where: {is_deleted: 0}};
      getAllWing('wings', what_wing, conditions_wing, (wErr, wings) => {
        if(wings) {
          data['wings'] = wings;
          // Floors
          let what_floor = [];
          let conditions_floor = {where: {is_deleted: 0}};
          getAllFloor('floors', what_floor, conditions_floor,
          (fErr, floors) => {
            if(floors) {
              data['floors'] = floors;
              // Rooms - Keys
              let what_key = [];
              let conditions_key = {where: {is_deleted: 0}};
              getAllKey('keys', what_key, conditions_key, (kErr, keys) => {
                if(keys) {
                  data['keys'] = keys;
                  let what_template_type = [];
                  let conditions_template_type = {
                    where: {
                      is_deleted: 0,
                      config_key: "template_types"
                    }
                  };
                  getAllTemplateType('cmc_configs', what_template_type,
                   conditions_template_type, (ttErr, templatesType) => {
                    if(templatesType) {
                      data['templatesType'] = templatesType;
                      //Templates Type
                      let what_template_name = [];
                      let conditions_template_name = {where: {is_deleted: 0}};
                      getAllTemplateName('cmc_template', what_template_name,
                       conditions_template_name, (tnErr, templatesName) => {
                        if(templatesName) {
                          data['templatesName'] = templatesName;
                          let what_group_code = [];
                          let conditions_group_code = {
                            where: {
                              is_deleted: 0,
                              guest_type: 'primary'
                            }
                          };
                          getAllGroupCode('pmsi_guests', what_group_code,
                           conditions_group_code, (gcErr, groupCode) => {
                            if(groupCode) {
                              data['groupCode'] = groupCode;
                                getAddMessageHtmlView(data,
                                  (htmlErr, addMessageFormView) => {
                                  if(addMessageFormView) {
                                    socket.emit('renderAddMessageHtmlView', {
                                      addMessageFormView: addMessageFormView
                                    });
                                  }
                                });
                              }
                            });
                          }
                        });
                      }
                  });
                }
              });
            }
          });
        }
      });
    });

    /*
     * Edit Messages Form View
     */
    socket.on('getEditMessageFormView', function(dataToPacket){
      let data = {};
      data['message_id'] = dataToPacket.messageId;
      // Get All Wings
      let what_wing = [];
      let conditions_wing = {where: {is_deleted: 0}};
      getAllWing('wings', what_wing, conditions_wing, (wErr, wings) => {
        if(wings) {
          data['wings'] = wings;
          // Floors
          let what_floor = [];
          let conditions_floor = {where: {is_deleted: 0}};
          getAllFloor('floors', what_floor, conditions_floor,
          (fErr, floors) => {
            if(floors) {
              data['floors'] = floors;
              // Rooms - Keys
              let what_key = [];
              let conditions_key = {where: {is_deleted: 0}};
              getAllKey('keys', what_key, conditions_key, (kErr, keys) => {
                if(keys) {
                  data['keys'] = keys;
                  let what_template_type = [];
                  let conditions_template_type = {
                    where: {
                      is_deleted: 0,
                      config_key: "template_types"
                    }
                  };
                  getAllTemplateType('cmc_configs', what_template_type,
                   conditions_template_type, (ttErr, templatesType) => {
                    if(templatesType) {
                      data['templatesType'] = templatesType;
                      //Templates Type
                      let what_template_name = [];
                      let conditions_template_name = {where: {is_deleted: 0}};
                      getAllTemplateName('cmc_template', what_template_name,
                       conditions_template_name, (tnErr, templatesName) => {
                        if(templatesName) {
                          data['templatesName'] = templatesName;
                          let what_group_code = [];
                          let conditions_group_code = {
                            where: {
                              is_deleted: 0,
                              guest_type: 'primary'
                            }
                          };
                          getAllGroupCode('pmsi_guests', what_group_code,
                           conditions_group_code, (gcErr, groupCode) => {
                            if(groupCode) {
                                data['groupCode'] = groupCode;
                                let conditions_message = {
                                  where: {
                                    message_id: dataToPacket.messageId,
                                    is_deleted: 0
                                  }
                                };
                                let what_message = [];
                                getSelectMessages('v_cmc_message', what_message,
                                 conditions_message, (rmErr, messages) => {
                                  if(messages) {
                                    data['messages'] = messages;
                                    getEditMessageHtmlView(data,
                                      (htmlErr, editMessageFormView) => {
                                      console.log('In get edit message HTML View.');
                                      if(editMessageFormView) {
                                        socket.emit('renderEditMessageHtmlView',
                                        {
                                          editMessageFormView: editMessageFormView
                                        });
                                      }
                                    });
                                  }
                                });
                              }
                            });
                          }
                        });
                      }
                  });
                }
              });
            }
          });
        }
      });
    });

    /*
     * Get all templates name
     */
    socket.on('getTemplateName', function(data){
      let what = [];
      let conditions = {
        where: {
          is_deleted: 0,
          template_type: data.template_type
        }
      };
      getAllTemplateName('cmc_template', what, conditions,
      (tnErr, templateDetails) => {
        if(templateDetails) {
          let templateName = '';
          templateName += '<option value="NA">Please Select Template Name</option>';
          templateDetails.forEach((item) =>{
            if(item.media_component == 1) {
              templateName += '<option value="'+item.template_id+'" ';
              templateName += 'data-uploadedContentPath="'+templatePath+
              '/assets/img/" data-uploadFolderName="'+item.template_path+'" ';
              templateName += 'data-mediacomponent="'+
              item.media_component+'" data-templatePath="'+templatePath +
              item.template_path +'" data-ref-val="'+item.template_type+'">'+
              item.template_name.ucfirst()+'</option>';
            }else if(item.media_component == 2) {
              templateName += '<option value="'+item.template_id+'" ';
              templateName += 'data-uploadedContentPath="'+templatePath+
              '/assets/video/" data-uploadFolderName="'+item.template_path+'" ';
              templateName += 'data-mediacomponent="'+
              item.media_component+'" data-templatePath="'+templatePath +
              item.template_path +'" data-ref-val="'+item.template_type+'">'+
              item.template_name.ucfirst()+'</option>';
            }else {
              templateName += '<option value="'+item.template_id+'" ';
              templateName += 'data-uploadedContentPath="'+templatePath+
              '/assets/" data-uploadFolderName="'+item.template_path+'" ';
              templateName += 'data-mediacomponent="'
              +item.media_component+'" data-templatePath="'+templatePath +
              item.template_path +'" data-ref-val="'+item.template_type+'">'+
              item.template_name.ucfirst()+'</option>';
            }
          });
          socket.emit('setTemplateName', {
            setTemplateName: templateName
          });
        }
      });
    });

    /*
     * All Recurring Message List
     */
    socket.on('getRecurringMessageList', function(data){
      let conditions = {
        where: {
          message_type_id: 1,
          is_deleted: 0
        }
      };
      let what = [];
      getSelectMessages('cmc_message', what, conditions, (rmErr, rmRes) => {
        if(rmRes) {
          getRecurringMessageHtmlView(rmRes,
            (htmlErr, recurringMessageListView) => {
            console.log('Render Recurring Message List View.');
            if(recurringMessageListView) {
              socket.emit('renderRecurringMessageListView', {
                recurringMessageListView: recurringMessageListView
              });
            }
          });
        }else{
          socket.emit('renderRecurringMessageListView',
           { 'recurringMessageListView':
           '<p data-notifyMessage>'+
           'Currently, there are no "Recurring Message" available.</p>'});
        }
      });
    });

    /*
     * All Just Message List
     */
    socket.on('getJustMessageList', function(data){
      let conditions = {
        where: {
          message_type_id: 4,
          is_deleted: 0
        }
      };
      let what = [];
      getSelectMessages('cmc_message', what, conditions, (jmErr, jmRes) => {
        if(jmRes) {
          getJustMessageHtmlView(jmRes, (htmlErr, justMessageListView) => {
            console.log('Render Just Message List View.');
            if(justMessageListView) {
              socket.emit('renderJustMessageListView', {
                justMessageListView: justMessageListView
              });
            }
          });
        }else{
          socket.emit('renderJustMessageListView',
           { 'justMessageListView':
           '<p data-notifyMessage>'+
           'Currently, there are no "Message" available.</p>'});
        }
      });
    });

    /*
     * All Group Message List
     */
    socket.on('getGroupMessageList', function(data){
      let conditions = {
        where: {
          message_type_id: 2,
          is_deleted: 0
        }
      };
      let what = [];
      getSelectMessages('cmc_message', what, conditions, (gmErr, gmRes) => {
        if(gmRes) {
          getGroupMessageHtmlView(gmRes, (htmlErr, groupMessageListView) => {
            console.log('Render Group Message List View.');
            if(groupMessageListView) {
              socket.emit('renderGroupMessageListView', {
                groupMessageListView: groupMessageListView
              });
            }
          });
        }else{
          socket.emit('renderGroupMessageListView',
           { 'groupMessageListView':
           '<p data-notifyMessage>'+
           'Currently, there are no "Group Message" available.</p>'});
        }
      });
    });

    /*
     * All Notification Message List
     */
    socket.on('getNotificationMessageList', function(data){
      let conditions = {
        where: {
          message_type_id: 3,
          is_deleted: 0
        }
      };
      let what = [];
      getSelectMessages('cmc_message', what, conditions, (nmErr, nmRes) => {
        if(nmRes) {
          getNotificationMessageHtmlView(nmRes,
            (htmlErr, notificationMessageListView) => {
            console.log('Render Notification Message List View.');
            if(notificationMessageListView) {
              socket.emit('renderNotificationMessageListView', {
                notificationMessageListView: notificationMessageListView
              });
            }
          });
        }else{
          socket.emit('renderNotificationMessageListView',
           { 'notificationMessageListView':
           '<p data-notifyMessage>'+
           'Currently, there are no "Notification Message" available.</p>'});
        }
      });
    });

    /*
     * Add Messages Form
     * addMessage
     */
    socket.on('addMessage', function(data){
      //console.log("AFTER SAVE EVENT FORM : " + data.dataPacket);
      let objData = JSON.parse(data.dataPacket);
      let contentOldFileName = objData.contentOldFileName;
      let contentNewFileName = objData.contentNewFileName;
      let oldTemplateName = objData.oldTemplateName;
      let mediaComponent = objData.mediaComponent;
      delete objData.contentOldFileName;
      delete objData.contentNewFileName;
      delete objData.oldTemplateName;
      delete objData.mediaComponent;
      if(objData.message_type_id == 1){
        var repeatsEveryDay = objData.repeatsEveryDay;
      }
      delete objData.repeatsEveryDay;
      objData['hotel_id'] = config.hotelProperties.hotelid;

      //console.log('SEND JSON FOR INSERT : '+JSON.stringify(objData));
      insertMessages('cmc_message', objData, (mErr, mRes) => {
        if(mRes){
          if(objData.message_type_id == 1) {
            // Recurring Message
            let dataPacket = [];
            let recurringData = {};
            repeatsEveryDay.forEach((item) => {
              recurringData['message_id'] = mRes[0],
              recurringData['recurring_days'] = item.recurring_days,
              recurringData['sent_time'] = item.sent_time,
              recurringData['hotel_id'] = config.hotelProperties.hotelid,
              recurringData['is_active'] = 1,
              recurringData['created_by'] = 1
              dataPacket.push(recurringData);
              recurringData = {};
            });

            //console.log('FINAL ARRAY INSERT INTO DB : '+
            //JSON.stringify(dataPacket));
            insertRecurringMessages('cmc_message_recurring_mapping',
            dataPacket, (iErr, cmcMRRes) => {
              if(cmcMRRes) {
                console.log('Recurring Message Saved Successfully.');
        				socket.emit('addMessage',
                {
                  'res': 1,
                  'addedMessageTypeId': objData.message_type_id
                });
              }
            });

            if(objData.message_format_type == 1) {
              if(mediaComponent == 2){
                let newContentPath = contentUploadPath+'video/'+contentNewFileName;
                let oldContentPath = tempContentUploadPath+contentOldFileName;
                fs.rename(oldContentPath, newContentPath, (err) => {
                    //callback(null, contentNewFileName);
                });
              }
            } else if(objData.message_format_type == 3) {
              let newContentPath = contentUploadPath+'pdf/'+contentNewFileName;
              let oldContentPath = tempContentUploadPath+contentOldFileName;
              fs.rename(oldContentPath, newContentPath, (err) => {
                  //callback(null, contentNewFileName);
              });
            }
          }else if(objData.message_type_id == 2){
            // Group Message
            console.log('Group Message Saved Successfully.');
    				socket.emit('addMessage',
            {
              'res': 1,
              'addedMessageTypeId': objData.message_type_id
            });

            if(objData.message_format_type == 1) {
              if(mediaComponent == 2){
                let newContentPath = contentUploadPath+'video/'+contentNewFileName;
                let oldContentPath = tempContentUploadPath+contentOldFileName;
                fs.rename(oldContentPath, newContentPath, (err) => {
                    //callback(null, contentNewFileName);
                });
              }
            } else if(objData.message_format_type == 3) {
              let newContentPath = contentUploadPath+'pdf/'+contentNewFileName;
              let oldContentPath = tempContentUploadPath+contentOldFileName;
              fs.rename(oldContentPath, newContentPath, (err) => {
                  //callback(null, contentNewFileName);
              });
            }
          }else if(objData.message_type_id == 3){
            // Notification Message
            console.log('Notification Message Saved Successfully.');
    				socket.emit('addMessage',
            {
              'res': 1,
              'addedMessageTypeId': objData.message_type_id
            });
          }else if(objData.message_type_id == 4){
            // Juts Message
            console.log('Message Saved Successfully.');
    				socket.emit('addMessage',
            {
              'res': 1,
              'addedMessageTypeId': objData.message_type_id
            });

            if(objData.message_format_type == 1) {
              if(mediaComponent == 2){
                let newContentPath = contentUploadPath+'video/'+contentNewFileName;
                let oldContentPath = tempContentUploadPath+contentOldFileName;
                fs.rename(oldContentPath, newContentPath, (err) => {
                    //callback(null, contentNewFileName);
                });
              }
            } else if(objData.message_format_type == 3) {
              let newContentPath = contentUploadPath+'pdf/'+contentNewFileName;
              let oldContentPath = tempContentUploadPath+contentOldFileName;
              fs.rename(oldContentPath, newContentPath, (err) => {
                  //callback(null, contentNewFileName);
              });
            }
          }
        }
      });
    });

    /*
     * Add Messages Form
     * addMessage
     */
    socket.on('removeTemporaryUploadedContent', function(data){
      console.log('REMOVE TEMPORARY UPLOADED FILES ::::: '+
      tempContentUploadPath+data.fileName);
      fs.unlink(tempContentUploadPath+data.fileName);
    })

    /*
     * Edit Messages Form
     * editMessage
     */
    socket.on('editMessage', function(data){
      //console.log("AFTER SAVE EVENT FORM : " + data.dataPacket);
      let objData = JSON.parse(data.dataPacket);
      let contentOldFileName = objData.contentOldFileName;
      let contentNewFileName = objData.contentNewFileName;
      let oldTemplateName = objData.oldTemplateName;
      let mediaComponent = objData.mediaComponent;
      delete objData.contentOldFileName;
      delete objData.contentNewFileName;
      delete objData.oldTemplateName;
      delete objData.mediaComponent;

      if(objData.message_type_id == 1){
        var repeatsEveryDay = objData.repeatsEveryDay;
      }
      let messageID = objData.message_id;
      delete objData.repeatsEveryDay;
      objData['hotel_id'] = config.hotelProperties.hotelid;
      let conditions = {
        where: {
          message_id: objData.message_id
        }
      };

      //console.log('SEND JSON FOR INSERT : '+JSON.stringify(objData));
      updateMessages('cmc_message', conditions, objData, (mErr, mRes) => {
        if(mRes){
          if(objData.message_type_id == 1) {
            // Recurring Message
            let deleteParam = {
              'message_id': messageID
            }
            deleteRecurringMessages('cmc_message_recurring_mapping',
            deleteParam, (iErr, dRes) => {
              if(dRes){
                delete objData.message_id;

                let dataPacket = [];
                let recurringData = {};
                repeatsEveryDay.forEach((item) => {
                  recurringData['message_id'] = messageID,
                  recurringData['recurring_days'] = item.recurring_days,
                  recurringData['sent_time'] = item.sent_time,
                  recurringData['hotel_id'] = config.hotelProperties.hotelid,
                  recurringData['is_active'] = 1,
                  recurringData['created_by'] = 1
                  dataPacket.push(recurringData);
                  recurringData = {};
                });

                // console.log('FINAL ARRAY INSERT INTO DB : '+
                // JSON.stringify(dataPacket));
                insertRecurringMessages('cmc_message_recurring_mapping',
                dataPacket, (iErr, cmcERRes) => {
                  if(cmcERRes) {
                    console.log('Message Updated Successfully.');
                    socket.emit('editMessage', { 'res': 1 });
                  }
                });
              }
            });

            if(objData.message_format_type == 1) {
              if(mediaComponent == 2){
                let newContentPath = contentUploadPath+'video/'+contentNewFileName;
                let oldContentPath = tempContentUploadPath+contentOldFileName;
                fs.rename(oldContentPath, newContentPath, (err) => {
                    //callback(null, contentNewFileName);
                });
              }
            } else if(objData.message_format_type == 3) {
              let newContentPath = contentUploadPath+'pdf/'+contentNewFileName;
              let oldContentPath = tempContentUploadPath+contentOldFileName;
              fs.rename(oldContentPath, newContentPath, (err) => {
                  //callback(null, contentNewFileName);
              });
            }
          }else if(objData.message_type_id == 2){
            // Group Message
            console.log('Group Message Updated Successfully.');
    				socket.emit('editMessage', { 'res': 1 });

            if(objData.message_format_type == 1) {
              if(mediaComponent == 2){
                let newContentPath = contentUploadPath+'video/'+contentNewFileName;
                let oldContentPath = tempContentUploadPath+contentOldFileName;
                fs.rename(oldContentPath, newContentPath, (err) => {
                    //callback(null, contentNewFileName);
                });
              }
            } else if(objData.message_format_type == 3) {
              let newContentPath = contentUploadPath+'pdf/'+contentNewFileName;
              let oldContentPath = tempContentUploadPath+contentOldFileName;
              fs.rename(oldContentPath, newContentPath, (err) => {
                  //callback(null, contentNewFileName);
              });
            }
          }else if(objData.message_type_id == 3){
            // Notification Message
            console.log('Notification Message Updated Successfully.');
    				socket.emit('editMessage', { 'res': 1 });
          }else if(objData.message_type_id == 4){
            // Juts Message
            console.log('Message Updated Successfully.');
    				socket.emit('editMessage', { 'res': 1 });

            if(objData.message_format_type == 1) {
              if(mediaComponent == 2){
                let newContentPath = contentUploadPath+'video/'+contentNewFileName;
                let oldContentPath = tempContentUploadPath+contentOldFileName;
                fs.rename(oldContentPath, newContentPath, (err) => {
                    //callback(null, contentNewFileName);
                });
              }
            } else if(objData.message_format_type == 3) {
              let newContentPath = contentUploadPath+'pdf/'+contentNewFileName;
              let oldContentPath = tempContentUploadPath+contentOldFileName;
              fs.rename(oldContentPath, newContentPath, (err) => {
                  //callback(null, contentNewFileName);
              });
            }
          }
        }
      });
    });

    /*
     * Get response of delete message id from posted data
     */
    socket.on('deleteMessage', function(data){
      let updateParam = {
        is_deleted: 1
      };
      let conditions = {
        where: {
          message_id: data.messageId
        }
      };

      deleteMessage('cmc_message', conditions, updateParam, (iErr, iRes) => {
        if(iRes){
          console.log('Message Deleted Successfully.');
            socket.emit('deleteMessage', { 'res': data.messageId });
        }
      });
    });

    /************************ End Hotel Messages *************************/
  },

  /*
   * REST API for get all messages called from outside
   */
  messages: (callback) => {
    console.log('Entered in message processor');
    let allMessages = {};
    let messages = [];
    
    let conditions = {
      where: {
        delivery_status: 0
      }
    };
    
    let what = [];
    getSelectMessages('v_cmc_message_delivery_mapping', what, conditions,
    (evErr, evRes) => {
      if(evRes) {
        let puConditions = {
          where: {
            is_reachable: 1,
            device_category: 'ipad'
          }
        };
        getSelectMessages('v_push_update', [], puConditions, 
        (puErr, puRes) => {
          composeMessagesJSON(evRes, puRes, (iErr, messagesJSON) => {
            if(messagesJSON) {
              //allMessages['messages'] = messagesJSON;
              //console.log(messagesJSON);
              //messages.push(messagesJSON);
              callback(null, messagesJSON);
            }
          });
        });
      } else {
        callback(evErr, null);
      }
    });
  },
  msgToHDValet: (callback) => {
    let allMessages = {};
    let messages = [];
    // Event Data
    let conditions = {
      where: {
        //is_deleted: 0,
        delivery_status: 0
      }
    };
    
    let what = [];
    getSelectMessages('v_cmc_message_delivery_mapping', what, conditions,
      (evErr, evRes) => {
        if(evRes) {
          console.log(evRes);
        } else {
          return false;
        }
      });
  }
}

// END Socket Connect

/*
 * Compose JSON of events for API response
 */
let composeMessagesJSON = (data, pushUpdateRecords, callback) => {
  let messagesJSON = {};
  let todayJSON = {};
  let datetimeJSON = {};
  let timeJSON = {};
  let messages = [];
  let today = [];
  let datetime = [];
  let time = [];
  let event_metadata = [];
  let key = [];
  let dataPacket = [];
  let shell = [];

  try {
    for (var i = 0; i < pushUpdateRecords.length; i++) {
      data.forEach((item) => {
          if(item.key_id == pushUpdateRecords[i].key_id 
            && (pushUpdateRecords[i].device_category).toLowerCase()!=='controller') {
  
            if(item.message_type_id != 1) {
              messagesJSON['message_id'] = item.message_id + '-' + item.message_id;
            } else {
              messagesJSON['message_id'] = item.message_id + '-' +
               item.delivery_map_id;
            }

            messagesJSON['delivery_map_id'] = item.delivery_map_id;
            if(item.is_send_as_notification == 1) {
              messagesJSON['type'] = 'notification';
            } else {
              messagesJSON['type'] = 'message';
            }
            messagesJSON['subject'] = item.message_body;
            if(item.message_format_type == 1){
              messagesJSON['description'] = item.message_body;
            } else {
              messagesJSON['description'] = item.short_description;
            }
  
            if(item.template_path!='' && item.template_path!='NA'){
              messagesJSON['detail_url'] = templatePath + item.template_folder_name +
                       '/' + item.template_path;
            } else {
              messagesJSON['detail_url'] = '';
            }
  
            // messagesJSON['message_start_date'] = moment(item.start_date,
            //    "M/D/YYYY H:mm").unix();
            // messagesJSON['message_end_date'] = moment(item.until_date,
            //     "M/D/YYYY H:mm").unix();

            messagesJSON['time_stamp'] = moment(item.created_on,
                "YYYY-MM-DD HH:mm:ss").unix(); // Need to exploe the use of this
  
            dataPacket.push({
              "device_category": pushUpdateRecords[i].device_category,
              "device_id": pushUpdateRecords[i].in_room_device_id,
              "room_type": pushUpdateRecords[i].room_type_name,
              "ip": (pushUpdateRecords[i].ip).split(','),
              "port": pushUpdateRecords[i].update_port,
              "messages": [messagesJSON]
            });
  
            shell.push({
              "keyId": pushUpdateRecords[i].key_id,
              "key_number": pushUpdateRecords[i].number,
              "comm_key": pushUpdateRecords[i].communication_token,
              "data": dataPacket
            });
  
            messages.push(shell);
            messagesJSON = {};
            dataPacket = [];
          }
      });
    }
  } catch(err) {
    console.log(err.message);
    callback(err.message, null);
  }
  console.log('=========================');
  console.log(messages);
  console.log('=========================');
  callback(null, messages);
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


 /****************************************************************************
  ***************** DB related function of messages Start ********************
  ****************************************************************************/

  /*
   * Get All Events data from model and send for create HTML
   */
  let getSelectMessages = (tableName, what, conditions, callback) => {
    messagesMaster.select(tableName, what, conditions, (mErr, mRes) => {
      if (mRes) {
        callback(null, mRes);
      }
    });
  }

  /*
   * Insert data into event table
   * If events type is recurring then
   * data must be insert into cmc_events_recurring_mapping table
   */
   let insertMessages = (tableName, insertParam, callback) => {
      messagesMaster.insert(tableName, insertParam, (mErr, mRes) => {
        if (mRes) {
          callback(null, mRes);
        }
      });
   }

   /*
    * Insert data into messages recurring table
    * If message type is recurring then
    * data must be insert into cmc_message_recurring_mapping table
    */
   let insertRecurringMessages = (tableName, insertParam, callback) => {
      messagesRecurringMaster.insert(tableName, insertParam, (iErr, iRes) => {
        if (iRes) {
          callback(null, iRes);
        }
      });
   }

   /*
      * Update data from message table
      * If message type is recurring then
      * data must be updated from cmc_message_recurring_mapping table
      */
     let updateMessages = (tableName, conditions, updateParam, callback) => {
       messagesMaster.update(tableName, conditions, updateParam,
         (iErr, iRes) => {
         if(iRes) {
           callback(null, iRes);
         }
       });
     }

     /*
      * Parmanent Delete data from message recurring table
      * If message type is recurring then
      * data must be deleted from cmc_message_recurring_mapping table
      */
     let deleteRecurringMessages = (tableName, deleteParam, callback) => {
       messagesRecurringMaster.deleteP(tableName, deleteParam, (iErr, iRes) => {
         if(iRes) {
           callback(null, iRes);
         }
       });
     }

   /*
    * Delete data from message table
    * If message type is recurring then
    * data must be deleted from cmc_message_recurring_mapping table
    */
   let deleteMessage = (tableName, conditions, updateParam, callback) => {
     messagesMaster.delete(tableName, conditions, updateParam, (iErr, iRes) => {
       if(iRes) {
         callback(null, iRes);
       }
     });
   }

  // Fetch All Wings from wings table
  let getAllWing = (tableName, what, conditions, callback) => {
     commonMaster.select(tableName, what, conditions, (wErr, wRes) => {
       if (wRes) {
         callback(null, wRes);
       }
     });
   }

  // Fetch All Floor of all wings from floors table
  let getAllFloor = (tableName, what, conditions, callback) => {
     commonMaster.select(tableName, what, conditions, (fErr, fRes) => {
       if (fRes) {
         callback(null, fRes);
       }
     });
   }

  // Fetch All Floor of all wings from floors table
  let getAllKey = (tableName, what, conditions, callback) => {
     commonMaster.select(tableName, what, conditions, (kErr, kRes) => {
       if (kRes) {
         callback(null, kRes);
       }
     });
   }

  // Fetch All Templates Type from cmc_config table
  let getAllTemplateType = (tableName, what, conditions, callback) => {
     commonMaster.select(tableName, what, conditions, (tErr, tRes) => {
       if (tRes) {
         callback(null, tRes);
       }
     });
   }

   // Fetch All Templates Name from cmc_template table
   let getAllTemplateName = (tableName, what, conditions, callback) => {
      commonMaster.select(tableName, what, conditions, (tErr, tRes) => {
        if (tRes) {
          callback(null, tRes);
        }
      });
    }

    // Fetch All Group Code from pmsi_guests table
    let getAllGroupCode = (tableName, what, conditions, callback) => {
       commonMaster.getGroupCode(tableName, what, conditions, (tErr, tRes) => {
         if (tRes) {
           callback(null, tRes);
         }
       });
     }

/**************************************************************************
 **************** DB related function of messages End *********************
 **************************************************************************/

/*******************************************************************
 **************** Message Section Html View ************************
 *******************************************************************/

 /*
  * Render All Message Type (Message Left Panel View)
  */
let getMessageTypesHTMLView = (callback) => {

  let messageListView = '';
  messageListView += '<div class="panel mb-15">';
  messageListView += '<div class="category-content compose-message">';
  messageListView += '<a href="javascript:void(0)" ';
  messageListView += 'class="btn btn-block newMsgCompose btn-themeClr btn-xs" data-addMessage>';
  messageListView += 'New Message</a> </div>';
  messageListView += '</div>';
  messageListView += '<div class="panel">';
  messageListView += '<div class="sidebar-default communication-sidebar no-padding">';
  messageListView += '<ul class="navigation navigation-alt dv-msgSidebar navigation-accordion no-padding-bottom">';
  messageListView += '<li class="active" data-messagetypeid="1">';
  messageListView += '<a href="#tab1" data-toggle="tab" id="recurringMessage">';
  messageListView += '<i class="icon-ic_schedule"></i>';
  messageListView += 'Recurring Messages</a>';
  messageListView += '</li>';

  messageListView += '<li data-messagetypeid="2"><a href="#tab3" data-toggle="tab" id="groupMessage">';
  messageListView += '<i class="icon-ic_group2">';
  messageListView += '</i> Group Messages</a>';
  messageListView += '</li>';
  messageListView += '<li data-messagetypeid="3"><a href="#tab4" data-toggle="tab" id="notificationMessage">';
  messageListView += '<i class="icon-ic_oneway">';
  messageListView += '</i> Notifications</a>';
  messageListView += '</li>';
  messageListView += '<li data-messagetypeid="4"><a href="#tab2" data-toggle="tab" id="justMessage"><i class="icon-ic_event"></i> Messages</a></li>';

  messageListView += '</ul>';
  messageListView += '</div>';
  messageListView += '</div>';

  callback(null, messageListView);
}

/*
 * Render HTML View of Add Messages
 */
let getAddMessageHtmlView = (data, callback) => {
  var addMessageFormView = '';

  addMessageFormView += '<form class="form-validation form-validate form-horizontal newMsgForm ui-formwizard" method="post" action="javascript:void(0)" id="compose-msg-form" novalidate="novalidate" name="compose-msg-form" data-addMessageForm>';
  addMessageFormView += '<fieldset class="step pa-0" id="step1" style="display: block;">';
  addMessageFormView += '<div class="col-md-12">';
  addMessageFormView += '<div class="panel panel-white">';
  addMessageFormView += '<div class="panel-body customScroll pt-12 no-footer" style="height: 650px; min-height: 650px;">';
  addMessageFormView += '<div class="form-group">';
  addMessageFormView += '<label class="col-md-3 control-label">Message Type </label>';
  addMessageFormView += '<div class="col-md-9">';

  addMessageFormView += '<label class="radio-inline radio-left">';
  if(data.messageType == 1) {
    addMessageFormView += '<input name="messageType" class="styled" id="recurMsg" value="1" type="radio" checked>';
  }else{
    addMessageFormView += '<input name="messageType" class="styled" id="recurMsg" value="1" type="radio">';
  }
  addMessageFormView += 'Recurring Message </label>';




  addMessageFormView += '<label class="radio-inline radio-left">';
  if(data.messageType == 2) {
    addMessageFormView += '<input name="messageType" class="styled" id="groupMsg" value="2" type="radio" checked>Group Message </label>';
  }else{
    addMessageFormView += '<input name="messageType" class="styled" id="groupMsg" value="2" type="radio">Group Message </label>';
  }

  addMessageFormView += '<label class="radio-inline radio-left">';
  if(data.messageType == 3) {
    addMessageFormView += '<input name="messageType" class="styled" id="notifyMsg" value="3" type="radio" checked>Notifications  </label>';
  }else{
    addMessageFormView += '<input name="messageType" class="styled" id="notifyMsg" value="3" type="radio">Notifications  </label>';
  }

  addMessageFormView += '<label class="radio-inline radio-left">';
  if(data.messageType == 4) {
    addMessageFormView += '<input name="messageType" class="styled" id="justMsg" value="4" type="radio" checked>Messages </label>';
  }else {
    addMessageFormView += '<input name="messageType" class="styled" id="justMsg" value="4" type="radio">Messages </label>';
  }


  addMessageFormView += '</div>';
  addMessageFormView += '</div>';

  addMessageFormView += '<div class="form-group optionalMsgField" data-recur="yes" data-just-msg="yes" data-group="no" data-notification="yes">';
  addMessageFormView += '<label class="col-md-3 control-label">Recipient Wing(s)</label>';
  addMessageFormView += '<div class="col-md-9">';
  addMessageFormView += '<select name="wing_id" id="wing_id" class="select-search" required="required" data-msg="Please select Wing" multiple="multiple">';
  addMessageFormView += '<option value="all" data-ref-val="" selected>All Wings</option>';
  data.wings.forEach((item) =>{
      addMessageFormView += '<option value="'+item.wing_id+'">'+item.name+'</option>';
  });

  addMessageFormView += '</select>';
  addMessageFormView += '</div>';
  addMessageFormView += '</div>';
  addMessageFormView += '<div class="form-group optionalMsgField" data-recur="yes" data-just-msg="yes" data-group="no" data-notification="yes">';
  addMessageFormView += '<label class="col-md-3 control-label">Recipient Floor(s)</label>';
  addMessageFormView += '<div class="col-md-9">';
  addMessageFormView += '<select name="floor_id" id="floor_id" class="select-search" required="required" data-msg="Please select Floor" multiple="multiple">';
  addMessageFormView += '<option value="all" data-ref-val="all" selected>All Floors</option>';
  data.floors.forEach((item) =>{
      addMessageFormView += '<option value="'+item.floor_id+'" data-ref-val="'+item.wing_id+'">'+item.name+'</option>';
  });

  addMessageFormView += '</select>';
  addMessageFormView += '</div>';
  addMessageFormView += '</div>';
  addMessageFormView += '<div class="form-group optionalMsgField" data-recur="yes" data-just-msg="yes" data-group="no" data-notification="yes">';
  addMessageFormView += '<label class="col-md-3 control-label">Recipient Room(s) <span style="color:red;">*</span></label>';
  addMessageFormView += '<div class="col-md-9">';
  addMessageFormView += '<select multiple="" data-placeholder="Select Rooms" id="key_id" name="key_id" class="select" required="required" data-msg="Please select Room">';
  addMessageFormView += '<option value="all" selected>All Rooms</option>';
  data.keys.forEach((item) =>{
      addMessageFormView += '<option value="'+item.key_id+'" data-ref-val="'+item.floor_id+'">'+item.number+'</option>';
  });

  addMessageFormView += '</select>';
  addMessageFormView += '</div>';
  addMessageFormView += '</div>';
  addMessageFormView += '<div class="form-group optionalMsgField hide" data-recur="no" data-just-msg="no" data-group="yes" data-notification="no">';
  addMessageFormView += '<label class="col-md-3 control-label">Recipient Group Code</label>';
  addMessageFormView += '<div class="col-md-9">';
  addMessageFormView += '<select class="select-multiple-limited" multiple="" id="group_code" name="group_code">';
  addMessageFormView += '<option value="NA" selected>Please Select Group Code</option>';
  data.groupCode.forEach((item) =>{
    if(item.group_code!="" && item.group_code!=null){
      addMessageFormView += '<option value="'+item.group_code+'">'+item.group_code+'</option>';
    }
  });
  addMessageFormView += '</select>';
  addMessageFormView += '</div>';
  addMessageFormView += '</div>';

  addMessageFormView += '<div class="form-group optionalMsgField hide" data-recur="no" data-just-msg="no" data-group="yes" data-notification="no">';
  addMessageFormView += '<label class="col-md-3 control-label">Recipient Group Name</label>';
  addMessageFormView += '<div class="col-md-9">';
  addMessageFormView += '<input type="text" name="group_name" id="group_name" class="form-control" placeholder="Group Name">';
  addMessageFormView += '</div>';
  addMessageFormView += '</div>';


  addMessageFormView += '<div class="form-group optionalMsgField hide" data-recur="no" data-just-msg="yes" data-group="yes" data-notification="yes">';
  addMessageFormView += '<label class="col-md-3 mt-10 control-label">Send When</label>';
  addMessageFormView += '<div class="col-md-9 newMsgForm-1">';
  addMessageFormView += '<div class="radio-inline">';
  addMessageFormView += '<label class="now">';
  addMessageFormView += '<input type="radio" name="is_schedule" class="styled schedule_type" value="0" checked>';
  addMessageFormView += 'Now </label>';
  addMessageFormView += '</div>';
  addMessageFormView += '<div class="radio-inline">';
  addMessageFormView += '<label class="later">';
  addMessageFormView += '<input type="radio" name="is_schedule" class="styled checkedDateTime schedule_type" value="1">';
  addMessageFormView += 'Later</label>';
  addMessageFormView += '</div>';
  addMessageFormView += '</div>';
  addMessageFormView += '<div class="col-md-9 col-md-offset-3 dateTime" style="display: none">';
  addMessageFormView += '<div class="row">';
  addMessageFormView += '<div class="col-md-6">';
  addMessageFormView += '<div class="input-group">';
  addMessageFormView += '<span class="input-group-addon">DATE</span>';

  addMessageFormView += '<input type="text" class="form-control" id="scheduleMsgStartDate" name="scheduleMsgStartDate" placeholder="Select Date" style="text-align: right" value="'+getCurrentDate()+'">';
  addMessageFormView += '</div>';
  addMessageFormView += '</div>';
  addMessageFormView += '<div class="col-md-6">';
  addMessageFormView += '<div class="input-group">';
  addMessageFormView += '<span class="input-group-addon">TIME</span>';
  addMessageFormView += '<input type="text" class="form-control messageSendTime" id="messageSendTime" name="messageSendTime" placeholder="Select Time" value="" style="text-align: right"/>';
  addMessageFormView += '</div>';
  addMessageFormView += '</div>';
  addMessageFormView += '</div>';
  addMessageFormView += '</div>';
  addMessageFormView += '</div>';
  addMessageFormView += '<div class="form-group optionalMsgField hide" data-recur="no" data-just-msg="no" data-group="no" data-notification="yes">';
  addMessageFormView += '<label class="col-md-3 control-label">Message <span style="color:red;">*</span></label>';
  addMessageFormView += '<div class="col-md-9">';
  addMessageFormView += '<textarea name="short_description" id="short_description" class="form-control" placeholder="Please enter your message here"></textarea>';
  addMessageFormView += '<span id="short_desc" style="color:red"></span>';
  addMessageFormView += '</div>';
  addMessageFormView += '</div>';


  addMessageFormView += '<div class="form-group optionalMsgField" data-recur="yes" data-just-msg="no" data-group="no" data-notification="no">';
  addMessageFormView += '<label class="col-md-3 control-label">Start Date <span style="color:red;">*</span></label></label>';
  addMessageFormView += '<div class="col-md-4">';
  addMessageFormView += '<div class="input-group">';
  addMessageFormView += '<span class="input-group-addon">Date</span>';
  addMessageFormView += '<input type="text" class="form-control" id="messageStartDate" value="'+getCurrentDate()+'" name="messageStartDate" placeholder="Select Date" style="text-align: right" required="">';
  addMessageFormView += '</div>';
  addMessageFormView += '</div>';
  addMessageFormView += '</div>';
  addMessageFormView += '<div class="form-group optionalMsgField" data-recur="yes" data-just-msg="no" data-group="no" data-notification="no">';
  addMessageFormView += '<label class="col-md-3 control-label">End Date</label>';

  addMessageFormView += '<div class="col-md-4 mt-5 untilDate" style="display:none;">';
  addMessageFormView += '<div class="input-group">';
  addMessageFormView += '<span class="input-group-addon">Date</span>';
  addMessageFormView += '<input type="text" id="messageEndDate" class="form-control" placeholder="Select Date" name="messageEndDate" style="text-align: right">';
  addMessageFormView += '</div>';
  addMessageFormView += '</div>';
  addMessageFormView += '<div class="col-md-4">';
  addMessageFormView += '<div class="checkbox-inline">';
  addMessageFormView += '<label>';
  addMessageFormView += '<input type="checkbox" name="forever" class="styled" checked> Forever </label>';
  addMessageFormView += '</div>';
  addMessageFormView += '</div>';


  addMessageFormView += '</div>';

  addMessageFormView += '<div class="form-group optionalMsgField" data-recur="yes" data-just-msg="no" data-group="no" data-notification="no">';
  addMessageFormView += '<label class="col-md-3 control-label">Repeat Every </label>';
  addMessageFormView += '<div class="col-md-9">';
  // Start From Monday To Sunday Event Start and End Time for Recurring Events
  for(let i=1; i<=7; i++) {

    addMessageFormView += '<div class="repeatEverySection row clearfix" id="message_day-'+i+'">';
    addMessageFormView += '<div class="col-md-2">';
    addMessageFormView += '<div class="checkbox-inline">';
    addMessageFormView += '<label>';
    addMessageFormView += '<input type="checkbox" name="days[]" class="styled message_recurring_days" value="'+i+'">'+getDayNameFromNumber(i, "full")+' ';
    addMessageFormView += '</label>';
    addMessageFormView += '</div>';
    addMessageFormView += '</div>';
    addMessageFormView += '<div class="col-md-10">';
    addMessageFormView += '<div class="row RepeatTimeSection">';
    addMessageFormView += '<div class="col-md-5">';
    addMessageFormView += '<div class="input-group">';
    addMessageFormView += '<span class="input-group-addon">TIME</span>';
    addMessageFormView += '<input type="text" class="form-control messageSendTime messageSendTime-'+i+'" name="messageSendTime-day-'+i+'[]" placeholder="Select Time" style="text-align: right" value=""/>';
    addMessageFormView += '</div>';
    addMessageFormView += '</div>';

    // addMessageFormView += '<div class="col-md-5">';
    // addMessageFormView += '<div class="input-group">';
    // addMessageFormView += '<span class="input-group-addon">End Time</span>';
    // addMessageFormView += '<input type="text" id="" class="form-control eventEndTime eventEndTime-'+i+'" name="eventEndTime-day-'+i+'[]" placeholder="Select Time" style="text-align: right" value=""/>';
    // addMessageFormView += '</div>';
    // addMessageFormView += '</div>';

    addMessageFormView += '<div class="col-md-2">';
    addMessageFormView += '<a class="btn dv-custom-btn btn-xs" id="edit-addMessageTime" data-addEditMessageTime="'+i+'" href="javascript:void(0);">';
    addMessageFormView += '<i class="icon-plus2"></i>';
    addMessageFormView += '</a>';
    addMessageFormView += '</div>';
    addMessageFormView += '</div>';
    addMessageFormView += '<div id="repeat-messagedayTime-container-day-'+i+'">';

    addMessageFormView += '</div>';
    addMessageFormView += '</div>';
    addMessageFormView += '</div>';
  }
  // Complete Repeat Every Section End

  addMessageFormView += '</div>';
  addMessageFormView += '</div>';
  addMessageFormView += '<div class="form-group optionalMsgField hide" data-recur="no" data-just-msg="yes" data-group="no" data-notification="no">';
  addMessageFormView += '<label class="col-md-3 control-label">Send as notification</label>';
  addMessageFormView += '<div class="col-md-9">';
  addMessageFormView += '<div class="col-md-12 pl-0">';
  addMessageFormView += '<div class="checkbox-inline">';
  addMessageFormView += '<label>';
  addMessageFormView += '<input type="checkbox" class="styled" name="is_notification" value="1">Yes, this message is to be sent as pop-up as well. </label>';
  addMessageFormView += '</div>';
  addMessageFormView += '</div>';
  addMessageFormView += '</div>';
  addMessageFormView += '</div>';
  addMessageFormView += '</div>';
  addMessageFormView += '</div>';
  addMessageFormView += '</div>';
  addMessageFormView += '</fieldset>';


  addMessageFormView += '<fieldset class="step no-padding" id="add-step2" style="display: none;">';

  addMessageFormView += '<div class="fadeIn animated">';
  addMessageFormView += '<div class="col-md-3">';
  addMessageFormView += '<div class="panel panel-white">';
  addMessageFormView += '<div class="panel-heading">';
  addMessageFormView += '<h5 class="panel-title">Step 2: Create Message<a class="heading-elements-toggle"><i class="icon-more"></i></a></h5>';
  addMessageFormView += '<div class="heading-elements"></div>';
  addMessageFormView += '</div>';
  addMessageFormView += '<div class="panel-body no-footer customScroll pt-12" style="height: 650px; min-height: 650px;">';
  addMessageFormView += '<div class="collapse in">';
  addMessageFormView += '<div class="form-group">';
  addMessageFormView += '<label class="label-custom agenda_format">Message Format<span style="color:red"></span>:</label>';
  addMessageFormView += '<div>';
  addMessageFormView += '<label class="radio-inline radio-left">';
  addMessageFormView += '<input name="agenda" class="styled agenda" type="radio"  checked="" value="1">';
  addMessageFormView += 'Template  </label>';
  addMessageFormView += '<label class="radio-inline radio-left upload_img">';
  addMessageFormView += '<input name="agenda" class="styled agenda" type="radio" value="2" data-uploadedContentPath="'+templatePath+'/assets/img/" data-uploadFolderName="sample-template" data-templatePath="'+templatePath+'sample-template">';
  addMessageFormView += 'Image  </label>';
  addMessageFormView += '<label class="radio-inline radio-left upload_pdf" style="">';
  addMessageFormView += '<input name="agenda" class="styled agenda" type="radio" value="3" data-uploadedContentPath="'+templatePath+'/assets/pdf/" data-uploadFolderName="sample-template" data-templatePath="'+templatePath+'sample-template">';
  addMessageFormView += 'PDF </label></div>';
  addMessageFormView += '<input type="hidden" id="temporaryData" data-temporaryfilename data-temporarypath="'+temporaryUploadPath+'">';
  addMessageFormView += '</div>';
  addMessageFormView += '<div class="form-group" id="select_template">';
  addMessageFormView += '<label class="label-custom">Template Type <span style="color:red">*</span>:</label>';
  addMessageFormView += '<select class="select-withoutsearch" id="templateType" data-placeholder="Please Select Template" required="true" >';
  addMessageFormView += '<option value="NA">Please Select Template</option>';

  let prepareTemplateType = data.templatesType[0].config_val;
  prepareTemplateType = JSON.parse(prepareTemplateType);
  prepareTemplateType.forEach((item) =>{
    addMessageFormView += '<option value="'+item.key+'">'+item.value+'</option>';
  })

  addMessageFormView += '</select>';
  addMessageFormView += '</div>';
  addMessageFormView += '<div class="col-md-12 tmpError" style="color:red;"></div>';

  addMessageFormView += '<div class="form-group" id="select_template_name">';
  addMessageFormView += '<label class="label-custom">Template Name <span style="color:red">*</span>:</label>';
  addMessageFormView += '<select class="select-withoutsearch" id="templateName" data-placeholder="Please Select Template Name" required="true" >';
  addMessageFormView += '<option value="NA">Please Select Template Name</option>';
  // data.templatesName.forEach((item) =>{
  //     addMessageFormView += '<option value="'+item.template_id+'" data-uploadFolderName="'+item.template_path+'" data-templatePath="'+templatePath + item.template_path +'" data-ref-val="'+item.template_type+'">'+item.template_name.ucfirst()+'</option>';
  // });

  addMessageFormView += '</select>';
  addMessageFormView += '</div>';

  addMessageFormView += '<div class="form-group" id="select_files" style="display:none;">';
  addMessageFormView += '<label class="label-custom">Upload Image <span style="color:red">*</span>:</label>';
  addMessageFormView += '<div class="inputFileUploadButton btn btn-default dv-custom-btn dv-btn-sm btn-xs btn-file legitRipple pull-right col-md-6">';
  addMessageFormView += '<p class="custom-para">Upload Photo</p>';
  addMessageFormView += '<input id="inputMessageImage" type="file" class="uploadMessageImage upload" disabled="disabled">';
  addMessageFormView += '</div>';
  addMessageFormView += '</div>';
  addMessageFormView += '<div class="col-md-12 imgError" style="color:red;"></div>';
  addMessageFormView += '<div class="form-group" id="select_pdf" style="display:none;">';
  addMessageFormView += '<label class="label-custom">Upload Pdf <span style="color:red">*</span>:</label>';
  addMessageFormView += '<div class="inputFileUploadButton btn btn-default dv-custom-btn dv-btn-sm btn-xs btn-file legitRipple pull-right col-md-6">';
  addMessageFormView += '<p class="custom-para btnPdfUpload">Upload PDF</p>';
  addMessageFormView += '<input id="inputMessagePdf" type="file" class="pdfupload uploadMessagePdf" disabled="disabled">';
  addMessageFormView += '</div>';
  addMessageFormView += '<div class="col-md-12 pdfError" style="color:red;"></div>';
  addMessageFormView += '</div>';
  addMessageFormView += '<div class="form-group imageTempalte" style="display: none;">';
  addMessageFormView += '<label class="label-custom">Banner Image:</label>';

  addMessageFormView += '<div class="btn btn-default dv-custom-btn dv-btn-sm btn-xs btn-file legitRipple pull-right col-md-6">';
  addMessageFormView += '<span id="fileUploadInput"><input id="inputMessageBannerImage" type="file" class="uploadMessageImage upload ui-wizard-content"></span> <span class="hidden-xs"> Upload Photo</span> </div><span class="help-block "></span>';
  addMessageFormView += '<p class="bannerImgError"></p>';
  addMessageFormView += '</div>';
  addMessageFormView += '<div class="form-group videoTempalte" style="display: none">';
  addMessageFormView += '<label class="label-custom">Upload Video:</label>';
  addMessageFormView += '<div class="btn btn-default dv-custom-btn dv-btn-sm btn-xs btn-file legitRipple pull-right col-md-6">';
  addMessageFormView += '<span id="fileUploadInput"><input id="inputMessageBannerVideo" class="fileuploadMsg" data-keys_name="templateVideo" type="file" name="files"></span> <span class="hidden-xs videouplaodBTn"> Upload Video</span> </div><span class="help-block "></span>';
  addMessageFormView += '<p class="bannerVideoError"></p>';
  addMessageFormView += '</div>';
  addMessageFormView += '<div id="readonly-input-field"></div>';
  addMessageFormView += '<div class="form-group short_description hide">';
  addMessageFormView += '<label class="label-custom">Short Description <span style="color:red">*</span></label>';
  addMessageFormView += '<textarea name="media_short_description" id="media_short_description" class="form-control" placeholder="Please provide a short description"></textarea>';
  addMessageFormView += '<span id="short_desc1" style="color:red"></span>';
  addMessageFormView += '</div>';
  addMessageFormView += '</div>';

  addMessageFormView += '</div>';

  addMessageFormView += '</div>';
  addMessageFormView += '</div>';
  <!-- Template Intgration -->
  addMessageFormView += '<div class="col-md-9">';
  addMessageFormView += '<div class="panel panel-white">';
  addMessageFormView += '<div class="panel-heading">';
  addMessageFormView += '<h5 class="panel-title">iPad Live Preview: <span class="help-block" style="display: inline-block; margin: 0">Select templates from the left panel to preview here.</span><a class="heading-elements-toggle"><i class="icon-more"></i></a></h5>';
  addMessageFormView += '<div class="heading-elements">';

  addMessageFormView += '</div>';
  addMessageFormView += '</div>';
  addMessageFormView += '<div class="panel-body pad-0 no-footer" style="height: 650px; min-height: 650px;">';
  addMessageFormView += '<div id="langdivIdPreview" class="ipad-view1 tab-content">';
  addMessageFormView += '<div id="template_placeholder" style="text-align: center;">';
  addMessageFormView += '<img src="'+config.cloud.server.protocol+'://'+cloudServerAddress+'/'+config.projects.name.dashboard+'/assets/dist/img/template_placeholder.jpg">';
  addMessageFormView += '</div>';
  addMessageFormView += '<div id="image_placeholder" class="hide" style="text-align: center;">';
  addMessageFormView += '<img src="'+config.cloud.server.protocol+'://'+cloudServerAddress+'/'+config.projects.name.dashboard+'/assets/dist/img/image_placeholder.jpg">';
  addMessageFormView += '</div>';
  addMessageFormView += '<div id="pdf_placeholder" class="hide" style="text-align: center;">';
  addMessageFormView += '<img src="'+config.cloud.server.protocol+'://'+cloudServerAddress+'/'+config.projects.name.dashboard+'/assets/dist/img/pdf_placeholder.jpg">';
  addMessageFormView += '</div>';
  addMessageFormView += '<div id="pageTemplate">';
  addMessageFormView += '</div>';
  addMessageFormView += '<div id="withImageTemplate">';
  //addMessageFormView += '<div style="margin: 0 auto;text-align: center;"><img id="messageImageTemplate" src=""></div>';
  addMessageFormView += '</div>';
  addMessageFormView += '</div>';
  addMessageFormView += '<div id="pdfView">';

  addMessageFormView += '</div>';
  addMessageFormView += '</div>';
  addMessageFormView += '</div>';
  addMessageFormView += '</div>';
  addMessageFormView += '</div>';
  addMessageFormView += '</fieldset>';


  addMessageFormView += '<div class="form-wizard-actions communication-wizard fadeIn animated">';
  addMessageFormView += '<input class="btn btn-default dv-custom-btn btn-xs legitRipple pull-left ui-formwizard-button" id="message_basic-back" type="reset" value="Back" disabled="disabled">';
  addMessageFormView += '<input class="btn dv-custom-btn btn-xs legitRipple btn-themeClr ui-formwizard-button" id="add_save_message" type="submit" value="Next">';
  addMessageFormView += '</div>';
  addMessageFormView += '<div class="notification_custom_submit clearfix" style="display: none;width: 98.3%;margin: 0 10px;padding: 5px 10px;background: #fff;box-shadow: 0 4px 8px rgba(0,0,0,.05), 0 0 10px rgba(0,0,0,.03);border-radius: 4px;">';
  addMessageFormView += '<a class="btn btn-default dv-custom-btn btn-xs legitRipple pull-left basic-back" style="display:none;" href="javascript:void(0)">Back</a>';
  addMessageFormView += '<a class="btn btn-themeClr btn-xs pull-right" id="notificationSubmit" data-addSaveMessage href="javascript:void(0)">Save</a>';
  addMessageFormView += '</div>';
  addMessageFormView += '</form>';

  callback(null, addMessageFormView);
}

/*
 * Render HTML View of Edit Messages
 */
let getEditMessageHtmlView = (data, callback) => {
  if(data) {
    var editMessageFormView = '';

    editMessageFormView += '<form class="form-validation form-validate form-horizontal newMsgForm ui-formwizard" method="post" action="javascript:void(0)" id="compose-msg-form" novalidate="novalidate" name="compose-msg-form" data-addMessageForm>';
    editMessageFormView += '<fieldset class="step pa-0" id="step1" style="display: block;">';
    editMessageFormView += '<div class="col-md-12">';
    editMessageFormView += '<div class="panel panel-white">';
    editMessageFormView += '<div class="panel-body customScroll pt-12 no-footer" style="height: 650px; min-height: 650px;">';
    editMessageFormView += '<div class="form-group">';
    editMessageFormView += '<label class="col-md-3 control-label">Message Type </label>';
    editMessageFormView += '<div class="col-md-9">';

    editMessageFormView += '<label class="radio-inline radio-left">';
    if(data.messages[0].message_type_id == 1) {
      editMessageFormView += '<input name="messageType" class="styled" id="recurMsg" value="1" type="radio" checked>';
    }else{
      editMessageFormView += '<input name="messageType" class="styled" id="recurMsg" value="1" type="radio" disabled>';
    }
    editMessageFormView += 'Recurring Message </label>';

    editMessageFormView += '<label class="radio-inline radio-left">';
    if(data.messages[0].message_type_id == 2) {
      editMessageFormView += '<input name="messageType" class="styled" id="groupMsg" value="2" type="radio" checked>Group Message </label>';
    }else{
      editMessageFormView += '<input name="messageType" class="styled" id="groupMsg" value="2" type="radio" disabled>Group Message </label>';
    }

    editMessageFormView += '<label class="radio-inline radio-left">';
    if(data.messages[0].message_type_id == 3) {
      editMessageFormView += '<input name="messageType" class="styled" id="notifyMsg" value="3" type="radio" checked>Notifications  </label>';
    }else{
      editMessageFormView += '<input name="messageType" class="styled" id="notifyMsg" value="3" type="radio" disabled>Notifications  </label>';
    }

    editMessageFormView += '<label class="radio-inline radio-left">';
    if(data.messages[0].message_type_id == 4) {
      editMessageFormView += '<input name="messageType" class="styled" id="justMsg" value="4" type="radio" checked>Messages </label>';
    }else{
      editMessageFormView += '<input name="messageType" class="styled" id="justMsg" value="4" type="radio" disabled>Messages </label>';
    }


    editMessageFormView += '</div>';
    editMessageFormView += '</div>';

    //if(data.messages[0].message_type_id == 1 || data.messages[0].message_type_id == 3 || data.messages[0].message_type_id == 4) {
      editMessageFormView += '<div class="form-group optionalMsgField" data-recur="yes" data-just-msg="yes" data-group="no" data-notification="yes">';
      editMessageFormView += '<label class="col-md-3 control-label">Recipient Wing(s)</label>';
      editMessageFormView += '<div class="col-md-9">';
      editMessageFormView += '<select name="wing_id" id="wing_id" class="select-search" required="required" data-msg="Please select Wing" multiple="multiple">';

      if(data.messages[0].wing_id) {
        if(data.messages[0].wing_id == "all"){
          editMessageFormView += '<option value="all" data-ref-val="" selected>All Wings</option>';
        }else {
          editMessageFormView += '<option value="all" data-ref-val="">All Wings</option>';
        }
        let fetchWing = data.messages[0].wing_id.split(',');
        data.wings.forEach((item) =>{
          if(fetchWing.length > 1){
            for(let w=0; w<fetchWing.length; w++){
              if(fetchWing[w] == item.wing_id){
                editMessageFormView += '<option value="'+item.wing_id+'" selected>'+item.name+'</option>';
              }else{
                editMessageFormView += '<option value="'+item.wing_id+'" >'+item.name+'</option>';
              }
            }
          }else {
            if(fetchWing == item.wing_id){
              editMessageFormView += '<option value="'+item.wing_id+'" selected>'+item.name+'</option>';
            }else {
              editMessageFormView += '<option value="'+item.wing_id+'">'+item.name+'</option>';
            }
          }
        });
      }

      editMessageFormView += '</select>';
      editMessageFormView += '</div>';
      editMessageFormView += '</div>';
      editMessageFormView += '<div class="form-group optionalMsgField" data-recur="yes" data-just-msg="yes" data-group="no" data-notification="yes">';
      editMessageFormView += '<label class="col-md-3 control-label">Recipient Floor(s)</label>';
      editMessageFormView += '<div class="col-md-9">';
      editMessageFormView += '<select name="floor_id" id="floor_id" class="select-search" required="required" data-msg="Please select Floor" multiple="multiple">';

      if(data.messages[0].floor_id) {
        if(data.messages[0].floor_id == "all") {
          editMessageFormView += '<option value="all" data-ref-val="all" selected>All Floors</option>';
        }else{
          editMessageFormView += '<option value="all" data-ref-val="all">All Floors</option>';
        }
        let fetchFloor = data.messages[0].floor_id.split(',');
        data.floors.forEach((item) =>{

          if(fetchFloor.length > 1){
            for(let f=0; f<fetchFloor.length; f++){
              if(fetchFloor[f] == item.floor_id){
                editMessageFormView += '<option value="'+item.floor_id+'" data-ref-val="'+item.wing_id+'" selected>'+item.name+'</option>';
              }else{
                editMessageFormView += '<option value="'+item.floor_id+'" data-ref-val="'+item.wing_id+'">'+item.name+'</option>';
              }
            }
          }else {
            if(fetchFloor == item.floor_id){
              editMessageFormView += '<option value="'+item.floor_id+'" data-ref-val="'+item.wing_id+'" selected>'+item.name+'</option>';
            }else {
              editMessageFormView += '<option value="'+item.floor_id+'" data-ref-val="'+item.wing_id+'">'+item.name+'</option>';
            }
          }
        });
      }

      editMessageFormView += '</select>';
      editMessageFormView += '</div>';
      editMessageFormView += '</div>';
      editMessageFormView += '<div class="form-group optionalMsgField" data-recur="yes" data-just-msg="yes" data-group="no" data-notification="yes">';
      editMessageFormView += '<label class="col-md-3 control-label">Recipient Room(s) <span style="color:red;">*</span></label>';
      editMessageFormView += '<div class="col-md-9">';
      editMessageFormView += '<select multiple="" data-placeholder="Select Rooms" id="key_id" name="key_id" class="select" required="required" data-msg="Please select Room">';

      if(data.messages[0].key_id) {
        if(data.messages[0].key_id == "all") {
          editMessageFormView += '<option value="all" selected>All Rooms</option>';
        }else{
          editMessageFormView += '<option value="all">All Rooms</option>';
        }
        let fetchKey = data.messages[0].key_id.split(',');
        data.keys.forEach((item) =>{
          if(fetchKey.length > 1){
            for(let k=0; k<fetchKey.length; k++){
              if(fetchKey[k] == item.key_id){
                editMessageFormView += '<option value="'+item.key_id+'" data-ref-val="'+item.floor_id+'" selected>'+item.number+'</option>';
              }else{
                editMessageFormView += '<option value="'+item.key_id+'" data-ref-val="'+item.floor_id+'">'+item.number+'</option>';
              }
            }
          }else {
            if(fetchKey == item.key_id){
              editMessageFormView += '<option value="'+item.key_id+'" data-ref-val="'+item.floor_id+'" selected>'+item.number+'</option>';
            }else {
              editMessageFormView += '<option value="'+item.key_id+'" data-ref-val="'+item.floor_id+'">'+item.number+'</option>';
            }
          }
        });
      }

      editMessageFormView += '</select>';
      editMessageFormView += '</div>';
      editMessageFormView += '</div>';
    //}

    //if(data.messages[0].message_type_id == 2) {
      editMessageFormView += '<div class="form-group optionalMsgField hide" data-recur="no" data-just-msg="no" data-group="yes" data-notification="no">';
      editMessageFormView += '<label class="col-md-3 control-label">Recipient Group Code</label>';
      editMessageFormView += '<div class="col-md-9">';
      editMessageFormView += '<select class="select-multiple-limited" multiple="" id="group_code" name="group_code">';
      editMessageFormView += '<option value="NA">Please Select Group Code</option>';
      data.groupCode.forEach((item) =>{
        if(item.group_code!="" && item.group_code!=null){
          if(data.messages[0].group_code == item.group_code) {
            editMessageFormView += '<option value="'+item.group_code+'" selected>'+item.group_code+'</option>';
          }else {
            editMessageFormView += '<option value="'+item.group_code+'">'+item.group_code+'</option>';
          }
        }
      });
      editMessageFormView += '</select>';
      editMessageFormView += '</div>';
      editMessageFormView += '</div>';

      editMessageFormView += '<div class="form-group optionalMsgField hide" data-recur="no" data-just-msg="no" data-group="yes" data-notification="no">';
      editMessageFormView += '<label class="col-md-3 control-label">Recipient Group Name</label>';
      editMessageFormView += '<div class="col-md-9">';
      editMessageFormView += '<input type="text" name="group_name" id="group_name" class="form-control" placeholder="Group Name" value="'+data.messages[0].group_name+'">';
      editMessageFormView += '</div>';
      editMessageFormView += '</div>';
    //}

    //if(data.messages[0].message_type_id == 2 || data.messages[0].message_type_id == 3 || data.messages[0].message_type_id == 4) {
      editMessageFormView += '<div class="form-group optionalMsgField hide" data-recur="no" data-just-msg="yes" data-group="yes" data-notification="yes">';
      editMessageFormView += '<label class="col-md-3 mt-10 control-label">Send When</label>';
      editMessageFormView += '<div class="col-md-9 newMsgForm-1">';
      editMessageFormView += '<div class="radio-inline">';
      editMessageFormView += '<label class="now">';
      if(data.messages[0].is_schedule == 0) {
        editMessageFormView += '<input type="radio" name="is_schedule" class="styled schedule_type" value="0" checked>';
      }else {
        editMessageFormView += '<input type="radio" name="is_schedule" class="styled schedule_type" value="0">';
      }
      editMessageFormView += 'Now </label>';
      editMessageFormView += '</div>';
      editMessageFormView += '<div class="radio-inline">';
      editMessageFormView += '<label class="later">';
      if(data.messages[0].is_schedule == 1) {
        editMessageFormView += '<input type="radio" name="is_schedule" class="styled checkedDateTime schedule_type" value="1" checked>';
      }else {
        editMessageFormView += '<input type="radio" name="is_schedule" class="styled checkedDateTime schedule_type" value="1">';
      }
      editMessageFormView += 'Later</label>';
      editMessageFormView += '</div>';
      editMessageFormView += '</div>';
      editMessageFormView += '<div class="col-md-9 col-md-offset-3 dateTime" style="display: none">';
      editMessageFormView += '<div class="row">';
      editMessageFormView += '<div class="col-md-6">';
      editMessageFormView += '<div class="input-group">';
      editMessageFormView += '<span class="input-group-addon">DATE</span>';

      editMessageFormView += '<input type="text" class="form-control" id="scheduleMsgStartDate" name="scheduleMsgStartDate" placeholder="Select Date" style="text-align: right" value="'+convert(data.messages[0].start_date)+'">';
      editMessageFormView += '</div>';
      editMessageFormView += '</div>';
      editMessageFormView += '<div class="col-md-6">';
      editMessageFormView += '<div class="input-group">';
      editMessageFormView += '<span class="input-group-addon">TIME</span>';
      editMessageFormView += '<input type="text" class="form-control messageSendTime" id="messageSendTime" name="messageSendTime" placeholder="Select Time" value="'+convertTimeFrom24To12(data.messages[0].sent_time)+'" style="text-align: right"/>';
      editMessageFormView += '</div>';
      editMessageFormView += '</div>';
      editMessageFormView += '</div>';
      editMessageFormView += '</div>';
      editMessageFormView += '</div>';
    //}

    //if(data.messages[0].message_type_id == 3) {
      editMessageFormView += '<div class="form-group optionalMsgField hide" data-recur="no" data-just-msg="no" data-group="no" data-notification="yes">';
      editMessageFormView += '<label class="col-md-3 control-label">Message <span style="color:red;">*</span></label>';
      editMessageFormView += '<div class="col-md-9">';
      editMessageFormView += '<textarea name="short_description" id="short_description" class="form-control" placeholder="Please enter your message here">'+data.messages[0].short_description+'</textarea>';
      editMessageFormView += '<span id="short_desc" style="color:red"></span>';
      editMessageFormView += '</div>';
      editMessageFormView += '</div>';
    //}

    //if(data.messages[0].message_type_id == 1) {
      editMessageFormView += '<div class="form-group optionalMsgField" data-recur="yes" data-just-msg="no" data-group="no" data-notification="no">';
      editMessageFormView += '<label class="col-md-3 control-label">Start Date <span style="color:red;">*</span></label></label>';
      editMessageFormView += '<div class="col-md-4">';
      editMessageFormView += '<div class="input-group">';
      editMessageFormView += '<span class="input-group-addon">Date</span>';
      //editMessageFormView += '<input type="text" class="form-control" id="messageStartDate" value="'+convert(data.messages[0].start_date)+'" name="messageStartDate" placeholder="Select Date" style="text-align: right" required="">';
      editMessageFormView += '<input type="text" id="messageStartDate" class="form-control" placeholder="Select Date" value="'+convert(data.messages[0].start_date)+'" name="messageStartDate" style="text-align: right">';
      editMessageFormView += '</div>';
      editMessageFormView += '</div>';
      editMessageFormView += '</div>';
      editMessageFormView += '<div class="form-group optionalMsgField" data-recur="yes" data-just-msg="no" data-group="no" data-notification="no">';
      editMessageFormView += '<label class="col-md-3 control-label">End Date</label>';

      editMessageFormView += '<div class="col-md-4 mt-5 untilDate" style="display:none;">';
      editMessageFormView += '<div class="input-group">';
      editMessageFormView += '<span class="input-group-addon">Date</span>';
      editMessageFormView += '<input type="text" id="messageEndDate" class="form-control" placeholder="Select Date" value="'+convert(data.messages[0].until_date)+'" name="messageEndDate" style="text-align: right">';
      editMessageFormView += '</div>';
      editMessageFormView += '</div>';
      editMessageFormView += '<div class="col-md-4">';
      editMessageFormView += '<div class="checkbox-inline">';
      editMessageFormView += '<label>';
      let checkForeverDate = getForeverDate(convert(data.messages[0].start_date));
      if(convert(checkForeverDate) == convert(data.messages[0].until_date)){
        editMessageFormView += '<input type="checkbox" name="forever" class="styled" checked> Forever </label>';
      }else {
        editMessageFormView += '<input type="checkbox" name="forever" class="styled"> Forever </label>';
      }

      editMessageFormView += '</div>';
      editMessageFormView += '</div>';


      editMessageFormView += '</div>';

      editMessageFormView += '<div class="form-group optionalMsgField" data-recur="yes" data-just-msg="no" data-group="no" data-notification="no">';
      editMessageFormView += '<label class="col-md-3 control-label">Repeat Every </label>';
      editMessageFormView += '<div class="col-md-9">';
      // Start From Monday To Sunday Event Start and End Time for Recurring Messages
      if(data.messages[0].recurring_days!='' && data.messages[0].recurring_time!="" && data.messages[0].recurring_days!=null && data.messages[0].recurring_time!=null) {
        let recDays = data.messages[0].recurring_days.split(",");
        var recTime = data.messages[0].recurring_time.split('#');
        var checkDaysNo='';
        var checkTimeIndex='';
        var checkRecTimeIndex='';
        // Start From Monday To Sunday Event Start and End Time for Recurring Messages
        for(let i=1; i<=7; i++) {
          // Recurring Message Start and End Time Start
          for(let r=0; r<recDays.length; r++) {
            if(i == recDays[r]) {
              editMessageFormView += '<div class="repeatEverySection row clearfix" id="message_day-'+i+'">';
              editMessageFormView += '<div class="col-md-2">';
              editMessageFormView += '<div class="checkbox-inline">';
              editMessageFormView += '<label>';

              editMessageFormView += '<input type="checkbox" name="days[]" class="styled message_recurring_days" checked value="'+i+'">'+getDayNameFromNumber(i, "full")+' ';

              editMessageFormView += '</label>';
              editMessageFormView += '</div>';
              editMessageFormView += '</div>';
              editMessageFormView += '<div class="col-md-10">';
              // Repeats Every Section Start With Default FIRST INDEX
              for(let t=0;t<recTime.length;t++)
              {
                 let recurringDayStartEndTimeArr = recTime[t].split(',');
                 if(checkTimeIndex == '' || checkTimeIndex != recurringDayStartEndTimeArr[0]) {
                   if(i == recurringDayStartEndTimeArr[0]) {

                     editMessageFormView += '<div class="row RepeatTimeSection">';
                     editMessageFormView += '<div class="col-md-5">';
                     editMessageFormView += '<div class="input-group">';
                     editMessageFormView += '<span class="input-group-addon">TIME</span>';
                     editMessageFormView += '<input type="text" class="form-control messageSendTime messageSendTime-'+i+'" name="messageSendTime-day-'+i+'[]" placeholder="Select Time" style="text-align: right" value="'+convertTimeFrom24To12(recurringDayStartEndTimeArr[1])+'"/>';
                     editMessageFormView += '</div>';
                     editMessageFormView += '</div>';

                     editMessageFormView += '<div class="col-md-2">';
                     editMessageFormView += '<a class="btn dv-custom-btn btn-xs" id="edit-addMessageTime" data-addEditMessageTime="'+i+'" href="javascript:void(0);">';
                     editMessageFormView += '<i class="icon-plus2"></i>';
                     editMessageFormView += '</a>';
                     editMessageFormView += '</div>';
                     editMessageFormView += '</div>';

                   }
                   checkTimeIndex = recurringDayStartEndTimeArr[0];
                 }
               }
               // Repeats Every Section END With Default FIRST INDEX

               // Repeats Every Section Start With Dynamic in Same Day
               editMessageFormView += '<div id="repeat-messagedayTime-container-day-'+i+'">';
               for(let rt=0;rt<recTime.length;rt++)
               {
                   let recurringDayStartEndTimeArr = recTime[rt].split(',');

                   if(checkRecTimeIndex!='') {
                     if(checkRecTimeIndex == recurringDayStartEndTimeArr[0]) {
                       if(i == recurringDayStartEndTimeArr[0]) {
                       editMessageFormView += '<div class="row RepeatTimeSection">';
                       editMessageFormView += '<div class="col-md-5">';
                       editMessageFormView += '<div class="input-group">';
                       editMessageFormView += '<span class="input-group-addon">TIME</span>';
                       editMessageFormView += '<input type="text" class="form-control ';
                       editMessageFormView += 'messageSendTime messageSendTime-'+i+'"';
                       editMessageFormView += ' name="messageSendTime-day-'+i+'[]"';
                       editMessageFormView += ' placeholder="Select Time" style="text-align: right"';
                       editMessageFormView += ' value="'+convertTimeFrom24To12(recurringDayStartEndTimeArr[1])+'"/>';
                       editMessageFormView += '</div>';
                       editMessageFormView += '</div>';

                       editMessageFormView += '<div class="col-md-2">';
                       editMessageFormView += '<a class="btn dv-custom-btn btn-xs remove-edit-addMessage" id="edit-addmessageTime_remove" data-addEditMessageTime="'+i+'"';
                       editMessageFormView += ' href="javascript:void(0);">';
                       editMessageFormView += '<i class="icon-trash"></i> </a>';
                       editMessageFormView += '</div>';
                       editMessageFormView += '</div>';
                     }
                     }else {
                       checkRecTimeIndex = recurringDayStartEndTimeArr[0];
                     }
                   }else {
                     checkRecTimeIndex = recurringDayStartEndTimeArr[0];
                   }

                }
                // Repeats Every Section End With Dynamic in Same Day
                editMessageFormView += '</div>';
                // Repeats Every Section End

                editMessageFormView += '</div>';

                editMessageFormView += '</div>';
                checkDaysNo=i;

                break;
            }
          }

          if (i != checkDaysNo) {
            editMessageFormView += '<div class="repeatEverySection row clearfix" id="message_day-'+i+'">';
            editMessageFormView += '<div class="col-md-2">';
            editMessageFormView += '<div class="checkbox-inline">';
            editMessageFormView += '<label>';

            editMessageFormView += '<input type="checkbox" name="days[]" class="styled message_recurring_days" value="'+i+'">'+getDayNameFromNumber(i, "full")+' ';

            editMessageFormView += '</label>';
            editMessageFormView += '</div>';
            editMessageFormView += '</div>';
            editMessageFormView += '<div class="col-md-10">';
            editMessageFormView += '<div class="row RepeatTimeSection">';
            editMessageFormView += '<div class="col-md-5">';
            editMessageFormView += '<div class="input-group">';
            editMessageFormView += '<span class="input-group-addon">TIME</span>';
            editMessageFormView += '<input type="text" class="form-control messageSendTime messageSendTime-'+i+'" name="messageSendTime-day-'+i+'[]" placeholder="Select Time" style="text-align: right" value=""/>';
            editMessageFormView += '</div>';
            editMessageFormView += '</div>';

            editMessageFormView += '<div class="col-md-2">';
            editMessageFormView += '<a class="btn dv-custom-btn btn-xs" id="edit-addMessageTime" data-addEditMessageTime="'+i+'" href="javascript:void(0);">';
            editMessageFormView += '<i class="icon-plus2"></i>';
            editMessageFormView += '</a>';
            editMessageFormView += '</div>';
            editMessageFormView += '</div>';
            editMessageFormView += '<div id="repeat-messagedayTime-container-day-'+i+'">';

            editMessageFormView += '</div>';
            editMessageFormView += '</div>';
            editMessageFormView += '</div>';
            //console.log('Print Days Number : '+i);
          }
          // Recurring Event Start and End Time End
        }
      }else {
        for(let i=1; i<=7; i++) {

          editMessageFormView += '<div class="repeatEverySection row clearfix" id="message_day-'+i+'">';
          editMessageFormView += '<div class="col-md-2">';
          editMessageFormView += '<div class="checkbox-inline">';
          editMessageFormView += '<label>';
          editMessageFormView += '<input type="checkbox" name="days[]" class="styled message_recurring_days" value="'+i+'">'+getDayNameFromNumber(i, "full")+' ';
          editMessageFormView += '</label>';
          editMessageFormView += '</div>';
          editMessageFormView += '</div>';
          editMessageFormView += '<div class="col-md-10">';
          editMessageFormView += '<div class="row RepeatTimeSection">';
          editMessageFormView += '<div class="col-md-5">';
          editMessageFormView += '<div class="input-group">';
          editMessageFormView += '<span class="input-group-addon">TIME</span>';
          editMessageFormView += '<input type="text" class="form-control messageSendTime messageSendTime-'+i+'" name="messageSendTime-day-'+i+'[]" placeholder="Select Time" style="text-align: right" value=""/>';
          editMessageFormView += '</div>';
          editMessageFormView += '</div>';

          // addMessageFormView += '<div class="col-md-5">';
          // addMessageFormView += '<div class="input-group">';
          // addMessageFormView += '<span class="input-group-addon">End Time</span>';
          // addMessageFormView += '<input type="text" id="" class="form-control eventEndTime eventEndTime-'+i+'" name="eventEndTime-day-'+i+'[]" placeholder="Select Time" style="text-align: right" value=""/>';
          // addMessageFormView += '</div>';
          // addMessageFormView += '</div>';

          editMessageFormView += '<div class="col-md-2">';
          editMessageFormView += '<a class="btn dv-custom-btn btn-xs" id="edit-addMessageTime" data-addEditMessageTime="'+i+'" href="javascript:void(0);">';
          editMessageFormView += '<i class="icon-plus2"></i>';
          editMessageFormView += '</a>';
          editMessageFormView += '</div>';
          editMessageFormView += '</div>';
          editMessageFormView += '<div id="repeat-messagedayTime-container-day-'+i+'">';

          editMessageFormView += '</div>';
          editMessageFormView += '</div>';
          editMessageFormView += '</div>';
        }
      }
      // Complete Repeat Every Section End

      editMessageFormView += '</div>';
      editMessageFormView += '</div>';
    //}

    //if(data.messages[0].message_type_id == 4) {
      editMessageFormView += '<div class="form-group optionalMsgField hide" data-recur="no" data-just-msg="yes" data-group="no" data-notification="no">';
      editMessageFormView += '<label class="col-md-3 control-label">Send as notification</label>';
      editMessageFormView += '<div class="col-md-9">';
      editMessageFormView += '<div class="col-md-12 pl-0">';
      editMessageFormView += '<div class="checkbox-inline">';
      editMessageFormView += '<label>';
      if(data.messages[0].is_send_as_notification == 1) {
        editMessageFormView += '<input type="checkbox" class="styled" name="is_notification" value="1" checked>Yes, this message is to be sent as pop-up as well. </label>';
      }else {
        editMessageFormView += '<input type="checkbox" class="styled" name="is_notification" value="1">Yes, this message is to be sent as pop-up as well. </label>';
      }

      editMessageFormView += '</div>';
      editMessageFormView += '</div>';
      editMessageFormView += '</div>';
      editMessageFormView += '</div>';
    //}

    editMessageFormView += '</div>';
    editMessageFormView += '</div>';
    editMessageFormView += '</div>';
    editMessageFormView += '</fieldset>';


    editMessageFormView += '<fieldset class="step no-padding" id="add-step2" style="display: none;">';

    editMessageFormView += '<div class="fadeIn animated">';
    editMessageFormView += '<div class="col-md-3">';
    editMessageFormView += '<div class="panel panel-white">';
    editMessageFormView += '<div class="panel-heading">';
    editMessageFormView += '<h5 class="panel-title">Step 2: Create Message<a class="heading-elements-toggle"><i class="icon-more"></i></a></h5>';
    editMessageFormView += '<div class="heading-elements"></div>';
    editMessageFormView += '</div>';
    editMessageFormView += '<div class="panel-body no-footer customScroll pt-12" style="height: 650px; min-height: 650px;">';
    editMessageFormView += '<div class="collapse in">';
    editMessageFormView += '<div class="form-group">';
    editMessageFormView += '<label class="label-custom agenda_format">Message Format<span style="color:red"></span>:</label>';
    editMessageFormView += '<div>';
    editMessageFormView += '<label class="radio-inline radio-left">';
    if(data.messages[0].message_format_type == 1) {
      editMessageFormView += '<input name="agenda" class="styled agenda" type="radio"  checked value="1">';
    }else {
      editMessageFormView += '<input name="agenda" class="styled agenda" type="radio" value="1">';
    }

    editMessageFormView += 'Template  </label>';
    editMessageFormView += '<label class="radio-inline radio-left upload_img">';
    if(data.messages[0].message_format_type == 2) {
      editMessageFormView += '<input name="agenda" class="styled agenda" type="radio" value="2" checked data-uploadedContentPath="'+templatePath+'/assets/img/" data-uploadFolderName="sample-template" data-templatePath="'+templatePath+'sample-template">';
    }else {
      editMessageFormView += '<input name="agenda" class="styled agenda" type="radio" value="2" data-uploadedContentPath="'+templatePath+'/assets/img/" data-uploadFolderName="sample-template" data-templatePath="'+templatePath+'sample-template">';
    }
    editMessageFormView += 'Image  </label>';
    editMessageFormView += '<label class="radio-inline radio-left upload_pdf" style="">';
    if(data.messages[0].message_format_type == 3) {
      editMessageFormView += '<input name="agenda" class="styled agenda" type="radio" checked value="3" data-uploadedContentPath="'+templatePath+'/assets/pdf/" data-uploadFolderName="sample-template" data-templatePath="'+templatePath+'sample-template">';
    }else {
      editMessageFormView += '<input name="agenda" class="styled agenda" type="radio" value="3" data-uploadedContentPath="'+templatePath+'/assets/pdf/" data-uploadFolderName="sample-template" data-templatePath="'+templatePath+'sample-template">';
    }
    editMessageFormView += 'PDF </label></div>';
    editMessageFormView += '<input type="hidden" id="temporaryData" data-temporaryfilename data-temporarypath="'+temporaryUploadPath+'">';
    editMessageFormView += '<input type="hidden" id="savedAgendaTemplateDetail" name="savedAgendaTemplateDetail" data-templateid="'+data.messages[0].message_format_type+'" data-templatefilename="'+data.messages[0].template_path+'">';
    editMessageFormView += '</div>';
    editMessageFormView += '<div class="form-group" id="select_template">';
    editMessageFormView += '<label class="label-custom">Template Type <span style="color:red">*</span>:</label>';
    editMessageFormView += '<select class="select-withoutsearch" id="templateType" data-placeholder="Please Select Template" required="true" >';
    editMessageFormView += '<option value="NA">Please Select Template</option>';

    let prepareTemplateType = data.templatesType[0].config_val;
    prepareTemplateType = JSON.parse(prepareTemplateType);
    data.templatesName.forEach((itemTemp) =>{
      if(data.messages[0].template_id == itemTemp.template_id) {
        prepareTemplateType.forEach((item) =>{
          if(item.key == itemTemp.template_type) {
            editMessageFormView += '<option value="'+item.key+'" selected>'+item.value+'</option>';
          }else{
            editMessageFormView += '<option value="'+item.key+'">'+item.value+'</option>';
          }
        })
      }
    })

    editMessageFormView += '</select>';
    editMessageFormView += '</div>';
    editMessageFormView += '<div class="col-md-12 tmpError" style="color:red;"></div>';

    editMessageFormView += '<div class="form-group" id="select_template_name">';
    editMessageFormView += '<label class="label-custom">Template Name <span style="color:red">*</span>:</label>';
    editMessageFormView += '<select class="select-withoutsearch" id="templateName" data-placeholder="Please Select Template Name" required="true" >';
    editMessageFormView += '<option value="NA">Please Select Template Name</option>';
    data.templatesName.forEach((item) =>{
      if(data.messages[0].template_id == item.template_id) {
        if(item.media_component == 1) {
          editMessageFormView += '<option value="'+item.template_id+'" selected data-mediacomponent="'+item.media_component+'" data-uploadedContentPath="'+templatePath+'/assets/img/" data-uploadFolderName="'+item.template_path+'" data-templatePath="'+templatePath + item.template_path +'" data-ref-val="'+item.template_type+'">'+item.template_name.ucfirst()+'</option>';
        } else if(item.media_component == 2){
          editMessageFormView += '<option value="'+item.template_id+'" selected data-mediacomponent="'+item.media_component+'" data-uploadedContentPath="'+templatePath+'/assets/video/" data-uploadFolderName="'+item.template_path+'" data-templatePath="'+templatePath + item.template_path +'" data-ref-val="'+item.template_type+'">'+item.template_name.ucfirst()+'</option>';
        }else {
          editMessageFormView += '<option value="'+item.template_id+'" selected data-mediacomponent="'+item.media_component+'" data-uploadedContentPath="'+templatePath+'/assets/" data-uploadFolderName="'+item.template_path+'" data-templatePath="'+templatePath + item.template_path +'" data-ref-val="'+item.template_type+'">'+item.template_name.ucfirst()+'</option>';
        }
      }else {
        if(item.media_component == 1) {
          editMessageFormView += '<option value="'+item.template_id+'" data-mediacomponent="'+item.media_component+'" data-uploadedContentPath="'+templatePath+'/assets/img/" data-uploadFolderName="'+item.template_path+'" data-templatePath="'+templatePath + item.template_path +'" data-ref-val="'+item.template_type+'">'+item.template_name.ucfirst()+'</option>';
        }else if(item.media_component == 2) {
          editMessageFormView += '<option value="'+item.template_id+'" data-mediacomponent="'+item.media_component+'" data-uploadedContentPath="'+templatePath+'/assets/video/" data-uploadFolderName="'+item.template_path+'" data-templatePath="'+templatePath + item.template_path +'" data-ref-val="'+item.template_type+'">'+item.template_name.ucfirst()+'</option>';
        }else {
          editMessageFormView += '<option value="'+item.template_id+'" data-mediacomponent="'+item.media_component+'" data-uploadedContentPath="'+templatePath+'/assets/" data-uploadFolderName="'+item.template_path+'" data-templatePath="'+templatePath + item.template_path +'" data-ref-val="'+item.template_type+'">'+item.template_name.ucfirst()+'</option>';
        }
      }
    });

    editMessageFormView += '</select>';
    editMessageFormView += '<input type="hidden" id="savedTemplateDetail" name="savedTemplateDetail" data-templateId="'+data.messages[0].template_id+'" data-templateFileName="'+data.messages[0].template_path+'" >';
    editMessageFormView += '</div>';

    editMessageFormView += '<div class="form-group" id="select_files" style="display:none;">';
    editMessageFormView += '<label class="label-custom">Upload Image <span style="color:red">*</span>:</label>';
    editMessageFormView += '<div class="inputFileUploadButton btn btn-default dv-custom-btn dv-btn-sm btn-xs btn-file legitRipple pull-right col-md-6">';
    editMessageFormView += '<p class="custom-para">Upload Photo</p>';
    editMessageFormView += '<input id="inputMessageImage" type="file" class="uploadMessageImage upload" disabled="disabled">';
    editMessageFormView += '</div>                     ';
    editMessageFormView += '</div>';
    editMessageFormView += '<div class="col-md-12 imgError" style="color:red;"></div>';
    editMessageFormView += '<div class="form-group" id="select_pdf" style="display:none;">';
    editMessageFormView += '<label class="label-custom">Upload Pdf <span style="color:red">*</span>:</label>';
    editMessageFormView += '<div class="inputFileUploadButton btn btn-default dv-custom-btn dv-btn-sm btn-xs btn-file legitRipple pull-right col-md-6">';
    editMessageFormView += '<p class="custom-para btnPdfUpload">Upload PDF</p>';
    editMessageFormView += '<input id="inputMessagePdf" type="file" class="pdfupload uploadMessagePdf" disabled="disabled">';
    editMessageFormView += '</div>';
    editMessageFormView += '<div class="col-md-12 pdfError" style="color:red;"></div>';
    editMessageFormView += '</div>';
    editMessageFormView += '<div class="form-group imageTempalte" style="display: none;">';
    editMessageFormView += '<label class="label-custom">Banner Image:</label>';

    editMessageFormView += '<div class="btn btn-default dv-custom-btn dv-btn-sm btn-xs btn-file legitRipple pull-right col-md-6">';
    editMessageFormView += '<span id="fileUploadInput"><input id="inputMessageBannerImage" type="file" class="uploadMessageImage upload ui-wizard-content"></span> <span class="hidden-xs"> Upload Photo</span> </div><span class="help-block "></span>';
    editMessageFormView += '<p class="bannerImgError"></p>';
    editMessageFormView += '</div>';
    editMessageFormView += '<div class="form-group videoTempalte" style="display: none">';
    editMessageFormView += '<label class="label-custom">Upload Video:</label>';
    editMessageFormView += '<div class="btn btn-default dv-custom-btn dv-btn-sm btn-xs btn-file legitRipple pull-right col-md-6">';
    editMessageFormView += '<span id="fileUploadInput"><input id="inputMessageBannerVideo" class="fileuploadMsg" data-keys_name="templateVideo" type="file" name="files"></span> <span class="hidden-xs videouplaodBTn"> Upload Video</span> </div><span class="help-block "></span>';
    editMessageFormView += '<p class="bannerVideoError"></p>';
    editMessageFormView += '</div>';
    editMessageFormView += '<div id="readonly-input-field"></div>';
    editMessageFormView += '<div class="form-group short_description hide">';
    editMessageFormView += '<label class="label-custom">Short Description <span style="color:red">*</span></label>';
    editMessageFormView += '<textarea name="media_short_description" id="media_short_description" class="form-control" placeholder="Please provide a short description">'+data.messages[0].short_description+'</textarea>';
    editMessageFormView += '<span id="short_desc1" style="color:red"></span>';
    editMessageFormView += '</div>';
    editMessageFormView += '</div>';

    editMessageFormView += '</div>';

    editMessageFormView += '</div>';
    editMessageFormView += '</div>';
    <!-- Template Intgration -->
    editMessageFormView += '<div class="col-md-9">';
    editMessageFormView += '<div class="panel panel-white">';
    editMessageFormView += '<div class="panel-heading">';
    editMessageFormView += '<h5 class="panel-title">iPad Live Preview: <span class="help-block" style="display: inline-block; margin: 0">Select templates from the left panel to preview here.</span><a class="heading-elements-toggle"><i class="icon-more"></i></a></h5>';
    editMessageFormView += '<div class="heading-elements">';

    editMessageFormView += '</div>';
    editMessageFormView += '</div>';
    editMessageFormView += '<div class="panel-body pad-0 no-footer" style="height: 650px; min-height: 650px;">';
    editMessageFormView += '<div id="langdivIdPreview" class="ipad-view1 tab-content">';
    editMessageFormView += '<div id="template_placeholder" style="text-align: center;">';
    editMessageFormView += '<img src="'+config.cloud.server.protocol+'://'+cloudServerAddress+'/'+config.projects.name.dashboard+'/assets/dist/img/template_placeholder.jpg">';
    editMessageFormView += '</div>';
    editMessageFormView += '<div id="image_placeholder" class="hide" style="text-align: center;">';
    editMessageFormView += '<img src="'+config.cloud.server.protocol+'://'+cloudServerAddress+'/'+config.projects.name.dashboard+'/assets/dist/img/image_placeholder.jpg">';
    editMessageFormView += '</div>';
    editMessageFormView += '<div id="pdf_placeholder" class="hide" style="text-align: center;">';
    editMessageFormView += '<img src="'+config.cloud.server.protocol+'://'+cloudServerAddress+'/'+config.projects.name.dashboard+'/assets/dist/img/pdf_placeholder.jpg">';
    editMessageFormView += '</div>';
    editMessageFormView += '<div id="pageTemplate">';
    editMessageFormView += '</div>';
    editMessageFormView += '<div id="withImageTemplate">';
    //editMessageFormView += '<div style="margin: 0 auto;text-align: center;"><img id="messageImageTemplate" src=""></div>';
    editMessageFormView += '</div>';
    editMessageFormView += '</div>';
    editMessageFormView += '<span id="pdfView">';

    editMessageFormView += '</span>';
    editMessageFormView += '</div>';
    editMessageFormView += '</div>';
    editMessageFormView += '</div>';
    editMessageFormView += '</div>';
    editMessageFormView += '</fieldset>';


    editMessageFormView += '<div class="form-wizard-actions communication-wizard fadeIn animated">';
    editMessageFormView += '<input class="btn btn-default dv-custom-btn btn-xs legitRipple pull-left ui-formwizard-button" id="message_basic-back" type="reset" value="Back" disabled="disabled">';
    editMessageFormView += '<input class="btn dv-custom-btn btn-xs legitRipple btn-themeClr ui-formwizard-button" id="edit_message" data-editSaveMessage="'+data.messages[0].message_id+'" type="submit" value="Next">';
    editMessageFormView += '</div>';
    editMessageFormView += '<div class="notification_custom_submit clearfix" style="display: none;width: 98.3%;margin: 0 10px;padding: 5px 10px;background: #fff;box-shadow: 0 4px 8px rgba(0,0,0,.05), 0 0 10px rgba(0,0,0,.03);border-radius: 4px;">';
    editMessageFormView += '<a class="btn btn-default dv-custom-btn btn-xs legitRipple pull-left basic-back" style="display:none;" href="javascript:void(0)">Back</a>';
    editMessageFormView += '<a class="btn btn-themeClr btn-xs pull-right" id="edit_message" data-editSaveMessage="'+data.messages[0].message_id+'" href="javascript:void(0)">Save</a>';
    editMessageFormView += '</div>';
    editMessageFormView += '</form>';
  }

  callback(null, editMessageFormView);
}

/*
 * Render Recurring Message HTML View
 */
let getRecurringMessageHtmlView = (data, callback) => {

  let recMessagesHtmlView = '';
  recMessagesHtmlView += '<table class="table table-striped media-library table-lg table-responsive bg-white roundedBordered" id="message_tbl_2">';
  recMessagesHtmlView += '<thead>';
  recMessagesHtmlView += '<tr>';
  recMessagesHtmlView += '<th>Message</th>';
  recMessagesHtmlView += '<th>Schedule <i class=""></i>';
  recMessagesHtmlView += '</th>';
  recMessagesHtmlView += '<th class="text-center"></th>';
  recMessagesHtmlView += '</tr>';
  recMessagesHtmlView += '</thead>';
  recMessagesHtmlView += '<tbody class="tbl-fix-height dv-customScroll">';
  if(data!="") {
    data.forEach((item) =>{
      recMessagesHtmlView += '<tr id="message-'+item.message_id+'">';
      if(item.message_format_type == 1) {
        recMessagesHtmlView += '<td>'+item.message_body+'</td>';
      }else {
        recMessagesHtmlView += '<td>'+item.short_description+'</td>';
      }
      recMessagesHtmlView += '<td>'+convert(item.start_date)+'</td>';

      recMessagesHtmlView += '<td class="text-right">';
      recMessagesHtmlView += '<div class="col-md- text-right">';
      recMessagesHtmlView += '<ul class="icons-list">';
      recMessagesHtmlView += '<li class="dropdown"> <a href="#" class="dropdown-toggle" data-toggle="dropdown"> <i class="icon-more2"></i> </a>';
      recMessagesHtmlView += '<ul class="dropdown-menu dropdown-menu-right">';
      recMessagesHtmlView += '<li><a href="javascript:void(0)" class="editMsgCompose" data-editMessageId="'+item.message_id+'">Edit</a></li>';
      recMessagesHtmlView += '<li><a href="javascript:void(0)" data-toggle="modal" data-deleteMessageId="'+item.message_id+'" data-deleteModuleName="messages" data-target="#DeleteModal">Delete</a></li>';
      recMessagesHtmlView += '</ul>';
      recMessagesHtmlView += '</li>';
      recMessagesHtmlView += '</ul>';
      recMessagesHtmlView += '</div>';
      recMessagesHtmlView += '</td>';

      recMessagesHtmlView += '</tr>';
    });
  }else {
    recMessagesHtmlView += '<tr><td colspan="3">'+noContent()+'</td></tr>';
  }

    recMessagesHtmlView += '</tbody>';
    recMessagesHtmlView += '</table>';

    callback(null, recMessagesHtmlView);

}

/*
 * Render Just Message HTML View
 */
let getJustMessageHtmlView = (data, callback) => {

  let justMessagesHtmlView = '';

  justMessagesHtmlView += '<table class="table table-striped media-library table-lg table-responsive bg-white roundedBordered" id="message_tbl_3">';
  justMessagesHtmlView += '<thead>';
  justMessagesHtmlView += '<tr>';
  justMessagesHtmlView += '<th>Message</th>';
  justMessagesHtmlView += '<th>Schedule <i class=""></i>';
  justMessagesHtmlView += '</th>';
  justMessagesHtmlView += '<th class="text-center"></th>';
  justMessagesHtmlView += '</tr>';
  justMessagesHtmlView += '</thead>';
  justMessagesHtmlView += '<tbody class="tbl-fix-height dv-customScroll">';

  if(data!="") {
    data.forEach((item) =>{
      justMessagesHtmlView += '<tr id="message-'+item.message_id+'">';
      if(item.message_format_type == 1) {
        justMessagesHtmlView += '<td>'+item.message_body+'</td>';
      }else {
        justMessagesHtmlView += '<td>'+item.short_description+'</td>';
      }
      justMessagesHtmlView += '<td>'+convert(item.start_date)+' <br>';
      justMessagesHtmlView += convertTimeFrom24To12(item.sent_time) +'</td>';
      justMessagesHtmlView += '<td class="text-right">';
      justMessagesHtmlView += '<div class="col-md- text-right">';
      justMessagesHtmlView += '<ul class="icons-list">';
      justMessagesHtmlView += '<li class="dropdown"> <a href="#" class="dropdown-toggle" data-toggle="dropdown"> <i class="icon-more2"></i> </a>';
      justMessagesHtmlView += '<ul class="dropdown-menu dropdown-menu-right">';
      justMessagesHtmlView += '<li><a href="javascript:void(0)" class="editMsgCompose" data-editMessageId="'+item.message_id+'">Edit</a></li>';
      justMessagesHtmlView += '<li><a href="javascript:void(0)" data-toggle="modal" data-deleteMessageId="'+item.message_id+'" data-deleteModuleName="messages" data-target="#DeleteModal">Delete</a></li>';
      justMessagesHtmlView += '</ul>';
      justMessagesHtmlView += '</li>';
      justMessagesHtmlView += '</ul>';
      justMessagesHtmlView += '</div>';
      justMessagesHtmlView += '</td>';
      justMessagesHtmlView += '</tr>';
    });
  }else {
    justMessagesHtmlView += '<tr><td colspan="3">'+noContent()+'</td></tr>';
  }
  justMessagesHtmlView += '</tbody>';
  justMessagesHtmlView += '</table>';

  callback(null, justMessagesHtmlView);
}

/*
 * Render Group Message HTML View
 */
let getGroupMessageHtmlView = (data, callback) => {
  let groupMessagesHtmlView = '';

  groupMessagesHtmlView += '<table class="table table-striped media-library table-lg table-responsive bg-white roundedBordered" id="message_tbl_4">';
  groupMessagesHtmlView += '<thead>';
  groupMessagesHtmlView += '<tr>';
  groupMessagesHtmlView += '<th>Group Name</th>';
  groupMessagesHtmlView += '<th>Group Code</th>';
  groupMessagesHtmlView += '<th>Date &amp; Time <i class=""></i></th>';
  groupMessagesHtmlView += '<th width="120" class="text-center"></th>';
  groupMessagesHtmlView += '</tr>';
  groupMessagesHtmlView += '</thead>';
  groupMessagesHtmlView += '<tbody class="tbl-fix-height dv-customScroll">';

  if(data!="") {
    data.forEach((item) =>{
      groupMessagesHtmlView += '<tr id="message-'+item.message_id+'">';
      groupMessagesHtmlView += '<td>'+item.group_name+'</td>';
      groupMessagesHtmlView += '<td>'+item.group_code+'</td>';
      groupMessagesHtmlView += '<td>'+convert(item.start_date)+' <br> ';
      groupMessagesHtmlView += convertTimeFrom24To12(item.sent_time)+'</td>';

      groupMessagesHtmlView += '<td class="text-center"><ul class="icons-list">';
      groupMessagesHtmlView += '<li class="dropdown"> <a href="#" class="dropdown-toggle" data-toggle="dropdown"> <i class="icon-more2"></i> </a>';
      groupMessagesHtmlView += '<ul class="dropdown-menu dropdown-menu-right">';

      groupMessagesHtmlView += '<li><a href="javascript:void(0)" class="editMsgCompose" data-editMessageId="'+item.message_id+'">Edit</a></li>';
      groupMessagesHtmlView += '<li><a href="javascript:void(0)" data-toggle="modal" data-deleteMessageId="'+item.message_id+'" data-deleteModuleName="messages" data-target="#DeleteModal">Delete</a></li>';
      groupMessagesHtmlView += '</ul>';
      groupMessagesHtmlView += '</li>';
      groupMessagesHtmlView += '</ul></td>';

      groupMessagesHtmlView += '</tr>';
    });
  }else{
    groupMessagesHtmlView += '<tr><td colspan="4">'+noContent()+'</td></tr>';
  }

  groupMessagesHtmlView += '</tbody>';
  groupMessagesHtmlView += '</table>';

  callback(null, groupMessagesHtmlView);
}

/*
 * Render Notification Message HTML View
 */
let getNotificationMessageHtmlView = (data, callback) => {

  let notificationMessagesHtmlView = '';

  notificationMessagesHtmlView += '<table class="table table-striped media-library table-lg table-responsive bg-white roundedBordered" id="message_tbl_1">';
  notificationMessagesHtmlView += '<thead>';
  notificationMessagesHtmlView += '<tr>';
  notificationMessagesHtmlView += '<th>Message</th>';
  notificationMessagesHtmlView += '<th>Date Sent</th>';
  notificationMessagesHtmlView += '<th class="text-center"></th>';
  notificationMessagesHtmlView += '</tr>';
  notificationMessagesHtmlView += '</thead>';
  notificationMessagesHtmlView += '<tbody class="tbl-fix-height dv-customScroll">';

  if(data!="") {
    data.forEach((item) =>{
      notificationMessagesHtmlView += '<tr id="message-'+item.message_id+'">';
      notificationMessagesHtmlView += '<td>'+item.short_description+'</td>';
      notificationMessagesHtmlView += '<td>'+convert(item.start_date)+' <br>';
      notificationMessagesHtmlView += convertTimeFrom24To12(item.sent_time)+'</td>';
      notificationMessagesHtmlView += '<td class="text-center"><ul class="icons-list">';
      notificationMessagesHtmlView += '<li class="dropdown">';
      notificationMessagesHtmlView += '<a href="javascript:void(0)" class="dropdown-toggle" data-toggle="dropdown"> <i class="icon-more2"></i> </a>';
      notificationMessagesHtmlView += '<ul class="dropdown-menu dropdown-menu-right">';
      notificationMessagesHtmlView += '<li><a href="javascript:void(0)" class="editMsgCompose" data-editMessageId="'+item.message_id+'">Edit</a></li>';
      notificationMessagesHtmlView += '<li><a href="javascript:void(0)" data-toggle="modal" data-deleteMessageId="'+item.message_id+'" data-deleteModuleName="messages" data-target="#DeleteModal">Delete</a></li>';
      notificationMessagesHtmlView += '</ul>';
      notificationMessagesHtmlView += '</li>';
      notificationMessagesHtmlView += '</ul></td>';
      notificationMessagesHtmlView += '</tr>';
    });
  }else {
    notificationMessagesHtmlView += '<tr><td colspan="3">'+noContent()+'</td></tr>';
  }

  notificationMessagesHtmlView += '</tbody>';
  notificationMessagesHtmlView += '</table>';

  callback(null, notificationMessagesHtmlView);
}


function noContent() {
  let noContent = '';
  // noContent += '<div class="text-center">';
  // noContent += '<img src="'+config.cloud.server.protocol+'://'+
  // cloudServerAddress+'/'+config.projects.name.dashboard+'/assets/dist/img/no_content.png" />';
  // noContent += '</div>';
  noContent += '<p class="text-center m-10 text-muted">No data available.</p>';
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

module.exports = message;
