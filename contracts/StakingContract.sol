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

    constructor(address payable _contractAddress) public {
       // storageContractAddress = _contractAddress;
    }
     function test() public {
        isRunning = false;
    }
    function fff() public {
        isRunning = false;
    }
}