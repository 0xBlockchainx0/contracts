var MyNFT = artifacts.require("./lib/MyNFT.sol");



module.exports = function(deployer) {
  
  deployer.deploy(MyNFT);

};
