pragma solidity 0.6.2;

import "./Ownable.sol";

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