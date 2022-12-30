import { ERC20__factory, Market__factory } from "../typechain-types";
import hre from "hardhat";
import { createAggregator, getDefaultParams } from "./createAggregator";

const TOKEN = "0x3e070fC39A1F2661F6DfD53EAB4EB6b9F19e57c7";

const PAIRS = [
  // "ETH/USD",
  // "BTC/USD",
  "XRP/USD",
  "SOL/USD",
  "MATIC/USD",
  "BNB/USD",
  "AVAX/USD",
  "LINK/USD",
  "UNI/USD",
];

async function main() {
  const [signer] = await hre.ethers.getSigners();
  const Market = Market__factory.connect(process.env.MARKET!, signer);
  const Token = ERC20__factory.connect(TOKEN, signer);
  const decimals = await Token.decimals();

  for (const p of PAIRS) {
    const Aggregator = await createAggregator(
      signer,
      p,
      Market,
      getDefaultParams(decimals),
    );
    console.log(p, Aggregator.address);
  }
}

main().catch(console.error);
