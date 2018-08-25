config = require(__base + 'config');
let fs = require('fs');
module.exports = (params) => {
    return {
        profileModuleDropDown: (rpResult, callback) => {
            moduleDropDown(rpResult, (ltErr, ltRes) => {
                if (ltRes) {
                    callback(null, ltRes);
                } else {
                    callback(ltErr, null);
                }
            });
        },
        ipadFeature: (data, iPadFeature, tyepId, callback) => {
            ipadF(data, iPadFeature, tyepId, (rpErr, rpRes) => {
                if (rpRes) {
                    callback(null, rpRes);
                } else {
                    callback("Data is not available", null);
                }
            });
        },
        irdFeature: (data, irdCat, irdSubCat, irdMenuItem, typeId, callback) => {
            irdF(data, irdCat, irdSubCat, irdMenuItem, typeId, (rpErr, rpRes) => {
                if (rpRes) {
                    callback(null, rpRes);
                } else {
                    callback(rpErr, null);
                }
            });
        },
        roomType: (rtype, callback) => {
            roomT(rtype, (rpErr, rpRes) => {
                if (rpRes) {
                    callback(null, rpRes);
                } else {
                    callback(ltErr, null);
                }
            });
        },
        editRoomType: (rtype, callback) => {
            editRoomT(rtype, (rpErr, rpRes) => {
                if (rpRes) {
                    callback(null, rpRes);
                } else {
                    callback(ltErr, null);
                }
            });
        },
        allFloor: (allFloordata, callback) => {
            aFloor(allFloordata, (rpErr, rpRes) => {
                if (rpRes) {
                    callback(null, rpRes);
                } else {
                    callback(ltErr, null);
                }
            });
        },
        tvFeature: (data, tvCat, tvChannel, typeId, callback) => {
            tvF(data, tvCat, tvChannel, typeId, (rpErr, rpRes) => {
                if (rpRes) {
                    callback(null, rpRes);
                } else {
                    callback(rpErr, null);
                }
            });
        },
        allFloorRooms: (allFloorRoomData, callback) => {
            floopR(allFloorRoomData, (rpErr, rpRes) => {
                if (rpRes) {
                    callback(null, rpRes);
                } else {
                    callback(ltErr, null);
                }
            });
        },
        roomsHtml: (rooms, callback) => {
            roomsV(rooms, (rpErr, rpRes) => {
                if (rpRes) {
                    callback(null, rpRes);
                } else {
                    callback(rpErr, null);
                }
            });
        },
        subRoomsHtml: (rooms, subRooms, callback) => {
            subRoomsV(rooms, subRooms, (rpErr, rpRes) => {
                if (rpRes) {
                    callback(null, rpRes);
                } else {
                    callback(rpErr, null);
                }
            });
        },
        roomsEditHtml: (rooms, callback) => {
            roomsEditV(rooms, (rpErr, rpRes) => {
                if (rpRes) {
                    callback(null, rpRes);
                } else {
                    callback(rpErr, null);
                }
            });
        },
        floorRoomTabs: (floor, rooms, callback) => {
            floorRooms(floor, rooms, (rpErr, rpRes) => {
                if (rpRes) {
                    callback(null, rpRes);
                } else {
                    callback(rpErr, null);
                }
            });
        },
        editFloorRoomTabs: (floor, rooms, callback) => {
            editFloorRooms(floor, rooms, (rpErr, rpRes) => {
                if (rpRes) {
                    callback(null, rpRes);
                } else {
                    callback(rpErr, null);
                }
            });
        }
    }
};

