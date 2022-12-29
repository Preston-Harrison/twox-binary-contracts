import { utils } from "ethers";
import {
  OpenPosition,
  PushRound,
  TemplateContracts,
  bn,
  deployAll,
  encodeContractOpenPosition,
  encodeUpdateAggregator,
  openPositionToArray,
  signAggregatorUpdate,
  timestamp,
} from "./helpers";
import { expect } from "chai";

describe("LiquidityPool.sol", () => {
  let contracts: TemplateContracts;

  beforeEach(async () => {
    contracts = await deployAll();
  });

  it("should open with maximum reserves, and revert if its over the max", async () => {
    const user = contracts.signers[1];
    const { deployer } = contracts;
    await contracts.Token.mint(deployer.address, bn(1000, 18));
    await contracts.Token.approve(
      contracts.LiquidityPool.address,
      bn(1000, 18),
    );
    await contracts.LiquidityPool.deposit(bn(1000, 18), deployer.address);

    await contracts.LiquidityPool.setMaximumReserveFraction(
      utils.parseEther("0.1"),
    );
    await contracts.Market.setAggregatorConfig(
      contracts.aggregator.address,
      0,
      20_000,
      0,
      60 * 60,
      60,
      0,
      true,
    );

    await contracts.Token.mint(user.address, bn(1000, 18));
    await contracts.Token.connect(user).approve(
      contracts.Router.address,
      bn(1000, 18),
    );

    {
      const position: OpenPosition = {
        deposit: bn(52.633, 18),
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
      await expect(
        contracts.Router.connect(user).updateAggregatorsAndOpen(
          encodedAggregator,
          encodeContractOpenPosition(openPositionToArray(position)),
        ),
      ).to.be.revertedWith("Reserve fraction too great");
    }
    {
      const position: OpenPosition = {
        deposit: bn(52.631, 18),
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
    }
  });

  it("should not change anything if someone transfers to market", async () => {
    const user = contracts.signers[1];
    const { deployer } = contracts;
    await contracts.Token.mint(deployer.address, bn(1000, 18));
    await contracts.Token.approve(
      contracts.LiquidityPool.address,
      bn(1000, 18),
    );
    await contracts.LiquidityPool.deposit(bn(1000, 18), deployer.address);

    await contracts.LiquidityPool.setMaximumReserveFraction(
      utils.parseEther("0.1"),
    );
    await contracts.Market.setAggregatorConfig(
      contracts.aggregator.address,
      0,
      20_000,
      0,
      60 * 60,
      60,
      0,
      true,
    );

    await contracts.Token.mint(contracts.Market.address, bn(100, 18));

    await contracts.Token.mint(user.address, bn(1000, 18));
    await contracts.Token.connect(user).approve(
      contracts.Router.address,
      bn(1000, 18),
    );

    {
      const position: OpenPosition = {
        deposit: bn(52.633, 18),
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
      await expect(
        contracts.Router.connect(user).updateAggregatorsAndOpen(
          encodedAggregator,
          encodeContractOpenPosition(openPositionToArray(position)),
        ),
      ).to.be.revertedWith("Reserve fraction too great");
    }
    {
      const position: OpenPosition = {
        deposit: bn(52.631, 18),
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
    }
  });
});
