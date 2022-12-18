import { task } from "hardhat/config";

task("balance", "Prints an account's balance")
  .addParam("account", "The account's address")
  .setAction(async (args, hre) => {
    const balance = await hre.ethers.provider.getBalance(args.account);

    console.log(hre.ethers.utils.formatEther(balance), "ETH");
  });