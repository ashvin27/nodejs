let express     = require('express'),
router          = express.Router(),
DVStatus = require(__base + 'components/core/helper/http-status-codes'),
webRadio        = require(__base +
                    'components/core/web-radio')({});


var genreList =(req, res, next) =>{
    let where = {is_active:1},
    what = [ "genre_id",
             "genre_name as name",
             "genre_code as id",
           ];
    webRadio.genreList(where,what,(err,wrRes) =>{
        if(wrRes) {
            res
            .status(DVStatus.OK)
            .send({
                status: true,
                message: DVStatus.getMessage(DVStatus.RECORDS_AVAILABLE,
                'Web Radio s'),
                description: '',
                data: wrRes,
                response_tag: DVStatus.RECORDS_AVAILABLE
            });
          } else {
            res
            .status(DVStatus.NO_CONTENT)
            .send({
                status: false,
                message: DVStatus.getMessage(DVStatus.RECORDS_NOT_AVAIALBE,
                'Web Radio '),
                description: '',
                data: {},
                response_tag: DVStatus.RECORDS_NOT_AVAIALBE
            });
          }
    })
}

var countryList =(req, res, next) =>{
  let where = {is_active:1},
       what = [ "country_id",
                "country_name as name",
                "country_code as id",
              ];
    webRadio. countryList (where,what,(err,wrRes) =>{
        if(wrRes) {
            res
            .status(DVStatus.OK)
            .send({
                status: true,
                message: DVStatus.getMessage(DVStatus.RECORDS_AVAILABLE,
                'Web Radio'),
                description: '',
                data: wrRes,
                response_tag: DVStatus.RECORDS_AVAILABLE
            });
          } else {
            res
            .status(DVStatus.NO_CONTENT)
            .send({
                status: false,
                message: DVStatus.getMessage(DVStatus.RECORDS_NOT_AVAIALBE,
                'Web Radio '),
                description: '',
                data: {},
                response_tag: DVStatus.RECORDS_NOT_AVAIALBE
            });
          }
    })
}



var radioStationWithGenreId =(req,res,next) =>{
    let genreId     = req.params.genreId,
        offset      = req.params.offset,
        typeWith    = "subgenre";
    if(genreId)
    {
        webRadio.getRedioStation(genreId,offset,typeWith,(err,wrRes)=>{
            if(wrRes) {
                res
                .status(DVStatus.OK)
                .send({
                    status: true,
                    message: DVStatus.getMessage(DVStatus.RECORDS_AVAILABLE,
                    'Web Radio'),
                    description: '',
                    data: wrRes,
                    response_tag: DVStatus.RECORDS_AVAILABLE
                });
              } else {
                res
                .status(DVStatus.NO_CONTENT)
                .send({
                    status: false,
                    message: DVStatus.getMessage(DVStatus.RECORDS_NOT_AVAIALBE,
                    'Web Radio'),
                    description: '',
                    data: {},
                    response_tag: DVStatus.RECORDS_NOT_AVAIALBE
                });
              }
        })
    } else{
        res
        .status(DVStatus.BAD_REQUEST)
        .send({
            status: false,
            message: DVStatus.getMessage(DVStatus.BAD_REQUEST,
            'Web Radio'),
            description: '',
            data: {},
            response_tag: DVStatus.BAD_REQUEST
        });
    }
}

var radioStationWithCountryId =(req,res,next) =>{
    let countryId     = req.params.countryId,
        offset      = req.params.offset,
        typeWith    = "country";
    if(countryId)
    {
        webRadio.getRedioStation(countryId,offset,typeWith,(err,wrRes)=>{
            if(wrRes) {
                res
                .status(DVStatus.OK)
                .send({
                    status: true,
                    message: DVStatus.getMessage(DVStatus.RECORDS_AVAILABLE,
                    'Web Radio'),
                    description: '',
                    data: wrRes,
                    response_tag: DVStatus.RECORDS_AVAILABLE
                });
              } else {
                res
                .status(DVStatus.NO_CONTENT)
                .send({
                    status: false,
                    message: DVStatus.getMessage(DVStatus.RECORDS_NOT_AVAIALBE,
                    'Web Radio'),
                    description: '',
                    data: {},
                    response_tag: DVStatus.RECORDS_NOT_AVAIALBE
                });
              }
        })
    } else{
        res
        .status(DVStatus.BAD_REQUEST)
        .send({
            status: false,
            message: DVStatus.getMessage(DVStatus.BAD_REQUEST,
            'Web Radio'),
            description: '',
            data: {},
            response_tag: DVStatus.BAD_REQUEST
        });
    }
}


