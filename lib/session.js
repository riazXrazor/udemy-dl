
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
    this.headers['X-Udemy-Cache-User'] = client_id
    this.headers['Authorization'] = "Bearer " + access_token
    this.headers['X-Udemy-Authorization'] = "Bearer " + access_token
    this.headers['Host'] = host.replace('https://','')
    this.headers['Referer'] = `${host}/join/login-popup`
    this.headers['Origin'] = `${host}/`
    // x-requested-with: XMLHttpRequest
    // x-udemy-authorization: Bearer oHf11n6uWAD3QXOS1jb2g1ZfkHCfpmEXQFfT0xW1
    // x-udemy-cache-brand: 825218b142cadf22
    // x-udemy-cache-campaign-code: 7815696ecbf1c96e
    // x-udemy-cache-price-country: c86ee0d9d7ed3e7b
    // x-udemy-cache-release: 3a6f78df5069f22f
    // x-udemy-cache-user: 121cc81d44bfee23
    // x-udemy-cache-version: c4ca4238a0b92382
  }

};
