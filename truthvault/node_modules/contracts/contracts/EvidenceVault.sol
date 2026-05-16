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
        bytes32  fileHash;
        string   ipfsCID;
        uint256  timestamp;
        address  owner;
        string   metadataURI;
        bool     zkVerified;
        uint256  lastActiveAt;
        uint256  inactivityPeriod;
        bool     isPublic;
        uint256  nftTokenId;
    }

    uint256 public constant MIN_INACTIVITY = 7 days;
    uint256 public constant MAX_INACTIVITY = 730 days;
    uint256 public constant MAX_UPLOADS     = 10;

    mapping(uint256 => EvidenceRecord) public records;
    mapping(uint256 => bool)           public usedNullifiers;
    mapping(address => uint256)        public uploadCount;

    uint256     public recordCount;
    IWorldID    public worldId;
    EvidenceNFT public nftContract;
    uint256     public groupId;
    uint256     public externalNullifierHash;

    event EvidenceRegistered(uint256 indexed id, address indexed owner, string cid);
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
        bytes32          fileHash,
        string calldata  ipfsCID,
        string calldata  metadataURI,
        uint256          inactivityPeriod,
        uint256          zkRoot,
        uint256          nullifierHash,
        uint256[8] calldata zkProof
    ) external returns (uint256 recordId) {
        require(inactivityPeriod >= MIN_INACTIVITY, "EvidenceVault: inactivity period too short");
        require(inactivityPeriod <= MAX_INACTIVITY, "EvidenceVault: inactivity period too long");
        require(!usedNullifiers[nullifierHash],     "EvidenceVault: nullifier already used");
        require(uploadCount[msg.sender] < MAX_UPLOADS, "EvidenceVault: upload quota exceeded");

        worldId.verifyProof(
            zkRoot,
            groupId,
            uint256(keccak256(abi.encodePacked(msg.sender))),
            nullifierHash,
            externalNullifierHash,
            zkProof
        );

        usedNullifiers[nullifierHash]  = true;
        uploadCount[msg.sender]       += 1;

        recordId = recordCount++;

        uint256 tokenId = nftContract.mint(msg.sender, metadataURI);

        records[recordId] = EvidenceRecord({
            fileHash:         fileHash,
            ipfsCID:          ipfsCID,
            timestamp:        block.timestamp,
            owner:            msg.sender,
            metadataURI:      metadataURI,
            zkVerified:       true,
            lastActiveAt:     block.timestamp,
            inactivityPeriod: inactivityPeriod,
            isPublic:         false,
            nftTokenId:       tokenId
        });

        emit EvidenceRegistered(recordId, msg.sender, ipfsCID);
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
        if (rec.isPublic) return; // idempotent

        require(
            block.timestamp > rec.lastActiveAt + rec.inactivityPeriod,
            "EvidenceVault: inactivity period not elapsed"
        );

        rec.isPublic = true;
        emit EvidenceDisclosed(recordId);
    }
}