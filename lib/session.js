  
var request = require('request');

    module.exports = {
      headers : { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.10; rv:39.0) Gecko/20100101 Firefox/39.0',
                   'X-Requested-With':'XMLHttpRequest',
                   'Host':  'www.udemy.com',
                   'Referer': 'https://www.udemy.com/join/login-popup',
                   'Origin': 'https://www.udemy.com'}
        ,
      set_auth_headers : function(access_token, client_id){
        /*Setting up authentication headers.*/
        this.headers['X-Udemy-Bearer-Token'] = access_token
        this.headers['X-Udemy-Client-Id'] = client_id
        this.headers['Authorization'] = "Bearer " + access_token
        this.headers['X-Udemy-Authorization'] = "Bearer " + access_token
      }

    };
