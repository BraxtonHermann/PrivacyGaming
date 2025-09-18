const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Deploying Privacy Gaming contract to Sepolia...");

  // Get deployer
  const [deployer] = await ethers.getSigners();
  console.log("📝 Deploying with account:", deployer.address);

  // Get balance
  const balance = await deployer.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(balance), "ETH");

  // Deploy contract
  const PrivacyGaming = await ethers.getContractFactory("PrivacyGaming");

  console.log("⏳ Deploying contract...");
  const privacyGaming = await PrivacyGaming.deploy();

  console.log("⌛ Waiting for deployment confirmation...");
  await privacyGaming.waitForDeployment();

  const contractAddress = await privacyGaming.getAddress();
  console.log("✅ Privacy Gaming deployed to:", contractAddress);

  // Verify contract setup
  console.log("🔍 Verifying contract setup...");

  try {
    const owner = await privacyGaming.owner();
    console.log("👑 Contract owner:", owner);

    const gameCount = await privacyGaming.getActiveGames();
    console.log("🎮 Active games count:", gameCount[0].length);

    const contractBalance = await privacyGaming.getContractBalance();
    console.log("💎 Contract balance:", ethers.formatEther(contractBalance), "ETH");

  } catch (error) {
    console.log("⚠️ Contract setup verification failed:", error.message);
  }

  console.log("\n📋 Contract Deployment Summary:");
  console.log("================================");
  console.log("Contract Address:", contractAddress);
  console.log("Network: Sepolia");
  console.log("Deployer:", deployer.address);
  console.log("\n🔗 Add this address to your frontend:");
  console.log(`const CONTRACT_ADDRESS = "${contractAddress}";`);

  return contractAddress;
}

main()
  .then((address) => {
    console.log("\n🎉 Deployment successful!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });