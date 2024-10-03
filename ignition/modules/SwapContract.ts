import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import * as dotenv from "dotenv";

dotenv.config(); // Load environment variables from .env file

const TokenSwapModule = buildModule("TokenSwapModule", (m) => {
  // Get the owner address from environment variables
  const ownerAddress = process.env.OWNER_ADDRESS;

  if (!ownerAddress) {
    throw new Error("Owner address is required. Please set OWNER_ADDRESS in your environment.");
  }

  // Deploy the TokenSwap contract with the owner address
  const tokenSwap = m.contract("TokenSwap", [ownerAddress]);

  return { tokenSwap };
});

export default TokenSwapModule;
