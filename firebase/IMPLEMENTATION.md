# Firebase email admin — deployed

Project: menu-lyme-coffe. Database: (default), Standard, asia-southeast2 (Jakarta), created by the owner. Verified owner: remajasilo.rs@gmail.com.

Google sign-in is enabled and hiijee220.github.io is an authorized domain. The frontend and Firestore access rules are deployed. No invitation project is modified.

Access: public reads of lymeMenus only; verified owner and enabled verified admin emails may modify menu data. Only the owner may grant, disable or remove entries in lymeAdmins. Menu writes use transactions with document-version checks and server timestamps. Uploaded photos are compressed and capped below 650,000 characters. Runtime data is in Firebase; code and fallback menu are in GitHub.

Validation: owner login confirmed on the live admin page; owner-saved menu documents were read back from Firestore and matched the public UI (Matcha Latte Rp20,000; Americano and Cappuccino unavailable). Public menu collection read returned 200; unauthenticated admin-list read returned 403. Menu editing, saving, and adding an admin email were also checked using an isolated simulated backend before release. Cross-account login and real photo-upload round trips have not yet been exercised in production. No extra admin email was granted during production validation.
