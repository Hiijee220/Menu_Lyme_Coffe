# Lyme Coffee email admin

Project: menu-lyme-coffe. Owner: remajasilo.rs@gmail.com.

Prepared: Firebase Google authentication, verified-email access, owner-only admin access management, atomic menu transactions with stale-edit protection, photo compression and public menu synchronization. Source is staged on feature/email-admin until backend setup and verification are complete.

Pending: confirm permanent Firestore location with owner, create Standard Firestore in production mode, deploy and test firebase/firestore.rules. Authentication Google provider was enabled and hiijee220.github.io was added to authorized domains; recheck both before final end-to-end test.

Security: Only verified owner email can grant/revoke editor access. Other verified allowed emails can modify menu data. Public users can read lymeMenus only. GitHub tokens are not used by the new admin. Each photo is compressed and capped below 650,000 characters; one document per menu stays below Firestore document size limits.

Runtime menu changes are stored in Firebase; application source and fallback menu remain in GitHub. No existing invitation project is modified.
