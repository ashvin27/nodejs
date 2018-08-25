let externalCredentials = require('/var/lib/digivalet/digivalet-config/app-config');
let databaseCredentials = require('/var/lib/digivalet/digivalet-config/database-config');

module.exports = {
  sql:{
    host: databaseCredentials.dv_services_inpremise.host,
    user: databaseCredentials.dv_services_inpremise.user,
    password: databaseCredentials.dv_services_inpremise.password,
    database: databaseCredentials.dv_services_inpremise.database,
    pool: {
      min: databaseCredentials.dv_services_inpremise.pool.min,
      max: databaseCredentials.dv_services_inpremise.pool.max
    },
    debugmode: false,
    port: 3306,
    multipleStatements: true,
    backup: {
      path: 'sql-backup/'
    },
    dump: {
      path: externalCredentials.server_root_path+externalCredentials.digivalet_api.app_dir+'/assets/uploads/'
    },
    truncate: {
      path: 'sql-truncate/'
    },
    mysqlBinary: externalCredentials.mysql_binary
  },
  projects: {
    name: {
      apiRootPath: externalCredentials.server_root_path,
      dashboard: externalCredentials.dashboard.app_dir,
      cloudApi: externalCredentials.digivalet_cloud_api.app_dir,
      inpremiseApi: externalCredentials.digivalet_api.app_dir,
      cloudDVService: externalCredentials.dv_services_cloud.app_dir,
      inpremiseDVService: externalCredentials.dv_services_inpremise.app_dir,
    }
  },
  url: {
    authenticate: {
      verifyTokenURL: externalCredentials.oneauth.request_scheme + '://' + externalCredentials.oneauth.fqdn_or_ip + '/' + externalCredentials.oneauth.app_dir + '/api/client/verifyToken',
      getTokenURL: externalCredentials.oneauth.request_scheme + '://' + externalCredentials.oneauth.fqdn_or_ip + '/' + externalCredentials.oneauth.app_dir + '/api/client/getToken'
    },
    butlerInterface: {
      closeRequest: externalCredentials.butler_call.close_call_url
    },
    dashboard: {
      operateAc: externalCredentials.dv_service_gateway.request_scheme + '://' + externalCredentials.dv_service_gateway.fqdn_or_ip + '/' + externalCredentials.dv_service_gateway.app_dir + '/operateAc'
    }
  },
  pn: {
    fcm: {
      url: 'https://fcm.googleapis.com/fcm/send',
      apiKey: 'AAAAIHOYtdE:APA91bGPdwzU7xOxWf_se9Xmxro5wGNIE-uwRp2z39PXZkI17TLzvjHtZ4HzI9D4UVHy20DebG53Knjs3bsNXd9-okbZasPiQM7eOda_Y211SixpPXiKY6ePGiQURw_vWv6lLS8HZ6Sk',
      guestAppApiKey: 'AAAAXVhEjmo:APA91bHxoHjO9jP5tQNNBe0Y6WxamRF_nzXFiqaR7NKAXVP1XJHWPye9at6rq0p8gL0VOwY7Dn5-SVQJ-f62t-v8mAAdmVPgYBxNWYRGYgQBOnPsPLgcROCICjNVyaSfu2Iux8miTsGf'
    }
  },
  keys: {
    aes: {
      algorithm: 'aes128',
      key: [ 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16 ]
    }
  },
  server: {
    rejectUnauthorized: externalCredentials.dv_services_inpremise.rejectUnauthorized,
    environment: externalCredentials.environment,
    fqdn: externalCredentials.dv_services_inpremise.fqdn_or_ip
  },
  cloud: {
    server: {
      port: externalCredentials.dv_services_cloud.core,
      protocol: externalCredentials.dv_services_inpremise.request_scheme
    },
    headers: {
        'contentType': 'application/vnd.digivalet.v1+json'
    },
    syncManager: {
      monitoringTime: 5000,
      url: {
        getModuleTablesData: '/sync-manager/table-dump'
      }
    },
    notificationManager: {
      monitoringTime: 6000,
      url: {
        callToCloud: '/notifications/'
      }
    }
  },
  inpremise: {
    server: {
      port: externalCredentials.dv_services_inpremise.core,
      logs: {
        path: {
          accesslog: './logs/access_log.log',
          debuglog: './logs/team_debug.log'
        }
      },
      ssl: {
        certificate: {
          key: externalCredentials.certificates.key,
          pem: externalCredentials.certificates.cert,
          ca: externalCredentials.certificates.ca,
          requestCert: externalCredentials.dv_services_inpremise.requestCert,
          rejectUnauthorized: externalCredentials.dv_services_inpremise.rejectUnauthorized
        }
      },
      protocol: externalCredentials.dv_services_inpremise.request_scheme
    },
    accessToken: '70cee6f97ba95c9c051a550f5e3ae1644d221cf44acee7acb698cf9de4ebfd80',
    headers: {
        'contentType': 'application/vnd.digivalet.v1+json'
    },
    syncManager: {
      monitoringTime: 5000,
      url: {
        generateSqlite: externalCredentials.digivalet_api.request_scheme + '://' + externalCredentials.digivalet_api.fqdn_or_ip + '/' + externalCredentials.digivalet_api.app_dir + '/api/core/sqlite/generateSqlite'
      }
    },
    irdOrderSetComplete: {
      monitoringTime: 10000,
      moveOrderAfter: '1 HOUR'
    },
    eventLog: {
      monitoringTime: 4000
    },
    roomProfile: {
      monitoringTime: 120000
    },
    serviceAssistenceSetComplete: {
      monitoringTime: 10000,
      moveOrderAfter: '1 HOUR'
    },

    notificationManager: {
      monitoringTime2: 6000,
      monitoringTime6: 7000,
      monitoringTime8: 8000,
      monitoringTime10: 9000,
      monitoringTime12: 10000,
      monitoringTime14: 11000
    },
    pushupdate: {
      monitoringTime: 10000
    },
     promotions: {
      monitoringTime: 5000
    },
    syncMessage: {
      monitoringTime: 15000
    },
    dashboard: {
      port: externalCredentials.dv_services_inpremise.dashboard,
      polling_interval: 3000
    }
  },
  hotelProperties: {
    hotelid: externalCredentials.dv_services_inpremise.hotelProperties.hotelId,
    hotelCode: externalCredentials.dv_services_inpremise.hotelProperties.hotelCode,
    defaultLangCode: externalCredentials.dv_services_inpremise.hotelProperties.defaultLangCode,
    currency: externalCredentials.dv_services_inpremise.hotelProperties.currency,
  },
   webRadio:{
    url:"http://casadigi.vtuner.com:8088/",
    macId:"b39c966dfbb51b0289ad56e917893bfc",
    offset:0,
    limit:100,
    order:"pop",
  }
}
