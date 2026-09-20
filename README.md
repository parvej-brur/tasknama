<a name="top"></a>

<div align="center">

# ✅ Task Manager

### A local first task manager that works fully offline

Task Manager is a mobile app for planning your day without an account, a backend, or a network
connection. Capture a task in one sentence, sort it into projects and tags, break it into
subtasks, set reminders and repeats, and run a focus session on whatever is next. Everything is
stored on the device, so data survives a restart, a background kill, and a reboot, and the first
frame of every screen already shows real data.

<p>
  <img alt="Expo SDK 54"     src="https://img.shields.io/badge/Expo-SDK_54-000020?logo=expo&logoColor=white">
  <img alt="React Native"    src="https://img.shields.io/badge/React_Native-0.81-61DAFB?logo=react&logoColor=black">
  <img alt="React 19"        src="https://img.shields.io/badge/React-19-149ECA?logo=react&logoColor=white">
  <img alt="TypeScript"      src="https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white">
  <img alt="Redux Toolkit"   src="https://img.shields.io/badge/Redux_Toolkit-2-764ABC?logo=redux&logoColor=white">
  <img alt="MMKV"            src="https://img.shields.io/badge/MMKV-4-2557D6">
  <img alt="Jest"            src="https://img.shields.io/badge/Jest-350_tests-C21325?logo=jest&logoColor=white">
</p>

