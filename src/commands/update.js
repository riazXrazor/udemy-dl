const { flags } = require("@oclif/command");
const AutoUpdate = require("cli-autoupdate");
const Base = require("./../Base");
let pkg = require("./../../package.json");

class UpdateCommand extends Base {
  async run() {
    const { flags } = this.parse(UpdateCommand);
    const update = new AutoUpdate(pkg);
    update.on("update", () =>
      this.cli.action.start(`Updating ${pkg.name}`.green)
    );
    update.on("finish", () => this.cli.action.stop());
  }
}

UpdateCommand.description = `
  >Update udemy-dl to latest version
`;

module.exports = UpdateCommand;

process.on("SIGINT", function() {
  process.exit();
});
