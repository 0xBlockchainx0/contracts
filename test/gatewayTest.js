
var GatewayContract = artifacts.require("Gateway");
var ContentStakingContract = artifacts.require("ContentStaking");


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
    //owner balance
    // console.log('in contract',await gatewayContract.contentStakingAddress())
    //console.log('stakingContract.address',stakingContract.address)
    //let val = await gatewayContract.contentStakingAddress();\
  console.log('test')
    console.log('show gateawycontract',await stakingContract.gatewayContract())
    assert.equal(await gatewayContract.contentStakingAddress(), stakingContract.address, 'Verifies the correct address was updated')
   // assert.equal(await stakingContract.gatewayContract(), gatewayContract.address, 'Verifies the correct address was updated')
  });


  //********* * Step. 1 * *********
  it("Content Create Post", async function () {
    var stakingContract = await ContentStakingContract.deployed();
    var gatewayContract = await GatewayContract.deployed();

    // should be able to set the gateway contract the first time.
    //0x9F86D081884C7D659A2FEAA0C55AD015A3BF4F1B2B0B822CD15D6C15B0F00A08 === test
    console.log(await gatewayContract.content_CreatePost(postId, 0));

  });
  //********* * Step. 2 * *********
  it("Add 1 Staker to Post", async function () {
    var stakingContract = await ContentStakingContract.deployed();
    var gatewayContract = await GatewayContract.deployed();

    // should be able to set the gateway contract the first time.
    //0x9F86D081884C7D659A2FEAA0C55AD015A3BF4F1B2B0B822CD15D6C15B0F00A08 === test
    console.log(await gatewayContract.placeStake(postId,
      {
        from: accounts[1],
        value: 1000000000000000000
      }
    ));
    console.log('staker1 staked -> ' + web3.utils.fromWei('1000000000000000000', 'ether'));

  });

  it("Add 2 Staker to Post", async function () {
    var stakingContract = await ContentStakingContract.deployed();
    var gatewayContract = await GatewayContract.deployed();

    // should be able to set the gateway contract the first time.
    //0x9F86D081884C7D659A2FEAA0C55AD015A3BF4F1B2B0B822CD15D6C15B0F00A08 === test
    /*
    await tryCatch(gatewayContract.placeStake('0x9F86D081884C7D659A2FEAA0C55AD015A3BF4F1B2B0B822CD15D6C15B0F00A08',
   {
      from: accounts[2],
      value: 1000000000000000000
    }), errTypes.revert);
    
    */
    console.log(await gatewayContract.placeStake(postId,
      {
        from: accounts[2],
        value: 1000000000000000000
      }
    ));
    console.log('staker2 staked -> ' + web3.utils.fromWei('1000000000000000000', 'ether'));
  });


  it("Add 3 Staker to Post", async function () {
    var stakingContract = await ContentStakingContract.deployed();
    var gatewayContract = await GatewayContract.deployed();


    console.log(await gatewayContract.placeStake(postId,
      {
        from: accounts[3],
        value: 1000000000000000000
      }
    ));
    console.log('staker3 staked -> ' + web3.utils.fromWei('1000000000000000000', 'ether'));

  });
  //********* * Step. 3 * ********* 
  //Verify correctness of past operations

  it("Verify Staking worked", async function () {
    var stakingContract = await ContentStakingContract.deployed();
    var gatewayContract = await GatewayContract.deployed();


    console.log(await stakingContract.postItems.call(postId));
    // Do math checks here
    /// get list of stakers , loop and pull each stake out using getStake(), look at struct and verify math is correct
    // check statuses of stakes.
  });

  //********* * Step. 4 * ********* 
  //Tips come in

  it("Tippers tip on post", async function () {
    var stakingContract = await ContentStakingContract.deployed();
    var gatewayContract = await GatewayContract.deployed();


    console.log(await gatewayContract.tip(postId,
      {
        from: accounts[4],
        value: 10000000000000000
      }
    ));
    console.log('Tipper 2 tips -> ' + web3.utils.fromWei('10000000000000000', 'ether'));
    console.log(await gatewayContract.tip(postId,
      {
        from: accounts[5],
        value: 500000000000000000
      }
    ));
    console.log('Tipper 2 tips -> ' + web3.utils.fromWei('500000000000000000', 'ether'));


    console.log(await gatewayContract.tip(postId,
      {
        from: accounts[6],
        value: 80000000000000000
      }
    ));
    console.log('Tipper 3 tips -> ' + web3.utils.fromWei('80000000000000000', 'ether'));

  });

  //********* * Step. 5 * ********* 
  // Owner removes earnings
  it("Owner removes earnings", async function () {
    var stakingContract = await ContentStakingContract.deployed();
    var gatewayContract = await GatewayContract.deployed();

    // should be able to set the gateway contract the first time.
    //0x9F86D081884C7D659A2FEAA0C55AD015A3BF4F1B2B0B822CD15D6C15B0F00A08 === test
    console.log(await gatewayContract.payoutPostEarnings(postId));


    let balance = await web3.eth.getBalance(accounts[0])
    console.log("balance after pulling earnings  " + web3.utils.fromWei(balance, 'ether'))
    let postID = await stakingContract.postItems.call(postId); //bn
    console.log('Check manually the earnings from ownerAccrued', postID)


  });

  //********* * Step. 6 * ********* 
  // Stakers remove earnings
  it("Stakers removes earnings", async function () {
    var stakingContract = await ContentStakingContract.deployed();
    var gatewayContract = await GatewayContract.deployed();

    // should be able to set the gateway contract the first time.
    //0x9F86D081884C7D659A2FEAA0C55AD015A3BF4F1B2B0B822CD15D6C15B0F00A08 === test
    console.log(await gatewayContract.closeStake(postId,
      {
        from: accounts[1]

      }
    ));
    let balance1 = await web3.eth.getBalance(accounts[1])
    console.log("staker 1 balance after pulling earnings  " + web3.utils.fromWei(balance1, 'ether'))
    console.log(await gatewayContract.closeStake(postId,
      {
        from: accounts[2]

      }
    ));
    let balance2 = await web3.eth.getBalance(accounts[2])
    console.log("staker 2 balance after pulling earnings  " + web3.utils.fromWei(balance2, 'ether'))
    console.log(await gatewayContract.closeStake(postId,
      {
        from: accounts[3]

      }
    ));
    let balance3 = await web3.eth.getBalance(accounts[3])
    console.log("staker 3 balance after pulling earnings  " + web3.utils.fromWei(balance3, 'ether'))






  });





});