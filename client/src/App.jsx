import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

import Navigation from './components/Navbar';
import EditProduct from './pages/EditProduct';
import Splash from './pages/Splash';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import AddProduct from './pages/AddProduct';
import ProductDetails from './pages/ProductDetails';
import BuyProduct from './pages/BuyProduct';
import MyProductsDashboard from './pages/MyProductsDashboard';
import Wishlist from './pages/Wishlist';
import MyProfile from './pages/MyProfile';

import PrivateRoute from './components/PrivateRoute';
import AdminRoute from './components/AdminRoute';
import AdminDashboard from './pages/AdminDashboard';
import BuyerRequests from "./pages/BuyerRequests";

import SellerRequests from "./pages/SellerRequests";
import MyRequests from "./pages/MyRequests";
import AcceptRequest from "./pages/AcceptRequest";
import Chat from "./pages/Chat";
import Messages from "./pages/Messages";
function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>

        <Route element={<PrivateRoute />}>
          <Route path="/chat" element={<Chat />} />
        </Route>

        <Route path="/accept-request/:orderId" element={<AcceptRequest />} />
          <Route path="/seller-requests" element={<SellerRequests />} />
          <Route path="/my-requests" element={<MyRequests />} />
 
          <Route element={<PrivateRoute />}>
            <Route path="/buyer-requests" element={<BuyerRequests />} />
          </Route>

          <Route path="/" element={<Splash />} />

          <Route
            path="/home"
            element={
              <>
                <Navigation />
                <Home />
              </>
            }
          />

          <Route
            path="/login"
            element={
              <>
                <Navigation />
                <Login />
              </>
            }
          />

          <Route
            path="/register"
            element={
              <>
                <Navigation />
                <Register />
              </>
            }
          />

          <Route
            path="/product/:id"
            element={
              <>
                <Navigation />
                <ProductDetails />
              </>
            }
          />

          <Route element={<PrivateRoute />}>

            <Route
              path="/edit-product/:id"
              element={
                <>
                  <Navigation />
                  <EditProduct />
                </>
              }
            />

            <Route
              path="/buy/:id"
              element={
                <>
                  <Navigation />
                  <BuyProduct />
                </>
              }
            />

            <Route
              path="/wishlist"
              element={
                <>
                  <Navigation />
                  <Wishlist />
                </>
              }
            />

            <Route
              path="/add-product"
              element={
                <>
                  <Navigation />
                  <AddProduct />
                </>
              }
            />

            <Route
              path="/my-products"
              element={
                <>
                  <Navigation />
                  <MyProductsDashboard />
                </>
              }
            />

            <Route
              path="/messages"
              element={
                <>
                  <Navigation />
                  <Messages />
                </>
              }
            />

            <Route
              path="/myprofile"
              element={
                <>
                  <Navigation />
                  <MyProfile />
                </>
              }
            />

          </Route>

          <Route element={<AdminRoute />}>
            <Route path="/admin" element={<AdminDashboard />} />
          </Route>

        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;