let moduleDropDown = (data, callback) => {
    let html = "";
    html += '<label class="col-md-3 control-label">Select Module <span class="text-danger">*</span></label>';
    html += '<div class="col-md-9">';
    html += '<select class="select select_module_name featureModule" id="" name="selectmodule"> ';
    data.forEach((item) => {
        html += '<option value="' + item.module_name + '">' + item.module_name + '</option> ';
    });
    html += '</select>';
    html += '</div>';
    callback(null, html);
};
// ipad feature html code
let ipadF = (data, iPadFeature, typeId, callback) => {
    let c = 0;
    let htmlIpad = "";
    let category = iPadFeature[0].config_val;
    category = JSON.parse(category);
    category.forEach((cat) => {
        for (var myKey in cat) {
            //console.log("key:" + myKey + ", value:" + cat[myKey].name);
            if (cat[myKey].enable == true && (data.is_active == 1)) {
                htmlIpad += '<div class="clearfix selectafter_modulename">';
                htmlIpad += '    <div class="modulename_category clearfix">';
                htmlIpad += '        <div class="panel-heading">';
                htmlIpad += '            <div class="inline_block mr-15">';
                htmlIpad += '                <input type="checkbox" data-parent_id = "0" data-profile_type_id = "' + typeId[0].profile_type_id + '" value="' + myKey + '" class="styled mr-20" checked=""/>';
                htmlIpad += '            </div>';
                htmlIpad += '            <div class="inline_block">';
                htmlIpad += '                <h6 class="' + myKey + '">' + cat[myKey].name + '</h6>';
                htmlIpad += '            </div>';
                htmlIpad += '        </div>';

                htmlIpad += '            </div>';
                htmlIpad += '    </div>';
                htmlIpad += '</div>';
            } else if (cat[myKey].enable == false && (data.is_active == 0)) {
                htmlIpad += '<div class="clearfix selectafter_modulename">';
                htmlIpad += '    <div class="modulename_category clearfix">';
                htmlIpad += '        <div class="panel-heading">';
                htmlIpad += '            <div class="inline_block mr-15">';
                htmlIpad += '                <input type="checkbox" data-parent_id = "0" data-profile_type_id = "' + typeId[0].profile_type_id + '" value="' + myKey + '" class="styled mr-20"/>';
                htmlIpad += '            </div>';
                htmlIpad += '            <div class="inline_block">';
                htmlIpad += '                <h6 class="' + myKey + '">' + cat[myKey].name + '</h6>';
                htmlIpad += '            </div>';
                htmlIpad += '        </div>';

                htmlIpad += '            </div>';
                htmlIpad += '    </div>';
                htmlIpad += '</div>';
            }
        }
    });
    callback(null, htmlIpad);
};

