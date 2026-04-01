# Buddy Script Frontend (React + TypeScript)

Frontend implementation of the Appifylab selection task using React + TypeScript, with a clean structure and API-ready service layer for easy Node.js/Express + MongoDB integration.

## Features Included

- Authentication pages: Login and Registration using your provided design.
- Protected route for Feed page.
- Feed supports:
	- Create post (text + image).
	- Public / Private visibility.
	- Newest-first ordering.
	- Like/Unlike for posts, comments, replies.
	- Add comments and replies.
	- Display who liked each post/comment/reply.

If backend is not available, a localStorage fallback keeps the app runnable for UI testing.

## Tech Stack

- React
- TypeScript
- React Router
- Vite

## Project Structure

```text
src/
	components/
		auth/
			ProtectedRoute.tsx
	contexts/
		AuthContext.tsx
	pages/
		auth/
			LoginPage.tsx
			RegisterPage.tsx
		feed/
			FeedPage.tsx
	services/
		auth.service.ts
		feed.service.ts
		http.ts
	types/
		index.ts
	App.tsx
	main.tsx
```

## Run

```bash
npm install
npm run dev
```

Build:

```bash
npm run build
```

## Backend Integration

Set API base URL in `.env`:

```bash
VITE_API_BASE_URL=http://localhost:5000/api
```

Current frontend expects these endpoints:

### Auth

- `POST /auth/register`
	- body: `{ firstName, lastName, email, password }`
	- response: `{ token, user }`
- `POST /auth/login`
	- body: `{ email, password }`
	- response: `{ token, user }`
- `GET /auth/me`
	- header: `Authorization: Bearer <token>`
	- response: `user`

### Feed

- `GET /feed/posts`
	- response: `Post[]`
- `POST /feed/posts`
	- multipart: `text`, `visibility`, `image?`
	- response: `Post`
- `PATCH /feed/posts/:postId/likes/toggle`
	- response: `Post[]`
- `POST /feed/posts/:postId/comments`
	- body: `{ text }`
	- response: `Post[]`
- `PATCH /feed/posts/:postId/comments/:commentId/likes/toggle`
	- response: `Post[]`
- `POST /feed/posts/:postId/comments/:commentId/replies`
	- body: `{ text }`
	- response: `Post[]`
- `PATCH /feed/posts/:postId/comments/:commentId/replies/:replyId/likes/toggle`
	- response: `Post[]`

## Notes

- All provided design assets are used from `public/assets`.
- Login/Register pages follow the supplied layout style.
- Feed keeps main functionality focus while preserving provided style classes.
# BuddyScript_Frontend
