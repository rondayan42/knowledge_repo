/* ==========================================
   Login Page
   Authentication form for user login/register
   ========================================== */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/common/Toast';
import './Login.css';

const Login = () => {
    const navigate = useNavigate();
    const { login, register, isAuthenticated } = useAuth();
    const toast = useToast();

    const [isRegisterMode, setIsRegisterMode] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);

    // Redirect if already authenticated
    if (isAuthenticated) {
        navigate('/', { replace: true });
        return null;
    }

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (isRegisterMode && password !== confirmPassword) {
            toast.error('הסיסמאות אינן תואמות');
            return;
        }

        setLoading(true);

        try {
            if (isRegisterMode) {
                await register(email, password);
                toast.success('ההרשמה הצליחה!');
            } else {
                await login(email, password);
                toast.success('התחברת בהצלחה!');
            }
            navigate('/', { replace: true });
        } catch (err) {
            toast.error(err.error || 'שגיאה בביצוע הפעולה');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">
            <div className="login-container">
                <div className="login-header">
                    <h1>Knowledge Repository</h1>
                    <p>{isRegisterMode ? 'יצירת חשבון חדש' : 'כניסה למערכת'}</p>
                </div>

                <form onSubmit={handleSubmit} className="login-form">
                    <div className="form-group">
                        <label htmlFor="email">דואר אלקטרוני</label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="הכנס את כתובת המייל שלך"
                            required
                            autoComplete="email"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">סיסמה</label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="הכנס סיסמה"
                            required
                            autoComplete={isRegisterMode ? 'new-password' : 'current-password'}
                        />
                    </div>

                    {isRegisterMode && (
                        <div className="form-group">
                            <label htmlFor="confirmPassword">אימות סיסמה</label>
                            <input
                                type="password"
                                id="confirmPassword"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="הכנס את הסיסמה שוב"
                                required
                                autoComplete="new-password"
                            />
                        </div>
                    )}

                    <button type="submit" className="btn-login" disabled={loading}>
                        {loading ? 'מעבד...' : isRegisterMode ? 'הרשמה' : 'התחברות'}
                    </button>
                </form>

                <div className="login-footer">
                    <button
                        type="button"
                        className="btn-toggle-mode"
                        onClick={() => setIsRegisterMode(!isRegisterMode)}
                    >
                        {isRegisterMode ? 'יש לך חשבון? התחבר' : 'אין לך חשבון? הירשם'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Login;
