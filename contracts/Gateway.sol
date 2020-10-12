pragma solidity 0.6.2;

contract Gateway is owned, Pausable {


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