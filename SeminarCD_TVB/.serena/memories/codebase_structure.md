# Codebase Structure

```
DACN_TourGuideWeb/
├── Travel_TVB/                     # Frontend (React + Vite)
│   ├── src/
│   │   ├── components/             # Reusable UI components (each in own folder with .jsx + .css)
│   │   ├── page/                   # Page-level components (routes)
│   │   ├── context/                # React Context (AuthContext, LanguageContext)
│   │   ├── test/                   # Test utilities (test-utils.jsx)
│   │   ├── assets/                 # Static assets
│   │   ├── App.jsx                 # Router setup
│   │   └── main.jsx                # Entry point
│   ├── public/
│   ├── .env                        # VITE_STRAPI_URL, VITE_STRAPI_API_TOKEN, VITE_CHATBOT_ENABLED
│   ├── vite.config.js
│   ├── eslint.config.js
│   └── package.json
│
├── Travel_TVB_Server/              # Backend (Strapi 5)
│   ├── config/
│   │   ├── admin.js
│   │   ├── database.js             # SQLite/MySQL/PostgreSQL config
│   │   ├── middlewares.js          # CORS and other middleware
│   │   ├── plugins.js              # JWT/users-permissions config
│   │   └── server.js
│   ├── src/api/
│   │   ├── tour/                   # Tour content type (CRUD)
│   │   ├── tour-category/
│   │   ├── booking/                # Booking + VNPay integration
│   │   ├── chatbot/                # AI Chatbot (RAG pipeline)
│   │   │   ├── controllers/chatbot.js
│   │   │   ├── services/chatbot.js
│   │   │   ├── services/vectorStore.js
│   │   │   ├── routes/chatbot.js
│   │   │   └── scripts/indexTours.js
│   │   ├── single-post/            # Blog posts
│   │   ├── single-community-post/
│   │   ├── home-hero-slider/
│   │   ├── layout-navbar/
│   │   ├── layout-footer/
│   │   └── faq/
│   ├── .env                        # All secrets/config (see env vars)
│   ├── .env.example
│   └── package.json
│
├── migrate-strapi-locales.mjs      # Locale migration (vi/en/zh)
├── .github/workflows/ci.yml        # CI: frontend-tests + backend-tests
└── README.md
```

## Key Frontend Pages (Travel_TVB/src/page/)
- Home, Tours, TourDetail, Service, Individual-Service
- News, Individual-Post, Community, Individual-CommunityPost
- AboutUs, Contact, Login, Register, Profile
- BookingTicket, PaymentReturn

## Key Frontend Contexts
- AuthContext.jsx — user authentication state
- LanguageContext.jsx — i18n language selection (vi/en/zh)
