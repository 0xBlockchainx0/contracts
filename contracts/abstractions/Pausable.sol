pragma solidity 0.6.2;

import "./Owned.sol";

abstract contract Pausable is Owned {
    bool public isRunning;
    modifier onlyWhenRunning {
        require(isRunning, "contract is currently closed");
        _;
    }

    function stopContract() public {
        isRunning = false;
    }

    function startContract() public {
        isRunning = true;
    }
 
}