src/
├── router/          ← React Router v6
├── context/
│   ├── AuthContext
│   └── FilterContext  ← global date/account filter
├── hooks/
│   └── useData.js     ← single Firebase source of truth
├── pages/
│   ├── Dashboard.jsx
│   ├── Records.jsx
│   ├── Accounts.jsx
│   ├── AccountDetail.jsx   ← /accounts/:id  (real URL)
│   ├── Categories.jsx
│   ├── CategoryDetail.jsx  ← /categories/:id
│   ├── Budget.jsx
│   └── Insights.jsx        ← NEW
├── components/
│   ├── Layout.jsx     ← shell with bottom tabs + FAB
│   ├── GlobalFilter   ← shared filter bar
│   ├── AddTransaction ← revamped iOS form
│   └── ui/            ← design system tokens
└── utils/
    └── currency.js    ← all math, never mixed