# Email admin migration — preparation

Status: staged preparation only. Firebase is not connected yet. Existing production admin is unchanged.

Owner: remajasilo.rs@gmail.com (verified email required).

Planned access:
- Owner logs in with Google/Firebase Authentication. Never accept a typed email as proof of identity.
- Owner can add, disable, or remove other admin email addresses in lymeAdmins.
- Other verified admins can edit menus and availability, but cannot grant admin access.
- Backend Firestore rules enforce these permissions even when browser checks are bypassed.
- The owner cannot lose access through the admin-email list.
- lymeMenus holds one product per document. Public menu reads this collection; fallback remains menu.json during migration.
- Product photos will be compressed with a strict size cap before storage. Existing asset paths remain valid.
- No GitHub write token is sent to a visitor or embedded in the app.

Pending connection: create/select a dedicated Firebase project; enable Google sign-in, register a web app, authorize hiijee220.github.io; create Firestore and test/publish firestore.rules; connect frontend, migrate menu data, test authorized and denied operations, then replace the token login. Do not publish a nonfunctional email form or deploy untested rules.
