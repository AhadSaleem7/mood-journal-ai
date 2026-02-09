import React, { useState } from 'react';
import { StarsBackground } from '@/components/animate-ui/components/backgrounds/stars';
import { cn } from '@/lib/utils';

interface AuthProps {
    onLogin: (token: string, username: string) => void;
}

export default function Auth({ onLogin }: AuthProps) {
    const [isLogin, setIsLogin] = useState(true);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const endpoint = isLogin ? `${import.meta.env.VITE_API_URL}/api/login` : `${import.meta.env.VITE_API_URL}/api/signup`;

        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Something went wrong');
            }

            onLogin(data.token, data.username);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (

        <div className="flex items-center justify-center min-h-[50vh]">
            <div className="w-full max-w-md p-8 space-y-6 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-xl">
                <h2 className="text-3xl font-bold text-center text-white">
                    {isLogin ? 'Welcome Back' : 'Create Account'}
                </h2>

                {error && (
                    <div className="p-3 text-sm text-red-200 bg-red-500/20 border border-red-500/30 rounded-lg">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300">Username</label>
                        <input
                            type="text"
                            required
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full mt-1 px-4 py-2 bg-black/20 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white placeholder-gray-500"
                            placeholder="Enter your username"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300">Password</label>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full mt-1 px-4 py-2 bg-black/20 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white placeholder-gray-500"
                            placeholder="Enter your password"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 px-4 font-semibold text-white bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                    >
                        {loading ? 'Processing...' : (isLogin ? 'Login' : 'Sign Up')}
                    </button>
                </form>

                <div className="text-center">
                    <button
                        onClick={() => setIsLogin(!isLogin)}
                        className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
                    >
                        {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Login"}
                    </button>
                </div>
            </div>
        </div>

    );
}
