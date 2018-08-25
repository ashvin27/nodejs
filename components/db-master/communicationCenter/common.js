let dbObj = require('../connection');

module.exports = {

	/*
	 * Get All Common Query Data
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
	* Get All Common Query Data
	*/
 getGroupCode: (tableName, what, conditions, callback) => {

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
		querySelect.distinct('group_code')
		//.whereNotNull('group_code');
		querySelect.then((rows) => {
			console.log(rows);
			callback(null, rows);
		})
		.catch((err) => {
			console.log(err);
			callback(err, null);
		});
	}
};
