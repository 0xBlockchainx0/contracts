pragma solidity 0.6.2;

import './abstractions/Pausable.sol';
import './abstractions/Ownable.sol';
import './abstractions/Featureable.sol';
import "./lib/BasicMetaTransaction.sol";

contract ContentStaking is Ownable,Featureable {
    
    enum StakingStatus { Nonexistant, Open, ClosedByStaker, ClosedByHuddln }
    enum PayoutStatus { unpaid, paid }
    enum PostLength { Short, Medium, Long }


    struct Stake {
        bool initialized;
        StakingStatus status;
        uint256 amountStaked;
        uint256 amountAccrued;
        uint blockOpened;
        uint blockClosed;
    }

    struct PostItem {
        bool initialized;
        address payable creator;

        PayoutStatus creatorPayoutStatus;
        // Pools
        uint256 tipPool; // all tips go to this pool

        uint256 stakeFeePool; // Stakers must pay 10% of stake directly to the owner's fee pool, the rest goes toward stake.

        uint256 creatorEarningsAmount; // keeps track of how much owner has pulled out (historical)

        address payable[] stakers;
        mapping (address => Stake) stakes;
        uint256 totalStakedAmount;
        uint createdAtBlock;
        uint tippingBlockStart;
        //track amount of stakers without having to pull down array
        uint stakersCount;
        uint stakesOpenCount; // track all open amount so we don't need to search through mapping (expensive)
    }

    mapping(bytes32 => PostItem) public postItems;
    bytes32[] public postItemIds;
   
   // ****** Functions only callable by the deployer of this contract ******
   // function setOwner(address payable _newOwner) public onlyOwner {
   //     owner = _newOwner;
   // }
    function setGatewayContract (address payable _newGatewayContract) public onlyOwner{
        gatewayContract = _newGatewayContract;
    }
     // ~ 1 hour is 1800 blocks -> 0x708
     // ~ 6 hours 10800 -> 0x2a30
     // ~24 hours 43200 -> 0xA8C0
    function addPost(bytes32 _postId, address payable _creator, uint256 _postLength) public onlyGateway {
        require(postItems[_postId].initialized == false,"Post ID already exists");
       
        address payable[] memory tempAddressArray = new address payable[](0);
        uint intPostLength;
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
            stakers: tempAddressArray,
          
            totalStakedAmount: 0,
            creatorPayoutStatus: PayoutStatus.unpaid,
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
  

    function addStakerTip(bytes32 _postId, uint amount) public onlyGateway {
       // require(postItems[_postId].status == StakingStatus.Open,"Post is not open for tipping");
        //require(postItems[_postId].tippingBlockStart <= block.number,"Post is not open for tipping"); // REMOVED FOR PRESENTATION PURPOSES, PUT BACK IN AFTER

        postItems[_postId].tipPool = postItems[_postId].tipPool + amount;
    }
    function addStake(bytes32 _postId, uint amount, address payable _sender) public onlyGateway{
       // require(postItems[_postId].status == StakingStatus.Open,"Post is not open for staking");
       // do not let someone add stake thats already staked.
        require(postItems[_postId].initialized == true,"Post ID does not exist");
        require(postItems[_postId].tippingBlockStart > block.number,"Post is not open for staking");
        require((postItems[_postId].stakes[_sender]).initialized == false ,"You are already staked!!!");
        require(_sender != (postItems[_postId].creator),"You cannot stake on your own post");

        //require(postItems[_postId].stakersCount <= 500,"Max stakers reached (500)");amountAccrued * 10/100;
        uint fee = amount * 10/100; // find fee
        amount = amount - fee; // remove fee from the amount staked.

        postItems[_postId].stakeFeePool = postItems[_postId].stakeFeePool + fee; //add fee for owners earnings 
        postItems[_postId].stakesOpenCount =  postItems[_postId].stakesOpenCount+1;// new count for watching amount of stakes open
        postItems[_postId].totalStakedAmount = postItems[_postId].totalStakedAmount + amount;
        postItems[_postId].stakersCount = postItems[_postId].stakersCount+1;
        
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
  
    function closeStake(bytes32 _postId, address payable _msgSender) public onlyGatewayOrThis {
        //require(postItems[_postId].tippingBlockStart > block.number,"Post is still in staking period, wait until tipping period has started."); //removed for demo purposes, put bac in after

        require(postItems[_postId].stakes[_msgSender].status == StakingStatus.Open,"Stake is already closed");
        
    
        uint256 originalStake = postItems[_postId].stakes[_msgSender].amountStaked;
        uint256 amountAccrued = postItems[_postId].tipPool * originalStake / postItems[_postId].totalStakedAmount;
            //pay fee
        uint fee = amountAccrued * 10/100;
        postItems[_postId].stakes[_msgSender].status = StakingStatus.ClosedByStaker;
        postItems[_postId].stakesOpenCount =  postItems[_postId].stakesOpenCount-1;// new count for watching amount of stakes open
        postItems[_postId].stakes[_msgSender].blockClosed = block.number;
        postItems[_postId].stakes[_msgSender].amountAccrued = amountAccrued - fee;
        postItems[_postId].totalStakedAmount = postItems[_postId].totalStakedAmount - originalStake;
        postItems[_postId].tipPool = postItems[_postId].tipPool - amountAccrued;
        // pay out fee to owner contract
        _owner.transfer(fee);
        // when sending back to sender, remove the fee we just sent to the owner
        _msgSender.transfer(originalStake + (amountAccrued - fee));
  
    }
    function getStakers(bytes32 _postId) public view returns (address payable[] memory) {
        return postItems[_postId].stakers;
    }
    /**
         Callable by gateway only, used to pay out the owner with the stakeFeePool money, can only be called after staking round is done.
         Owner can call this as many times as they want, if they call this & all stakers have closed their stakes their is a possibility that the tipPool may have some money accrued in it,
         If this is the case that money must also be pushed to the owner and must not be allowed to sit.
     */
    function claimPostEarnings(bytes32 _postId, address payable _msgSender) public onlyGateway payable {
         //require(postItems[_postId].tippingBlockStart > block.number,"Post is still in staking period, wait until tipping period has started."); //removed for demo purposes, put bac in after
        // check that person is either creator or that is came from the owner. which came from the functioncontract (gateway)
           require((_msgSender == postItems[_postId].creator || _msgSender == _owner),"You are not the owner of this content");

        // require it to be POST owner of the _postId or Huddln
        //check if there are any stakes open, it will be 0 if there are no stakers or if all the stakers have closed their stakes
        if ( postItems[_postId].stakesOpenCount == 0 ){
             uint fullFee = ( postItems[_postId].tipPool + postItems[_postId].stakeFeePool ) * 10/100;
             // set the amount earned, for historical purposes, both pools minus the fee.
              postItems[_postId].creatorEarningsAmount = postItems[_postId].creatorEarningsAmount + ((postItems[_postId].stakeFeePool + postItems[_postId].tipPool) - fullFee);
             // fees first , from combination of both pools
             _owner.transfer(fullFee);

             // transfer to the owner of post
             postItems[_postId].creator.transfer(( postItems[_postId].stakeFeePool + postItems[_postId].tipPool ) - fullFee);
        } else {
            // this case, handles if there are 1 or more stakers
             uint fee = postItems[_postId].stakeFeePool * 10/100;
             postItems[_postId].creatorEarningsAmount = postItems[_postId].creatorEarningsAmount + (postItems[_postId].stakeFeePool-fee);
             _owner.transfer(fee);
             postItems[_postId].creator.transfer(postItems[_postId].stakeFeePool-fee);
        }     

    }
    
    /*
    function getStakeStakingStatus(address _address) public view returns (StakeStakingStatus) {
        return postStakes[_address].status;
    }
    */
    /*
        returns the stake object vlaues in a tuple, from a specific post and specific person
        cannot return a enum so must convert to plain uint before returning
    */
      function getStake(bytes32 _postId, address _address) public view returns(uint, uint256, uint256, uint, uint) {
       return (uint(postItems[_postId].stakes[_address].status),postItems[_postId].stakes[_address].amountStaked,
       postItems[_postId].stakes[_address].amountAccrued,
       postItems[_postId].stakes[_address].blockOpened,
       postItems[_postId].stakes[_address].blockClosed);
      }

    // forces payouts of all posts and stakers, used when contract is going to be shutdown.
   /*
    function closeDownFeature() public onlyGateway payable {
        uint mapLength = postItemIds.length;

        for (uint i=0; i<mapLength; i++) {
            totalValue += mappedUsers[addressIndices[i]];
        }

    }
    */

    fallback () external payable {
        // TODO: Call the call function in the main contract
        // and forward all funds (msg.value) sent to this contract
        // and passing in the following data: msg.sender
      }
  
    receive() external payable {
            // React to receiving ether
        }

}