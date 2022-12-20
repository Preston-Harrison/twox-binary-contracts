import { expect } from "chai";
import {
  OpenPosition,
  PushRound,
  TemplateContracts,
  bn,
  deployAll,
  encodeContractOpenPosition,
  encodeUpdateAggregator,
  increaseTimestamp,
  openPositionToArray,
  signAggregatorUpdate,
  timestamp,
} from "./helpers";

describe("Market.sol", () => {
  let contracts: TemplateContracts;

  beforeEach(async () => {
    contracts = await deployAll();
  });

  it("open & close a position, and win", async () => {
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

    await increaseTimestamp(5 * 60);

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

    await contracts.Router.updateAggregatorsAndClose(encodedAggregator2, [1]);
    expect(await contracts.Token.balanceOf(user.address)).eq(bn(19, 18));
  });

  it("open & close a position, and close", async () => {
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

    await increaseTimestamp(5 * 60);

    const round2: PushRound = {
      address: contracts.aggregator.address,
      timestamp: await timestamp(),
      answer: bn(1900, 8),
    };
    const signature2 = await signAggregatorUpdate(contracts.deployer, round2);
    const encodedAggregator2 = encodeUpdateAggregator({
      ...round2,
      signature: signature2,
      acceptable: bn(1900, 8),
      isCall: true,
    });

    await contracts.Router.updateAggregatorsAndClose(encodedAggregator2, [1]);
    expect(await contracts.Token.balanceOf(user.address)).eq(0);
  });
});
