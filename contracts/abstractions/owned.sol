pragma solidity 0.6.2;
/**
Owned is primarily used as a class of modifiers to be used in the main contracts to restrict access to certain functionality.
 */
abstract contract Owned {
    constructor() public { owner = msg.sender; }
    address payable owner;
    address payable gatewayContract;

    modifier onlyOwner {
        require(
            msg.sender == owner,
            "Only owner can call this function."
        );
        _;
    }
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