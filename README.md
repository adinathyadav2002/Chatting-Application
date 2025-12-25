# 💬 WebSocket Chat Application

A full-stack real-time messaging platform built with **Node.js**, **React**, **TypeScript**, and **Socket.IO**. Features WhatsApp-like UI with global and private messaging capabilities, plus **WebRTC video calling**.

## ✨ Features

- 🔐 **JWT Authentication** - Secure user registration and login
- 💬 **Real-time Messaging** - Global and private chat functionality
- 📹 **Video Calling** - Peer-to-peer video calls using WebRTC
- 👥 **Online User Status** - Live user presence tracking
- 🖼️ **Avatar System** - Default avatars with color coding
- 🔄 **Auto-scroll** - Automatic scroll to latest messages
- 🍪 **Session Management** - Persistent login with HTTP-only cookies
- 📦 **Database Persistence** - Messages and user data stored in MySQL

## 🛠️ Tech Stack

### Backend

- **Node.js** with **Express.js**
- **Socket.IO** for real-time communication
- **Prisma ORM** with **MySQL** database
- **JWT** for authentication
- **bcryptjs** for password hashing
- **CORS** enabled for cross-origin requests

### Frontend

- **React 18** with **TypeScript**
- **Vite** for fast development and building
- **Tailwind CSS v4** for styling
- **React Router** for navigation
- **Socket.IO Client** for real-time features
- **WebRTC** for peer-to-peer video calling
- **React Icons** for UI icons

## 📁 Project Structure

```
websocket/
├── app.js                    # Main server entry point
├── package.json             # Dependencies and scripts
├── .env                     # Environment variables
├── vite.config.ts           # Vite configuration
├── tsconfig.json            # TypeScript configuration
├── eslint.config.js         # ESLint configuration
├── index.html               # Main HTML file
├── controllers/             # Backend controllers
│   └── authController.js    # Authentication logic
├── routes/                  # API routes
│   ├── userRoutes.js        # User-related endpoints
│   └── messageRoutes.js     # Message-related endpoints
├── prisma/                  # Database schema and migrations
│   └── schema.prisma        # Prisma schema
├── public/                  # Static assets
│   ├── vite.svg            # Vite logo
│   └── logo_bg.png         # Application logo
└── src/                     # Frontend source code
    ├── main.tsx             # React entry point
    ├── App.tsx              # Main App component
    ├── index.css            # Global styles
    ├── types/               # TypeScript type definitions
    │   ├── index.ts         # Message types
    │   ├── user.ts          # User types
    │   └── context.ts       # Context types
    ├── assets/              # Static assets
    │   └── react.svg        # React logo
    ├── components/          # React components
    │   ├── Avatar.tsx       # Avatar component
    │   ├── ChatRoom.tsx     # Main chat interface
    │   ├── MessageList.tsx  # Message display
    │   ├── MessageInput.tsx # Message input field
    │   ├── UserList.tsx     # User listing
    │   ├── UserListItem.tsx # Individual user item
    │   ├── UserSelector.tsx # User selection component
    │   ├── NavigationBridge.tsx        # Navigation wrapper
    │   ├── PrivateChatSidebar.tsx     # Private chat sidebar
    │   ├── PrivateMessageModal.tsx    # Private message modal
    │   ├── PrivateMessagesList.tsx    # Private messages display
    │   ├── PrivateMessagingInterface.tsx  # Private chat interface
    │   └── VideoCallingModal.tsx      # Video call modal (WebRTC)
    ├── pages/              # Page components
    │   ├── Login.tsx       # Login page
    │   ├── Register.tsx    # Registration page
    │   ├── Home.tsx        # Home page with chat
    │   └── Chats.tsx       # Chat list page
    ├── context/            # React Context
    │   ├── UserContext.tsx # User state management
    │   ├── SocketContext.tsx # Socket.IO context
    │   └── PeerContext.tsx # WebRTC peer connection context
    ├── hooks/              # Custom React hooks
    │   ├── useSocket.ts    # Socket management
    │   ├── useUser.ts      # User data hook
    │   └── usePeer.ts      # WebRTC peer hook
    ├── services/           # API services
    │   ├── userServices.tsx      # User API calls
    │   └── messageServices.ts    # Message API calls
    └── utils/              # Utility functions
        └── avatarUtils.ts  # Avatar generation
```

## 🎥 WebRTC Video Calling

The application includes peer-to-peer video calling functionality using WebRTC:

### Features

