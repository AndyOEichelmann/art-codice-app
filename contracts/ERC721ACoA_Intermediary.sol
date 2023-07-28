// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "hardhat/console.sol";

import "./IERC721ACoA.sol";
import "@openzeppelin/contracts/token/ERC721/utils/ERC721Holder.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Context.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract ERC721ACoA_Intermediary is ERC721Holder, Context, ReentrancyGuard{
    using Counters for Counters.Counter;


    // state varaibles
    address payable public immutable feeAcount;
    uint256 public immutable listingFee;

    Counters.Counter private _itemCounter;
    
    enum Status {
        Listed,
        Claimed,
        Unlisted
    }

    struct Item{
        uint256 itemId;
        // 
        IERC721ACoA nftContract;
        uint256 tokenId;
        uint64 value;
        bytes4 currency;
        // 
        address lister;
        address claimer;
        Status status;
    }

    // itemId -> Item
    mapping(uint256 => Item) public _itemsListed;

    // constructor
    constructor(uint256 _listingFee){
        feeAcount = payable(msg.sender);
        listingFee = _listingFee;
    }

    event ItemListed (uint256 itemId, address indexed nftContract, uint256 tokenId, address indexed lister, address indexed claimer);

    event ItemClaimed (uint256 itemId, address indexed nftContract, uint256 tokenId, address indexed claimer);

    event ItemUnlisted (uint256 itemId, address indexed nftContract, uint256 tokenId, address indexed unlister);

    // List transferablo token / certificate ~ sender must pay listing fee
    function listCertificate(IERC721ACoA _nftContract, uint256 _tokenId, uint64 _objectValue, string calldata _currency, address _claimer) external nonReentrant {
        // sender must be the owner of the token to be listed
        require(_nftContract.ownerOf(_tokenId) == _msgSender(), string(abi.encodePacked("Intermediary: account ", Strings.toHexString(_msgSender())," is not token owner")));
        
        // sender must have sent the listing fee or be a registered user

        // thise contract must be appovedForAll in the nft contract by the sender 
        require(_nftContract.isApprovedForAll(_msgSender(), address(this)), string(abi.encodePacked("Intermediary: ", Strings.toHexString(address(this)), " contract must be appove by token owner")));

        // obtain itemId & increment count
        uint256 _itemId = _itemCounter.current();
        _itemCounter.increment();

        // add new item to listedItems mapping
        _itemsListed[_itemId] = Item (
            _itemId,
            _nftContract, 
            _tokenId, 
            _objectValue,
            bytes4(abi.encodePacked(_currency)),
            _msgSender(), 
            _claimer, 
            Status.Listed
        );

        // listed events
        emit ItemListed (_itemId, address(_nftContract), _tokenId, _msgSender(), _claimer);
    }

    // Claim certificate
    function claimCertificate(uint256 _itemId) external nonReentrant {
        uint256 listed =  _itemCounter.current();
        
        require(_itemId >= 0 && _itemId < listed, string(abi.encodePacked("Intermediary: itemId ", Strings.toString(_itemId), " does not exist")));

        Item storage item = _itemsListed[_itemId];

        require(_msgSender() == item.claimer, string(abi.encodePacked("Intermediary: ", Strings.toHexString(_msgSender()), " is not item permited claimer")));
        
        require(item.status == Status.Listed, string(abi.encodePacked("Intermediary: itemId ", Strings.toString(_itemId), " has allready been claimed or unlisted")));

        // update item transfer status
        item.status = Status.Claimed;
        
        // update the token value
        item.nftContract.changeValue(item.tokenId, item.value, string(abi.encodePacked(item.currency)));

        // transfer nft certificate to claimer in behaf of the ownwe
        item.nftContract.safeTransferFrom(item.lister , item.claimer, item.tokenId);

        // emit item claimed event
        emit ItemClaimed(_itemId, address(item.nftContract), item.tokenId, _msgSender());
    }

    // Cancel listed certificate
    function cancellListing(uint256 _itemId) external nonReentrant {
        uint256 listed =  _itemCounter.current();
        
        require(_itemId >= 0 && _itemId < listed, string(abi.encodePacked("Intermediary: itemId ", Strings.toString(_itemId), " does not exist")));

        Item storage item = _itemsListed[_itemId];

        require(_msgSender() == item.lister, string(abi.encodePacked("Intermediary: ", Strings.toHexString(_msgSender()), " is not item lister")));
        
        require(item.status == Status.Listed, string(abi.encodePacked("Intermediary: itemId ", Strings.toString(_itemId), " has allready been claimed or unlisted")));

        // update item transfer status
        item.status = Status.Unlisted;

        emit ItemUnlisted (_itemId, address(item.nftContract), item.tokenId, _msgSender());
    }

    // view number of items listed
    function listedAmount() external view returns (uint256 listed) {
        listed =  _itemCounter.current();
    }
}