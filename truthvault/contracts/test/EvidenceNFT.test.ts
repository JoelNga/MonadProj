import { expect } from "chai";
import { ethers } from "hardhat";
import type { EvidenceNFT } from "../typechain-types";

describe("EvidenceNFT", () => {
  let nft: EvidenceNFT;
  let owner: string;
  let user: string;

  beforeEach(async () => {
    [owner, user] = await ethers.getSigners();
    const NFT = await ethers.getContractFactory("EvidenceNFT");
    nft = await NFT.deploy() as EvidenceNFT;
    await nft.waitForDeployment();
  });

  it("should deploy with correct name and symbol", async () => {
    expect(await nft.name()).to.equal("TruthVault Evidence");
    expect(await nft.symbol()).to.equal("TVE");
  });

  it("should set vault address correctly", async () => {
    await nft.setVaultAddress(user.address);
    expect(await nft.vaultAddress()).to.equal(user.address);
  });

  it("should mint when called by vault", async () => {
    await nft.setVaultAddress(owner.address);
    const tx = await nft.mint(user.address, "ipfs://QmTest");
    const receipt = await tx.wait();
    
    const filter = nft.filters.Transfer;
    const events = await nft.queryFilter(filter, receipt!.blockNumber, receipt!.blockNumber);
    expect(events.length).to.greaterThan(0);
  });

  it("should revert when called by non-vault", async () => {
    await expect(
      nft.connect(user).mint(user.address, "ipfs://QmTest")
    ).to.be.revertedWith("EvidenceNFT: caller is not the vault");
  });

  it("should return correct tokenURI", async () => {
    await nft.setVaultAddress(owner.address);
    await nft.mint(user.address, "ipfs://QmTest");
    expect(await nft.tokenURI(0)).to.equal("ipfs://QmTest");
  });
});