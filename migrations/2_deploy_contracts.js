const ThePaintProject = artifacts.require("ThePaintProject");
const ColorConverter = artifacts.require("ColorConverter");

module.exports = async function(deployer) {
  deployer.deploy(ColorConverter).then(() => {
    deployer.link(ColorConverter, ThePaintProject);
    return deployer.deploy(ThePaintProject);
  })
};
