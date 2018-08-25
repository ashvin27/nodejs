let config    = require(__base + '/config');

module.exports = (params) => {
  return {
    format: (dataPacket, callback) => {
      let struct = {};
      let moduleName = dataPacket.moduleName;

      struct.status       = dataPacket.status;
      struct.data         = dataPacket.data;

      switch (dataPacket.action) {
        case 'create':
            struct.message      = moduleName + ' created';
            struct.response_tag = 600;
          break;
        case 'read':
            struct.message      = moduleName + ' records';
            struct.response_tag = 601;
          break;
        case 'update':
            struct.message      = moduleName + ' updated';
            struct.response_tag = 602;
          break;
        case 'delete':
            struct.message      = moduleName + ' deleted';
            struct.response_tag = 603;
          break;
        case 'custom':
            struct.message      = moduleName;
            struct.response_tag = 605;
          break;
        default:
        struct.message      = 'No action supplied';
        struct.response_tag = 604;
      }

      callback(JSON.stringify(struct));
    },
  }
};