// ird html code
let irdF = (data, irdCat, irdSubCat, irdMenuItem, typeId, callback) => {
    let htmlIrd = "";
    let d = 0;
    let e = 0;
    let f = 0;
    let checked = '';
    if (data.is_active == 1) {
        checked = 'checked="checked"';
    }
    irdCat.forEach((cat) => {
        htmlIrd += '<div class="clearfix selectafter_modulename">';
        htmlIrd += '    <div class="modulename_category clearfix">';
        htmlIrd += '        <div class="panel-heading">';
        htmlIrd += '            <div class="inline_block mr-15">';
        htmlIrd += '                <input type="checkbox" data-for="cat" data-parent_id = "0" data-profile_type_id = "' + typeId[0].profile_type_id + '" value="' + cat.category_id + '" class="styled mr-20 parent_' + cat.category_id + '" ' + checked + '/>';
        htmlIrd += '            </div>';
        htmlIrd += '            <div class="inline_block">';
        htmlIrd += '                <h6 class="ird_cat_' + cat.category_id + '">' + cat.category_name + '</h6>';
        htmlIrd += '            </div>';
        htmlIrd += '            <div class="heading-elements">';
        htmlIrd += '                <ul class="icons-list">';
        if (d == 1) {
            htmlIrd += '                    <li><a data-action="collapse" class="rotate-180" data-collapse_id=' + cat.category_id + '></a></li>';
        } else {
            htmlIrd += '                    <li><a data-action="collapse" class="rotate-180" data-collapse_id=' + cat.category_id + '></a></li>';
        }
        d++;
        htmlIrd += '                </ul>';
        htmlIrd += '            </div>';
        htmlIrd += '        </div>';
        // subcategory
        if (irdSubCat.length > 0) {
            htmlIrd += '            <div class="panel-body no-padding expand without-image-feature collapse_' + cat.category_id + '">';
            irdSubCat.forEach((subcat) => {
                if (cat.category_id == subcat.category_id) {
                    htmlIrd += '                <div class="modulename_category checkedall_sub_category inner-accordion clearfix">';
                    htmlIrd += '                    <div class="panel-heading">';
                    htmlIrd += '                        <div class="inline_block mr-15">';
                    htmlIrd += '                            <input type="checkbox" data-for="subcat" data-parent_id = "' + cat.category_id + '" data-profile_type_id = "' + typeId[1].profile_type_id + '"  value="' + subcat.subcat_id + '" class="styled mr-20 ' + subcat.subcat_id + '"  ' + checked + '/>';
                    htmlIrd += '                        </div>';
                    htmlIrd += '                        <div class="inline_block">';
                    htmlIrd += '                            <h6 class="ird_subcat_' + subcat.subcat_id + '">' + subcat.subcat_name + '</h6>';
                    htmlIrd += '                        </div>';
                    htmlIrd += '                        <div class="heading-elements">';
                    htmlIrd += '                            <ul class="icons-list">';
                    if (e == 1) {
                        htmlIrd += '                                <li><a data-action="collapse" class="rotate-180" data-collapse_id=' + cat.category_id + "_" + subcat.subcat_id + '></a></li>';
                    } else {
                        htmlIrd += '                                <li><a data-action="collapse" class="rotate-180" data-collapse_id=' + cat.category_id + "_" + subcat.subcat_id + '></a></li>';
                    }
                    e++;
                    htmlIrd += '                            </ul>';
                    htmlIrd += '                        </div>';
                    htmlIrd += '                    </div>';
                    if (irdMenuItem.length > 0) {
                        htmlIrd += '                   <div class="panel-body no-padding without-image-feature collapse collapse_' + cat.category_id + "_" + subcat.subcat_id + '" style="display:block;">';
                        irdMenuItem.forEach((menuitem) => {
                            if (subcat.subcat_id == menuitem.subcat_id && cat.category_id == menuitem.category_id) {
                                // menuitems
                                htmlIrd += '                        <div class="col-md-3">';
                                htmlIrd += '                            <div class="inner_subcategory">';
                                htmlIrd += '                                <div class="checkedall_category">';
                                htmlIrd += '                                    <input type="checkbox" data-for="menuitem" data-parent_id = "' + subcat.subcat_id + '" data-profile_type_id = "' + typeId[2].profile_type_id + '" value="' + menuitem.menuitem_id + '" class="styled mr-20"  ' + checked + '/>';
                                htmlIrd += '                                </div>';
                                htmlIrd += '                                <div class="modulename_subcategory_name">';
                                htmlIrd += '                                    <p class="truncate ird_menuitem_' + menuitem.menuitem_id + '" data-toggle="tooltip"  title="' + menuitem.menuitem_name + '">' + menuitem.menuitem_name + '</p>';
                                htmlIrd += '                                </div>';
                                htmlIrd += '                            </div>';
                                htmlIrd += '                        </div>';
                            }
                        });
                        htmlIrd += '                    </div>';
                    }
                    htmlIrd += '                 </div>';
                }
            });
        }
        htmlIrd += '                </div>';
        htmlIrd += '            </div>';
        htmlIrd += '    </div>';
        htmlIrd += '</div>';
    });

    callback(null, htmlIrd);
};
let roomT = (rtype, callback) => {
    let roomType = "";
    roomType += '<div class="col-md-6 mt-15 pb-20">';
    roomType += '<select  multiple="" class="select select_room_types" id="roomTypeId" onchange="removeFirstOption(' + "'roomTypeId'" + ')" name="selectroomtype" data-placeholder="Select Room Types" required="required" data-msg="Please enter room types">';
    roomType += '<option value="">Select Room Types</option>';
    roomType += '<option value="all">All</option>';
    rtype.forEach((data) => {
        roomType += '<option value="' + data.key_category_id + '">' + data.name + '</option>';
    });
    roomType += '</select>';
    roomType += '</div>';
    callback(null, roomType);
};

