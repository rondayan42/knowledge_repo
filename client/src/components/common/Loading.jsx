/* ==========================================
   Loading Component
   Full-screen loading spinner
   ========================================== */

import './Loading.css';

const Loading = ({ message = 'טוען...' }) => {
    return (
        <div className="loading-overlay">
            <div className="loading-spinner"></div>
            <p className="loading-message">{message}</p>
        </div>
    );
};

export default Loading;
