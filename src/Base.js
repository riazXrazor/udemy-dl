const {Command} = require('@oclif/command')
const cli = require('cli-ux').default
const _ = require('lodash')
const inquirer    = require('inquirer');
const Preferences = require('preferences');
const path = require('path');
const notifier = require('node-notifier')
const colors = require('colors');
const core = require('./lib/core')
const store = new Preferences('razor-udemy-dl-v2',{
  account: {
    username: '',
    password: ''
  },
  download_queue: {}
});
class Base extends Command {

  get cli() {
    return cli;
  }

  get core() {
    return core;
  }

  get _() {
    return _;
  }

  get inquirer() {
    return inquirer;
  }

  get pref() {
    return store;
  }

  toast(msg) {
    return notifier.notify({
      title: 'Udemy-dl',
      message: msg,
      icon: path.join(__dirname, '..','assets' ,'notification.png')
    });
  }
}



module.exports = Base
