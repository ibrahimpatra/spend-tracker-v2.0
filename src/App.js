import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { auth } from "./firebase"; 
import { onAuthStateChanged } from "firebase/auth";
import Layout from "./components/Layout";

// Pages
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Records from "./pages/Records";
import ManageAccounts from "./pages/ManageAccounts";
import Categories from "./pages/Categories"; // Assuming you have this from previous step

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if auth exists to prevent crash if firebase isn't fully loaded
    if (!auth) { setUser(null); setLoading(false); return; }
    return onAuthStateChanged(auth, (u) => { setUser(u || null); setLoading(false); });
  }, []);

  if (loading) return <div className="flex h-screen items-center justify-center text-money-600 font-bold animate-pulse">Loading Vault...</div>;

  return (
    <Router>
      <Routes>
        <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
        <Route path="/register" element={!user ? <Register /> : <Navigate to="/" />} />
        
        {/* Protected Routes wrapped in Layout */}
        <Route path="/" element={user ? <Layout user={user}><Dashboard user={user}/></Layout> : <Navigate to="/login" />} />
        <Route path="/records" element={user ? <Layout user={user}><Records user={user}/></Layout> : <Navigate to="/login" />} />
        <Route path="/accounts" element={user ? <Layout user={user}><ManageAccounts user={user}/></Layout> : <Navigate to="/login" />} />
        <Route path="/categories" element={user ? <Layout user={user}><Categories user={user}/></Layout> : <Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}

export default App;