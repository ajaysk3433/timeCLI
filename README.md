

# 🕒 TimeCLI

A simple **Node.js CLI tool** to track your **login, logout, breaks, and productive hours**.
Persistent data storage, 4 AM daily reset, and 7-day reporting included.

---

## Features

* **Login / Logout**
  Track your working hours and stay logged in across CLI sessions.

* **Break Tracking**
  Start and end breaks anytime. Break hours are deducted from productive time.

* **Status Command**
  Check current login hours, break hours, productive hours, and first login of the day.

* **7-Day Report**
  View a weekly summary with:

  * Total login hours
  * Break hours
  * Productive hours
  * First login & last logout times

* **Persistent Storage**
  All data saved in a local `data/timecli_data.json` folder.

* **Automatic 4 AM Reset**
  Each day starts at 4 AM. If you forget to logout before 4 AM, hours reset cleanly.

---

## Installation

1. Clone the repository:

```bash
git clone <repo-url>
cd timeCLI
```

2. Install dependencies:

```bash
npm install
```

3. Link the CLI globally (Windows):

```bash
npm link
```

Now you can run the CLI anywhere in your terminal.

---

## Usage

### Commands

#### Login

Start a work session:

```bash
timecli login
```

#### Logout

End a work session:

```bash
timecli logout
```

#### Break Start

Start a break:

```bash
timecli break-start
```

#### Break End

End the current break:

```bash
timecli break-end
```

#### Status

Check current session status:

```bash
timecli status
```

Output example:

```
🕒 Login hours:      01:15:00
☕ Break hours:      00:15:00
💼 Productive hours: 01:00:00
🟢 Currently logged in since 09:00:00
⏱ First login today: 08:30:00
```

#### Report

View a 7-day summary:

```bash
timecli report
```

Output example:

```
📅 7-DAY REPORT

Wed, 15 Oct: Login: 07:30:00 | Break: 00:45:00 | Productive: 06:45:00 | First Login: 09:00:00 | Last Logout: 16:45:00
Thu, 16 Oct: Login: 08:15:00 | Break: 00:30:00 | Productive: 07:45:00 | First Login: 09:05:00 | Last Logout: 17:20:00
...
```

---

## Data Storage

* All data is stored locally in the folder:

```
timeCLI/data/timecli_data.json
```

* Persistent across CLI sessions.

* Automatically resets at **4 AM** daily.

---

## Dependencies

* [Node.js](https://nodejs.org/) (v22+)
* [commander](https://www.npmjs.com/package/commander) – CLI commands
* [chalk](https://www.npmjs.com/package/chalk) – Colored console output
* [dayjs](https://www.npmjs.com/package/dayjs) – Date & time handling

---

## Notes

* CLI works on **Windows, Mac, and Linux**
* Use `npm link` after any updates to make changes globally available.

---

