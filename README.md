# Collab Editor

A real-time collaborative code editor built with React, TypeScript, Express, and Socket.io. This project uses a monorepo structure with Yarn workspaces to manage shared code between the client and server.

## 🏗️ Project Structure

```
collab-editor/
├── client/          # React frontend application
├── server/          # Express backend with Socket.io
├── shared/          # Shared TypeScript types and utilities
└── package.json     # Root workspace configuration
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- Yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd collab-editor
```

2. Install dependencies:
```bash
yarn install
```

### Development

Run the client and server in development mode:

**Terminal 1 - Start the server:**
```bash
cd server
yarn dev
```

The server will start on `http://localhost:3000` (or the port specified in `PORT` environment variable).

**Terminal 2 - Start the client:**
```bash
cd client
yarn dev
```

The client will be available at `http://localhost:5173` (Vite default port).

## 📦 Workspaces

### Client (`client/`)
- **Tech Stack**: React 19, TypeScript, Vite, Socket.io-client
- **Scripts**:
  - `yarn dev` - Start development server
  - `yarn build` - Build for production
  - `yarn preview` - Preview production build
  - `yarn lint` - Run ESLint

### Server (`server/`)
- **Tech Stack**: Express, Socket.io, TypeScript
- **Scripts**:
  - `yarn dev` - Start development server with hot reload
  - `yarn build` - Compile TypeScript
  - `yarn start` - Run production build

### Shared (`shared/`)
- **Purpose**: Shared TypeScript types and interfaces for type-safe communication between client and server
- **Scripts**:
  - `yarn build` - Compile TypeScript definitions

## 🔌 Socket.io Events

### Client to Server
- `room:join` - Join a collaborative room

### Server to Client
- `room:joined` - Confirmation of room join
- `room:state` - Current room state (code, version, users)
- `user:joined` - Notification when a new user joins

## 🛠️ Development

### Building

Build all workspaces:
```bash
# Build shared package first
cd shared && yarn build

# Build server
cd ../server && yarn build

# Build client
cd ../client && yarn build
```

### Type Safety

The project uses TypeScript throughout with shared types defined in the `shared` package. This ensures type-safe communication between the client and server via Socket.io events.

## 📝 License

MIT