let editRoomT = (rtype, callback) => {
    let roomType = "";
    roomType += '<div class="col-md-6 mt-15 pb-20">';
    roomType += '<select  multiple="" class="select edit_select_room_types" id="editRoomTypeId" onchange="removeFirstOption(' + "'editRoomTypeId'" + ')" name="selectroomtype" data-placeholder="Select Room Types" required="required" data-msg="Please enter room types">';
    roomType += '<option value="">Select Room Types</option>';
    roomType += '<option value="All">All</option>';
    rtype.forEach((data) => {
        roomType += '<option value="' + data.key_category_id + '">' + data.name + '</option>';
    });
    roomType += '</select>';
    roomType += '</div>';
    callback(null, roomType);
};

let aFloor = (allFloordata, callback) => {
    let floorHtml = "";
    allFloordata.forEach((data) => {
        floorHtml += '<li>';
        floorHtml += '<a href="#' + data.name + '" data-fid="' + data.floor_id + '" data-toggle="tab">';
        floorHtml += '<span>' + data.name + '</span>';
        floorHtml += '<span class="pull-right">None</span>';
        floorHtml += '</a>';
        floorHtml += '</li>';
    });
    callback(null, floorHtml);
};

// Tv html code
let tvF = (data, tvCat, tvChannel, typeId, callback) => {
    let htmlTv = "";
    let t = 0;        
    let checked = '';
    if (data.is_active == 1) {
        checked = 'checked="checked"';
    }

    let d = 0;
    tvCat.forEach((cat) => {
        htmlTv += '<div class="clearfix selectafter_modulename">';
        htmlTv += '    <div class="modulename_category clearfix">';
        htmlTv += '        <div class="panel-heading">';
        htmlTv += '            <div class="inline_block mr-15">';
        htmlTv += '                <input type="checkbox" data-for="cat" data-parent_id = "0" data-profile_type_id = "' + typeId[0].profile_type_id + '" value="' + cat.tvchannel_category_id + '" class="styled mr-20 parent_' + cat.tvchannel_category_id + '" ' + checked + '/>';
        htmlTv += '            </div>';
        htmlTv += '            <div class="inline_block">';
        htmlTv += '                <h6 class="tv_cat_' + cat.tvchannel_category_id + '">' + cat.category_name + '</h6>';
        htmlTv += '            </div>';
        htmlTv += '            <div class="heading-elements">';
        htmlTv += '                <ul class="icons-list">';
        htmlTv += '                    <li><a data-action="collapse" class="rotate-180" data-collapse_id=' + cat.tvchannel_category_id + '></a></li>';        
        htmlTv += '                </ul>';
        htmlTv += '            </div>';
        htmlTv += '        </div>';
        // subcategory
        if (tvChannel.length > 0) {
            htmlTv += '            <div class="panel-body no-padding collapse without-image-feature collapse_' + cat.tvchannel_category_id + '"  style="display:block;">';
            tvChannel.forEach((channel) => {
                if (cat.tvchannel_category_id == channel.tvchannel_category_id) {
                    htmlTv += '                <div class="col-md-3">';
                    htmlTv += '                     <div class="inner_subcategory">';
                    htmlTv += '                         <div class="checkedall_category">';
                    htmlTv += '                             <input type="checkbox" data-for="subcat" data-parent_id = "' + cat.tvchannel_category_id + '" data-profile_type_id = "' + typeId[1].profile_type_id + '" value="' + channel.tvchannel_id + '" class="styled mr-20"  ' + checked + '/>';
                    htmlTv += '                         </div>';
                    htmlTv += '                         <div class="modulename_subcategory_name">';
                    htmlTv += '                             <p class="truncate tv_subcat_' + channel.tvchannel_id + '" data-toggle="tooltip" title="' + channel.tvchannel_name + '">' + channel.tvchannel_name + '</p>';
                    htmlTv += '                         </div>';
                    htmlTv += '                     </div>';
                    htmlTv += '                </div>';
                }
            });
            htmlTv += '                </div>';
        }
        htmlTv += '            </div>';
        htmlTv += '    </div>';
        htmlTv += '</div>';
    });
    callback(null, htmlTv);
};
let floopR = (allFloorRoomData, callback) => {
    let floorRoomsHtml = "";
    allFloorRoomData.forEach((data) => {
        floorRoomsHtml += '<li class="list_item_menuname roomliitem" data-rid="' + data.key_id + '" room-number="' + data.number + '">';
        floorRoomsHtml += '<a href="javascript:void(0);">';
        floorRoomsHtml += '<input type="checkbox" name="floor" value="' + data.number + '" class="styled"/>&nbsp;' + data.number;
        floorRoomsHtml += '</a>';
        floorRoomsHtml += '</li>';
    });
    callback(null, floorRoomsHtml);
};
//roomsV

