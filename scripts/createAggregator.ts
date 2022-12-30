import { BigNumber, Signer, utils } from "ethers";
import { InstantAggregator__factory, Market } from "../typechain-types";

export const getDefaultParams = (usdDecimals: number) => ({
  feeFraction: BigNumber.from(0.01 * 10_000),
  maximumDuration: BigNumber.from(24 * 60 * 60),
  minimumDeposit: utils.parseUnits("1", usdDecimals),
  minimumDuration: BigNumber.from(15 * 60),
  payoutMultiplier: BigNumber.from(1.9 * 10_000),
  priceExpiryThreshold: BigNumber.from(60),
});

export type AggregatorConfig = {
  minimumDeposit: BigNumber;
  payoutMultiplier: BigNumber;
  minimumDuration: BigNumber;
  maximumDuration: BigNumber;
  priceExpiryThreshold: BigNumber;
  feeFraction: BigNumber;
};

export async function createAggregator(
  signer: Signer,
  pair: string,
  market: Market,
  params: AggregatorConfig,
) {
  const Aggregator = await new InstantAggregator__factory(signer).deploy(
    8,
    pair,
    1,
  );
  await Aggregator.deployed();
  await market.setAggregatorConfig(
    Aggregator.address,
    params.minimumDeposit,
    params.payoutMultiplier,
    params.minimumDuration,
    params.maximumDuration,
    params.priceExpiryThreshold,
    params.feeFraction,
    true,
  );
  return Aggregator;
}
