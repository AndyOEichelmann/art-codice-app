// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract TestCoAToken is ERC721, AccessControl {
    using Strings for uint256;
    using Counters for Counters.Counter;

    // =============================================================
    //                        ROLE CONSTANTS
    // =============================================================

    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant AUTHENTICATOR_ROLE = keccak256("AUTHENTICATOR_ROLE");

    // =============================================================
    //                          STRUCTURES
    // =============================================================

    struct Ttoken {
        uint64 value;
        bytes4 currency;
        bytes32 artistName;
    }

    // =============================================================
    //                           STORAGE
    // =============================================================

    Counters.Counter private _tokenIdCounter;

    mapping (uint256 => string) private _authenticationURI;
    mapping (uint256 => Ttoken) private _tToken;

    string private _tokenURI;

    // =============================================================
    //                            EVENTS
    // =============================================================

    event TokenMint(address indexed owner, uint256 indexed tokenId, string indexed artist, uint64 value, string currency);

    event ValueTransfer(address indexed from, address indexed to, uint256 indexed tokenId, uint64 value, string currency);

    // =============================================================
    //                          CONSTRUCTOR
    // =============================================================

    constructor(string memory tokenURI) ERC721("TestCoAToken", "TCOA") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
        _grantRole(AUTHENTICATOR_ROLE, msg.sender);

        _tokenURI = tokenURI;
    }

    // =============================================================
    //                          OPERATIONS
    // =============================================================

    function _baseURI() internal view override returns (string memory) {
        return _tokenURI;
    }

    function _setAuthenticationURI(uint256 tokenId, string memory authenticationURI) internal {
        require(_exists(tokenId), "ERC721CoA: URI set to non existing token");

        _authenticationURI[tokenId] = authenticationURI;
    }

    // =============================================================
    //                         SET FUNCTIONS
    // =============================================================

    function safeMint(address to, uint64 value, bytes4 currency, bytes32 artistName, string memory authenticationURI) public onlyRole(MINTER_ROLE) {
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        _safeMint(to, tokenId);

        Ttoken storage newTToken = _tToken[tokenId];
        newTToken.value = value;
        newTToken.currency = currency;
        newTToken.artistName = artistName;

        _setAuthenticationURI(tokenId, authenticationURI);

        emit TokenMint(to, tokenId, string(abi.encodePacked(artistName)), value, string(abi.encodePacked(currency)));
    }

    function safeValueTransferFrom (address from ,address to, uint256 tokenId, uint64 value) public {
        safeTransferFrom(from, to, tokenId);

        _tToken[tokenId].value = value;

        emit ValueTransfer(from, to, tokenId, value, string(abi.encodePacked(_tToken[tokenId].currency)));
    }

    // =============================================================
    //                         VEW FUNCTIONS
    // =============================================================

    function tokenInfo(uint256 tokenId) public view returns(string memory artistName, uint64 value, string memory currency, string memory tokenURI) {
        _requireMinted(tokenId);

        artistName = string(abi.encodePacked(_tToken[tokenId].artistName));
        currency = string(abi.encodePacked(_tToken[tokenId].currency));
        value = _tToken[tokenId].value;
        tokenURI = string(abi.encodePacked(_tokenURI, tokenId.toString()));
    }

    /*
        function authnticateToken(uint256 tokenId) public view onlyRole(AUTHENTICATOR_ROLE) returns (string memory) {
            _requireMinted(tokenId);
            
            return _authenticationURI[tokenId];
        }
    */
   function authnticateToken(uint256 tokenId) public view returns (string memory) {
        _requireMinted(tokenId);

        address owner = ERC721.ownerOf(tokenId);
        require(owner == msg.sender || hasRole(AUTHENTICATOR_ROLE, _msgSender()), "ACoA: must be owner or registered authenticator");

        return _authenticationURI[tokenId];
    }

    // =============================================================
    //                      REQUIRED OVERRIDES
    // =============================================================

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}