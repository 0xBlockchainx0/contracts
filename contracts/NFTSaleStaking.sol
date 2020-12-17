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
    /**
    Owner of NFT creates an entry, must be owner, must be a unqiue entry, if transferd to new person must sale first.
     */
    function createPost(bytes32 _nftAddress) public onlyGateway {
        require(_nftAddress.owner == msgSender(),"You Are not the Owner of this NFT");
        require(postItems[_nftAddress].initialized == false,"NFT already exists");
       

        postItems[_nftAddress] = PostItem({
            initialized: true, //Set so we can check from mapping if this has been used or not.
            creator: _creator,
            tipPool:0,
            stakeFeePool:0,
            creatorEarningsAmount:0,
            stakers: new address payable[](0),
            totalStakedAmount: 0,
            createdAtBlock: block.number,
            stakersCount: 0,
            stakesOpenCount:0
            
        });
        postItemIds.push(_nftAddress);
    }

    function getPostItemIds() public view returns (bytes32[] memory) {
        return postItemIds;
    }
  

    /**
        Placing a stake on an NFT, adds you to list of stakers, you stake is proportional to the payout you receive when it is sold.
        To decentevize cheating, you must pay the owner a small fee from the stake. Not recoverable.
     */
    function placeStake(bytes32 _nftAddress, uint256 amount, address payable _sender) public onlyGateway{
        require((amount/10000) * 10000 == amount, "Must send at least 10,000 base currency units");
       // do not let someone add stake thats already staked.
        require(postItems[_nftAddress].initialized == true,"Post ID does not exist");
        require((postItems[_nftAddress].stakes[_sender]).initialized == false ,"You are already staked");
        require(_sender != (postItems[_nftAddress].creator),"You cannot stake on your own post");

        //require(postItems[_nftAddress].stakersCount <= 500,"Max stakers reached (500)");amountAccrued * globalFee/100;
        uint256 fee = amount.mul(globalFee).div(10000); // find fee
        amount = amount.sub(fee); // remove fee from the amount staked.

        postItems[_nftAddress].stakeFeePool = postItems[_nftAddress].stakeFeePool.add(fee); //add fee for owners earnings 
        postItems[_nftAddress].stakesOpenCount =  postItems[_nftAddress].stakesOpenCount.add(1);// new count for watching amount of stakes open
        postItems[_nftAddress].totalStakedAmount = postItems[_nftAddress].totalStakedAmount.add(amount);
        postItems[_nftAddress].stakersCount = postItems[_nftAddress].stakersCount.add(1);
        
        postItems[_nftAddress].stakers.push(_sender);

        postItems[_nftAddress].stakes[_sender] = Stake({
            initialized: true,
            status: StakingStatus.Open,
            amountStaked: amount,
            amountAccrued: 0x0,
            blockOpened: block.number,
            blockClosed: 0x0
        });
        
        
    }
    // MUST PLACE FUNCTION HERE FOR INTENT TO PURCHASE IF YOU WNAT TO CHOOSE YOUR BUYER
    function intentToPurchase(){
        // buy puts funds into mapping, to hold to show intent to purchase.
        // act like escrow, if 
        // mapping of intents nft address 
        //struct(
//          arary of intents new intent(offer,intentExpiration)
     //   )
        // buyer set intent to buy item = true
        // //buy must choose someones intent to buy their art, when choosing a buy, all other intents in array are pushed into closed status.
    }
    //very rough psuedo code ,  this function allows owner to choose the buy based from their intent to buy, they can choose their buyer.
    //usually they will choose whoever offers more.

function sellNFT(bytes32 _nftAddress, intent offer,) public onlyGatewayOrThis {
    require(_nftAddress.owner == msgSender(),"You Are not the Owner of this NFT");
    require(postItems[_nftAddress].initialized == true,"Post ID does not exist");


   

   // for each -> postItems[_nftAddress].stakers.length
    //   payout each staker based on their share of the staking pool, each gets a different percentage cut of the intent.amount
    //
    //Clean out storage to ensure this post object is removed.
    //loop done
    /*
    uint stakerearningsRemoval = all amount we just sent to stakers.
    uint feeRemoal = remove fee on the earnings based on what the partner has set in the partner fee contract
    _nftAddress.owner.transfer(intent.amount -stakerearningsRemoval -feeRemoal);

    //transfer ownership
    _nftAddress.safeTransfer(intent.buyer); // transfer to new person

    */
    // 

}

  
    
    function getStakers(bytes32 _nftAddress) public view returns (address payable[] memory) {
        return postItems[_nftAddress].stakers;
    }
/**
    check who the gatewaycontract is, can't read directly from a get()
 */
    function getGatewayContract() public view returns (address payable ) {
        return gatewayContract;
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
      function getStake(bytes32 _nftAddress, address _address) public view returns(bool,uint, uint256, uint256, uint, uint) {
       return (postItems[_nftAddress].stakes[_address].initialized,uint(postItems[_nftAddress].stakes[_address].status),postItems[_nftAddress].stakes[_address].amountStaked,
       postItems[_nftAddress].stakes[_address].amountAccrued,
       postItems[_nftAddress].stakes[_address].blockOpened,
       postItems[_nftAddress].stakes[_address].blockClosed);
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