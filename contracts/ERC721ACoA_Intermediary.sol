// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "./IERC721ACoA.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract ERC721ACoA_Intermediary is ReentrancyGuard {
    using Counters for Counters.Counter;


    // state varaibles
    address payable public immutable feeAcount;
    uint256 public immutable feePercent;

    Counters.Counter private _itemCounter;

    struct Item{
        uint256 itemId;
        IERC721ACoA nftContract;
        uint256 tokenId;
        address lister;
        address claimer;
        bool claimed;
    }

    // itemId -> Item
    mapping(uint256 => Item) public _listedItems;

    // constructor
    constructor(uint256 _feePercent){
        feeAcount = payable(msg.sender);
        feePercent = _feePercent;
    }

    event ItemListed (uint256 itemId, address indexed nftContract, uint256 tokenId, address indexed lister, address indexed claimer);

    // List transferablo token / certificate
    function listCertificate(IERC721ACoA _nftContract, uint256 _tokenId, address _claimer) external nonReentrant {
        // requirements checks ~ msg.sender is the item owner, this contract is approved for token, claimer not addres cero, ...

        // obtain itemId & increment count
        uint256 _itemId = _itemCounter.current();
        _itemCounter.increment();

        // add new item to listedItems mapping
        _listedItems[_itemId] = Item (
            _itemId,
            _nftContract,
            _tokenId,
            msg.sender,
            _claimer,
            false
        );

        // listed events
        emit ItemListed (_itemId, address(_nftContract), _tokenId, msg.sender, _claimer);
    }
    // Claim certificate

    // Cancel listed certificate
}