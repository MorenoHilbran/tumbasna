describe('Checkout and Payment Gateway E2E Flow', () => {
  it('should successfully complete checkout and payment gateway flow', () => {
    // 1. Visit root page
    cy.visit('/');

    // 2. Wait for Splash screen to disappear (takes 2.5 seconds, wait 3.5 seconds to be safe)
    cy.wait(3500);

    // 3. Click "Lewati" to bypass the Welcome slider
    cy.contains('button.welcome-skip-btn', 'Lewati').click();

    // 4. Fill in login info (using mock/test phone number)
    cy.get('input.login-input-field').first().type('81234567890');
    cy.get('input.login-input-field.no-prefix').type('password');

    // 5. Submit login
    cy.contains('button.login-submit-btn-dark', 'MASUK KE AKUN ANDA').click();

    // 6. Wait for redirect to Home page and check if user is logged in
    cy.get('.home-wrap').should('exist');
    cy.get('.greet-name').should('be.visible');

    // 7. Click "Cari Produk" quick menu button to go to Pasar
    cy.contains('.qm-lbl', 'Cari Produk').click();
    cy.get('.pasar-content').should('exist');

    // 8. Add first product to cart
    cy.get('.buy-now-btn-native').first().click();

    // 9. Click on the Cart Pill Bar at the bottom to open Keranjang
    cy.get('.cart-pill-bar').should('be.visible').click();

    // 10. In Cart page, proceed to Checkout
    cy.get('.cart-content').should('exist');
    cy.contains('.supplier-checkout-btn', 'Lanjut ke Checkout').click();

    // 11. In Checkout page, verify elements and click checkout button
    cy.get('.checkout-content').should('exist');
    
    // Choose "Kurir Lokal" to calculate shipping cost dynamically
    cy.contains('.shipping-method-card', 'Kurir Lokal').click();
    
    // Place the order
    cy.get('.checkout-btn-green-new').click();

    // 12. In Order Detail screen, simulate successful payment
    cy.get('.order-detail-content').should('exist');
    cy.contains('.order-total-label', 'Total Pembayaran').should('exist');
    cy.get('.simulate-pay-btn').click();

    // 13. Verify redirection back to Transactions list screen after successful payment
    cy.wait(2000);
    cy.get('.orders-content').should('exist');
  });
});
