let config    = require(__base + '/config'),
isJSON  = require('is-valid-json'),
moment     = require('moment');

module.exports = (params) => {
  return {
    getPageTitle: (languageText, callback) => {
      pageTitleMarkup(languageText, (ltErr, ltRes) => {
        if(ltRes) {
          callback(null, ltRes);
        } else {
          callback(ltErr, null);
        }
      });
    },
    getTabOptions: (languageText, callback) => {
      tabOptionsMarkup(languageText, (ltErr, ltRes) => {
        if(ltRes) {
          callback(null, ltRes);
        } else {
          callback(ltErr, null);
        }
      });
    },
    getShowingRecords: (languageText, callback) => {
      showingRecordsMarkup(languageText, (ltErr, ltRes) => {
        if(ltRes) {
          callback(null, ltRes);
        } else {
          callback(ltErr, null);
        }
      });
    },
    getFilters: (languageText, callback) => {
      filtersMarkup(languageText, (ltErr, ltRes) => {
        if(ltRes) {
          callback(null, ltRes);
        } else {
          callback(ltErr, null);
        }
      });
    },
    getOrders: (data, callback) => {
      irdOrderMarkup(data, (goErr, goRes) => {
        if(goRes) {
          callback(null, goRes);
        } else {
          callback(goErr, null);
        }
      });
    },
    getOrderDetails: (data, callback) => {
      irdOrderDetailsMarkup(data, (gdErr, gdRes) => {
        console.log('gdRes');
        console.log(gdRes);
        if(gdRes) {
          callback(null, gdRes);
        } else {
          callback(gdRes, null);
        }
      });
    }
  }
};

let pageTitleMarkup = (languageText, callback) => {
  let html = '<h4>' + languageText.page_title + '</h4>';
  callback(null, html);
};

let tabOptionsMarkup = (languageText, callback) => {
  let activeClass = 'active';
  let hrefId = 1;
  if(isJSON(languageText.tab_options)) {
    let html = '';
    let dataArray = JSON.parse(languageText.tab_options);

    html += '<ul class="nav nav-tabs nav-tabs-solid nav-tabs-component">';
    dataArray.forEach((item) => {
      html    += '<li class="'+activeClass+'" ' + item.dataAttr + '>';
      html    += '<a href="#solid-rounded-tab'+hrefId+'" data-toggle="tab">';
      html    += item.title;
      //html    += '<span class="badge bg-grey-600 ird-badge">4</span>';
      html    += '</a></li>';
      activeClass=''
      hrefId++;
    });
    html += '</ul>';
    callback(null, html);
  } else {
    callback('Data for tab options is not a valid JSON', null);
  }
};

let showingRecordsMarkup = (languageText, callback) => {
  let html = '<p class="text-muted">'
  +languageText.showing_search_text+'</p>';
  console.log(html);
  callback(null, html);
};

