// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract ERC721ACoA is ERC721, AccessControl {
    using Strings for uint256;
    using Counters for Counters.Counter;

    // =============================================================
    //                        ROLE CONSTANTS
    // =============================================================
    
    // Rolle permited to mint tokens
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    // Rolle permited to authenticate the phisical object
    bytes32 public constant AUTHENTICATOR_ROLE = keccak256("AUTHENTICATOR_ROLE");

    // =============================================================
    //                          STRUCTURES
    // =============================================================

    // structure that keeps the current {value} of the phisical object and the {currency}
    struct ObjectValue {
        uint64 value;
        bytes4 currency;
    }

    // =============================================================
    //                           STORAGE
    // =============================================================

    // Counter traking the number of tokens, corresponds to the latest token id
    Counters.Counter private _tokenIdCounter;

    // Mapping token ID to the authenftificattion data uri
    mapping (uint256 => string) private _authenticationURI;

    // Mapping token ID to object value structure
    mapping (uint256 => ObjectValue) private _objectValue;

    // Base token URI
    string private _tokenURI;

    // =============================================================
    //                            EVENTS
    // =============================================================

    /**
     * @dev Emitted when a new certificate of authenticity token is created
     */
    event Minted(uint256 indexed tokenId, string indexed artist, string indexed objectName);

    /**
     * @dev Emmited when the value of the certified object is changed when tranferd with a new value
     */
    event NewValue(uint256 indexed tokenId, uint64 value, string currency);

    // =============================================================
    //                          CONSTRUCTOR
    // =============================================================

    constructor(string memory tokenURI) ERC721("Art Certificate of Authenticity", "ACOA") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
        _grantRole(AUTHENTICATOR_ROLE, msg.sender);

        _tokenURI = tokenURI;
    }

    // =============================================================
    //                          OPERATIONS
    // =============================================================

    /**
     * @dev See Openzepelin {ERC721-_baseURI}
     */
    function _baseURI() internal view override returns (string memory) {
        return _tokenURI;
    }

    /**
     * @dev Sets the unic uri of the authentication information that helps to identify the 
     * phisical object the token certificate is representing.
     * 
     * Requirements:
     * -`tokenId` token must exist
     */
    function _setAuthenticationURI(uint256 tokenId, string calldata authenticationURI) internal {
        require(_exists(tokenId), "ERC721CoA: URI set to non existing token");

        _authenticationURI[tokenId] = authenticationURI;
    }

    // =============================================================
    //                         SET FUNCTIONS
    // =============================================================

    /**
     * @dev Safly mints new token asigning its new token `id`, calls openzeppellin {ERC721-_safeMint} internal function
     * fills the mapping of the object value with its provided data & calls {_setAuthenticationURI}.
     * 
     * Requirements:
     * -`msg.sender` must have {MINTER_ROLE}
     * 
     * Emits a {Minted} and {NewValue} event.
     */
    function safeMint(address to, uint64 value, string calldata currency, string calldata artistName, string calldata objectName, string calldata authenticationURI) public onlyRole(MINTER_ROLE) {
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        _safeMint(to, tokenId, "");

        ObjectValue storage newTToken = _objectValue[tokenId];
        newTToken.value = value;
        newTToken.currency = bytes4(abi.encodePacked(currency));

        _setAuthenticationURI(tokenId, authenticationURI);

        emit Minted(tokenId, artistName, objectName);

        emit NewValue(tokenId, value, string(abi.encodePacked(currency)));
    }

    /**
     * @dev Calls openzeppellin {ERC721-safeTransferFrom}, then updates the token value if
     * the value is diferent.
     * 
     * Emmits a {NewValue} event.
     */
    function safeTransferFromValue (address from ,address to, uint256 tokenId, uint64 value) public {
        safeTransferFrom(from, to, tokenId);

        ObjectValue memory tToken = _objectValue[tokenId];
        if(tToken.value != value){
            _objectValue[tokenId].value = value;

            emit NewValue(tokenId, value, string(abi.encodePacked(tToken.currency)));
        }
    }

    // =============================================================
    //                         VEW FUNCTIONS
    // =============================================================

    /**
     * @dev Retursn the number of minted certificate tokens
     */
    function mintedTokens() public view returns(uint256 currentTokenId){
        currentTokenId = _tokenIdCounter.current();
    }

    /**
     * @dev Returns the infromation of a certificicate from its {tokenId}
     * 
     * Requirements:
     * -`tokenId` must be minted
     */
    function tokenInfo(uint256 tokenId) public view returns(uint64 value, string memory currency, string memory tokenURI) {
        _requireMinted(tokenId);

        currency = string(abi.encodePacked(_objectValue[tokenId].currency));
        value = _objectValue[tokenId].value;
        tokenURI = string(abi.encodePacked(_tokenURI, tokenId.toString()));
    }

    /**
     * @dev Retuns the authentication data URI
     * 
     * Requirements:
     * -`tokenId` must be minted
     * -`msg.sender` must be the owner or has the {AUTHENTICATOR_ROLE}
     */
   function authnticateToken(uint256 tokenId) public view returns (string memory) {
        _requireMinted(tokenId);

        address owner = ERC721.ownerOf(tokenId);
        require(owner == msg.sender || hasRole(AUTHENTICATOR_ROLE, _msgSender()), "ERC721CoA: must be owner or registered authenticator");

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