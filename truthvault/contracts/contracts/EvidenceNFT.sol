// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract EvidenceNFT is ERC721, ERC721URIStorage, Ownable {
    uint256 private _tokenIdCounter;
    address public vaultAddress;

    modifier onlyVault() {
        require(msg.sender == vaultAddress, "EvidenceNFT: caller is not the vault");
        _;
    }

    constructor() ERC721("TruthVault Evidence", "TVE") Ownable() {}

    function setVaultAddress(address _vault) external onlyOwner {
        vaultAddress = _vault;
    }

    function mint(address to, string calldata tokenURI_) external onlyVault returns (uint256) {
        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter++;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, tokenURI_);
        return tokenId;
    }

    function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
    }

    function tokenURI(uint256 tokenId)
        public view override(ERC721, ERC721URIStorage) returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public view override(ERC721, ERC721URIStorage) returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}