let filtersMarkup = (languageText, callback) => {
  let html = '<p class="navbar-text">Filter:</p>';
  html += '<ul class="nav navbar-nav">';

  html += '<li class="dropdown">';
  html += '<a href="#" class="dropdown-toggle legitRipple" ';
  html += 'data-toggle="dropdown" aria-expanded="false">';
  html += '<i class="icon-sort-time-asc position-left"></i>';
  html += '<span data-otime>By Order Time </span>';
  html += '<span class="caret"></span>';
  html += '</a>';

  html += '<ul class="dropdown-menu">';

  html += '<li>';
  html += '<a href="javascript:void(0);" data-byorder="all" ';
  html += 'data-showtext="Show All">';
  html += '<i class="fa fa-check"></i>Show All</a>';
  html += '</li>';

  html += '<li class="divider"></li>';

  html += '<li><a href="javascript:void(0);" data-byorder="today" ';
  html += 'data-showtext="Today">';
  html += 'Today</a>';
  html += '</li>';

  html += '<li><a href="javascript:void(0);" data-byorder="yesterday" ';
  html += 'data-showtext="Yesterday">';
  html += 'Yesterday</a>';
  html += '</li>';

  html += '<li><a href="javascript:void(0);" data-byorder="last-7-days" ';
  html += 'data-showtext="Last 7 days">';
  html += 'Last 7 days</a>';
  html += '</li>';

  html += '</ul>';
  html += '</li>';

  html += '<li class="dropdown">';
  html += '<a href="#" class="dropdown-toggle legitRipple" ';
  html += 'data-toggle="dropdown" aria-expanded="false">';
  html += '<i class="icon-sort-amount-desc position-left"></i> ';
  html += '<span data-dtime>By Delivery Time </span><span class="caret"></span>';
  html += '</a>';

  html += '<ul class="dropdown-menu">';

  html += '<li>';
  html += '<a href="javascript:void(0);" data-bydelivery="all" ';
  html += 'data-showtext="Show All">';
  html += '<i class="fa fa-check"></i>Show All</a>';
  html += '</li>';

  html += '<li class="divider"></li>';

  html += '<li><a href="javascript:void(0);" data-bydelivery="today" ';
  html += 'data-showtext="Today">';
  html += 'Today</a>';
  html += '</li>';

  html += '<li><a href="javascript:void(0);" data-bydelivery="yesterday" ';
  html += 'data-showtext="Yesterday">';
  html += 'Yesterday</a>';
  html += '</li>';

  html += '<li><a href="javascript:void(0);" data-bydelivery="last-7-days" ';
  html += 'data-showtext="Last 7 days">';
  html += 'Last 7 days</a>';
  html += '</li>';

  html += '</ul>';

  html += '</li>';

  html += '</ul>';
  callback(null, html);
};

let irdOrderMarkup = (data, callback) => {
  // moment(j.modified_on, "M/D/YYYY H:mm")
  let html  = '';
  let count = 1;
  data.forEach((item) => {
    html += '<li data-orderid="'+item.order_id+'">';
    html += '<a href="javascript:void(0)">';
    html += '<div class="row">';
    html += '<div class="col-md-12 pa-0">';
    html += '<div class="msg-text col-xs-7 truncate">';
    html += '<h6>';
    html += item.guest_name;
    html += '</h6>';
    html += '<span class="display-block">Room No.: ';
    html += item.room_number;
    html += '</span>';
    html += '</div>';
    html += '<div class="msg-date truncate col-xs-5">';
    html += moment(item.order_time).format("ll");
    html += '<span class="display-block">';
    html += moment(item.order_time).format("LT");
    html += '</span>';
    html += '</div>';
    html += '</div>';
    html += '</div>';
    html += '</a>';
    html += '</li>';
    count ++;
  });
  callback(null, html);
};

let irdOrderDetailsMarkup = (data, callback) => {
  let html  = '';
  if(data.length > 0) {
    guestDetailsMarkup(data, (gdMarkup) => {
    html += gdMarkup;
    html += '<div class="order-detail-text">';
    html += '<h6>Order Details:</h6>';
    html += '</div>';

    html += '<div class="row">';
    html += '<div class="table-responsive">';
    html += '<table class="table table-lg cke_show_border withoutalter-table table-bordered">';

    getMenuItemTableHeaderMarkup(data, (thMarkup) => {
      html += thMarkup;
      html += '<tbody>';

      let dataObj =  [];
      data.forEach((i) => {
        if(i.item_type=='menuitem') {
          let modifierGroup = [];
          data.forEach((j) => {
            if(
              j.item_type=='modifiergroup' &&
              j.parent_id==i.order_item_id) {
                let modifierName = '';
                let modifierPrice = '';
                data.forEach((k) => {
                  if(
                    k.item_type=='modifier' &&
                    k.parent_id==j.order_item_id) {
                      modifierGroup.push({
                        group_name: j.item_name,
                        modifier_name: k.item_name,
                        modifier_price: k.item_price,
                        modifier_quantity: j.no_of_items
                      });
                    }
                });
            }
          });

          dataObj.push({
            menu_item_name: i.item_name,
            order_number: i.order_number,
            quantity: i.no_of_items,
            menu_item_price: i.item_price,
            modifier_group: modifierGroup,
            grand_total: i.order_total,
            order_note: (i.order_note).length > 200 ?
            (i.order_note).substring(0, 200) + '..' :  i.order_note
          });
        }
      });
        renderMenuItem(dataObj, (miMarkup) => {
          html += miMarkup;
            getMenuItemsGrandTotalMarkup(data, (gtMarkup) => {
              html += gtMarkup;
              html += '</tbody>';
              html += '</table>';
              html += '</div>';
              html += '</div>';
              callback(null, html);
            });
        });
      });
    });
  } else  {
    html += '<div class="text-center">';
    html += '<img src="assets/dist/img/no_content.png"></div>';
    html += '<p class="text-center m-10 text-muted">Details unavailable.</p>';
    html += '<p class="text-center m-10 text-muted">';
    html += 'There is no detail available for this order. Please contact ';
    html += 'you administrator</p>';
    callback(null, html);
  }
};