let roomsV = (roomData, callback) => {
    let roomsHtml = "";
    roomData.forEach((data) => {
        console.log("datadata", data)
        roomsHtml += '<li class="list_item_menuname roomliitem" data-ridt="' + data.key_id + '" room-number="' + data.number + '">';
        roomsHtml += '  <div class="rooms_checkbox_pr">';
        roomsHtml += '      <div class="checker">';
        roomsHtml += '          <span><input type="checkbox" name="rooms" values="' + data.key_id + '" class="styled ui-wizard-content"></span>';
        roomsHtml += '      </div>';
        roomsHtml += '  </div>';
        roomsHtml += '  <a href="#room-' + data.number + '" aria-controls="home" role="tab" data-toggle="tab">';
        roomsHtml += '      <span class="">Room-' + data.number + '</span>';
        roomsHtml += '  </a>';
        roomsHtml += '</li>';
    });
    callback(null, roomsHtml);
};

let subRoomsV = (roomData, subRooms, callback) => {    
    let roomsHtml = "";
    roomData.forEach((data) => {
        console.log("datadata", data)
        roomsHtml += '<div role="tabpanel" class="tab-pane by_roomtype_subrooms_parent" id="' + data.number + '">';
        roomsHtml += '  <div class="switch-header clearfix border-left-gray">';
        roomsHtml += '      <div class="inline_block by_roomtype_select_all_subrooms">';
        roomsHtml += '          <input type="checkbox" class="styled select_all_types_rooms"/>';
        roomsHtml += '      </div>';
        roomsHtml += '      <div class="inline_block">';
        roomsHtml += '          <h6 class="">Select all Sub-Room</h6>';
        roomsHtml += '      </div>';
        roomsHtml += '      <div class="dv-custom-search switch-search pull-right">';
        roomsHtml += '          <div class="has-feedback has-feedback-right">';
        roomsHtml += '              <input type="search" class="form-control dv-search-input room-search-by-room-type" id="room_search_room_type" placeholder="Search by Room Number " aria-invalid="false">';
        roomsHtml += '              <div class="form-control-feedback">';
        roomsHtml += '                  <i class="icon-search4 text-size-base text-muted"></i>';
        roomsHtml += '              </div>';
        roomsHtml += '          </div>';
        roomsHtml += '      </div>';
        roomsHtml += '  </div>';
        roomsHtml += '  <div class="switch-item fix-height-min-max room-number-data">';
        roomsHtml += '      <ul class="by_roomtype_subrooms_ul">';
        subRooms.forEach((inRoom) => {
            if (inRoom.key_id == data.key_id) {
                roomsHtml += '          <li class="list_item_menuname roomliitem" room-number="' + data.number + '">';
                roomsHtml += '              <a href="javascript:void(0);"><input type="checkbox" class="styled mr-10"/>' + data.number + ' ' + inRoom.display_name + ' </a>';
                roomsHtml += '          </li>';
                roomsHtml += '          <li class="list_item_menuname roomliitem" room-number="' + data.number + '">';
                roomsHtml += '              <a href="javascript:void(0);"><input type="checkbox" class="styled mr-10"/>' + data.number + ' ' + inRoom.display_name + ' </a>';
                roomsHtml += '          </li>';
                roomsHtml += '          <li class="list_item_menuname roomliitem" room-number="' + data.number + '">';
                roomsHtml += '              <a href="javascript:void(0);"><input type="checkbox" class="styled mr-10"/>' + data.number + ' ' + inRoom.display_name + ' </a>';
                roomsHtml += '          </li>';
            }
        });
        roomsHtml += '      </ul>';
        roomsHtml += '  </div>';
        roomsHtml += '</div>';
    });
    callback(null, roomsHtml);
};

