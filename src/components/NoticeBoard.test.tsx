import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import NoticeBoard from './NoticeBoard';

describe('NoticeBoard Component', () => {
  it('renders the notice board title', () => {
    render(<NoticeBoard />);
    expect(screen.getByText('Notice Board')).toBeInTheDocument();
  });

  it('renders the initial notices', () => {
    render(<NoticeBoard />);
    expect(screen.getByText('System Update')).toBeInTheDocument();
    expect(screen.getByText('New Feature')).toBeInTheDocument();
  });
});
