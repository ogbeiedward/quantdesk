import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const navigate = useNavigate();

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    // !TODO: implement actual registration API call
    console.log('Register with:', name, email, password);
    navigate('/login');
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-trading-dark p-4">
      <div className="w-full max-w-md bg-trading-panel rounded-xl shadow-lg border border-trading-border p-8">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-trading-blue rounded-lg mx-auto flex items-center justify-center mb-4">
            <span className="text-white font-bold text-xl">Q</span>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Create Account</h1>
          <p className="text-trading-muted text-sm">Join the QuantDesk trading platform</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-trading-text mb-1" htmlFor="name">
              Full Name
            </label>
            <input
              id="name"
              type="text"
              required
              className="w-full bg-trading-dark border border-trading-border rounded-lg px-4 py-2 text-white focus:outline-none focus:border-trading-blue transition-colors"
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-trading-text mb-1" htmlFor="email">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              required
              className="w-full bg-trading-dark border border-trading-border rounded-lg px-4 py-2 text-white focus:outline-none focus:border-trading-blue transition-colors"
              placeholder="trader@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-trading-text mb-1" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              className="w-full bg-trading-dark border border-trading-border rounded-lg px-4 py-2 text-white focus:outline-none focus:border-trading-blue transition-colors"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            className="w-full bg-trading-green hover:bg-green-600 text-white font-medium py-2 px-4 rounded-lg transition-colors mt-6"
          >
            Create Account
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-trading-muted">
          Already have an account?{' '}
          <Link to="/login" className="text-trading-blue hover:text-blue-400">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
