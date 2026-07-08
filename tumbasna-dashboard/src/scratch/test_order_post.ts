import fetch from 'node-fetch';

async function main() {
  const payload = {
    id: 'TRX-TEST-VALID-MOCK',
    buyerUserId: 'mock-12345', // mock string
    supplierName: 'Gacorian',
    supplierLocation: 'Banyumas',
    courier: 'Kurir Lokal',
    shippingCost: 5000,
    totalAmount: 20000,
    paymentQrCode: 'https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=tumbasna-qris-TRX-TEST-VALID-MOCK',
    items: [
      {
        productEntryId: '61545f75-0223-484d-86b8-6a0c6577abd8',
        commodity: 'beras',
        price: 15000,
        qty: 1,
        supplierName: 'Gacorian'
      }
    ],
    trackingTimeline: []
  };

  const response = await fetch('http://127.0.0.1:3000/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  const status = response.status;
  const json = await response.json();
  console.log("Status Code:", status);
  console.log("Response:", json);
}

main().catch(console.error);
