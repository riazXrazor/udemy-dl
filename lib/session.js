  
var request = require('request');

    module.exports = {
      headers : { 
                   'User-Agent': 'StackOverflow',
                   'X-Requested-With':'XMLHttpRequest',
                   'Host':  'www.udemy.com',
                   'Referer': 'https://www.udemy.com/join/login-popup',
                   'Origin': 'https://www.udemy.com',
                   'Accept': 'application/json'
                  }
        ,
      set_auth_headers : function(access_token, client_id){
        /*Setting up authentication headers.*/
        this.headers['X-Udemy-Bearer-Token'] = access_token
        this.headers['X-Udemy-Client-Id'] = client_id
        this.headers['Authorization'] = "Bearer " + access_token
        this.headers['X-Udemy-Authorization'] = "Bearer " + access_token
      }

    };
