/* ==========================================
   Loading Component Tests
   ========================================== */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Loading from './Loading';

describe('Loading', () => {
    it('renders with default message', () => {
        render(<Loading />);

        expect(screen.getByText('טוען...')).toBeInTheDocument();
    });

    it('renders with custom message', () => {
        render(<Loading message="Loading data..." />);

        expect(screen.getByText('Loading data...')).toBeInTheDocument();
    });

    it('renders loading spinner', () => {
        render(<Loading />);

        expect(document.querySelector('.loading-spinner')).toBeInTheDocument();
    });

    it('has loading-overlay class', () => {
        render(<Loading />);

        expect(document.querySelector('.loading-overlay')).toBeInTheDocument();
    });
});
