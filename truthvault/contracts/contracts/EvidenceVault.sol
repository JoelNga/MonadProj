// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./EvidenceNFT.sol";

interface IWorldID {
    function verifyProof(
        uint256 root,
        uint256 groupId,
        uint256 signalHash,
        uint256 nullifierHash,
        uint256 externalNullifierHash,
        uint256[8] calldata proof
    ) external view;
}

contract EvidenceVault {
    struct EvidenceRecord {
        uint256    timestamp;
        address    owner;
        string     metadataURI;
        bool       zkVerified;
        uint256    lastActiveAt;
        uint256    inactivityPeriod;
        bool       isPublic;
        uint256    nftTokenId;
        string     title;
        string     description;
        bool       isImmediate;
    }

    mapping(uint256 => bytes32[]) public recordFileHashes;
    mapping(uint256 => string[])  public recordIpfsCIDs;
    mapping(uint256 => EvidenceRecord) public records;
    mapping(uint256 => bool)           public usedNullifiers;
    mapping(address => uint256)        public uploadCount;

    uint256     public recordCount;
    IWorldID    public worldId;
    EvidenceNFT public nftContract;
    uint256     public groupId;
    uint256     public externalNullifierHash;

    event EvidenceRegistered(uint256 indexed id, address indexed owner, string title);
    event ActivityConfirmed(uint256 indexed id, uint256 timestamp);
    event EvidenceDisclosed(uint256 indexed id);

    constructor(
        address _worldId,
        address _nftContract,
        uint256 _groupId,
        uint256 _externalNullifierHash
    ) {
        worldId              = IWorldID(_worldId);
        nftContract          = EvidenceNFT(_nftContract);
        groupId              = _groupId;
        externalNullifierHash = _externalNullifierHash;
    }

    function registerEvidence(
        bytes32[] calldata fileHashes,
        string[] calldata  ipfsCIDs,
        string calldata    metadataURI,
        uint256            inactivityPeriod,
        uint256            zkRoot,
        uint256            nullifierHash,
        uint256[8] calldata zkProof,
        string calldata    title,
        string calldata    description,
        bool               isImmediate
    ) external returns (uint256 recordId) {
        require(fileHashes.length > 0, "EvidenceVault: no files");
        require(fileHashes.length == ipfsCIDs.length, "EvidenceVault: hash/cid mismatch");
        require(inactivityPeriod >= 0, "EvidenceVault: inactivity period too short");
        require(inactivityPeriod <= 365 days, "EvidenceVault: inactivity period too long");
        require(!usedNullifiers[nullifierHash],     "EvidenceVault: nullifier already used");
        require(uploadCount[msg.sender] < 10, "EvidenceVault: upload quota exceeded");
        require(bytes(title).length > 0, "EvidenceVault: title required");

        if (!isImmediate) {
            worldId.verifyProof(
                zkRoot,
                groupId,
                uint256(keccak256(abi.encodePacked(msg.sender))),
                nullifierHash,
                externalNullifierHash,
                zkProof
            );
        }

        usedNullifiers[nullifierHash]  = true;
        uploadCount[msg.sender]       += 1;

        recordId = recordCount++;

        uint256 tokenId = nftContract.mint(msg.sender, metadataURI);

        for (uint256 i = 0; i < fileHashes.length; i++) {
            recordFileHashes[recordId].push(fileHashes[i]);
            recordIpfsCIDs[recordId].push(ipfsCIDs[i]);
        }

        records[recordId] = EvidenceRecord({
            timestamp:        block.timestamp,
            owner:            msg.sender,
            metadataURI:      metadataURI,
            zkVerified:       !isImmediate,
            lastActiveAt:     block.timestamp,
            inactivityPeriod: inactivityPeriod,
            isPublic:         isImmediate,
            nftTokenId:       tokenId,
            title:            title,
            description:      description,
            isImmediate:      isImmediate
        });

        emit EvidenceRegistered(recordId, msg.sender, title);
    }

    function getFileCount(uint256 recordId) external view returns (uint256) {
        return recordFileHashes[recordId].length;
    }

    function confirmActivity(uint256 recordId) external {
        EvidenceRecord storage rec = records[recordId];
        require(rec.owner == msg.sender, "EvidenceVault: not the owner");
        require(!rec.isPublic,           "EvidenceVault: already disclosed");

        rec.lastActiveAt = block.timestamp;
        emit ActivityConfirmed(recordId, block.timestamp);
    }

    function checkAndTrigger(uint256 recordId) external {
        EvidenceRecord storage rec = records[recordId];
        if (rec.isPublic) return;
        if (rec.isImmediate) return;

        require(
            block.timestamp > rec.lastActiveAt + rec.inactivityPeriod,
            "EvidenceVault: inactivity period not elapsed"
        );

        rec.isPublic = true;
        emit EvidenceDisclosed(recordId);
    }
}