var recommendedRadioStation =(req,res,next) =>{
    let offset     = req.params.offset;
 
        webRadio.recommendedRedioStation(offset,(err,wrRes)=>{
            if(wrRes) {
                res
                .status(DVStatus.OK)
                .send({
                    status: true,
                    message: DVStatus.getMessage(DVStatus.RECORDS_AVAILABLE,
                    'Web Radio'),
                    description: '',
                    data: wrRes,
                    response_tag: DVStatus.RECORDS_AVAILABLE
                });
              } else {
                res
                .status(DVStatus.NO_CONTENT)
                .send({
                    status: false,
                    message: DVStatus.getMessage(DVStatus.RECORDS_NOT_AVAIALBE,
                    'Web Radio'),
                    description: '',
                    data: {},
                    response_tag: DVStatus.RECORDS_NOT_AVAIALBE
                });
              }
        })
}


var searchRadioStation =(req,res,next) =>{
    let query     = req.params.query,
        order     = req.params.order,
        offset    = req.params.offset;  

        if(query)
        {
            webRadio.searchRedioStation(query,order,offset,(err,wrRes)=>{
                if(wrRes) {
                    res
                    .status(DVStatus.OK)
                    .send({
                        status: true,
                        message: DVStatus.getMessage(DVStatus.RECORDS_AVAILABLE,
                        'Web Radio'),
                        description: '',
                        data: wrRes,
                        response_tag: DVStatus.RECORDS_AVAILABLE
                    });
                  } else {
                    res
                    .status(DVStatus.NO_CONTENT)
                    .send({
                        status: false,
                        message: DVStatus.getMessage(DVStatus.RECORDS_NOT_AVAIALBE,
                        'Web Radio'),
                        description: '',
                        data: {},
                        response_tag: DVStatus.RECORDS_NOT_AVAIALBE
                    });
                  }
            })
        } else{
            res
            .status(DVStatus.BAD_REQUEST)
            .send({
                status: false,
                message: DVStatus.getMessage(DVStatus.BAD_REQUEST,
                'Web Radio'),
                description: '',
                data: {},
                response_tag: DVStatus.BAD_REQUEST
            });
        }
}

var radioStationWithStationId =(req,res,next) =>{
    let stationId     = req.params.stationId;
        if(stationId)
        {
            webRadio.redioStationWithStationId(stationId,(err,wrRes)=>{
                if(wrRes) {
                    res
                    .status(DVStatus.OK)
                    .send({
                        status: true,
                        message: DVStatus.getMessage(DVStatus.RECORDS_AVAILABLE,
                        'Web Radio'),
                        description: '',
                        data: wrRes,
                        response_tag: DVStatus.RECORDS_AVAILABLE
                    });
                  } else {
                    res
                    .status(DVStatus.NO_CONTENT)
                    .send({
                        status: false,
                        message: DVStatus.getMessage(DVStatus.RECORDS_NOT_AVAIALBE,
                        'Web Radio'),
                        description: '',
                        data: {},
                        response_tag: DVStatus.RECORDS_NOT_AVAIALBE
                    });
                  }
            })
        } else{
            res
            .status(DVStatus.BAD_REQUEST)
            .send({
                status: false,
                message: DVStatus.getMessage(DVStatus.BAD_REQUEST,
                'Web Radio'),
                description: '',
                data: {},
                response_tag: DVStatus.BAD_REQUEST
            });
        }
}




router.get("/genre-list",genreList);
router.get("/country-list",countryList);
router.get("/radio-station/genre-id/:genreId?/offset/:offset?",radioStationWithGenreId);
router.get("/radio-station/country-id/:countryId?/offset/:offset?",radioStationWithCountryId);
router.get("/radio-station/recommended/offset/:offset?",recommendedRadioStation);
router.get("/radio-station/search/query/:query?/order/:order?/offset/:offset?",searchRadioStation);
router.get("/radio-station/station-id/:stationId?",radioStationWithStationId);


module.exports =router
