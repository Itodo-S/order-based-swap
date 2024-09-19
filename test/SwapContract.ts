import { expect } from "chai";
import { ethers } from "hardhat";
import { TokenSwap, SYE, CasToken } from "../typechain-types";

describe("TokenSwap", function () {
    let tokenSwap: TokenSwap;
    let syeToken: SYE;
    let casToken: CasToken;
    let owner: any;
    let depositor: any;
    let fulfiller: any;

    beforeEach(async function () {
        [owner, depositor, fulfiller] = await ethers.getSigners();

        // Deploy SYE token
        const SYEFactory = await ethers.getContractFactory("SYE");
        syeToken = (await SYEFactory.deploy()) as SYE & { address: string };

        // Deploy CasToken token
        const CasTokenFactory = await ethers.getContractFactory("CasToken");
        casToken = (await CasTokenFactory.deploy()) as CasToken & { address: string };

        // Deploy the TokenSwap contract
        const TokenSwapFactory = await ethers.getContractFactory("TokenSwap");
        tokenSwap = (await TokenSwapFactory.deploy(owner.address)) as TokenSwap;
    });

    describe("Create Order", function () {
        it("should allow a user to create a swap order", async function () {
            const amountSYE = ethers.parseEther("100");
            const amountCas = ethers.parseEther("20");

            // Approve SYE transfer to the contract
            // await syeToken.connect(depositor).approve(tokenSwap, amountSYE);

            await syeToken.transfer(depositor, ethers.parseEther("1000"));
            await syeToken.connect(depositor).approve(tokenSwap, ethers.parseEther("1000"));

            // Depositor creates an order
            await expect(
                tokenSwap.connect(depositor).createOrder(
                    syeToken,
                    amountSYE,
                    casToken,
                    amountCas
                )
            )
                .to.emit(tokenSwap, "OrderCreated")
                .withArgs(0, depositor.address, syeToken, amountSYE, casToken, amountCas);

            const order = await tokenSwap.orders(0);
            expect(order.depositor).to.equal(depositor.address);
            expect(order.amountA).to.equal(amountSYE);
            expect(order.amountB).to.equal(amountCas);
            expect(order.fulfilled).to.be.false;
            expect(order.canceled).to.be.false;
        });

        it("should fail if deposit or requested amount is zero", async function () {
            await expect(
                tokenSwap.connect(depositor).createOrder(
                    syeToken, 0, casToken, ethers.parseEther("20")
                )
            ).to.be.revertedWith("Deposit amount must be greater than 0");

            await expect(
                tokenSwap.connect(depositor).createOrder(
                    syeToken, ethers.parseEther("100"), casToken, 0
                )
            ).to.be.revertedWith("Requested amount must be greater than 0");
        });


        // it("should fail if deposit or requested amount is zero", async function () {
        //     await expect(tokenSwap.connect(depositor).createOrder(syeToken.address, 0, casToken.address, ethers.utils.parseEther("20")))
        //         .to.be.revertedWith("Deposit amount must be greater than 0");

        //     await expect(tokenSwap.connect(depositor).createOrder(syeToken.address, ethers.utils.parseEther("100"), casToken.address, 0))
        //         .to.be.revertedWith("Requested amount must be greater than 0");
        // });
    });

    // describe("Fulfill Order", function () {
    //     beforeEach(async function () {
    //         const amountSYE = ethers.utils.parseEther("100");
    //         const amountCas = ethers.utils.parseEther("20");

    //         // Approve SYE transfer to the contract and create the order
    //         await syeToken.connect(depositor).approve(tokenSwap.address, amountSYE);
    //         await tokenSwap.connect(depositor).createOrder(syeToken.address, amountSYE, casToken.address, amountCas);
    //     });

    //     it("should allow a user to fulfill an order", async function () {
    //         const amountCas = ethers.utils.parseEther("20");

    //         // Approve CasToken transfer from the fulfiller to the depositor
    //         await casToken.connect(fulfiller).approve(tokenSwap.address, amountCas);

    //         await expect(tokenSwap.connect(fulfiller).fulfillOrder(0))
    //             .to.emit(tokenSwap, "OrderFulfilled")
    //             .withArgs(0, fulfiller.address);

    //         const order = await tokenSwap.orders(0);
    //         expect(order.fulfilled).to.be.true;

    //         // Check the balances after fulfillment
    //         expect(await syeToken.balanceOf(fulfiller.address)).to.equal(ethers.utils.parseEther("100"));
    //         expect(await casToken.balanceOf(depositor.address)).to.equal(ethers.utils.parseEther("20"));
    //     });

    //     it("should not allow fulfilling a fulfilled or canceled order", async function () {
    //         const amountCas = ethers.utils.parseEther("20");
    //         await casToken.connect(fulfiller).approve(tokenSwap.address, amountCas);
    //         await tokenSwap.connect(fulfiller).fulfillOrder(0);

    //         await expect(tokenSwap.connect(fulfiller).fulfillOrder(0))
    //             .to.be.revertedWith("Order already fulfilled");

    //         await tokenSwap.connect(depositor).cancelOrder(0);

    //         await expect(tokenSwap.connect(fulfiller).fulfillOrder(0))
    //             .to.be.revertedWith("Order is canceled");
    //     });
    // });

    // describe("Cancel Order", function () {
    //     beforeEach(async function () {
    //         const amountSYE = ethers.utils.parseEther("100");
    //         const amountCas = ethers.utils.parseEther("20");

    //         // Approve SYE transfer to the contract and create the order
    //         await syeToken.connect(depositor).approve(tokenSwap.address, amountSYE);
    //         await tokenSwap.connect(depositor).createOrder(syeToken.address, amountSYE, casToken.address, amountCas);
    //     });

    //     it("should allow the depositor to cancel the order", async function () {
    //         await expect(tokenSwap.connect(depositor).cancelOrder(0))
    //             .to.emit(tokenSwap, "OrderCanceled")
    //             .withArgs(0, depositor.address);

    //         const order = await tokenSwap.orders(0);
    //         expect(order.canceled).to.be.true;

    //         // Ensure depositor gets the tokens back
    //         expect(await syeToken.balanceOf(depositor.address)).to.equal(ethers.utils.parseEther("100000"));
    //     });

    //     it("should not allow others to cancel the order", async function () {
    //         await expect(tokenSwap.connect(fulfiller).cancelOrder(0))
    //             .to.be.revertedWith("Only the depositor can cancel the order");
    //     });
    // });

    // describe("Owner Withdraw", function () {
    //     it("should allow the owner to withdraw tokens from the contract", async function () {
    //         const amountSYE = ethers.utils.parseEther("100");

    //         // Transfer some tokens to the contract
    //         await syeToken.transfer(tokenSwap.address, amountSYE);

    //         // Owner withdraws the tokens
    //         await tokenSwap.connect(owner).withdraw(syeToken.address, amountSYE);
    //         expect(await syeToken.balanceOf(owner.address)).to.equal(amountSYE);
    //     });

    //     it("should not allow non-owner to withdraw tokens", async function () {
    //         await expect(tokenSwap.connect(depositor).withdraw(syeToken.address, ethers.utils.parseEther("100")))
    //             .to.be.revertedWith("Ownable: caller is not the owner");
    //     });
    // });
});


