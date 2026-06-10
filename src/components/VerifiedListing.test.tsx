import React from 'react';
import { render, screen } from '@testing-library/react';
import VerifiedListing from './VerifiedListing';

describe('VerifiedListing', () => {
    it('renders with default props', () => {
        render(<VerifiedListing />);
        expect(screen.getByText('현장 검증 완료')).toBeInTheDocument();
        expect(screen.getByText('서울시 강남구 테헤란로 123')).toBeInTheDocument();
    });

    it('renders with custom props', () => {
        render(
            <VerifiedListing
                address="Custom Address"
                timestamp="2026-01-01 12:00:00"
                gpsCoords="1.23, 4.56"
            />
        );
        expect(screen.getByText('Custom Address')).toBeInTheDocument();
        expect(screen.getByText('2026-01-01 12:00:00')).toBeInTheDocument();
        expect(screen.getByText('1.23, 4.56')).toBeInTheDocument();
    });
});
