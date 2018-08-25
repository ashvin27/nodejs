let webRadio    = require(__base + 'components/db-master/webRadio/index.js'),
    config      = require(__base + '/config'),
    request = require("request");


module.exports = () => {

    return {

        countryList: (where,what,callback) => {
            webRadio.webRadioCountry(where,what,(wrcErr, wrcRes) => {
                if(wrcRes) {
                   for(var i=0;i<wrcRes.length;i++){
                        wrcRes[i].type ="country";
                        wrcRes[i].id =parseInt(wrcRes[i].id);
                       if(i ==(wrcRes.length)-1)
                       {
                        callback(null,wrcRes);
                       }
                    }
                }
              });
        },
        
        genreList: (where,what,callback) => {
            webRadio.webRadioGenre(where,what,(gErr, wrgRes) => {
                if(wrgRes) {
                    for(var i=0;i<wrgRes.length;i++){
                            wrgRes[i].type ="genre";
                            wrgRes[i].id =parseInt(wrgRes[i].id);
                           if(i ==(wrgRes.length)-1)
                           {
                            callback(null, wrgRes);
                           }
                        }
                   
                }
              });
          },


        getRedioStation: (id,offset,typeWith,callback) => {
            let url ="";
                url +=config.webRadio.url+typeWith+"/stations/"+id+"?";
                
            if(offset==undefined)
            {
                url +="offset="+config.webRadio.offset;
             }else{
                url +="offset="+offset;
            }
            url += "&limit="+config.webRadio.limit+"&mac="+config.webRadio.macId;
        
            request.get(url, (error, response, body) => {
                
                if(body){
                    let jsonData = JSON.parse(body);
                    callback(error,jsonData.data);
                }
                
            });
        },

        recommendedRedioStation: (offset,callback) => {
            let url ="";
                url +=config.webRadio.url+"station/recommendation?";
                
            if(offset==undefined)
                {
                    url +="offset="+config.webRadio.offset;
                 }else{
                    url +="offset="+offset;
                }
                    url += "&limit="+config.webRadio.limit+"&mac="+config.webRadio.macId;
            
                request.get(url, (error, response, body) => {
                   
                    if(body){
                        let jsonData = JSON.parse(body);
                        callback(error,jsonData.data);
                    }
                });
        },
        
        searchRedioStation: (query,order,offset,callback) => {
            let url ="";
                url +=config.webRadio.url+"station/search?";
                
            if(offset==undefined)
                {
                    url +="offset="+config.webRadio.offset;
                 }else{
                    url +="offset="+offset;
                }
                    url += "&limit="+config.webRadio.limit+"&mac="+config.webRadio.macId+"&query="+query;
            if(order==undefined)
                {
                    url +="&order="+config.webRadio.order;
                    }else{
                    url +="&order="+order;
                }           
                request.get(url, (error, response, body) => {
                   if(body){
                        let jsonData = JSON.parse(body);
                        callback(error,jsonData.data);
                    }
                });
        },

        redioStationWithStationId: (stationId,callback) => {
            let url ="";
                url +=config.webRadio.url+"station/url/"+stationId+"?mac="+config.webRadio.macId;
                request.get(url, (error, response, body) => {
                   if(body){
                        let jsonData = JSON.parse(body);
                        callback(error,jsonData);
                    }
                });
        },



    }


}
