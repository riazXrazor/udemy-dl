const cli = require('cli-ux').default
const Preferences = require("preferences");

var core = require('./core');
var prefs = new Preferences('udl');


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



  inquirer.prompt(questions).then(callback).catch(e=>console.log(e));
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

function getCourseList(callback)
{
    var status = new Spinner("Getting your courses...                   ");
    status.start();
    core.get_course_list(function(list){


      let courses = [];
      _.map(list,function(course,index){
        let no = (index+1);
        courses.push(no +' ) '+ course.title);
      })
      status.stop();
      var questions = [
        {
            type: 'list',
            name: 'course',
            message: 'Select a course to download:',
            choices:courses,
            default: 0
        }
    ];

    inquirer.prompt(questions).then(function(selected) {
        let course_to_download = _.find(list,function(o){
          return _.includes(selected.course,o.title);
        });
    });


    });
}


module.exports = {
  getUdemyCredentials : getUdemyCredentials,
  getAccessToken : getAccessToken,
  getCourse : getCourse,
  getCourseList : getCourseList
}
