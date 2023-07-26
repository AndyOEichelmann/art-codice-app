const { expect } = require("chai");
const { loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { ethers } = require("hardhat");

describe("Art Codice Intermediary", function () {
    const listingFee = ethers.parseEther(0.0015.toString());

    const tokenURI = "ipfs://baseTokenURI/";
    const baseAURI = "ipfs://baseTokenAuthentificationURI/";

    const value = 500;
    const currency = 'usd';
    const artist = 'Jhon Dowe';
    const object = 'Painting';

    async function deployContractsFixture() {
        // Contracts are deployed using the first signer/account by default
        const [deployer, account1, account2, account3] = await ethers.getSigners();

        // deply Art Codice Interediary
        const ACInt = await ethers.getContractFactory("ERC721ACoA_Intermediary");
        const intermediary = await ACInt.deploy(listingFee);

        // deply ACoA nft contract
        const ACoA = await ethers.getContractFactory("ERC721ACoA");
        const testACoA = await ACoA.deploy(tokenURI);

        return { intermediary, testACoA, deployer, account1, account2, account3 }
    }

    describe("Deployment", function () {
        it("should track name and symbol of nft collection", async function () {
            const {testACoA} = await loadFixture(deployContractsFixture);

            // retrive token contranc deplyment metadata info {name, symbol}
            expect(await testACoA.name()).to.equal("Art Certificate of Authenticity");
            expect(await testACoA.symbol()).to.equal("ACOA");
        });

        it("should track feeAcount and listingFee", async function () {
            const {intermediary, deployer} = await loadFixture(deployContractsFixture);
            
            // retrive intermediary contract deplyment info {feeAcount, listingFee}
            expect(await intermediary.feeAcount()).to.equal(deployer.address);
            expect(await intermediary.listingFee()).to.equal(listingFee);
        });
    });

    describe("Art Codice Intermediary listing", function () {
        async function mintTokensFixture() {
            const {intermediary, testACoA, account1, account2} = await loadFixture(deployContractsFixture);

            // grant roll
            const roleMint = await testACoA.MINTER_ROLE();
            expect(await testACoA.grantRole(roleMint, account1.address)).to.emit(testACoA, 'RoleGranted');
            expect(await testACoA.grantRole(roleMint, account2.address)).to.emit(testACoA, 'RoleGranted');

            // account 1 mint ceertificate token
            await testACoA.connect(account1).safeMint(account1.address, value, currency, artist, `${object} 1`, `${baseAURI}${object}1`);
            // account 1 approves for all the intermediaryn contract
            await testACoA.connect(account1).setApprovalForAll(intermediary.target, true);

            // account 2 mint ceertificate token
            await testACoA.connect(account2).safeMint(account2.address, value, currency, artist, `${object} 2`, `${baseAURI}${object}2`);

            return{ intermediary, testACoA, account1, account2 };
        }

        it("should list new item, emit a ItemListed event and track the listed item", async function () {
            const {intermediary, testACoA, account1, account2} = await loadFixture(mintTokensFixture);

            // account 1 list Certificate 1 to be climed by account 2
            await expect(intermediary.connect(account1).listCertificate(testACoA.target, 0, 600, account2.address)).to.emit(intermediary, "ItemListed").withArgs(0, testACoA.target, 0, account1.address, account2.address);

            // retrive item amount
            const itemAmount = await intermediary.listedItems();
            expect(itemAmount).to.equal(1);

            // get item from items mapping & enshure fiels are coorect
            const item = await intermediary._itemsListed(0);
            expect(item.itemId).to.equal(0);
            expect(item.nftContract).to.equal(testACoA.target);
            expect(item.tokenId).to.equal(0);
            expect(item.lister).to.equal(account1.address);
            expect(item.claimer).to.equal(account2.address);
            expect(item.isClaimed).to.equal(false);
        });

        it("should fail to list item from an addres not owner of token and fail to list item for not aprove intermediary", async function () {
            const {intermediary, testACoA, account1, account2} = await loadFixture(mintTokensFixture);

            // fail list Certificate 0 to be climed by account 2
            await expect(intermediary.listCertificate(testACoA.target, 0, 600, account2.address)).to.be.revertedWith(/Intermediary: account .* is not token owner/);

            // fail list Certificate 1 to be climed by account 1
            await expect(intermediary.connect(account2).listCertificate(testACoA.target, 1, 1000, account1.address)).to.be.revertedWith(/Intermediary: .* contract must be appove by token owner/);
        });
    });

    describe("Art Codice Intermediary claim listed items", function () {
        async function mintTokensFixture() {
            const {intermediary, testACoA, account1, account2} = await loadFixture(deployContractsFixture);

            // grant roll
            const roleMint = await testACoA.MINTER_ROLE();
            expect(await testACoA.grantRole(roleMint, account1.address)).to.emit(testACoA, 'RoleGranted');
            expect(await testACoA.grantRole(roleMint, account2.address)).to.emit(testACoA, 'RoleGranted');

            // account 1 mint ceertificate token
            await testACoA.connect(account1).safeMint(account1.address, value, currency, artist, `${object} 1`, `${baseAURI}${object}1`);
            // account 1 approves for all the intermediary contract
            await testACoA.connect(account1).setApprovalForAll(intermediary.target, true);
            // account 1 lists the token in th eintermwdiary contract

            // account 2 mint ceertificate token
            await testACoA.connect(account2).safeMint(account2.address, value, currency, artist, `${object} 2`, `${baseAURI}${object}2`);

            return{ intermediary, testACoA, account1, account2 };
        }
    });
});