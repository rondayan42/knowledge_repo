/* ==========================================
   Footer Component Tests
   ========================================== */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Footer from './Footer';

describe('Footer', () => {
    it('renders copyright text', () => {
        render(<Footer />);

        expect(screen.getByText(/© 2025 Knowledge Repository/)).toBeInTheDocument();
    });

    it('has main-footer class', () => {
        render(<Footer />);

        expect(document.querySelector('.main-footer')).toBeInTheDocument();
    });

    it('has footer-content class', () => {
        render(<Footer />);

        expect(document.querySelector('.footer-content')).toBeInTheDocument();
    });
});