- **One-to-one video calls** between users
- **Real-time audio and video** streaming
- **Call states**: Calling, Receiving, Live, and Ended
- **ICE candidate exchange** for NAT traversal
- **Offer/Answer negotiation** via Socket.IO signaling
- **Call controls**: Accept, Reject, End call

### How It Works

1. User initiates a video call by clicking the video icon in a private chat
2. WebRTC offer is created and sent via Socket.IO to the recipient
3. Recipient receives a call notification modal
4. Upon acceptance, WebRTC answer is created and sent back
5. ICE candidates are exchanged to establish peer connection
6. Video streams are established between peers
7. Either user can end the call at any time

### Components

- **PeerContext.tsx**: Manages WebRTC peer connections, offers, answers, and ICE candidates
- **VideoCallingModal.tsx**: UI component for video call interface
- **Home.tsx**: Integrates video calling functionality into the chat interface

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v18 or higher)
- **MySQL** database
- **npm** or **yarn**
- **Modern web browser** with WebRTC support (Chrome, Firefox, Safari, Edge)

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/adinathyadav2002/Chatting-Application.git
   cd websocket-chat-app
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   Create a `.env` file in the root directory with the following variables:

   ```env
   # Server Configuration
   VITE_SERVER_PORT=4000
   VITE_API_URL=http://localhost:4000

   # Database Configuration
   DATABASE_URL="mysql://username:password@localhost:3306/chat_app"

   # JWT Configuration
   JWT_SECRET=your-super-secret-jwt-key-here
   JWT_EXPIRES_IN=30d
   JWT_COOKIE_EXPIRES_IN=30

   # Environment
   NODE_ENV=development
   ```

   **Replace the following values:**

   - `username:password` with your MySQL credentials
   - `your-super-secret-jwt-key-here` with a strong secret key
   - `chat_app` with your preferred database name

4. **Set up the database**

   ```bash
   # Install Prisma CLI globally (if not already installed)
   npm install -g prisma

   # Initialize Prisma (if starting fresh)
   npx prisma init

   # Generate Prisma client
   npx prisma generate

   # Push schema to database (creates tables)
   npx prisma db push

   # Alternative: Use migrations (recommended for production)
   npx prisma migrate dev --name init

   # Open Prisma Studio (database GUI)
   npx prisma studio
   ```

5. **Start the development servers**

   **Option 1: Run both servers concurrently**

   ```bash
   npm run dev
   ```

   **Option 2: Run servers separately**

   Terminal 1 (Backend):

   ```bash
   node app.js
   # OR for development with auto-restart
   nodemon app.js
   ```

   Terminal 2 (Frontend):

   ```bash
   npm run client
   ```

6. **Access the application**
   - Frontend: `http://localhost:5173`
   - Backend API: `http://localhost:4000`

## 📋 Available Scripts

```bash
# Start both frontend and backend in development mode
npm run dev

# Start backend server only
npm run server
npm start

# Start frontend only (Vite dev server)
npm run client

# Build for production
npm run build

# Preview production build
npm run preview

# Run ESLint
npm run lint
```

## 🗄️ Database Management with Prisma

### Essential Prisma Commands

```bash
# Initialize Prisma in a new project
npx prisma init

# Generate Prisma client after schema changes
npx prisma generate

# Push schema changes to database (development)
npx prisma db push

# Create and apply migrations (production recommended)
npx prisma migrate dev --name migration_name

# Apply pending migrations
npx prisma migrate deploy

# Reset database (⚠️ DANGER: Deletes all data)
npx prisma migrate reset

# Open Prisma Studio (Database GUI)
npx prisma studio

# Seed the database (if seed script exists)
npx prisma db seed

# Pull database schema to Prisma schema
npx prisma db pull

# Validate Prisma schema
npx prisma validate

# Format Prisma schema file
npx prisma format
```

### Database Schema

The application uses **Prisma ORM** with **MySQL**. Key models include:

```prisma
model User {
  id           Int       @id @default(autoincrement())
  name         String
  email        String    @unique
  socketId     String?
  password     String
  isVerified   Boolean   @default(false)
  isOnline     Boolean   @default(false)
  avatar       String?
  createdAt    DateTime  @default(now())

  messagesSent     Messages[] @relation("SentMessages")
  messagesReceived Messages[] @relation("ReceivedMessages")
}

model Messages {
  id         Int      @id @default(autoincrement())
  senderId   Int
  receiverId Int?
  content    String
  isGlobal   Boolean  @default(false)
  createdAt  DateTime @default(now())

  sender   User  @relation("SentMessages", fields: [senderId], references: [id])
  receiver User? @relation("ReceivedMessages", fields: [receiverId], references: [id])
}
```

