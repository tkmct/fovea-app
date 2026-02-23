# UX Flows

## Flow 1: Register and Login
1. Create account from `#register-form`
2. Login from `#login-form`
3. Assert auth state in `#auth-state`

## Flow 2: Discover and Add Product
1. Search from `#search-query`
2. Filter from `#category-filter`
3. Add product from `#product-list button`
4. Assert cart entries in `#cart-items`

## Flow 3: Checkout
1. Set coupon in `#coupon-code`
2. Set speed in `#shipping-speed`
3. Submit from `#checkout-submit`
4. Assert `#checkout-result`
5. Confirm the completion message includes the order id

## Flow 4: Support Ticket
1. Fill `#support-topic` and `#support-detail`
2. Submit via `#support-submit`
3. Refresh from `#refresh-tickets`
4. Assert ticket rows in `#ticket-list`
5. Confirm latest row reflects the submitted support topic
