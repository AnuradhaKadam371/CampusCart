# 🚀 CampusCart – Student Marketplace Platform

CampusCart is a full-stack **MERN web application** that enables students to **buy and sell items easily within their campus ecosystem**.

It focuses on **fair pricing, structured transactions, and simplicity**, eliminating middlemen and making the process smooth and reliable.

---

## 🌐 Live Demo

🔗 https://campuscart-app.vercel.app

---

## ✨ Key Highlights

* 🎓 Student-focused marketplace
* 🔐 Secure JWT-based authentication
* 📦 Structured purchase request system (no random chat dependency)
* 📅 Pickup scheduling (date, time, location)
* 📧 Email notifications for updates
* 🤖 AI-based product description generation
* 📊 Admin dashboard for management
* 📱 Fully responsive UI

---

## 🧩 Core Features

### 👤 Buyer Features

* Browse products by category
* View product details with images
* Send purchase requests
* Track request status (pending / accepted / rejected)
* View pickup details after acceptance
* Add/remove items from wishlist

---

### 🛒 Seller Features

* Add products with images and descriptions
* Generate product descriptions automatically using AI
* Manage listings (active / sold)
* View incoming purchase requests
* Accept or reject requests
* Provide pickup details (date, time, location)
* Automatic email notifications to buyers

---

### 🛡️ Admin Features

* Admin dashboard overview
* Manage users
* Manage product listings
* Filter products by category
* Monitor orders and activity

---

## 🤖 AI Feature – Description Generator

CampusCart includes an **AI-powered description generator** that helps sellers:

* Automatically generate product descriptions from images
* Save time while listing products
* Improve listing quality and readability

👉 This enhances user experience and makes listings more professional.

---

## 🛒 Categories Available

* Books
* Electronics
* Hostel
* Stationery
* Lab
* Sports
* Others

---

## 🔄 How It Works

1. Buyer sends a purchase request
2. Seller reviews all incoming requests
3. Seller accepts one request
4. Product is marked as **SOLD**
5. Seller provides pickup details
6. Buyer receives email with confirmation

---

## 🛠️ Tech Stack

### Frontend

* React.js (Vite)
* React Router
* Context API
* Custom CSS

### Backend

* Node.js
* Express.js

### Database

* MongoDB
* Mongoose

### Other Tools

* JWT Authentication
* Bcrypt (Password Hashing)
* Multer (Image Uploads)
* Nodemailer (Email Service)
* AI Model Integration (Image-to-text description generation)

---

## 📁 Project Structure

```
CampusCart/
│
├── client/                # Frontend (React)
│   ├── components/
│   ├── pages/
│   ├── context/
│   ├── utils/
│   └── App.jsx
│
├── server/                # Backend (Node + Express)
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   └── index.js
```

---

## ⚙️ Local Setup (Optional)

### 1️⃣ Clone Repository

```bash
git clone https://github.com/AnuradhaKadam371/campuscart.git
cd campuscart
```

### 2️⃣ Backend Setup

```bash
cd server
npm install
```

Create a `.env` file:

```env
PORT=5000
MONGO_URI=your_mongodb_uri
JWT_SECRET=your_secret_key
EMAIL=your_email_here
EMAIL_PASS=your_app_password_here
```

### 3️⃣ Frontend Setup

```bash
cd client
npm install
npm run dev
```

### 4️⃣ Run Backend

```bash
cd server
npm start
```

---

## 🚀 Deployment

* Frontend deployed on Vercel
* Backend deployed on (Render / Railway / etc.)
* Database hosted on MongoDB Atlas

---

## 🎯 Project Goal

CampusCart aims to:

* Enable **direct buyer-seller interaction**
* Ensure **fair pricing (no middleman)**
* Provide a **structured and reliable system**
* Make buying and selling simple for students

---

## ❤️ Built for Students, by Students
