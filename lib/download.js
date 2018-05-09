function download(dataObj,callback) {
  var chalk       = require('chalk');
  var request = require('request');
  var moment = require('moment');
  var progress = require('request-progress');
  var fs = require('fs');
  var path = require('path');
  var ProgressBar = require('progress');
  var mkdirp = require('mkdirp');
  var yargs = require('yargs');
  var _     = require('lodash');
  var jsonfile = require('jsonfile');
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
  var files = require('./files');
  var sanitize = require('sanitize-filename');

    function bytesToSize(bytes,decimals) {
        if(bytes == 0) return '0 Bytes';
        var k = 1000,
            dm = decimals || 2,
            sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'],
            i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }


    function convertTime(input, separator) {
        var pad = function(input) {return input < 10 ? "0" + input : input;};
        return [
            pad(Math.floor(input / 3600)),
            pad(Math.floor(input % 3600 / 60)),
            pad(Math.floor(input % 60)),
        ].join(typeof separator !== 'undefined' ?  separator : ':' );
    }

    var tmp = 'udl-tmp/';
    var req;
    var tmp_file = tmp+dataObj.course_id+'.json';
    var download_queue = jsonfile.readFileSync(tmp_file);
    // console.log(download_queue);
    var current_index = _.findIndex(download_queue,function(o) { return o.id == dataObj.id });
    // console.log(current_index)
    // console.log(dataObj)
    // console.log(download_queue[current_index])
    var bar;
    var fileUrl = dataObj.data_url,
      base_path = argv.output ? files.getCurrentDirectoryBase() + path.sep + argv.output : files.getCurrentDirectoryBase(),
      //edited to get current file with its chapter number
      title = dataObj.number ? dataObj.number+' - '+sanitize(dataObj.title)+'.'+dataObj.extension : sanitize(dataObj.title)+'.'+dataObj.extension,
      apiPath = base_path + path.sep + sanitize(dataObj.chapter) + path.sep + title,
      total_size = 0,
      total_downloaded = 0,
      remaining_time = 0;
      console.log();
      console.log('Chapter : '+dataObj.chapter);
      if(dataObj.resolution)
      {
        console.log('Video : '+ title);
        console.log('Resolution : '+ dataObj.resolution+'p');
      }
      else
      {
        console.log('File : '+ title);
      }
      console.log('Location : '+apiPath);

      if(dataObj.state == 'C')
      {
        console.log(chalk.green("Already downloaded"));
        callback();
      }
      else
      {

      mkdirp(base_path+path.sep+sanitize(dataObj.chapter), function (err) {
          if (err){
             callback(err);
             return;
           }

          // The options argument is optional so you can omit it
         req = progress(request(fileUrl), {
            // throttle: 2000,                    // Throttle the progress event to 2000ms, defaults to 1000ms
            // delay: 1000,                       // Only start to emit after 1000ms delay, defaults to 0ms
            // lengthHeader: 'x-transfer-length'  // Length header to use, defaults to content-length
        })
        .on('request',function(req){

            download_queue[current_index].state = 'R';
              console.log();
               bar = new ProgressBar(chalk.green("    downloading [:bar] :percent [:t_downloaded]  TOTAL SIZE :t_size / TIME REMAINING :download_time :complet"), {
                complete: '>',
                incomplete: ' ',
                width: 50,
                total: 100
              });

        })
        .on('progress', function (state) {
            // The state is an object that looks like this:
            // {
            //     percent: 0.5,               // Overall percent (between 0 to 1)
            //     speed: 554732,              // The download speed in bytes/sec
            //     size: {
            //         total: 90044871,        // The total payload size in bytes
            //         transferred: 27610959   // The transferred payload size in bytes
            //     },
            //     time: {
            //         elapsed: 36.235,        // The total elapsed seconds since the start (3 decimals)
            //         remaining: 81.403       // The remaining seconds to finish (3 decimals)
            //     }
            // }

            total_size = bytesToSize(state.size.total);
            remaining_time = convertTime(state.time.remaining);
            total_downloaded = bytesToSize(state.size.transferred);

            bar.update(state.percent,{
               'complet' :  "",
               't_size' : total_size,
               'download_time' : remaining_time,
                't_downloaded' : total_downloaded
            });

        })
        .on('error', function (err) {
            console.log();
            console.log(chalk.red("Error Downloading please try again !!"));
        })
        .on('end', function () {
             bar.update(1,{
               'complet' :  "\u2713",
                 't_size' : total_size,
                 'download_time' : remaining_time,
                 't_downloaded' : total_size
             });
             //console.log("\u2713");
             console.log("\n");
             download_queue[current_index].state = 'C';
             jsonfile.writeFileSync(tmp_file, download_queue);
             callback();
           
        })
        .pipe(fs.createWriteStream(apiPath));
      });
    }
  }



    module.exports = download;
