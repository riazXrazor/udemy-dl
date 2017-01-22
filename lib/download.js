function download(dataObj,callback) {
  var chalk       = require('chalk');
  var request = require('request');
  var progress = require('request-progress');
  var fs = require('fs');
  var path = require('path');
  var ProgressBar = require('progress');
  var mkdirp = require('mkdirp');
  var slugify = require('slugify');
  var yargs = require('yargs');
  var argv = yargs
      .usage( "Usage: udl <course_url> [-u \"username\"] [-p \"password\"]" )
      .command( "course_url", "URL of the udemy coures to download", { alias: "url" } )
      .option( "u", { alias: "username", demand: false, describe: "Username in udemy", type: "string" } )
      .option( "p", { alias: "password", demand: false, describe: "Password of yor account", type: "string" } )
      .option( "r", { alias: "resolution", demand: false, describe: "Download video resolution", type: "integer" } )
      .option( "o", { alias: "output", demand: false, describe: "Output directory where the videos will be saved", type: "string" } )
      .help( "?" )
      .alias( "?", "help" )
      .epilog( "By Riaz Ali Laskar" )
      .argv;
  var files = require('./files');


  var bar;
  var fileUrl = dataObj.data_url,
      base_path = argv.output ? files.getCurrentDirectoryBase() + path.sep + argv.output : files.getCurrentDirectoryBase(),
      apiPath = base_path + path.sep + dataObj.chapter + path.sep + slugify(dataObj.title)+'.mp4';

      console.log();
      console.log('Chapter : '+dataObj.chapter);
      console.log('Video : '+dataObj.title);
      console.log('Location : '+apiPath);

      if(files.fileExists(apiPath))
      {
        console.log(chalk.green("Already downloaded"));
        callback();
      }
      else
      {

      mkdirp(base_path+path.sep+dataObj.chapter, function (err) {
          if (err){
             callback(err);
             return;
           }

          // The options argument is optional so you can omit it
        progress(request(fileUrl), {
            // throttle: 2000,                    // Throttle the progress event to 2000ms, defaults to 1000ms
            // delay: 1000,                       // Only start to emit after 1000ms delay, defaults to 0ms
            // lengthHeader: 'x-transfer-length'  // Length header to use, defaults to content-length
        })
        .on('request',function(req){

              console.log();
               bar = new ProgressBar(chalk.green('  downloading [:bar] :percent :complet '), {
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
            bar.update(state.percent,{
               'complet' :  ""
            });

        })
        .on('error', function (err) {
            // Do something with err
        })
        .on('end', function () {
             bar.update(1,{
               'complet' :  "\u2713"
             });
             //console.log("\u2713");
             console.log("\n");

            callback();
        })
        .pipe(fs.createWriteStream(apiPath));

      });
    }
  }



    module.exports = download;
