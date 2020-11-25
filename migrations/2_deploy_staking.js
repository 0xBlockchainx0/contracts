var GatewayContract = artifacts.require("./Gateway.sol");
var ContentStaking = artifacts.require("./ContentStaking.sol");

module.exports = function(deployer) {
  // Storage must be deployed first to get the address.
  // DEPLOY IN ORDER,
  // 1. Storage-> GATEWAY
  deployer.deploy(ContentStaking);
};
