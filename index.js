#!/usr/bin/env node

var chalk       = require('chalk');
var clear       = require('clear');
var CLI         = require('clui');
var figlet      = require('figlet');
var inquirer    = require('inquirer');
var Spinner     = CLI.Spinner;
var fs          = require('fs');
var Preferences = require('preferences');

var yargs = require('yargs');

var files = require('./lib/files');
var functions = require('./lib/functions');
var core = require('./lib/core');

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

    // Get the URL from the first parameter
    var url = argv._[ 0 ];

    functions.headingMsg();
    var status;
    if(argv.username && argv.password)
    {
                  status = new Spinner('Logging in, please wait...          ');
                  status.start();

                core.login(argv.username,argv.password,function(access_token,client_id){

                status.stop();


                if(url)
                {

                        status = new Spinner("Checking course url...                   ");
                        status.start();

                        core.get_course_id(url,function(id){
                            let course_id = id;
                            core.check_course_status(id,function(){
                              status.stop();
                              core.get_data_links(course_id);
                            });
                        });

                }
                else
                {

                  functions.getCourseList(function(){
                      //console.log("Ok");
                  });

                }

          });
    }
    else
    {

        functions.getUdemyCredentials(function(credentials){

            var status = new Spinner('Logging in, please wait...          ');
                status.start();

                core.login(credentials.username,credentials.password,function(access_token,client_id){
                  status.stop();
                    functions.getCourseList(function(){
                    //console.log("Ok");
                    });
                });
        });
    }
