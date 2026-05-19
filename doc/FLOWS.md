# CEMO Admin Program Flowcharts

This documentation presents the CEMO Admin program flow, separated by modules for clarity while adhering to strict flowcharting standards.

## Standards Followed
- **Global Start/End:** There is only one **START** (in the Authentication module) and one **END** (in the Logout module) across the entire system.
- **Single Outgoing Flow:** Every process and predefined process symbol has exactly **one outgoing line**.
- **Binary Decisions:** Branching is handled exclusively by decision diamonds with exactly two outgoing lines.
- **Connectivity:** Modules are logically linked using circular connectors (**A, B, C, Z**).

---

## 1. Authentication & Routing (Entry Point)
This module handles the initial user access and verification.
![Authentication Flow](png/1_auth_flow.png)
*Connects to Dashboard via **A***

---

## 2. Dashboard Module
The central hub for system statistics and navigation.
![Dashboard Flow](png/2_dashboard_flow.png)
*Connects to Users (**B**), Waste (**C**), or Logout (**Z***)

---

## 3. User Management Module
Handles administrative actions related to user accounts and establishments.
![Users Flow](png/3_users_flow.png)
*Return to Dashboard via **A** or exit via **Z***

---

## 4. Waste Entries Module
Monitoring disposal logs on a per-user basis.
![Waste Flow](png/4_waste_flow.png)
*Return to Dashboard via **A** or exit via **Z***

---

## 5. Logout & Termination (Exit Point)
The final phase of the application session.
![Logout Flow](png/5_logout_flow.png)
*Terminates at **END***
