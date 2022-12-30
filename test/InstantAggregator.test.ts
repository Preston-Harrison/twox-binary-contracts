import { expect } from "chai";
import { TemplateContracts, deployAll, timestamp } from "./helpers";
import { ethers } from "ethers";

const randomSig =
  "0xec61566959a1c51ce25b45fb2843222080864fb07261f8da18a88dfd067de8843ca279e3306b555dd5c6b98848b6c15280a85390bc27aa19e61fa02080de0b5c1b";

describe("LiquidityPool.sol", () => {
  let contracts: TemplateContracts;

  beforeEach(async () => {
    contracts = await deployAll();
  });

  it("should not allow prices to be set in the future", async () => {
    const { aggregator } = contracts;
    const t = await timestamp();
    await expect(
      aggregator.pushRound(aggregator.address, t + 100, 2000 * 1e8, "0x00"),
    ).to.be.revertedWith("Timestamp > block.timestamp");
  });

  it("should not allow prices for different aggregators to be set", async () => {
    const { aggregator } = contracts;
    const t = await timestamp();
    await expect(
      aggregator.pushRound(
        ethers.Wallet.createRandom().address,
        t,
        2000 * 1e8,
        randomSig,
      ),
    ).to.be.revertedWith("Invalid aggregator");
  });

  it("should not allow prices with invalid signatures to be set", async () => {
    const { aggregator } = contracts;
    const t = await timestamp();
    await expect(
      aggregator.pushRound(aggregator.address, t, 2000 * 1e8, randomSig),
    ).to.be.revertedWith("Invalid signature");
  });
});