## 🔧 Configuration

### Vite Configuration

The project uses Vite with network access enabled for development:

```typescript
export default defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0", // Allow network access
    port: 5173,
  },
});
```

### Socket.IO Configuration

CORS is configured to allow connections from:

- `http://localhost:5173` (Vite dev server)
- `http://192.168.1.9:5173` (Network IP) depends on user

## 🌐 API Endpoints

### Authentication

- `POST /user/register` - User registration
- `POST /user/login` - User login
- `POST /user/logout` - User logout
- `GET /user/validate` - Validate JWT token

### Users

- `GET /user/all` - Get all users

### Messages

- `GET /messages/global` - Get global messages
- `GET /messages/private/:userId` - Get private messages for user

## 🔄 Socket Events

### Client to Server

- `user connected` - User comes online
- `user disconnected` - User goes offline
- `Global message` - Send global message
- `Private message` - Send private message
- `initiate video call` - Start a video call
- `received video call` - Accept video call with answer
- `rejected video call` - Reject incoming video call
- `ended call` - End active video call
- `ice-candidate` - Exchange ICE candidates for WebRTC

### Server to Client

- `online-users` - Updated list of online users
- `Global message` - New global message received
- `Private message` - New private message received
- `want to video call` - Incoming video call notification
- `ice-candidate` - ICE candidate from peer
- `ended call` - Video call ended by peer

## 🚨 Troubleshooting

### Common Issues

1. **Port already in use**

   ```bash
   # Kill processes using the ports
   npx kill-port 4000 5173
   # OR find and kill manually
   lsof -ti:4000 | xargs kill -9
   lsof -ti:5173 | xargs kill -9
   ```

2. **Database connection issues**

   - Verify MySQL is running: `sudo service mysql start`
   - Check DATABASE_URL in `.env` file
   - Ensure database exists or run `npx prisma db push`
   - Test connection: `npx prisma db pull`

3. **Prisma-related issues**

   ```bash
   # Regenerate Prisma client
   npx prisma generate

   # Reset and recreate database
   npx prisma migrate reset
   npx prisma db push

   # Check schema validation
   npx prisma validate

   # View current database state
   npx prisma studio
   ```

4. **Socket connection fails**

   - Check if backend server is running on port 4000
   - Verify CORS configuration in `app.js`
   - Check browser console for WebSocket errors
   - Ensure firewall isn't blocking connections

5. **Video calling issues**

   - Grant camera and microphone permissions in browser
   - Check if HTTPS is required (some browsers require secure context)
   - Verify WebRTC is supported in your browser
   - Check browser console for WebRTC errors
   - Ensure both peers have stable internet connections
   - Test with browsers on same local network first

6. **Build/Dependencies issues**

   ```bash
   # Clear cache and reinstall
   rm -rf node_modules package-lock.json
   npm install

   # Clear Vite cache
   rm -rf .vite

   # Regenerate Prisma client
   npx prisma generate
   ```

7. **Environment variables not loading**
   - Ensure `.env` file is in root directory
   - Check `.env` file syntax (no spaces around `=`)
   - Restart development server after `.env` changes
   - For frontend variables, ensure they start with `VITE_`

### Development Tips

```bash
# Watch database changes in real-time
npx prisma studio

# Check if database is accessible
npx prisma db pull

# View generated SQL migrations
cat prisma/migrations/*/migration.sql

# Check current Prisma client version
npx prisma version

# Format your schema file
npx prisma format
```

## 🎯 Future Enhancements

- [ ] Group video calls (multi-peer)
- [ ] Screen sharing functionality
- [ ] File sharing in chats
- [ ] Message reactions and emojis
- [ ] Voice messages
- [ ] Push notifications
- [ ] End-to-end encryption
- [ ] Message search functionality
- [ ] User profiles and settings
- [ ] Dark/Light theme toggle

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Socket.IO](https://socket.io/) for real-time communication
- [Prisma](https://www.prisma.io/) for database management
- [Tailwind CSS](https://tailwindcss.com/) for styling
- [Vite](https://vitejs.dev/) for fast development experience
- [WebRTC](https://webrtc.org/) for peer-to-peer video calling
- [React Icons](https://react-icons.github.io/react-icons/) for UI icons

## 👨‍💻 Author

**Adinath Yadav**

- GitHub: [@adinathyadav2002](https://github.com/adinathyadav2002)

---

⭐ If you find this project useful, please consider giving it a star on GitHub!
