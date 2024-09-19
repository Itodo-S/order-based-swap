// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract TokenSwap is ReentrancyGuard, Ownable {
    constructor(address initialOwner) Ownable(initialOwner) {
    }

    struct Order {
        address depositor;
        address tokenA; 
        address tokenB;
        uint256 amountA; 
        uint256 amountB; 
        bool fulfilled;
        bool canceled;
    }

    uint256 public orderCounter = 0;
    mapping(uint256 => Order) public orders;

    event OrderCreated(uint256 indexed orderId, address indexed depositor, address tokenA, uint256 amountA, address tokenB, uint256 amountB);
    event OrderFulfilled(uint256 indexed orderId, address indexed fulfiller);
    event OrderCanceled(uint256 indexed orderId, address indexed depositor);

    // Create a new swap order
    function createOrder(address _tokenA, uint256 _amountA, address _tokenB, uint256 _amountB) external nonReentrant {
        require(_amountA > 0, "Deposit amount must be greater than 0");
        require(_amountB > 0, "Requested amount must be greater than 0");

        // Transfer tokenA from depositor to the contract
        IERC20(_tokenA).transferFrom(msg.sender, address(this), _amountA);

        // Create an order
        orders[orderCounter] = Order({
            depositor: msg.sender,
            tokenA: _tokenA,
            tokenB: _tokenB,
            amountA: _amountA,
            amountB: _amountB,
            fulfilled: false,
            canceled: false
        });

        emit OrderCreated(orderCounter, msg.sender, _tokenA, _amountA, _tokenB, _amountB);
        orderCounter++;
    }

    // Fulfill an order by sending tokenB to the depositor and receiving tokenA in return
    function fulfillOrder(uint256 _orderId) external nonReentrant {
        Order storage order = orders[_orderId];
        require(!order.fulfilled, "Order already fulfilled");
        require(!order.canceled, "Order is canceled");

        // Transfer tokenB from the fulfiller to the depositor
        IERC20(order.tokenB).transferFrom(msg.sender, order.depositor, order.amountB);

        // Transfer tokenA from the contract to the fulfiller
        IERC20(order.tokenA).transfer(msg.sender, order.amountA);

        // Mark the order as fulfilled
        order.fulfilled = true;

        emit OrderFulfilled(_orderId, msg.sender);
    }

    // Cancel an order and retrieve the deposited tokens
    function cancelOrder(uint256 _orderId) external nonReentrant {
        Order storage order = orders[_orderId];
        require(msg.sender == order.depositor, "Only the depositor can cancel the order");
        require(!order.fulfilled, "Order already fulfilled");
        require(!order.canceled, "Order already canceled");

        // Transfer the deposited tokens back to the depositor
        IERC20(order.tokenA).transfer(order.depositor, order.amountA);

        // Mark the order as canceled
        order.canceled = true;

        emit OrderCanceled(_orderId, msg.sender);
    }

    // Function to withdraw any tokens mistakenly sent to the contract
    function withdraw(address _token, uint256 _amount) external onlyOwner {
        IERC20(_token).transfer(msg.sender, _amount);
    }
}
