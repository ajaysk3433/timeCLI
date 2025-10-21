#!/usr/bin/env node
import fs from "fs";
import path from "path";
import { Command } from "commander";
import chalk from "chalk";
import dayjs from "dayjs";
import duration from "dayjs/plugin/duration.js";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter.js";
import isBetween from "dayjs/plugin/isBetween.js";

dayjs.extend(duration);
dayjs.extend(isSameOrAfter);
dayjs.extend(isBetween);

// Store data inside "data" folder in current directory
const dataDir = path.join(process.cwd(), "data");
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
const DATA_FILE = path.join(dataDir, "timecli_data.json");

const program = new Command();

function loadData() {
  if (!fs.existsSync(DATA_FILE)) {
    return {
      sessions: [],
      lastReset: null,
    };
  }
  return JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
}

function saveData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

function resetIfNeeded(data) {
  const now = dayjs();
  const lastReset = data.lastReset ? dayjs(data.lastReset) : null;
  const today4am = dayjs().hour(4).minute(0).second(0);

  if (!lastReset || (now.isSameOrAfter(today4am) && (!lastReset.isSame(today4am, "day") || lastReset.isBefore(today4am)))) {
    data.sessions = [];
    data.lastReset = now.toISOString();
  }
}

function getCurrentSession(data) {
  if (data.sessions.length === 0) return null;
  return data.sessions[data.sessions.length - 1];
}

function formatDuration(seconds) {
  return dayjs.duration(seconds, "seconds").format("HH:mm:ss");
}

program
  .name("timecli")
  .description("Track login, logout, and break times easily")
  .version("1.2.0");

program
  .command("login")
  .description("Login and start tracking")
  .action(() => {
    const data = loadData();
    resetIfNeeded(data);

    const active = getCurrentSession(data);
    if (active && !active.logout) {
      console.log(chalk.yellow("⚠️ Already logged in!"));
      return;
    }

    data.sessions.push({
      login: new Date().toISOString(),
      breaks: [],
      logout: null,
    });
    saveData(data);
    console.log(chalk.green("✅ Logged in at:"), dayjs().format("HH:mm:ss"));
  });

program
  .command("logout")
  .description("Logout and stop tracking")
  .action(() => {
    const data = loadData();
    const active = getCurrentSession(data);

    if (!active || active.logout) {
      console.log(chalk.yellow("⚠️ You are not logged in."));
      return;
    }

    active.logout = new Date().toISOString();
    saveData(data);
    console.log(chalk.green("👋 Logged out at:"), dayjs().format("HH:mm:ss"));
  });

program
  .command("break-start")
  .description("Start a break")
  .action(() => {
    const data = loadData();
    const active = getCurrentSession(data);

    if (!active || active.logout) {
      console.log(chalk.red("❌ You need to login first."));
      return;
    }

    if (active.breaks.some(b => !b.end)) {
      console.log(chalk.yellow("⚠️ Break already in progress!"));
      return;
    }

    active.breaks.push({ start: new Date().toISOString(), end: null });
    saveData(data);
    console.log(chalk.blue("☕ Break started at:"), dayjs().format("HH:mm:ss"));
  });

program
  .command("break-end")
  .description("End a break")
  .action(() => {
    const data = loadData();
    const active = getCurrentSession(data);

    if (!active || active.logout) {
      console.log(chalk.red("❌ You need to login first."));
      return;
    }

    const currentBreak = active.breaks.find(b => !b.end);
    if (!currentBreak) {
      console.log(chalk.yellow("⚠️ No active break found."));
      return;
    }

    currentBreak.end = new Date().toISOString();
    saveData(data);
    console.log(chalk.green("💼 Break ended at:"), dayjs().format("HH:mm:ss"));
  });

