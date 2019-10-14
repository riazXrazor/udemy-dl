const path = require('path');
const logo = require('asciiart-logo');
const config = require(path.join(__dirname,'..','..','package.json'));
module.exports = async function (options) {
  config.font = '3D-ASCII';
  config.logoColor = 'bold-green';
  config.textColor = 'bold-blue';
  config.borderColor = 'bold-blue';
  config.horizontalLayout = 'fitted';

  console.log(logo(config).render());
}
