let HuddlnMediaAsset = artifacts.require("./HuddlnMediaAsset.sol");
module.exports = function(deployer) {
    deployer.deploy(HuddlnMediaAsset);
};
