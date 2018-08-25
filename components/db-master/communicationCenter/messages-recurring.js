let dbObj = require('../connection');

module.exports = {

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
	 //querySelect.groupByRaw(tableName+'.recurring_days');
	 querySelect.then((rows) => {
		 //console.log(rows);
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
