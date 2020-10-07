var GatewayContract = artifacts.require("./Gateway.sol");
var StorageContract = artifacts.require("./Storage.sol");

module.exports = function(deployer) {
  // Storage must be deployed first to get the address.
  // DEPLOY IN ORDER,
  // 1. Storage-> GATEWAY
  deployer.deploy(StorageContract);
};
