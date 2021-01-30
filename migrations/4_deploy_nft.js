let HuddlnBaseAsset = artifacts.require("./HuddlnBaseAsset.sol");
module.exports = function(deployer) {
    deployer.deploy(HuddlnBaseAsset);
};
