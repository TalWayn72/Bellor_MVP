1.  Global + User Runtime Flow Chart
    User opens the app
    │
    ▼
    App.jsx
    └── wraps the app with global providers
    │
    ├── AuthProvider
    │ └── gives global auth state:
    │ user, JWT/token, isAuthenticated, login/logout
    │
    └── SocketProvider
    └── gives global realtime state:
    socket connection, isConnected, unread count,
    heartbeat, realtime event listeners

            │
            ▼

    User enters chat from one of the chat entry points
    │
    ├── SharedSpace.jsx
    │ └── temporary chat request flow
    │
    ├── CommentInputDialog.jsx
    │ └── permanent chat / comment-as-message flow
    │
    └── TemporaryChats.jsx
    └── temporary chats list

            │
            ▼

    chatService.ts
    └── frontend REST API layer
    │
    ├── create/get/list chats
    ├── load chat metadata
    ├── load old messages
    ├── REST fallback send message
    ├── mark message as read
    └── delete message

            │
            ▼

    Backend REST Layer
    │
    ├── routes/v1/index.ts
    │ └── registers /chats
    │
    ├── chats.routes.ts
    │ └── applies auth middleware to chat routes
    │
    ├── chats-crud.routes.ts
    │ └── handles create/get/list chats
    │
    └── chats-messages.routes.ts
    └── handles message history/send/read/delete

            │
            ▼

    Backend Services
    │
    ├── chat.service.ts
    │ └── main chat business logic:
    │ getUserChats, getChatById, createOrGetChat
    │
    ├── chat-messages-queries.service.ts
    │ └── loads message history from Prisma
    │
    └── chat-messages-mutations.service.ts
    └── creates messages, marks read, soft deletes

            │
            ▼

    Prisma / PostgreSQL
    │
    ├── Chat model / chats table
    ├── Message model / messages table
    ├── ChatStatus enum
    └── MessageType enum

            │
            │ Chat row is created or reused
            │
            ▼

    Frontend navigates to PrivateChat.jsx with chatId
    │
    ▼
    PrivateChat.jsx
    └── main real user-to-user chat screen
    │
    ├── REST through chatService.ts:
    │ ├── load chat metadata
    │ └── load old message history
    │
    └── WebSocket through socket layer:
    └── join realtime chat room with chat:join

            │
            ▼

    Frontend Socket Layer
    │
    ├── socketService.js
    │ └── Socket.io client singleton
    │ connects using JWT from tokenStorage
    │
    ├── socketChatMethods.js
    │ └── defines socket chat methods:
    │ joinChat, leaveChat, sendMessage,
    │ sendTyping, markMessageRead,
    │ deleteMessage, getUnreadCount
    │
    ├── useChatRoom.js
    │ └── handles realtime room behavior:
    │ chat:join, chat:leave,
    │ listens to chat:message:new,
    │ chat:typing, chat:message:deleted
    │
    └── usePrivateChatActions.js
    └── handles sending:
    WebSocket first, REST fallback if needed

            │
            ▼

    User sends a message
    │
    ▼
    usePrivateChatActions.js
    │
    ├── Preferred path: WebSocket
    │ │
    │ ▼
    │ socketChatMethods.js
    │ └── emits chat:message
    │
    └── Fallback path: REST
    │
    ▼
    chatService.ts
    └── POST /chats/:chatId/messages

            │
            ▼

    Backend receives the message
    │
    ├── WebSocket path
    │ │
    │ ▼
    │ chat-send.handler.ts
    │ ├── checks chat access
    │ ├── saves message in DB
    │ ├── updates chat timestamp
    │ ├── emits chat:message:new
    │ └── sends push notification if recipient is offline
    │
    └── REST fallback path
    │
    ▼
    chat-messages-mutations.service.ts
    ├── checks access/business rules
    ├── saves message in DB
    └── returns saved message

            │
            ▼

    Prisma / PostgreSQL
    │
    └── Message row is saved:
    chatId, senderId, messageType,
    content/textContent, isRead,
    isDeleted, createdAt

            │
            ▼

    Backend WebSocket emits realtime update
    │
    └── chat:message:new

            │
            ▼

    Recipient frontend
    │
    └── useChatRoom.js receives chat:message:new

            │
            ▼

    PrivateChat.jsx
    │
    └── appends realtime message to existing REST-loaded messages

            │
            ▼

    User sees the new message live

Small version incase you dont understand:
App.jsx
→ AuthProvider gives identity/JWT
→ SocketProvider gives realtime socket connection

Chat Entry Point
→ SharedSpace / CommentInputDialog / TemporaryChats
→ chatService REST creates or gets chat
→ backend REST routes
→ backend services
→ Prisma/PostgreSQL creates or reuses Chat

PrivateChat.jsx
→ REST loads chat metadata + old messages
→ WebSocket joins realtime room with chat:join

User sends message
→ usePrivateChatActions
→ WebSocket first through socketChatMethods
→ REST fallback through chatService if socket fails

Backend
→ chat-send.handler or REST mutation service
→ validates access
→ saves Message in PostgreSQL
→ emits chat:message:new

Recipient
→ useChatRoom receives realtime event
→ PrivateChat appends message
→ UI updates live
