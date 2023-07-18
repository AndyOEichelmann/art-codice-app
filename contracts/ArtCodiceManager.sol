// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

contract CoAExchangeManager {

    struct Listing {
        address owner;
        address coaContract;
        uint256 tokenId;
        address claimAddress;
        bytes32 claimKey;
        bool isClaimed;
    }

    mapping(uint256 => Listing) private _listings;
    uint256 private _listingIdCounter;

    event ItemListed(uint256 indexed listingId, address indexed owner, address indexed coaContract, uint256 tokenId, address claimAddress, bytes32 claimKey);
    event ItemClaimed(uint256 indexed listingId, address indexed claimer);

    function listCoAItem(address coaContract, uint256 tokenId, address claimAddress) external {
        IERC721 coaToken = IERC721(coaContract);
        require(coaToken.ownerOf(tokenId) == msg.sender, "You do not own this CoA item");

        _listingIdCounter++;
        uint256 listingId = _listingIdCounter;

        bytes32 claimKey = generateClaimKey(listingId);

        _listings[listingId] = Listing(msg.sender, coaContract, tokenId, claimAddress, claimKey, false);

        emit ItemListed(listingId, msg.sender, coaContract, tokenId, claimAddress, claimKey);
    }

    function claimItem(uint256 listingId) external {
        require(listingId <= _listingIdCounter, "Invalid listing ID");

        Listing storage listing = _listings[listingId];
        require(!listing.isClaimed, "Item already claimed");
        require(listing.claimAddress == msg.sender, "You are not eligible to claim this item");

        listing.isClaimed = true;

        emit ItemClaimed(listingId, msg.sender);
    }

    function getItemDetails(uint256 listingId) external view returns (address owner, address coaContract, uint256 tokenId, address claimAddress, bytes32 claimKey, bool isClaimed) {
        require(listingId <= _listingIdCounter, "Invalid listing ID");

        Listing storage listing = _listings[listingId];

        return (listing.owner, listing.coaContract, listing.tokenId, listing.claimAddress, listing.claimKey, listing.isClaimed);
    }

    function generateClaimKey(uint256 listingId) internal view returns (bytes32) {
        bytes32 seed = keccak256(abi.encodePacked(listingId, block.number, block.timestamp));

        return seed;
    }
}
