const {flags} = require('@oclif/command')
const Base = require('./../Base')
const cli = require('cli-ux').default

class LoginCommand extends Base {
  async run() {
    const {flags} = this.parse(LoginCommand)
    // this.pref.download_queue = {};
    // console.log(JSON.stringify(this.pref.download_queue))
    // return;
    this.toast(`Starting udemy-dl`);
    let business;
    if(flags.business && this._.isEmpty(flags.business) && !this.pref.account.business){
       business = await this.cli.prompt('Enter business name')
    } else {
      business = flags.business || this.pref.account.business
    }
    const username = flags.username || this.pref.account.username || await this.cli.prompt('Enter your Udemy username')
    const password = flags.password || this.pref.account.password || await this.cli.prompt('Enter your password', {type: 'hide'})


    this.cli.action.start('Authencating'.green)

    try{
      const {access_token,client_id} = await this.core.login(username,password,business);
       this.pref.account = {
        access_token,
        client_id,
        username,
        password
       }

       this.cli.action.start('Fetching courses'.green)
       const datalist = await this.core.getCourseList();

       this.cli.action.stop();

       let questions = [
         {
             type: 'list',
             name: 'course',
             message: 'Select a course to download:',
             choices: this._.map(datalist,(course,index) =>`${index+1}) ${course.title}`),
             default: 0
         }
      ];

     const { course } = await this.inquirer.prompt(questions);

     const selectedCourse = this._.find(datalist,(o) => {
        return this._.includes(course,o.title);
     });

     const {videos, resolution_choices} = await this.core.fetchCourseData(selectedCourse)

     questions = [
        {
            type: 'list',
            name: 'selectedResolution',
            message: 'Select the maximum video resolution to download:',
            choices:resolution_choices,
            default: 0
        }
    ];

   const { selectedResolution } = await this.inquirer.prompt(questions)
   let cstore;
   if(this._.isEmpty(this.pref.download_queue[selectedCourse.id])){
      this.pref.download_queue[selectedCourse.id] = {
        id: selectedCourse.id,
        videos,
        downloadQueue: [],
        resolutionChoices: resolution_choices,
        selectedResolution,
        status: 0,
        folder: process.cwd()
      }
          cstore = this.pref.download_queue[selectedCourse.id];
          this.cli.action.start('initializing'.green)
          await this.core.initializeDownload(cstore,this.pref);
  } else {
    cstore = this.pref.download_queue[selectedCourse.id];
  }



  if(cstore.status < 1){
    cstore.status = 1
    this.cli.action.start('starting download'.green)
    this.cli.action.stop();
    await this.core.startDownload(cstore,this.pref);
  } else {
    this.cli.action.start('resuming download'.green)
    this.cli.action.stop();
    this.toast(`Resuming download !!`);
  }
  if(cstore.status < 2){
    cstore.status = 2
  } else {
    console.log(`Course already downloaded at ${cstore.folder} !!`.green)
    this.toast(`Course already downloaded at ${cstore.folder} !!`);
  }

    this.cli.action.start('download complete'.green)
    this.toast(`Download complete !!`);
    this.cli.action.stop();
    } catch(e){
      this.cli.action.stop();
      this.toast(e.message || e);
      console.log(e.message.red || e.red)
    }

  }
}

LoginCommand.description = `
  >Login to udemy.com and displays a list of courses to download.
`

LoginCommand.flags = {
  username: flags.string({char: 'u', description: 'Udemy username'}),
  password: flags.string({char: 'p', description: 'Udemy password'}),
  output: flags.string({char: 'o', description: 'Output directory where the videos will be save, defaults to current directory'}),
  export: flags.boolean({char: 'e', description: 'Export the course data as json with links'}),
  url: flags.string({char: 'r', description: 'Url of the couse to be downloaded'}),
  business: flags.string({char: 'b', description: 'Business name, in case of Udemy for Business'}),
}

module.exports = LoginCommand

process.on('SIGINT', function() {
  process.exit();
});
