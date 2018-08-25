let dbObj       = require('../connection'),
    moment      = require('moment');
   

module.exports = {

      getServiceAssistance: (filter, callback) => {
         let query = dbObj.select([
                'service_id',
                'created_on',
                'delivery_time ',
                'room_number',
                'guest_name',
                'item_display_name as service_type',
                'no_of_items',
                'order_note'
            ])
              .from('v_service_amenities_booking');
               
              if(filter.recentOrder==1) {
                  query.limit(filter.limit).offset(0);
                } else {
                  query.limit(filter.limit).offset(filter.offset);
                }
            
                if(filter.sortOrderTime) {
                  query.orderBy('created_on', filter.sortOrderTime);
                }
                if(filter.sortDeliveryTime) {
                  query.orderBy('delivery_time', filter.sortDeliveryTime);
              }

              if(filter.pageView=='pending') {
              query.where({
                  "status":'FAILED'
                });
              } else if(filter.pageView=='completed') {
                query.where({
                  "status":'SUCCESS'
                });
              } else if(filter.pageView=='cancelled') {
                query.where({
                  "status":'CANCELLED'
                });
              } 
        
          // if(filter.byOrder!='all') {
          //   let statement = '';
          //   if(filter.byOrder=='today') {
          //     statement = 'DATE(`created_on`) = DATE(NOW())';
          //   } else if(filter.byOrder=='yesterday') {
          //     statement = 'DATE(`created_on`) = DATE(NOW() - INTERVAL 1 DAY)';
          //   } else if(filter.byOrder=='last-7-days') {
          //     statement = 'DATE(`created_on`) >= DATE(NOW() - INTERVAL 7 DAY)';
          //   } else if(filter.byOrder=='this-month') {
          //     statement = 'DATE(`created_on`) >= DATE(NOW() - INTERVAL 1 MONTH)';
          //   } else if(filter.byOrder=='this-year') {
          //     statement = 'DATE(`created_on`) >= DATE(NOW() - INTERVAL 1 YEAR)';
          //   }
          //   query.whereRaw(statement);
          // }

          
          // if(filter.byDelivery!='all') {
          //   let statement = '';
          //   if(filter.byDelivery=='today') {
          //     statement = 'DATE(`delivery_time`) = DATE(NOW())';
          //   } else if(filter.byDelivery=='yesterday') {
          //     statement = 'DATE(`delivery_time`) = DATE(NOW() - INTERVAL 1 DAY)';
          //   } else if(filter.byDelivery=='last-7-days') {
          //     statement = 'DATE(`delivery_time`) >= DATE(NOW() - INTERVAL 7 DAY)';
          //   }else if(filter.byDelivery=='this-month') {
          //     statement = 'DATE(`delivery_time`) >= DATE(NOW() - INTERVAL 1 MONTH)';
          //   }else if(filter.byDelivery=='this-year') {
          //     statement = 'DATE(`delivery_time`) >= DATE(NOW() - INTERVAL 1 YEAR)';
          //   }
          //   query.whereRaw(statement);
          // }

          if(filter.searchBy!="")
          {
            query.whereRaw(`CONCAT_WS('',guest_name,room_number,item_display_name,no_of_items,number_of_persons,created_on,order_note) LIKE  '%`+filter.searchBy+`%'`);
          }

          if(filter.recentOrder==1) {
            query.where('service_id', '>', filter.lastServiceId);
          }
    
          query.then((rows) => {
            if(rows.length>0){
              for(let i=0;i<rows.length;i++)
              {
                rows[i].created_on=moment(rows[i].created_on ).format("YYYY-MM-DD hh:mm:ss")
                if(i==(rows.length-1))
                {
                  callback(null, rows);
                }
              }
            }
          else{
            callback(null, rows);
          }
                
          })
          .catch((err) => {
            console.log(err);
            callback(err, null);
          })
      },


      getServiceAssistanceRecent: (filter, callback) => {
        let query = dbObj.select([
               'service_id',
               'created_on',
               'delivery_time ',
               'room_number',
               'guest_name',
               'item_display_name as service_type',
               'no_of_items',
               'order_note'
           ])
             .from('v_service_amenities_booking');

             query.limit(filter.limit).offset(0);
             query.where({
                 "status":'FAILED'
               });
             query.where('service_id', '>', filter.lastServiceId);
    
             query.then((rows) => {
              if(rows.length>0){
                for(let i=0;i<rows.length;i++)
                {
                  rows[i].created_on=moment(rows[i].created_on ).format("YYYY-MM-DD hh:mm:ss")
                  if(i==(rows.length-1))
                  {
                    callback(null, rows);
                  }
                }
            }else{
           callback(null, rows);
         }      
         })
         .catch((err) => {
           console.log(err);
           callback(err, null);
         })
     },
     
      

      getLastServiceId: (callback) => {
        dbObj(`v_service_amenities_booking`)
        .max('service_id as service_id')
        .then((row) => {
          if(row.length > 0) {
            callback(null, row[0].service_id);
          } else {
            callback(null, 0);
          }
        })
        .catch((err) => {
          console.log(err);
          callback(err, null);
        })
      },

      getPendingServiceCount: (callback) => {
        dbObj(`v_service_amenities_booking`)
        .count('service_id as count')
        .where({
          status: 'FAILED'
        })
        .then((row) => {
          if(row.length > 0) {
            callback(null, row[0].count);
          } else {
            callback(null, 0);
          }
        })
        .catch((err) => {
          console.log(err);
          callback(err, null);
        })
      },
      getCompletedServiceCount: (callback) => {
        dbObj(`v_service_amenities_booking`)
        .count('service_id as count')
        .where({
          status: 'SUCCESS'
        })
        .then((row) => {
          if(row.length > 0) {
            callback(null, row[0].count);
          } else {
            callback(null, 0);
          }
        })
        .catch((err) => {
          console.log(err);
          callback(err, null);
        })
      },
      getCancelledServiceCount: (callback) => {
        dbObj(`v_service_amenities_booking`)
        .count('service_id as count')
        .where({
          status: 'CANCELLED'
        })
        .then((row) => {
          if(row.length > 0) {
            callback(null, row[0].count);
          } else {
            callback(null, 0);
          }
        })
        .catch((err) => {
          console.log(err);
          callback(err, null);
        })
      },

      getFiltersCount: (filter,callback) => {
        let query= dbObj(`v_service_amenities_booking`);
        query .count('service_id as count');

        if(filter.pageView=='pending') {
          query.where({
              "status":'FAILED'
            });
          } else if(filter.pageView=='completed') {
            query.where({
              "status":'SUCCESS'
            });
          } else if(filter.pageView=='cancelled') {
            query.where({
              "status":'CANCELLED'
            });
          } 
          
          if(filter.searchBy !="")
        {
          query .whereRaw(`CONCAT_WS('',guest_name,room_number,item_display_name,no_of_items,number_of_persons,created_on,order_note) LIKE '%`+filter.searchBy+`%'`)
      
        }
        query.then((row) => {
            if(row.length > 0) {
            callback(null, row[0].count);
          } else {
            callback(null, 0);  
          }
        })
        .catch((err) => {
          console.log(err);
          callback(err, null);
        })
      },

      getServiceDetails: (serviceId, callback) => {

          let query = dbObj.select([
            'service_id',
            'service_number',
            'created_on',
            'status',
            'service_total',
            'no_of_items',
            'order_note',
            'number_of_persons',
            'room_number',
            'guest_name',
            'item_display_name as service_type',
            
        ])
          .from('v_service_amenities_booking')
        .where({
          service_id: serviceId
        })
        .then((rows) => {
          callback(null, rows);
        })
        .catch((err) => {
          console.log(err);
          callback(err, null);
        })
      },

      getServiceAssToMove: (moveOrderAfter, callback) => {
        dbObj(`v_service_amenities_booking`)
        .where({
          status: "SUCCESS"
        })
        .orderBy('service_id', 'desc')
        .limit(100)
        .then((rows) => {
          if(rows.length > 0) {
            callback(null, rows);
          } else {
            callback('No matching records', null);
          }
        })
        .catch((err) => {
          callback(err, null);
        })
      },

      applyServiceActions: (data, callback) => {
        let serviceId   = data.serviceId;
            dateFromat  = moment(new Date()).format("YYYY-MM-DD HH:mm:ss"),
            status      = '';
        if(data.action=='delivered') {
          status = "SUCCESS";
        } else if(data.action=='cancel') {
          status = "CANCELLED";
        }
    
        dbObj('service_amenities_booking')
        .where({
          service_id: serviceId,
          
        })
        .update({
          status: status,
          delivery_time:dateFromat
        })
        .then((res) => {
          if(res) {
            callback(null, res);
          } else {
            callback(1, null);
          }
        })
        .catch((err) => {
          console.log(err);
          callback(1, null);
        })
      },

};


