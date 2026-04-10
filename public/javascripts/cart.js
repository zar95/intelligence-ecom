document.addEventListener('DOMContentLoaded', function() {
  // Utility to send JSON POST
  async function postJson(url, body) {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    return res.json();
  }

  function updateCartBadge(count) {
    const badge = document.querySelector('.cart-badge');
    if (badge) badge.textContent = count;
  }
  function updateWishlistBadge(count) {
    const badge = document.querySelector('.wishlist-badge');
    if (badge) badge.textContent = count;
  }

  // Add to Cart (works on product page and any 'Add to Cart' buttons)
  document.body.addEventListener('click', async function (e) {
    const btn = e.target.closest('.btn-cart');
    if (!btn) return;
    e.preventDefault();
    const productId = btn.dataset.productId;
    let qty = 1;
    const qtyInput = document.getElementById('qty') || btn.closest('[data-qty]') && btn.closest('[data-qty]').querySelector('input[type=number]');
    if (qtyInput) qty = parseInt(qtyInput.value) || 1;

    try {
      btn.disabled = true;
      const data = await postJson('/cart/add', { productId, quantity: qty });
      if (data && data.cartCount !== undefined) {
        updateCartBadge(data.cartCount);
      }
    } catch (err) {
      console.error('Add to cart failed', err);
    } finally {
      btn.disabled = false;
    }
  });

  // Remove from Cart
  document.body.addEventListener('click', async function (e) {
    const btn = e.target.closest('.btn-remove');
    if (!btn) return;
    e.preventDefault();
    const productId = btn.dataset.productId;
    try {
      btn.disabled = true;
      const data = await postJson('/cart/remove', { productId });
      if (data && data.cartCount !== undefined) {
        updateCartBadge(data.cartCount);
      }
      // reload cart page to ensure totals are correct
      if (window.location.pathname.startsWith('/cart')) {
        window.location.reload();
      } else {
        // remove UI element if present
        const row = btn.closest('.cart-item');
        if (row) row.remove();
      }
    } catch (err) {
      console.error('Remove from cart failed', err);
      btn.disabled = false;
    }
  });

  // Wishlist toggle
  document.body.addEventListener('click', async function (e) {
    const btn = e.target.closest('.btn-wishlist');
    if (!btn) return;
    e.preventDefault();
    const productId = btn.dataset.productId;
    try {
      btn.disabled = true;
      const data = await postJson('/cart/wishlist/toggle', { productId });
      if (data && data.wishlistCount !== undefined) {
        updateWishlistBadge(data.wishlistCount);
      }
      // toggle visual state
      btn.classList.toggle('active');
    } catch (err) {
      console.error('Wishlist toggle failed', err);
    } finally {
      btn.disabled = false;
    }
  });

  // Quantity inputs
  let qtyTimer;
  document.body.addEventListener('change', function(e) {
    if (e.target.classList.contains('cart-qty-input')) {
      clearTimeout(qtyTimer);
      const input = e.target;
      qtyTimer = setTimeout(async () => {
        const productId = input.closest('.cart-item').dataset.productId;
        try {
          const data = await postJson('/cart/update-qty', { productId, quantity: input.value });
          if (data && data.success) {
            updateCartBadge(data.cartCount);
            // Refresh purely to ensure accuracy, could also be DOM updates
            window.location.reload(); 
          }
        } catch (err) {
          console.error('Update qty failed', err);
        }
      }, 400);
    }
  });

  // Clear Cart
  const btnClear = document.getElementById('btn-clear-cart');
  if (btnClear) {
    btnClear.addEventListener('click', async () => {
      if (!confirm('Are you sure you want to clear your cart?')) return;
      try {
        const data = await postJson('/cart/clear', {});
        if (data && data.success) {
          updateCartBadge(0);
          window.location.reload();
        }
      } catch (err) {
        console.error('Clear cart failed', err);
      }
    });
  }

  // Checkout interception
  const btnCheckout = document.getElementById('btn-checkout');
  const paymentModal = document.getElementById('payment-modal');
  const closePaymentBtn = document.getElementById('close-payment-modal');
  const paymentForm = document.getElementById('mock-payment-form');

  if (btnCheckout && paymentModal) {
    btnCheckout.addEventListener('click', () => {
      paymentModal.classList.add('active');
    });

    closePaymentBtn.addEventListener('click', () => {
      paymentModal.classList.remove('active');
    });

    // Formatting mock CC num
    const ccInput = document.getElementById('cc-number');
    if (ccInput) {
      ccInput.addEventListener('input', (e) => {
        let val = e.target.value.replace(/\D/g, '').substring(0, 16);
        e.target.value = val.replace(/(\d{4})(?=\d)/g, '$1 ');
      });
    }

    // Submit Payment
    if (paymentForm) {
      paymentForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = paymentForm.querySelector('button[type="submit"]');
        btn.disabled = true;
        btn.textContent = 'Processing...';

        try {
          // Send checkout command indicating paid = true
          const data = await postJson('/cart/checkout', { shippingAddress: {}, paid: true });
          if (data && data.success) {
            paymentModal.classList.remove('active');
            alert('Payment Successful! Order placed successfully.');
            // Redirect to an order completion page (or home/shop for prototype)
            window.location.href = '/shop';
          } else {
            alert(data.error || 'Checkout failed');
            btn.disabled = false;
            btn.textContent = 'Pay Now';
          }
        } catch (err) {
          console.error(err);
          btn.disabled = false;
          btn.textContent = 'Pay Now';
        }
      });
    }
  }

});