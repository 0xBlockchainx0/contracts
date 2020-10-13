pragma solidity 0.6.2;

// ****** Abstracts ******
import './abstractions/Pausable.sol';
import './abstractions/Owned.sol';
// ****** Meta-Gas
import "./lib/BasicMetaTransaction.sol";
// ****** Feature Contracts
import "./StakingContract.sol";

contract Gateway is Owned, Pausable,BasicMetaTransaction {
    address payable public stakingContractAddress;
    uint256 public fee = 10;
    // Event types
    event Post(
        address indexed _actor,
        string indexed _action,
        bytes32 indexed _postId,
        uint256 _value
    );

    constructor(address payable _contractAddress) public {
        stakingContractAddress = _contractAddress;
    }


    /// ****** Staking Features *******
    function setStakingContract(address payable _contractAddress) public onlyOwner {
        stakingContractAddress = _contractAddress;
    }

    function updateFee(uint256 _newFee) public onlyOwner {
        fee = _newFee;
    }
     // ONLY OWNER CALLABLE
    function closePostOwned(bytes32 _postId) public onlyOwner {

        StakingContract sc = StakingContract(stakingContractAddress);
        // msgSender() is owner of contract which is checked in storage contract.
        sc.payout(_postId, payable(msgSender()));
    }
      // ONLY OWNER CALLABLE
    function closeStakeOwned(bytes32 contentId) public onlyOwner {

        StakingContract sc = StakingContract(stakingContractAddress);
        // msgSender() is owner of contract which is checked in storage contract.
        sc.closeStake(contentId, payable(msgSender()));
    }

    function createPost(bytes32 _postId, uint256 _postLength) public payable onlyWhenRunning {
        StakingContract sc = StakingContract(stakingContractAddress);
        sc.addPost(
            _postId,
           payable(msgSender()),
            uint256(_postLength)
        );

        emit Post(msgSender(), "Create", _postId, 0);
    }

    function closePost(bytes32 _postId) public {
        StakingContract sc = StakingContract(stakingContractAddress);
        // send message sender to verify they are the owner
        sc.payout(_postId, payable(msgSender()));

        emit Post(msgSender(), "Closed", _postId, 0);
    }

    function closeStake(bytes32 contentId) public {
        StakingContract sc = StakingContract(stakingContractAddress);

        sc.closeStake(contentId,  payable(msgSender()));

        emit Post(msgSender(), "Close", contentId, 0);
    }

    function tip(bytes32 _postId) public payable {
        require(msg.value > 0, "Tip amount must be more than 0"); // Cut down on potential spam
        // require: owners cannot tip into their own post

        StakingContract sc = StakingContract(stakingContractAddress);
        sc.addCreatorTip(_postId, msg.value / 2);
        sc.addStakerTip(_postId, msg.value / 2);
        stakingContractAddress.transfer(msg.value);

        emit Post(msgSender(), "Tip", _postId, msg.value);
    }

    function placeStake(bytes32 _postId) public payable {
        // require: owners cannot stake on their own post
        require(msg.value > 0, "Stake amount must be more than 0"); // Cut down on potential spam

        StakingContract sc = StakingContract(stakingContractAddress);
        sc.addStake(_postId, msg.value, payable(msgSender()));
        stakingContractAddress.transfer(msg.value);

        emit Post(msgSender(), "Stake", _postId, msg.value);
    }

    function getStakes(bytes32 _postId)
        public
        view
        returns (address payable[] memory)
    {
        StakingContract sc = StakingContract(stakingContractAddress);
        address payable[] memory stakes = sc.getStakers(_postId);

        return stakes;
    }
}