let roomsEditV = (roomData, callback) => {
    let roomsHtml = "";
    roomData.forEach((data) => {
        roomsHtml += '<li class="list_item_menuname roomliitem" data-ridt="' + data.key_id + '" room-number="' + data.number + '">';
        roomsHtml += '<a href="javascript:void(0);">';
        roomsHtml += '<input type="checkbox" name="roomV[]" data-keyID="' + data.key_id + '" id="rooms_' + data.key_id + '" required="required" data-msg="Please enter room types" data-catid="' + data.key_category_id + '" value="' + data.number + '" class="styled"/>&nbsp;' + data.number;
        roomsHtml += '</a>';
        roomsHtml += '</li>';
    });
    callback(null, roomsHtml);
};
let floorRooms = (floor, rooms, callback) => {
    let f = 0, l = 0;
    let frhtml = "";
    frhtml += '<div class="col-md-6 pl-0 pr-0">';
    frhtml += '<div class="switch-header clearfix">';
    frhtml += '<h6 class="pull-left">By Floor</h6>';
    frhtml += '<h6 class="pull-right">Selected Rooms</h6>';
    frhtml += '</div>';
    frhtml += '<ul class="nav nav-tabs1 nav-tabs-highlight1 fix-height-min-max floor_tittle_tab">';
    floor.forEach((data) => {
        f++;
        if (f == 1)
        {
            frhtml += '<li class="active">';
        } else {
            frhtml += '<li class="">';
        }
        frhtml += '<a href="#Floor' + data.floor_id + '" data-toggle="tab" data-floorid="' + data.floor_id + '">';
        frhtml += '<span>' + data.name + '</span>';
        frhtml += '<span class="pull-right">None</span>';
        frhtml += '</a>';
        frhtml += '</li> ';
    });
    frhtml += '</ul>';
    frhtml += '</div>';
    frhtml += '<div class="col-md-6 pr-0 pl-0 border-left-gray">  ';
    frhtml += '<div class="nav-tabs-vertical1 nav-tabs-left1">';
    frhtml += '<div class="tab-content show_room_numbers">';
    floor.forEach((fdata) => {
        l++;
        if (l == 1) {
            frhtml += '<div class="tab-pane active" id="Floor' + fdata.floor_id + '">';
        } else {
            frhtml += '<div class="tab-pane" id="Floor' + fdata.floor_id + '">';
        }
        frhtml += '<div class="switch-header clearfix">';
        frhtml += '<div class="inline_block">';
        frhtml += '<input type="checkbox" name="floor_rooms" class="styled"/>';
        frhtml += '</div>';
        frhtml += '<div class="inline_block">';
        frhtml += '<h6 class="">&nbsp;&nbsp;&nbsp;Select all Rooms</h6>';
        frhtml += '</div>';
        frhtml += '<div class="inline_block">';
        frhtml += '&nbsp;&nbsp;&nbsp;<span style="color:red" class="room_err_msg"></span>';
        frhtml += '</div>';
        frhtml += '<div class="dv-custom-search switch-search pull-right">';
        frhtml += '<div class="has-feedback has-feedback-right">';
        frhtml += '<input type="search" name="search" class="form-control dv-search-input room-search" id="room_search_floor_' + fdata.floor_id + '" placeholder="Search by Room Number " aria-invalid="false">';
        frhtml += '<div class="form-control-feedback">';
        frhtml += '<i class="icon-search4 text-size-base text-muted"></i>';
        frhtml += '</div>';
        frhtml += '</div>';
        frhtml += '</div>';
        frhtml += '</div>';
        frhtml += '<div class="switch-item fix-height-min-max room-number-data">';
        frhtml += '<ul>';
        rooms.forEach((rdata) => {
            if (fdata.floor_id == rdata.floor_id)
            {
                frhtml += '<li class="list_item_menuname roomliitem" room-number="' + rdata.number + '">';
                frhtml += '<a href="javascript:void(0);">';
                frhtml += '<input type="checkbox" name="roomNu[]" data-keyID="' + rdata.key_id + '" data-floorid="' + fdata.floor_id + '" value="' + rdata.number + '" data-roomnu="' + rdata.number + '" class="styled floor_rooms_checkbox"/>&nbsp;' + rdata.number;
                frhtml += '</a>';
                frhtml += '</li>';
            }
        });
        frhtml += '</ul>';
        frhtml += '</div>';
        frhtml += '</div>';
    }); // floor end
    frhtml += '</div>';
    frhtml += '</div>';
    frhtml += '</div>';
    callback(null, frhtml);
}

