pragma solidity 0.6.2;

import './abstractions/Pausable.sol';
import './abstractions/Owned.sol';
import "./lib/BasicMetaTransaction.sol";

contract StakingContract is Owned {
    enum Status { Nonexistant, Open, ClosedByStaker, ClosedByPostOwner, ClosedByHuddln }
    enum PostLength { Short, Medium, Long }


    event Post(
        address indexed _actor,
        string indexed _action,
        bytes32 indexed _postId,
        uint256 _value
    );
    struct Stake {
        Status status;
        uint256 amountStaked;
        uint256 amountAccrued;
        uint blockOpened;
        uint blockClosed;
    }

    struct PostItem {
        address payable creator;
        uint256 creatorTipPool;
        uint256 stakerTipPool;
        uint256 ownerAmountAccrued;

        address payable[] stakers;
        mapping (address => Stake) stakes;
        uint256 totalStakedAmount;
        Status status;
        uint createdAtBlock;
        uint tippingBlockStart;
        //track amount of stakers without having to pull down array
        uint stakersCount;
    }

    mapping(bytes32 => PostItem) public postItems;
    bytes32[] public postItemIds;
   
    function setOwner(address payable _newOwner) public onlyOwner {
        owner = _newOwner
    }
    function setGatewayContract (address payable _newGatewayContract) public onlyOwner{
        gatewayContract = _newGatewayContract;
    }
    // 0x10E0 == 4320 decimal, is about 20 seconds per block per 24 hour period
    function addPost(bytes32 _postId, address payable _creator, uint256 _postLength) public onlyGateway {
       
    }

    function getPostItemIds() public view returns (bytes32[] memory) {
        return postItemIds;
    }
 //Function should be privatly called internally ONLY
    function closePost(bytes32 _postId, address _sender) private {
    
    }

    function addCreatorTip(bytes32 _postId, uint amount) public onlyGateway {
       
    }
    function addStakerTip(bytes32 _postId, uint amount) public onlyGateway {
      
    }
    function addStake(bytes32 _postId, uint amount, address payable _sender) public  onlyGateway{
     
        
    }
   
    function closeStake(bytes32 _postId, address payable _msgSender) public onlyGatewayOrThis {
       
  
    }
    function getStakers(bytes32 _postId) public view returns (address payable[] memory) {
        return postItems[_postId].stakers;
    }
    function payout(bytes32 _postId, address payable _msgSender) public onlyGateway payable {
      

    }
    /*function getStakeStatus(address _address) public view returns (StakeStatus) {
        return postStakes[_address].status;
    }*/
    /*
        returns the stake object vlaues in a tuple, from a specific post and specific person
        cannot return a enum so must convert to plain uint before returning
    */
      function getStake(bytes32 _postId, address _address) public view returns(uint, uint256, uint256, uint, uint) {
   
      }
/*
      function () external payable {
        // TODO: Call the call function in the main contract
        // and forward all funds (msg.value) sent to this contract
        // and passing in the following data: msg.sender
    }
    */
}

}