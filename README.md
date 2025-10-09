# Envio Property Data Indexer

A blockchain indexer built with Envio that processes property data events from smart contracts and fetches detailed property information from IPFS, including structure, address, and property details.

## Creating a New Deployment



To create a new deployment in Envio:  

1. **Open Envio Dashboard**: Go to [Envio](https://envio.dev) and select your indexer 
2. **Update Git Settings**: 
   - Open **Settings**
   - Set your desired branch name in **Git Release Branch** (e.g., `production`, `staging`)
   - Click **Update**
3. **Set Environment Variables**:
   - Go to **Environment Variables**
   - Set the following environment variables (see `.env.example` for a complete template):
     ```bash
      # IPFS Gateway Configuration (REQUIRED - Property)
      ENVIO_PROPERTY_IPFS_GATEWAY="https://your-gateway.mypinata.cloud/ipfs"
      ENVIO_PROPERTY_GATEWAY_TOKEN="your-token-here"

      # IPFS Gateway Configuration (OPTIONAL - Address)
      ENVIO_ADDRESS_IPFS_GATEWAY="https://your-gateway.mypinata.cloud/ipfs"
      ENVIO_ADDRESS_GATEWAY_TOKEN="your-token-here"

      # IPFS Gateway Configuration (OPTIONAL - Sales History)
      ENVIO_SALES_HISTORY_IPFS_GATEWAY="https://your-gateway.mypinata.cloud/ipfs"
      ENVIO_SALES_HISTORY_GATEWAY_TOKEN="your-token-here"

      # IPFS Gateway Configuration (OPTIONAL - Tax)
      ENVIO_TAX_IPFS_GATEWAY="https://your-gateway.mypinata.cloud/ipfs"
      ENVIO_TAX_GATEWAY_TOKEN="your-token-here"

      # Wallet Address Allowlist (add your wallet addresses)
      ENVIO_WALLET_ADDRESS_1="0x2C810CD120eEb840a7012b77a2B4F19889Ecf65C"
      ENVIO_WALLET_ADDRESS_2="0xYourSecondWalletAddress"
      # Add more wallets with numbered suffixes if needed
     ```
   - **Note**: The Property gateway configuration is mandatory. The indexer will crash on startup without it.
4. **Create and Push Branch**:
   - Create a new branch from `main` with the same name you set in Git Release Branch:
     ```bash
     git checkout main
     git pull origin main
     git checkout -b production  # or your branch name
     git push origin production
     ```
   - Push any changes to trigger deployment:
     ```bash
     git commit --allow-empty -m "trigger deployment"
     git push origin production
     ```
5. **Monitor Deployment**:
   - Return to Envio dashboard
   - You'll see the deployment has started in your subgraph

## Features

- **Real-time Event Processing**: Monitors `DataSubmitted` and `DataGroupHeartBeat` events with event-level filtering
- **Configurable IPFS Gateways**: Dedicated gateway configuration per data type (property, address, sales, tax)
- **Selective Data Indexing**: Choose which data types to index by configuring their gateways
- **Direct HTTP Requests**: No rate limiting - requests are made directly to gateways as fast as possible
- **Automatic Retry Logic**: Built-in retry with exponential backoff for failed IPFS requests
- **Gateway Observability**: All logs include the gateway URL used for transparency
- **Dynamic Wallet Filtering**: Configurable wallet address allowlist via environment variables with event-level filtering
- **GraphQL API**: Query property data through a GraphQL interface

## Prerequisites

- [Node.js (use v18 or newer)](https://nodejs.org/en/download/current)
- [pnpm (use v8 or newer)](https://pnpm.io/installation)
- [Docker desktop](https://www.docker.com/products/docker-desktop/)
- Git

## Getting Started

### 1. Create Envio Account

1. Visit [envio.dev](https://envio.dev)
2. Sign up for a new account
3. Go to [API Tokens](https://envio.dev/app/api-tokens) to create a new token
4. Save your API token for the next step

### 2. Clone and Setup

```bash
git clone git@github.com:elephant-xyz/envio-subgraph.git
cd envio-subgraph
pnpm install
```

### 3. Environment Configuration

Create a `.env` file in the root directory. You can use `.env.example` as a template:

```bash
# ==================================================
# IPFS Gateway Configuration
# Each data type requires its own gateway and token
# ==================================================

# Property Data Configuration (REQUIRED)
# This gateway is used for:
# - Metadata (label, relationships)
# - Property data (including parcel_identifier used as entity ID)
# - Fact sheets
# Without this, the indexer cannot function.
ENVIO_PROPERTY_IPFS_GATEWAY=https://your-gateway.mypinata.cloud/ipfs
ENVIO_PROPERTY_GATEWAY_TOKEN=your-token-here

# Address Data Configuration (OPTIONAL)
ENVIO_ADDRESS_IPFS_GATEWAY=https://your-gateway.mypinata.cloud/ipfs
ENVIO_ADDRESS_GATEWAY_TOKEN=your-token-here

# Sales History Data Configuration (OPTIONAL)
ENVIO_SALES_HISTORY_IPFS_GATEWAY=https://your-gateway.mypinata.cloud/ipfs
ENVIO_SALES_HISTORY_GATEWAY_TOKEN=your-token-here

# Tax Data Configuration (OPTIONAL)
ENVIO_TAX_IPFS_GATEWAY=https://your-gateway.mypinata.cloud/ipfs
ENVIO_TAX_GATEWAY_TOKEN=your-token-here

# ==================================================
# Wallet Address Configuration
# ==================================================

ENVIO_WALLET_ADDRESS_1=0x1234567890abcdef1234567890abcdef12345678
ENVIO_WALLET_ADDRESS_2=0xabcdef1234567890abcdef1234567890abcdef12
# Add more as needed: ENVIO_WALLET_ADDRESS_3, ENVIO_WALLET_ADDRESS_4, etc.
```

**Important Notes:**
- **Property Gateway (REQUIRED)**: The `ENVIO_PROPERTY_*` configuration is mandatory. Without it, the indexer will fail at startup.
- **Optional Data Types**: Address, Sales History, and Tax data types are optional. If not configured, those data types will be skipped during indexing.
- **Gateway Tokens**: Tokens are optional. If your gateway doesn't require authentication, you can omit the token variables.
- **No Rate Limiting**: Requests are made directly to gateways without throttling. Each gateway handles requests as fast as possible.
- **Wallet Allowlist**: The indexer will only process events from wallet addresses listed in the environment variables.
- **Multiple Wallets**: You can add multiple wallet addresses using the pattern `ENVIO_WALLET_ADDRESS_*`.
- **Security**: The indexer will crash on startup if no wallet addresses are found (this is intentional for security).

### 4. Generate Code from Schema

Before running, generate the TypeScript types:

```bash
pnpm codegen
```

### 5. Local Development

#### Start the indexer locally:

```bash
pnpm dev
```

This will:
- Start the Envio indexer
- Begin processing events from the specified start block
- Fetch IPFS data for property information
- Provide a local GraphQL endpoint at `http://localhost:8080`

**Local Access:**
- Visit http://localhost:8080 to see the GraphQL Playground
- Local password is `testing`

### 6. Testing the Indexer

#### Check GraphQL Endpoint:

Once running, visit the GraphQL playground at `http://localhost:8080` to query your data:

```graphql
query {
  dataSubmittedWithLabels {
    id
    propertyHash
    label
    submitter
    cid
    datetime
    address {
      street_name
      street_number
      city_name
      county_name
      state_code
      postal_code
    }
    property {
      property_type
      parcel_identifier
      property_structure_built_year
      property_effective_built_year
      livable_floor_area
      total_area
    }
    ipfs {
      ipfs_url
      full_generation_command
    }
  }
}

# Query with sales history and tax data
query {
  dataSubmittedWithLabels {
    id
    propertyHash
    salesHistories {
      ownership_transfer_date
      purchase_price_amount
      sale_type
    }
    taxes {
      tax_year
      yearly_tax_amount
      property_assessed_value_amount
      property_market_value_amount
    }
  }
}
```

#### Monitor Processing:

Watch the logs to see events being processed:
- Events from allowlisted wallets will be processed (filtered at indexer level)
- Events from other wallets are automatically skipped before reaching handlers
- IPFS data fetching with automatic retry and exponential backoff
- Gateway information included in all fetch logs for visibility
- Example log output:
  ```
  [22:29:20.506] UINFO: IPFS phase[property_address] fact sheet fetched
    cid: "bafkreifs7xtfm4rd6zmqfnpswum23eougiz4b546avsh3nrzvsdym4euki"
    gateway: "https://your-gateway.mypinata.cloud/ipfs"
    durationMs: 145
  ```

### 7. Deploy to Production

#### Deploy to Envio Cloud:

```bash
pnpm deploy
```

This will deploy your indexer to Envio's hosted infrastructure.

#### Production Environment Variables:

Ensure your production environment has the same environment variables set in your Envio dashboard under your project settings.

## Project Structure

```
├── config.yaml              # Envio indexer configuration
├── schema.graphql           # GraphQL schema definitions
├── src/
│   ├── EventHandlers.ts     # Event processing logic
│   └── utils/
│       └── ipfs.ts         # IPFS data fetching utilities
├── .env                     # Environment variables (local)
└── README.md               # This file
```

## Data Sources

The indexer processes these event types:

- **DataSubmitted**: New property data submissions
- **DataGroupHeartBeat**: Property data updates
- **Other Contract Events**: Role management, upgrades, etc.

For each property event, the indexer:

1. Converts the data hash to IPFS CID
2. Fetches metadata from IPFS to determine the label type ("County" or "Seed")
3. For "County" labels, fetches detailed property, structure, and address data
4. Stores all data in the GraphQL database with proper relationships

## Entity Relationships

- **DataSubmittedWithLabel**: Main entity linking to property, address, IPFS data, sales history, and tax data
- **Address**: Location information (street, city, county, etc.) - Optional
- **Property**: Property metadata (type, built year, parcel ID, etc.) - Required
- **Ipfs**: Fact sheet data (IPFS URL and generation command) - Required
- **SalesHistory**: Property sales and transfer history - Optional
- **Tax**: Property tax assessment information - Optional

Note: Optional entities are only indexed if their corresponding gateway is configured.

## IPFS Gateway Configuration

The indexer uses a configurable gateway system where each data type can use its own dedicated IPFS gateway:

### Gateway Configuration by Data Type

Each data type has its own gateway configuration:

- **Property Data** (REQUIRED): Metadata, relationships, property details, and fact sheets
- **Address Data** (OPTIONAL): Location information
- **Sales History Data** (OPTIONAL): Transaction history
- **Tax Data** (OPTIONAL): Tax assessment information

### Configuration Format

For each data type, you need to set two environment variables:

```bash
ENVIO_<DATA_TYPE>_IPFS_GATEWAY=https://your-gateway-url.com/ipfs
ENVIO_<DATA_TYPE>_GATEWAY_TOKEN=your-token-here  # Optional
```

### Features

- **Direct HTTP Requests**: No rate limiting - each gateway handles requests as fast as possible
- **Optional Authentication**: Tokens are only required if your gateway needs authentication
- **Selective Data Fetching**: Only configured data types will be fetched and indexed
- **Automatic Retry**: Built-in retry logic with exponential backoff for failed requests
- **Gateway Visibility**: All logs include the gateway URL used for each fetch operation

### Gateway Providers

Compatible with any IPFS gateway service:
- Pinata
- Filebase
- IPFS.io
- Cloudflare IPFS
- Web3.storage
- Custom gateways

## Wallet Address Configuration

The indexer uses a dynamic wallet allowlist system:

- Any environment variable starting with `ENVIO_WALLET_ADDRESS` will be included
- Use `ENVIO_WALLET_ADDRESS` for the primary wallet
- Use `ENVIO_WALLET_ADDRESS_2`, `ENVIO_WALLET_ADDRESS_3`, etc. for additional wallets
- The indexer will crash on startup if no wallet addresses are found

## Troubleshooting

### Common Issues:

1. **"Property configuration is REQUIRED" error**:
   - Ensure you have set `ENVIO_PROPERTY_IPFS_GATEWAY` and `ENVIO_PROPERTY_GATEWAY_TOKEN` in your `.env` file
   - The property gateway is mandatory for the indexer to function

2. **"No wallet addresses found" error**:
   - Ensure you have at least one `ENVIO_WALLET_ADDRESS*` variable set in your `.env` file

3. **Data type not being indexed**:
   - Check if you've configured the gateway for that data type (address, sales_history, or tax)
   - Optional data types are skipped if their gateways are not configured
   - Check logs for messages like "[Config] <data_type> data type not configured"

4. **IPFS fetch failures**:
   - Check the logs for specific gateway errors
   - Verify your gateway URL is correct and accessible
   - Check if your gateway token is valid (if authentication is required)
   - Look for gateway information in error logs (logs now include the gateway URL used)

5. **Events not being processed**:
   - Verify your wallet address is in the allowlist
   - Check that the contract address and start block are correct
   - Events are now filtered at the indexer level using `eventFilters`

6. **API token issues**:
   - Ensure your Envio API token is valid and properly set
   - Check your account has the necessary permissions

7. **TypeScript compilation errors**:
   - Run `pnpm codegen` to regenerate types from schema

### Debug Mode:

Enable verbose logging by checking the Envio dashboard logs or running locally to see detailed processing information.

## Development Commands

```bash
# Install dependencies
pnpm install

# Generate TypeScript types from schema
pnpm codegen

# Start local development
pnpm dev

# Deploy to Envio cloud
pnpm deploy
```

## Support

- [Envio Documentation](https://docs.envio.dev) - Complete guide on all Envio indexer features
- [Envio Discord](https://discord.gg/envio)
- [GitHub Issues](./issues) for project-specific problems
