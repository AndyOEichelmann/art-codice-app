// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract CertificateOfAuthenticity is ERC721 {
    using Counters for Counters.Counter;
    using Strings for uint256;

    Counters.Counter private _tokenIdCounter;

    string private _baseTokenURI;
    string private _baseAuthenticationURI;

    constructor(string memory baseTokenURI, string memory baseAuthenticationURI) ERC721("Certificate of Authenticity", "COA") {
        _baseTokenURI = baseTokenURI;
        _baseAuthenticationURI = baseAuthenticationURI;
    }

    struct CoAToken {
        address minter;
        uint256 creationDate;
        string artistName;
        bytes4 currency;
        mapping(uint256 => uint256) valueHistory;
        uint256[] valueDates;
    }

    mapping(uint256 => CoAToken) private _coaTokens;

    event CoATokenMinted(uint256 tokenId, address owner, string artistName, uint256 creationDate, bytes4 currency);
    event CoATokenTransferred(uint256 tokenId, address from, address to, uint256 value);
    
    function mintCoATokens(uint256 mintNumber, string memory artistName, uint256[] memory itemsValue, bytes4 currency) external {
        require(mintNumber == itemsValue.length, "Invalid input lengths");

        for (uint256 i = 0; i < itemsValue.length; i++) {
            mintCoAToken(artistName, itemsValue[i], currency);
        }
    }

    function mintCoAToken(string memory artistName, uint256 itemValue, bytes4 currency) public returns (uint256) {
        uint256 newTokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();

        _safeMint(msg.sender, newTokenId);

        uint256 creationDate = block.timestamp;

        CoAToken storage newCoaToken = _coaTokens[newTokenId];
        newCoaToken.minter = msg.sender;
        newCoaToken.creationDate = creationDate;
        newCoaToken.artistName = artistName;
        newCoaToken.currency = currency;

        // _coaTokens[newTokenId] = CoAToken(msg.sender , artistName, creationDate, currency);
        _updateValueHistory(newTokenId, creationDate, itemValue);

        emit CoATokenMinted(newTokenId, msg.sender, artistName, creationDate, currency);

        return newTokenId;
    }

    function transferCoAFrom(
        address from,
        address to,
        uint256 tokenId,
        uint256 value
    ) public {
        super.safeTransferFrom(from, to, tokenId);

        _updateValueHistory(tokenId, block.timestamp, value);

        emit CoATokenTransferred(tokenId, from, to, value);
    }

    function getValueHistory(uint256 tokenId) public view returns (uint256[] memory, uint256[] memory, bytes4) {
        require(_exists(tokenId), "CoA token does not exist");

        CoAToken storage coaToken = _coaTokens[tokenId];

        return (coaToken.valueDates, _getValueHistory(coaToken), coaToken.currency);
    }

    function _getValueHistory(CoAToken storage coaToken) private view returns (uint256[] memory) {
        uint256[] memory values = new uint256[](coaToken.valueDates.length);

        for (uint256 i = 0; i < coaToken.valueDates.length; i++) {
            values[i] = coaToken.valueHistory[coaToken.valueDates[i]];
        }

        return values;
    }

    function _updateValueHistory(uint256 tokenId, uint256 date, uint256 value) private {
        CoAToken storage coaToken = _coaTokens[tokenId];

        coaToken.valueHistory[date] = value;
        coaToken.valueDates.push(date);
    }

    function getCoAToken(uint256 tokenId) public view returns (address , string memory, uint256, uint256, string memory, address) {
        require(_exists(tokenId), "CoA token does not exist");

        CoAToken storage coaToken = _coaTokens[tokenId];

        address minter = coaToken.minter;
        string memory artistName = coaToken.artistName;
        uint256 creationDate = coaToken.creationDate;

        uint256 value = coaToken.valueHistory[coaToken.valueDates[coaToken.valueDates.length - 1]];

        string memory coaURI = tokenURI(tokenId);

        address owner = _ownerOf(tokenId);

        return (minter, artistName, creationDate, value, coaURI, owner);
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_exists(tokenId), "CoA token does not exist");
        return string(abi.encodePacked(_baseTokenURI, tokenId.toString()));
    }

    function authenticationURI(uint256 tokenId) public view returns (string memory) {
        require(_exists(tokenId), "CoA token does not exist");
        return string(abi.encodePacked(_baseAuthenticationURI, tokenId.toString()));
    }
}