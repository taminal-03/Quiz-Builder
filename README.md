# Quiz Builder

A small React + Vite quiz app with separate Admin and Student modules. Quiz data, student accounts, and results are saved in the browser's Local Storage.

## Run it

1. Install Node.js.
2. In this folder, run `npm install`.
3. Run `npm run dev`, then open the local address shown in the terminal.
4. For a production check, run `npm run build`.

## Try the app

- Admin: `admin` / `admin123`
- Student: use **Create account** first, then sign in.
- Admin creates quizzes and checks the submitted result history.
- Students take quizzes and can see their scores in their own account.

## Deploy to Vercel

Push this project to GitHub, import the repository in Vercel, and deploy using the Vite defaults. The build command is `npm run build` and the output folder is `dist`. Verify the Vercel URL after deployment.

## Exam explanation

- `index.html` loads the React app.
- `src/main.jsx` mounts the app and its styles.
- `src/App.jsx` contains signup/login, quiz authoring, quiz taking, and results.
- `src/styles.css` contains the responsive design.
- `localStorage` keeps the demo data in the same browser.

**Demo limitation:** Local Storage is not secure authentication and does not share data across browsers or devices. Do not use this password-storage approach for a real production app.
