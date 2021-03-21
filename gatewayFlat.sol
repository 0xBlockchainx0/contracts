// File: contracts/lib/SafeMath.sol

pragma solidity ^0.6.0;

/**
 * @dev Wrappers over Solidity's arithmetic operations with added overflow
 * checks.
 *
 * Arithmetic operations in Solidity wrap on overflow. This can easily result
 * in bugs, because programmers usually assume that an overflow raises an
 * error, which is the standard behavior in high level programming languages.
 * `SafeMath` restores this intuition by reverting the transaction when an
 * operation overflows.
 *
 * Using this library instead of the unchecked operations eliminates an entire
 * class of bugs, so it's recommended to use it always.
 */
library SafeMath {
    /**
     * @dev Returns the addition of two unsigned integers, reverting on
     * overflow.
     *
     * Counterpart to Solidity's `+` operator.
     *
     * Requirements:
     * - Addition cannot overflow.
     */
    function add(uint256 a, uint256 b) internal pure returns (uint256) {
        uint256 c = a + b;
        require(c >= a, "SafeMath: addition overflow");

        return c;
    }

    /**
     * @dev Returns the subtraction of two unsigned integers, reverting on
     * overflow (when the result is negative).
     *
     * Counterpart to Solidity's `-` operator.
     *
     * Requirements:
     * - Subtraction cannot overflow.
     */
    function sub(uint256 a, uint256 b) internal pure returns (uint256) {
        return sub(a, b, "SafeMath: subtraction overflow");
    }

    /**
     * @dev Returns the subtraction of two unsigned integers, reverting with custom message on
     * overflow (when the result is negative).
     *
     * Counterpart to Solidity's `-` operator.
     *
     * Requirements:
     * - Subtraction cannot overflow.
     *
     * _Available since v2.4.0._
     */
    function sub(uint256 a, uint256 b, string memory errorMessage) internal pure returns (uint256) {
        require(b <= a, errorMessage);
        uint256 c = a - b;

        return c;
    }

    /**
     * @dev Returns the multiplication of two unsigned integers, reverting on
     * overflow.
     *
     * Counterpart to Solidity's `*` operator.
     *
     * Requirements:
     * - Multiplication cannot overflow.
     */
    function mul(uint256 a, uint256 b) internal pure returns (uint256) {
        // Gas optimization: this is cheaper than requiring 'a' not being zero, but the
        // benefit is lost if 'b' is also tested.
        // See: https://github.com/OpenZeppelin/openzeppelin-contracts/pull/522
        if (a == 0) {
            return 0;
        }

        uint256 c = a * b;
        require(c / a == b, "SafeMath: multiplication overflow");

        return c;
    }

    /**
     * @dev Returns the integer division of two unsigned integers. Reverts on
     * division by zero. The result is rounded towards zero.
     *
     * Counterpart to Solidity's `/` operator. Note: this function uses a
     * `revert` opcode (which leaves remaining gas untouched) while Solidity
     * uses an invalid opcode to revert (consuming all remaining gas).
     *
     * Requirements:
     * - The divisor cannot be zero.
     */
    function div(uint256 a, uint256 b) internal pure returns (uint256) {
        return div(a, b, "SafeMath: division by zero");
    }

    /**
     * @dev Returns the integer division of two unsigned integers. Reverts with custom message on
     * division by zero. The result is rounded towards zero.
     *
     * Counterpart to Solidity's `/` operator. Note: this function uses a
     * `revert` opcode (which leaves remaining gas untouched) while Solidity
     * uses an invalid opcode to revert (consuming all remaining gas).
     *
     * Requirements:
     * - The divisor cannot be zero.
     *
     * _Available since v2.4.0._
     */
    function div(uint256 a, uint256 b, string memory errorMessage) internal pure returns (uint256) {
        // Solidity only automatically asserts when dividing by 0
        require(b > 0, errorMessage);
        uint256 c = a / b;
        // assert(a == b * c + a % b); // There is no case in which this doesn't hold

        return c;
    }

    /**
     * @dev Returns the remainder of dividing two unsigned integers. (unsigned integer modulo),
     * Reverts when dividing by zero.
     *
     * Counterpart to Solidity's `%` operator. This function uses a `revert`
     * opcode (which leaves remaining gas untouched) while Solidity uses an
     * invalid opcode to revert (consuming all remaining gas).
     *
     * Requirements:
     * - The divisor cannot be zero.
     */
    function mod(uint256 a, uint256 b) internal pure returns (uint256) {
        return mod(a, b, "SafeMath: modulo by zero");
    }

    /**
     * @dev Returns the remainder of dividing two unsigned integers. (unsigned integer modulo),
     * Reverts with custom message when dividing by zero.
     *
     * Counterpart to Solidity's `%` operator. This function uses a `revert`
     * opcode (which leaves remaining gas untouched) while Solidity uses an
     * invalid opcode to revert (consuming all remaining gas).
     *
     * Requirements:
     * - The divisor cannot be zero.
     *
     * _Available since v2.4.0._
     */
    function mod(uint256 a, uint256 b, string memory errorMessage) internal pure returns (uint256) {
        require(b != 0, errorMessage);
        return a % b;
    }
}

