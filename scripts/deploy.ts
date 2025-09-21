import { ethers } from "hardhat";
import { PrivacyGaming } from "../typechain-types";

async function main() {
  console.log("🚀 Starting Privacy Gaming contract deployment...");

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("📝 Deploying contracts with the account:", deployer.address);

  // Check balance
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(balance), "ETH");

  if (balance < ethers.parseEther("0.1")) {
    console.warn("⚠️  Warning: Account balance is low. Make sure you have enough ETH for deployment.");
  }

  console.log("\n🔧 Deploying PrivacyGaming contract...");

  try {
    // Deploy the contract
    const PrivacyGamingFactory = await ethers.getContractFactory("PrivacyGaming");
    const privacyGaming: PrivacyGaming = await PrivacyGamingFactory.deploy();

    console.log("⏳ Waiting for deployment transaction...");
    await privacyGaming.waitForDeployment();

    const contractAddress = await privacyGaming.getAddress();
    console.log("✅ PrivacyGaming contract deployed successfully!");
    console.log("📍 Contract address:", contractAddress);

    // Get deployment transaction details
    const deploymentTx = privacyGaming.deploymentTransaction();
    if (deploymentTx) {
      console.log("🔗 Transaction hash:", deploymentTx.hash);
      console.log("⛽ Gas used:", deploymentTx.gasLimit.toString());
      console.log("💵 Gas price:", ethers.formatUnits(deploymentTx.gasPrice || 0, "gwei"), "gwei");
    }

    console.log("\n🔍 Verifying contract deployment...");

    // Verify the contract is deployed correctly
    const code = await ethers.provider.getCode(contractAddress);
    if (code === "0x") {
      throw new Error("❌ Contract deployment failed - no code at address");
    }

    console.log("✅ Contract code verified at address");

    // Test basic contract functionality
    console.log("\n🧪 Testing basic contract functionality...");

    try {
      // Test owner
      const owner = await privacyGaming.owner();
      console.log("👤 Contract owner:", owner);

      // Test contract balance
      const contractBalance = await privacyGaming.getContractBalance();
      console.log("💳 Contract balance:", ethers.formatEther(contractBalance), "ETH");

      // Test getting active games (should be empty initially)
      const activeGames = await privacyGaming.getActiveGames();
      console.log("🎮 Initial active games count:", activeGames[0].length);

      console.log("✅ All basic functionality tests passed!");

    } catch (testError) {
      console.warn("⚠️  Warning: Some functionality tests failed:", testError);
    }

    console.log("\n📋 Deployment Summary:");
    console.log("=======================");
    console.log("Contract Name: PrivacyGaming");
    console.log("Contract Address:", contractAddress);
    console.log("Network:", (await ethers.provider.getNetwork()).name);
    console.log("Chain ID:", (await ethers.provider.getNetwork()).chainId);
    console.log("Deployer:", deployer.address);
    console.log("Block Number:", await ethers.provider.getBlockNumber());

    console.log("\n🎉 Deployment completed successfully!");
    console.log("\n📝 Next Steps:");
    console.log("1. Update your frontend with the new contract address");
    console.log("2. Fund the deployer account if needed for testing");
    console.log("3. Create some test game rooms");
    console.log("4. Verify contract on Etherscan (if on testnet/mainnet)");

    // Return deployment info for potential use
    return {
      contract: privacyGaming,
      address: contractAddress,
      owner: deployer.address,
      transactionHash: deploymentTx?.hash
    };

  } catch (error) {
    console.error("❌ Deployment failed:", error);

    if (error instanceof Error) {
      // Provide helpful error messages for common issues
      if (error.message.includes("insufficient funds")) {
        console.log("\n💡 Solution: Add more ETH to your deployer account");
      } else if (error.message.includes("nonce")) {
        console.log("\n💡 Solution: Try resetting your MetaMask account or wait for network sync");
      } else if (error.message.includes("gas")) {
        console.log("\n💡 Solution: Try increasing gas limit or gas price");
      } else if (error.message.includes("network")) {
        console.log("\n💡 Solution: Check your network connection and RPC URL");
      }
    }

    process.exit(1);
  }
}

// Execute deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("💥 Unexpected error during deployment:", error);
    process.exit(1);
  });