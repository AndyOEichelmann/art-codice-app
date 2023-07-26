// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "hardhat/console.sol";

import "./IERC721ACoA.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Context.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract ERC721ACoA_Intermediary is Context, ReentrancyGuard{
    using Counters for Counters.Counter;


    // state varaibles
    address payable public immutable feeAcount;
    uint256 public immutable listingFee;

    Counters.Counter private _itemCounter;

    struct Item{
        uint256 itemId;
        IERC721ACoA nftContract;
        uint256 tokenId;
        uint64 objectValue;
        address lister;
        address claimer;
        bool isClaimed;
    }

    // itemId -> Item
    mapping(uint256 => Item) public _itemsListed;

    // constructor
    constructor(uint256 _listingFee){
        feeAcount = payable(msg.sender);
        listingFee = _listingFee;
    }

    event ItemListed (uint256 itemId, address indexed nftContract, uint256 tokenId, address indexed lister, address indexed claimer);

    event ItemClaimed (uint256 itemId, address indexed nftContract, uint256 tokenId, address indexed lister, address indexed claimer, bool isClaimed);

    // List transferablo token / certificate ~ sender must pay listing fee
    function listCertificate(IERC721ACoA _nftContract, uint256 _tokenId, uint64 _objectValue, address _claimer) external nonReentrant {
        require(_nftContract.ownerOf(_tokenId) == _msgSender(), string(abi.encodePacked("Intermediary: account ", Strings.toHexString(_msgSender())," is not token owner")));

        require(_nftContract.isApprovedForAll(_msgSender(), address(this)), string(abi.encodePacked("Intermediary: ", Strings.toHexString(address(this)), " contract must be appove by token owner")));
        
        // console.log("intermediary is approved for token",_nftContract.getApproved(_tokenId) == address(this));

        // obtain itemId & increment count
        uint256 _itemId = _itemCounter.current();
        _itemCounter.increment();

        // add new item to listedItems mapping
        _itemsListed[_itemId] = Item (_itemId, _nftContract, _tokenId, _objectValue, _msgSender(), _claimer, false);

        // listed events
        emit ItemListed (_itemId, address(_nftContract), _tokenId, _msgSender(), _claimer);
    }

    

    // Claim certificate
    function claimCertificate(uint256 _itemId) external nonReentrant {
        uint256 listedAmount =  _itemCounter.current();
        
        require(_itemId >= 0 && _itemId <= listedAmount, string(abi.encodePacked("Intermediary: item ", Strings.toString(_itemId), " does not exist")));

        Item storage item = _itemsListed[_itemId];

        require(_msgSender() == item.claimer, string(abi.encodePacked("Intermediary: ", Strings.toHexString(_msgSender()), " is not item permited claimer")));
        
        require(!item.isClaimed, string(abi.encodePacked("Intermediary: item ", Strings.toString(_itemId), " has allready been claimed")));

        // update item transfer status
        item.isClaimed = true;

        // transfer nft certificate to claimer in behaf of the ownwe
        item.nftContract.safeTransferFromValue(item.lister, item.claimer, item.tokenId, item.objectValue);

        // emit item claimed event
        emit ItemClaimed(_itemId, address(item.nftContract), item.tokenId, item.lister, _msgSender(), true);
    }

    // Cancel listed certificate
    function cancellListing(uint256 _itemId) external nonReentrant {
        
    }

    // view number of items listed
    function listedItems() external view returns (uint256 listedAmount) {
        listedAmount =  _itemCounter.current();
    }
}