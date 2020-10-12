pragma solidity 0.6.2;

abstract contract owned {
    constructor() public { owner = msg.sender; }
    address payable owner;
    //Gateway contract is the current function contract
    address payable gatewayContract;
  
    // This contract only defines a modifier but does not use
    // it: it will be used in derived contracts.
    // The function body is inserted where the special symbol
    // `_;` in the definition of a modifier appears.
    // This means that if the owner calls this function, the
    // function is executed and otherwise, an exception is
    // thrown.
    modifier onlyOwner {
        require(
            msg.sender == owner,
            "Only owner can call this function."
        );
        _;
    }
    // modifer for internal calls or function contract calls
     modifier onlyGatewayOrThis {
        require(
            (msg.sender == gatewayContract || msg.sender == address(this)),
            "Only gateway contract or this contract can call this function."
        );
        _;
    }
     modifier onlyGateway {
        require(
            (msg.sender == gatewayContract),
            "Only gateway contract can call this function."
        );
        _;
    }
}

abstract contract Pausable is owned {
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