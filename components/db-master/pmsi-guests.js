let dbObj = require('./connection');

module.exports = {

	select: (tableName, what, conditions, callback) => {
	 console.log('PRINTING TABLE NAME = ' + tableName);
	 let querySelect = dbObj.select(what)
	 .from(tableName);

	 if(conditions && conditions.where) {
		 querySelect.where(conditions.where);
	 }
	 
	 if(conditions && conditions.where_in) {
		 querySelect.whereIn(
			 conditions.where_in.key,
			 conditions.where_in.value
		 );
	 }

	 if(conditions && conditions.whereE) {
		 (conditions.whereE).forEach((item) => {
			 querySelect.where(item.f, item.m, item.l);
		 });
	 }

	 querySelect.then((rows) => {
		 callback(null, rows);
	 })
	 .catch((err) => {
		 console.log(err);
		 callback(err, null);
	 });
 },

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
		  callback(err, null);
		});
  },

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
