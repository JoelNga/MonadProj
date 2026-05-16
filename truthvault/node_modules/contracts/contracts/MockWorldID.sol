// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract MockWorldID {
    bool public validProof = true;

    function setValidProof(bool _valid) external {
        validProof = _valid;
    }

    function verifyProof(
        uint256 root,
        uint256 groupId,
        uint256 signalHash,
        uint256 nullifierHash,
        uint256 externalNullifierHash,
        uint256[8] calldata proof
    ) external view {
        require(validProof, "MockWorldID: invalid proof");
    }
}