document.addEventListener('DOMContentLoaded', () => {
    // Prevent redundant reloads for current page links
    document.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', (e) => {
            if (!link.href || link.href.startsWith('#')) return;
            try {
                const currentUrl = new URL(window.location.href);
                const linkUrl = new URL(link.href, window.location.origin);

                if (currentUrl.pathname === linkUrl.pathname && currentUrl.search === linkUrl.search) {
                    e.preventDefault();
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }
            } catch (e) { }
        });
    });

    const toggleBtn = document.getElementById('smartshop-toggle');
    const closeBtn = document.getElementById('smartshop-close');
    const chatWindow = document.getElementById('smartshop-window');
    const messageForm = document.getElementById('smartshop-input-form');
    const userInput = document.getElementById('smartshop-input');
    const messagesContainer = document.getElementById('smartshop-messages');
    const loadingIndicator = document.getElementById('smartshop-loading');

    const suggestionsContainer = document.createElement('div');
    suggestionsContainer.className = 'smartshop-suggestions';
    suggestionsContainer.innerHTML = `
        <button class="suggestion-chip">Headphones under $50</button>
        <button class="suggestion-chip">Best headphones</button>
        <button class="suggestion-chip">Lumina brands</button>
        <button class="suggestion-chip">Gaming gear</button>
    `;
    messagesContainer.after(suggestionsContainer);

    // Toggle Chat Window
    toggleBtn.addEventListener('click', () => {
        chatWindow.classList.toggle('open');
        const isOpen = chatWindow.classList.contains('open');
        localStorage.setItem('smartshop_isOpen', isOpen);
        if (isOpen) {
            userInput.focus();
        }
    });

    closeBtn.addEventListener('click', () => {
        chatWindow.classList.remove('open');
        localStorage.setItem('smartshop_isOpen', 'false');
    });

    let chatHistory = [];
    let lastShownProducts = []; // NEW: tracks the most recent product list shown

    function persistChat() {
        localStorage.setItem('smartshop_history', JSON.stringify(chatHistory));
        localStorage.setItem('smartshop_lastProducts', JSON.stringify(lastShownProducts));
        localStorage.setItem('smartshop_html', messagesContainer.innerHTML);
        localStorage.setItem('smartshop_suggestions', suggestionsContainer.innerHTML);
    }

    // ── Restore State ──
    const savedHtml = localStorage.getItem('smartshop_html');
    if (savedHtml) {
        messagesContainer.innerHTML = savedHtml;
        chatHistory = JSON.parse(localStorage.getItem('smartshop_history') || '[]');
        lastShownProducts = JSON.parse(localStorage.getItem('smartshop_lastProducts') || '[]');
        const savedSuggestions = localStorage.getItem('smartshop_suggestions');
        if (savedSuggestions) suggestionsContainer.innerHTML = savedSuggestions;
        
        if (localStorage.getItem('smartshop_isOpen') === 'true') {
            chatWindow.classList.add('open');
        }
        
        setTimeout(scrollToBottom, 100);
    }

    // ── Event Delegation for Chat Products ──
    messagesContainer.addEventListener('click', async (e) => {
        const addBtn = e.target.closest('.smartshop-card-add-btn');
        if (!addBtn || addBtn.disabled) return;

        addBtn.disabled = true;
        addBtn.textContent = '…';
        const pId = addBtn.dataset.productId;
        const pName = addBtn.dataset.productName || 'Product';

        try {
            const res = await fetch('/cart/add', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ productId: pId, quantity: 1 })
            });
            const data = await res.json();
            if (data.success) {
                if (typeof updateCartBadge !== 'undefined') updateCartBadge(data.cartCount);
                addBtn.textContent = '✓ Added!';
                addBtn.classList.add('added');
                addMessage(`✅ "${pName}" added to your cart!`, 'ai');
                scrollToBottom();
                fetchRecommendations({ id: pId });
            } else {
                addBtn.textContent = 'Error';
                addBtn.disabled = false;
                if (typeof showToast !== 'undefined') showToast(data.error || 'Failed to add', 'error');
            }
        } catch (err) {
            console.error('Add to cart from chat failed:', err);
            addBtn.textContent = '+ Cart';
            addBtn.disabled = false;
        }
        persistChat();
    });

    // Handle suggestion chips
    suggestionsContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('suggestion-chip')) {
            userInput.value = e.target.textContent;
            messageForm.dispatchEvent(new Event('submit'));
        }
    });

    // Handle Form Submission
    messageForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const message = userInput.value.trim();
        if (!message) return;

        addMessage(message, 'user');
        userInput.value = '';
        chatHistory.push({ role: 'user', message });
        persistChat();
        loadingIndicator.classList.remove('hidden');
        scrollToBottom();

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message, history: chatHistory, lastProducts: lastShownProducts })
            });
            const data = await response.json();
            loadingIndicator.classList.add('hidden');

            if (data.error) {
                addMessage(data.error, 'ai');
            } else {
                addMessage(data.reply, 'ai');
                chatHistory.push({ role: 'assistant', message: data.reply });
                persistChat();

                if (data.intent) {
                    handleIntent(data.intent);
                }

                if (data.products && data.products.length > 0) {
                    addProducts(data.products);
                }
                if (data.suggestions && data.suggestions.length > 0) {
                    updateSuggestions(data.suggestions);
                }
            }
        } catch (error) {
            loadingIndicator.classList.add('hidden');
            addMessage("Sorry, I'm having trouble connecting right now.", 'ai');
            console.error('Chat Error:', error);
        }
        scrollToBottom();
    });

    function updateSuggestions(suggestions) {
        suggestionsContainer.innerHTML = suggestions
            .map(s => `<button class="suggestion-chip">${s}</button>`)
            .join('');
        persistChat();
    }

    function addMessage(text, side) {
        const msgDiv = document.createElement('div');
        msgDiv.className = `smartshop-msg msg-${side}`;
        msgDiv.textContent = text;
        messagesContainer.appendChild(msgDiv);
        scrollToBottom();
        persistChat();
    }

    function addProducts(products, headerText) {
        if (!products || !products.length) return;
        lastShownProducts = products; // update context for next AI turn

        // Optional section header
        if (headerText) {
            const hdr = document.createElement('div');
            hdr.className = 'smartshop-msg msg-ai smartshop-reco-header';
            hdr.textContent = headerText;
            messagesContainer.appendChild(hdr);
        }

        const gridDiv = document.createElement('div');
        gridDiv.className = 'smartshop-products-grid';

        products.forEach(p => {
            const card = document.createElement('div');
            card.className = 'smartshop-product-card';

            // ── Top Row ──────────────────────────────────────────
            const topRow = document.createElement('div');
            topRow.className = 'smartshop-product-card-top';

            const visual = document.createElement('div');
            visual.className = 'smartshop-product-visual';
            visual.style.background = 'linear-gradient(135deg,#1a2234,#232b38)';

            const nameStr = p.name || 'Product';
            const initial = nameStr.charAt(0).toUpperCase();
            visual.innerHTML = `<span class="no-image-placeholder">${initial}</span>`;

            if (p.image && p.image.startsWith('http')) {
                const tempImg = new Image();
                tempImg.onload = () => {
                    visual.innerHTML = '';
                    const img = document.createElement('img');
                    img.src = p.image;
                    img.alt = '';
                    img.style.cssText = 'width:100%;height:100%;object-fit:cover;display:block;';
                    visual.appendChild(img);
                };
                tempImg.src = p.image;
            }

            const info = document.createElement('div');
            info.className = 'smartshop-product-info';
            info.innerHTML = `
                <div class="smartshop-product-name">${nameStr}</div>
                <div class="smartshop-product-brand">${p.brand || 'Lumina'}</div>
                <div class="smartshop-product-price-row">
                    <span class="smartshop-product-price">$${p.price}</span>
                    ${p.compareAtPrice ? `<span class="smartshop-product-was">$${p.compareAtPrice}</span>` : ''}
                </div>
            `;

            topRow.append(visual, info);

            // ── Action Row ───────────────────────────────────────
            const actions = document.createElement('div');
            actions.className = 'smartshop-card-actions';

            const viewBtn = document.createElement('a');
            viewBtn.href = `/product/${p.slug || ''}`;
            viewBtn.className = 'smartshop-card-view-btn';
            viewBtn.textContent = 'View →';

            const addBtn = document.createElement('button');
            addBtn.className = 'smartshop-card-add-btn';
            addBtn.dataset.productId = p.id;
            addBtn.dataset.productName = nameStr;
            addBtn.innerHTML = '🛒 Add to Cart';

            actions.append(viewBtn, addBtn);
            card.append(topRow, actions);
            gridDiv.appendChild(card);
        });

        messagesContainer.appendChild(gridDiv);
        scrollToBottom();
        persistChat();
    }

    async function fetchRecommendations(product) {
        try {
            const res = await fetch(`/api/chat/recommendations/${product.id}`);
            const data = await res.json();
            if (data.recommendations && data.recommendations.length > 0) {
                addProducts(data.recommendations, '✨ You might also like:');
                updateSuggestions(['Add another item', 'View my cart', 'Continue shopping']);
            }
        } catch (err) {
            console.error('Recommendations fetch failed:', err);
        }
    }

    function scrollToBottom() {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    function handleIntent(intent) {
        if (!intent || !intent.action) return;

        switch (intent.action) {
            case 'ADD_TO_CART':
                if (intent.productId) {
                    addToCart(intent.productId);
                } else if (intent.productName) {
                    // This fallback happens if backend couldn't resolve ID but AI gave a name
                    showToast(`Searching for ${intent.productName}...`, 'info');
                }
                break;
            case 'REMOVE_FROM_CART':
                if (intent.productId) {
                    removeFromCart(intent.productId);
                } else if (intent.productName) {
                    showToast(`Could not find ${intent.productName} in your cart.`, 'error');
                }
                break;
            case 'CLEAR_CART':
                clearCart(true); // pass true for silent clear
                break;
            case 'VIEW_CART':
                addMessage("Opening your cart...", 'ai');
                setTimeout(() => window.location.href = '/cart', 1000);
                break;
            case 'CHECKOUT':
                addMessage("Processing your order directly...", 'ai');
                fetch('/cart/checkout', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ shippingAddress: {}, paid: false }) // Chatbot spawns UNPAID order
                })
                .then(r => r.json())
                .then(data => {
                    if (data.success) {
                        if (typeof updateCartBadge !== 'undefined') updateCartBadge(0);
                        addMessage(`🎉 Great news! Your order ${data.orderNumber} has been successfully secured!`, 'ai');
                        setTimeout(() => addMessage(`You can complete your payment later via the Orders Portal.`, 'ai'), 1500);
                        updateSuggestions(['View Orders', 'Continue Shopping']);
                    } else {
                        addMessage(data.error || "Ah, I couldn't process that. Your cart might be empty.", 'ai');
                    }
                })
                .catch(err => addMessage("Connection error while sending order.", 'ai'));
                break;
        }
    }

    // ── Cart Functionality ───────────────────────────────────────────────────
    async function addToCart(productId, quantity = 1) {
        try {
            const res = await fetch('/cart/add', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ productId, quantity })
            });
            const data = await res.json();
            if (data.success) {
                if (typeof updateCartBadge !== 'undefined') updateCartBadge(data.cartCount);
                showToast('Added to cart! 🛒');
            } else {
                showToast(data.error || 'Failed to add to cart', 'error');
            }
        } catch (err) {
            console.error(err);
            showToast('Connection error', 'error');
        }
    }

    async function removeFromCart(productId) {
        try {
            const res = await fetch('/cart/remove', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ productId })
            });
            const data = await res.json();
            if (data.success) {
                if (typeof updateCartBadge !== 'undefined') updateCartBadge(data.cartCount);
                const itemEl = document.querySelector(`.cart-item[data-product-id="${productId}"]`);
                if (itemEl) {
                    itemEl.classList.add('removing');
                    setTimeout(() => {
                        itemEl.remove();
                        if (data.cartCount === 0) location.reload();
                    }, 300);
                }
                updateCartTotal(data.cartTotal);
                showToast('Item removed');
            }
        } catch (err) {
            console.error(err);
        }
    }

    async function updateCartQty(productId, quantity) {
        try {
            const res = await fetch('/cart/update-qty', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ productId, quantity })
            });
            const data = await res.json();
            if (data.success) {
                updateCartBadge(data.cartCount);
                const itemEl = document.querySelector(`.cart-item[data-product-id="${productId}"]`);
                if (itemEl) {
                    const subtotalEl = itemEl.querySelector('.cart-item-subtotal');
                    if (subtotalEl) subtotalEl.textContent = `$${data.itemSubtotal}`;
                }
                updateCartTotal(data.cartTotal);
            }
        } catch (err) {
            console.error(err);
        }
    }

    async function clearCart(silent = false) {
        if (!silent && !confirm('Clear your entire cart?')) return;
        try {
            const res = await fetch('/cart/clear', { method: 'POST' });
            const data = await res.json();
            if (data.success) {
                updateCartBadge(0);
                if (!silent) location.reload();
                else showToast('Cart cleared completely 🎉');
            }
        } catch (err) {
            console.error(err);
        }
    }

    async function checkout() {
        const btn = document.getElementById('btn-checkout');
        if (btn) {
            btn.disabled = true;
            btn.textContent = 'Processing...';
        }
        try {
            const res = await fetch('/cart/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    shippingAddress: { street: '123 Demo St', city: 'Tech City', state: 'CA', zip: '90210', country: 'US' }
                })
            });
            const data = await res.json();
            if (data.success) {
                showToast('Order placed successfully! 🎉');
                setTimeout(() => { window.location.href = '/dashboard'; }, 1500);
            } else {
                showToast(data.error || 'Checkout failed', 'error');
                if (btn) { btn.disabled = false; btn.textContent = 'Proceed to Checkout'; }
            }
        } catch (err) {
            console.error(err);
            showToast('Connection error', 'error');
            if (btn) { btn.disabled = false; btn.textContent = 'Proceed to Checkout'; }
        }
    }

    function updateCartBadge(count) {
        const badge = document.querySelector('.cart-badge');
        if (badge) {
            badge.textContent = count;
            badge.style.display = count > 0 ? 'flex' : 'none';
        }
    }

    function updateCartTotal(total) {
        const totalEl = document.getElementById('cart-total');
        if (totalEl && total) { totalEl.textContent = `$${total}`; }
    }

    function showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;

        let bgColor = 'var(--primary)';
        if (type === 'error') bgColor = '#ff4d4d';
        if (type === 'info') bgColor = '#3b82f6';

        toast.style.cssText = `
            position: fixed; bottom: 2rem; right: 2rem;
            background: ${bgColor};
            color: white; padding: 0.75rem 1.5rem; border-radius: var(--radius-sm);
            box-shadow: 0 4px 12px rgba(0,0,0,0.3); z-index: 9999;
            transform: translateY(100px); opacity: 0;
            transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            font-weight: 600;
        `;
        toast.textContent = message;
        document.body.appendChild(toast);
        setTimeout(() => { toast.style.transform = 'translateY(0)'; toast.style.opacity = '1'; }, 10);
        setTimeout(() => {
            toast.style.transform = 'translateY(20px)'; toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    // Event Listeners
    document.addEventListener('click', (e) => {
        const btn = e.target.closest('.btn-cart');
        if (btn && btn.dataset.productId) {
            e.preventDefault();
            const qtyInput = document.getElementById('qty');
            const qty = qtyInput ? parseInt(qtyInput.value) : 1;
            addToCart(btn.dataset.productId, qty);
        }
    });

    const cartContainer = document.querySelector('.cart-items');
    if (cartContainer) {
        cartContainer.addEventListener('click', (e) => {
            const btn = e.target.closest('.btn-remove');
            if (btn && btn.dataset.productId) removeFromCart(btn.dataset.productId);
        });
        cartContainer.addEventListener('change', (e) => {
            const input = e.target.closest('.cart-qty-input');
            if (input) {
                const item = input.closest('.cart-item');
                if (item && item.dataset.productId) updateCartQty(item.dataset.productId, input.value);
            }
        });
    }

    const checkoutBtn = document.getElementById('btn-checkout');
    if (checkoutBtn) checkoutBtn.addEventListener('click', checkout);

    const clearCartBtn = document.getElementById('btn-clear-cart');
    if (clearCartBtn) clearCartBtn.addEventListener('click', clearCart);

    async function toggleWishlist(productId, btn) {
        try {
            const res = await fetch('/cart/wishlist/toggle', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ productId })
            });
            const data = await res.json();
            if (data.success) {
                btn.classList.toggle('active');
                showToast(btn.classList.contains('active') ? 'Added to wishlist!' : 'Removed from wishlist');
            }
        } catch (err) { console.error(err); }
    }

    document.addEventListener('click', (e) => {
        const btn = e.target.closest('.btn-wishlist');
        if (btn && btn.dataset.productId) {
            e.preventDefault();
            toggleWishlist(btn.dataset.productId, btn);
        }
    });

    fetch('/cart/count').then(r => r.json()).then(data => updateCartBadge(data.cartCount)).catch(console.error);
});
