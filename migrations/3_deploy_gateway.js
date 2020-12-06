var GatewayContract = artifacts.require("./Gateway.sol");
var ContentStaking = artifacts.require("./ContentStaking.sol");

module.exports = function(deployer) {
    deployer.deploy(GatewayContract);
};
