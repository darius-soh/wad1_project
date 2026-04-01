# Mini Spotify Playlist Manager

## a. How to set up the application

1. Download or extract the submitted project files into one folder.
2. Open a terminal in the project root folder.
3. Install the required Node.js packages:

```bash
npm install
```

4. Create a `config.env` file in the project root.
5. Add the following environment variables to `config.env`:

```env
DB=your_mongodb_connection_string
SECRET=your_session_secret
```

6. Make sure MongoDB is available.
   Use either a local MongoDB instance or a MongoDB Atlas connection string in `DB`.

## b. How to run the application

1. Start the server from the project root:

```bash
npm start
```

2. Once the server starts, open the application in your browser:

```text
http://localhost:8000/index.html
```

3. You can also access the login page directly at:

```text
http://localhost:8000/login
```

## c. Username/password details

- There is no default seeded username or password included in this project.
- Create your own account through the registration page:

```text
http://localhost:8000/register
```

- Password requirements:
  At least 8 characters, with at least one uppercase letter, one lowercase letter, one digit, and one symbol.
