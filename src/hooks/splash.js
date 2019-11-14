const path = require("path");
const logo = require("asciiart-logo");
const config = require(path.join(__dirname, "..", "..", "package.json"));
const updateNotifier = require("update-notifier");
const pkg = require("./../../package.json");
const notifier = updateNotifier({ pkg, updateCheckInterval: 0 });
module.exports = async function(options) {
  config.font = "doh";
  config.logoColor = "bold-green";
  config.textColor = "bold-blue";
  config.borderColor = "bold-blue";
  config.horizontalLayout = "fitted";
  console.log(logo(config).render());
  notifier.notify({
    isGlobal: true,
    defer: false,
    boxenOpts: {
      padding: 2,
      margin: 2,
      align: "center",
      borderColor: "yellow"
    }
  });
};
