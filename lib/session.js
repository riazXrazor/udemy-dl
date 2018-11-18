  
var request = require('request');

    module.exports = {
      headers : { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/66.0.3359.181 Safari/537.3',
                   'X-Requested-With':'XMLHttpRequest',
                   'Host':  'www.udemy.com',
                   'Authorization' : "Basic YWQxMmVjYTljYmUxN2FmYWM2MjU5ZmU1ZDk4NDcxYTY6YTdjNjMwNjQ2MzA4ODI0YjIzMDFmZGI2MGVjZmQ4YTA5NDdlODJkNQ==",
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
