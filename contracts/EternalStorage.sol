pragma solidity 0.6.2;

import './abstractions/Pausable.sol';
import './abstractions/Owned.sol';

contract EternalStorage is Owned, Pausable {

     constructor() public { owner = msg.sender; }
}