let guestDetailsMarkup = (data, callback) => {
  let html = '';
  if(data.length > 0) {
    let guestInfo = data[0];

    html += '<div class="row">';
    html += '<div class="col-sm-6 ird-content-group">';

    html += '<ul class="list-condensed list-unstyled">';
    html += '<li>Guest Name: <span>' + guestInfo.guest_name +'</span></li>';
    html += '<li>Room No.: <span>' + guestInfo.room_number +'</span></li>';
    html += '<li>Guest Count: <span>' + guestInfo.guest_count +'</span></li>';
    html += '</ul>';

    html += '</div>';

    html += '<div class="col-sm-6 ird-content-group">';
    html += '<div class="invoice-details">';

    html += '<ul class="list-condensed list-unstyled">';
    html += '<li>Order Date & Time: <span class="text-semibold">';
    html += moment(guestInfo.order_time).format("LLL");
    html += '</span></li>';
    html += '<li> Requested Delivery Time: ';
    html += '<span class="text-semibold">';
    html += moment(guestInfo.delivery_time).format("LLL");
    html += '</span></li>';
    html += '</ul>';

    html += '</div>';

    html += '</div>';
    html += '</div>';
  }

  callback(html);
};
let getMenuItemTableHeaderMarkup = (data, callback) => {
  let html = '';
  if(data.length > 0) {
    html += '<thead>';
    html += '<tr>';
    html += '<th class="col-sm-2 text-center">Item No.</th>';
    html += '<th>Item Name & Add-on Details</th>';
    html += '<th class="col-sm-1 text-center">Qty</th>';
    html += '<th class="col-sm-1 text-center">Price</th>';
    html += '</tr>';
    html += '</thead>';
  }
  callback(html);
};
let renderMenuItem = (miObj, callback) => {
  let html = '';
  let miCount = 1;
  console.log(miObj);
  miObj.forEach((i) => {
    html += '<tr>';
    html += '<td class="text-center">' + miCount + '</td>';
    html += '<td>';
    html += '<h6 class="no-margin pl-0">' + i.menu_item_name + '</h6>';

    if((i.modifier_group).length > 0) {
      html += '<table class="ird-data-inner-table">';
      html += '<tbody>';
      (i.modifier_group).forEach((j) => {
        html += '<tr>';
        html += '<td width="34%">' + j.group_name + '</td>';
        html += '<td width="2%">: </td>';
        html += '<td width="44%">' + j.modifier_name + '</td>';
        html += '<td width="20%">';
        html += config.hotelProperties.currency ;
        html += j.modifier_price * j.modifier_quantity;
        html += '</td>'
        html += '</tr>';
      });
      html += '</tbody>';
      html += '</table>';
    }
    console.log('i.order_note = ' + i.order_note);
    html += '<span class="text-muted">'+i.order_note+'</span>';
    html += '</td>';

    html += '<td class="text-center">' + i.quantity + '</td>';
    html += '<td class="text-center">';
    html += '<span class="text-semibold">';
    html += config.hotelProperties.currency + ' ';
    html += i.menu_item_price * i.quantity;
    html += '</span></td>';
    html += '</tr>';
    miCount++;
  });
  callback(html);
};

let getMenuItemsGrandTotalMarkup = (data, callback) => {
  let html = '';
  if(data.length > 0) {
    html += '<tr>';
    html += '<td colspan="3" align="right"> <h6>Grand Total</h6></td>';
    html += '<td> <h5 class="text-semibold">';
    html += config.hotelProperties.currency + ' ' + (data[0]).order_total;
    html += '</h5></td>';
    html += '</tr>';
  }
  callback(html);
}
