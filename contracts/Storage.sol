pragma solidity 0.6.2;

contract owned {
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

contract Pausable is owned {
    bool public isRunning;

    modifier onlyWhenRunning {
        require(isRunning, "contract is currently closed");
        _;
    }

    function stopContract() public onlyOwner {
        isRunning = false;
    }

    function startContract() public onlyOwner {
        isRunning = true;
    }
 
}

contract Storage is owned, Pausable {

     constructor() public { owner = msg.sender; }
}