program
  .command("status")
  .description("Show current work status")
  .action(() => {
    const data = loadData();
    resetIfNeeded(data);

    let totalLogin = 0, totalBreak = 0;
    let firstLoginOfDay = null;

    const todayStart = dayjs().hour(4).minute(0).second(0); // from 4 AM
    const now = dayjs();

    data.sessions.forEach(s => {
      const login = dayjs(s.login);
      const logout = s.logout ? dayjs(s.logout) : now;

      if (login.isAfter(todayStart) || logout.isAfter(todayStart)) {
        const sessionStart = login.isBefore(todayStart) ? todayStart : login;
        const sessionEnd = logout.isAfter(now) ? now : logout;

        totalLogin += sessionEnd.diff(sessionStart, "second");

        if (!firstLoginOfDay || sessionStart.isBefore(firstLoginOfDay)) {
          firstLoginOfDay = sessionStart;
        }

        s.breaks.forEach(b => {
          const bStart = dayjs(b.start);
          const bEnd = b.end ? dayjs(b.end) : now;
          if (bStart.isBefore(now) && bEnd.isAfter(todayStart)) {
            const breakStart = bStart.isBefore(todayStart) ? todayStart : bStart;
            const breakEnd = bEnd.isAfter(now) ? now : bEnd;
            totalBreak += breakEnd.diff(breakStart, "second");
          }
        });
      }
    });

    const productive = Math.max(0, totalLogin - totalBreak);

    console.log(chalk.cyan("\n📊 STATUS"));
    console.log("🕒 Login hours:     ", formatDuration(totalLogin));
    console.log("☕ Break hours:     ", formatDuration(totalBreak));
    console.log("💼 Productive hours:", formatDuration(productive));

    const active = getCurrentSession(data);
    if (active && !active.logout) {
      console.log(chalk.green(`🟢 Currently logged in since ${dayjs(active.login).format("HH:mm:ss")}`));
    } else {
      console.log(chalk.red("🔴 Not logged in"));
    }

    if (firstLoginOfDay) {
      console.log(chalk.blue(`⏱ First login today: ${firstLoginOfDay.format("HH:mm:ss")}\n`));
    }
  });

program
  .command("report")
  .description("Show a 7-day summary of login, break, and productive hours")
  .action(() => {
    const data = loadData();
    if (!data.sessions || data.sessions.length === 0) {
      console.log(chalk.yellow("⚠️ No activity recorded yet."));
      return;
    }

    console.log(chalk.magenta("\n📅 7-DAY REPORT\n"));
    const now = dayjs();

    for (let i = 6; i >= 0; i--) {
      const day = now.subtract(i, "day");
      const startOfDay = day.startOf("day");
      const endOfDay = day.endOf("day");

      let totalLogin = 0, totalBreak = 0;
      let firstLogin = null, lastLogout = null;

      data.sessions.forEach(s => {
        const login = dayjs(s.login);
        const logout = s.logout ? dayjs(s.logout) : dayjs();

        if (login.isBefore(endOfDay) && logout.isAfter(startOfDay)) {
          const sessionStart = login.isBefore(startOfDay) ? startOfDay : login;
          const sessionEnd = logout.isAfter(endOfDay) ? endOfDay : logout;

          totalLogin += sessionEnd.diff(sessionStart, "second");

          if (!firstLogin || sessionStart.isBefore(firstLogin)) firstLogin = sessionStart;
          if (!lastLogout || sessionEnd.isAfter(lastLogout)) lastLogout = sessionEnd;

          s.breaks.forEach(b => {
            const bStart = dayjs(b.start);
            const bEnd = b.end ? dayjs(b.end) : dayjs();
            if (bStart.isBefore(endOfDay) && bEnd.isAfter(startOfDay)) {
              const breakStart = bStart.isBefore(startOfDay) ? startOfDay : bStart;
              const breakEnd = bEnd.isAfter(endOfDay) ? endOfDay : bEnd;
              totalBreak += breakEnd.diff(breakStart, "second");
            }
          });
        }
      });

      const productive = Math.max(0, totalLogin - totalBreak);

      console.log(
        chalk.cyan(`${day.format("ddd, DD MMM")}: `) +
        chalk.white(
          `Login: ${formatDuration(totalLogin)} | Break: ${formatDuration(totalBreak)} | Productive: ${formatDuration(productive)} | ` +
          `First Login: ${firstLogin ? firstLogin.format("HH:mm:ss") : "--"} | Last Logout: ${lastLogout ? lastLogout.format("HH:mm:ss") : "--"}`
        )
      );
    }

    console.log();
  });

program.parse(process.argv);
