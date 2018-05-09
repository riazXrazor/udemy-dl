var chalk       = require('chalk');
var fs = require('fs');
var moment = require('moment');
var async = require('async');
var slugify = require('slugify');
var cookieParser = require('cookie');
var request = require('request');
var _           = require('lodash');
var CLI         = require('clui');
var Spinner     = CLI.Spinner;
var cheerio = require('cheerio');
var inquirer    = require('inquirer');
var yargs = require('yargs');
var queryString = require('query-string');
var jsonfile = require('jsonfile')
var mkdirp = require('mkdirp');
var argv = yargs
    .usage( "Usage: udl <course_url> [-u \"username\"] [-p \"password\"]" )
    .command( "course_url", "URL of the udemy coures to download", { alias: "url" } )
    .option( "u", { alias: "username", demand: false, describe: "Username in udemy", type: "string" } )
    .option( "p", { alias: "password", demand: false, describe: "Password of yor account", type: "string" } )
    .option( "r", { alias: "resolution", demand: false, describe: "Maximum download video resolution, default resolution is 360, for other video resolutions please refer to the website.", type: "string" } )
    .option( "o", { alias: "output", demand: false, describe: "Output directory where the videos will be saved, default is current directory", type: "string" } )
    .help( "?" )
    .alias( "?", "help" )
    .epilog( "By Riaz Ali Laskar" )
    .argv;

var session = require('./session');
var download = require('./download');
var core_functions = require('./functions');


 let debug = function(data){
    return JSON.stringify(data,null,2);
 }

 let safeencode = function(unsafetext){
  //  safe encode filenames.
   return slugify(unsafetext);
 }

 let save_debug_data = function(debug_data, debug_name, ext){
    // Save debug data to find bugs.
    debug_str = debug_data.toString();
    debug_time = moment().format('YYYY-MM-DD-HH-II-SS');
    fs.writeFileSync("DEBUG-"+debug_name+"-"+debug_time+"."+ext,debug_str);
 }

 let get_csrf_token = function(cb){
    // Extractig CSRF Token from login page.
    request({url:'https://www.udemy.com/join/login-popup', headers: session.headers}, function(e,r,b){
      cb(r,b.match(/name='csrfmiddlewaretoken'\s+value='(.*)'/)[1]);
    });

 }


 let login = function(username, password,callback){
    //  """Login with popup-page."""

       get_csrf_token(function(r,csrf_token){
         var cookie = r.headers['set-cookie'].join(';');
         //console.log(r.headers);
         let login_url = 'https://www.udemy.com/join/login-popup/?displayType=ajax&display_type=popup&showSkipButton=1&returnUrlAfterLogin=https%3A%2F%2Fwww.udemy.com%2F&next=https%3A%2F%2Fwww.udemy.com%2F&locale=en_US'

         let payload = {'isSubmitted': 1, 'email' : username, 'password': password,
                    'displayType': 'ajax', 'csrfmiddlewaretoken': csrf_token}

         let headers = session.headers
                      headers['Cookie'] = cookie;
                try{
                     request.post({url:login_url,headers:headers, form: payload},function(err,httpResponse,body){
                       if(err){ console.log('error',err); }

                        let cookies = httpResponse.headers['set-cookie'].join(';');
                        cookies = cookieParser.parse(cookies);

                       if(cookies.access_token && cookies.client_id)
                       {
                          session.set_auth_headers(cookies.access_token,cookies.client_id)
                          callback(cookies.access_token,cookies.client_id);
                       }
                       else {

                         console.log(chalk.red("Cannot logging in"));
                         process.exit(0);
                       }

                     });
                   }
                   catch(e)
                   {
                     console.log(chalk.red("Error occured in login"));
                     process.exit(0);
                   }

       });

 }


 let get_course_id = function(course_link,callback){
  //  """Retrieving course ID."""
      var options = {
        url: course_link,
        headers : session.headers
    };
  try{
      request.get(options,function(e,r,b){
        callback(b.match(/data-course-id="(\d+)"/)[1]);
      });
    }
    catch(e)
    {
      console.log(chalk.red("Unable to get course data"));
      process.exit(0);
    }
 }

