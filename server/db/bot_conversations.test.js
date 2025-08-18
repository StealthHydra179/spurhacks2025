// Node 22+ has built-in test runner
const test = require('node:test');
const assert = require('node:assert/strict');

// Ensure OpenAI client can initialize on module import
process.env.OPENAI_API_KEY = process.env.OPENAI_API_KEY || 'test-key';

const {
  format,
  formatAccountBalances,
  formatSavingsGoals,
} = require('./bot_conversations');

test('format: maps transaction fields safely and defaults unknowns', () => {
  const input = [
    {
      original_amount: 12.34,
      transaction_time: '2024-01-01T12:00:00Z',
      category_primary: 'Food',
      payment_channel: 'card',
      iso_currency_code: 'USD',
      location: 'NY',
      merchant_name: 'Starbucks',
    },
    {
      // intentionally sparse
      transaction_time: null,
    },
  ];

  const result = format(input);
  assert.equal(result.length, 2);
  assert.deepEqual(result[0], {
    original_amount: 12.34,
    transaction_time: '2024-01-01T12:00:00.000Z',
    category_primary: 'Food',
    payment_channel: 'card',
    iso_currency_code: 'USD',
    location: 'NY',
    merchant_name: 'Starbucks',
  });
  assert.deepEqual(result[1], {
    original_amount: 0,
    transaction_time: null,
    category_primary: 'Uncategorized',
    payment_channel: 'Unknown',
    iso_currency_code: 'USD',
    location: 'Unknown',
    merchant_name: 'Unknown',
  });
});

test('formatAccountBalances: returns empty array when input missing accounts', () => {
  assert.deepEqual(formatAccountBalances(null), []);
  assert.deepEqual(formatAccountBalances({}), []);
  assert.deepEqual(formatAccountBalances({ accounts: null }), []);
});

test('formatAccountBalances: maps account balances with defaults', () => {
  const input = {
    accounts: [
      {
        name: 'Checking',
        type: 'depository',
        subtype: 'checking',
        balances: { current: 1234.56, available: 1000, iso_currency_code: 'USD' },
        mask: '1234',
      },
      {
        balances: {},
      },
    ],
  };

  const result = formatAccountBalances(input);
  assert.equal(result.length, 2);
  assert.deepEqual(result[0], {
    account_name: 'Checking',
    account_type: 'depository',
    account_subtype: 'checking',
    current_balance: 1234.56,
    available_balance: 1000,
    currency_code: 'USD',
    account_mask: '1234',
  });
  assert.deepEqual(result[1], {
    account_name: 'Unknown Account',
    account_type: 'Unknown',
    account_subtype: 'Unknown',
    current_balance: 0,
    available_balance: 0,
    currency_code: 'USD',
    account_mask: '****',
  });
});

test('formatSavingsGoals: empty input returns empty array', () => {
  assert.deepEqual(formatSavingsGoals(null), []);
  assert.deepEqual(formatSavingsGoals([]), []);
});

test('formatSavingsGoals: computes progress, remaining and days until deadline', () => {
  const today = new Date();
  const deadline = new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000); // +3 days
  const goals = [
    {
      title: 'New Laptop',
      description: 'Buy a MacBook',
      amount: 2000,
      current_amount: 500,
      deadline: deadline.toISOString(),
      category: 'purchase',
      priority: 'high',
      status: 'active',
      icon: '💻',
      color: '#000000',
    },
    {
      amount: 0,
      current_amount: 0,
    },
  ];

  const [first, second] = formatSavingsGoals(goals);
  assert.equal(first.title, 'New Laptop');
  assert.equal(first.target_amount, 2000);
  assert.equal(first.current_amount, 500);
  assert.equal(first.progress_percentage, ((500 / 2000) * 100).toFixed(1));
  assert.equal(first.remaining_amount, 1500);
  assert.ok(first.days_until_deadline >= 2 && first.days_until_deadline <= 4);
  assert.equal(first.category, 'purchase');
  assert.equal(first.priority, 'high');
  assert.equal(first.status, 'active');

  assert.equal(second.target_amount, 0);
  assert.equal(second.progress_percentage, 0);
  assert.equal(second.remaining_amount, 0);
});


