import hre from "hardhat";
import {
  InstantAggregator__factory,
  LiquidityPool__factory,
  Market__factory,
  Router__factory,
} from "../typechain-types";
import verify from "./verify";
import { utils } from "ethers";

const TOKEN = "0x3e070fC39A1F2661F6DfD53EAB4EB6b9F19e57c7";
const MARKET = "0xAF45ca951Afd9398967A9B86FC6309FEada5CB45";

const { log } = console;

async function main() {
  const [signer] = await hre.ethers.getSigners();
  log("Deploying liquidity pool");
  const LiquidityPool = await new LiquidityPool__factory(signer).deploy(TOKEN);
  await LiquidityPool.deployed();
  log("Liquidity pool deployed to", LiquidityPool.address);
  const marketAddress = await LiquidityPool.market();
  log("Market deployed to", marketAddress);

  const Market = Market__factory.connect(marketAddress, signer);
  await Market.setDurationMultiplier(5 * 60, utils.parseEther("1.9"));
  await Market.setFeeReceiver(signer.getAddress());

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

  await Market.setEnabledAggregator(ethAggregator.address, true);
  await Market.setEnabledAggregator(btcAggregator.address, true);

  log("Deploying Router");
  const Router = await new Router__factory(signer).deploy(MARKET);
  await Router.deployed();
  log("Deployed router to", Router.address);

  log("Verifying in 30 seconds");
  await new Promise<void>((r) => setTimeout(r, 30_000));

  await verify(LiquidityPool.address, [TOKEN]);
  await verify(marketAddress, [LiquidityPool.address]);
  await verify(ethAggregator.address, [8, "ETH/USD", 1]);
  await verify(btcAggregator.address, [8, "BTC/USD", 1]);
  await verify(Router.address, [MARKET]);
}

main().catch(console.error);
