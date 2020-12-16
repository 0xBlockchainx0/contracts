pragma solidity ^0.6.0;

import "@openzeppelin/contracts/token/ERC721/ERC721Full.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721Mintable.sol";

contract MyNFT is ERC721Full, ERC721Mintable {
    constructor() ERC721Full("MyNFT", "MNFT") public {
    }
}