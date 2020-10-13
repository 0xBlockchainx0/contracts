var GatewayContract = artifacts.require("./Gateway.sol");
var StakingContract = artifacts.require("./StakingContract.sol");

module.exports = function(deployer) {
    deployer.deploy(GatewayContract,StakingContract.address);
};
