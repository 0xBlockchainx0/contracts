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
   
   // ****** Functions only callable by the deployer of this contract ******
    function setOwner(address payable _newOwner) public onlyOwner {
        owner = _newOwner;
    }
    function setGatewayContract (address payable _newGatewayContract) public onlyOwner{
        gatewayContract = _newGatewayContract;
    }


    // 0x10E0 == 4320 decimal, is about 20 seconds per block per 24 hour period
     // ~ 1 hour is 1800 blocks -> 0x708
     // ~ 6 hours 10800 -> 0x2a30
     // ~24 hours 43200 -> 0xA8C0
    function addPost(bytes32 _postId, address payable _creator, uint256 _postLength) public onlyGateway {
        for (uint256 index = 0; index < postItemIds.length; index++) {
            if (postItemIds[index] == _postId) {
                revert("Post ID already exists");
            }
        }
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
            creator: _creator,
            creatorTipPool:0,
            stakerTipPool:0,
            ownerAmountAccrued:0,
            stakers: tempAddressArray,
            totalStakedAmount: 0,
            status:Status.Open,
            createdAtBlock: block.number,
            tippingBlockStart: block.number + intPostLength,
            stakersCount: 0
        });
        postItemIds.push(_postId);
    }


}