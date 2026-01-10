/* ==========================================
   Header Component
   Main navigation header with user section
   ========================================== */

import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import './Header.css';

const Header = () => {
    const { user, logout, isAdmin } = useAuth();
    const { isDark, toggleTheme } = useTheme();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    return (
        <header className="main-header">
            <div className="header-container">
                <div className="logo-section" onClick={() => navigate('/')}>
                    <h1>Knowledge Repository</h1>
                </div>

                <nav className="main-nav">
                    <NavLink to="/" className={({ isActive }) => `nav-btn ${isActive ? 'active' : ''}`}>
                        <i className="fa-solid fa-file-lines"></i> מאמרים
                    </NavLink>
                    <NavLink to="/recently-viewed" className={({ isActive }) => `nav-btn ${isActive ? 'active' : ''}`}>
                        <i className="fa-solid fa-clock-rotate-left"></i> נצפו לאחרונה
                    </NavLink>
                    <NavLink to="/favorites" className={({ isActive }) => `nav-btn ${isActive ? 'active' : ''}`}>
                        <i className="fa-solid fa-heart"></i> מועדפים
                    </NavLink>
                    <NavLink to="/editor" className={({ isActive }) => `nav-btn ${isActive ? 'active' : ''}`}>
                        <i className="fa-solid fa-pen-to-square"></i> עורך מאמרים
                    </NavLink>
                    <NavLink to="/tags" className={({ isActive }) => `nav-btn ${isActive ? 'active' : ''}`}>
                        <i className="fa-solid fa-tags"></i> ניהול תגיות
                    </NavLink>
                    <NavLink to="/profile" className={({ isActive }) => `nav-btn ${isActive ? 'active' : ''}`}>
                        <i className="fa-solid fa-user"></i> פרופיל
                    </NavLink>
                </nav>

                <div className="user-section">
                    <button onClick={toggleTheme} className="btn-theme-toggle" title={isDark ? 'מצב בהיר' : 'מצב כהה'}>
                        <i className={`fa-solid ${isDark ? 'fa-sun' : 'fa-moon'}`}></i>
                    </button>
                    <span className="user-email">
                        {user?.email || 'משתמש'}
                    </span>
                    <button onClick={handleLogout} className="btn-logout">
                        <i className="fa-solid fa-right-from-bracket"></i> יציאה
                    </button>
                </div>
            </div>
        </header>
    );
};

export default Header;
