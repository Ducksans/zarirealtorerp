import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AIAssistant from './AIAssistant';

global.fetch = jest.fn(() =>
    Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ reply: 'Test response' }),
    })
) as jest.Mock;

describe('AIAssistant', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('opens and closes the chat window', async () => {
        render(<AIAssistant />);
        const openButton = screen.getByRole('button');
        
        fireEvent.click(openButton);
        expect(screen.getByText('AI Assistant')).toBeInTheDocument();
        expect(screen.getByText('안녕하세요! 무엇을 도와드릴까요?')).toBeInTheDocument();

        // Close button is the first button inside the chat panel
        const buttons = screen.getAllByRole('button');
        fireEvent.click(buttons[0]);
        
        await waitFor(() => {
            expect(screen.queryByText('AI Assistant')).not.toBeInTheDocument();
        });
    });

    it('sends a message and displays the response', async () => {
        render(<AIAssistant />);
        fireEvent.click(screen.getByRole('button'));
        
        const input = screen.getByPlaceholderText('Ask me anything...');
        fireEvent.change(input, { target: { value: 'Hello' } });
        
        const buttons = screen.getAllByRole('button');
        const submitButton = buttons.find(b => b.getAttribute('type') === 'submit');
        if (submitButton) {
            fireEvent.click(submitButton);
        }

        expect(screen.getByText('Hello')).toBeInTheDocument();

        await waitFor(() => {
            expect(screen.getByText('Test response')).toBeInTheDocument();
        });
    });
});
