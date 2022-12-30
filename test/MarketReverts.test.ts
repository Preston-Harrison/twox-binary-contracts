import { expect } from "chai";
import {
  TemplateContracts,
  bn,
  deployAll,
  increaseTimestamp,
  signAggregatorUpdate,
  timestamp,
  OpenPosition,
  PushRound,
  encodeUpdateAggregator,
  encodeContractOpenPosition,
  openPositionToArray,
} from "./helpers";
import { ethers } from "hardhat";

describe("Market Reverts", () => {
  let contracts: TemplateContracts;

  beforeEach(async () => {
    contracts = await deployAll();
  });

  it("should not allow old timestamps", async () => {
    const { aggregator, Market, deployer } = contracts;
    const user = contracts.signers[1];
    const t = await timestamp();
    await aggregator.pushRound(
      aggregator.address,
      t,
      2000 * 1e8,
      await signAggregatorUpdate(deployer, {
        address: aggregator.address,
        answer: 2000 * 1e8,
        timestamp: t,
      }),
    );

    await increaseTimestamp(60);

    await contracts.Token.mint(contracts.LiquidityPool.address, bn(1000, 18));
    await contracts.Token.mint(user.address, bn(10, 18));
    await contracts.Token.connect(user).approve(Market.address, bn(10, 18));

    await expect(
      Market.open(aggregator.address, 5 * 60, true, bn(10, 18), user.address),
    ).to.be.revertedWith("Price too old");
  });

  it("should not perform actions when paused", async () => {
    const { aggregator, Market } = contracts;
    const user = contracts.signers[1];

    await Market.pause();
    await expect(
      Market.open(aggregator.address, 5 * 60, true, bn(10, 18), user.address),
    ).to.be.revertedWith("Pausable: paused");
    await expect(Market.close(1)).to.be.revertedWith("Pausable: paused");
  });

  it("should not close positions that have not expired", async () => {
    const user = contracts.signers[1];
    await contracts.Token.mint(contracts.LiquidityPool.address, bn(1000, 18));
    await contracts.Token.mint(user.address, bn(10, 18));
    await contracts.Token.connect(user).approve(
      contracts.Router.address,
      bn(10, 18),
    );

    const position: OpenPosition = {
      deposit: bn(10, 18),
      duration: 5 * 60,
      isCall: true,
      priceFeed: contracts.aggregator.address,
    };
    const round: PushRound = {
      address: contracts.aggregator.address,
      timestamp: await timestamp(),
      answer: bn(2000, 8),
    };
    const signature = await signAggregatorUpdate(contracts.deployer, round);
    const encodedAggregator = encodeUpdateAggregator({
      ...round,
      signature,
      acceptable: bn(2000, 8),
      isCall: true,
    });
    await contracts.Router.connect(user).updateAggregatorsAndOpen(
      encodedAggregator,
      encodeContractOpenPosition(openPositionToArray(position)),
    );

    const round2: PushRound = {
      address: contracts.aggregator.address,
      timestamp: await timestamp(),
      answer: bn(2100, 8),
    };
    const signature2 = await signAggregatorUpdate(contracts.deployer, round2);
    const encodedAggregator2 = encodeUpdateAggregator({
      ...round2,
      signature: signature2,
      acceptable: bn(2100, 8),
      isCall: true,
    });

    await expect(
      contracts.Router.updateAggregatorsAndClose(encodedAggregator2, [1]),
    ).to.be.revertedWith("Option has not expired");
  });

  it("should not close closed positions", async () => {
    const user = contracts.signers[1];
    await contracts.Token.mint(contracts.LiquidityPool.address, bn(1000, 18));
    await contracts.Token.mint(user.address, bn(10, 18));
    await contracts.Token.connect(user).approve(
      contracts.Router.address,
      bn(10, 18),
    );

    const position: OpenPosition = {
      deposit: bn(10, 18),
      duration: 5 * 60,
      isCall: true,
      priceFeed: contracts.aggregator.address,
    };
    const round: PushRound = {
      address: contracts.aggregator.address,
      timestamp: await timestamp(),
      answer: bn(2000, 8),
    };
    const signature = await signAggregatorUpdate(contracts.deployer, round);
    const encodedAggregator = encodeUpdateAggregator({
      ...round,
      signature,
      acceptable: bn(2000, 8),
      isCall: false,
    });
    await contracts.Router.connect(user).updateAggregatorsAndOpen(
      encodedAggregator,
      encodeContractOpenPosition(openPositionToArray(position)),
    );

    const round2: PushRound = {
      address: contracts.aggregator.address,
      timestamp: (await timestamp()) + 5 * 60,
      answer: bn(2100, 8),
    };
    const signature2 = await signAggregatorUpdate(contracts.deployer, round2);
    const encodedAggregator2 = encodeUpdateAggregator({
      ...round2,
      signature: signature2,
      acceptable: bn(2100, 8),
      isCall: false,
    });

    await increaseTimestamp(5 * 60);
    await contracts.Router.updateAggregatorsAndClose(encodedAggregator2, [1]);
    await expect(
      contracts.Router.updateAggregatorsAndClose(encodedAggregator2, [1]),
    ).to.be.revertedWith("Option is not open");
  });

  it("should not open with invalid duration", async () => {
    const user = contracts.signers[1];
    await contracts.Token.mint(contracts.LiquidityPool.address, bn(1000, 18));
    await contracts.Token.mint(user.address, bn(10, 18));
    await contracts.Token.connect(user).approve(
      contracts.Router.address,
      bn(10, 18),
    );
    {
      const position: OpenPosition = {
        deposit: bn(10, 18),
        duration: 0,
        isCall: true,
        priceFeed: contracts.aggregator.address,
      };
      const round: PushRound = {
        address: contracts.aggregator.address,
        timestamp: await timestamp(),
        answer: bn(2000, 8),
      };
      const signature = await signAggregatorUpdate(contracts.deployer, round);
      const encodedAggregator = encodeUpdateAggregator({
        ...round,
        signature,
        acceptable: bn(2000, 8),
        isCall: false,
      });
      await expect(
        contracts.Router.connect(user).updateAggregatorsAndOpen(
          encodedAggregator,
          encodeContractOpenPosition(openPositionToArray(position)),
        ),
      ).to.be.revertedWith("Duration out of bounds");
    }

    const position: OpenPosition = {
      deposit: bn(10, 18),
      duration: 6 * 60,
      isCall: true,
      priceFeed: contracts.aggregator.address,
    };
    const round: PushRound = {
      address: contracts.aggregator.address,
      timestamp: await timestamp(),
      answer: bn(2000, 8),
    };
    const signature = await signAggregatorUpdate(contracts.deployer, round);
    const encodedAggregator = encodeUpdateAggregator({
      ...round,
      signature,
      acceptable: bn(2000, 8),
      isCall: false,
    });
    await expect(
      contracts.Router.connect(user).updateAggregatorsAndOpen(
        encodedAggregator,
        encodeContractOpenPosition(openPositionToArray(position)),
      ),
    ).to.be.revertedWith("Duration out of bounds");
  });

  it("should not open with invalid aggregator", async () => {
    const user = contracts.signers[1];
    await contracts.Token.mint(contracts.LiquidityPool.address, bn(1000, 18));
    await contracts.Token.mint(user.address, bn(10, 18));
    await contracts.Token.connect(user).approve(
      contracts.Router.address,
      bn(10, 18),
    );
    const randomAddress = ethers.Wallet.createRandom().address;
    await expect(
      contracts.Market.connect(user).open(
        randomAddress,
        0,
        false,
        0,
        user.address,
      ),
    ).to.be.revertedWith("Aggregator not enabled");
  });

  it("should not open with invalid deposit", async () => {
    const user = contracts.signers[1];
    await contracts.Token.mint(contracts.LiquidityPool.address, bn(1000, 18));
    await contracts.Token.mint(user.address, bn(10, 18));
    await contracts.Token.connect(user).approve(
      contracts.Router.address,
      bn(10, 18),
    );

    const position: OpenPosition = {
      deposit: bn(0.5, 18),
      duration: 5 * 60,
      isCall: true,
      priceFeed: contracts.aggregator.address,
    };
    const round: PushRound = {
      address: contracts.aggregator.address,
      timestamp: await timestamp(),
      answer: bn(2000, 8),
    };
    const signature = await signAggregatorUpdate(contracts.deployer, round);
    const encodedAggregator = encodeUpdateAggregator({
      ...round,
      signature,
      acceptable: bn(2000, 8),
      isCall: false,
    });
    await expect(
      contracts.Router.connect(user).updateAggregatorsAndOpen(
        encodedAggregator,
        encodeContractOpenPosition(openPositionToArray(position)),
      ),
    ).to.be.revertedWith("Deposit too small");
  });
});
