let config    = require(__base + '/config'),
isJSON  = require('is-valid-json'),
moment     = require('moment');

module.exports = (params) => {
  return {
   
    
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
    getServiceData: (data,pageServiceView, callback) => {
      serviceAssistanceMarkup(data,pageServiceView, (gsErr, gsRes) => {
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

let serviceAssistanceMarkup = (data,pageServiceView, callback) => {
  // moment(j.modified_on, "M/D/YYYY H:mm")
  let html  = '',
      tableDataAction='',
      id ='';

 

  data.forEach((item) => {

    html+=` <tr  data-serviceid=`+item.service_id+`>
          <td class="dv-dt-wrap">`+item.room_number+`</td>                                    
          <td>`+item.service_type+`</td>
          <td>`+item.no_of_items+`</td>
          <td>`+item.guest_name+`</td>
          <td>`+item.order_note+`</td>
          <td>`+ moment(item.created_on).format("YYYY-MM-DD hh:mm:ss")+`</td>
          <td>
          <div class="dv-dot-wrap">
          <ul class="icons-list">
          <li class="dropdown">
          <a href="#" class="dropdown-toggle" data-placement="bottom-left" data-toggle="dropdown">
          <i class="icon-more2"></i>
          </a>
          `+actionButton(item.service_id,pageServiceView)+`
          </li>
          </ul>
          </div>
          </td>
          </tr>` 
    
   
  });


  callback(null, html);
};


let actionButton =(serviceId,pageServiceView)=>{
  let tableDataAction=""
  if(pageServiceView=="pending")
  {
    tableDataAction=`<ul class="dropdown-menu dropdown-menu-right">
    <li>
    <a href="javascript:void(0)" data-toggle="modal" data-target="#view_request_modal" data-detailId=`+serviceId+`>View</a>
    </li>
    <li class="completeRequest">
    <a dataid="5" href="javascript:void(0)" data-toggle="modal" data-target="#completeRequest">Complete</a>
    </li>
    <li class="cancelRequest">
    <a dataid="1" href="javascript:void(0)" data-toggle="modal"  data-target="#cancelRequest">Cancel</a>
    </li>
    </ul>`
  }else if(pageServiceView=="completed"){
    tableDataAction=`<ul class="dropdown-menu dropdown-menu-right">
    <li>
    <a href="javascript:void(0)" data-toggle="modal" data-target="#view_request_modal" data-detailId=`+serviceId+`>View</a>
    </li>
    </ul>`

  }else if(pageServiceView=="cancelled"){
    tableDataAction=`<ul class="dropdown-menu dropdown-menu-right">
    <li>
    <a href="javascript:void(0)" data-toggle="modal" data-target="#view_request_modal" data-detailId=`+serviceId+`>View</a>
    </li>
    </ul>`
  }
 return tableDataAction;
}

let serviceAssistancerDetailsMarkup = (dataReq, callback) => {

  let data=dataReq[0];

  let html  = `  <div class="modal-header">
  <button type="button" class="close" data-dismiss="modal">&times;</button>
  <h4 class="modal-title">View Request Detail</h5>
</div>
<div class="modal-body"  > 


  <div class="row">
                  <div class="col-md-12">
                  <table class="table alternate-color full-width table-bordered" id="list_tbl_complete">
                  <tbody class="dv-customScroll">
                  <tr>
                  <td>Room Number</td>
                  <td>`+data.room_number+`</td>                                
                  </tr>
                  <tr>
                  <td>Guest Name</td>
                  <td>`+data.guest_name+`</td>                                
                  </tr>
                  <tr>
                  <td>Qty.</td>
                  <td>`+data.no_of_items+`</td>                                
                  </tr>

                  <tr>
                  <td>Data & Time</td>
                  <td>`+ moment(data.created_on).format("YYYY-MM-DD hh:mm:ss")+`</td>                                
                  </tr>
                  <tr>
                  <td>Request Item</td>
                  <td>`+data.service_type+`</td>                                
                  </tr>
                  <tr>
                  <td>Special Instruction</td>
                  <td>`+data.order_note+`</td>                                
                  </tr>
                  </tbody>
                  </table>
                  </div>
                  </div>
                  </div>
                  <div class="modal-footer">
                    <button class="btn btn-default dv-custom-btn btn-xs pull-right" data-dismiss="modal">Cancel</button>
                  </div>`
  callback(null, html);
};

// let htmlShowingTotalRecordMarkup =(data,callback)=>{


     
//   callback(null, html);

  
// }

          


                           
                               