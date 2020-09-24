var fs = require('fs');
var path = require('path');

module.exports = {
  getCurrentDirectoryBase : function() {
    return process.cwd();
  },

  directoryExists : function(filePath) {
    try {
      return fs.statSync(filePath).isDirectory();
    } catch (err) {
      return false;
    }
  },

  fileExists : function(filePath) {
    try {
      return fs.statSync(filePath).isFile();
    } catch (err) {
      return false;
    }
  }
};