**[Walkthrough](#preview)** · **[Key features](#key-features)** · **[Architecture](#architecture)** · **[Getting started](#getting-started)**

</div>

---

<details>
<summary><strong>Table of contents</strong></summary>

- [Preview](#preview)
- [About the project](#about-the-project)
- [Key features](#key-features)
- [Built with](#built-with)
- [Architecture](#architecture)
- [Project structure](#project-structure)
- [Where each requirement lives](#where-each-requirement-lives)
- [Engineering notes](#engineering-notes)
- [Behaviour decisions](#behaviour-decisions)
- [Getting started](#getting-started)
- [Testing](#testing)
- [Project status and scope](#project-status-and-scope)
- [Roadmap](#roadmap)
- [Documentation](#documentation)
- [About the developer](#about-the-developer)
- [License](#license)

</details>

---

## Preview

<div align="center">
  <img alt="Task Manager walkthrough" src="docs/media/preview.gif" width="320">
</div>

The walkthrough runs through Today, Inbox, Upcoming, Browse, a task with subtasks, All tasks,
a project, Productivity, Focus, and Settings, recorded on an iPhone 17 Pro Max simulator with
demo data.

▶️ **[Watch the full walkthrough (MP4)](https://github.com/parvej-brur/task-for-shareviral/raw/main/docs/media/preview.mp4)**

<p align="right"><a href="#top">Back to top</a></p>

---

## About the project

Task Manager is a personal task app built around one rule: the phone is the source of truth.
There is no sign up, no sync service, and no request that can fail, so the app opens instantly
and behaves the same on a plane as it does on Wi-Fi. The interface is organised around four
daily destinations, Today, Inbox, Upcoming, and Browse, and everything else sits one tap
inside Browse.

The work that matters here is in the layers under the screens. State is a set of Redux slices
that persist to MMKV one record at a time, dates are stored as local calendar strings so they
cannot drift across time zones, untrusted data is coerced on the way in, and the domain logic
(recurrence, reminder planning, the quick add parser, the focus timer, analytics, backup
migrations) is plain TypeScript with no React and no I/O, which is where nearly all of the
tests point.

The project started as a take home assessment for ShareViral. It is kept here as a portfolio
piece that shows a feature folder architecture with a lint enforced dependency boundary, a
storage layer that writes only what changed, and a deliberately small and honest scope.

<p align="right"><a href="#top">Back to top</a></p>

---

## Key features

| Area                      | What it does                                                                                                                                                              |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Tasks**                 | Title, notes, priority, due date and time, project, tags, subtasks, reminder, and repeat. Validated on entry, with an Undo snackbar after delete.                          |
| **Today dashboard**       | "N tasks left" up top, then Overdue, Due today, and High priority sections, with a progress bar for the day.                                                              |
| **Inbox and Upcoming**    | Inbox holds active tasks that have no project yet. Upcoming groups active tasks by due date, soonest first.                                                                      |
| **Projects**              | Create, edit, archive, restore, and delete, with a colour and a live "3 of 8 done" progress bar. Deleting a project un-assigns its tasks instead of deleting them.        |
| **Tags**                  | Free form tags with their own list and detail screens. Add `#tags` while typing a task.                                                                                   |
| **Subtasks**              | Add, edit, complete, delete, and reorder inside a task, with progress shown on the row.                                                                                   |
| **Search, filter, sort**  | One debounced (250 ms) search that composes with status, priority, project, tag, and due filters, and sorts by due date, priority, created, or updated time.              |
| **Recurring tasks**       | Daily, weekly on chosen days, monthly on a day, or every N days, weeks, or months. Completing one creates the next occurrence.                                            |
| **Reminders**             | At due time, 10 minutes, 1 hour, or 1 day before, or a custom moment. Scheduled locally, with permission asked when the first reminder is set.                            |
| **Quick add**             | Type "call Sam every friday at 5pm #work !high" and the date, time, repeat, tag, and priority are pulled out live. Each piece can be switched off before saving.          |
| **Deep links**            | `taskmanager://task/<id>` opens a task, and tapping a reminder notification lands on the same screen.                                                                     |
| **Focus mode**            | A timer on one task, with pause, resume, and stop. It survives the app being killed, and a session that ended while closed is completed on the next launch.               |
| **Productivity**          | Completed today and this week, the weekly completion rate, overdue count, and focus minutes.                                                                              |
| **Backup**                | Export everything to a JSON file and import it back. Every record is validated, and older backup versions are migrated forward.                                           |
| **Appearance**            | System, light, and dark themes on a cobalt and marigold palette, with defaults for reminders and focus length.                                                            |
| **Accessibility**         | Roles and labels on every control, status carried by icon and text as well as colour, reduced motion respected, and a contrast test that fails the build on a bad pair.  |

<p align="right"><a href="#top">Back to top</a></p>

---

## Built with

| Choice                                  | Reason it is here                                                                                                                                  |
| --------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Expo SDK 54 and React Native 0.81**   | The new architecture is on, and Expo Router gives typed, file based routes and deep links for free.                                                 |
| **TypeScript `strict`**                 | The type system is the main safety net in the project, so it is turned up fully.                                                                    |
| **Redux Toolkit**                       | One slice per feature, pure reducers, and thunks for the side effects. Immer keeps unchanged records referentially equal, which the storage layer uses. |
| **react-native-mmkv**                   | Synchronous reads and writes, so the store hydrates before the first render and no screen needs a loading gate.                                     |
| **@shopify/flash-list**                 | Recycled rows for lists that stay smooth at thousands of tasks.                                                                                     |
| **chrono-node**                         | Natural language date and time parsing behind quick add.                                                                                            |
| **expo-notifications**                  | Local reminders and the focus timer end alert. No push server is involved.                                                                          |
| **React Compiler**                      | Automatic memoization, so screens carry no hand written `useMemo` or `useCallback`.                                                                 |
| **Jest with jest-expo**                 | Fast unit tests over the pure domain modules, with no native mocks needed for most of them.                                                         |

Server state libraries and an ORM were left out on purpose. There is no server, and a slice
per feature persisted key by key covers everything the app needs.

<p align="right"><a href="#top">Back to top</a></p>

---

## Architecture

Screens read from selectors, dispatch thunks, and never touch storage. The store is the only
thing that talks to MMKV, and it does so through one persistence subscriber.

```
Screens (src/features/*/screens, rendered by src/app routes)
        │  useAppSelector / useAppDispatch
        ▼
Selectors and thunks         pure derivations, and actions that also schedule
        │                    reminders or show an Undo snackbar
        ▼
Redux slices                 tasks, projects, tags, focus, settings
        │  store.subscribe
        ▼
src/lib/store/persistence    diffs each slice, writes only the records that changed
        │
        ▼
src/lib/storage              typed key value backend over MMKV, one key per record
```

- **The store hydrates synchronously.** MMKV reads are synchronous, so the store is filled
  when the module loads and the first frame already shows real data. There is no splash
  gated fetch and no loading spinner.
- **One key per record.** Records live under `task:<id>`, `project:<id>`, and so on. Immer
  keeps unchanged records referentially equal, so after each action only the records that
  changed are written and deleted ones are removed. Editing one task does not rewrite the rest.
- **Untrusted data is coerced on entry.** Each feature has a `schemas.ts` that turns stored or
  imported JSON into a valid record or rejects it. A record that cannot be parsed is skipped,
  never fatal, and the user is told once.
- **Domain logic has no React and no I/O.** Dates, validation, recurrence, the reminder
  planner, the quick add parser, the focus timer, analytics, and backup migrations are plain
  functions, which keeps them fast to test and easy to reason about.
- **The feature boundary is enforced.** Routes reach a feature only through its `index.ts`,
  shared components never import a feature, and nothing below the route layer imports a
  screen. ESLint checks this, it is not left to discipline.

<p align="right"><a href="#top">Back to top</a></p>

---

## Project structure

```
src/
  app/          Expo Router routes only, one line wrappers around feature screens
  features/     Business domains: tasks, projects, tags, focus, productivity,
                notifications, settings, backup, browse
                each owns its types, slice, thunks, selectors, schemas,
                components, screens, tests, and one index.ts
  components/   Shared, feature agnostic UI (ui/ layout/ feedback/)
  lib/          Infrastructure: storage/ (MMKV) and store/ (root store, persistence)
  providers/    app-providers.tsx: fonts, store, navigation theme, app level effects
  theme/        Light and dark palettes, spacing, type scale
  hooks/        Shared hooks (debounce, clock, reduce motion)
  utils/        Pure helpers for dates and validation
  config/       Input limits
  testing/      Test factories
assets/         Icons and splash art
docs/           Architecture decision records
e2e/            Maestro smoke flow
```

A feature exposes a single public surface through its `index.ts`. Inside it, files are named by
role and only the ones that are needed exist: `store.ts`, `actions.ts`, `selectors.ts`,
`schemas.ts`, `types.ts`, plus domain modules named for what they do, such as `recurrence.ts`,
`quick-add.ts`, and `task-views.ts`. Tests sit next to the code. Files and folders are
kebab-case, and every import outside the current folder resolves through the `@/` alias
rather than `../`.

<p align="right"><a href="#top">Back to top</a></p>

---

## Where each requirement lives

| Area                                                                       | Code                                                                                                                                                                                                                                   |
| :------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1 Tasks (fields, validation, create, edit, complete, delete with Undo)     | [`schemas.ts`](src/features/tasks/schemas.ts), [`actions.ts`](src/features/tasks/actions.ts), [`task-form-screen.tsx`](src/features/tasks/screens/task-form-screen.tsx), [`use-task-actions.ts`](src/features/tasks/hooks/use-task-actions.ts) |
| 2 Views (Inbox, Today dashboard, Upcoming, Completed)                      | [`task-views.ts`](src/features/tasks/task-views.ts), [`screens/`](src/features/tasks/screens)                                                                                                                                          |
| 3 Projects (create, edit, archive, restore, delete, progress)              | [`features/projects/`](src/features/projects), [`store.ts`](src/features/projects/store.ts)                                                                                                                                            |
| 4 Tags                                                                     | [`features/tags/`](src/features/tags), [`store.ts`](src/features/tags/store.ts)                                                                                                                                                        |
| 5 Subtasks (add, edit, complete, delete, reorder)                          | [`subtask-list.tsx`](src/features/tasks/components/subtask-list.tsx), [`store.ts`](src/features/tasks/store.ts)                                                                                                                        |
| 6 Search, filter, sort (250 ms debounce)                                   | `queryTasks` in [`task-query.ts`](src/features/tasks/task-query.ts), [`task-controls.tsx`](src/features/tasks/components/task-controls.tsx)                                                                                            |
| 7 Recurring tasks                                                          | [`recurrence.ts`](src/features/tasks/recurrence.ts), [`completion.ts`](src/features/tasks/completion.ts)                                                                                                                               |
| 8 Reminders and notifications                                              | [`features/notifications/`](src/features/notifications)                                                                                                                                                                                |
| 9 Deep links (`taskmanager://task/<id>`)                                   | [`task/[id].tsx`](src/app/task/[id].tsx), scheme in [`app.config.ts`](app.config.ts)                                                                                                                                                   |
| 10 Natural language quick add                                              | [`quick-add.ts`](src/features/tasks/quick-add.ts), [`quick-add-screen.tsx`](src/features/tasks/screens/quick-add-screen.tsx)                                                                                                           |
| 11 Focus mode                                                              | [`features/focus/`](src/features/focus)                                                                                                                                                                                                |
| 12 Productivity analytics                                                  | [`features/productivity/`](src/features/productivity)                                                                                                                                                                                  |
| 13 Settings, export and import                                             | [`features/settings/`](src/features/settings), [`features/backup/`](src/features/backup)                                                                                                                                               |
| 14 UI and UX                                                               | [`components/`](src/components), [`theme/`](src/theme)                                                                                                                                                                                 |
| 15 Accessibility                                                           | [`accessibility.ts`](src/features/tasks/accessibility.ts), labels and roles throughout `components/`, contrast test in [`contrast.test.ts`](src/theme/contrast.test.ts)                                                                |
| 16 Performance                                                             | [`task-list.tsx`](src/features/tasks/components/task-list.tsx), [`task-row.tsx`](src/features/tasks/components/task-row.tsx), [`persistence.ts`](src/lib/store/persistence.ts), [`dev-seed.ts`](src/features/settings/dev-seed.ts)      |
| 17 Error handling                                                          | [`route-error.tsx`](src/components/feedback/route-error.tsx), [`errors.ts`](src/lib/storage/errors.ts), [`list-gate.tsx`](src/components/feedback/list-gate.tsx)                                                                        |

<p align="right"><a href="#top">Back to top</a></p>

---

## Engineering notes

A few decisions worth calling out for anyone reading the code:

- **Redux slices over Context, and no query library.** The app has several related pieces of
  state (tasks, projects, tags, focus, settings) that reference each other, and deleting a
  project has to un-assign its tasks. Slices with `extraReducers` express that in one place,
  and there is no server to cache, so a data fetching library would have nothing to do.
- **MMKV with a diffing persistence layer.** A subscriber compares each slice with its
  previous value and writes only the records whose reference changed, so a keystroke in one
  task never rewrites a thousand others. No `redux-persist` is needed.
- **Dates are strings, not instants.** Due dates are local `YYYY-MM-DD` and times are
  `HH:mm`. "Due Friday" stays Friday across time zones and daylight saving changes, and
  comparing two dates is a string comparison.
- **Undo restores the same record.** Delete keeps the full task in the snackbar callback and
  puts back the same id, subtasks included. Completing a recurring task also creates the next
  occurrence, and its Undo removes that occurrence too.
- **A pure reminder planner.** It picks the next 50 upcoming reminders, since iOS caps pending
  notifications at 64, and a diff turns that into the minimum cancel and schedule calls. It
  runs at start, on foreground, and, debounced, after task changes. Permission is requested
  when the first reminder is set, not on launch.
- **Focus state is a timestamp.** The session stores `endsAt`, or `remainingMs` when paused,
  and the countdown is computed from that on every tick, so a slow render never makes the
  timer drift. The end notification is scheduled on start and resume, and cancelled on pause
  and stop.
- **Memoization is left to the compiler.** React Compiler is on, so screens carry no
  `useMemo` or `useCallback`. `React.memo` is used only on `TaskRow`, the one component every
  list repeats, and it receives primitives, the task record, and stable callbacks.
- **Colour is never the only signal.** The palette has no red, green, or teal. Overdue is
  burnt orange, completed is plum purple, and each status also carries an icon or a label.
  `contrast.test.ts` checks every text pair against WCAG AA and guards the hue rules.

<p align="right"><a href="#top">Back to top</a></p>

---

## Behaviour decisions

Small product rules that are easy to miss and are covered by tests where it matters:

- **Overdue is time aware.** A task due today at 9 AM is overdue at 10 AM.
- **"At due time" with no time set fires at 09:00.**
- **Archived projects** hide their tasks from Inbox, Today, and Upcoming, and hide the
  project from pickers. The tasks stay reachable inside the project once it is restored, and
  their reminders still fire.
- **Today's "High priority" section** lists other active high priority tasks, meaning ones
  not already under Overdue or Due today.
- **Custom "every N months"** anchors to the previous due date, so Jan 31 becomes Feb 28 and
  then Mar 28. "Monthly on day 31" does not drift.
- **Import is strict and forgiving at once.** Every record is validated, unreadable or
  duplicate ones are counted and skipped, references to missing projects or tags are dropped,
  and a running focus session is never restored. Files from a newer app version are refused,
  and older ones are migrated.
- **The focus completion prompt** survives an app kill through an `acknowledged` flag.

<p align="right"><a href="#top">Back to top</a></p>

---

## Getting started

**Prerequisites:** Node 20 or newer and npm. For iOS, macOS with Xcode 16 or newer and
CocoaPods. For Android, Android Studio with an emulator, or a device with USB debugging.

MMKV, notifications, the date picker, and the document picker are native modules, so the app
runs in a **development build**, not Expo Go.

```bash
git clone https://github.com/parvej-brur/task-for-shareviral.git
cd task-for-shareviral
npm install
npx expo run:ios       # or: npx expo run:android
```

The first run generates the native projects and launches the dev build. After that, the normal
dev server is enough:

```bash
npx expo start
```

### Routes

| Route                                  | Screen                                                     |
| -------------------------------------- | ---------------------------------------------------------- |
| `/` (tab)                              | Today dashboard                                            |
| `/inbox`, `/upcoming`, `/browse` (tabs) | Inbox, Upcoming, and the Browse hub                        |
| `/task/new`, `/task/[id]`, `/task/edit/[id]` | Create, view, and edit a task. `[id]` is the deep link target |
| `/quick-add`                           | Natural language capture                                   |
| `/tasks/all`, `/completed`             | Search, filter, and sort across everything, and finished work |
| `/project/new`, `/project/[id]`, `/projects/archived` | Projects, their detail, and the archive        |
| `/tags`, `/tag/[id]`                   | Tags and the tasks under one tag                           |
| `/focus`, `/productivity`, `/settings` | Focus timer, weekly stats, and preferences                 |

### Scripts

| Command             | Purpose                                     |
| ------------------- | ------------------------------------------- |
| `npm start`         | Start the Expo dev server                   |
| `npm run ios`       | Build and run the iOS dev build             |
| `npm run android`   | Build and run the Android dev build         |
| `npm test`          | Run the Jest unit tests                     |
| `npm run typecheck` | Type check with `tsc --noEmit`              |
| `npm run lint`      | Lint with ESLint, including boundary rules  |
| `npm run format`    | Format with Prettier                        |
| `npm run verify`    | Lint, type check, and test in one go        |

EAS build profiles for `development`, `preview`, and `production` are in
[`eas.json`](eas.json).

### Environment

None. The app makes no network calls and reads no environment variables, so there is nothing
to configure and no secret to protect. [`.env.example`](.env.example) exists only to say so.

<p align="right"><a href="#top">Back to top</a></p>

---

## Testing

Run with `npm test`: **16 suites, 350 tests**. They target the correctness critical pure
logic, which is where bugs would actually hurt and where tests give the most signal per line.

| Area                | What is pinned down                                                                                                              |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| **Task queries**    | Search, filter, and sort compose in one pass, and views such as Today and Upcoming bucket tasks correctly.                        |
| **Recurrence**      | Next occurrence for daily, weekly, monthly, and custom rules, including month end anchoring.                                     |
| **Quick add**       | Dates, times, repeats, tags, and priorities parsed out of a sentence, and each piece switching off cleanly.                      |
| **Reminders**       | The planner's cap and ordering, the diff into cancel and schedule calls, and the app running with notifications unavailable.     |
| **Focus**           | The timestamp based timer, pause and resume, and a session that expired while the app was closed.                                |
| **Backup**          | Round trips, validation of bad records, version migration, and refusing files from a newer app.                                  |
| **Store**           | Task, project, and tag actions, Undo, and persistence: one record per key, only changed records written, corrupt ones skipped.   |
| **Theme**           | Every text pair meets WCAG AA and no palette hue crosses the no red, green, or teal rule.                                        |

The bias is toward tests that pin an invariant rather than restate an implementation, so they
fail loudly on a regression and survive a restyle. UI tests were deliberately skipped in the
interest of focus. A Maestro smoke flow in [`e2e/maestro/smoke.yaml`](e2e/maestro/smoke.yaml)
checks that the app starts and the four tabs are reachable:

```bash
maestro test e2e/maestro/smoke.yaml
```

<p align="right"><a href="#top">Back to top</a></p>

---

## Project status and scope

The app is complete for what it sets out to do, and a few things are deliberately left out:

- **No accounts, backend, or sync.** Data lives on one device. Use export and import to move
  it, or to keep a copy.
- **No collaboration, attachments, location reminders, calendar sync, or widgets.**
- **No AI services and no gamification.**
- **Subtasks reorder with up and down buttons.** There is no drag and drop.
- **No component or screen tests.** The pure domain code is covered, and the screens are
  checked by running the app and by the Maestro smoke flow.

<p align="right"><a href="#top">Back to top</a></p>

---

## Roadmap

- Add React Native Testing Library coverage for the task form and the list screens.
- Add drag and drop reordering for subtasks.
- Add an optional home screen widget for Today.
- Add opt in sync between devices, built on the existing export format.

<p align="right"><a href="#top">Back to top</a></p>

---

## Documentation

| Document                                                                | What it covers                                                                                                                                       |
| :---------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`docs/adr/0001-project-structure.md`](docs/adr/0001-project-structure.md) | The folder layout, feature ownership, naming rules, and the five dependency rules that ESLint enforces, plus what was deliberately not created.       |

<p align="right"><a href="#top">Back to top</a></p>

---

## About the developer

Built by **Parvej Sikdar**.

- Portfolio: [agriyo.netlify.app](https://agriyo.netlify.app)
- GitHub: [@parvej-brur](https://github.com/parvej-brur)

I designed the architecture, the storage model, and the behaviour rules. I used Claude to
scaffold repetitive UI, draft unit tests, and write this documentation. I reviewed the
implementation and checked it with `npm run verify` before committing.

<p align="right"><a href="#top">Back to top</a></p>

---

## License

This project is a portfolio piece. The code is available for reading and reference. Please ask
before reusing a substantial part of it in another project.

<p align="right"><a href="#top">Back to top</a></p>
