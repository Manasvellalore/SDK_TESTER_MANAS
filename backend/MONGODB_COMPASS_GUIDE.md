# Step-by-Step: MongoDB Atlas + MongoDB Compass

This guide walks you through creating a free MongoDB database in the cloud and connecting it (and MongoDB Compass) to your backend so the **case list** persists on the live/deployed link.

---

## Part 1: Create MongoDB Atlas (cloud database)

### Step 1: Sign up and create a cluster

1. Go to **https://cloud.mongodb.com** and sign in (or create a free account).
2. Click **"Build a Database"** or **"Create"**.
3. Choose **"M0 FREE"** (free tier) and click **Create**.
4. Pick a **cloud provider and region** (e.g. AWS, closest to your users). Click **Create Cluster**.
5. Wait until the cluster status is **"Available"**.

### Step 2: Create a database user

1. In the left sidebar, go to **"Database Access"** → **"Add New Database User"**.
2. Choose **"Password"** authentication.
3. Set a **username** and **password**. Save the password somewhere safe (you will need it for the connection string).
4. Under **"Database User Privileges"**, leave **"Atlas admin"** or choose **"Read and write to any database"**.
5. Click **"Add User"**.

### Step 3: Allow network access (so your backend and Compass can connect)

1. In the left sidebar, go to **"Network Access"** → **"Add IP Address"**.
2. Click **"Allow Access from Anywhere"** (adds `0.0.0.0/0`). This lets your backend on Vercel and MongoDB Compass on your PC connect.
3. Click **"Confirm"**.

### Step 4: Get the connection string

1. Go back to **"Database"** in the left sidebar.
2. Click **"Connect"** on your cluster.
3. Choose **"Drivers"** (or "Connect your application").
4. Copy the **connection string**. It looks like:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
5. Replace **`<username>`** with your database user name and **`<password>`** with your database user password. If the password has special characters (e.g. `@`, `#`), **URL-encode** them (e.g. `@` → `%40`).

### Step 5: Add the connection string to your project

1. **Local backend:** Open `backend/.env` and add (or edit):
   ```
   MONGODB_URI=mongodb+srv://YOUR_USER:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
   Use your real username and password (with special characters URL-encoded).

2. **Deployed backend (Vercel):**
   - Go to your Vercel project → **Settings** → **Environment Variables**.
   - Add **`MONGODB_URI`** with the same connection string value.
   - Redeploy the backend so the new variable is used.

---

## Part 2: Connect MongoDB Compass to your database

MongoDB Compass is a desktop app to browse and edit your MongoDB data. You use the **same connection string** as the backend.

### Step 1: Install MongoDB Compass

1. Go to **https://www.mongodb.com/products/compass**.
2. Download **MongoDB Compass** for your OS and install it.

### Step 2: Connect using your Atlas connection string

1. Open **MongoDB Compass**.
2. You will see a **"New Connection"** screen with a connection string field.
3. Paste your **full connection string** (the same one in `MONGODB_URI`), with username and password already filled in. Example:
   ```
   mongodb+srv://myuser:mypassword123@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
4. Click **"Connect"**.

### Step 3: Find your cases collection

1. In the left sidebar you will see your **clusters** and **databases**.
2. Expand your cluster → you should see a database named **`bargad`** (created when the backend first writes a case).
3. Expand **`bargad`** → you will see the **`cases`** collection.
4. Click **`cases`** to view all case documents. Each document has: `_id` (sessionId), `sessionId`, `leadNo`, `name`, `date`, `status`, `createdAt`, `updatedAt`.

### Step 4: Use Compass to browse or edit

- **Browse:** Click **"Documents"** to see the list. You can filter, sort, and view documents.
- **Edit:** Click a document and edit fields; save with the checkmark.
- **Add/Delete:** Use the Compass UI to add or delete documents if needed.

You do **not** deploy Compass to Vercel. Compass runs on your computer and connects to the same Atlas database that your backend uses.

---

## Part 3: Verify the backend is using MongoDB

1. **Install backend dependency** (if not already done):
   ```bash
   cd backend
   npm install
   ```
2. **Start the backend** (with `MONGODB_URI` in `.env`):
   ```bash
   npm start
   ```
3. Submit a form from the frontend (agent form). Then:
   - Open **MongoDB Compass** → database **bargad** → collection **cases**. You should see a new document for that case.
   - Open the **Cases Manager** page in the app. The case should appear in the list.
4. **On the live link:** After deploying with `MONGODB_URI` set in Vercel, cases will persist in Atlas. Anyone opening the Cases Manager will see the same list; closing and reopening the link (or coming back hours later) will still show all cases.

---

## Summary

| Step | Where | What to do |
|------|--------|------------|
| 1 | MongoDB Atlas | Create free M0 cluster, database user, network access (0.0.0.0/0). |
| 2 | Atlas | Get connection string; put it in `backend/.env` as `MONGODB_URI` and in Vercel env. |
| 3 | Your PC | Install MongoDB Compass; paste same connection string and connect. |
| 4 | Compass | Open database `bargad` → collection `cases` to view/edit case list. |
| 5 | Backend | Run `npm install` and `npm start`; submit a form and check Compass + Cases Manager. |

The database lives on **MongoDB Atlas** (cloud). Your **backend** (local or Vercel) and **MongoDB Compass** (on your PC) both connect to it using the same URI. You do not deploy the database or Compass to Vercel.
