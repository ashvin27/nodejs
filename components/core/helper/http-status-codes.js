var statusCodes = {};
var messageCodes = {};

statusCodes[exports.ACCEPTED = 202] = "Accepted";
statusCodes[exports.BAD_GATEWAY = 502] = "Bad Gateway";
statusCodes[exports.BAD_REQUEST = 400] = "Bad Request";
statusCodes[exports.CONFLICT = 409] = "Conflict";
statusCodes[exports.CONTINUE = 100] = "Continue";
statusCodes[exports.CREATED = 201] = "Created";
statusCodes[exports.EXPECTATION_FAILED = 417] = "Expectation Failed";
statusCodes[exports.FAILED_DEPENDENCY  = 424] = "Failed Dependency";
statusCodes[exports.FORBIDDEN = 403] = "Forbidden";
statusCodes[exports.GATEWAY_TIMEOUT = 504] = "Gateway Timeout";
statusCodes[exports.GONE = 410] = "Gone";
statusCodes[exports.HTTP_VERSION_NOT_SUPPORTED = 505] = "HTTP Version Not\
 Supported";
statusCodes[exports.IM_A_TEAPOT = 418] = "I'm a teapot";
statusCodes[exports.INSUFFICIENT_SPACE_ON_RESOURCE = 419] = "Insufficient\
 Space on Resource";
statusCodes[exports.INSUFFICIENT_STORAGE = 507] = "Insufficient Storage";
statusCodes[exports.INTERNAL_SERVER_ERROR = 500] = "Server Error";
statusCodes[exports.LENGTH_REQUIRED = 411] = "Length Required";
statusCodes[exports.LOCKED = 423] = "Locked";
statusCodes[exports.METHOD_FAILURE = 420] = "Method Failure";
statusCodes[exports.METHOD_NOT_ALLOWED = 405] = "Method Not Allowed";
statusCodes[exports.MOVED_PERMANENTLY = 301] = "Moved Permanently";
statusCodes[exports.MOVED_TEMPORARILY = 302] = "Moved Temporarily";
statusCodes[exports.MULTI_STATUS = 207] = "Multi-Status";
statusCodes[exports.MULTIPLE_CHOICES = 300] = "Multiple Choices";
statusCodes[exports.NETWORK_AUTHENTICATION_REQUIRED = 511] = "Network\
 Authentication Required";
statusCodes[exports.NO_CONTENT = 204] = "No Content";
statusCodes[exports.NON_AUTHORITATIVE_INFORMATION = 203] = "Non Authoritative\
 Information";
statusCodes[exports.NOT_ACCEPTABLE = 406] = "Not Acceptable";
statusCodes[exports.NOT_FOUND = 404] = "Not Found";
statusCodes[exports.NOT_IMPLEMENTED = 501] = "Not Implemented";
statusCodes[exports.NOT_MODIFIED = 304] = "Not Modified";
statusCodes[exports.OK = 200] = "OK";
statusCodes[exports.PARTIAL_CONTENT = 206] = "Partial Content";
statusCodes[exports.PAYMENT_REQUIRED = 402] = "Payment Required";
statusCodes[exports.PERMANENT_REDIRECT = 308] = "Permanent Redirect";
statusCodes[exports.PRECONDITION_FAILED = 412] = "Precondition Failed";
statusCodes[exports.PRECONDITION_REQUIRED = 428] = "Precondition Required";
statusCodes[exports.PROCESSING = 102] = "Processing";
statusCodes[exports.PROXY_AUTHENTICATION_REQUIRED = 407] = "Proxy\
 Authentication Required";
statusCodes[exports.REQUEST_HEADER_FIELDS_TOO_LARGE = 431] = "Request\
 Header Fields Too Large";
statusCodes[exports.REQUEST_TIMEOUT = 408] = "Request Timeout";
statusCodes[exports.REQUEST_TOO_LONG = 413] = "Request Entity Too Large";
statusCodes[exports.REQUEST_URI_TOO_LONG = 414] = "Request-URI Too Long";
statusCodes[exports.REQUESTED_RANGE_NOT_SATISFIABLE = 416] = "Requested\
 Range Not Satisfiable";
statusCodes[exports.RESET_CONTENT = 205] = "Reset Content";
statusCodes[exports.SEE_OTHER = 303] = "See Other";
statusCodes[exports.SERVICE_UNAVAILABLE = 503] = "Service Unavailable";
statusCodes[exports.SWITCHING_PROTOCOLS = 101] = "Switching Protocols";
statusCodes[exports.TEMPORARY_REDIRECT = 307] = "Temporary Redirect";
statusCodes[exports.TOO_MANY_REQUESTS = 429] = "Too Many Requests";
statusCodes[exports.UNAUTHORIZED = 401] = "Unauthorized";
statusCodes[exports.UNPROCESSABLE_ENTITY = 422] = "Unprocessable Entity";
statusCodes[exports.UNSUPPORTED_MEDIA_TYPE = 415] = "Unsupported Media Type";
statusCodes[exports.USE_PROXY = 305] = "Use Proxy";

messageCodes[exports.RECORD_CREATION_SUCCESS = 601] = "%s has been created";
messageCodes[exports.RECORD_CREATION_FAILURE = 602] = "%s creation failed";
messageCodes[exports.REQUEST_BODY_NOT_ACCEPTABLE = 603] = "Request body not \
in proper format";
messageCodes[exports.RECORD_UPDATE_SUCCESS = 604] = "%s updated";
messageCodes[exports.RECORD_UPDATE_FAILURE = 605] = "%s updation failure";
messageCodes[exports.ROUTE_NOT_AVAILABLE = 606] = "Route not available";
messageCodes[exports.ACCESS_TOKEN_EXPIRED = 650] = "The access token\
 provided has expired/not-valid.";
messageCodes[exports.DB_TABLE_DUMPED_SUCCESS = 607] = "Database tables dump\
 taken sucessfully";
messageCodes[exports.DB_TABLE_DUMPED_FAILURE = 608] = "Database tables dump\
 failed";
messageCodes[exports.INTERNAL_SERVER_ERROR = 609] = "There is a Internal\
server error";
messageCodes[exports.RECORDS_NOT_AVAIALBE = 610] = "No %s records available.";
messageCodes[exports.RECORDS_AVAILABLE = 611] = "%s data available";
messageCodes[exports.ALERT_CREATED = 612] = "Alert created successfully";

messageCodes[exports.BAD_REQUEST = 613] = "An error occurred while processing your request.";
messageCodes[exports.ALREADY_REQUESTED = 614] = "Alredy send request .";
messageCodes[exports.NOT_AVAILABLE_EVENT = 615] = "Sorry,Event Not Available.";
exports.getStatusText = function(statusCode) {
  if (statusCodes.hasOwnProperty(statusCode)) {
    return statusCodes[statusCode];
  } else {
    throw new Error("Status code does not exist: " + statusCode);
  }
};

exports.getMessage = function(messageCode, entity='') {
  if (messageCodes.hasOwnProperty(messageCode)) {

    if(entity) {
      return messageCodes[messageCode].replace(/%s/g, entity);
    }

    return messageCodes[messageCode];
  } else {
    throw new Error("Message code does not exist: " + messageCode);
  }
};
