import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// Mock AuthContext hook used by the page
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ user: { id: 1, username: 'test' } }),
}));

// Mock plaidService used by the page
const mockGetTransactions = vi.fn();
vi.mock('../services/api', async (importOriginal) => {
  const original = await importOriginal();
  return {
    ...original,
    plaidService: {
      ...original.plaidService,
      getTransactions: (...args: unknown[]) => mockGetTransactions(...args),
    },
  };
});

import Transactions from './Transactions';

function renderPage() {
  return render(
    <MemoryRouter>
      <Transactions />
    </MemoryRouter>
  );
}

const sampleTx = (overrides: Partial<any> = {}) => ({
  transaction_id: 'tx_1',
  account_id: 'acc_1',
  amount: 25.5,
  date: '2024-01-16',
  name: 'Starbucks',
  category: ['Food', 'Coffee'],
  payment_channel: 'card',
  pending: false,
  merchant_name: 'Starbucks',
  logo_url: null,
  personal_finance_category: {
    primary: 'FOOD_AND_DRINK',
    detailed: 'FOOD_AND_DRINK_COFFEE',
    confidence_level: 'HIGH',
  },
  counterparties: null,
  location: { address: null, city: 'Seattle', region: 'WA', country: 'US' },
  iso_currency_code: 'USD',
  transaction_type: 'place',
  authorized_date: null,
  datetime: null,
  ...overrides,
});

describe('Transactions page', () => {
  beforeEach(() => {
    mockGetTransactions.mockReset();
  });

  it('renders loading then displays transactions', async () => {
    mockGetTransactions.mockResolvedValueOnce({ transactions: [sampleTx()] });

    renderPage();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();

    await waitFor(() =>
      expect(screen.getByText('Transactions')).toBeInTheDocument()
    );

    // Row appears with merchant name
    expect(screen.getByText(/Starbucks/i)).toBeInTheDocument();
    // Amount is formatted
    expect(screen.getByText('$25.50')).toBeInTheDocument();
  });

  it('applies search filter', async () => {
    mockGetTransactions.mockResolvedValueOnce({
      transactions: [
        sampleTx({ name: 'Starbucks', merchant_name: 'Starbucks' }),
        sampleTx({ name: 'Target', merchant_name: 'Target', transaction_id: 'tx_2' }),
      ],
    });

    renderPage();
    await screen.findByText('Transactions');

    const search = screen.getByPlaceholderText('Search transactions...');
    fireEvent.change(search, { target: { value: 'starb' } });

    // Target should be filtered out. Starbucks may appear multiple times (merchant + elsewhere)
    const starbucksEls = await screen.findAllByText('Starbucks');
    expect(starbucksEls.length).toBeGreaterThan(0);
    expect(screen.queryByText('Target')).not.toBeInTheDocument();
  });

  it('filters by category', async () => {
    mockGetTransactions.mockResolvedValueOnce({
      transactions: [
        sampleTx({ name: 'Starbucks', merchant_name: 'Starbucks', personal_finance_category: { primary: 'FOOD_AND_DRINK', detailed: 'FOOD_AND_DRINK_COFFEE', confidence_level: 'HIGH' } }),
        sampleTx({ name: 'Uber', merchant_name: 'Uber', transaction_id: 'tx_2', personal_finance_category: { primary: 'TRANSPORTATION', detailed: 'TRANSPORTATION_RIDESHARE', confidence_level: 'HIGH' } }),
      ],
    });

    renderPage();
    await screen.findByText('Transactions');

    // Open the first combobox (Category Select)
    const [categoryCombobox] = screen.getAllByRole('combobox');
    fireEvent.mouseDown(categoryCombobox);
    const listbox = await screen.findByRole('listbox');
    const option = within(listbox).getByText('Transportation');
    fireEvent.click(option);

    expect(await screen.findByText('Uber')).toBeInTheDocument();
    expect(screen.queryByText('Starbucks')).not.toBeInTheDocument();
  });
});


