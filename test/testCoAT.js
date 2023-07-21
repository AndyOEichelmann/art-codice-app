const { expect } = require("chai");
const { loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { ethers } = require("hardhat");

describe("Test CoA token", function () {
    const tokenURI = "ipfs://baseTokenURI/";
    const baseAURI = "ipfs://baseTokenAuthentificationURI/";

    async function deployTestCoAFixture() {
        // Contracts are deployed using the first signer/account by default
        const [owner, account1, account2] = await ethers.getSigners();

        // deply CoA nft contract
        const TestCoA = await ethers.getContractFactory("TestCoAToken");
        const testCoA = await TestCoA.deploy(tokenURI);

        return {testCoA, owner, account1, account2}
    }

    describe("Deply TestCoAToken contact & test basic functions", async function() {
        it("sould mint a token the deployer", async function(){
            const { testCoA , owner} = await loadFixture(deployTestCoAFixture);
            
            const toAddr = owner.address;
            const value = 500;
            const currency = "usd";
            const artist = "Jhon Dowe"
            const authURI = `${baseAURI}painting1`

            let currencyBytes4 = ethers.hexlify(ethers.toUtf8Bytes(currency));
            if(currencyBytes4.length != 10){
                for(i = currencyBytes4.length; i < 10; i++){
                    currencyBytes4 = currencyBytes4 + '0';
                }
            }

            const artistBytes32 = ethers.encodeBytes32String(artist);

            expect(await testCoA.safeMint(toAddr, value, currencyBytes4, artistBytes32, authURI)).to.emit(testCoA, 'TokenMint');
        });

        it("sould revert mint of a token", async function(){
            const { testCoA , account1} = await loadFixture(deployTestCoAFixture);
            
            const toAddr = account1.address;
            const value = 500;
            const currency = "usd";
            const artist = "Jhon Dowe"
            const authURI = `${baseAURI}painting1`

            let currencyBytes4 = ethers.hexlify(ethers.toUtf8Bytes(currency));
            if(currencyBytes4.length != 10){
                for(i = currencyBytes4.length; i < 10; i++){
                    currencyBytes4 = currencyBytes4 + '0';
                }
            }

            const artistBytes32 = ethers.encodeBytes32String(artist);

            await expect (testCoA.connect(account1).safeMint(toAddr, value, currencyBytes4, artistBytes32, authURI)).to.be.revertedWith(/AccessControl: account .* is missing role .*/);
        });

        it("shoould grant mint roll to account1, the new minter mints a token", async function () {
            const { testCoA , account1} = await loadFixture(deployTestCoAFixture);

            // grant roll
            const roleMint = await testCoA.MINTER_ROLE();
            expect(await testCoA.grantRole(roleMint, account1.address)).to.emit(testCoA, 'RoleGranted');

            // mint token
            const toAddr = account1.address;
            const value = 500;
            const currency = "usd";
            const artist = "Jhon Dowe"
            const authURI = `${baseAURI}painting1`

            let currencyBytes4 = ethers.hexlify(ethers.toUtf8Bytes(currency));
            if(currencyBytes4.length != 10){
                for(i = currencyBytes4.length; i < 10; i++){
                    currencyBytes4 = currencyBytes4 + '0';
                }
            }

            const artistBytes32 = ethers.encodeBytes32String(artist);

            expect (await testCoA.connect(account1).safeMint(toAddr, value, currencyBytes4, artistBytes32, authURI)).to.emit(testCoA, 'TokenMint').withArgs(toAddr, 0, artist, value, currency);
        });

        it("mints a token to account1,  aprove operatior to account2, the approved operator transfers the token", async function () {
            const { testCoA , owner, account1, account2} = await loadFixture(deployTestCoAFixture);

            // mint token
            const toAddr = account1.address;
            const value = 500;
            const currency = "usd";
            const artist = "Jhon Dowe"
            const authURI = `${baseAURI}painting1`

            let currencyBytes4 = ethers.hexlify(ethers.toUtf8Bytes(currency));
            if(currencyBytes4.length != 10){
                for(i = currencyBytes4.length; i < 10; i++){
                    currencyBytes4 = currencyBytes4 + '0';
                }
            }

            const artistBytes32 = ethers.encodeBytes32String(artist);

            expect (await testCoA.safeMint(toAddr, value, currencyBytes4, artistBytes32, authURI)).to.emit(testCoA, 'TokenMint').withArgs(toAddr, 0, artist, value, currency);

            // approve operator for all
            const operatior = account2.address;

            expect(await testCoA.connect(account1).setApprovalForAll(operatior, true)).to.emit(testCoA, 'ApprovalForAll').withArgs(account1.address, operatior, true);


            // tranfer token with value
            expect(await testCoA.connect(account2).safeValueTransferFrom(account1.address, owner.address, 0, 600)).to.emit(testCoA, 'ValueTransfer').withArgs(account1.address, owner.address, 0, 600, currency);
        });
    });

    describe("Retrive token informatiom", async function() { 
        it("should retive token infrmation", async function () {
            const { testCoA , owner} = await loadFixture(deployTestCoAFixture);
            
            // mint token
            const toAddr = owner.address;
            const value = 500;
            const currency = "usd";
            const artist = "Jhon Dowe"
            const authURI = `${baseAURI}painting1`

            let currencyBytes4 = ethers.hexlify(ethers.toUtf8Bytes(currency));
            if(currencyBytes4.length != 10){
                for(i = currencyBytes4.length; i < 10; i++){
                    currencyBytes4 = currencyBytes4 + '0';
                }
            }

            const artistBytes32 = ethers.encodeBytes32String(artist);

            expect(await testCoA.safeMint(toAddr, value, currencyBytes4, artistBytes32, authURI)).to.emit(testCoA, 'TokenMint');

            // retive token information
            const tokenInfo = await testCoA.tokenInfo(0);
            expect(tokenInfo.tokenURI).to.equal(`${tokenURI}0`);
        });

        it("should revert token infrmation retrival", async function () {
            const { testCoA , owner} = await loadFixture(deployTestCoAFixture);
            
            // mint token
            const toAddr = owner.address;
            const value = 500;
            const currency = "usd";
            const artist = "Jhon Dowe"
            const authURI = `${baseAURI}painting1`

            let currencyBytes4 = ethers.hexlify(ethers.toUtf8Bytes(currency));
            if(currencyBytes4.length != 10){
                for(i = currencyBytes4.length; i < 10; i++){
                    currencyBytes4 = currencyBytes4 + '0';
                }
            }

            const artistBytes32 = ethers.encodeBytes32String(artist);

            expect(await testCoA.safeMint(toAddr, value, currencyBytes4, artistBytes32, authURI)).to.emit(testCoA, 'TokenMint');

            // retive token information
            await expect(testCoA.tokenInfo(1)).to.be.rejectedWith("ERC721: invalid token ID");
        });

        it("should grant authenticator roll, and retrive authenticate token uri", async function () {
            const { testCoA , owner, account1} = await loadFixture(deployTestCoAFixture);

            // grant roll
            const roleAuthenticator = await testCoA.AUTHENTICATOR_ROLE();
            expect(await testCoA.grantRole(roleAuthenticator, account1.address)).to.emit(testCoA, 'RoleGranted');

            // mint token
            const toAddr = owner.address;
            const value = 500;
            const currency = "usd";
            const artist = "Jhon Dowe"
            const authURI = `${baseAURI}painting1`

            let currencyBytes4 = ethers.hexlify(ethers.toUtf8Bytes(currency));
            if(currencyBytes4.length != 10){
                for(i = currencyBytes4.length; i < 10; i++){
                    currencyBytes4 = currencyBytes4 + '0';
                }
            }

            const artistBytes32 = ethers.encodeBytes32String(artist);

            expect(await testCoA.safeMint(toAddr, value, currencyBytes4, artistBytes32, authURI)).to.emit(testCoA, 'TokenMint');

            // retrive authenticate token uri
            const authenticateURI = await testCoA.connect(account1).authnticateToken(0);
            expect(authenticateURI).to.equal(authURI);
        });

        it("should fail to request authentification uri, recive token & succide request token authentification uri", async function () {
            const { testCoA , owner, account1} = await loadFixture(deployTestCoAFixture);

            // mint token
            const toAddr = owner.address;
            const value = 500;
            const currency = "usd";
            const artist = "Jhon Dowe"
            const authURI = `${baseAURI}painting1`

            let currencyBytes4 = ethers.hexlify(ethers.toUtf8Bytes(currency));
            if(currencyBytes4.length != 10){
                for(i = currencyBytes4.length; i < 10; i++){
                    currencyBytes4 = currencyBytes4 + '0';
                }
            }

            const artistBytes32 = ethers.encodeBytes32String(artist);

            expect(await testCoA.safeMint(toAddr, value, currencyBytes4, artistBytes32, authURI)).to.emit(testCoA, 'TokenMint');

            // retrive authenticate token uri
            await expect(testCoA.connect(account1).authnticateToken(0)).to.revertedWith('ERC721CoA: must be owner or registered authenticator')

            // tranfer token with value
            expect(await testCoA.safeValueTransferFrom(owner.address, account1.address, 0, 600)).to.emit(testCoA, 'ValueTransfer').withArgs(account1.address, owner.address, 0, 600, currency);


            // retry retrive authenticate token uri
            const authenticateURI = await testCoA.connect(account1).authnticateToken(0);
            expect(authenticateURI).to.equal(authURI);
        });
    });

    describe("Retrive event hystory", async function() {
        
    });
});