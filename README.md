# FinTrack 💰

A comprehensive personal finance management application built with Angular and Node.js. Track your expenses, manage investments, and gain insights into your financial health.

![Angular](https://img.shields.io/badge/Angular-19.2-red?style=flat&logo=angular)
![Node.js](https://img.shields.io/badge/Node.js-18+-green?style=flat&logo=node.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue?style=flat&logo=typescript)
![License](https://img.shields.io/badge/License-MIT-yellow?style=flat)

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
- [Running the Application](#-running-the-application)
- [API Endpoints](#-api-endpoints)
- [Screenshots](#-screenshots)
- [Contributing](#-contributing)
- [License](#-license)

## ✨ Features

### Expense Management
- 📊 Track daily, weekly, and monthly expenses
- 🏷️ Categorize expenses for better organization
- 📈 Visualize spending patterns with interactive charts
- 🔍 Filter and search expense history

### Investment Tracking
- 💹 Monitor investment portfolio performance
- 📉 Track contribution limits (RRSP, TFSA, FHSA, etc.)
- 💵 Record investment transactions
- 📊 View investment allocation and growth

### Dashboard & Analytics
- 🏠 Comprehensive overview dashboard
- 📊 Expense and investment summaries
- 📈 Visual charts powered by Chart.js
- 🎯 Financial goal tracking

### User Management
- 🔐 Secure authentication system
- 👤 User registration and login
- 🔒 Protected routes and API endpoints

## 🛠️ Tech Stack

### Frontend
- **Framework:** Angular 19.2
- **UI Components:** Angular Material
- **Charts:** Chart.js with ng2-charts
- **Styling:** SCSS
- **Server-Side Rendering:** Angular SSR

### Backend
- **Runtime:** Node.js
- **Framework:** Express.js
- **Language:** TypeScript
- **Data Storage:** JSON file-based storage

## 📁 Project Structure

```
fintrack/
├── backend/                    # Node.js/Express API server
│   ├── data/                   # JSON data files
│   │   ├── contributionLimits.json
│   │   ├── expenses.json
│   │   ├── investments.json
│   │   ├── investmentTransactions.json
│   │   └── users.json
│   ├── src/
│   │   ├── index.ts           # Server entry point
│   │   ├── storage.ts         # Data storage utilities
│   │   └── routes/            # API route handlers
│   │       ├── auth.ts
│   │       ├── expenses.ts
│   │       └── investments.ts
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/                   # Angular application
│   ├── src/
│   │   ├── app/
│   │   │   ├── auth/          # Authentication module
│   │   │   │   ├── login/
│   │   │   │   └── register/
│   │   │   ├── dashboard/     # Dashboard module
│   │   │   │   ├── expense-overview/
│   │   │   │   ├── investment-overview/
│   │   │   │   └── overview/
│   │   │   ├── expenses/      # Expense management module
│   │   │   │   ├── expense-dashboard/
│   │   │   │   ├── expense-form/
│   │   │   │   └── expense-list/
│   │   │   ├── investments/   # Investment management module
│   │   │   │   ├── contribution-limits/
│   │   │   │   ├── investment-dashboard/
│   │   │   │   ├── investment-form/
│   │   │   │   ├── investment-list/
│   │   │   │   └── transaction-form/
│   │   │   └── shared/        # Shared components & services
│   │   │       ├── components/
│   │   │       ├── guards/
│   │   │       ├── interceptors/
│   │   │       ├── interfaces/
│   │   │       └── services/
│   │   ├── index.html
│   │   ├── main.ts
│   │   └── styles.scss
│   ├── angular.json
│   ├── package.json
│   └── tsconfig.json
│
├── .gitignore
└── README.md
```

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **npm** (v9 or higher) - Comes with Node.js
- **Angular CLI** (v19) - Install globally: `npm install -g @angular/cli`

## 🚀 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/parthbilliechamp/fintrack.git
   cd fintrack
   ```

2. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd ../frontend
   npm install
   ```

## 🏃 Running the Application

### Start the Backend Server

```bash
cd backend
npm run dev
```

The API server will start at `http://localhost:3000`

### Start the Frontend Development Server

In a new terminal:

```bash
cd frontend
npm start
```

The Angular application will be available at `http://localhost:4200`

### Build for Production

**Backend:**
```bash
cd backend
npm run build
npm start
```

**Frontend:**
```bash
cd frontend
npm run build
```

## 🔌 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register a new user |
| POST | `/api/auth/login` | User login |

### Expenses
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/expenses` | Get all expenses |
| POST | `/api/expenses` | Create a new expense |
| PUT | `/api/expenses/:id` | Update an expense |
| DELETE | `/api/expenses/:id` | Delete an expense |

### Investments
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/investments` | Get all investments |
| POST | `/api/investments` | Create a new investment |
| PUT | `/api/investments/:id` | Update an investment |
| DELETE | `/api/investments/:id` | Delete an investment |

### Health Check
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Check API status |

## 🖼️ Screenshots

*Coming soon...*

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<p align="center">
  Made with ❤️ by <a href="https://github.com/parthbilliechamp">Parth Champaneria</a>
</p>
