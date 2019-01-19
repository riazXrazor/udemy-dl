
var request = require('request');

module.exports = {
  headers: {
    'User-Agent': 'StackOverflow',
    'X-Requested-With': 'XMLHttpRequest',
    'Host': 'www.udemy.com',
    'Authorization': "Basic YWQxMmVjYTljYmUxN2FmYWM2MjU5ZmU1ZDk4NDcxYTY6YTdjNjMwNjQ2MzA4ODI0YjIzMDFmZGI2MGVjZmQ4YTA5NDdlODJkNQ==",
    'Referer': 'https://www.udemy.com/join/login-popup',
    'Origin': 'https://www.udemy.com',
    'Accept': 'application/json'
  }
  ,
  set_auth_headers: function (host, access_token, client_id) {
    /*Setting up authentication headers.*/
    this.headers['X-Udemy-Bearer-Token'] = access_token
    this.headers['X-Udemy-Client-Id'] = client_id
    this.headers['Authorization'] = "Bearer " + access_token
    this.headers['X-Udemy-Authorization'] = "Bearer " + access_token
    this.headers['Host'] = host
    this.headers['Referer'] = `https://${host}/join/login-popup`
    this.headers['Origin'] = `https://${host}/`
  }

};
