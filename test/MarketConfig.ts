import { expect } from "chai";
import { TemplateContracts, deployAll } from "./helpers";

describe("MarketConfig.sol", () => {
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
    ).to.be.revertedWith("Unauthorized caller");
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
    ).to.be.revertedWith("Unauthorized caller");
    await expect(
      contracts.Market.connect(contracts.signers[1]).setFeeReceiver(
        contracts.signers[1].address,
      ),
    ).to.be.revertedWith("Unauthorized caller");
  });

  it("should not let non admins access role methods", async () => {
    const { Market, signers } = contracts;

    await expect(
      Market.connect(signers[1]).transferAdmin(signers[1].address),
    ).to.be.revertedWith("Unauthorized caller");
    await expect(
      Market.connect(signers[1]).setSigner(signers[1].address),
    ).to.be.revertedWith("Unauthorized caller");
  });
});
