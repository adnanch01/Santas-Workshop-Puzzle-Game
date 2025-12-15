import React, { useState } from 'react';

const LoginForm = ({ onLogin }) => {
    const [isRegistering, setIsRegistering] = useState(false);
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const endpoint = isRegistering ? '/api/auth/register' : '/api/auth/login';
            const body = isRegistering 
                ? { username, email, password }
                : { username, password };

            const response = await fetch(`http://localhost:3001${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.error || 'An error occurred');
                setLoading(false);
                return;
            }

            // Store userId in localStorage and call parent callback
            localStorage.setItem('userId', data.userId);
            localStorage.setItem('username', data.username);
            onLogin(data.userId, data.username);

        } catch (error) {
            console.error('Auth error:', error);
            setError('Unable to connect to server. Please try again.');
            setLoading(false);
        }
    };

    const handleGuestLogin = async () => {
        setError('');
        setLoading(true);

        try {
            const response = await fetch('http://localhost:3001/api/users/create-guest', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.error || 'An error occurred');
                setLoading(false);
                return;
            }

            localStorage.setItem('userId', data.userId);
            localStorage.setItem('username', data.username);
            onLogin(data.userId, data.username);

        } catch (error) {
            console.error('Guest login error:', error);
            setError('Unable to connect to server. Please try again.');
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-box">
                <h2>{isRegistering ? 'Register' : 'Login'}</h2>
                
                {error && <div className="error-message">{error}</div>}
                
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Username:</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            disabled={loading}
                        />
                    </div>
                    
                    {isRegistering && (
                        <div className="form-group">
                            <label>Email (optional):</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                disabled={loading}
                            />
                        </div>
                    )}
                    
                    <div className="form-group">
                        <label>Password:</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            disabled={loading}
                        />
                    </div>
                    
                    <button type="submit" disabled={loading}>
                        {loading ? 'Please wait...' : (isRegistering ? 'Register' : 'Login')}
                    </button>
                </form>
                
                <div className="auth-options">
                    <button 
                        className="link-button" 
                        onClick={() => setIsRegistering(!isRegistering)}
                        disabled={loading}
                    >
                        {isRegistering ? 'Already have an account? Login' : "Don't have an account? Register"}
                    </button>
                    
                    <button 
                        className="guest-button" 
                        onClick={handleGuestLogin}
                        disabled={loading}
                    >
                        Play as Guest
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LoginForm;

