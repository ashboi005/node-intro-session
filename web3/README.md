# Blockchain Visualization App

A live interactive blockchain simulation built with Next.js and TypeScript. This application demonstrates how blockchain technology works by visualizing the cryptographic linking between blocks and showing real-time chain integrity validation.

## Features

- 🔗 **Interactive Blockchain**: Visualize how blocks are cryptographically linked
- 🔍 **Real-time Validation**: See instant chain integrity checks when data is modified
- 🎨 **Modern UI**: Beautiful interface built with Tailwind CSS and custom components
- ⚡ **Live Demo**: Edit block data and watch the chain reaction in real-time
- 🔒 **SHA-256 Hashing**: Uses the same cryptographic hash function as Bitcoin

## Demo

The application shows "The Unbreakable Chain" - a blockchain with 4 blocks containing sample transaction data. Try editing the data in any block to see how it affects the entire chain's validity!

## Getting Started

First, install the dependencies:

```bash
npm install
```

Then, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Technology Stack

- **Framework**: Next.js 15.4.6 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **UI Components**: Custom components with class-variance-authority
- **Cryptography**: Web Crypto API (SHA-256)

## Project Structure

```
src/
├── app/
│   ├── globals.css          # Global styles and Tailwind imports
│   ├── layout.tsx           # Root layout component
│   └── page.tsx             # Main blockchain visualization page
```

## How It Works

1. **Block Creation**: Each block contains an index, data, previous hash, and its own hash
2. **Hash Calculation**: SHA-256 algorithm creates unique fingerprints for each block
3. **Chain Linking**: Each block references the hash of the previous block
4. **Validation**: Real-time checking ensures chain integrity when data changes

## Building for Production

```bash
npm run build
npm start
```
