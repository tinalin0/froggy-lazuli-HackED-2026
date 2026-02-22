const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  const SettlementLedger = await hre.ethers.getContractFactory("SettlementLedger");
  // Lower gas so deploy fits in typical faucet balance (0.1 MATIC)
  const deployOpts = {
    gasLimit: 2_000_000,
    maxFeePerGas: 40n * 10n ** 9n,   // 40 gwei
    maxPriorityFeePerGas: 30n * 10n ** 9n,
  };
  const ledger = await SettlementLedger.deploy(deployOpts);
  await ledger.waitForDeployment();
  const address = await ledger.getAddress();
  console.log("SettlementLedger deployed to:", address);

  const deploymentsDir = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(deploymentsDir)) fs.mkdirSync(deploymentsDir, { recursive: true });

  const artifactPath = path.join(
    __dirname,
    "..",
    "artifacts",
    "contracts",
    "SettlementLedger.sol",
    "SettlementLedger.json"
  );
  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));

  const amoyPath = path.join(deploymentsDir, "amoy.json");
  const amoy = {
    chainId: 80002,
    contractAddress: address,
    abi: artifact.abi,
  };
  fs.writeFileSync(amoyPath, JSON.stringify(amoy, null, 2));
  console.log("Wrote", amoyPath);

  const srcAbiPath = path.join(__dirname, "..", "src", "abi", "SettlementLedger.json");
  const srcAbiDir = path.dirname(srcAbiPath);
  if (!fs.existsSync(srcAbiDir)) fs.mkdirSync(srcAbiDir, { recursive: true });
  fs.writeFileSync(srcAbiPath, JSON.stringify(artifact.abi, null, 2));
  console.log("Wrote", srcAbiPath);

  console.log("\nAdd to .env:");
  console.log("VITE_SETTLEMENT_LEDGER_ADDRESS=" + address);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
