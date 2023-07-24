const { expect } = require("chai");
const { loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { ethers } = require("hardhat");

describe("Test ACoA token contract", function () {
    const tokenURI = "ipfs://baseTokenURI/";
    const baseAURI = "ipfs://baseTokenAuthentificationURI/";

    async function deployTestACoAFixture() {
        // Contracts are deployed using the first signer/account by default
        const [owner, artist, collector1, collector2] = await ethers.getSigners();

        // deply CoA nft contract
        const ACoA = await ethers.getContractFactory("ERC721ACoA");
        const testACoA = await ACoA.deploy(tokenURI);

        return { testACoA, owner, artist, collector1, collector2 }
    }

    describe("MintTokens", async function () {
        
        it("artist should mint token and tranfer it to caollector twise", async function () {
            const { testACoA, artist, collector1, collector2 } = await loadFixture(deployTestACoAFixture);

            // grant roll
            const roleMint = await testACoA.MINTER_ROLE();
            expect(await testACoA.grantRole(roleMint, artist.address)).to.emit(testACoA, 'RoleGranted');

            // mint certificate token
            const toAddr = artist.address;
            const value = 500;
            const currency = "usd";
            const artistName = "Jhon Dowe"
            const objectName = "Painting No 1"
            const authURI = `${baseAURI}painting1`

            await expect (testACoA.connect(artist).safeMint(toAddr, value, currency, artistName, objectName, authURI)).to.emit(testACoA, 'Minted').withArgs(0, artistName, objectName);

            // transer certificate to a collector
            await expect (testACoA.connect(artist).safeTransferFromValue(artist.address, collector1.address, 0, 600)).to.emit(testACoA, 'NewValue');

            await expect (testACoA.connect(collector1).safeTransferFromValue(collector1.address, collector2.address, 0, 600)).to.emit(testACoA, 'Transfer');
        });

        it("collector should fail to transfer and the value mus not have changed", async function () {
            const { testACoA, artist, collector1, collector2 } = await loadFixture(deployTestACoAFixture);

            // grant roll
            const roleMint = await testACoA.MINTER_ROLE();
            expect(await testACoA.grantRole(roleMint, artist.address)).to.emit(testACoA, 'RoleGranted');

            // mint certificate token
            const toAddr = artist.address;
            const value = 500;
            const currency = "usd";
            const artistName = "Jhon Dowe"
            const objectName = "Painting No 1"
            const authURI = `${baseAURI}painting1`

            await expect (testACoA.connect(artist).safeMint(toAddr, value, currency, artistName, objectName, authURI)).to.emit(testACoA, 'Minted').withArgs(0, artistName, objectName);

            // transer certificate to a collector
            await expect (testACoA.connect(artist).safeTransferFromValue(artist.address, collector1.address, 0, 600)).to.emit(testACoA, 'NewValue');

            const newValue = 700;
            
            await expect (testACoA.connect(collector1).safeTransferFromValue(artist.address, collector2.address, 0, newValue)).to.be.reverted;

            // coper values to target value
            const tokenInfo = await testACoA.tokenInfo(0);
            expect(tokenInfo.value).to.not.equal(newValue);
        });

        it("should", async function () {
            
        })        
    });
});