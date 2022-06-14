async function main() {
    // We get the contract to deploy
    const Factory = await ethers.getContractFactory("MultiSignWalletFactory");
    const factory = await Factory.deploy();

    await factory.deployed();

    console.log("Factory deployed to:", factory.address);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });