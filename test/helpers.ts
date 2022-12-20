import { BigNumber, Signer, BigNumberish, BytesLike } from "ethers";
import { ethers, network } from "hardhat";
import {
  InstantAggregator__factory,
  LiquidityPool__factory,
  Market__factory,
  MockToken__factory,
  Router__factory,
} from "../typechain-types";

const { utils, constants } = ethers;

export type OpenPosition = {
  priceFeed: string;
  duration: BigNumberish;
  isCall: boolean;
  deposit: BigNumberish;
};

export type PushRound = {
  address: string;
  timestamp: BigNumberish;
  answer: BigNumberish;
};

export type ContractOpenPosition = [
  string,
  BigNumberish,
  boolean,
  BigNumberish,
];

export function openPositionToArray(
  position: OpenPosition,
): ContractOpenPosition {
  return [
    position.priceFeed,
    position.duration,
    position.isCall,
    position.deposit,
  ];
}

export function signAggregatorUpdate(
  signer: Signer,
  roundArgs: PushRound,
): Promise<string> {
  const bytes = utils.solidityPack(
    ["address", "uint256", "int256"],
    [roundArgs.address, roundArgs.timestamp, roundArgs.answer],
  );
  const hash = utils.keccak256(bytes);
  return signer.signMessage(utils.arrayify(hash));
}

export function bn(n: BigNumberish, decimals = 0) {
  return BigNumber.from(n).mul(BigNumber.from(10).pow(decimals));
}

export function bn18(n: BigNumberish) {
  return BigNumber.from(n).mul(constants.WeiPerEther);
}

export type TemplateContracts = Awaited<ReturnType<typeof deployAll>>;

export async function deployAll() {
  const signers = await ethers.getSigners();
  const deployer = signers[0];
  const Token = await new MockToken__factory(deployer).deploy();
  const LiquidityPool = await new LiquidityPool__factory(deployer).deploy(
    Token.address,
  );
  const Market = Market__factory.connect(
    await LiquidityPool.market(),
    deployer,
  );
  await Market.setFeeReceiver(deployer.address);
  await Market.setSigner(deployer.address);
  await Market.setPriceExpiryThreshold(60);
  await Market.setDurationMultiplier(5 * 60, utils.parseEther("1.9"));

  const aggregator = await new InstantAggregator__factory(deployer).deploy(
    8,
    "ETH/USD",
    1,
  );
  await Market.setEnabledAggregator(aggregator.address, true);

  const Router = await new Router__factory(deployer).deploy(Market.address);

  return {
    signers,
    deployer,
    Token,
    LiquidityPool,
    Market,
    aggregator,
    Router,
  };
}

export function stringToBytes16(s: string) {
  return utils.hexZeroPad(utils.toUtf8Bytes(s), 16);
}

export async function timestamp(): Promise<number> {
  return (await ethers.provider.getBlock("latest")).timestamp;
}

export async function increaseTimestamp(t: number) {
  await network.provider.send("evm_increaseTime", [t]);
}

export function encodeContractOpenPosition(
  args: [...ContractOpenPosition],
): string {
  return ethers.utils.defaultAbiCoder.encode(
    ["address", "uint40", "bool", "uint256"],
    args,
  );
}

export function encodeUpdateAggregator(
  args: PushRound & {
    signature: BytesLike;
    acceptable: BigNumberish;
    isCall: boolean;
  },
) {
  return ethers.utils.defaultAbiCoder.encode(
    ["address[]", "uint256[]", "int256[]", "bytes[]", "int256[]", "bool[]"],
    [
      [args.address],
      [args.timestamp],
      [args.answer],
      [args.signature],
      [args.acceptable],
      [args.isCall],
    ],
  );
}