let check_course_status = function(course_id,cb){
    // """Check the status of the course."""
        let check_course_status_url = 'https://www.udemy.com/api-2.0/users/me/course-previews/?course='+course_id
        var options = {
          url: check_course_status_url,
          headers : session.headers
        };
    try{
      request.get(options,function(e,r,b){
        if (b.includes('user_previewed_course') && b.includes('remaining_seconds')){
            console.log(chalk.red('Not a downloadable course.'));
            process.exit(0)
        } else {
          cb();
        }
      });
    }
    catch(e)
    {
      console.log(chalk.red("Error occured during course check"));
    }

  }

  let valid_lecture = function(lecture_number, lecture_start, lecture_end){
      // """Testing if the given lecture number is valid and exist."""
      if (lecture_start && lecture_end){
          return lecture_start <= lecture_number <= lecture_end
      } else if (lecture_start){
          return lecture_start <= lecture_number
      } else {
          return lecture_number <= lecture_end
        }
  }

  function unescape(strs){
      // """Replace HTML-safe sequences "&amp;", "&lt;"" and "&gt;" to special characters."""
      strs = strs.replace("&amp;", "&")
      strs = strs.replace("&lt;", "<")
      strs = strs.replace("&gt;", ">")
      return strs
  }



  let set_video_resolution = function (element,callback) {

      if(argv.resolution) 
	{
	callback(null);
	return;
	}

      var resolution_choices = [];
      let course_id = element.course_id;
      let lecture_id = element.lecture_id;

      // """Extracting Lecture URLS."""
      var get_url = 'https://www.udemy.com/api-2.0/users/me/subscribed-courses/'+course_id+'/lectures/'+lecture_id+'?fields[asset]=@min,download_urls,external_url,stream_urls,slide_urls&fields[course]=id,is_paid,url&fields[lecture]=@default,view_html,course&page_config=ct_v4';
      //var get_url = "https://www.udemy.com/api-2.0/assets/"+course_id+"?fields[asset]=@min,status,delayed_asset_message,processing_errors,time_estimation,stream_urls,thumbnail_url,download_urls,external_url,captions,tracks"
      var options = {
          url: get_url,
          headers : session.headers
      };


      try{
          request.get(options,function(e,r,b){

              try {
                  var json_source = JSON.parse(b);
              } catch(je) {
                  try {
                      b = JSON.stringify(b);
                       json_source = JSON.parse(b);
                  } catch(je) {
                      console.log(chalk.red("Error parsing data."));
                      console.log(je);
                      process.exit(0);
                  }

              }

              //console.log(json_source);
              var list_videos = {};
              if(json_source.is_downloadable)
              {
                 var videos = json_source.asset.download_urls.Video;
              }
              else
              {
                var videos = json_source.asset.stream_urls.Video;
              }
            
        

              for(var i=0;i<videos.length;i++)
              {
                  list_videos[videos[i].label] = videos[i];
                  resolution_choices.push(videos[i].label);
              }

              var questions = [
                  {
                      type: 'list',
                      name: 'resolution',
                      message: 'Select the maximum video resolution to download:',
                      choices:resolution_choices,
                      default: 0
                  }
              ];

              inquirer.prompt(questions).then(function(reso) {

                  argv.resolution = reso.resolution;

                  callback(null);
              });
          });
      }
      catch(e)
      {
          console.log(chalk.red("Error occured during getting lecture"));
          process.exit(0);
      }

  }

  let extract_lecture_url = function(acc,element,index,callback){
      let course_id = element.course_id;
      let lecture_id = element.lecture_id;
      // """Extracting Lecture URLS."""

      //https://www.udemy.com/api-2.0/users/me/subscribed-courses/903744/lectures/5440674/supplementary-assets/6916774?fields[asset]=download_urls

      var get_url = 'https://www.udemy.com/api-2.0/users/me/subscribed-courses/'+course_id+'/lectures/'+lecture_id+'?fields[asset]=@min,download_urls,external_url,slide_urls&fields[course]=id,is_paid,url&fields[lecture]=@default,view_html,course&page_config=ct_v4';
      var options = {
        url: get_url,
        headers : session.headers
      };

    try{
       request.get(options,function(e,r,b){


           if(e)
           {
               console.log(chalk.red("Error occured during getting lecture"));
               console.log(e);
               process.exit(0);
           }



           try {
               var json_source = JSON.parse(b);
           } catch(je) {
               try {
                   b = JSON.stringify(b);
                    json_source = JSON.parse(b);
               } catch(je) {
                   console.log(chalk.red("Error parsing data."));
                   console.log(je);
                   process.exit(0);
               }

           }


        var list_videos = {};
        var videos = json_source.asset.download_urls.Video;

        for(var i=0;i<videos.length;i++)
        {
            list_videos[videos[i].label] = videos[i].file;
        }

        var url = argv.resolution ? list_videos[argv.resolution] : list_videos[360];
        if(!url)
        {
            console.log("Unknown video resolution");
            process.exit(0);
        }


        element.data_url  = unescape(url);
        element.title  = json_source['title'];
        element.resolution = argv.resolution;
        element.type = 'video'
        //download(unescape(list_videos[1]),'video.mp4',function(file){
        //console.log(element);
        acc[index] = element;
        callback(null);


        });
      }
      catch(e)
      {
        console.log(chalk.red("Error occured during getting lecture"));
        console.log(e);
        process.exit(0);
      }

 }
  var all_videos_list = [];
  var download_queue = [];
  var video_number = 1;

  let get_data_links = function(course_id, lecture_start, lecture_end){
    // """Getting video links from api 2.0."""
    course_url = 'https://www.udemy.com/api-2.0/courses/'+course_id+'/cached-subscriber-curriculum-items?fields[asset]=@min,title,filename,asset_type,external_url,length&fields[chapter]=@min,description,object_index,title,sort_order&fields[lecture]=@min,object_index,asset,supplementary_assets,sort_order,is_published,is_free&fields[quiz]=@min,object_index,title,sort_order,is_published&page_size=550';
    var options = {
      url: course_url,
      headers : session.headers
    };
    var chapter = '';
    try{
      request.get(options,function(e,r,b){
      var course_data = JSON.parse(b);
      //save_debug_data(b, 'get_course_data', 'txt');
      var course_data_len = course_data['results'].length;
      var setvidres;
      for (var i = 0; i < course_data_len; i++) {
        var item = course_data['results'][i];
          if(item['_class'] == 'chapter')
          {
            //edited to get current chapter number
            chapter = item['object_index'] + " - " + item['title'];
            continue;
          }
         
          if(item['_class'] == 'lecture'){
            var asset = item['asset'];
            if(asset['asset_type'] === "Video")
            {
                var object = {
                    chapter : chapter,
                    course_id : course_id,
                    lecture_id : item['id'],
                    //added to get current video number
                    video_number : item['object_index'],
                    attachments : [],
                    type : 'v'
                  };
              //extract_lecture_url(course_id,item['id']);
              

              if(item['supplementary_assets'] && item['supplementary_assets'].length)
              {
                object['attachments'] = _.filter(item['supplementary_assets'],(o)=>o.asset_type == 'File');
              }
              if(!setvidres)
                    setvidres = object;
              all_videos_list.push(object);
            }
            else if(asset['asset_type'] === "Article")
            {
                var object = {
                    chapter : chapter,
                    course_id : course_id,
                    lecture_id : item['id'],
                    attachments : [],
                    type: 'a'
                  };
              //extract_lecture_url(course_id,item['id']);
              

              if(item['supplementary_assets'] && item['supplementary_assets'].length)
              {
                object['attachments'] = _.filter(item['supplementary_assets'],(o)=>o.asset_type == 'File');
              }

              all_videos_list.push(object);
            }
          }

      }

      /*set_video_resolution(setvidres,function () {

          async.transform(all_videos_list, function(acc, item, index, callback) {
    
              extract_lecture_url(acc,item, index,callback);

          }, function(err, result) {
              if(err)
              {
                  console.error("Internal Error !!");
              }
              async.eachSeries(result,download,function(err){
                  if(err) { console.log(chalk.red("Error downloading, Try again !!")); }

              });
          });

      })*/

        set_video_resolution(setvidres,function () {
            var initilizing = new Spinner('Initilizing, please wait...          ');
                initilizing.start();
                var tmp = 'udl-tmp/';
                var file = tmp+course_id+'.json';
                try{
                    download_queue = jsonfile.readFileSync(file);
                    initilizing.stop();
                    async.eachSeries(download_queue,download,function(err){
                        if(err) { console.log(chalk.red("Error downloading, Try again !!")); }
      
                    });
                }
                catch(e)
                {

                    async.eachSeries(all_videos_list,ready_for_download,function(err,result){
                        mkdirp(tmp,function(err){
                            if(err) 
                            {
                                console.log(err)
                            }

                            jsonfile.writeFile(file, download_queue, function (err) {
                                if(err)
                                {
                                    console.log(err);
                                }
    
                                initilizing.stop();
                                async.eachSeries(download_queue,download,function(err){
                                    if(err) { console.log(chalk.red("Error downloading, Try again !!")); }
                                    fs.unlinkSync(file);
                                });
                            })
                            
                        });
                    });
                }
        })


    });
    }
    catch(e)
    {
      console.log(chalk.red("Error occured during getting course data"));
      process.exit(0);
    }

 }

 function ready_for_download(item,callback)
 {



    if(item.type=='v')
    {
        /** */

        let course_id = item.course_id;
        let lecture_id = item.lecture_id;
        // """Extracting Lecture URLS."""

        //https://www.udemy.com/api-2.0/users/me/subscribed-courses/903744/lectures/5440674/supplementary-assets/6916774?fields[asset]=download_urls


        if(item.attachments && item.attachments.length)
        {
            async.eachSeries(item.attachments,function(attachment,cb){

                var get_url = 'https://www.udemy.com/api-2.0/users/me/subscribed-courses/'+course_id+'/lectures/'+lecture_id+'/supplementary-assets/'+attachment.id+'?fields[asset]=@min,download_urls,stream_urls,external_url,slide_urls&fields[course]=id,is_paid,url&fields[lecture]=@default,view_html,course&page_config=ct_v4';
       
                var options = {
                    url: get_url,
                    headers : session.headers
                };
    
                request.get(options,function(e,r,b){
    
                        if(e)
                        {
                            console.log(chalk.red("Error occured during getting lecture"));
                            console.log(e);
                            process.exit(0);
                        }
    
    
    
                    try {
                        var json_source = JSON.parse(b);
                    } catch(je) {
                        try {
                            b = JSON.stringify(b);
                            json_source = JSON.parse(b);
                        } catch(je) {
                            console.log(chalk.red("Error parsing data."));
                            console.log(je);
                            process.exit(0);
                        }
    
                    }
                    // console.log(json_source);
                    var url_link = json_source.download_urls.File[0]
                    var query_obj = queryString.parse(url_link.file);
                    var element = {
                        state : 'P'
                    };
    
                    var file = query_obj.filename.split('.');
                    var ext = file.pop();
                    element.course_id  = course_id;
                    element.lecture_id  = lecture_id;
                    element.id  = course_id+'-'+lecture_id+'-'+attachment.id;
                    element.data_url  = unescape(url_link.file);
                    element.extension = ext;
                    element.title  = file.join(" ");
                    element.chapter  = item.chapter;
                    download_queue.push(element);
                    //console.log(element);
                    cb();
                
                });
    
            },function(err){
                
            });
        }



        var get_url = 'https://www.udemy.com/api-2.0/users/me/subscribed-courses/'+course_id+'/lectures/'+lecture_id+'?fields[asset]=@min,download_urls,stream_urls,external_url,slide_urls&fields[course]=id,is_paid,url&fields[lecture]=@default,view_html,course&page_config=ct_v4';
        var options = {
        url: get_url,
        headers : session.headers
        };

    try{

        

        request.get(options,function(e,r,b){


            if(e)
            {
                console.log(chalk.red("Error occured during getting lecture"));
                console.log(e);
                process.exit(0);
            }



            try {
                var json_source = JSON.parse(b);
            } catch(je) {
                try {
                    b = JSON.stringify(b);
                    json_source = JSON.parse(b);
                } catch(je) {
                    console.log(chalk.red("Error parsing data."));
                    console.log(je);
                    process.exit(0);
                }

            }

        
        var list_videos = {};
        if(json_source.asset.is_downloadable)
        {
            var videos = json_source.asset.download_urls.Video;
        }
        else
        {
            var videos = json_source.asset.stream_urls.Video;
        }

        for(var i=0;i<videos.length;i++)
        {
            list_videos[videos[i].label] = videos[i];
        }

        var url = argv.resolution ? list_videos[argv.resolution] : list_videos[360];
        if(!url)
        {
            console.log("Unknown video resolution");
            process.exit(0);
        }

                var url_link = url
                var query_obj = url_link.type.split('/').pop();
                var element = {
                    state : 'P'
                };
                element.course_id  = course_id;
                element.lecture_id  = lecture_id;
                element.id  = course_id+'-'+lecture_id;
                element.data_url  = unescape(url_link.file);
                element.extension = url_link.type.split('/').pop();
                element.title  = json_source.title;
                element.chapter  = item.chapter;
                element.resolution = argv.resolution;
                element.number = video_number++;
                download_queue.push(element);
                //console.log(element);
                callback();


        });
        }
        catch(e)
        {
        console.log(chalk.red("Error occured during getting lecture"));
        console.log(e);
        process.exit(0);
        }

        /** */
    }
    else if(item.type == 'a')
    {
        
        let course_id = item.course_id;
        let lecture_id = item.lecture_id;
        // """Extracting Lecture URLS."""
        //console.log(item);
        async.eachSeries(item.attachments,function(attachment,cb){

            var get_url = 'https://www.udemy.com/api-2.0/users/me/subscribed-courses/'+course_id+'/lectures/'+lecture_id+'/supplementary-assets/'+attachment.id+'?fields[asset]=@min,download_urls,stream_urls,external_url,slide_urls&fields[course]=id,is_paid,url&fields[lecture]=@default,view_html,course&page_config=ct_v4';
   
            var options = {
                url: get_url,
                headers : session.headers
            };

            request.get(options,function(e,r,b){

                    if(e)
                    {
                        console.log(chalk.red("Error occured during getting lecture"));
                        console.log(e);
                        process.exit(0);
                    }



                try {
                    var json_source = JSON.parse(b);
                } catch(je) {
                    try {
                        b = JSON.stringify(b);
                        json_source = JSON.parse(b);
                    } catch(je) {
                        console.log(chalk.red("Error parsing data."));
                        console.log(je);
                        process.exit(0);
                    }

                }
                // console.log(json_source);
                var url_link = json_source.download_urls.File[0]
                var query_obj = queryString.parse(url_link.file);
                var element = {
                    state : 'P'
                };

                var file = query_obj.filename.split('.');
                var ext = file.pop();
                element.course_id  = course_id;
                element.lecture_id  = lecture_id; 
                element.id  = course_id+'-'+lecture_id+'-'+attachment.id;
                element.data_url  = unescape(url_link.file);
                element.extension = ext;
                element.title  = file.join(" ");
                element.chapter  = item.chapter;
                download_queue.push(element);
                //console.log(element);
                cb();
            
            });

        },function(err){
            
        });

        callback();
     

    }

    
 }

 // get_course_id(course_url,function(id){
 //   let course_id = id;
 //   check_course_status(id,function(){
 //     get_data_links(course_id,1,-1);
 //   });
 // });

 //login('amitabh@codelogicx.com','zionxt1981')

//login('riazcool77@gmail.com','<?razor?>')

 module.exports = {
   login : login,
   get_course_id : get_course_id,
   check_course_status : check_course_status,
   get_data_links : get_data_links
 };
