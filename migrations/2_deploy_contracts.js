const ThePaintProject = artifacts.require("ThePaintProject");

module.exports = async function(deployer) {
  await deployer.deploy(ThePaintProject);
};
