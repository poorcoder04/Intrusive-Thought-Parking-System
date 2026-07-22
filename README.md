# Intrusive Thought Parking System 🧠🅿️

A mental health tool that helps people break the anxiety loop caused by intrusive thoughts. Instead of fighting a thought or letting it derail your focus, you **park it** — write it down, schedule a specific time to worry about it, and get a funny email reminder when that time arrives. By then, most people realize the thought wasn't worth the panic.

> Built on the **Scheduled Worry Time** technique from Cognitive Behavioral Therapy (CBT).

**Live Demo:** [your-render-url-here]

---

## The Problem It Solves

When an intrusive thought strikes, your brain screams *"Deal with this NOW!"* — even when it isn't urgent. Trying to suppress it makes it louder. Trying to solve it wastes hours. The anxiety steals your focus, productivity, and peace of mind.It's become very difficult to do small piece of work & an infinite negative loop continues to run in the mind.

**Thought Parking breaks this loop in 30 seconds.**

---

## How It Works

1. **Write it down** — Type the exact intrusive thought as much details as you can that won't leave you alone 
2. **Schedule it** — Pick a date and time to think about it (Today / Tomorrow / custom date)
3. **Get a funny email** — At your scheduled time, we send a lighthearted reminder
4. **Realize it's fine** — Most parked thoughts feel trivial by the time the email arrives

---

## Features

- **Landing page** with a full psychological guide — what intrusive thoughts are, their characteristics, what CBT and ACT say about them, and how to deal with them
- **JWT authentication** — secure register and login
- **Park a thought** — write the thought, pick a date (Today / Tomorrow / The next day / custom date), pick a time with a native time picker
- **Timezone-aware scheduling** — the worry time is calculated using the user's local timezone, not the server's
- **Funny email reminders** — HTML email sent automatically at the scheduled time via Nodemailer
- **Active thoughts dashboard** — see all your parked thoughts waiting to fire
- **History** — see all thoughts that have been released
- **Cancel a thought** — delete a parked thought before the email fires
- **Motivational pop-up** — a short funny message after parking a thought to remind you of the psychological trick you just used
- **Background cron job** — checks every minute for due thoughts and dispatches emails automatically

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js |
| Framework | Express.js 5 |
| Database | MongoDB + Mongoose |
| Authentication | JWT (jsonwebtoken) + bcrypt |
| Email | Nodemailer (Gmail SMTP) |
| Scheduling | node-cron |
| Frontend | Vanilla JS + Tailwind CSS (CDN) + Font Awesome |
| Hosting | Render |
| DB Hosting | MongoDB Atlas |

---

## Project Structure

```
Thought_Parking_System/
│
├── config/
│   └── db.js                  # MongoDB connection
│
├── controller/
│   ├── authController.js      # Register & login
│   ├── parkThought.js         # Park a new thought
│   ├── activeThought.js       # Fetch active thoughts
│   ├── notifiedThought.js     # Fetch thought history
│   └── deleteThought.js       # Cancel a parked thought
│
├── middleware/
│   └── authMiddleware.js      # JWT verification
│
├── models/
│   ├── user.js                # User schema
│   └── thought.js             # Thought schema
│
├── route/
│   ├── authRoute.js
│   ├── parkThoughtRoute.js
│   ├── activeThoughtRoute.js
│   ├── notifiedRoute.js
│   └── deleteThoughtRoute.js
│
├── services/
│   ├── cronServices.js        # Background job — checks & fires due emails
│   └── emailService.js        # Nodemailer transporter & email template
│
├── utils/
│   └── dateParser.js          # Converts date option + time + timezone to UTC Date
│
├── public/
│   ├── index.html             # Single-page app (landing, auth, dashboard)
│   ├── css/styles.css
│   └── js/app.js              # All frontend logic
│
├── .env                       # Environment variables (not committed)
├── .gitignore
├── index.js                   # App entry point
└── package.json
```

---

## Local Setup

**1. Clone the repo**

```bash
git clone https://github.com/your-username/thought-parking-system.git
cd thought-parking-system
```

**2. Install dependencies**

```bash
npm install
```

**3. Create a `.env` file** in the root directory

```env
PORT=3000
MONGO_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_random_secret_key

SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=your_gmail_address
SMTP_PASS=your_gmail_app_password
EMAIL_FROM="Thought Parking Garage <your_gmail_address>"
```

> For `SMTP_PASS`, use a **Gmail App Password**, not your real Gmail password.
> Generate one at: Google Account → Security → 2-Step Verification → App Passwords

**4. Run the development server**

```bash
npm run dev
```

Open `http://localhost:3000`

---

## API Endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | No | Create a new account |
| POST | `/api/auth/login` | No | Login and receive JWT |
| POST | `/api/thoughts/park` | Yes | Park a new thought |
| GET | `/api/thoughts/active` | Yes | Get all active parked thoughts |
| GET | `/api/thoughts/history` | Yes | Get all released thoughts |
| DELETE | `/api/thoughts/:id` | Yes | Cancel a parked thought |

Auth routes are rate-limited to **20 requests per 15 minutes** per IP.

---

## Environment Variables

| Variable | Description |
|---|---|
| `PORT` | Port the server runs on (default 3000) |
| `MONGO_URI` | MongoDB Atlas connection string |
| `JWT_SECRET` | Secret key for signing JWTs |
| `SMTP_HOST` | SMTP server host |
| `SMTP_PORT` | SMTP port (465 for SSL) |
| `SMTP_USER` | Your Gmail address |
| `SMTP_PASS` | Gmail App Password |
| `EMAIL_FROM` | Sender name and address shown in emails |

---

## Psychology Behind This

This tool is built on three evidence-based techniques:

- **Scheduled Worry Time (CBT)** — Postponing worry to a fixed time reduces its frequency by up to 35% (Borkovec et al.)
- **Cognitive Offloading** — Writing a thought down externalizes it, so the brain stops looping to "remember" it
- **Defusion (ACT)** — Treating a thought as an observable event rather than a command strips away its urgency and emotional weight

---

## License

MIT
