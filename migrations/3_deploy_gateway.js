var GatewayContract = artifacts.require("./Gateway.sol");
var EternalStorageContract = artifacts.require("./EternalStorage.sol");

module.exports = function(deployer) {
  // Storage must be deployed first to get the address.
  // DEPLOY IN ORDER,
  // 1. Storage-> GATEWAY

    deployer.deploy(GatewayContract,EternalStorageContract.address);
 
 
};
