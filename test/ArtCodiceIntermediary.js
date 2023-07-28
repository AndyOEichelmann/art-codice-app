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
            await testACoA.connect(account1).safeMintTo(account1.address, value, currency, artist, `${object} 1`, `${baseAURI}${object}1`);
            // account 1 approves for all the intermediaryn contract
            await testACoA.connect(account1).setApprovalForAll(intermediary.target, true);

            // account 2 mint ceertificate token
            await testACoA.connect(account2).safeMintTo(account2.address, value, currency, artist, `${object} 2`, `${baseAURI}${object}2`);

            return{ intermediary, testACoA, account1, account2 };
        }

        it("should list new item, emit a ItemListed event and track the listed item", async function () {
            const {intermediary, testACoA, account1, account2} = await loadFixture(mintTokensFixture);

            // account 1 list Certificate 1 to be climed by account 2
            await expect(intermediary.connect(account1).listCertificate(testACoA.target, 0, 600, "usd", account2.address)).to.emit(intermediary, "ItemListed").withArgs(0, testACoA.target, 0, account1.address, account2.address);

            // retrive item amount
            const itemAmount = await intermediary.listedAmount();
            expect(itemAmount).to.equal(1);

            // get item from items mapping & enshure fiels are coorect
            const item = await intermediary._itemsListed(0);
            expect(item.itemId).to.equal(0);
            expect(item.nftContract).to.equal(testACoA.target);
            expect(item.tokenId).to.equal(0);
            expect(item.lister).to.equal(account1.address);
            expect(item.claimer).to.equal(account2.address);
            expect(item.status).to.equal(0);
        });

        it("should fail to list item from an addres not owner of token and fail to list item for not aprove intermediary", async function () {
            const {intermediary, testACoA, account1, account2} = await loadFixture(mintTokensFixture);

            // fail list Certificate 0 to be climed by account 2
            await expect(intermediary.listCertificate(testACoA.target, 0, 600, "usd", account2.address)).to.be.revertedWith(/Intermediary: account .* is not token owner/);

            // fail list Certificate 1 to be climed by account 1
            await expect(intermediary.connect(account2).listCertificate(testACoA.target, 1, 1000, "usd", account1.address)).to.be.revertedWith(/Intermediary: .* contract must be appove by token owner/);
        });
    });

    describe("Art Codice Intermediary claim listed items", function () {
        async function listTokensFixture() {
            const {intermediary, testACoA, account1, account2, account3} = await loadFixture(deployContractsFixture);

            // grant roll
            const roleMint = await testACoA.MINTER_ROLE();
            expect(await testACoA.grantRole(roleMint, account1.address)).to.emit(testACoA, 'RoleGranted');
            expect(await testACoA.grantRole(roleMint, account2.address)).to.emit(testACoA, 'RoleGranted');

            // account 1 mint ceertificate token
            await testACoA.connect(account1).safeMintTo(account1.address, value, currency, artist, `${object} 1`, `${baseAURI}${object}1`);
            // account 1 approves for all the intermediary contract
            await testACoA.connect(account1).setApprovalForAll(intermediary.target, true);
            // account 1 lists the token in th eintermwdiary contract
            await intermediary.connect(account1).listCertificate(testACoA, 0, 750, "usd", account3.address);

            return{ intermediary, testACoA, account1, account2, account3 };
        }

        it("should claim certificate from intermediary contract", async function () {
            const { intermediary, testACoA, account1, account2, account3 } = await loadFixture(listTokensFixture);

            // climer must claim listed certificate
            await expect(intermediary.connect(account3).claimCertificate(0)).to.emit(intermediary, "ItemClaimed").withArgs(0, testACoA.target, 0, account3.address);

            // claimer must be the new token owner
            expect(await testACoA.ownerOf(0)).to.equal(account3.address);

            // listed item has to be claimed
            expect((await intermediary._itemsListed(0)).status).to.equal(1);
        });

        it("should fail to claim certificates", async function () {
            const { intermediary, testACoA, account1, account2, account3 } = await loadFixture(listTokensFixture);

            const listedAmount = await intermediary.listedAmount();

            // try to clame a non existing id token
            await expect(intermediary.connect(account3).claimCertificate(listedAmount)).to.be.revertedWith(/Intermediary: itemId .* does not exist/);

            // non claimer try to claim item
            await expect(intermediary.connect(account1).claimCertificate(0)).to.be.revertedWith(/Intermediary: .* is not item permited claimer/);

            // item hass already bean climed
            await intermediary.connect(account3).claimCertificate(0);

            await expect(intermediary.connect(account3).claimCertificate(0)).to.be.revertedWith(/Intermediary: itemId .* has allready been claimed or unlisted/);
        });
    });

    describe("Art Codice Intermediary unlist listed items", function () {
        async function listTokensFixture() {
            const {intermediary, testACoA, account1, account2, account3} = await loadFixture(deployContractsFixture);

            // grant roll
            const roleMint = await testACoA.MINTER_ROLE();
            expect(await testACoA.grantRole(roleMint, account1.address)).to.emit(testACoA, 'RoleGranted');
            expect(await testACoA.grantRole(roleMint, account2.address)).to.emit(testACoA, 'RoleGranted');

            // account 1 mint ceertificate token
            await testACoA.connect(account1).safeMintTo(account1.address, value, currency, artist, `${object} 1`, `${baseAURI}${object}1`);
            // account 1 approves for all the intermediary contract
            await testACoA.connect(account1).setApprovalForAll(intermediary.target, true);
            // account 1 lists the token in th eintermwdiary contract
            await intermediary.connect(account1).listCertificate(testACoA, 0, 750, "usd", account3.address);

            return{ intermediary, testACoA, account1, account2, account3 };
        }

        it("should unlist certificate from intermediary contract", async function () {
            const { intermediary, testACoA, account1, account2, account3 } = await loadFixture(listTokensFixture);

            // climer must claim listed certificate
            await expect(intermediary.connect(account1).cancellListing(0)).to.emit(intermediary, "ItemUnlisted").withArgs(0, testACoA.target, 0, account1.address);

            // listed item has to be claimed
            expect((await intermediary._itemsListed(0)).status).to.equal(2);
        });

        it("should fail to claim certificates", async function () {
            const { intermediary, testACoA, account1, account2, account3 } = await loadFixture(listTokensFixture);

            const listedAmount = await intermediary.listedAmount();

            // try to clame a non existing id token
            await expect(intermediary.connect(account1).cancellListing(listedAmount)).to.be.revertedWith(/Intermediary: itemId .* does not exist/);

            // non claimer try to claim item
            await expect(intermediary.connect(account2).cancellListing(0)).to.be.revertedWith(/Intermediary: .* is not item lister/);

            // item hass already bean climed
            await intermediary.connect(account1).cancellListing(0);

            await expect(intermediary.connect(account1).cancellListing(0)).to.be.revertedWith(/Intermediary: itemId .* has allready been claimed or unlisted/);
        });
    });
});