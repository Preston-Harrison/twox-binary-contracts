import hre from "hardhat";
import { Router__factory } from "../typechain-types";
import verify from "./verify";

const MARKET = "0xAF45ca951Afd9398967A9B86FC6309FEada5CB45";

const { log } = console;

async function main() {
  const [signer] = await hre.ethers.getSigners();
  log("Deploying Router");
  const Router = await new Router__factory(signer).deploy(MARKET);
  await Router.deployed();
  log("Deployed router to", Router.address);

  log("Verifying in 30 seconds");
  await new Promise<void>((r) => setTimeout(r, 30_000));

  await verify(Router.address, [MARKET]);
}

main().catch(console.error);
