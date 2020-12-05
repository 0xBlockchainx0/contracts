
var GatewayContract = artifacts.require("Gateway");
var ContentStakingContract = artifacts.require("ContentStaking");

const truffleAssert = require('truffle-assertions');
const Web3 = require('web3');

contract('Gateway', function (accounts) {

  /*
      Scenario 1 (Happy Path): 
      0. Link Contracts & Start. Owner of post balance before
      1. Create Post
      2. Stakers added to post
      3. Check Stakers are in the post structure with correct math
      4. 3 tippers tip the post
      6. Owner removes earnings
      7. Stakers each claim earnings pool.
  */
  let tryCatch = require("./exceptions.js").tryCatch;
  let errTypes = require("./exceptions.js").errTypes;
  let postId = Web3.utils.fromAscii("test");


  // Set Gateway to be linked to the Stakign contract
  //********* * Step. 0 * *********

  it("Link The Gateway <-> Staking Contracts", async function () {
    var stakingContract = await ContentStakingContract.deployed();
    var gatewayContract = await GatewayContract.deployed();
    // should be able to set the gateway contract the first time.
    await gatewayContract.setContentStaking(stakingContract.address);
    await stakingContract.setGatewayContract(gatewayContract.address);
    // Start the gateway Contract, default is paused
    await gatewayContract.startContract()
 
    //console.log('show gateawycontract test',await stakingContract.gatewayContract())
    assert.equal(await gatewayContract.contentStakingAddress(), stakingContract.address, 'Verifies the correct address was updated')
    // assert.equal(await stakingContract.gatewayContract(), gatewayContract.address, 'Verifies the correct address was updated')
  });

  it("Start/Stop Gateway from Owner", async function () {
    var stakingContract = await ContentStakingContract.deployed();
    var gatewayContract = await GatewayContract.deployed();
    // should be able to set the gateway contract the first time.

    await gatewayContract.stopContract();
    assert.equal(await gatewayContract.isRunning(), false, 'Verify correct stopping')

    await gatewayContract.startContract();

    assert.equal(await gatewayContract.isRunning(), true, 'Verify starting')

  });

  // ~~~~~~~~~~~~~ SAFTEY MODIFIER CHECKS ~~~~~~~~~~~~~~~~~~~~
  /**
   * Ensure only owner can control the stopping and starting of gateway
   */
  it("Stop Gateway from Mal Actor", async function () {
    var stakingContract = await ContentStakingContract.deployed();
    var gatewayContract = await GatewayContract.deployed();
    // should be able to set the gateway contract the first time.


    await truffleAssert.reverts(
      gatewayContract.stopContract({ from: accounts[2] }),
      "Ownable: caller is not the owner"
    );

  });

   /**
   * Ensure only owner can control the stopping and starting of gateway
   */
  it("Start Gateway from Mal Actor", async function () {
    var stakingContract = await ContentStakingContract.deployed();
    var gatewayContract = await GatewayContract.deployed();
    // should be able to set the gateway contract the first time.


    await truffleAssert.reverts(
      gatewayContract.startContract({ from: accounts[2] }),
      "Ownable: caller is not the owner"
    );

  });

    /**
   * Ensure owner is only person that can set the pointer at contentStaking feature.
   */
  it("Set Gateway from Mal Actor", async function () {
    var stakingContract = await ContentStakingContract.deployed();
    var gatewayContract = await GatewayContract.deployed();
    // should be able to set the gateway contract the first time.


    await truffleAssert.reverts(
      gatewayContract.setContentStaking(stakingContract.address,{ from: accounts[2] }),
      "Ownable: caller is not the owner"
    );

  });

      /**
   * Ensure owner is only person that can set the pointer at contentStaking feature.
   *
  it("UpdateFee from Mal Actor", async function () {
    var stakingContract = await ContentStakingContract.deployed();
    var gatewayContract = await GatewayContract.deployed();
    // should be able to set the gateway contract the first time.

    await truffleAssert.reverts(
      gatewayContract.updateFee(20,{ from: accounts[2] }),
      "Ownable: caller is not the owner"
    );
   
  // console.log('NEW FEE', Web3.utils.hexToNumber(await gatewayContract.fee()))

  }); */

   /**
   * Ensure someone cant steal ownership.
   */
  it("TransferOwnership from Mal Actor", async function () {
    var stakingContract = await ContentStakingContract.deployed();
    var gatewayContract = await GatewayContract.deployed();
    // should be able to set the gateway contract the first time.

    await truffleAssert.reverts(
      gatewayContract.transferOwnership( accounts[2] ,{ from: accounts[2] }),
      "Ownable: caller is not the owner"
    );

  });
  /**
   * Transfer ownership call from owner, then transfer it back to original owner
   */
  it("Transfer Ownership from Owner to new Owner and Back", async function () {
    var stakingContract = await ContentStakingContract.deployed();
    var gatewayContract = await GatewayContract.deployed();
    // should be able to set the gateway contract the first time.

    
    await gatewayContract.transferOwnership(accounts[2]);
  
    assert.equal(await gatewayContract.owner(),accounts[2] , 'Verify new Owner')
    await gatewayContract.transferOwnership(accounts[0],{ from: accounts[2] });
  
    assert.equal(await gatewayContract.owner(),accounts[0] , 'Verify old Owner')

  });
 
});