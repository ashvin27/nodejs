let dbObj = require('../connection');

module.exports = {
  getOrders: (filter, callback) => {

    let query = dbObj.select([
      'guest_name',
      'room_number',
      'order_time',
      'delivery_time',
      'order_id',
      'order_number',
      'is_delivered'
    ])
    .from(`v_ird_orders`);

    if(filter.recentOrder==1) {
      query.limit(filter.limit).offset(0);
    } else {
      query.limit(filter.limit).offset(filter.offset);
    }

    if(filter.sortOrderTime) {
      query.orderBy('order_time', filter.sortOrderTime);
    }
    if(filter.sortDeliveryTime) {
      query.orderBy('delivery_time', filter.sortDeliveryTime);
    }

    if(filter.pageView=='pending') {
      query.where({
        is_delivered: 0
      });
    } else if(filter.pageView=='completed') {
      query.where({
        is_delivered: 1
      });
    } else if(filter.pageView=='cancelled') {
      query.where({
        is_delivered: 2
      });
    }

    if(filter.byOrder!='all') {
      let statement = '';
      if(filter.byOrder=='today') {
        statement = 'DATE(`order_time`) = DATE(NOW())';
      } else if(filter.byOrder=='yesterday') {
        statement = 'DATE(`order_time`) = DATE(NOW() - INTERVAL 1 DAY)';
      } else if(filter.byOrder=='last-7-days') {
        statement = 'DATE(`order_time`) >= DATE(NOW() - INTERVAL 7 DAY)';
      }
      query.whereRaw(statement);
    }
    if(filter.byDelivery!='all') {
      let statement = '';
      if(filter.byDelivery=='today') {
        statement = 'DATE(`delivery_time`) = DATE(NOW())';
      } else if(filter.byDelivery=='yesterday') {
        statement = 'DATE(`delivery_time`) = DATE(NOW() - INTERVAL 1 DAY)';
      } else if(filter.byDelivery=='last-7-days') {
        statement = 'DATE(`delivery_time`) >= DATE(NOW() - INTERVAL 7 DAY)';
      }
      query.whereRaw(statement);
    }

    if(filter.recentOrder==1) {
      query.where('order_id', '>', filter.lastOrderId);
    }

    query.then((rows) => {
      callback(null, rows);
    })
    .catch((err) => {
      console.log(err);
      callback(err, null);
    })
  },
  getOrderDetails: (orderId, callback) => {
    dbObj.select()
    .from(`v_ird_order_details`)
    .where({
      order_id: orderId
    })
    .then((rows) => {
      callback(null, rows);
    })
    .catch((err) => {
      console.log(err);
      callback(err, null);
    })
  },
  getLastOrderId: (callback) => {
    dbObj(`v_ird_orders`)
    .max('order_id as order_id')
    .then((row) => {
      if(row.length > 0) {
        callback(null, row[0].order_id);
      } else {
        callback(null, 0);
      }
    })
    .catch((err) => {
      console.log(err);
      callback(err, null);
    })
  },
  getPendingOrdersCount: (callback) => {
    dbObj(`v_ird_orders`)
    .count('order_id as count')
    .where({
      is_delivered: 0
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
  getCompletedOrdersCount: (callback) => {
    dbObj(`v_ird_orders`)
    .count('order_id as count')
    .where({
      is_delivered: 1
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
  getCancelledOrdersCount: (callback) => {
    dbObj(`v_ird_orders`)
    .count('order_id as count')
    .where({
      is_delivered: 2
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
  applyOrderActions: (data, callback) => {
    let orderId = data.orderId;
    let isDelivered = '';
    if(data.action=='delivered') {
      isDelivered = 1;
    } else if(data.action=='cancel') {
      isDelivered = 2;
    }

    dbObj('ird_orders')
    .where({
      order_id: orderId
    })
    .update({
      is_delivered: isDelivered
    })
    .then((d) => {
      if(d) {
        callback(null, d);
      } else {
        callback(1, null);
      }
    })
    .catch((err) => {
      console.log(err);
      callback(1, null);
    })
  },
  setAutoDeliveryStatus: () => {
    dbObj
    .raw('call sp_ird_update_delivery()')
    .then((d) => {
      //console.log(d);
    })
    .catch((err) => {
      console.log(err);
    })
  },
  getIRDOrdersToMove: (moveOrderAfter, callback) => {
    dbObj(`v_ird_orders`)
    .where({
      is_delivered: 1
    })
    .orderBy('order_id', 'desc')
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
  }
};
