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

const { log } = console;

async function main() {
  const [signer] = await hre.ethers.getSigners();
  log("Deploying liquidity pool & market");
  const LiquidityPool = await new LiquidityPool__factory(signer).deploy(TOKEN);
  await LiquidityPool.deployed();
  const marketAddress = await LiquidityPool.market();

  const Market = Market__factory.connect(marketAddress, signer);
  await Market.setFeeReceiver(signer.getAddress());

  log("Deploying ETH/USD aggregator");
  const ethAggregator = await new InstantAggregator__factory(signer).deploy(
    8,
    "ETH/USD",
    1,
  );
  await ethAggregator.deployed();

  log("Deploying BTC/USD aggregator");
  const btcAggregator = await new InstantAggregator__factory(signer).deploy(
    8,
    "BTC/USD",
    1,
  );
  await btcAggregator.deployed();

  await Market.setAggregatorConfig(
    ethAggregator.address,
    utils.parseEther("1"),
    19_000,
    0,
    24 * 60 * 60,
    0,
    0.01 * 10_000,
    true,
  );
  await Market.setAggregatorConfig(
    btcAggregator.address,
    utils.parseEther("1"),
    19_000,
    0,
    24 * 60 * 60,
    0,
    0.01 * 10_000,
    true,
  );

  log("Deploying Router");
  const Router = await new Router__factory(signer).deploy(Market.address);
  await Router.deployed();

  log("Verifying in 30 seconds");
  await new Promise<void>((r) => setTimeout(r, 30_000));

  await verify(LiquidityPool.address, [TOKEN]);
  await verify(marketAddress, [LiquidityPool.address, TOKEN, signer.address]);
  await verify(ethAggregator.address, [8, "ETH/USD", 1]);
  await verify(btcAggregator.address, [8, "BTC/USD", 1]);
  await verify(Router.address, [Market.address]);

  console.log(`MARKET_ADDRESS=${Market.address}`);
  console.log(`LIQUIDITY_POOL_ADDRESS=${LiquidityPool.address}`);
  console.log(`ETH_AGGREGATOR_ADDRESS=${ethAggregator.address}`);
  console.log(`BTC_AGGREGATOR_ADDRESS=${btcAggregator.address}`);
  console.log(`ROUTER_ADDRESS=${Router.address}`);
}

main().catch(console.error);
