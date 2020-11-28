
var GatewayContract = artifacts.require("Gateway");
var ContentStakingContract = artifacts.require("ContentStaking");

const truffleAssert = require('truffle-assertions');
const Web3 = require('web3');

contract('ContentStaking', function (accounts) {

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



  // Scenario 1:
  /**
   *  Must also check post object members at the end to verify its correct.
   * 1.Create post
   * 2. Stakers Stake
   * 3. owner claims earnings.
   * 4. stakers all close stakes.
   * 
   */

  it("Scenario 1", async function () {

    var stakingContract = await ContentStakingContract.deployed();
    var gatewayContract = await GatewayContract.deployed();

    let postId = Web3.utils.fromAscii("test-3");

    // should be able to set the gateway contract the first time.
    await gatewayContract.setContentStaking(stakingContract.address);
    await stakingContract.setGatewayContract(gatewayContract.address);
    // Start the gateway Contract, default is paused
    await gatewayContract.startContract()

    // ~~~~~~~~~ 1. Create POST ~~~~~~~~~
    await gatewayContract.content_CreatePost(postId, 0);

    //Check the post object now storageContract.methods.postItems(postID_Hash_append).call();
    let postObject = await stakingContract.postItems(postId);
    // parse postObject to decimals for readability
    postObject = {
      creator: postObject.creator,
      creatorPayoutStatus: Web3.utils.hexToNumber(postObject.creatorPayoutStatus),
      tipPool: Web3.utils.hexToNumber(postObject.tipPool),
      stakeFeePool: Web3.utils.hexToNumber(postObject.stakeFeePool),
      creatorEarningsAmount: Web3.utils.hexToNumber(postObject.creatorEarningsAmount),
      totalStakedAmount: Web3.utils.hexToNumber(postObject.totalStakedAmount),
      createdAtBlock: Web3.utils.hexToNumber(postObject.createdAtBlock),
      tippingBlockStart: Web3.utils.hexToNumber(postObject.tippingBlockStart),
      stakersCount: Web3.utils.hexToNumber(postObject.stakersCount),
      stakesOpenCount: Web3.utils.hexToNumber(postObject.stakesOpenCount),
    };
    console.log('\n\n')
    console.log('> New Post Created -> ', postObject);
    console.log('\n\n')
    //assert.equal(await gatewayContract.contentStakingAddress(), stakingContract.address, 'Verifies the correct address was updated')

   // console.log('TESTING',await stakingContract.postItems(postId).stakes[_sender] );
   console.log('TESTING',await stakingContract.getStake(postId,accounts[1]))
    // ~~~~~~~~~ 2. Stakers Added ~~~~~~~~~
    await gatewayContract.content_PlaceStake(postId, {
      from: accounts[1],
      value: 1000000000000000000
    });
    console.log('TESTING',await stakingContract.getStake(postId,accounts[1]))

    

  });




});