CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR,
    username VARCHAR,
    plaid_id INTEGER,
    hashed_password VARCHAR,
    mode INTEGER,
    income INTEGER
);

CREATE TABLE plaid_users (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,
    access_token VARCHAR,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- ALTER TABLE users
-- ADD CONSTRAINT fk_users_plaid_id
-- FOREIGN KEY (plaid_id) REFERENCES plaid_users(id);

CREATE TABLE follows (
    following_user_id INTEGER,
    followed_user_id INTEGER,
    created_at TIMESTAMP,
    FOREIGN KEY (following_user_id) REFERENCES users(id),
    FOREIGN KEY (followed_user_id) REFERENCES users(id)
);

CREATE TABLE posts (
    id SERIAL PRIMARY KEY,
    title VARCHAR,
    body TEXT,
    user_id INTEGER NOT NULL,
    status VARCHAR,
    created_at TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE accounts (
    id SERIAL PRIMARY KEY,
    plaid_account_id VARCHAR,
    plaid_user_id INTEGER,
    balance DOUBLE PRECISION,
    available_balance DOUBLE PRECISION,
    balance_limit DOUBLE PRECISION,
    currency_code VARCHAR(3),
    name VARCHAR,
    official_name VARCHAR,
    account_type VARCHAR,
    account_subtype VARCHAR,
    mask VARCHAR(4),
    update_time TIMESTAMP,
    FOREIGN KEY (plaid_user_id) REFERENCES plaid_users(id)
);

CREATE TABLE merchants (
    id SERIAL PRIMARY KEY,
    name VARCHAR,
    type VARCHAR,
    logo_url VARCHAR,
    website VARCHAR,
    plaid_id VARCHAR,
    id_confidence VARCHAR
);

CREATE TABLE transactions (
    id SERIAL PRIMARY KEY,
    account_id INTEGER,
    amount DOUBLE PRECISION,
    currency_code VARCHAR(3),
    transaction_time TIMESTAMP,
    authorized_time TIMESTAMP,
    location_address VARCHAR,
    location_city VARCHAR,
    location_region VARCHAR,
    location_postal_code VARCHAR,
    location_country VARCHAR,
    location_lat DOUBLE PRECISION,
    location_lon DOUBLE PRECISION,
    location_store_number VARCHAR,
    primary_merchant INTEGER,
    update_time TIMESTAMP,
    payment_channel VARCHAR,
    pending BOOLEAN,
    pending_transaction_id VARCHAR,
    category_primary VARCHAR,
    category_detailed VARCHAR,
    category_confience_level VARCHAR,
    category_primary_icon VARCHAR,
    plaid_transaction_id VARCHAR,
    FOREIGN KEY (account_id) REFERENCES accounts(id),
    FOREIGN KEY (primary_merchant) REFERENCES merchants(id)
);

CREATE TABLE transaction_merchants (
    transaction_id INTEGER,
    merchant_id INTEGER,
    FOREIGN KEY (transaction_id) REFERENCES transactions(id),
    FOREIGN KEY (merchant_id) REFERENCES merchants(id)
);

CREATE TABLE bot_conversations (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,
    summary VARCHAR,
    create_timestamp TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE conversation_message (
    id SERIAL PRIMARY KEY,
    conversation_id INTEGER,
    message VARCHAR,
    message_number INTEGER,
    sender VARCHAR,
    message_timestamp TIMESTAMP,
    FOREIGN KEY (conversation_id) REFERENCES bot_conversations(id)
);

CREATE TABLE savings_goals (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,
    amount DOUBLE PRECISION,
    start_timestamp TIMESTAMP,
    end_timestamp TIMESTAMP,
    current_amount DOUBLE PRECISION,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
