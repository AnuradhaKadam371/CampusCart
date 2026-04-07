# 🚀 CampusCart – Student Marketplace Platform

CampusCart is a full-stack **MERN web application** built to enable university students to **buy, sell, and exchange academic and daily-use items** within their campus ecosystem.

It focuses on **affordability, trust, and simplicity**, helping students monetize unused items while making essential resources accessible at lower costs.

---

## ✨ Key Highlights

- 🎓 Campus-focused marketplace  
- 🔐 Secure JWT-based authentication  
- 💬 Real-time chat between buyers & sellers  
- 📦 Smooth product listing & management  
- 📊 Admin dashboard for moderation  
- 📱 Fully responsive UI  

---

## 🧩 Core Features

### 👤 Student Features

- Register & login with secure authentication  
- Browse products by category (Books, Electronics, Hostel, etc.)  
- Add, edit, and manage product listings  
- View product details with images  
- Chat with sellers/buyers  
- Track orders and requests  
- Wishlist functionality  

---

### 🛒 Seller Features

- Upload products with images and details  
- Manage listings (active / sold)  
- Accept or reject buyer requests  
- Add pickup details with time selection  
- Automatic email notifications on order confirmation  

---

### 🛡️ Admin Features

- Admin-only dashboard  
- Manage users and listings  
- Remove inappropriate content  
- Monitor platform activity  

---

## 🛠️ Tech Stack

### Frontend

- React.js (Vite)  
- React Router  
- Context API  
- Custom CSS + Responsive Design  

---

### Backend

- Node.js  
- Express.js  

---

### Database

- MongoDB  
- Mongoose  

---

### Other Tools

- JWT Authentication  
- Bcrypt (Password Hashing)  
- Multer (Image Uploads)  
- Nodemailer (Email Service)  
- Socket.io (Chat System)  

---

## 📁 Project Structure

```bash
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

## ⚙️ Installation & Setup

**1️⃣ Clone Repository**
```bash
git clone https://github.com/<your-username>/campuscart.git
cd campuscart
```

**2️⃣ Backend Setup**
```bash
cd server
npm install
```

**Create a `.env` file:**
```env
PORT=5000
MONGO_URI=your_mongodb_uri
JWT_SECRET=your_secret_key
EMAIL_USER=your_email
EMAIL_PASS=your_email_password
```

**3️⃣ Frontend Setup**
```bash
cd client
npm install
npm run dev
```

**4️⃣ Run Backend**
```bash
cd server
npm start
```

**5️⃣ Open Application**
```bash
http://localhost:5173
```

---

## ❤️ Built for Students, by Students.
