// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.16;

import "./Market/Market.sol";
import "./InstantAggregator.sol";
import "@openzeppelin/contracts/interfaces/IERC721.sol";

contract Router {
  Market public immutable market;

  constructor(address market_) {
    market = Market(market_);
    market.asset().approve(market_, type(uint256).max);
  }

  function updateAggregatorsAndOpen(
    bytes calldata aggregatorParams,
    bytes calldata openParams
  ) external {
    decodeAndUpdateAggregators(aggregatorParams);
    decodeAndOpen(openParams);
  }

  function updateAggregatorsAndClose(
    bytes calldata aggregatorParams,
    uint256[] calldata ids
  ) external {
    decodeAndUpdateAggregators(aggregatorParams);
    for (uint256 i = 0; i < ids.length; i++) {
      market.close(ids[i]);
    }
  }

  function decodeAndOpen(bytes calldata openParams) internal {
    (address priceFeed, uint40 duration, bool isCall, uint256 deposit) = abi
      .decode(openParams, (address, uint40, bool, uint256));
    market.asset().transferFrom(msg.sender, address(this), deposit);
    market.open(priceFeed, duration, isCall, deposit, msg.sender);
  }

  function decodeAndUpdateAggregators(bytes calldata aggregatorParams) public {
    (
      address[] memory aggregators,
      uint256[] memory timestamps,
      int256[] memory answers,
      bytes[] memory signatures,
      int256[] memory acceptableAnswers,
      bool[] memory isCalls
    ) = abi.decode(
        aggregatorParams,
        (address[], uint256[], int256[], bytes[], int256[], bool[])
      );

    require(
      aggregators.length == timestamps.length &&
        timestamps.length == answers.length &&
        answers.length == signatures.length &&
        signatures.length == acceptableAnswers.length,
      "Invalid aggregator array lengths"
    );

    for (uint256 i = 0; i < aggregators.length; i++) {
      InstantAggregator aggregator = InstantAggregator(aggregators[i]);
      int256 actualAnswer = aggregator.pushRound(
        aggregators[i],
        timestamps[i],
        answers[i],
        signatures[i]
      );
      bool isValid = isCalls[i]
        ? actualAnswer <= acceptableAnswers[i]
        : actualAnswer >= acceptableAnswers[i];
      require(isValid, "Actual answer not acceptable");
    }
  }
}
