
var GatewayContract = artifacts.require("Gateway");
var ContentStakingContract = artifacts.require("ContentStaking");
const BigNumber = require('bignumber.js');
const truffleAssert = require('truffle-assertions');
const Web3 = require('web3');

contract('ContentStaking', function (accounts) {
  

  /* await web3.eth.getBalance(accounts[0]);
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
   * 1. create post
   * 2. stakers stake
   * 3. stakers sell off
   * 4. creator claimsPost earnings
   * 
   */

  it("Scenario 1", async function () {
    console.log('~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ SCENARIO 1 ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~');
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
      tipPool: 0, // no tips sent,
      stakeFeePool: 0,//(staker1Amount * .10) + (staker2Amount * .10),

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



  // Scenario 2:
  /**
   *  Must also check post object members at the end to verify its correct.
   * 1. create post
   * 2. 2 stakers stake
   * 3. 2 Tippers tip
   * 4. stakers sell off
   * 5. creator claimsPost earnings
   * 
   */

  it("Scenario 2", async function () {
    console.log('~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ SCENARIO 2 ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~');
    // Using big ints for in place of js prim int. 0n ==0
    var stakingContract = await ContentStakingContract.deployed();
    var gatewayContract = await GatewayContract.deployed();
    let fee = 10;
    //console.log('accounts',await accounts)
    let creatorWalletBalanceStart = await web3.eth.getBalance(accounts[0]);
    let staker1WalletBalanceStart = await web3.eth.getBalance(accounts[1]);
    let staker2WalletBalanceStart = await web3.eth.getBalance(accounts[2]);
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
    await gatewayContract.content_tip(postId, {
      from: accounts[4],
      value: tipper2Amount
    });
    // because there are not tips they should only get back the inital amount they staked minus the fee given to creator.
    //Show the post object after adding tips to show the tipping pool going up.
    let postObject_tipped1 = await stakingContract.postItems(postId);
    // parse postObject to decimals for readability
    postObject_tipped1 = {
      initialized: postObject_tipped1.initialized,
      creator: postObject_tipped1.creator,
      tipPool: new BigNumber(postObject_tipped1.tipPool).toFixed(),
      stakeFeePool: new BigNumber(postObject_tipped1.stakeFeePool).toFixed(),
      creatorEarningsAmount: new BigNumber(postObject_tipped1.creatorEarningsAmount).toFixed(),
      totalStakedAmount: new BigNumber(postObject_tipped1.totalStakedAmount).toFixed(),
      createdAtBlock: new BigNumber(postObject_tipped1.createdAtBlock).toFixed(),
      tippingBlockStart: new BigNumber(postObject_tipped1.tippingBlockStart).toFixed(),
      stakersCount: new BigNumber(postObject_tipped1.stakersCount).toFixed(),
      stakesOpenCount: new BigNumber(postObject_tipped1.stakesOpenCount).toFixed(),
    };

    console.log('\n\n')
    console.log('> Post Updated with Tips -> ', postObject_tipped1);
    console.log('\n\n')


    // ~~~~~~~~~ 4. Stakers close stakes  ~~~~~~~~~


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


    // ~~~~~~~~~ 5. Owner claims post earnings  ~~~~~~~~~

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
    // check the post object and validate what it should look like
    // validate each stake object for correct state
    //check each staker balance to ensure they got the amount their are suppose to get.

    // SUMMARY STAGE, COMPARE VALUES OF THE ENDING POST OBJECT AND STAKE OBJECTS TO VERIFY CORRECT MATH WAS APPLIED
    let postValidation = {
      initialized: true,
      creator: accounts[0],
      tipPool: 0, // after claiming all earnings , this should be empty
      stakeFeePool: 0, //(staker1Amount * .10) + (staker2Amount * .10),

      creatorEarningsAmount: ((staker1Amount * .10) + (staker2Amount * .10)) - (((staker1Amount * .10) + (staker2Amount * .10)) * .10), //sum all amountStakes and apply huddln fee
      totalStakedAmount: 0, //add total of stakes, then remove fee
      // createdAtBlock: new BigNumber(postObject.createdAtBlock), THESE VALUES NOT CHECKED FOR MATH
      // tippingBlockStart: new BigNumber(postObject.tippingBlockStart), THESE VALUES NOT CHECKED FOR MATH
      stakersCount: 2,
      stakesOpenCount: 0,

    };
    //Some math
    //
    staker1AmountWithFeeRemoved = (staker1Amount - (staker1Amount / 10)); // applying the fee thats paid to the creator.
    staker2AmountWithFeeRemoved = (staker2Amount - (staker2Amount / 10));

    let staker1Validation = {
      initialized: true,
      status: 2, //2 = closedByStaker
      amountStaked: staker1AmountWithFeeRemoved, // actual amount that gets staked has a fee removed and given to creator so actual is a bit less.
      amountAccrued: ((staker1AmountWithFeeRemoved / (staker2AmountWithFeeRemoved + staker1AmountWithFeeRemoved)) * (tipper1Amount + tipper2Amount) - (((staker1AmountWithFeeRemoved / (staker2AmountWithFeeRemoved + staker1AmountWithFeeRemoved)) * (tipper1Amount + tipper2Amount)) / fee))// (stakedamount/totalstakedamount)*(totalproceeds) must also apply huddln fee /10
      //blockopened,
      //blockClosed , these values dont matter.
    }
    let staker2Validation = {
      initialized: true,
      status: 2, //2 = closedByStaker
      amountStaked: staker2AmountWithFeeRemoved,
      amountAccrued: (staker2AmountWithFeeRemoved / (staker2AmountWithFeeRemoved + staker1AmountWithFeeRemoved)) * (tipper1Amount + tipper2Amount) // (stakedamount/totalstakedamount)*(totalproceeds)
      //blockClosed , these values dont matter.
    }
    // console.log('begining bal',staker1WalletBalanceStart);
    // console.log('end bala ',await web3.eth.getBalance(accounts[1]) );

    //TODO : Check txs and add up all gas to do wallet balance comparisons before and after.
    console.log('\n\n')
    console.log('Post Validation Values', postValidation);
    console.log('\n\n')
    console.log('Staker1 Validation Values', staker1Validation);
    console.log('\n\n')
    console.log('Staker2 Validation Values', staker2Validation);
    console.log('\n\n')

    //percentage differences between expected and actual, must be below .5%, gas cost and other factors may make balance slightly off.

    let percentDiff_staker1_AmountAccrued = (100 * Math.abs((staker1Validation.amountAccrued - stakeObject_closed1.amountAccrued) / ((staker1Validation.amountAccrued + stakeObject_closed1.amountAccrued) / 2)));
    let percentDiff_staker2_AmountAccrued = (100 * Math.abs((staker2Validation.amountAccrued - stakeObject_closed2.amountAccrued) / ((staker2Validation.amountAccrued + stakeObject_closed2.amountAccrued) / 2)));
    //creator wallet balance difference should show his earnings
    //creator's wallet should now have balance + earnings, may not be exact so allow some tollerance with percentageDiff
    let creatorWalletBalanceEnd_validation = creatorWalletBalanceStart + postValidation.creatorEarningsAmount;
    let creatorWalletBalanceEnd_actual = await web3.eth.getBalance(accounts[0]);

    let percentDiff_creator_End_Earnings = (100 * Math.abs((creatorWalletBalanceEnd_validation - creatorWalletBalanceEnd_actual) / ((creatorWalletBalanceEnd_validation + creatorWalletBalanceEnd_actual) / 2)));

    //console.log('AMOUNT ACCRUED EARNED PERCENT DIF', percentDiff_creator_End_Earnings)

    //STAKER 1
    assert.equal(staker1Validation.initialized, stakeObject_closed1.initialized, 'initialized'); // INIT
    assert.equal(staker1Validation.status, stakeObject_closed1.status, 'status'); // creator
    assert.equal(staker1Validation.amountStaked, stakeObject_closed1.amountStaked, 'amountStaked'); // tipPool
    //Checks For staker 1
    assert.equal((percentDiff_staker1_AmountAccrued < .5), true, 'Accrued Difference'); // Accrued
    //STAKER 2
    assert.equal(staker2Validation.initialized, stakeObject_closed2.initialized, 'initialized'); // INIT
    assert.equal(staker2Validation.status, stakeObject_closed2.status, 'status'); // creator
    assert.equal(staker2Validation.amountStaked, stakeObject_closed2.amountStaked, 'amountStaked'); // tipPool
    //Checks For staker 2
    assert.equal((percentDiff_staker2_AmountAccrued < .5), true, 'Accrued Difference'); // Accrued

    assert.equal(postValidation.initialized, postObject_closed.initialized, 'initialized'); // INIT
    assert.equal(postValidation.creator, postObject_closed.creator, 'creator'); // creator
    assert.equal(postValidation.tipPool, postObject_closed.tipPool, 'tipPool'); // tipPool
    assert.equal(postValidation.stakeFeePool, postObject_closed.stakeFeePool, 'stakeFeePool'); // stakeFeePool
    assert.equal(postValidation.creatorEarningsAmount, postObject_closed.creatorEarningsAmount, 'creatorEarningsAmount'); // creatorEarningsAmount
    assert.equal(postValidation.totalStakedAmount, postObject_closed.totalStakedAmount, 'totalStakedAmount'); // totalStakedAmount
    assert.equal(postValidation.stakersCount, postObject_closed.stakersCount, 'stakersCount'); // stakersCount
    assert.equal(postValidation.stakesOpenCount, postObject_closed.stakesOpenCount, 'stakesOpenCount'); // stakesOpenCount
    assert.equal((percentDiff_creator_End_Earnings < .3), true, 'Creator Earnings Difference'); // Earnings Accrued actual amount vs calculated should not exceed more than .3%


  });



  // Scenario 3: Creator claims earnings before stakers close.
  // this validates the logic for claiming earnings multiple times, and should go through both logic paths in claimpostearnings() (withstakers/withoutstakers paths)
  /**
   *  Must also check post object members at the end to verify its correct.
   * 1. create post
   * 2. 2 stakers stake
   * 3. 2 Tippers tip
   * 4. 1 staker sells
   * 5. creator claimsPost earnings
   * 6. Tiipers tip again
   * 7. 1 staker sells
   * 8. creator claimspost earnings again.
   * 
   */

  it("Scenario 3", async function () {
    console.log('~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ SCENARIO 3 ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~');
    // Using big ints for in place of js prim int. 0n ==0
    var stakingContract = await ContentStakingContract.deployed();
    var gatewayContract = await GatewayContract.deployed();
    let fee = 10;
    //console.log('accounts',await accounts)
    let creatorWalletBalanceStart = await web3.eth.getBalance(accounts[0]);
    let staker1WalletBalanceStart = await web3.eth.getBalance(accounts[1]);
    let staker2WalletBalanceStart = await web3.eth.getBalance(accounts[2]);
    let staker1Amount = 1000000000000000000;
    let staker2Amount = 500000000000000000;
    let tipper1Amount = 5000000000000000000;
    let tipper2Amount = 2000000000000000000; //tiiper2 will tip once in step 3, and then again in step 5

    let postId = Web3.utils.fromAscii("test-3");

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
    await gatewayContract.content_tip(postId, {
      from: accounts[4],
      value: tipper2Amount
    });
    // because there are not tips they should only get back the inital amount they staked minus the fee given to creator.
    //Show the post object after adding tips to show the tipping pool going up.
    let postObject_tipped1 = await stakingContract.postItems(postId);
    // parse postObject to decimals for readability
    postObject_tipped1 = {
      initialized: postObject_tipped1.initialized,
      creator: postObject_tipped1.creator,
      tipPool: new BigNumber(postObject_tipped1.tipPool).toFixed(),
      stakeFeePool: new BigNumber(postObject_tipped1.stakeFeePool).toFixed(),
      creatorEarningsAmount: new BigNumber(postObject_tipped1.creatorEarningsAmount).toFixed(),
      totalStakedAmount: new BigNumber(postObject_tipped1.totalStakedAmount).toFixed(),
      createdAtBlock: new BigNumber(postObject_tipped1.createdAtBlock).toFixed(),
      tippingBlockStart: new BigNumber(postObject_tipped1.tippingBlockStart).toFixed(),
      stakersCount: new BigNumber(postObject_tipped1.stakersCount).toFixed(),
      stakesOpenCount: new BigNumber(postObject_tipped1.stakesOpenCount).toFixed(),
    };

    console.log('\n\n')
    console.log('> Post Updated with Tips -> ', postObject_tipped1);
    console.log('\n\n')



    // ~~~~~~~~~ 4. Stakers close stakes  ~~~~~~~~~


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

    // ~~~~~~~~~ 5. Owner claims post earnings  ~~~~~~~~~

    await gatewayContract.content_claimPostEarnings(postId, {
      from: accounts[0],
    });

    let postObject_closed1 = await stakingContract.postItems(postId);
    // parse postObject to decimals for readability
    postObject_closed1 = {
      initialized: postObject_closed1.initialized,
      creator: postObject_closed1.creator,
      tipPool: new BigNumber(postObject_closed1.tipPool).toFixed(),
      stakeFeePool: new BigNumber(postObject_closed1.stakeFeePool).toFixed(),
      creatorEarningsAmount: new BigNumber(postObject_closed1.creatorEarningsAmount).toFixed(),
      totalStakedAmount: new BigNumber(postObject_closed1.totalStakedAmount).toFixed(),
      createdAtBlock: new BigNumber(postObject_closed1.createdAtBlock).toFixed(),
      tippingBlockStart: new BigNumber(postObject_closed1.tippingBlockStart).toFixed(),
      stakersCount: new BigNumber(postObject_closed1.stakersCount).toFixed(),
      stakesOpenCount: new BigNumber(postObject_closed1.stakesOpenCount).toFixed(),
    };
    console.log('\n\n')
    console.log('> Closed Post 1st time -> ', postObject_closed1);
    console.log('\n\n')


    // ~~~~~~~~~ 6. Tipper2 tips again ~~~~~~~~~


    await gatewayContract.content_tip(postId, {
      from: accounts[4],
      value: tipper2Amount
    });


    // ~~~~~~~~~ 7. Last staker sells ~~~~~~~~~
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



    // ~~~~~~~~~ 8. Owner claims post earnings  ~~~~~~~~~

    await gatewayContract.content_claimPostEarnings(postId, {
      from: accounts[0],
    })

    await gatewayContract.content_claimPostEarnings(postId, {
      from: accounts[0],
    })


    let postObject_closed2 = await stakingContract.postItems(postId);
    // parse postObject to decimals for readability
    postObject_closed2 = {
      initialized: postObject_closed2.initialized,
      creator: postObject_closed2.creator,
      tipPool: new BigNumber(postObject_closed2.tipPool).toFixed(),
      stakeFeePool: new BigNumber(postObject_closed2.stakeFeePool).toFixed(),
      creatorEarningsAmount: new BigNumber(postObject_closed2.creatorEarningsAmount).toFixed(),
      totalStakedAmount: new BigNumber(postObject_closed2.totalStakedAmount).toFixed(),
      createdAtBlock: new BigNumber(postObject_closed2.createdAtBlock).toFixed(),
      tippingBlockStart: new BigNumber(postObject_closed2.tippingBlockStart).toFixed(),
      stakersCount: new BigNumber(postObject_closed2.stakersCount).toFixed(),
      stakesOpenCount: new BigNumber(postObject_closed2.stakesOpenCount).toFixed(),
    };
    console.log('\n\n')
    console.log('> Closed Post 2nd time -> ', postObject_closed2);
    console.log('\n\n')


    //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ DATA VALIDATION ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // check the post object and validate what it should look like
    // validate each stake object for correct state
    //check each staker balance to ensure they got the amount their are suppose to get.

    // SUMMARY STAGE, COMPARE VALUES OF THE ENDING POST OBJECT AND STAKE OBJECTS TO VERIFY CORRECT MATH WAS APPLIED
    let postValidation = {
      initialized: true,
      creator: accounts[0],
      tipPool: 0, // after claiming all earnings , this should be empty
      stakeFeePool: 0,

      creatorEarningsAmount: ((staker1Amount * .10) + (staker2Amount * .10)) - (((staker1Amount * .10) + (staker2Amount * .10)) * .10), //sum all amountStakes and apply huddln fee
      totalStakedAmount: 0, //add total of stakes, then remove fee
      // createdAtBlock: new BigNumber(postObject.createdAtBlock), THESE VALUES NOT CHECKED FOR MATH
      // tippingBlockStart: new BigNumber(postObject.tippingBlockStart), THESE VALUES NOT CHECKED FOR MATH
      stakersCount: 2,
      stakesOpenCount: 0,

    };
    //Some math
    //
    staker1AmountWithFeeRemoved = (staker1Amount - (staker1Amount / 10)); // applying the fee thats paid to the creator.
    staker2AmountWithFeeRemoved = (staker2Amount - (staker2Amount / 10));

    let staker1Validation = {
      initialized: true,
      status: 2, //2 = closedByStaker
      amountStaked: staker1AmountWithFeeRemoved, // actual amount that gets staked has a fee removed and given to creator so actual is a bit less.
      amountAccrued: ((staker1AmountWithFeeRemoved / (staker2AmountWithFeeRemoved + staker1AmountWithFeeRemoved)) * (tipper1Amount + tipper2Amount) - (((staker1AmountWithFeeRemoved / (staker2AmountWithFeeRemoved + staker1AmountWithFeeRemoved)) * (tipper1Amount + tipper2Amount)) / fee))// (stakedamount/totalstakedamount)*(totalproceeds) must also apply huddln fee /10
      //blockopened,
      //blockClosed , these values dont matter.
    }
    let staker2Validation = {
      initialized: true,
      status: 2, //2 = closedByStaker
      amountStaked: staker2AmountWithFeeRemoved,
      amountAccrued: (staker2AmountWithFeeRemoved / (staker2AmountWithFeeRemoved + staker1AmountWithFeeRemoved)) * (tipper1Amount + tipper2Amount) // (stakedamount/totalstakedamount)*(totalproceeds)
      //blockClosed , these values dont matter.
    }


    //TODO : Check txs and add up all gas to do wallet balance comparisons before and after.
    console.log('\n\n')
    console.log('Post Validation Values', postValidation);
    console.log('\n\n')
    console.log('Staker1 Validation Values', staker1Validation);
    console.log('\n\n')
    console.log('Staker2 Validation Values', staker2Validation);
    console.log('\n\n')

    //percentage differences between expected and actual, must be below .5%, gas cost and other factors may make balance slightly off.

    let percentDiff_staker1_AmountAccrued = (100 * Math.abs((staker1Validation.amountAccrued - stakeObject_closed1.amountAccrued) / ((staker1Validation.amountAccrued + stakeObject_closed1.amountAccrued) / 2)));
    let percentDiff_staker2_AmountAccrued = (100 * Math.abs((staker2Validation.amountAccrued - stakeObject_closed2.amountAccrued) / ((staker2Validation.amountAccrued + stakeObject_closed2.amountAccrued) / 2)));
    //creator wallet balance difference should show his earnings
    //creator's wallet should now have balance + earnings, may not be exact so allow some tollerance with percentageDiff
    let creatorWalletBalanceEnd_validation = creatorWalletBalanceStart + postValidation.creatorEarningsAmount;
    let creatorWalletBalanceEnd_actual = await web3.eth.getBalance(accounts[0]);

    let percentDiff_creator_End_Earnings = (100 * Math.abs((creatorWalletBalanceEnd_validation - creatorWalletBalanceEnd_actual) / ((creatorWalletBalanceEnd_validation + creatorWalletBalanceEnd_actual) / 2)));

    //console.log('AMOUNT ACCRUED EARNED PERCENT DIF', percentDiff_creator_End_Earnings)

    //STAKER 1
    assert.equal(staker1Validation.initialized, stakeObject_closed1.initialized, 'initialized'); // INIT
    assert.equal(staker1Validation.status, stakeObject_closed1.status, 'status'); // creator
    assert.equal(staker1Validation.amountStaked, stakeObject_closed1.amountStaked, 'amountStaked'); // tipPool
    //Checks For staker 1
    assert.equal((percentDiff_staker1_AmountAccrued < .5), true, 'Accrued Difference'); // Accrued
    //STAKER 2
    assert.equal(staker2Validation.initialized, stakeObject_closed2.initialized, 'initialized'); // INIT
    assert.equal(staker2Validation.status, stakeObject_closed2.status, 'status'); // creator
    assert.equal(staker2Validation.amountStaked, stakeObject_closed2.amountStaked, 'amountStaked'); // tipPool
    //Checks For staker 2
    assert.equal((percentDiff_staker2_AmountAccrued < .5), true, 'Accrued Difference'); // Accrued


    assert.equal(postValidation.initialized, postObject_closed2.initialized, 'initialized'); // INIT
    assert.equal(postValidation.creator, postObject_closed2.creator, 'creator'); // creator
    assert.equal(postValidation.tipPool, postObject_closed2.tipPool, 'tipPool'); // tipPool
    assert.equal(postValidation.stakeFeePool, postObject_closed2.stakeFeePool, 'stakeFeePool'); // stakeFeePool
    assert.equal(postValidation.creatorEarningsAmount, postObject_closed2.creatorEarningsAmount, 'creatorEarningsAmount'); // creatorEarningsAmount
    assert.equal(postValidation.totalStakedAmount, postObject_closed2.totalStakedAmount, 'totalStakedAmount'); // totalStakedAmount
    assert.equal(postValidation.stakersCount, postObject_closed2.stakersCount, 'stakersCount'); // stakersCount
    assert.equal(postValidation.stakesOpenCount, postObject_closed2.stakesOpenCount, 'stakesOpenCount'); // stakesOpenCount
    assert.equal((percentDiff_creator_End_Earnings < .3), true, 'Creator Earnings Difference'); // Earnings Accrued actual amount vs calculated should not exceed more than .3%


  });



  // Scenario 4: Creator claims earnings before stakers close. and does nothing else (END)
  /**
   *  Must also check post object members at the end to verify its correct.
   * 1. create post
   * 2. 2 stakers stake
   * 3. 2 Tippers tip
   * 4.  creator claimsPost earnings
   * 5. 1 staker sells
   * 
   */

  it("Scenario 4", async function () {
    console.log('~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ SCENARIO 4 ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~');
    // Using big ints for in place of js prim int. 0n ==0
    var stakingContract = await ContentStakingContract.deployed();
    var gatewayContract = await GatewayContract.deployed();
    let fee = 10;
    //console.log('accounts',await accounts)
    let creatorWalletBalanceStart = await web3.eth.getBalance(accounts[0]);
    let staker1WalletBalanceStart = await web3.eth.getBalance(accounts[1]);
    let staker2WalletBalanceStart = await web3.eth.getBalance(accounts[2]);
    let staker1Amount = 1000000000000000000;
    let staker2Amount = 500000000000000000;
    let tipper1Amount = 5000000000000000000;
    let tipper2Amount = 2000000000000000000; //tiiper2 will tip once in step 3, and then again in step 5

    let postId = Web3.utils.fromAscii("test-4");

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
    await gatewayContract.content_tip(postId, {
      from: accounts[4],
      value: tipper2Amount
    });
    // because there are not tips they should only get back the inital amount they staked minus the fee given to creator.
    //Show the post object after adding tips to show the tipping pool going up.
    let postObject_tipped1 = await stakingContract.postItems(postId);
    // parse postObject to decimals for readability
    postObject_tipped1 = {
      initialized: postObject_tipped1.initialized,
      creator: postObject_tipped1.creator,
      tipPool: new BigNumber(postObject_tipped1.tipPool).toFixed(),
      stakeFeePool: new BigNumber(postObject_tipped1.stakeFeePool).toFixed(),
      creatorEarningsAmount: new BigNumber(postObject_tipped1.creatorEarningsAmount).toFixed(),
      totalStakedAmount: new BigNumber(postObject_tipped1.totalStakedAmount).toFixed(),
      createdAtBlock: new BigNumber(postObject_tipped1.createdAtBlock).toFixed(),
      tippingBlockStart: new BigNumber(postObject_tipped1.tippingBlockStart).toFixed(),
      stakersCount: new BigNumber(postObject_tipped1.stakersCount).toFixed(),
      stakesOpenCount: new BigNumber(postObject_tipped1.stakesOpenCount).toFixed(),
    };

    console.log('\n\n')
    console.log('> Post Updated with Tips -> ', postObject_tipped1);
    console.log('\n\n')


    // ~~~~~~~~~ 4. Owner claims post earnings  ~~~~~~~~~

    await gatewayContract.content_claimPostEarnings(postId, {
      from: accounts[0],
    });


    // ~~~~~~~~~ 5. Stakers close stakes  ~~~~~~~~~


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
    // check the post object and validate what it should look like
    // validate each stake object for correct state
    //check each staker balance to ensure they got the amount their are suppose to get.

    // SUMMARY STAGE, COMPARE VALUES OF THE ENDING POST OBJECT AND STAKE OBJECTS TO VERIFY CORRECT MATH WAS APPLIED
    let postValidation = {
      initialized: true,
      creator: accounts[0],
      tipPool: 0, // after claiming all earnings , this should be empty
      stakeFeePool: 0,

      creatorEarningsAmount: ((staker1Amount * .10) + (staker2Amount * .10)) - (((staker1Amount * .10) + (staker2Amount * .10)) * .10), //sum all amountStakes and apply huddln fee
      totalStakedAmount: 0, //add total of stakes, then remove fee
      // createdAtBlock: new BigNumber(postObject.createdAtBlock), THESE VALUES NOT CHECKED FOR MATH
      // tippingBlockStart: new BigNumber(postObject.tippingBlockStart), THESE VALUES NOT CHECKED FOR MATH
      stakersCount: 2,
      stakesOpenCount: 0,

    };
    //Some math
    //
    staker1AmountWithFeeRemoved = (staker1Amount - (staker1Amount / 10)); // applying the fee thats paid to the creator.
    staker2AmountWithFeeRemoved = (staker2Amount - (staker2Amount / 10));

    let staker1Validation = {
      initialized: true,
      status: 2, //2 = closedByStaker
      amountStaked: staker1AmountWithFeeRemoved, // actual amount that gets staked has a fee removed and given to creator so actual is a bit less.
      amountAccrued: ((staker1AmountWithFeeRemoved / (staker2AmountWithFeeRemoved + staker1AmountWithFeeRemoved)) * (tipper1Amount + tipper2Amount) - (((staker1AmountWithFeeRemoved / (staker2AmountWithFeeRemoved + staker1AmountWithFeeRemoved)) * (tipper1Amount + tipper2Amount)) / fee))// (stakedamount/totalstakedamount)*(totalproceeds) must also apply huddln fee /10
      //blockopened,
      //blockClosed , these values dont matter.
    }
    let staker2Validation = {
      initialized: true,
      status: 2, //2 = closedByStaker
      amountStaked: staker2AmountWithFeeRemoved,
      amountAccrued: (staker2AmountWithFeeRemoved / (staker2AmountWithFeeRemoved + staker1AmountWithFeeRemoved)) * (tipper1Amount + tipper2Amount) // (stakedamount/totalstakedamount)*(totalproceeds)
      //blockClosed , these values dont matter.
    }


    //TODO : Check txs and add up all gas to do wallet balance comparisons before and after.
    console.log('\n\n')
    console.log('Post Validation Values', postValidation);
    console.log('\n\n')
    console.log('Staker1 Validation Values', staker1Validation);
    console.log('\n\n')
    console.log('Staker2 Validation Values', staker2Validation);
    console.log('\n\n')

    //percentage differences between expected and actual, must be below .5%, gas cost and other factors may make balance slightly off.

    let percentDiff_staker1_AmountAccrued = (100 * Math.abs((staker1Validation.amountAccrued - stakeObject_closed1.amountAccrued) / ((staker1Validation.amountAccrued + stakeObject_closed1.amountAccrued) / 2)));
    let percentDiff_staker2_AmountAccrued = (100 * Math.abs((staker2Validation.amountAccrued - stakeObject_closed2.amountAccrued) / ((staker2Validation.amountAccrued + stakeObject_closed2.amountAccrued) / 2)));
    //creator wallet balance difference should show his earnings
    //creator's wallet should now have balance + earnings, may not be exact so allow some tollerance with percentageDiff
    let creatorWalletBalanceEnd_validation = creatorWalletBalanceStart + postValidation.creatorEarningsAmount;
    let creatorWalletBalanceEnd_actual = await web3.eth.getBalance(accounts[0]);

    let percentDiff_creator_End_Earnings = (100 * Math.abs((creatorWalletBalanceEnd_validation - creatorWalletBalanceEnd_actual) / ((creatorWalletBalanceEnd_validation + creatorWalletBalanceEnd_actual) / 2)));

    //console.log('AMOUNT ACCRUED EARNED PERCENT DIF', percentDiff_creator_End_Earnings)

    //STAKER 1
    assert.equal(staker1Validation.initialized, stakeObject_closed1.initialized, 'initialized'); // INIT
    assert.equal(staker1Validation.status, stakeObject_closed1.status, 'status'); // creator
    assert.equal(staker1Validation.amountStaked, stakeObject_closed1.amountStaked, 'amountStaked'); // tipPool
    //Checks For staker 1
    assert.equal((percentDiff_staker1_AmountAccrued < .5), true, 'Accrued Difference'); // Accrued
    //STAKER 2
    assert.equal(staker2Validation.initialized, stakeObject_closed2.initialized, 'initialized'); // INIT
    assert.equal(staker2Validation.status, stakeObject_closed2.status, 'status'); // creator
    assert.equal(staker2Validation.amountStaked, stakeObject_closed2.amountStaked, 'amountStaked'); // tipPool
    //Checks For staker 2
    assert.equal((percentDiff_staker2_AmountAccrued < .5), true, 'Accrued Difference'); // Accrued


    assert.equal(postValidation.initialized, postObject_closed.initialized, 'initialized'); // INIT
    assert.equal(postValidation.creator, postObject_closed.creator, 'creator'); // creator
    assert.equal(postValidation.tipPool, postObject_closed.tipPool, 'tipPool'); // tipPool
    assert.equal(postValidation.stakeFeePool, postObject_closed.stakeFeePool, 'stakeFeePool'); // stakeFeePool
    assert.equal(postValidation.creatorEarningsAmount, postObject_closed.creatorEarningsAmount, 'creatorEarningsAmount'); // creatorEarningsAmount
    assert.equal(postValidation.totalStakedAmount, postObject_closed.totalStakedAmount, 'totalStakedAmount'); // totalStakedAmount
    assert.equal(postValidation.stakersCount, postObject_closed.stakersCount, 'stakersCount'); // stakersCount
    assert.equal(postValidation.stakesOpenCount, postObject_closed.stakesOpenCount, 'stakesOpenCount'); // stakesOpenCount
    assert.equal((percentDiff_creator_End_Earnings < .3), true, 'Creator Earnings Difference'); // Earnings Accrued actual amount vs calculated should not exceed more than .3%


  });

  /*
  Testing feature shutdown

  */


  it("Shutdown Test", async function () {
    console.log('~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ SCENARIO 3 ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~');
    // Using big ints for in place of js prim int. 0n ==0
    var stakingContract = await ContentStakingContract.deployed();
    var gatewayContract = await GatewayContract.deployed();
    let fee = 10;
    //console.log('accounts',await accounts)
    let creatorWalletBalanceStart = await web3.eth.getBalance(accounts[0]);
    let staker1WalletBalanceStart = await web3.eth.getBalance(accounts[1]);
    let staker2WalletBalanceStart = await web3.eth.getBalance(accounts[2]);
    let staker1Amount = 1000000000000000000;
    let staker2Amount = 500000000000000000;
    let tipper1Amount = 5000000000000000000;
    let tipper2Amount = 2000000000000000000; //tiiper2 will tip once in step 3, and then again in step 5


    let postId_1 = Web3.utils.fromAscii("test-5");
    let postId_2 = Web3.utils.fromAscii("test-6");
    let postId_3 = Web3.utils.fromAscii("test-7");
    let postId_4 = Web3.utils.fromAscii("test-8");
    let postId_5 = Web3.utils.fromAscii("test-9");
    let postId_6 = Web3.utils.fromAscii("test-10");
    let postId_7 = Web3.utils.fromAscii("test-11");
    let postId_8 = Web3.utils.fromAscii("test-12");




    // should be able to set the gateway contract the first time.
    await gatewayContract.setContentStaking(stakingContract.address);
    await stakingContract.setGatewayContract(gatewayContract.address);
    // Start the gateway Contract, default is paused
    await gatewayContract.startContract()
    //create posts
      // ~~~~~~~~~ 1. Create POST ~~~~~~~~~
      await gatewayContract.content_createPost(postId_1, 0);
      await gatewayContract.content_createPost(postId_2, 0);
      await gatewayContract.content_createPost(postId_3, 0);
      await gatewayContract.content_createPost(postId_4, 0);
      await gatewayContract.content_createPost(postId_5, 0);
      await gatewayContract.content_createPost(postId_6, 0);
      await gatewayContract.content_createPost(postId_7, 0);
      await gatewayContract.content_createPost(postId_8, 0);

    // set some stakers on all
      // -------- postID_1 ----------
      // stake half of the first staker, 2 ether
      await gatewayContract.content_placeStake(postId_1, {
        from: accounts[1],
        value: staker1Amount
      });
      // stake half of the first staker, 2 ether
      await gatewayContract.content_placeStake(postId_1, {
        from: accounts[2],
        value: staker2Amount
      });

      // -------- postID_2 ----------
      // stake half of the first staker, 2 ether
      await gatewayContract.content_placeStake(postId_2, {
        from: accounts[1],
        value: staker1Amount
      });
      // stake half of the first staker, 2 ether
      await gatewayContract.content_placeStake(postId_2, {
        from: accounts[2],
        value: staker2Amount
      });

      // -------- postID_3 ----------
      // stake half of the first staker, 2 ether
      await gatewayContract.content_placeStake(postId_3, {
        from: accounts[1],
        value: staker1Amount
      });
      // stake half of the first staker, 2 ether
      await gatewayContract.content_placeStake(postId_3, {
        from: accounts[2],
        value: staker2Amount
      });

// -------- postID_4 ----------
      // stake half of the first staker, 2 ether
      await gatewayContract.content_placeStake(postId_4, {
        from: accounts[1],
        value: staker1Amount
      });
      // stake half of the first staker, 2 ether
      await gatewayContract.content_placeStake(postId_4, {
        from: accounts[2],
        value: staker2Amount
      });

      // -------- postID_5 ----------
      // stake half of the first staker, 2 ether
      await gatewayContract.content_placeStake(postId_5, {
        from: accounts[1],
        value: staker1Amount
      });
      // stake half of the first staker, 2 ether
      await gatewayContract.content_placeStake(postId_5, {
        from: accounts[2],
        value: staker2Amount
      });

      // -------- postID_6 ----------
      // stake half of the first staker, 2 ether // DONT PUT ANY STAKERS on post6 so that payout logic is a big different, to catch bugs.
      /*
      await gatewayContract.content_placeStake(postId_6, {
        from: accounts[1],
        value: staker1Amount
      });
      // stake half of the first staker, 2 ether
      await gatewayContract.content_placeStake(postId_6, {
        from: accounts[2],
        value: staker2Amount
      });
      */


         // -------- postID_7 ----------
      // stake half of the first staker, 2 ether
      await gatewayContract.content_placeStake(postId_7, {
        from: accounts[1],
        value: staker1Amount
      });
      // stake half of the first staker, 2 ether
      await gatewayContract.content_placeStake(postId_7, {
        from: accounts[2],
        value: staker2Amount
      });

         // -------- postID_8 ----------
      // stake half of the first staker, 2 ether
      await gatewayContract.content_placeStake(postId_8, {
        from: accounts[1],
        value: staker1Amount
      });
      // stake half of the first staker, 2 ether
      await gatewayContract.content_placeStake(postId_8, {
        from: accounts[2],
        value: staker2Amount
      });

        /// TIPS
        await gatewayContract.content_tip(postId_1, {
          from: accounts[4],
          value: tipper1Amount
        });
        await gatewayContract.content_tip(postId_2, {
          from: accounts[4],
          value: tipper1Amount
        });
        await gatewayContract.content_tip(postId_3, {
          from: accounts[4],
          value: tipper1Amount
        });
        await gatewayContract.content_tip(postId_4, {
          from: accounts[4],
          value: tipper1Amount
        });
        await gatewayContract.content_tip(postId_5, {
          from: accounts[4],
          value: tipper1Amount
        });
        await gatewayContract.content_tip(postId_6, {
          from: accounts[4],
          value: tipper1Amount
        });
        /* dont give any tips on 7 so values are diffferent than others.
        await gatewayContract.content_tip(postId_7, {
          from: accounts[4],
          value: tipper1Amount
        }); 
        */
        // on post 8 give tipper2amount +tipper1amount/2 so values are diff from other posts
        await gatewayContract.content_tip(postId_8, {
          from: accounts[4],
          value: tipper1Amount
        });
        await gatewayContract.content_tip(postId_8, {
          from: accounts[4],
          value: tipper1Amount/2
        });
       
        //CLOSE DOWN

       // await gatewayContract.contentStaking_closeDownFeature();
        // CHECK EACH POST for values and make sure everyone is paid out.
  });

  //todo
  /* 
  1.test user can only stake once
  2. user cannot sell someone elses stake
  3. only creator can close post
  */
});