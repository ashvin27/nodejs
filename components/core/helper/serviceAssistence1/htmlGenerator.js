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
    getServiceData: (data, callback) => {
      serviceAssistanceMarkup(data, (gsErr, gsRes) => {
        if(gsRes) {
          callback(null, gsRes);
        } else {
          callback(gsErr, null);
        }
      });
    },
    getServiceDetails: (data, callback) => {
      serviceAssistancerDetailsMarkup(data, (gsErr, gsRes) => {
        if(gsRes) {
          callback(null, gsRes);
        } else {
          callback(gsRes, null);
        }
      });
    },
    htmlShowingTotalRecord: (data, callback) => {
      htmlShowingTotalRecordMarkup(data, (gsErr, gsRes) => {
            if(gsRes) {
          callback(null, gsRes);
        } else {
          callback(gsRes, null);
        }
      });
    },
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

  callback(null, html);
};

let filtersMarkup = (languageText, callback) => {
  let html = '<p class="navbar-text">Filter:</p>';
  html += '<ul class="nav navbar-nav">';

  html += '<li class="dropdown">';
  html += '<a href="#" class="dropdown-toggle legitRipple" ';
  html += 'data-toggle="dropdown" aria-expanded="false">';
  html += '<i class="icon-sort-time-asc position-left"></i>';
  html += '<span data-otime>By Time </span>';
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

  html += '<li><a href="javascript:void(0);" data-byorder="this-month" ';
  html += 'data-showtext="This Month">';
  html += 'This Month</a>';
  html += '</li>';

  html += '<li><a href="javascript:void(0);" data-byorder="this-year" ';
  html += 'data-showtext="This Year">';
  html += 'This Year</a>';
  html += '</li>';
  

  html += '</ul>';
  html += '</li>';

  html += '</ul>';
  callback(null, html);
};

let serviceAssistanceMarkup = (data, callback) => {
  // moment(j.modified_on, "M/D/YYYY H:mm")
  let html  = '';
  let count = 1;
  data.forEach((item) => {
    html += '<li data-serviceid="'+item.service_id+'">';
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
    html += moment(item.created_on).format("ll");
    html += '<span class="display-block">';
    html += moment(item.created_on).format("LT");
    html += '</span>';
    html += '</div>';
    html += '</div>';
    html += '</div>';
    // html += '<div class="row">';
    // html += '<span class="display-block">';
    // html += 'Mr/Mrs.'+item.guest_name +' has reqested '+item.service_type;
    // html += '</span>';
    // html += '</div>';
    html += '</a>';
    html += '</li>';
    count ++;
  });
  callback(null, html);
};


let serviceAssistancerDetailsMarkup = (dataReq, callback) => {

  let data=dataReq[0];
  let html  = '';
  html += ' <div class="panel-toolbar panel-toolbar-inbox">';
  html += '  <div class="pl-15 pr-15 navbar-default">';
  html += ' <div class="media stack-media-on-mobile">';
  html += ' <div class="media-body">';
  html += ' <h6 class="media-heading">Request Detail View</h6>';
  html += ' </div> ';
                                           
  if(data.status=="FAILED")
  {
    html += ' <div class="media-right media-middle text-nowrap">';
    html += ' <ul class="list-inline list-inline-condensed no-margin">';
    html += '    <li><a href="javascript:void(0);" onclick="applyServiceActions(`' +data.service_id + '`, `delivered`)" class="btn btn-default btn-themeClr btn-xs white">Complete</a></li>';
    html += ' <li><a  onclick="applyServiceActions(`' +data.service_id + '`, `cancel`)" class="btn btn-flat btn-border btn-xs">Cancel</a></li>';
    html += ' </ul>';
    html += ' </div>';
    
  }


    html += ' </div>';
    html += ' </div>';
    html += ' </div>';
    html += ' <div class="mail-container-read ird-order-container">';
    html += '  <div class="no-padding-bottom">';
    html += ' <div class="row">';
    html += ' <div class="col-sm-6 ird-content-group">';
    html += ' <ul class="list-condensed list-unstyled">';
    html += ' <li>Guest Name: <span>'+data.guest_name+'</span></li>';
    html += ' <li>Room No.: <span>'+data.room_number+'</span></li>';
    html += ' <li>Guest Count: <span>'+data.number_of_persons+'</span></li>';              
    html += ' </ul>';
    html += ' </div>';
    html += ' <div class="col-sm-6 ird-content-group">';
    html += ' <div class="invoice-details">';  
    html += ' <ul class="list-condensed list-unstyled">';
    html += ' <li>Date & Time: <span class="text-semibold">'+moment(data.created_on).format("ll")+moment(data.created_on).format("LT")+ '</span></li> ';                                                           
    html += ' </ul>';
    html += ' </div>';
    html += ' </div>';
    html += ' </div>';
    html += ' <div class="order-detail-text">';
    html += ' <h6>Requests Details:</h6>';
    html += ' </div>';
    html += ' <div class="row">';
    html += ' <div class="table-responsive">';
    html += ' <table class="table table-lg cke_show_border withoutalter-table table-bordered">';
    html += ' <thead>';
    html += ' <tr>                                              ';                      
    html += ' <th class="col-sm-2 text-center">Request ID</th>';
    html += ' <th class="text-left">Request Item</th>';
    html += ' <th class="text-center">Qty</th>';
    html += ' </tr>';
    html += ' </thead>';
    html += ' <tbody>';
    html += ' <tr>';
    html += ' <td class="text-center">'+data.service_id+'</td>';
    html += ' <td class="text-left"><span class="text-semibold">'+data.service_type+'</span></td>';
    html += ' <td class="text-center"> '+data.no_of_items+'</td>';
    html += ' </tr>';
    html += ' </tbody>';
    html += ' </table>';
    html += ' </div>';
    html += ' </div>';
    html += ' <div class="order-detail-text mt-20">';
    html += ' <h6>Special Instruction:</h6>';
    html += ' </div>';
    html += ' <div class="row">';
    html += ' <div class="col-md-12">';
    html += ' <p class="mt-0 mb-20"> '+data.order_note+'</p>';
    html += ' </div>';                                                  
    html += ' </div>';
    html += ' </div>';                                                  
    html += ' </div>';
    
  callback(null, html);
};

let htmlShowingTotalRecordMarkup =(data,callback)=>{

  let html ="";
      html += '  <div class="col-md-5">';
  if(data!=0 )
    {
      html += '  <p class="text-muted">Showing all '+data+' Record</p>';
    }else{
      html += '  <p class="text-muted">No Pending Service Available.</p>';
    }
  html += '  </div>';
  html += '  <div class="col-md-7 text-right">';
  html += '  <div class="row">';
  html += '  <div class="col-md-12">';
  html += '  </div>';
  html += '  </div>';
  html += '  </div>';
  callback(null, html);

  
}

          


                           
                               