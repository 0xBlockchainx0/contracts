pragma solidity 0.6.2;
/**
Modifier to restrict contract calls to gateway only or this context, for use by feature contracts.
 */
abstract contract Featureable {
    address payable gatewayContract;
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