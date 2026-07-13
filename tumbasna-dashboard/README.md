# 🚀 Tumbasna - New Checkout Flow

> Complete multi-supplier checkout system with QRIS payment integration

## 📋 Quick Links

- **[Deployment Guide](docs/FINAL_DEPLOYMENT_GUIDE.md)** - Complete deployment instructions
- **[Implementation Summary](docs/IMPLEMENTATION_SUMMARY.md)** - Technical details & architecture
- **[Quick Start Guide](docs/QUICK_START_GUIDE.md)** - Quick reference for common tasks

## ✨ Features

### 🛒 Shopping Cart
- **Cart Pill Bar** - Sticky bottom cart with expand/collapse
- Real-time price calculations
- Multi-supplier support
- Quantity management

### 📦 Checkout Flow
1. **Delivery Scheduling** - Choose date and time slot
2. **Address Management** - Complete delivery address
3. **Shipping Calculator** - Zone-based pricing (Rp 2,500 - 10,000)
4. **Payment Methods** - QRIS (primary), Virtual Account, COD

### 💳 Payment
- **QRIS Integration** - Midtrans payment gateway
- 15-minute countdown timer
- Auto status checking
- Multiple payment options

### 🚚 Logistics
- **Zone-Based Pricing**
  - Same City: Rp 2,500
  - Near City: Rp 5,000
  - Far City: Rp 10,000
  - COD: FREE
- **Time Slots**: Morning, Midday, Afternoon, Evening
- **Supplier Notifications** - WhatsApp integration

## 🏗️ Architecture

### Frontend
- **Components**: CartPillBar
- **Pages**: Checkout, Payment
- **Libraries**: Shipping Calculator

### Backend
- **API**: Batch Order endpoint (`/api/orders/batch`)
- **Database**: PostgreSQL (Supabase)
- **Notifications**: WhatsApp Bot integration

### Tech Stack
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Prisma ORM
- Midtrans Payment Gateway

## 🚀 Deployment

### Prerequisites
- Node.js 18+
- PostgreSQL database
- Midtrans account (sandbox/production)
- WhatsApp bot (optional)

### Quick Deploy

1. **Run Database Migration**
   ```sql
   -- Execute: prisma/migrations/add_delivery_scheduling.sql
   ```

2. **Configure Environment**
   ```env
   NEXT_PUBLIC_BASE_URL="https://dashboard.tumbasna.my.id"
   WHATSAPP_BOT_URL="https://dashboard.tumbasna.my.id/wa"
   MIDTRANS_SERVER_KEY="your-server-key"
   ```

3. **Deploy Code**
   ```bash
   npm install
   npm run build
   pm2 restart tumbasna-dashboard
   ```

See [Deployment Guide](docs/FINAL_DEPLOYMENT_GUIDE.md) for detailed instructions.

## 📊 Pricing Model

### Shipping Costs
| Zone | Distance | Price |
|------|----------|-------|
| Same City | 0 zones | Rp 2,500 |
| Near City | 1 zone | Rp 5,000 |
| Far City | 2+ zones | Rp 10,000 |
| COD | Any | FREE |

### Service Fees
- **Platform Fee**: Rp 2,000 (once per transaction)
- **VA Admin Fee**: Rp 4,000 (only for Virtual Account)

## 🧪 Testing

### Local Development
```bash
npm run dev
```

Visit:
- Dashboard: http://localhost:3000
- Checkout: http://localhost:3000/checkout
- Payment: http://localhost:3000/payment

### Production URLs
- Landing: https://tumbasna.my.id/
- Mobile App: https://app.tumbasna.my.id/
- Dashboard: https://dashboard.tumbasna.my.id/

## 📁 Project Structure

```
tumbasna-dashboard/
├── src/
│   ├── app/
│   │   ├── checkout/page.tsx       # Checkout flow
│   │   ├── payment/page.tsx        # Payment page
│   │   └── api/orders/batch/       # Batch order API
│   ├── components/
│   │   └── CartPillBar.tsx         # Cart component
│   └── lib/
│       └── shipping.ts             # Shipping calculator
├── prisma/
│   └── migrations/
│       └── add_delivery_scheduling.sql
├── docs/                           # Documentation
└── deploy.sh                       # Deployment script
```

## 🤝 Contributing

This is a private project. For internal team use only.

## 📞 Support

For issues or questions:
1. Check [documentation](docs/)
2. Review PM2 logs: `pm2 logs tumbasna-dashboard`
3. Contact dev team

## 📄 License

Proprietary - Tumbasna Platform

---

**Last Updated**: 2026-07-13
**Version**: 2.0.0 (New Checkout Flow)
