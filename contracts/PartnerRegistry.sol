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

  
    struct PartnerData {
        bool initialized;
        uint256 partnerFee;
        uint256 earningsPool; 
        uint256 partnerEarningsAmount; // historical keep track of how much earnings they have pulled out. only updated on payout
    }

    mapping (address => PartnerData) stakes;

   
   // ****** Functions only callable by the deployer of this contract ******
   // function setOwner(address payable _newOwner) public onlyOwner {
   //     owner = _newOwner;
   // }
    function setGatewayContract (address payable _newGatewayContract) public onlyOwner{
        gatewayContract = _newGatewayContract;
        emit Gateway(msgSender(),"Updated", gatewayContract);

    }
    /**
    When setting up a partner, call this to setup your parnter index.
     */
    function createPartnerIndex(address payable _partner, uint256 _postLength) public onlyGateway {
        require(postItems[_postId].initialized == false,"Post ID already exists");
      
    }

    function updatePartnerIndex() public view returns (bytes32[] memory) {
       
    }
  

    
    function removePartnerIndex(bytes32 _postId) public view returns (address payable[] memory) {
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
    function claimPartnerEarnings(bytes32 _postId, address payable _msgSender) public onlyGatewayOrThis payable {
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
      function getPartnerIndex(bytes32 _postId, address _address) public view returns(bool,uint, uint256, uint256, uint, uint) {
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