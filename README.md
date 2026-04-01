# Buddy Script Frontend (React + TypeScript)

Frontend implementation of the Appifylab selection task using React + TypeScript with integrated backend API services.

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
VITE_API_BASE_URL=http://192.168.2.38:3300/api/v1
```

Current frontend expects these endpoints:

### Auth

- `POST /user`
	- body: `{ firstName, lastName, email, role: "GENERAL", password }`
- `POST /auth/verify-email`
	- body: `{ email, oneTimeCode }`
- `POST /auth/login`
	- body: `{ email, password }`
	- response: `{ token, user }`
- `GET /auth/me`
	- header: `Authorization: Bearer <token>`
	- response: `user`

### Feed (`/post`)


- `GET /post`
	- response: `Post[]` (or wrapped response with `data`)
- `POST /post`
	- multipart: `text`, `visibility`, `image?`
- `PATCH /post/likes/:postId`
	- body: `{ isLiked }`
- `GET /post/likes/:postId`
	- response: liker user list
- `POST /post/comments/:postId`
	- body: `{ content }`
- `GET /post/comments/:postId`
	- response: comment list
- `PATCH /post/comments/likes/:commentId`
	- body: `{ isLiked }`
- `GET /post/comments/likes/:commentId`
	- response: comment liker user list
- `POST /post/comments/replies/:commentId`
	- body: `{ content }`
- `GET /post/comments/replies/:commentId`
	- response: reply list
- `PATCH /post/comnt-replies/likes/:replyId`
	- body: `{ isLiked }`
- `GET /post/comnt-replies/likes/:replyId`
	- response: reply liker user list

## Notes

- All provided design assets are used from `public/assets`.
- Login/Register pages follow the supplied layout style.
- Feed keeps main functionality focus while preserving provided style classes.
# BuddyScript_Frontend
