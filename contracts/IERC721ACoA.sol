// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

interface IERC721ACoA is IERC721{

    // =============================================================
    //                            EVENTS
    // =============================================================

    event Minted(uint256 indexed tokenId, string indexed artist, string indexed objectName);

    event ChangeCurrency(uint256 indexed tokenId, string currency);

    event NewValue(uint256 indexed tokenId, uint64 value, string currency);

    // =============================================================
    //                         SET FUNCTIONS
    // =============================================================

    function safeMint(address to, uint64 value, string calldata currency, string calldata artistName, string calldata objectName, string calldata authenticationURI) external;

    function safeMint(address to, uint64 value, string calldata currency, string calldata artistName, string calldata objectName, string calldata authenticationURI, address beneficiary) external;

    function changeValue (uint256 tokenId, uint64 value, string calldata currency) external;

    // =============================================================
    //                         VEW FUNCTIONS
    // =============================================================

    function mintedTokens() external view returns(uint256 currentTokenId);

    function tokenInfo(uint256 tokenId) external view returns(uint64 value, string memory currency, address beneficiary, string memory tokenURI);

    function authnticateToken(uint256 tokenId) external view returns (string memory);
}