let express = require('express'),
        router = express.Router(),
	DVStatus = require(__base + 'components/core/helper/http-status-codes'),
        roomProfile = require(__base +
                'components/core/room-profile');
let details = [];

router.get('/', (req, res) => {
    getIrdProfile(0, (Err, profileIRDList) => {
        //res.json({room_profiles: profileIRDList});
        getIpadFeature(0, (Err, profileIpadList) => {
            getTvProfile(0, (Err, profileTvList) => {
                res.json({ird_profiles: profileIRDList, "ipadFeature": profileIpadList, "tvProfile": profileTvList});
            });
        });
    });
});

router.get('/:in_room_device_id/:guest_id', (req, res) => {
    let in_room_device_id = parseInt(req.params.in_room_device_id);
    let guest_id = 0;
    if (req.params.guest_id) {
        guest_id = parseInt(req.params.guest_id);
    }
    what = ['p3.profile_detail_id', 'p3.profile_name', 'p3.module_name', 'p2.checkout', 'p2.never_expiry', 'p2.expiry_date', 'p2.guest_id', 'p3.is_profile_type_enable', 'p1.in_room_device_id'];
    getRoomProfileJson(what, in_room_device_id, guest_id, (Err, profileList) => {
        res.json({"roomProfile": profileList});
    });
});

function getRoomProfileJson(what, in_room_device_id, guest_id, callback) {
    let profileArr = {};
    let profile_type = [];
    let profile_item_id = [];
    let Cat = [];
    let subCat = [];
    let MenuItem = [];
    let i = 0,j = 0;
    roomProfile.getProfileDetailsForJson(what, in_room_device_id, guest_id, (rpErr, profileDetails) => {  
        //console.log("profileDetailsprofileDetailsprofileDetailsprofileDetails",profileDetails);
        profileDetails.forEach((data) => {
            if (data.module_name == "IRD" && data.profile_detail_id != null) {                                
                profile_type = data.profile_type_id.split(',');
                profile_item_id = data.profile_item_id.split(',');
                j = 0;
                profile_type.forEach((ptype) => {
                    if(ptype == 1){
                        Cat.push(profile_item_id[j]);
                        Cat = Cat.filter((v, i, a) => a.indexOf(v) === i); 
                    }else if(ptype == 2){
                        subCat.push(profile_item_id[j]);
                        subCat = subCat.filter((v, i, a) => a.indexOf(v) === i); 
                    }else if(ptype == 3){
                        MenuItem.push(profile_item_id[j]);
                        MenuItem = MenuItem.filter((v, i, a) => a.indexOf(v) === i); 
                    }
                    j++;                    
                });            
                let expire_time = "0000-00-00 00:00:00";
                if (data.expiry_date != "0000-00-00 00:00:00") {
                    expire_time = formatDate(data.expiry_date, 1);
                    expire_time = Date.parse(expire_time);
                }
                let guest_id = "";
                if(data.guest_id != 0){
                    guest_id = data.guest_id;
                }
                profileArr[data.profile_detail_id] = {'profile_detail_id':data.profile_detail_id,'profile_name':data.profile_name,'module_name':data.module_name,'checkout':data.checkout,'never_expiry':data.never_expiry,'expiry_date':expire_time,'guest_id':guest_id,'profile_type':data.is_profile_type_enable,'in_room_device_id':data.in_room_device_id,'category':Cat.toString(),'subcategory':subCat.toString(),'menuItem':MenuItem.toString()};
                Cat = [];
                subCat = [];
                MenuItem = [];                      
            }else if (data.module_name == "TV CHANNEL" && data.profile_detail_id != null) {
                profile_type = data.profile_type_id.split(',');
                profile_item_id = data.profile_item_id.split(',');
                j = 0;
                profile_type.forEach((ptype) => {
                    if(ptype == 4){
                        Cat.push(profile_item_id[j]);
                        Cat = Cat.filter((v, i, a) => a.indexOf(v) === i); 
                    }else if(ptype == 5){
                        subCat.push(profile_item_id[j]);
                        subCat = subCat.filter((v, i, a) => a.indexOf(v) === i); 
                    }
                    j++;                    
                });                
                let expire_time = "0000-00-00 00:00:00";
                if (data.expiry_date != "0000-00-00 00:00:00") {
                    expire_time = formatDate(data.expiry_date, 1);
                    expire_time = Date.parse(expire_time);
                }
                let guest_id = "";
                if(data.guest_id != 0){
                    guest_id = data.guest_id;
                }
                profileArr[data.profile_detail_id] = {'profile_detail_id':data.profile_detail_id,'profile_name':data.profile_name,'module_name':data.module_name,'checkout':data.checkout,'never_expiry':data.never_expiry,'expiry_date':expire_time,'guest_id':guest_id,'profile_type':data.is_profile_type_enable,'in_room_device_id':data.in_room_device_id,'category':Cat.toString(),'subcategory':subCat.toString()};
                Cat = [];
                subCat = [];                                  
            }else if (data.module_name == "IPAD FEATURE" && data.profile_detail_id != null) {
                profile_type = data.profile_type_id.split(',');
                profile_item_id = data.profile_item_id.split(',');                
                j = 0;
                profile_type.forEach((ptype) => {
                    if(ptype == 6){
                        Cat.push(profile_item_id[j]);
                        Cat = Cat.filter((v, i, a) => a.indexOf(v) === i); 
                    }
//                    else if(ptype == 5){
//                        subCat.push(profile_item_id[j]);
//                    }
                    j++;                    
                });                
                let expire_time = "0000-00-00 00:00:00";
                if (data.expiry_date != "0000-00-00 00:00:00") {
                    expire_time = formatDate(data.expiry_date, 1);
                    expire_time = Date.parse(expire_time);
                }
                let guest_id = "";
                if(data.guest_id != 0){
                    guest_id = data.guest_id;
                }
                profileArr[data.profile_detail_id] = {'profile_detail_id':data.profile_detail_id,'profile_name':data.profile_name,'module_name':data.module_name,'checkout':data.checkout,'never_expiry':data.never_expiry,'expiry_date':expire_time,'guest_id':guest_id,'profile_type':data.is_profile_type_enable,'in_room_device_id':data.in_room_device_id,'category':Cat.toString()};
                Cat = [];
                subCat = [];                                  
            }
        });
        profileArr = startFromZero(profileArr);        
        callback(null, profileArr);
    });
}

//profile assigment by api
router.post('/assignProfile', (req, res) => {   
    roomProfile.assignProfile(req.body, (Err, Res) => {
        res.json({"roomProfile": Res});
    });
});


function startFromZero(arr) {
    var newArr = [];
    var count = 0;

    for (var i in arr) {
        newArr[count++] = arr[i];
    }

    return newArr;
}

function formatDate(date, t = 0) {
    var d = new Date(date),
            month = '' + (d.getMonth() + 1),
            day = '' + d.getDate(),
            year = d.getFullYear();
    var time = d.toLocaleTimeString().toLowerCase();

    if (month.length < 2)
        month = '0' + month;
    if (day.length < 2)
        day = '0' + day;
    if (t == 1) {
        return [year, month, day].join('-') + " " + time;
    } else {
        return [year, month, day].join('-');
}

}

/* Middleware for error handling */
router.use((err, req, res, next) => {
  console.log(err.stack);
  res.status(500).send('Something broke !');
});

module.exports = router
