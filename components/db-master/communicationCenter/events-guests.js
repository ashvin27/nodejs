let dbObj = require('../connection');

module.exports = {

	/*
	 * Get All Recurring Events
	 */
	 select1: (tableName, where, callback) => {

		dbObj.select()
		.from(tableName)
		.where(where)
		.then((rows) => {
			console.log(rows);
		  callback(null, rows);
		})
		.catch((err) => {
		  console.log(err);
		  callback(err, null);
		});
	},

	/*
	 * Get All Recurring Events
	 */
	select: (tableName, what, conditions, callback) => {

	 let querySelect = dbObj.select(what)
	 .from(tableName);

	 if(conditions && conditions.where) {
		 querySelect.where(conditions.where);
	 }
	 if(conditions && conditions.whereE) {
		 (conditions.whereE).forEach((item) => {
			 querySelect.where(item.f, item.m, item.l);
		 });
	 }
	 //querySelect.orderBy('event_start_date', 'asc');
	 querySelect.then((rows) => {
		 console.log(rows);
		 callback(null, rows);
	 })
	 .catch((err) => {
		 console.log(err);
		 callback(err, null);
	 });
 },

	/*
   * Insert query into cmc_events table
   */
  insert: (tableName,insertParam, callback) => {

	  dbObj(tableName)
	  .returning('id')
	  .insert(insertParam)
	  .then(function(rows){
				callback(null, rows);
	  })
		.catch((err) => {
		  console.log(err);
		  callback(err, null);
		});
  },

	/*
   * Delete query in cmc_events table
   */
  delete : (tableName, conditions, updateParam, callback) => {

		let queryDelete = dbObj(tableName);

		if(conditions && conditions.where) {
			queryDelete.where(conditions.where);
		}
		if(conditions && conditions.whereE) {
			(conditions.whereE).forEach((item) => {
				queryDelete.where(item.f, item.m, item.l);
			});
		}

	  queryDelete.update(updateParam)
	  .then(function(rows){
      callback(null, rows);
    })
		.catch((err) => {
		  console.log(err);
		  callback(err, null);
		});
  },

	/*
   * Update query in cmc_events table
   */
	update: (tableName, conditions, updateParam, callback) => {

	  let queryUpdate = dbObj(tableName)

		if(conditions && conditions.where) {
			queryUpdate.where(conditions.where);
		}
		if(conditions && conditions.whereE) {
			(conditions.whereE).forEach((item) => {
				queryUpdate.where(item.f, item.m, item.l);
			});
		}

	  queryUpdate.update(updateParam)
	  .then(function(rows){
				callback(null, rows);
	  })
		.catch((err) => {
		  console.log(err);
		  callback(err, null);
		});
  },

	/*
	 * Select All Recurring Events Records With Start and End Time
	 */
	getSelectRecEvents: (callback) => {
    dbObj.select([
    't1.event_id',
    't1.event_title',
    't1.event_location',
    't1.event_photos',
    't1.description',
    't1.event_start_date',
    't1.is_recurring',
    't1.event_until_date',
    't2.recurring_days',
    't2.start_time',
    't2.end_time'
    ])
    .from('cmc_events as t1')
    .innerJoin(
      'cmc_events_recurring_mapping as t2',
      't1.event_id',
      't2.cmc_event_id')
    .where({
      't1.hotel_id': 1,
      't1.is_recurring': 1,
      't1.is_deleted': 0
    })
    .orderBy('t1.event_id', 'asc')
    .orderBy('t1.event_start_date', 'asc')
		.groupByRaw('t2.cmc_event_id')
    .then((rows) => {
      callback(null, rows);
    }).
    catch((err) => {
      console.log(err);
      callback(err, null);
    });
  },


	/*
   * Parmanent Delete from cmc_event table
   */
  deleteP: (tableName,deleteParam, callback) => {

	  dbObj(tableName)
	  .where(deleteParam)
	  .del()
	  .then(function(rows){
      callback(null, rows);
    })
		.catch((err) => {
		  console.log(err);
		  callback(err, null);
		});
  }
};
