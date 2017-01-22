var chalk       = require('chalk');
var clear       = require('clear');
var CLI         = require('clui');
var figlet      = require('figlet');
var inquirer    = require('inquirer');
var Preferences = require('preferences');
var Spinner     = CLI.Spinner;
var fs          = require('fs');
var yargs = require('yargs');
var argv = yargs
    .usage( "Usage: udl <course_url> [-u \"username\"] [-p \"password\"]" )
    .command( "course_url", "URL of the udemy coures to download", { alias: "url" } )
    .option( "u", { alias: "username", demand: false, describe: "Username in udemy", type: "string" } )
    .option( "p", { alias: "password", demand: false, describe: "Password of yor account", type: "string" } )
    .option( "r", { alias: "resolution", demand: false, describe: "Download video resolution, default resolution is 360, for other video resolutions please refer to the website.", type: "number" } )
    .option( "o", { alias: "output", demand: false, describe: "Output directory where the videos will be saved, default is current directory", type: "string" } )
    .help( "?" )
    .alias( "?", "help" )
    .epilog( "By Riaz Ali Laskar" )
    .argv;
var core = require('./core');

var prefs = new Preferences('udl');

function headingMsg(){
  clear();
  console.log(
    chalk.yellow(
      figlet.textSync('udemy-dl', { horizontalLayout: 'full' })
    )
  );
}

function getUdemyCredentials(callback) {

  var questions = [
    {
      name: 'username',
      type: 'input',
      message: 'Enter your Udemy username :',
      default: prefs.username,
      validate: function( value ) {
        if (value.length) {
          return true;
        } else {
          return 'Please enter your username';
        }
      }
    },
    {
      name: 'password',
      type: 'password',
      message: 'Enter your password:',
      validate: function(value) {
        if (value.length) {
          return true;
        } else {
          return 'Please enter your password';
        }
      }
    }
  ];

  inquirer.prompt(questions).then(callback);
}

function getAccessToken(callback) {

  if (prefs.access_token && prefs.client_id) {
    return callback({
       access_token : prefs.access_token,
       client_id : prefs.client_id
    });
  }

  callback(null);

}


function getCourse(url,callback) {
  var course_url = url;

   prefs.course_url = url;

   var questions = [
     {
       type: 'input',
       name: 'course_url',
       message: 'Enter the course url to download from udemy:',
       default: course_url || prefs.course_url ,
       validate: function( value ) {
         if (value.length) {
           return true;
         } else {
           return 'Please enter the course url from udemy';
         }
       }
     }
   ];

   inquirer.prompt(questions).then(function(answers) {
     var status = new Spinner("Checking course url...                   ");
     status.start();

     core.get_course_id(answers.course_url,function(id){
         let course_id = id;
         core.check_course_status(id,function(){
           status.stop();
           callback();
           core.get_data_links(course_id);
         });
     });

   });
}


module.exports = {
  getUdemyCredentials : getUdemyCredentials,
  getAccessToken : getAccessToken,
  getCourse : getCourse,
  headingMsg : headingMsg
}
