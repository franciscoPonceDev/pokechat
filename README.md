# PokeChat Frontend

This is the frontend for PokeChat, a web application that lets you chat with your favorite Pokémon. It's built with Next.js and Tailwind CSS.

## Features

- **Real-time Chat:** Engage in conversations with an AI-powered Pokémon.
- **Image Identification:** Upload a Pokémon image to identify it and start a chat.
- **Responsive Design:** A clean, responsive interface that works on all devices.

## Tech Stack

- [Next.js](https://nextjs.org/) – React framework for production.
- [React](https://reactjs.org/) – A JavaScript library for building user interfaces.
- [Tailwind CSS](https://tailwindcss.com/) – A utility-first CSS framework.
- [TypeScript](https://www.typescriptlang.org/) – A typed superset of JavaScript.
- [Lucide React](https://lucide.dev/) – A simple and elegant icon library.

## Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites

- Node.js (v18.x or later)
- npm, yarn, or pnpm

### Installation

1. Clone the repo:
   ```sh
   git clone https://github.com/your-username/pokechat.git
   ```
2. Navigate to the frontend directory:
   ```sh
   cd pokechat/pokechat
   ```
3. Install NPM packages:
   ```sh
   npm install
   ```

### Running the Development Server

To start the development server, run:
```sh
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Environment Variables

This project requires the following environment variable to be set in a `.env.local` file in the `pokechat` directory:

- `NEXT_PUBLIC_API_URL`: The URL of the backend API. For local development, this will typically be `http://localhost:8000`.

Example `.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Building for Production

To create a production-ready build, run:
```sh
npm run build
```

## Deployment

The recommended way to deploy this application is on [Vercel](https://vercel.com/), the platform built by the creators of Next.js.

For detailed deployment instructions, refer to the main repository's `README.md` file.
