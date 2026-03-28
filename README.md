# Velexp Admin Portal

## 🚀 Overview
**Velexp Admin** is a sophisticated, feature-rich administrative dashboard designed for comprehensive logistics and courier service management. Built with modern web technologies, it provides a seamless interface for managing shipments, customers, franchisees, and complex operational reports.

This project is built using **React 18** and **Vite**, offering a lightning-fast development experience and optimized production builds.

---

## ✨ Key Features

### 📦 Operations & Tracking
- **AWB Tracking**: Real-time tracking and management of Air Waybills.
- **In-Scan Weight**: Efficient processing of incoming shipments with weight verification.
- **RTO Approval**: Streamlined workflow for 'Return to Origin' shipments.
- **POP Reconciliation**: Tools for reconciling Proof of Pickup data.

### 👤 User & Franchisee Management
- **Role-Based Access Control**: Granular privilege management for different user roles.
- **Franchisee Management**: Comprehensive tools to add, update, and monitor franchisee activities.
- **Customer Directory**: Centralized database for managing customer information and rates.

### 📊 Advanced Reporting
- **Operations Metrics**: Detailed analysis of Last Mile operations.
- **Performance Analytics**: Attempt-wise performance tracking and employee attendance.
- **Financial Reports**: Payment details, invoice generation, and rate data management (Domestic & International).

### 🛠️ Administrative Tools
- **Rate Management**: Dynamic configuration of shipping rates across various zones and services.
- **Invoice System**: Automated generation and management of customer invoices.
- **Waitlist/Booking**: Management of domestic and international bookings.

---

## 🛠️ Technology Stack

- **Frontend Framework**: [React 18](https://reactjs.org/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **State Management**: [Redux](https://redux.js.org/) with [Redux-Saga](https://redux-saga.js.org/) for side effects.
- **Routing**: [React Router v6](https://reactrouter.com/)
- **UI & Styling**: 
  - [Bootstrap 5](https://getbootstrap.com/) & [Reactstrap](https://reactstrap.github.io/)
  - [Styled Components](https://styled-components.com/)
  - [Sass](https://sass-lang.com/) for advanced styling.
  - [Lucide React](https://lucide.dev/) & [React Icons](https://react-icons.github.io/react-icons/) for iconography.
- **Forms & Validation**: [Formik](https://formik.org/) & [Yup](https://github.com/jquense/yup)
- **Data Tables**: [TanStack Table v8](https://tanstack.com/table/v8)
- **Internationalization**: [i18next](https://www.i18next.com/)
- **Utilities**: 
  - [Axios](https://axios-http.com/) for API communication.
  - [Date-fns](https://date-fns.org/) for modern date handling.
  - [XLSX](https://github.com/SheetJS/sheetjs) for Excel export/import.
  - [JsPDF](https://github.com/parallax/jsPDF) & [Html2Canvas](https://html2canvas.hertzen.com/) for PDF generation.

---

## 🔐 Privilege & Access Control

The application implements a robust role-based access control (RBAC) system to ensure data security and operational integrity.

### How Privileges Work
1.  **Authentication**: User data, including roles and permissions, is stored in `localStorage` upon successful login.
2.  **Permission Mapping**: A central utility `checkCustomerPermissions.js` processes the user's role (`cust_type`) and admin status.
3.  **Dynamic Routing**: The application dynamically generates authorized routes based on these permissions. If a user doesn't have the required privilege, the route is not registered in the application's matching logic.
4.  **Landing Logic**: Users are automatically redirected to their primary functional area (e.g., Sales to User List, Operations to Reports) upon login.

### Available Roles & Capabilities
| Role | Capabilities | Primary Entry Point |
| :--- | :--- | :--- |
| **Admin** | Full access to all modules and system settings. | /user-list |
| **Sales** | User and Franchisee management. | /user-list |
| **POD** | Proof of Delivery management. | /add-pod |
| **Accounting** | Invoice generation and financial tracking. | /franchise_invoice |
| **Operations** | Access to all operational and performance reports. | /admin-booking-download |
| **Retail-Franchise** | Booking management and customer tracking. | /corporate-booking |

---

## 🏗️ Project Structure

```text
src/
├── api/             # API service configurations and interceptors
├── assets/          # Static assets (images, fonts, scss)
├── components/      # Reusable UI components (Layouts, Headers, etc.)
├── constants/       # Global constants and action types
├── helpers/         # Utility functions and helper classes
├── hooks/           # Custom React hooks
├── locales/         # Translation files (i18n)
├── pages/           # Page components (Dashboard, Authentication, etc.)
├── routes/          # Route definitions and access middleware
├── store/           # Redux store, actions, reducers, and sagas
└── App.jsx          # Main App component
```

---

## 🛠️ Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v16+ recommended)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)

### Installation
1. Clone the repository:
   ```bash
   git clone <repository-url>
   ```
2. Navigate to the project directory:
   ```bash
   cd Velexp_admin-Master
   ```
3. Install dependencies:
   ```bash
   npm install
   ```

### Development
Start the development server with Hot Module Replacement (HMR):
```bash
npm run dev
```
The app will be available at `http://localhost:5173`.

### Production
Build the project for production:
```bash
npm run build
```
The optimized files will be generated in the `dist/` directory.

---

## 📄 License
This project is private and confidential.

---
🚀 *Developed with ❤️ for VelExp Logistics*