// File: contracts/lib/BasicMetaTransaction.sol

pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;


contract BasicMetaTransaction {

    using SafeMath for uint256;

    event MetaTransactionExecuted(address userAddress, address payable relayerAddress, bytes functionSignature);
    mapping(address => uint256) nonces;

    function getChainID() public pure returns (uint256) {
        uint256 id;
        assembly {
            id := chainid()
        }
        return id;
    }

    /**
     * Main function to be called when user wants to execute meta transaction.
     * The actual function to be called should be passed as param with name functionSignature
     * Here the basic signature recovery is being used. Signature is expected to be generated using
     * personal_sign method.
     * @param userAddress Address of user trying to do meta transaction
     * @param functionSignature Signature of the actual function to be called via meta transaction
     * @param sigR R part of the signature
     * @param sigS S part of the signature
     * @param sigV V part of the signature
     */
    function executeMetaTransaction(address userAddress, bytes memory functionSignature,
        bytes32 sigR, bytes32 sigS, uint8 sigV) public payable returns(bytes memory) {

        require(verify(userAddress, nonces[userAddress], getChainID(), functionSignature, sigR, sigS, sigV), "Signer and signature do not match");
        nonces[userAddress] = nonces[userAddress].add(1);

        // Append userAddress at the end to extract it from calling context
        (bool success, bytes memory returnData) = address(this).call(abi.encodePacked(functionSignature, userAddress));

        require(success, "Function call not successfull");
        emit MetaTransactionExecuted(userAddress, msg.sender, functionSignature);
        return returnData;
    }

    function getNonce(address user) public view returns(uint256 nonce) {
        nonce = nonces[user];
    }

    // Builds a prefixed hash to mimic the behavior of eth_sign.
    function prefixed(bytes32 hash) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", hash));
    }

    function verify(address owner, uint256 nonce, uint256 chainID, bytes memory functionSignature,
        bytes32 sigR, bytes32 sigS, uint8 sigV) public view returns (bool) {

        bytes32 hash = prefixed(keccak256(abi.encodePacked(nonce, this, chainID, functionSignature)));
        address signer = ecrecover(hash, sigV, sigR, sigS);
        require(signer != address(0), "Invalid signature");
		return (owner == signer);
    }

    function msgSender() internal view returns(address sender) {
        if(msg.sender == address(this)) {
            bytes memory array = msg.data;
            uint256 index = msg.data.length;
            assembly {
                // Load the 32 bytes word from memory with the address on the lower 20 bytes, and mask those.
                sender := and(mload(add(array, index)), 0xffffffffffffffffffffffffffffffffffffffff)
            }
        } else {
            return msg.sender;
        }
    }
}

// File: contracts/abstractions/Ownable.sol

// SPDX-License-Identifier: MIT

pragma solidity >=0.6.0 <0.8.0;
// ****** Meta-Gas


/**
 * @dev Contract module which provides a basic access control mechanism, where
 * there is an account (an owner) that can be granted exclusive access to
 * specific functions.
 *
 * By default, the owner account will be the one that deploys the contract. This
 * can later be changed with {transferOwnership}.
 *
 * This module is used through inheritance. It will make available the modifier
 * `onlyOwner`, which can be applied to your functions to restrict their use to
 * the owner.
    Remove gsn context import "../GSN/Context.sol"; swapped _msgSender to msgSender for biconomy
    owner is now payable and is not private. - jgonzalez
    changed any owner setting to payable(newowner) casting
    renounceOwnership - removed jgonzalez
 */
abstract contract Ownable is BasicMetaTransaction {
    address payable _owner;

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    /**
     * @dev Initializes the contract setting the deployer as the initial owner.
     */
    constructor () internal {
        address msgSender = msgSender();
        _owner = payable(msgSender);
        emit OwnershipTransferred(address(0), msgSender);
    }

    /**
     * @dev Returns the address of the current owner.
     */
    function owner() public view returns (address) {
        return _owner;
    }

    /**
     * @dev Throws if called by any account other than the owner.
     */
    modifier onlyOwner() {
        require(_owner == msgSender(), "Ownable: caller is not the owner");
        _;
    }


    /**
     * @dev Transfers ownership of the contract to a new account (`newOwner`).
     * Can only be called by the current owner.
     */
    function transferOwnership(address newOwner) public virtual onlyOwner {
        require(newOwner != address(0), "Ownable: new owner is the zero address");
        emit OwnershipTransferred(_owner, newOwner);
        _owner = payable(newOwner);
    }
}

