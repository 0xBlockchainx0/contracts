pragma solidity 0.6.2;

// ****** Abstracts ******
import './abstractions/Pausable.sol';
import './abstractions/Ownable.sol';
// ****** Meta-Gas
import "./lib/BasicMetaTransaction.sol";
// ****** Feature Contracts
import "./ContentStaking.sol";

contract Gateway is BasicMetaTransaction,Ownable, Pausable {
// ********* FEATURE CONTRACT ADDRESSES *********
    address payable public contentStakingAddress;

// ********* GLOBAL VAR FEES *********  
    uint256 public fee = 10;

// ********* EVENTS *********
    event ContentPost(
        address indexed _actor,
        string _action,
        bytes32 indexed _postId,
        uint256 _value
    );
    event Feature(
        address indexed _actor,
        string  _featureName,
        string _action,
        address indexed _contractAddress
    );

    constructor() public {

    }










     // ************************    OWNER ONLY CALLABLE FUNCTIONS     *******************************

    function updateFee(uint256 _newFee) public onlyOwner {
        fee = _newFee;
    }

    /// ****** Content Staking Features *******

    // ***** Set Contract Address to lock onto
    function setContentStaking(address payable _contractAddress) public onlyOwner {
        contentStakingAddress = _contractAddress;

        emit Feature(msgSender(), "Feature - Content Staking","Updated", _contractAddress);
    }
    
    // ***** Force post to payout owner earnings
    function content_owner_ClaimPostEarnings(bytes32 _postId,address payable _postOwner) public onlyOwner {

        ContentStaking cs = ContentStaking(contentStakingAddress);

        cs.claimPostEarnings(_postId, _postOwner);

        emit ContentPost(msgSender(), "(FORCED) Payout",_postId, 0);
    }

    // ***** Force close stake of staker
    function content_CloseStake(bytes32 contentId, address payable _staker) public payable onlyOwner{
        ContentStaking cs = ContentStaking(contentStakingAddress);

        cs.closeStake(contentId, _staker);

        emit ContentPost(msgSender(), "(FORCED) Closed Stake", contentId, 0);
    }




    // ************************    USER CALLABLE FUNCTIONS     *******************************

    // ****** ~~~~~~~~ Content Staking Features ~~~~~~~~ *******

     // _postId - Set this to a unique identifier such as hashed value of content or a UID
   function content_CreatePost(bytes32 _postId, uint256 _postLength) public payable onlyWhenRunning {
        ContentStaking cs = ContentStaking(contentStakingAddress);
        cs.addPost(
            _postId,
           payable(msgSender()),
            uint256(_postLength)
        );

        emit ContentPost(msgSender(), "Create", _postId, 0);
    }
    // owner of post can pull their earnings out of the post, earnings come from the stake fee pool, and if there are no more stakers then also the tipping pool.
    function content_ClaimPostEarnings(bytes32 _postId) public onlyWhenRunning{
        ContentStaking cs = ContentStaking(contentStakingAddress);

        cs.claimPostEarnings(_postId, payable(msgSender()));

        emit ContentPost(msgSender(), "Payout", _postId, 0);
    }


    function content_CloseStake(bytes32 contentId) public payable onlyWhenRunning{
        ContentStaking cs = ContentStaking(contentStakingAddress);

        cs.closeStake(contentId,  payable(msgSender()));

        emit ContentPost(msgSender(), "Closed Stake", contentId, 0);
    }

    function content_Tip(bytes32 _postId) public payable onlyWhenRunning{
        require(msg.value > 0, "Tip amount must be more than 0"); // Cut down on potential spam
        // require: owners cannot tip into their own post

        ContentStaking cs = ContentStaking(contentStakingAddress);
        cs.addStakerTip(_postId, msg.value );
        contentStakingAddress.transfer(msg.value);

        emit ContentPost(msgSender(), "Tip", _postId, msg.value);
    }

    function content_PlaceStake(bytes32 _postId) public payable onlyWhenRunning{
        require(msg.value > 0, "Stake amount must be more than 0"); // Cut down on potential spam

        ContentStaking cs = ContentStaking(contentStakingAddress);
        cs.addStake(_postId, msg.value, payable(msgSender()));
        contentStakingAddress.transfer(msg.value);

        emit ContentPost(msgSender(), "Stake", _postId, msg.value);
    }

    function content_GetStakes(bytes32 _postId) public view returns (address payable[] memory)
    {
        ContentStaking cs = ContentStaking(contentStakingAddress);
        address payable[] memory stakes = cs.getStakers(_postId);

        return stakes;
    }
}