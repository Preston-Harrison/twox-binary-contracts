import hre from "hardhat";
import {
  InstantAggregator__factory,
  LiquidityPool__factory,
} from "../typechain-types";
import verify from "./verify";

const TOKEN = "0x3e070fC39A1F2661F6DfD53EAB4EB6b9F19e57c7";

const { log } = console;

async function main() {
  const [signer] = await hre.ethers.getSigners();
  log("Deploying liquidity pool");
  const LiquidityPool = await new LiquidityPool__factory(signer).deploy(TOKEN);
  await LiquidityPool.deployed();
  log("Liquidity pool deployed to", LiquidityPool.address);
  const marketAddress = await LiquidityPool.market();
  log("Market deployed to", marketAddress);

  log("Deploying ETH/USD aggregator");
  const ethAggregator = await new InstantAggregator__factory(signer).deploy(
    8,
    "ETH/USD",
    1,
  );
  await ethAggregator.deployed();
  log("ETH/USD aggregator deployed to", ethAggregator.address);

  log("Deploying BTC/USD aggregator");
  const btcAggregator = await new InstantAggregator__factory(signer).deploy(
    8,
    "BTC/USD",
    1,
  );
  await btcAggregator.deployed();
  log("BTC/USD aggregator deployed to", btcAggregator.address);

  log("Verifying in 30 seconds");
  await new Promise<void>((r) => setTimeout(r, 30_000));

  await verify(LiquidityPool.address, [TOKEN]);
  await verify(marketAddress, [LiquidityPool.address]);
  await verify(ethAggregator.address, [8, "ETH/USD", 1]);
  await verify(btcAggregator.address, [8, "BTC/USD", 1]);
}

main().catch(console.error);
