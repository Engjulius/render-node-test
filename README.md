# MongoDB setup

The signup and login endpoints now persist users in MongoDB instead of using in-memory storage. Passwords are hashed with Node's built-in `crypto.scryptSync` and are never stored as plain text.

## Environment variables

Set these variables in your local environment or in Render:

- `MONGODB_URI` – your MongoDB connection string, for example `mongodb+srv://<user>:<password>@<cluster>/<database>`
- `MONGODB_DB` – optional database name (defaults to `render_node_test`)
- `PORT` – optional HTTP port (Render supplies this automatically)

Example local setup:

```bash
npm install
MONGODB_URI="mongodb+srv://user:password@cluster.example.mongodb.net/?retryWrites=true&w=majority" npm start
```

The application creates a unique index on `users.email` at startup. Make sure the MongoDB user has permission to create indexes and read/write the selected database.
