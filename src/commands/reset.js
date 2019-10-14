const {flags} = require('@oclif/command')
const Base = require('./../Base')

class ResetCommand extends Base {
  async run() {
    const {flags} = this.parse(ResetCommand)

    if(flags.loginOnly){
      this.pref.account = {
        username: '',
        password: '',
        business: ''
      }
      return;
    }

    if(flags.downloadOnly){
      this.pref.download_queue = {}
      return;
    }

    const n = await this.cli.prompt("Are you sure, all your progress and login credentiels cached will be erased ? (Y|N)")

    if(n == 'y' || n == 'Y'){
      this.pref.account = {
        username: '',
        password: '',
        business: ''
      }
      this.pref.download_queue = {};
    }
  }
}

ResetCommand.description = `
  >Erase all login credentials stored and download progress.
`

ResetCommand.flags = {
  loginOnly: flags.boolean({char: 'l', description: 'Erase login credentials only'}),
  downloadOnly: flags.boolean({char: 'd', description: 'Erase downloading progress only'}),
}

module.exports = ResetCommand

process.on('SIGINT', function() {
  process.exit();
});