let editFloorRooms = (floor, rooms, callback) => {
    let f = 0, l = 0;
    let frhtml = "";
    frhtml += '<div class="col-md-6 pl-0 pr-0">';
    frhtml += '<div class="switch-header clearfix">';
    frhtml += '<h6 class="pull-left">By Floor</h6>';
    frhtml += '<h6 class="pull-right">Selected Rooms</h6>';
    frhtml += '</div>';
    frhtml += '<ul class="nav nav-tabs1 nav-tabs-highlight1 fix-height-min-max floor_tittle_tab">';
    floor.forEach((data) => {
        f++;
        if (f == 1)
        {
            frhtml += '<li class="active">';
        } else {
            frhtml += '<li class="">';
        }
        frhtml += '<a href="#editFloor' + data.floor_id + '" data-toggle="tab" data-floorid="' + data.floor_id + '">';
        frhtml += '<span>' + data.name + '</span>';
        frhtml += '<span class="pull-right">None</span>';
        frhtml += '</a>';
        frhtml += '</li> ';
    });
    frhtml += '</ul>';
    frhtml += '</div>';
    frhtml += '<div class="col-md-6 pr-0 pl-0 border-left-gray">  ';
    frhtml += '<div class="nav-tabs-vertical1 nav-tabs-left1">';
    frhtml += '<div class="tab-content edit_show_room_numbers">';
    floor.forEach((fdata) => {
        l++;
        if (l == 1) {
            frhtml += '<div class="tab-pane active" id="editFloor' + fdata.floor_id + '">';
        } else {
            frhtml += '<div class="tab-pane" id="editFloor' + fdata.floor_id + '">';
        }
        frhtml += '<div class="switch-header clearfix">';
        frhtml += '<div class="inline_block">';
        frhtml += '<input type="checkbox" name="edit_floor" class="styled"/>';
        frhtml += '</div>';
        frhtml += '<div class="inline_block">';
        frhtml += '<h6 class="">&nbsp;&nbsp;&nbsp;Select all Rooms</h6>';
        frhtml += '</div>';
        frhtml += '<div class="inline_block">';
        frhtml += '&nbsp;&nbsp;&nbsp;<span style="color:red" class="room_err_msg"></span>';
        frhtml += '</div>';
        frhtml += '<div class="dv-custom-search switch-search pull-right">';
        frhtml += '<div class="has-feedback has-feedback-right">';
        frhtml += '<input type="search" name="search" class="form-control dv-search-input edit_room_search_room_type_by_floor" id="edit_room_search_floor_' + fdata.floor_id + '" placeholder="Search by Room Number " aria-invalid="false">';
        frhtml += '<div class="form-control-feedback">';
        frhtml += '<i class="icon-search4 text-size-base text-muted"></i>';
        frhtml += '</div>';
        frhtml += '</div>';
        frhtml += '</div>';
        frhtml += '</div>';
        frhtml += '<div class="switch-item fix-height-min-max room-number-data">';
        frhtml += '<ul>';
        rooms.forEach((rdata) => {
            if (fdata.floor_id == rdata.floor_id)
            {
                frhtml += '<li class="list_item_menuname roomliitem" room-number="' + rdata.number + '">';
                frhtml += '<a href="javascript:void(0);">';
                frhtml += '<input type="checkbox" name="roomNu[]" data-keyID="' + rdata.key_id + '" data-floorid="' + fdata.floor_id + '" value="' + rdata.number + '" data-roomnu="' + rdata.number + '" class="styled checkbox_' + rdata.key_id + '"/>&nbsp;' + rdata.number;
                frhtml += '</a>';
                frhtml += '</li>';
            }
        });
        frhtml += '</ul>';
        frhtml += '</div>';
        frhtml += '</div>';
    }); // floor end
    frhtml += '</div>';
    frhtml += '</div>';
    frhtml += '</div>';
    callback(null, frhtml);
}


                                                                                   