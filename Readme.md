# Animhub Backend

## Overview
Animhub Backend is a Node.js application built with Express.js and MongoDB. It provides APIs for user authentication, video management, tweet and comment management, and admin functionalities.

## Features
- User registration and login
- Video upload, update, and deletion
- Admin login and access control
- JWT-based authentication
- Cloudinary integration for media storage
- Middleware for request validation and error handling
- User profile management
- Video like and comment functionalities
- Tweet management
- Playlist management
- Channel subscription management
- Dashboard statistics
- **Role-Based Access Control (RBAC):** See the dedicated section below for details.

## Role-Based Access Control (RBAC)
RBAC ensures that users have specific permissions based on their roles. Animhub implements the following roles and associated permissions:

### Roles:
1. **Admin**
   - Full control over all videos: view, delete, and toggle publish status (Cannot update the video contents).
   - Can manage users and monitor activity.
   - No authentication required after admin login for protected routes.

2. **Creator**
   - Full control over their own videos: create, update, delete, and toggle publish status.
   - Cannot modify videos created by other users.

3. **Viewer**
   - Limited to viewing videos and interacting with content (e.g., liking, commenting, subscribing).
   - No permission to update, or delete videos that are not his.

### Implementation:
- RBAC is enforced using middleware that checks the user's role (`req.user.status`).
- Admin authentication bypasses additional checks after login, allowing seamless access to protected routes.
- If a user is authenticated as the creator of a video, they can manage it fully.
- Viewers can only access publicly available content.

## Project Structure
/src
|-- /controllers
|   |-- admin.controller.js
|   |-- user.controller.js
|   |-- video.controller.js
|   |-- comment.controller.js
|   |-- twitter.controller.js
|   |-- playlist.controller.js
|   |-- subscription.controller.js
|   |-- dashboard.controller.js
|-- /middlewares
|   |-- auth.middleware.js
|   |-- admin.middleware.js
|   |-- multer.middleware.js
|   |-- verifyadmin.middleware.js
|-- /models
|   |-- user.model.js
|   |-- video.model.js
|   |-- like.model.js
|   |-- comment.model.js
|   |-- tweet.model.js
|   |-- playlist.model.js
|   |-- subscription.model.js
|-- /routes
|   |-- admin.routes.js
|   |-- user.routes.js
|   |-- video.routes.js
|   |-- comment.routes.js
|   |-- twitter.routes.js
|   |-- playlist.routes.js
|   |-- subscription.routes.js
|   |-- dashboard.routes.js
|-- /utils
|   |-- ApiError.js
|   |-- ApiResponse.js
|   |-- asyncHandler.js
|   |-- cloudinary.js
|-- app.js
|-- constants.js
|-- index.js

## Installation

1. Clone the repository:
    ```sh
    git clone https://github.com/jujharsingh2802/animhub.git
    cd animhub
    ```

2. Install dependencies:
    ```sh
    npm install
    ```

3. Create a `.env` file in the root directory and add the following environment variables:
    ```env
    PORT=5000
    MONGODB_URI=your_mongodb_uri
    ACCESS_TOKEN_SECRET=your_access_token_secret
    REFRESH_TOKEN_SECRET=your_refresh_token_secret
    ADMIN_PASSWORD=your_admin_password
    CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
    CLOUDINARY_API_KEY=your_cloudinary_api_key
    CLOUDINARY_API_SECRET=your_cloudinary_api_secret
    CORS_ORIGIN=your_frontend_url
    ```

4. Start the server:
    ```sh
    npm run dev
    ```

## API Endpoints

### User Routes
- `POST /api/v1/users/register` - Register a new user
- `POST /api/v1/users/login` - Login a user
- `POST /api/v1/users/logout` - Logout a user
- `POST /api/v1/users/refresh-token` - Refresh access token
- `PATCH /api/v1/users/change-password` - Change user password
- `GET /api/v1/users/me` - Get current user details
- `PATCH /api/v1/users/update` - Update user account details
- `PATCH /api/v1/users/avatar` - Update user avatar
- `PATCH /api/v1/users/cover-image` - Update user cover image
- `GET /api/v1/users/channel/:username` - Get user channel profile
- `GET /api/v1/users/watch-history` - Get user watch history

### Video Routes
- `POST /api/v1/videos` - Upload a new video
- `GET /api/v1/videos` - Get all videos
- `DELETE /api/v1/videos/v/:videoId` - Delete a video
- `GET /api/v1/videos/v/:videoId` - Get video by ID
- `PATCH /api/v1/videos/v/:videoId` - Update a video
- `PATCH /api/v1/videos/toggle/publish/:videoId` - Toggle video publish status

### Admin Routes
- `POST /api/v1/adminroute/login` - Admin login

### Like Routes
- `POST /api/v1/like/toggle/v/:videoId` - Toggle like on a video
- `POST /api/v1/like/toggle/c/:commentId` - Toggle like on a comment
- `POST /api/v1/like/toggle/t/:tweetId` - Toggle like on a tweet
- `GET /api/v1/like/videos` - Get liked videos
- `GET /api/v1/like/t/:tweetId/likes` - Get likes for a tweet

### Comment Routes
- `POST /api/v1/comment/:videoId` - Add a comment to a video
- `GET /api/v1/comment/:videoId` - View comments on a video
- `PATCH /api/v1/comment/c/:commentId` - Update a comment
- `DELETE /api/v1/comment/c/:commentId` - Delete a comment
- `GET /api/v1/comment/c/:commentId` - Get a comment by ID

### Twitter Routes
- `GET /api/v1/twitter/user/:userId` - Get all tweets by a user
- `POST /api/v1/twitter` - Create a new tweet
- `PATCH /api/v1/twitter/t/:twitterId` - Update a tweet
- `DELETE /api/v1/twitter/t/:twitterId` - Delete a tweet
- `GET /api/v1/twitter/t/:twitterId` - Get a tweet by ID

### Playlist Routes
- `POST /api/v1/playlists` - Create a new playlist
- `GET /api/v1/playlists/:playlistId` - Get playlist by ID
- `PATCH /api/v1/playlists/:playlistId` - Update a playlist
- `DELETE /api/v1/playlists/:playlistId` - Delete a playlist
- `PATCH /api/v1/playlists/add/:videoId/:playlistId` - Add video to playlist
- `PATCH /api/v1/playlists/remove/:videoId/:playlistId` - Remove video from playlist
- `GET /api/v1/playlists/user/:userId` - Get all playlists of a user

### Subscription Routes
- `POST /api/v1/subscriptions/c/:channelId` - Toggle subscription to a channel
- `GET /api/v1/subscriptions/c/:channelId` - Get subscribers of a channel
- `GET /api/v1/subscriptions/u/:subscribedId` - Get channels subscribed by a user

### Dashboard Routes
- `GET /api/v1/dashboard/stats` - Get channel statistics
- `GET /api/v1/dashboard/videos` - Get channel videos
