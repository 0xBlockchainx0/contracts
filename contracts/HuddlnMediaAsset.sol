pragma solidity ^0.6.0;

// ****** Meta-Gas
import "./lib/BasicMetaTransaction.sol";

import "./lib/ERC721PresetPauserAutoId.sol";

contract HuddlnMediaAsset is BasicMetaTransaction,ERC721PresetPauserAutoId{
  constructor() public ERC721PresetPauserAutoId("HuddlnMediaAsset", "HMA","https://huddln.mypinata.cloud/ipfs/") {}

  function _msgSender() internal view override returns (address payable) {
    return payable(msgSender());
  }
}