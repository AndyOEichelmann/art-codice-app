const { expect } = require("chai");
const { loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { ethers } = require("hardhat");

describe("Art Codice Intermediary", function () {
    const feePercentage = 1;

    const tokenURI = "ipfs://baseTokenURI/";
    const baseAURI = "ipfs://baseTokenAuthentificationURI/";

    async function deployTestContractsAFixture() {
        // Contracts are deployed using the first signer/account by default
        const [deployer, address1, address2, address3] = await ethers.getSigners();

        // deply Art Codice Interediary
        const ACInt = await ethers.getContractFactory("ERC721ACoA_Intermediary");
        const intermediary = await ACInt.deploy(feePercentage);

        // deply ACoA nft contract
        const ACoA = await ethers.getContractFactory("ERC721ACoA");
        const testACoA = await ACoA.deploy(tokenURI);

        return { intermediary, testACoA, deployer, address1, address2, address3 }
    }

    describe("Deployment", function () {
        it("should track name and symbol of nft collection", async function () {
            const {testACoA} = await loadFixture(deployTestContractsAFixture);

            expect(await testACoA.name()).to.equal("Art Certificate of Authenticity");
            expect(await testACoA.symbol()).to.equal("ACOA");
        });

        it("should track name and symbol of nft collection", async function () {
            const {intermediary, deployer} = await loadFixture(deployTestContractsAFixture);
            
            expect(await intermediary.feeAcount()).to.equal(deployer.address);
            expect(await intermediary.feePercent()).to.equal(feePercentage);
        });
    });
});