// File: contracts/abstractions/Pausable.sol

pragma solidity 0.6.2;


abstract contract Pausable is Ownable{
    bool public isRunning;
    modifier onlyWhenRunning {
        require(isRunning, "contract is currently closed");
        _;
    }

    function stopContract() public onlyOwner{
        isRunning = false;
    }

    function startContract() public onlyOwner{
        isRunning = true;
    }
 
}

// File: contracts/abstractions/Featureable.sol

pragma solidity 0.6.2;
/**
Modifier to restrict contract calls to gateway only or this context, for use by feature contracts.
 */
abstract contract Featureable {
    address payable gatewayContract;
    // modifier for internal calls or function contract calls
     modifier onlyGatewayOrThis {
        require(
            (msg.sender == gatewayContract || msg.sender == address(this)),
            "Only the gateway contract or this contract can call this function."
        );
        _;
    }
    // modifier that only allows the gateway contract to call the function
     modifier onlyGateway {
        require(
            (msg.sender == gatewayContract),
            "Only the gateway contract can call this function."
        );
        _;
    }
}

// File: contracts/ContentStaking.sol

pragma solidity 0.6.2;





contract ContentStaking is Ownable,Featureable {
    
    enum StakingStatus { Nonexistant, Open, ClosedByStaker, ClosedByHuddln }
    enum PayoutStatus { unpaid, paid }
    enum PostLength { Short, Medium, Long }


    event Post(
        address indexed _actor,
        string indexed _action,
        bytes32 indexed _postId,
        uint256 _value
    );
    struct Stake {
        StakingStatus status;
        uint256 amountStaked;
        uint256 amountAccrued;
        uint blockOpened;
        uint blockClosed;
    }

    struct PostItem {
        address payable creator;

        PayoutStatus creatorPayoutStatus;
        // Pools
        uint256 tipPool; // all tips go to this pool

        uint256 stakeFeePool; // Stakers must pay 10% of stake directly to the owner's fee pool, the rest goes toward stake.

        uint256 ownerAmountAccrued; // keeps track of how much owner has pulled out (historical)

        address payable[] stakers;
        mapping (address => Stake) stakes;
        uint256 totalStakedAmount;
        uint createdAtBlock;
        uint tippingBlockStart;
        //track amount of stakers without having to pull down array
        uint stakersCount;
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
            tipPool:0,
            stakeFeePool:0,
            ownerAmountAccrued:0,
            stakers: tempAddressArray,
            totalStakedAmount: 0,
            creatorPayoutStatus: PayoutStatus.unpaid,
            createdAtBlock: block.number,
            tippingBlockStart: block.number + intPostLength,
            stakersCount: 0
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
        require(postItems[_postId].tippingBlockStart > block.number,"Post is not open for staking");
        require(_sender != (postItems[_postId].creator),"You cannot stake on your own post");
        //require(postItems[_postId].stakersCount <= 500,"Max stakers reached (500)");amountAccrued * 10/100;
        uint fee = amount * 10/100; // find fee
        amount = amount - fee; // remove fee from the amount staked.

        postItems[_postId].stakeFeePool = postItems[_postId].stakeFeePool + fee; //add fee for owners earnings 
        postItems[_postId].totalStakedAmount = postItems[_postId].totalStakedAmount + amount;
        postItems[_postId].stakersCount = postItems[_postId].stakersCount+1;
        postItems[_postId].stakers.push(_sender);
        postItems[_postId].stakes[_sender] = Stake({
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
        //check if there are no stakers to payout, if no stakers then owner should get BOTH pools
        if ( postItems[_postId].stakersCount == 0 ){
             uint fullFee = ( postItems[_postId].tipPool + postItems[_postId].stakeFeePool ) * 10/100;
             // set the amount earned, for historical purposes, both pools minus the fee.
              postItems[_postId].ownerAmountAccrued = (postItems[_postId].stakeFeePool + postItems[_postId].tipPool) - fullFee;
             // fees first , from combination of both pools
             _owner.transfer(fullFee);

             // transfer to the owner of post
             postItems[_postId].creator.transfer(( postItems[_postId].stakeFeePool + postItems[_postId].tipPool ) - fullFee);
        } else {
            // this case, handles if there are 1 or more stakers
             uint fee = postItems[_postId].stakeFeePool * 10/100;
             postItems[_postId].ownerAmountAccrued = postItems[_postId].stakeFeePool-fee;
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

// File: contracts/Gateway.sol

pragma solidity 0.6.2;

// ****** Abstracts ******


// ****** Meta-Gas

// ****** Feature Contracts


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
