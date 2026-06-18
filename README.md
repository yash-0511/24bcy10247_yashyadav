Daily Database Queries & Local Library Resource Management System (LLRMS)
Student Name: Yash Yadav

Roll Number: 24BCY10247

Submission Date: June 18, 2026

📌 Repository Overview
This repository serves as a comprehensive archive of my daily database engineering workspace. It documents a progressive learning track split into two core areas:

Daily Query Implementations: Consistent, daily hands-on uploads featuring complex relational SQL schemas, structural normalization, joins, and native MongoDB non-relational document query filters.

Capstone Project (LLRMS): A fully complete, production-ready backend RESTful API designed to automate and orchestrate institutional library transactions cleanly.

🛠️ LLRMS System Outcomes & Architecture
The Local Library Resource Management System balances data consistency and speed by combining an asynchronous, non-blocking runtime with a flexible document datastore.

Core Features:
NoSQL Document Integrity: Embeds cross-collection relational bindings across independent collections (categories, members, resources, transactions) utilizing unique MongoDB ObjectIDs.

Programmatic FIFO Waitlists: Resolves resource contention automatically. When an item's copy count reaches zero, subsequent borrow requests are safely shifted into an active reservation queue array.

Algorithmic Fine Management: Parses transactional timelines against incoming return timestamps to calculate late fee penalties quantified in Indian Rupees (INR).

Multi-Stage Data Aggregation: Provides administrators with real-time analytics using advanced native MongoDB $lookup, $unwind, and $sort aggregation pipelines.

💻 Tech Stack & Environment Profiles
Runtime Environment: Node.js v20.11.0 (LTS)

Web Framework: Express.js v4.19.2

Database Driver: Mongoose ODM v8.2.1

Database Instance: MongoDB Community Server v7.0.5 & Compass GUI

API Testing Suite: Postman Desktop v10.24.0

📂 Project Directory Structure
Plaintext
24bcy10247_yashyadav/
│
├── LLRMS_Final_Submission.zip   # Consolidated production bundle containing all source files
├── server.js                    # Main API entry point and routes
├── package.json                 # Dependency version manifest
├── package-lock.json            # Auto-generated package lock file
├── .env                         # Isolated environment variables
├── .gitignore                   # Excludes node_modules from cloud tracking
├── screenshots/                 # Core implementation verification images
│   ├── screenshot_3.png         # Members collection verification
│   ├── screenshot_4.png         # Resources collection verification
│   ├── screenshot_6.png         # VS Code script layout
│   ├── screenshot_9.png         # Clean node engine startup logs
│   ├── screenshot_12.png        # Successful item checkout (Postman)
│   ├── screenshot_13.png        # FIFO waitlist activation (Postman)
│   ├── screenshot_14.png        # Fine evaluation calculation (Postman)
│   └── screenshot_15.png        # Deep analytics lookup report (Postman)
└── [Daily Progress Files].docx/.pdf  # Weekly evaluation tracking archives
🚀 Local Installation & Execution
To get this backend system running locally on your machine, follow these steps:

Clone or Download the Repository:
Extract the contents of LLRMS_Final_Submission.zip into a local directory.

Install System Dependencies:
Open a terminal window inside the project root folder and execute:

npm install


3. **Configure Environment Variables:**
   Create a `.env` file in the root directory and specify your connection credentials:
   ```text
   PORT=8080
   MONGO_URI=mongodb://localhost:27017/llrms
Launch the Engine:
Boot up the active local routing server by running:

Bash
node server.js
   The terminal will log: `🚀 [ROUTING SERVER] LLRMS Engine Running on Port 8080`. You can now run the endpoint collection via Postman.
