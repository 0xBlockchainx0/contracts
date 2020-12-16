var GatewayContract = artifacts.require("./Gateway.sol");
var ContentStaking = artifacts.require("./ContentStaking.sol");
var SafeMath = artifacts.require("./lib/SafeMath.sol");


module.exports = function(deployer) {
  // Must first deploy safe math before the contract
  // Storage must be deployed first to get the address.
  // 1. Storage-> GATEWAY
  deployer.deploy(SafeMath);
  deployer.link(SafeMath,ContentStaking); //Must link them
  deployer.deploy(ContentStaking);
};
