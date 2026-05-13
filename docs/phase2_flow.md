# 🛒 Ecommerce Backend TODO (NestJS)

This document outlines the step-by-step backend implementation for adding **Product Management, Cart, and Payment (future-ready)** to your existing NestJS admin system.

---

# 🧩 PHASE 1 — Product Management

## Product Module

* Create `products` module
* Define product schema:

  * name
  * description
  * price
  * stock
  * status (active/inactive)
  * images
  * categoryId
  * createdAt / updatedAt

## Product APIs

* Create product
* Update product
* Delete product (soft delete recommended)
* Get product list (pagination + filtering)
* Get product detail

## Features

* Search by name
* Filter:

  * price range
  * category
  * status
* Sort (price, newest)

## Inventory

* Track stock quantity
* Prevent negative stock

## RBAC

* product:create
* product:update
* product:delete
* product:view

## Audit Log

* Log create/update/delete product

---

# 🛍️ PHASE 2 — Cart System

## Cart Module

* Create `cart` module

## Cart Schema

* userId
* items:

  * productId
  * quantity
  * price snapshot
* totalAmount
* updatedAt

## Cart APIs

* Add item to cart
* Update item quantity
* Remove item
* Get cart by user
* Clear cart

## Business Logic

* Validate product exists
* Validate stock availability
* Merge duplicate items
* Recalculate total on every change

## Edge Cases

* Product deleted → remove from cart
* Price changed → update or flag
* Stock reduced → adjust quantity

## Security

* Cart belongs to user
* Require authentication

---

# 💳 PHASE 3 — Order & Payment (Future Ready)

## Order Module

* Create `orders` module

## Order Schema

* userId
* items (snapshot of cart)
* totalAmount
* status:

  * pending
  * paid
  * failed
  * cancelled
* paymentMethod
* createdAt

## Order APIs

* Create order from cart
* Get user orders
* Get order detail
* Cancel order

## Payment Flow

Cart → Create Order → Payment → Update Order Status

## Payment Module (prepare)

* Create `payments` module
* Store:

  * orderId
  * provider
  * transactionId
  * status

## Payment Integration (later)

* Stripe / PayPal / VNPay / MoMo

## Webhooks

* Endpoint for payment callbacks
* Verify signature
* Update order status

## Background Jobs

* Handle payment confirmation
* Retry failed updates
* Send notifications

---

# 🧠 PHASE 4 — Cross-Cutting Concerns

## Security

* Validate price on backend
* Prevent price tampering
* Lock order after payment

## Audit Logs

* Log order creation
* Log payment status changes

## Performance

* Index product name
* Index userId (cart, orders)
* Cache product list (optional)

## Testing

* Unit test cart logic
* Unit test order creation
* E2E: cart → checkout → order

---

# 🚀 Build Order

1. Product module
2. Cart module
3. Order module
4. Checkout flow
5. Payment skeleton
6. Payment integration

---

# ⚠️ Common Mistakes

* Do not trust frontend price
* Always snapshot product price in order
* Do not skip order layer
* Do not update stock too early
* Always handle payment webhooks

---

# 🧠 Mental Model

* Product = what you sell
* Cart = user intent
* Order = confirmed intent
* Payment = money flow
