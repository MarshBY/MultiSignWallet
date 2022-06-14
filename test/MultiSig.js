const { expect } = require('chai');
const { ethers } = require('hardhat');

describe("Multi Sig Wallet", async () => {

    let a1, a2, a3, a4, a5;
    let MultiSigFactory;
    let multiSig;

    beforeEach(async () => {
        [a1, a2, a3, a4, a5] = await ethers.getSigners();

        MultiSigFactory = await ethers.getContractFactory('MultiSignWallet');

        multiSig = await MultiSigFactory.deploy([a1.address, a2.address, a3.address], 2);
    });

    describe('Contract deployment', async () => {
        it('Deployed contract', async () => {
            expect(await multiSig.address).to.not.equal(null);
        })
    })

    describe('Add Tx', async () => {
        it('Owner adds tx', async () => {
            expect(await multiSig.AddTransaction(a4.address, 0, [])).to.emit(multiSig, 'TransactionAdded').withArgs(0, a4.address, 0)
        })
        it('Owner adds multiple tx', async () => {
            expect(await multiSig.AddTransaction(a4.address, 0, [])).to.emit(multiSig, 'TransactionAdded').withArgs(0, a4.address, 0)
            expect(await multiSig.AddTransaction(a1.address, 10, "0x00ab1234")).to.emit(multiSig, 'TransactionAdded').withArgs(1, a1.address, 10)
        })
        it('NonOwner cant add Transaction', async () => {
            const nonOwner = multiSig.connect(a4);
            await expect(nonOwner.AddTransaction(a1.address, 0, [])).to.be.reverted;
        })
    })
    describe('Confirm Tx', async () => {
        it('Owner adds tx and confirms it', async () => {
            expect(await multiSig.AddTransaction(a4.address, 0, [])).to.emit(multiSig, 'TransactionAdded').withArgs(0, a4.address, 0)
            expect(await multiSig.ConfirmTransaction(0)).to.emit(multiSig, "TransactionConfirmed").withArgs(0, a1.address);
        })
        it('Owner adds tx but cant confirm twice', async () => {
            expect(await multiSig.AddTransaction(a4.address, 0, [])).to.emit(multiSig, 'TransactionAdded').withArgs(0, a4.address, 0)
            expect(await multiSig.ConfirmTransaction(0)).to.emit(multiSig, "TransactionConfirmed").withArgs(0, a1.address);
            await expect(multiSig.ConfirmTransaction(0)).to.be.reverted;
        })
        it('Owner adds tx and all confirm', async () => {
            expect(await multiSig.AddTransaction(a4.address, 0, [])).to.emit(multiSig, 'TransactionAdded').withArgs(0, a4.address, 0)
            expect(await multiSig.ConfirmTransaction(0)).to.emit(multiSig, "TransactionConfirmed").withArgs(0, a1.address);
            const secondOwner = multiSig.connect(a2);
            expect(await secondOwner.ConfirmTransaction(0)).to.emit(multiSig, "TransactionConfirmed").withArgs(0, a2.address);
            const thirdOwner = multiSig.connect(a3);
            expect(await thirdOwner.ConfirmTransaction(0)).to.emit(multiSig, "TransactionConfirmed").withArgs(0, a3.address);
        })
        it('Owner cant confirm nonexistent tx', async () => {
            expect(await multiSig.AddTransaction(a4.address, 0, [])).to.emit(multiSig, 'TransactionAdded').withArgs(0, a4.address, 0)
            await expect(multiSig.ConfirmTransaction(1)).to.be.reverted;
        })
    })
    describe('Execute Tx', async () => {
        it('Owner adds tx, 2 confirm and owner executes', async () => {
            expect(await multiSig.AddTransaction(a4.address, 0, [])).to.emit(multiSig, 'TransactionAdded').withArgs(0, a4.address, 0)
            expect(await multiSig.ConfirmTransaction(0)).to.emit(multiSig, "TransactionConfirmed").withArgs(0, a1.address);
            const secondOwner = multiSig.connect(a2);
            expect(await secondOwner.ConfirmTransaction(0)).to.emit(multiSig, "TransactionConfirmed").withArgs(0, a2.address);

            expect(await multiSig.ExecuteTransaction(0)).to.emit(multiSig, 'TransactionExecuted').withArgs(0);
        })
        it('Owner adds tx, confirms but cant execute', async () => {
            expect(await multiSig.AddTransaction(a4.address, 0, [])).to.emit(multiSig, 'TransactionAdded').withArgs(0, a4.address, 0)
            expect(await multiSig.ConfirmTransaction(0)).to.emit(multiSig, "TransactionConfirmed").withArgs(0, a1.address);

            await expect(multiSig.ExecuteTransaction(0)).to.be.reverted;
        })
        it('Owner adds tx, 2 confirms and acc3 executes', async () => {
            expect(await multiSig.AddTransaction(a4.address, 0, [])).to.emit(multiSig, 'TransactionAdded').withArgs(0, a4.address, 0)
            expect(await multiSig.ConfirmTransaction(0)).to.emit(multiSig, "TransactionConfirmed").withArgs(0, a1.address);
            const secondOwner = multiSig.connect(a2);
            expect(await secondOwner.ConfirmTransaction(0)).to.emit(multiSig, "TransactionConfirmed").withArgs(0, a2.address);

            const thirdOwner = multiSig.connect(a3);
            expect(await thirdOwner.ExecuteTransaction(0)).to.emit(multiSig, 'TransactionExecuted').withArgs(0);
        })
        it('Owner adds tx, 3 confirms and nonOwner cant execute', async () => {
            expect(await multiSig.AddTransaction(a4.address, 0, [])).to.emit(multiSig, 'TransactionAdded').withArgs(0, a4.address, 0)
            expect(await multiSig.ConfirmTransaction(0)).to.emit(multiSig, "TransactionConfirmed").withArgs(0, a1.address);
            const secondOwner = multiSig.connect(a2);
            expect(await secondOwner.ConfirmTransaction(0)).to.emit(multiSig, "TransactionConfirmed").withArgs(0, a2.address);
            const thirdOwner = multiSig.connect(a3);
            expect(await thirdOwner.ConfirmTransaction(0)).to.emit(multiSig, "TransactionConfirmed").withArgs(0, a3.address);
            
            const foreign = multiSig.connect(a4);
            await expect(foreign.ExecuteTransaction(0)).to.be.reverted;
        })
        describe('Execute Tx with value', async () => {
            it('Value is transfered to acc4', async () => {
                expect(await multiSig.AddTransaction(a4.address, ethers.utils.parseEther("10"), [])).to.emit(multiSig, 'TransactionAdded').withArgs(0, a4.address, 0)
                expect(await multiSig.ConfirmTransaction(0)).to.emit(multiSig, "TransactionConfirmed").withArgs(0, a1.address);
                const secondOwner = multiSig.connect(a2);
                expect(await secondOwner.ConfirmTransaction(0)).to.emit(multiSig, "TransactionConfirmed").withArgs(0, a2.address);
                await a1.sendTransaction({from: a1.address, to: multiSig.address, value: ethers.utils.parseEther("10")})
                
                await expect(await multiSig.ExecuteTransaction(0)).to.changeEtherBalances([multiSig, a4], [ethers.utils.parseEther("-10"), ethers.utils.parseEther("10")]);
            })
            it('Reverted if not enough balance', async () => {
                expect(await multiSig.AddTransaction(a4.address, ethers.utils.parseEther("10"), [])).to.emit(multiSig, 'TransactionAdded').withArgs(0, a4.address, 0)
                expect(await multiSig.ConfirmTransaction(0)).to.emit(multiSig, "TransactionConfirmed").withArgs(0, a1.address);
                const secondOwner = multiSig.connect(a2);
                expect(await secondOwner.ConfirmTransaction(0)).to.emit(multiSig, "TransactionConfirmed").withArgs(0, a2.address);
                await a1.sendTransaction({from: a1.address, to: multiSig.address, value: ethers.utils.parseEther("9.9")})
                
                await expect(multiSig.ExecuteTransaction(0)).to.be.reverted;
            })
        })
    })
})