pragma solidity 0.6.2;

import './abstractions/Pausable.sol';
import './abstractions/Ownable.sol';
import './abstractions/Featureable.sol';
import "./lib/BasicMetaTransaction.sol";
import "./lib/SafeMath.sol";
contract ContentStaking is Ownable,Featureable {
    using SafeMath for uint256; //must use the uint256 of safemath instead of regular sol.
    
    uint256 globalFee = 1000;//1000 bps basis points = 10% //used as service fee and for creator fee when somsone stakes, they must pay a staking fee to creator, then when selling stake they must pay a earnings fee to service.
    enum StakingStatus { Nonexistant, Open, Closed }
    enum PostLength { Short, Medium, Long }
    event Received(
        address indexed _actor,
        uint256  _value
    );
    event Gateway(
        address indexed _actor,
        string  _action,
        address indexed _contractAddress
    );

    struct Stake {
        bool initialized;
        StakingStatus status;
        uint256 amountStaked;
        uint256 amountAccrued;
        uint256 blockOpened;
        uint256 blockClosed;
    }

    struct PostItem {
        bool initialized;
        address payable creator;

        
        // Pools
        uint256 tipPool; // all tips go to this pool

        uint256 stakeFeePool; // Stakers must pay 10% of stake directly to the owner's fee pool, the rest goes toward stake.

        uint256 creatorEarningsAmount; // keeps track of how much owner has pulled out (historical)

        address payable[] stakers;
        mapping (address => Stake) stakes;
        uint256 totalStakedAmount;
        uint256 createdAtBlock;
        uint256 tippingBlockStart;
        //track amount of stakers without having to pull down array
        uint256 stakersCount;
        uint256 stakesOpenCount; // track all open amount so we don't need to search through mapping (expensive)
    }

    mapping(bytes32 => PostItem) public postItems;
    bytes32[] public postItemIds;
   
   // ****** Functions only callable by the deployer of this contract ******
   // function setOwner(address payable _newOwner) public onlyOwner {
   //     owner = _newOwner;
   // }
    function setGatewayContract (address payable _newGatewayContract) public onlyOwner{
        gatewayContract = _newGatewayContract;
        emit Gateway(msgSender(),"Updated", gatewayContract);

    }
     // ~ 1 hour is 1800 blocks -> 0x708
     // ~ 6 hours 10800 -> 0x2a30
     // ~24 hours 43200 -> 0xA8C0
    function createPost(bytes32 _postId, address payable _creator, uint256 _postLength) public onlyGateway {
        require(postItems[_postId].initialized == false,"Post ID already exists");
       
       // address payable[] memory tempAddressArray = new address payable[](0);
        uint256 intPostLength;
        if (_postLength == uint(PostLength.Short)) {
            intPostLength = 0x708;
        } else if (_postLength == uint(PostLength.Medium)) {
            intPostLength = 0x2a30;
        } else {
            intPostLength = 0xA8C0;
        }

        postItems[_postId] = PostItem({
            initialized: true, //Set so we can check from mapping if this has been used or not.
            creator: _creator,
            tipPool:0,
            stakeFeePool:0,
            creatorEarningsAmount:0,
            stakers: new address payable[](0),
          
            totalStakedAmount: 0,
            
            createdAtBlock: block.number,
            tippingBlockStart: block.number + intPostLength,

            stakersCount: 0,
            stakesOpenCount:0
            
        });
        postItemIds.push(_postId);
    }

    function getPostItemIds() public view returns (bytes32[] memory) {
        return postItemIds;
    }
  

    function addStakerTip(bytes32 _postId, uint256 amount) public onlyGateway {
        require((amount/10000) * 10000 == amount, "Must send at least 10,000 base currency units");
        require(postItems[_postId].initialized == true,"Post ID does not exist");
        require(postItems[_postId].tippingBlockStart <= block.number,"Post is not open for tipping"); // REMOVED FOR testing purposes

        postItems[_postId].tipPool = postItems[_postId].tipPool.add(amount);
    }
    function placeStake(bytes32 _postId, uint256 amount, address payable _sender) public onlyGateway{
        require((amount/10000) * 10000 == amount, "Must send at least 10,000 base currency units");
       // do not let someone add stake thats already staked.
        require(postItems[_postId].initialized == true,"Post ID does not exist");
        require(postItems[_postId].tippingBlockStart > block.number,"Post is not open for staking"); // REMOVED FOR testing purposes
        require((postItems[_postId].stakes[_sender]).initialized == false ,"You are already staked");
        require(_sender != (postItems[_postId].creator),"You cannot stake on your own post");

        //require(postItems[_postId].stakersCount <= 500,"Max stakers reached (500)");amountAccrued * globalFee/100;
        uint256 fee = amount.mul(globalFee).div(10000); // find fee
        amount = amount.sub(fee); // remove fee from the amount staked.

        postItems[_postId].stakeFeePool = postItems[_postId].stakeFeePool.add(fee); //add fee for owners earnings 
        postItems[_postId].stakesOpenCount =  postItems[_postId].stakesOpenCount.add(1);// new count for watching amount of stakes open
        postItems[_postId].totalStakedAmount = postItems[_postId].totalStakedAmount.add(amount);
        postItems[_postId].stakersCount = postItems[_postId].stakersCount.add(1);
        
        postItems[_postId].stakers.push(_sender);

        postItems[_postId].stakes[_sender] = Stake({
            initialized: true,
            status: StakingStatus.Open,
            amountStaked: amount,
            amountAccrued: 0x0,
            blockOpened: block.number,
            blockClosed: 0x0
        });
        
        
    }
    //safemath converted 
    function closeStake(bytes32 _postId, address payable _msgSender) public onlyGatewayOrThis {
        require(postItems[_postId].tippingBlockStart < block.number,"Post is still in staking period, wait until tipping period has started."); //remove for testing 
        require(postItems[_postId].initialized == true,"Post ID does not exist");
        require((postItems[_postId].stakes[_msgSender]).initialized == true ,"You are not staked on this post");
        require(postItems[_postId].stakes[_msgSender].status == StakingStatus.Open,"Stake is already closed");
        
    
        uint256 originalStake = postItems[_postId].stakes[_msgSender].amountStaked;
        uint256 amountAccrued = postItems[_postId].tipPool.mul(originalStake).div(postItems[_postId].totalStakedAmount);
            //pay fee
        uint256 fee = amountAccrued.mul(globalFee).div(10000);
        postItems[_postId].stakes[_msgSender].status = StakingStatus.Closed;
        postItems[_postId].stakesOpenCount =  postItems[_postId].stakesOpenCount.sub(1);// new count for watching amount of stakes open
        postItems[_postId].stakes[_msgSender].blockClosed = block.number;
        postItems[_postId].stakes[_msgSender].amountAccrued = amountAccrued.sub(fee);
        postItems[_postId].totalStakedAmount = postItems[_postId].totalStakedAmount.sub(originalStake);
        postItems[_postId].tipPool = postItems[_postId].tipPool.sub(amountAccrued);
        // pay out fee to owner contract
        _owner.transfer(fee);
        // when sending back to sender, remove the fee we just sent to the owner
        _msgSender.transfer(originalStake.add(amountAccrued.sub(fee)));
  
    }
    
    function getStakers(bytes32 _postId) public view returns (address payable[] memory) {
        return postItems[_postId].stakers;
    }
/**
    check who the gatewaycontract is, can't read directly from a get()
 */
    function getGatewayContract() public view returns (address payable ) {
        return gatewayContract;
    }
    
    /**
         Callable by gateway only, used to pay out the owner with the stakeFeePool money, can only be called after staking round is done.
         Owner can call this as many times as they want, if they call this & all stakers have closed their stakes their is a possibility that the tipPool may have some money accrued in it,
         If this is the case that money must also be pushed to the owner and must not be allowed to sit.
     */
    function claimPostEarnings(bytes32 _postId, address payable _msgSender) public onlyGatewayOrThis payable {
        require(postItems[_postId].tippingBlockStart > block.number,"Post is still in staking period, wait until tipping period has started."); //removed for demo purposes, put bac in after
        // check that person is either creator or that is came from the owner. which came from the functioncontract (gateway)
        require((_msgSender == postItems[_postId].creator || _msgSender == _owner),"You are not the owner of this content");

      
        //check if there are any stakes open, it will be 0 if there are no stakers or if all the stakers have closed their stakes
        if ( postItems[_postId].stakesOpenCount == 0 ){
             uint256 tipsFee = postItems[_postId].tipPool.mul(globalFee).div(10000); //Fee to subtract goes to owner
             uint256 stakePoolFeesFee =  postItems[_postId].stakeFeePool.mul(globalFee).div(10000); //fee to subtract goes to owner, should rename this .. terrible name

             uint256 earningsAmountTips = postItems[_postId].tipPool.sub(tipsFee); //just earnings for this round
             uint256 earningsAmountStakeFees = postItems[_postId].stakeFeePool.sub(stakePoolFeesFee);
             // set the amount earned, for historical purposes, both pools minus the fee.
              postItems[_postId].creatorEarningsAmount = postItems[_postId].creatorEarningsAmount.add(earningsAmountTips.add(earningsAmountStakeFees));
             // fees first , from combination of both pools
             _owner.transfer(tipsFee.add(stakePoolFeesFee));

             // transfer to the owner of post
             postItems[_postId].creator.transfer(earningsAmountTips.add(earningsAmountStakeFees));
                // clear out stakefeepool, by subtracting everything we just paid out, should equate to 0
             postItems[_postId].stakeFeePool = postItems[_postId].stakeFeePool.sub(earningsAmountStakeFees.add(stakePoolFeesFee)); //update values should equate to 0
             postItems[_postId].tipPool = postItems[_postId].tipPool.sub(earningsAmountTips.add(tipsFee)); // ==0

        } else {
            // this case, handles if there are 1 or more stakers, then the creator only takes from the stakefeepool.
             uint256 fee = postItems[_postId].stakeFeePool.mul(globalFee).div(10000);
             uint256 earningsAmount = postItems[_postId].stakeFeePool.sub(fee); //just earnings for this round

             postItems[_postId].creatorEarningsAmount = postItems[_postId].creatorEarningsAmount.add(earningsAmount);//must sum up earnings from prev round
             _owner.transfer(fee);
             postItems[_postId].creator.transfer(earningsAmount);// transfer this calls earningsamount only.
             // clear out stakefeepool, by subtracting everything we just paid out, should equate to 0
             postItems[_postId].stakeFeePool = postItems[_postId].stakeFeePool.sub(fee.add(earningsAmount));
        }     

    }
    
    /*
    function getStakeStakingStatus(address _address) public view returns (StakeStakingStatus) {
        return postStakes[_address].status;
    }
    */
    /*
        returns the stake object vlaues in a tuple, from a specific post and specific person
        cannot return a enum so must convert to plain uint256 before returning
    */
      function getStake(bytes32 _postId, address _address) public view returns(bool,uint, uint256, uint256, uint, uint) {
       return (postItems[_postId].stakes[_address].initialized,uint(postItems[_postId].stakes[_address].status),postItems[_postId].stakes[_address].amountStaked,
       postItems[_postId].stakes[_address].amountAccrued,
       postItems[_postId].stakes[_address].blockOpened,
       postItems[_postId].stakes[_address].blockClosed);
      }

    // forces payouts of all posts and stakers, used when contract is going to be shutdown. used to safely migrate to a new version (temporary safe solution)
   /**
    only callable by gateway , only called before a big upgrade to shutdown
    */
    function closeDownFeature() public onlyGateway payable {
        uint256 mapLength = postItemIds.length; //get all posts that have been made, get the length

        for (uint256 i=0; i<mapLength; i++) { //LOOP THROUGH EACH POST
            PostItem storage currItem = postItems[postItemIds[i]]; //gets current post item object
            for (uint256 j=0; j < currItem.stakersCount; j++){ //LOOP THROUGH STAKERS and find open stakes and close them out
                address payable currStakerAddress = currItem.stakers[j];
                if(currItem.stakes[currStakerAddress].status == StakingStatus.Open){ // pull up the stake of the current staker and check to see if its open. if so close it down
                    closeStake(postItemIds[i], currStakerAddress ); //closestake of staker at the current postItem
                }
            }// after closing down stakers, close down creator and payout earnings
            claimPostEarnings(postItemIds[i],currItem.creator);//later do check if its even worth it, if tipool =0 and stakefeepool=0 this wont do much.
        }

    }
    

    fallback () external payable {// use in future for upgradeyness
        // TODO: Call the call function in the main contract
        // and forward all funds (msg.value) sent to this contract
        // and passing in the following data: msg.sender
    
    }
    receive() external payable {
        emit Received(msgSender(),msg.value);
    }
    /**
    Only used by owner in case owner needs to remove funds from contract.
    
     */
    function withdraw(uint256 amount) public onlyOwner returns(bool) {
        require(amount <= address(this).balance);
        _owner.transfer(amount);
        return true;

    }
}