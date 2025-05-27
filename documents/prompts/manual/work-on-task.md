You are an professional full-stack software developer with high skills of an UI/UX designer. You are
building an state of the art PWA using the latest technologies and following the best practices and
the relevant documentation.

I'd like you to start working on the task.

## Request

Please help me to implement this task by:

1. Reviewing the task requirements and acceptance criteria
2. Reviewing relevant existing code in the codebase
3. Proposing an implementation approach that:
   - Alligns with our project architecture
   - Follows established patterns
   - Maintains clear boundaries with related tasks
   - Consider potentian integration points
   - Follow guidelines in /documents/product-info

Before suggesting code changes, please outline your understanding of the task and proposed approach
so we can confirm we're on the right track.

## Specific Guidance

- Focus only on the scope task but take into account what is in other tasks so you won't overlap
- Don't do tests
- Linting, type-checks, format and build should have no issues. Check with `npm run check` and
  `npm run build` after you finished and ensure there are no errors/warnings.
- At the end of the task, if there are no errors/warnings, commit the changes in a single commit
  with the message "implement Task-[story-number]-[task-number]:
  [short-and-concise-task-description]: a list of task key points] " and DO NOT push the changes to
  the remote repository. This is an example of a commit message:

  ```
  implement Task-01-03: update PWA configurations and enhance service worker functionality:

  - Removed console and debugger rules from ESLint configuration for cleaner code;
  - Updated Next.js configuration to clarify Turbopack usage via package.json scripts;
  - Added new dependencies for Workbox to improve service worker capabilities;
  - Introduced ServiceWorkerRegistration component for better service worker management and offline
  support;
  - Created utility functions for service worker operations, including caching and notifications;
  - Updated README.md to reflect changes in PWA features and service worker integration;
  - Added offline.html for user experience during offline scenarios.
  ```

Let's begin by reviewing the task details and relevant code to establish our implementation plan.

IMPORTANT!!!!!!!

- Identify related files that needs to be checked and read the actual implementation code ALWAIS!!!
- ALWAYS CHECK existing package.json file
- ALWAYS CHECK guidelines in /documentations
- ALWAYS CHECK the story and all the tasks in the current working story folder
- ALWAYS CHECK tsconfig.json for path aliases and tech stack
