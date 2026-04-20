import React, { useState } from 'react';
import { auth, googleProvider } from '../firebase';
import { signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';

export default function AuthScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [error, setError] = useState('');

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setError('');
    try {
        if(isLogin) await signInWithEmailAndPassword(auth, email, pass);
        else await createUserWithEmailAndPassword(auth, email, pass);
    } catch (err) {
        setError(err.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
            <h2 className="text-2xl font-bold text-center mb-6 text-green-800">MoneyMap Tracker</h2>
            
            <button 
                onClick={() => signInWithPopup(auth, googleProvider)}
                className="w-full bg-white border border-gray-300 text-gray-700 font-bold py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-gray-50 mb-6"
            >
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="G" />
                Sign in with Google
            </button>

            <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200"></div></div>
                <div className="relative flex justify-center text-sm"><span className="px-2 bg-white text-gray-500">Or use email</span></div>
            </div>

            <form onSubmit={handleEmailAuth} className="space-y-4">
                <input type="email" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} className="w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-green-500" required />
                <input type="password" placeholder="Password" value={pass} onChange={e=>setPass(e.target.value)} className="w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-green-500" required />
                {error && <p className="text-red-500 text-sm">{error}</p>}
                
                <button type="submit" className="w-full bg-green-600 text-white font-bold py-3 rounded-lg hover:bg-green-700">
                    {isLogin ? 'Log In' : 'Sign Up'}
                </button>
            </form>
            
            <p className="text-center mt-4 text-sm text-gray-600">
                {isLogin ? "No account?" : "Have an account?"} 
                <button onClick={() => setIsLogin(!isLogin)} className="text-green-600 font-bold ml-1">
                    {isLogin ? 'Sign up' : 'Log in'}
                </button>
            </p>
        </div>
    </div>
  );
}