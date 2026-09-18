# Mobile Task

## Project Overview and Main Features

Mobile application for field employees to create, manage, track, and review tasks.

The application supports:

* Task creation and editing
* Task deletion
* Task title, description, due date and time
* Manual task location
* Optional latitude and longitude
* Image attachments
* Task statuses: New, In Progress, Completed, Cancelled
* Task validation
* Task list and sorting
* Task details
* Persistent task history
* Offline task management
* Local data persistence
* Synchronization with a mock REST API
* Synchronization status
* Local notifications
* Task locations on a map
* Light and dark themes

## Candidate Code

**SA-RN-4827**

## Installation and Run

Install dependencies:

```bash
npm install
```

Run the application on Android:

```bash
npm run android
```

## APK Build

Build a release APK:

```bash
npx expo run:android --variant release
```

## Mock Server

The project uses `json-server` as a mock REST server for synchronization.

Start the mock server:

```bash
npm run mock-server
```

Sample data is provided in:

```text
mock-server/db.json
```

## Architecture

* **Storage:** AsyncStorage is used for local task and history persistence.
* **State management:** Zustand is used for application state management.
* **Synchronization:** A separate synchronization layer communicates with the mock REST API and synchronizes local changes when network connectivity is available.
* **Notifications:** Expo Notifications is used for local task deadline notifications.
* **Map/Location:** React Native Maps is used to display task locations. Addresses are entered manually and coordinates are optional.

## Known Limitations and Trade-offs

* The REST backend is implemented using `json-server` and is intended as a mock server for the assignment.
* Real geocoding is not implemented.
* Local notifications are used instead of push notifications.
* Image attachments depend on local device storage and file availability.

## AI / Tooling Disclosure

AI tools were used during development for implementation assistance, debugging, code review, and documentation.

## Video

[View the application demonstration video](https://drive.google.com/file/d/1CMKntFHWo4Xp3lwiTNlDgH4nxZ5RtIDl/view?usp=sharing)
