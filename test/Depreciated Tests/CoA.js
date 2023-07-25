const { expect } = require("chai");
const { loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { ethers } = require("hardhat");

describe("Certificate of Authenticity", function () {
    const tokenURI = "ipfs://baseTokenURI/";
    const authentificationURI = "ipfs://baseTokenAuthentificationURI/";

    async function deployCoAFixture() {
        // Contracts are deployed using the first signer/account by default
        const [owner, account1, account2] = await ethers.getSigners();

        // deply CoA nft contract
        const CoA = await ethers.getContractFactory("CertificateOfAuthenticity");
        const coa = await CoA.deploy(tokenURI, authentificationURI);

        return {coa, owner, account1, account2}
    }

    describe("Deploy NFT colection", async function () {
        it("Should deploy first Certificate", async function () {
            const { coa , owner} = await loadFixture(deployCoAFixture);

            const currency = "usd";

            let currencyHex = ethers.hexlify(ethers.toUtf8Bytes(currency));
            if(currencyHex.length != 10){
                for(i = currencyHex.length; i < 10; i++){
                    currencyHex = currencyHex + '0';
                }
            }

            expect(await coa.mintCoAToken("Jone Dowe", 5000, currencyHex)).to.emit(coa, 'CoATokenMinted');
        });

        it("Should deploy Certificate other account", async function () {
            const { coa , account1} = await loadFixture(deployCoAFixture);

            const currency = "mxn";

            let currencyHex = ethers.hexlify(ethers.toUtf8Bytes(currency));
            if(currencyHex.length != 10){
                for(i = currencyHex.length; i < 10; i++){
                    currencyHex = currencyHex + '0';
                }
            }

            await coa.connect(account1).mintCoAToken("Jane Dowe", 50000, currencyHex);

            expect(await coa.balanceOf(account1.address)).to.equal(1);
        });

        it("Should mint multiple certificates", async function () {
            const { coa, owner } = await loadFixture(deployCoAFixture);

            const currency = "usd";

            let currencyHex = ethers.hexlify(ethers.toUtf8Bytes(currency));
            if(currencyHex.length != 10){
                for(i = currencyHex.length; i < 10; i++){
                    currencyHex = currencyHex + '0';
                }
            }

            const noToMint = 5;

            let values = [];
            for(i = 0; i < noToMint; i++){
                values.push(500);
            }

            await coa.mintCoATokens(noToMint, "Jhane Dowe", values, currencyHex);

            expect(await coa.balanceOf(owner)).to.equal(noToMint);
        })
    });

    describe("Pull token metadata", async function () {
        it("Should create a certificate and request its metadata", async function () {
            const { coa , owner, account1} = await loadFixture(deployCoAFixture);

            const currency = "cad";

            let currencyHex = ethers.hexlify(ethers.toUtf8Bytes(currency));
            if(currencyHex.length != 10){
                for(i = currencyHex.length; i < 10; i++){
                    currencyHex = currencyHex + '0';
                }
            }

            expect(await coa.mintCoAToken("Bob", 5000, currencyHex)).to.emit(coa, 'CoATokenMinted');

            expect(await coa.transferCoAFrom(owner.address, account1.address, 0, 6000)).to.emit(coa, 'CoATokenTransferred');

            const tokenInfo = await coa.getCoAToken(0);
            // console.log("token info:",tokenInfo);

        });

        it("Should transfer multiple times a certificate and pull the value hystory of the token", async function () {
            const { coa , owner, account1, account2} = await loadFixture(deployCoAFixture);

            const currency = "cad";

            let currencyHex = ethers.hexlify(ethers.toUtf8Bytes(currency));
            if(currencyHex.length != 10){
                for(i = currencyHex.length; i < 10; i++){
                    currencyHex = currencyHex + '0';
                }
            }

            expect(await coa.mintCoAToken("Bob", 5000, currencyHex)).to.emit(coa, 'CoATokenMinted');

            expect(await coa.transferCoAFrom(owner.address, account1.address, 0, 6000)).to.emit(coa, 'CoATokenTransferred');
            expect(await coa.connect(account1).transferCoAFrom(account1.address, account2.address, 0, 7000)).to.emit(coa, 'CoATokenTransferred');
            expect(await coa.connect(account2).transferCoAFrom(account2.address, owner.address, 0, 8000)).to.emit(coa, 'CoATokenTransferred');

            const valueHystory = await coa.getValueHistory(0);
            // console.log("token info:",valueHystory);

            let hexCurrency = valueHystory[2];

            const returnCurrency = ethers.toUtf8String(ethers.getBytes(hexCurrency.slice(0, hexCurrency.indexOf('0' + 1) - 1)));

            expect(returnCurrency).to.equal(currency);
        });
    });
});