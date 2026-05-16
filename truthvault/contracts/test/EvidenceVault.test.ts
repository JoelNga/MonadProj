import { expect } from "chai";
import { ethers, network } from "hardhat";
import type { EvidenceVault, EvidenceNFT, MockWorldID } from "../typechain-types";

describe("EvidenceVault", () => {
  let vault: EvidenceVault;
  let nft: EvidenceNFT;
  let worldId: MockWorldID;
  let owner: string;
  let user: string;

  const groupId = 1;
  const externalNullifierHash = ethers.keccak256(ethers.toUtf8Bytes("app_truthvault_upload"));

  beforeEach(async () => {
    [owner, user] = await ethers.getSigners();

    // Deploy mock WorldID
    const WorldID = await ethers.getContractFactory("MockWorldID");
    worldId = await WorldID.deploy() as MockWorldID;
    await worldId.waitForDeployment();

    // Deploy NFT
    const NFT = await ethers.getContractFactory("EvidenceNFT");
    nft = await NFT.deploy() as EvidenceNFT;
    await nft.waitForDeployment();

    // Deploy Vault
    const Vault = await ethers.getContractFactory("EvidenceVault");
    vault = await Vault.deploy(
      await worldId.getAddress(),
      await nft.getAddress(),
      groupId,
      externalNullifierHash
    ) as EvidenceVault;
    await vault.waitForDeployment();

    // Set vault address on NFT
    await nft.setVaultAddress(await vault.getAddress());
  });

  it("should register evidence with valid inputs", async () => {
    const fileHash = ethers.keccak256(ethers.toUtf8Bytes("test"));
    const ipfsCID = "QmTest123";
    const metadataURI = "ipfs://QmMetadata";
    const inactivityPeriod = 90 * 24 * 60 * 60; // 90 days

    // Mock proof (valid)
    const nullifierHash = 12345;
    const zkRoot = 111;
    const zkProof = [0,0,0,0,0,0,0,0] as any;

    await worldIDMockSetValidProof(worldId, true);

    const tx = await vault.registerEvidence(
      fileHash,
      ipfsCID,
      metadataURI,
      inactivityPeriod,
      zkRoot,
      nullifierHash,
      zkProof
    );
    const receipt = await tx.wait();

    const filter = vault.filters.EvidenceRegistered;
    const events = await vault.queryFilter(filter, receipt!.blockNumber, receipt!.blockNumber);
    expect(events.length).to.equal(1);
    expect(events[0].args!.owner).to.equal(owner.address);
  });

  it("should revert with duplicate nullifierHash", async () => {
    const fileHash = ethers.keccak256(ethers.toUtf8Bytes("test"));
    const nullifierHash = 12345;
    const zkProof = [0,0,0,0,0,0,0,0] as any;

    await worldId.setValidProof(true);

    await vault.registerEvidence(
      fileHash,
      "QmTest1",
      "ipfs://Qm1",
      90 * 24 * 60 * 60,
      111,
      nullifierHash,
      zkProof
    );

    await expect(
      vault.registerEvidence(
        fileHash,
        "QmTest2",
        "ipfs://Qm2",
        90 * 24 * 60 * 60,
        111,
        nullifierHash,
        zkProof
      )
    ).to.be.revertedWith("EvidenceVault: nullifier already used");
  });

  it("should revert when inactivity period too short", async () => {
    await expect(
      vault.registerEvidence(
        ethers.keccak256(ethers.toUtf8Bytes("test")),
        "QmTest",
        "ipfs://Qm",
        5 * 24 * 60 * 60, // 5 days < MIN_INACTIVITY
        111,
        12345,
        [0,0,0,0,0,0,0,0] as any
      )
    ).to.be.revertedWith("EvidenceVault: inactivity period too short");
  });

  it("should revert when inactivity period too long", async () => {
    await expect(
      vault.registerEvidence(
        ethers.keccak256(ethers.toUtf8Bytes("test")),
        "QmTest",
        "ipfs://Qm",
        800 * 24 * 60 * 60, // 800 days > MAX_INACTIVITY
        111,
        12345,
        [0,0,0,0,0,0,0,0] as any
      )
    ).to.be.revertedWith("EvidenceVault: inactivity period too long");
  });

  it("should confirm activity and update lastActiveAt", async () => {
    const nullifierHash = 12345;
    const zkProof = [0,0,0,0,0,0,0,0] as any;
    await worldId.setValidProof(true);

    const tx = await vault.registerEvidence(
      ethers.keccak256(ethers.toUtf8Bytes("test")),
      "QmTest",
      "ipfs://Qm",
      90 * 24 * 60 * 60,
      111,
      nullifierHash,
      zkProof
    );
    const receipt = await tx.wait();

    const filter = vault.filters.EvidenceRegistered;
    const events = await vault.queryFilter(filter, receipt!.blockNumber, receipt!.blockNumber);
    const recordId = events[0].args!.id;

    const before = (await vault.records(recordId)).lastActiveAt;

    await network.provider.send("evm_increaseTime", [60 * 60 * 24]); // advance 1 day
    await network.provider.send("evm_mine");

    await vault.confirmActivity(recordId);

    const after = (await vault.records(recordId)).lastActiveAt;
    expect(after).to.be.gt(before);
  });

  it("should revert confirmActivity when called by non-owner", async () => {
    const nullifierHash = 12345;
    const zkProof = [0,0,0,0,0,0,0,0] as any;
    await worldId.setValidProof(true);

    const tx = await vault.registerEvidence(
      ethers.keccak256(ethers.toUtf8Bytes("test")),
      "QmTest",
      "ipfs://Qm",
      90 * 24 * 60 * 60,
      111,
      nullifierHash,
      zkProof
    );
    const receipt = await tx.wait();

    const filter = vault.filters.EvidenceRegistered;
    const events = await vault.queryFilter(filter, receipt!.blockNumber, receipt!.blockNumber);
    const recordId = events[0].args!.id;

    await expect(
      vault.connect(user).confirmActivity(recordId)
    ).to.be.revertedWith("EvidenceVault: not the owner");
  });

  it("should checkAndTrigger after inactivity period", async () => {
    const nullifierHash = 12345;
    const zkProof = [0,0,0,0,0,0,0,0] as any;
    await worldId.setValidProof(true);

    const tx = await vault.registerEvidence(
      ethers.keccak256(ethers.toUtf8Bytes("test")),
      "QmTest",
      "ipfs://Qm",
      90 * 24 * 60 * 60,
      111,
      nullifierHash,
      zkProof
    );
    const receipt = await tx.wait();

    const filter = vault.filters.EvidenceRegistered;
    const events = await vault.queryFilter(filter, receipt!.blockNumber, receipt!.blockNumber);
    const recordId = events[0].args!.id;

    // Advance time past inactivity period
    await network.provider.send("evm_increaseTime", [91 * 24 * 60 * 60]);
    await network.provider.send("evm_mine");

    await vault.checkAndTrigger(recordId);

    const record = await vault.records(recordId);
    expect(record.isPublic).to.equal(true);
  });

  it("should revert checkAndTrigger before inactivity period", async () => {
    const nullifierHash = 12345;
    const zkProof = [0,0,0,0,0,0,0,0] as any;
    await worldId.setValidProof(true);

    const tx = await vault.registerEvidence(
      ethers.keccak256(ethers.toUtf8Bytes("test")),
      "QmTest",
      "ipfs://Qm",
      90 * 24 * 60 * 60,
      111,
      nullifierHash,
      zkProof
    );
    const receipt = await tx.wait();

    const filter = vault.filters.EvidenceRegistered;
    const events = await vault.queryFilter(filter, receipt!.blockNumber, receipt!.blockNumber);
    const recordId = events[0].args!.id;

    await expect(
      vault.checkAndTrigger(recordId)
    ).to.be.revertedWith("EvidenceVault: inactivity period not elapsed");
  });

  it("should be idempotent - calling checkAndTrigger twice on disclosed record", async () => {
    const nullifierHash = 12345;
    const zkProof = [0,0,0,0,0,0,0,0] as any;
    await worldId.setValidProof(true);

    const tx = await vault.registerEvidence(
      ethers.keccak256(ethers.toUtf8Bytes("test")),
      "QmTest",
      "ipfs://Qm",
      90 * 24 * 60 * 60,
      111,
      nullifierHash,
      zkProof
    );
    const receipt = await tx.wait();

    const filter = vault.filters.EvidenceRegistered;
    const events = await vault.queryFilter(filter, receipt!.blockNumber, receipt!.blockNumber);
    const recordId = events[0].args!.id;

    await network.provider.send("evm_increaseTime", [91 * 24 * 60 * 60]);
    await network.provider.send("evm_mine");

    await vault.checkAndTrigger(recordId);
    await vault.checkAndTrigger(recordId); // Should not revert

    const record = await vault.records(recordId);
    expect(record.isPublic).to.equal(true);
  });
});

// Helper function to set mock world ID to accept all proofs
async function worldIDMockSetValidProof(worldId: any, valid: boolean) {
  await worldId.setValidProof(valid);
}