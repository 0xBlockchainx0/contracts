
var GatewayContract = artifacts.require("Gateway");
var ContentStakingContract = artifacts.require("ContentStaking");
const BigNumber = require('bignumber.js');
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
    // Using big ints for in place of js prim int. 0n ==0
    var stakingContract = await ContentStakingContract.deployed();
    var gatewayContract = await GatewayContract.deployed();
    let fee = 10;
    let staker1Amount = 1000000000000000000;
    let staker2Amount = 500000000000000000;
    let postId = Web3.utils.fromAscii("test-1");

    // should be able to set the gateway contract the first time.
    await gatewayContract.setContentStaking(stakingContract.address);
    await stakingContract.setGatewayContract(gatewayContract.address);
    // Start the gateway Contract, default is paused
    await gatewayContract.startContract()

    // ~~~~~~~~~ 1. Create POST ~~~~~~~~~
    await gatewayContract.content_createPost(postId, 0);

    //Check the post object now storageContract.methods.postItems(postID_Hash_append).call();
    let postObject_open = await stakingContract.postItems(postId);
    // parse postObject to decimals for readability
    postObject_open = {
      initialized: postObject_open.initialized,
      creator: postObject_open.creator,
      tipPool: new BigNumber(postObject_open.tipPool).toFixed(),
      stakeFeePool: new BigNumber(postObject_open.stakeFeePool).toFixed(),
      creatorEarningsAmount: new BigNumber(postObject_open.creatorEarningsAmount).toFixed(),
      totalStakedAmount: new BigNumber(postObject_open.totalStakedAmount).toFixed(),
      createdAtBlock: new BigNumber(postObject_open.createdAtBlock).toFixed(),
      tippingBlockStart: new BigNumber(postObject_open.tippingBlockStart).toFixed(),
      stakersCount: new BigNumber(postObject_open.stakersCount).toFixed(),
      stakesOpenCount: new BigNumber(postObject_open.stakesOpenCount).toFixed(),
    };
    console.log('\n\n')
    console.log('> New Post Created -> ', postObject_open);
    console.log('\n\n')
    //assert.equal(await gatewayContract.contentStakingAddress(), stakingContract.address, 'Verifies the correct address was updated')

    // console.log('TESTING',await stakingContract.postItems(postId).stakes[_sender] );

    // ~~~~~~~~~ 2. Stakers Added ~~~~~~~~~
    //1 ether
    await gatewayContract.content_placeStake(postId, {
      from: accounts[1],
      value: staker1Amount
    });

    let stakeObject_open1 = await stakingContract.getStake(postId, accounts[1])
    //is BigInt, if hex value gets to large it cant be stored in primitive js int.
    stakeObject_open1 = {
      initialized: stakeObject_open1[0],
      status: new BigNumber(stakeObject_open1[1]).toFixed(),
      amountStaked: new BigNumber(stakeObject_open1[2]).toFixed(),
      amountAccrued: new BigNumber(stakeObject_open1[3]).toFixed(),
      blockOpened: new BigNumber(stakeObject_open1[4]).toFixed(),
      blockClosed: new BigNumber(stakeObject_open1[5]).toFixed(),



    };
    console.log('\n\n')
    console.log('> New Stake Created -> ', stakeObject_open1);
    console.log('\n\n')

    // stake half of the first staker, 2 ether
    await gatewayContract.content_placeStake(postId, {
      from: accounts[2],
      value: staker2Amount
    });

    let stakeObject_open2 = await stakingContract.getStake(postId, accounts[2])
    //is BigInt, if hex value gets to large it cant be stored in primitive js int.
    stakeObject_open2 = {
      initialized: stakeObject_open2[0],
      status: new BigNumber(stakeObject_open2[1]).toFixed(),
      amountStaked: stakeObject_open2[2],
      amountAccrued: new BigNumber(stakeObject_open2[3]).toFixed(),
      blockOpened: new BigNumber(stakeObject_open2[4]).toFixed(),
      blockClosed: new BigNumber(stakeObject_open2[5]).toFixed(),



    };
    console.log('\n\n')
    console.log('> New Stake Created -> ', stakeObject_open2);
    console.log('\n\n')

    //
    // ~~~~~~~~~ 3. Stakers Sell off ~~~~~~~~~

    // because there are not tips they should only get back the inital amount they staked minus the fee given to creator.

    await gatewayContract.content_closeStake(postId, {
      from: accounts[1],
    });

    let stakeObject_closed1 = await stakingContract.getStake(postId, accounts[1])
    //is BigInt, if hex value gets to large it cant be stored in primitive js int.
    stakeObject_closed1 = {
      initialized: stakeObject_closed1[0],
      status: new BigNumber(stakeObject_closed1[1]).toFixed(),
      amountStaked: new BigNumber(stakeObject_closed1[2]).toFixed(),
      amountAccrued: new BigNumber(stakeObject_closed1[3]).toFixed(),
      blockOpened: new BigNumber(stakeObject_closed1[4]).toFixed(),
      blockClosed: new BigNumber(stakeObject_closed1[5]).toFixed(),



    };
    console.log('\n\n')
    console.log('> Staker 1 closed -> ', stakeObject_closed1);
    console.log('\n\n')

    // Test all stake 1 return values to ensure fees/ and math is correct.
    // Then test the postItems object to ensure stake is closed, stakers=stakers-1 and pools math is now updated to subtract earnings.
    // also test owner has been sent the fee.

    await gatewayContract.content_closeStake(postId, {
      from: accounts[2],
    });

    let stakeObject_closed2 = await stakingContract.getStake(postId, accounts[2])
    //is BigInt, if hex value gets to large it cant be stored in primitive js int.
    stakeObject_closed2 = {
      initialized: stakeObject_closed2[0],
      status: new BigNumber(stakeObject_closed2[1]).toFixed(),
      amountStaked: new BigNumber(stakeObject_closed2[2]).toFixed(),
      amountAccrued: new BigNumber(stakeObject_closed2[3]).toFixed(),
      blockOpened: new BigNumber(stakeObject_closed2[4]).toFixed(),
      blockClosed: new BigNumber(stakeObject_closed2[5]).toFixed(),



    };
    console.log('\n\n')
    console.log('> Staker 2 closed -> ', stakeObject_closed2);
    console.log('\n\n')



    await gatewayContract.content_claimPostEarnings(postId, {
      from: accounts[0],
    });


    let postObject_closed = await stakingContract.postItems(postId);
    // parse postObject to decimals for readability
    postObject_closed = {
      initialized: postObject_closed.initialized,
      creator: postObject_closed.creator,
      tipPool: new BigNumber(postObject_closed.tipPool).toFixed(),
      stakeFeePool: new BigNumber(postObject_closed.stakeFeePool).toFixed(),
      creatorEarningsAmount: new BigNumber(postObject_closed.creatorEarningsAmount).toFixed(),
      totalStakedAmount: new BigNumber(postObject_closed.totalStakedAmount).toFixed(),
      createdAtBlock: new BigNumber(postObject_closed.createdAtBlock).toFixed(),
      tippingBlockStart: new BigNumber(postObject_closed.tippingBlockStart).toFixed(),
      stakersCount: new BigNumber(postObject_closed.stakersCount).toFixed(),
      stakesOpenCount: new BigNumber(postObject_closed.stakesOpenCount).toFixed(),
    };
    console.log('\n\n')
    console.log('> Closed Post -> ', postObject_closed);
    console.log('\n\n')


    //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ DATA VALIDATION ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // SUMMARY STAGE, COMPARE VALUES OF THE ENDING POST OBJECT AND STAKE OBJECTS TO VERIFY CORRECT MATH WAS APPLIED
    let postValidation = {
      initialized: true,
      creator: accounts[0],
      tipPool: new BigNumber(0).toFixed(), // no tips sent,
      stakeFeePool: (staker1Amount * .10) + (staker2Amount * .10),

      creatorEarningsAmount: ((staker1Amount * .10) + (staker2Amount * .10)) - (((staker1Amount * .10) + (staker2Amount * .10)) * .10), //sum all amountStakes and apply huddln fee
      totalStakedAmount: 0, //add total of stakes, then remove fee
      // createdAtBlock: new BigNumber(postObject.createdAtBlock), THESE VALUES NOT CHECKED FOR MATH
      // tippingBlockStart: new BigNumber(postObject.tippingBlockStart), THESE VALUES NOT CHECKED FOR MATH
      stakersCount: 2,
      stakesOpenCount: 0,

    }


    console.log('Validation Values for comparison', postValidation)
    assert.equal(postValidation.initialized, postObject_closed.initialized, 'initialized'); // INIT
    assert.equal(postValidation.creator, postObject_closed.creator, 'creator'); // creator
    assert.equal(postValidation.tipPool, postObject_closed.tipPool, 'tipPool'); // tipPool
    assert.equal(postValidation.stakeFeePool, postObject_closed.stakeFeePool, 'stakeFeePool'); // stakeFeePool
    assert.equal(postValidation.creatorEarningsAmount, postObject_closed.creatorEarningsAmount, 'creatorEarningsAmount'); // creatorEarningsAmount
    assert.equal(postValidation.totalStakedAmount, postObject_closed.totalStakedAmount, 'totalStakedAmount'); // totalStakedAmount
    assert.equal(postValidation.stakersCount, postObject_closed.stakersCount, 'stakersCount'); // stakersCount
    assert.equal(postValidation.stakesOpenCount, postObject_closed.stakesOpenCount, 'stakesOpenCount'); // stakesOpenCount


  });



  // Scenario 1:
  /**
   *  Must also check post object members at the end to verify its correct.
   * 1.Create post
   * 2. 2 Stakers Stake
   * 3. 2 tippers come in and push tips
   * 4. owner claims earnings.
   * 5. stakers all close stakes.
   * 
   */

  it("Scenario 2", async function () {
    // Using big ints for in place of js prim int. 0n ==0
    var stakingContract = await ContentStakingContract.deployed();
    var gatewayContract = await GatewayContract.deployed();
    let fee = 10;
    let staker1Amount = 1000000000000000000;
    let staker2Amount = 500000000000000000;
    let tipper1Amount = 5000000000000000000;
    let tipper2Amount = 2000000000000000000;

    let postId = Web3.utils.fromAscii("test-2");

    // should be able to set the gateway contract the first time.
    await gatewayContract.setContentStaking(stakingContract.address);
    await stakingContract.setGatewayContract(gatewayContract.address);
    // Start the gateway Contract, default is paused
    await gatewayContract.startContract()

    // ~~~~~~~~~ 1. Create POST ~~~~~~~~~
    await gatewayContract.content_createPost(postId, 0);

    //Check the post object now storageContract.methods.postItems(postID_Hash_append).call();
    let postObject_open = await stakingContract.postItems(postId);
    // parse postObject to decimals for readability
    postObject_open = {
      initialized: postObject_open.initialized,
      creator: postObject_open.creator,
      tipPool: new BigNumber(postObject_open.tipPool).toFixed(),
      stakeFeePool: new BigNumber(postObject_open.stakeFeePool).toFixed(),
      creatorEarningsAmount: new BigNumber(postObject_open.creatorEarningsAmount).toFixed(),
      totalStakedAmount: new BigNumber(postObject_open.totalStakedAmount).toFixed(),
      createdAtBlock: new BigNumber(postObject_open.createdAtBlock).toFixed(),
      tippingBlockStart: new BigNumber(postObject_open.tippingBlockStart).toFixed(),
      stakersCount: new BigNumber(postObject_open.stakersCount).toFixed(),
      stakesOpenCount: new BigNumber(postObject_open.stakesOpenCount).toFixed(),
    };
    console.log('\n\n')
    console.log('> New Post Created -> ', postObject_open);
    console.log('\n\n')
    //assert.equal(await gatewayContract.contentStakingAddress(), stakingContract.address, 'Verifies the correct address was updated')

    // console.log('TESTING',await stakingContract.postItems(postId).stakes[_sender] );

    // ~~~~~~~~~ 2. Stakers Added ~~~~~~~~~
    //1 ether
    await gatewayContract.content_placeStake(postId, {
      from: accounts[1],
      value: staker1Amount
    });

    let stakeObject_open1 = await stakingContract.getStake(postId, accounts[1])
    //is BigInt, if hex value gets to large it cant be stored in primitive js int.
    stakeObject_open1 = {
      initialized: stakeObject_open1[0],
      status: new BigNumber(stakeObject_open1[1]).toFixed(),
      amountStaked: new BigNumber(stakeObject_open1[2]).toFixed(),
      amountAccrued: new BigNumber(stakeObject_open1[3]).toFixed(),
      blockOpened: new BigNumber(stakeObject_open1[4]).toFixed(),
      blockClosed: new BigNumber(stakeObject_open1[5]).toFixed(),



    };
    console.log('\n\n')
    console.log('> New Stake Created -> ', stakeObject_open1);
    console.log('\n\n')

    // stake half of the first staker, 2 ether
    await gatewayContract.content_placeStake(postId, {
      from: accounts[2],
      value: staker2Amount
    });

    let stakeObject_open2 = await stakingContract.getStake(postId, accounts[2])
    //is BigInt, if hex value gets to large it cant be stored in primitive js int.
    stakeObject_open2 = {
      initialized: stakeObject_open2[0],
      status: new BigNumber(stakeObject_open2[1]).toFixed(),
      amountStaked: stakeObject_open2[2],
      amountAccrued: new BigNumber(stakeObject_open2[3]).toFixed(),
      blockOpened: new BigNumber(stakeObject_open2[4]).toFixed(),
      blockClosed: new BigNumber(stakeObject_open2[5]).toFixed(),



    };
    console.log('\n\n')
    console.log('> New Stake Created -> ', stakeObject_open2);
    console.log('\n\n')

    // ~~~~~~~~~ 3. Tippers  ~~~~~~~~~
    // stake half of the first staker, 2 ether
    await gatewayContract.content_tip(postId, {
      from: accounts[3],
      value: tipper1Amount
    });
    // because there are not tips they should only get back the inital amount they staked minus the fee given to creator.

    await gatewayContract.content_closeStake(postId, {
      from: accounts[1],
    });

    let stakeObject_closed1 = await stakingContract.getStake(postId, accounts[1])
    //is BigInt, if hex value gets to large it cant be stored in primitive js int.
    stakeObject_closed1 = {
      initialized: stakeObject_closed1[0],
      status: new BigNumber(stakeObject_closed1[1]).toFixed(),
      amountStaked: new BigNumber(stakeObject_closed1[2]).toFixed(),
      amountAccrued: new BigNumber(stakeObject_closed1[3]).toFixed(),
      blockOpened: new BigNumber(stakeObject_closed1[4]).toFixed(),
      blockClosed: new BigNumber(stakeObject_closed1[5]).toFixed(),



    };
    console.log('\n\n')
    console.log('> Staker 1 closed -> ', stakeObject_closed1);
    console.log('\n\n')

    // Test all stake 1 return values to ensure fees/ and math is correct.
    // Then test the postItems object to ensure stake is closed, stakers=stakers-1 and pools math is now updated to subtract earnings.
    // also test owner has been sent the fee.

    await gatewayContract.content_closeStake(postId, {
      from: accounts[2],
    });

    let stakeObject_closed2 = await stakingContract.getStake(postId, accounts[2])
    //is BigInt, if hex value gets to large it cant be stored in primitive js int.
    stakeObject_closed2 = {
      initialized: stakeObject_closed2[0],
      status: new BigNumber(stakeObject_closed2[1]).toFixed(),
      amountStaked: new BigNumber(stakeObject_closed2[2]).toFixed(),
      amountAccrued: new BigNumber(stakeObject_closed2[3]).toFixed(),
      blockOpened: new BigNumber(stakeObject_closed2[4]).toFixed(),
      blockClosed: new BigNumber(stakeObject_closed2[5]).toFixed(),



    };
    console.log('\n\n')
    console.log('> Staker 2 closed -> ', stakeObject_closed2);
    console.log('\n\n')



    await gatewayContract.content_claimPostEarnings(postId, {
      from: accounts[0],
    });


    let postObject_closed = await stakingContract.postItems(postId);
    // parse postObject to decimals for readability
    postObject_closed = {
      initialized: postObject_closed.initialized,
      creator: postObject_closed.creator,
      tipPool: new BigNumber(postObject_closed.tipPool).toFixed(),
      stakeFeePool: new BigNumber(postObject_closed.stakeFeePool).toFixed(),
      creatorEarningsAmount: new BigNumber(postObject_closed.creatorEarningsAmount).toFixed(),
      totalStakedAmount: new BigNumber(postObject_closed.totalStakedAmount).toFixed(),
      createdAtBlock: new BigNumber(postObject_closed.createdAtBlock).toFixed(),
      tippingBlockStart: new BigNumber(postObject_closed.tippingBlockStart).toFixed(),
      stakersCount: new BigNumber(postObject_closed.stakersCount).toFixed(),
      stakesOpenCount: new BigNumber(postObject_closed.stakesOpenCount).toFixed(),
    };
    console.log('\n\n')
    console.log('> Closed Post -> ', postObject_closed);
    console.log('\n\n')


    //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ DATA VALIDATION ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // SUMMARY STAGE, COMPARE VALUES OF THE ENDING POST OBJECT AND STAKE OBJECTS TO VERIFY CORRECT MATH WAS APPLIED
    let postValidation = {
      initialized: true,
      creator: accounts[0],
      tipPool: new BigNumber(0).toFixed(), // no tips sent,
      stakeFeePool: (staker1Amount * .10) + (staker2Amount * .10),

      creatorEarningsAmount: ((staker1Amount * .10) + (staker2Amount * .10)) - (((staker1Amount * .10) + (staker2Amount * .10)) * .10), //sum all amountStakes and apply huddln fee
      totalStakedAmount: 0, //add total of stakes, then remove fee
      // createdAtBlock: new BigNumber(postObject.createdAtBlock), THESE VALUES NOT CHECKED FOR MATH
      // tippingBlockStart: new BigNumber(postObject.tippingBlockStart), THESE VALUES NOT CHECKED FOR MATH
      stakersCount: 2,
      stakesOpenCount: 0,

    }


    console.log('Validation Values for comparison', postValidation)
    assert.equal(postValidation.initialized, postObject_closed.initialized, 'initialized'); // INIT
    assert.equal(postValidation.creator, postObject_closed.creator, 'creator'); // creator
    assert.equal(postValidation.tipPool, postObject_closed.tipPool, 'tipPool'); // tipPool
    assert.equal(postValidation.stakeFeePool, postObject_closed.stakeFeePool, 'stakeFeePool'); // stakeFeePool
    assert.equal(postValidation.creatorEarningsAmount, postObject_closed.creatorEarningsAmount, 'creatorEarningsAmount'); // creatorEarningsAmount
    assert.equal(postValidation.totalStakedAmount, postObject_closed.totalStakedAmount, 'totalStakedAmount'); // totalStakedAmount
    assert.equal(postValidation.stakersCount, postObject_closed.stakersCount, 'stakersCount'); // stakersCount
    assert.equal(postValidation.stakesOpenCount, postObject_closed.stakesOpenCount, 'stakesOpenCount'); // stakesOpenCount


  });
});