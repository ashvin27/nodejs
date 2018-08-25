let msgtype = '';
module.exports = function (params) {
  return {
    getResponseMsg: (type, action, data) => {
      switch (action) {
        case 'insert':
            if(type=='success') {
              return msg(true, 'Record inserted successfully.', data, 0, 10);
            } else if(type=='failure') {
              return msg(true, 'Unable to insert record.', data, 0, 15);
            }
          break;
        case 'update':
            if(type=='success') {
              return msg(true, 'Record updated successfully.', data, 0, 20);
            } else if(type=='failure') {
              return msg(true, 'Unable to update record.', data, 0, 25);
            }
          break;
        case 'delete':
            if(type=='success') {
              return msg(true, 'Record deleted successfully', data, 0, 30);
            } else if(type=='failure') {
              return msg(true, 'Unable to delete record.', data, 0, 35);
            }
        case 'custom':
          break;
        default:
      }
    }
  };
};

let msg = (status, message, data, response_tag, code) => {
    return {
      status: status,
      message: message,
      data: data,
      response_tag: response_tag,
      code: code
    };
};
