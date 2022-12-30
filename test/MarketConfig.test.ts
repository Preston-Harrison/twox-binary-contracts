import { expect } from "chai";
import { TemplateContracts, deployAll } from "./helpers";
import { MockAggregatorV3__factory } from "../typechain-types";

describe("Market Config", () => {
  let contracts: TemplateContracts;

  beforeEach(async () => {
    contracts = await deployAll();
  });

  it("should revert on invalid config", async () => {
    await expect(
      contracts.Market.setAggregatorConfig(
        contracts.aggregator.address,
        0,
        0,
        1,
        2,
        0,
        0,
        true,
      ),
    ).to.be.revertedWith("Invalid payout multiplier");

    await expect(
      contracts.Market.setAggregatorConfig(
        contracts.aggregator.address,
        0,
        2.1 * +(await contracts.Market.PRECISION()),
        1,
        2,
        0,
        0,
        true,
      ),
    ).to.be.revertedWith("Invalid payout multiplier");

    await expect(
      contracts.Market.setAggregatorConfig(
        contracts.aggregator.address,
        0,
        1.5 * +(await contracts.Market.PRECISION()),
        2,
        1,
        0,
        0,
        true,
      ),
    ).to.be.revertedWith("Min duration over max");

    await expect(
      contracts.Market.setAggregatorConfig(
        contracts.aggregator.address,
        0,
        1.5 * +(await contracts.Market.PRECISION()),
        1,
        2,
        0,
        +(await contracts.Market.PRECISION()) + 1,
        true,
      ),
    ).to.be.revertedWith("Invalid fee fraction");
  });

  it("should revert if non admins change config", async () => {
    await expect(
      contracts.Market.connect(contracts.signers[1]).setAggregatorConfig(
        contracts.aggregator.address,
        0,
        1.5 * +(await contracts.Market.PRECISION()),
        1,
        2,
        0,
        0,
        true,
      ),
    ).to.be.revertedWith("Ownable: caller is not the owner");
    await expect(
      contracts.Market.connect(contracts.signers[1]).setAggregatorConfig(
        contracts.aggregator.address,
        0,
        1.5 * +(await contracts.Market.PRECISION()),
        1,
        2,
        0,
        0,
        true,
      ),
    ).to.be.revertedWith("Ownable: caller is not the owner");
    await expect(
      contracts.Market.connect(contracts.signers[1]).setFeeReceiver(
        contracts.signers[1].address,
      ),
    ).to.be.revertedWith("Ownable: caller is not the owner");
  });

  it("should not let non admins access role methods", async () => {
    const { Market, signers } = contracts;

    await expect(
      Market.connect(signers[1]).setSigner(signers[1].address),
    ).to.be.revertedWith("Ownable: caller is not the owner");
  });

  it("should only allow aggregators with 8 decimals to be enabled", async () => {
    const { deployer, Market } = contracts;
    const agg = await new MockAggregatorV3__factory(deployer).deploy(9);
    await expect(
      Market.setAggregatorConfig(agg.address, 0, 20_000, 1, 2, 0, 0, true),
    ).to.be.revertedWith("Aggregator decimals must be 8");

    // should not revert regardless of decimals
    await expect(
      Market.setAggregatorConfig(agg.address, 0, 20_000, 1, 2, 0, 0, false),
    ).to.not.be.reverted;
  });

  it("should only allow the owner to pause", async () => {
    const { Market, signers } = contracts;
    const user = signers[1];
    await expect(Market.pause()).to.not.be.reverted;
    await expect(Market.unpause()).to.not.be.reverted;

    await expect(Market.unpause()).to.be.revertedWith("Pausable: not paused");
    await Market.pause();
    await expect(Market.pause()).to.be.revertedWith("Pausable: paused");
    await Market.unpause();

    await expect(Market.connect(user).pause()).to.be.revertedWith(
      "Ownable: caller is not the owner",
    );
    await Market.pause();
    await expect(Market.connect(user).unpause()).to.be.revertedWith(
      "Ownable: caller is not the owner",
    );
  });
});
