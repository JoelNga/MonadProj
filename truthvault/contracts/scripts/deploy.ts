import { ethers } from "hardhat";
import fs from "fs";
import path from "path";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with:", deployer.address);

  // Deploy EvidenceNFT
  const NFT = await ethers.getContractFactory("EvidenceNFT");
  const nft = await NFT.deploy();
  await nft.waitForDeployment();
  const nftAddress = await nft.getAddress();
  console.log("EvidenceNFT deployed to:", nftAddress);

  // Deploy EvidenceVault
  const worldIdAddress = process.env.WORLD_ID_VERIFIER_ADDRESS!;
  if (!worldIdAddress) {
    throw new Error("WORLD_ID_VERIFIER_ADDRESS not set in .env");
  }
  
  const groupId = 1;
  const externalNullifierHash = ethers.keccak256(ethers.toUtf8Bytes("app_truthvault_upload"));

  const Vault = await ethers.getContractFactory("EvidenceVault");
  const vault = await Vault.deploy(
    worldIdAddress,
    nftAddress,
    groupId,
    externalNullifierHash
  );
  await vault.waitForDeployment();
  const vaultAddress = await vault.getAddress();
  console.log("EvidenceVault deployed to:", vaultAddress);

  // Set vault address on NFT
  await nft.setVaultAddress(vaultAddress);
  console.log("Vault address set on EvidenceNFT.");

  // Write deployments.json
  const deployments = {
    EvidenceNFT: nftAddress,
    EvidenceVault: vaultAddress,
  };
  
  const deploymentsPath = path.join(__dirname, "..", "deployments.json");
  fs.writeFileSync(deploymentsPath, JSON.stringify(deployments, null, 2));
  console.log("Addresses written to deployments.json");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});