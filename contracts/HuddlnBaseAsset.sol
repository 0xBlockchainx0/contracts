pragma solidity ^0.6.0;

// ****** Meta-Gas
import "./lib/BasicMetaTransaction.sol";

import "./lib/ERC721PresetPauserAutoId.sol";

contract HuddlnBaseAsset is BasicMetaTransaction,ERC721PresetPauserAutoId{
  constructor() public ERC721PresetPauserAutoId("HuddlnMediaAsset", "HMA","https://cloudflare-ipfs.com/ipfs/") {}

  function _msgSender() internal view override returns (address payable) {
    return payable(msgSender());
  }
}