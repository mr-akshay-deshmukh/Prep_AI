# Security Policy

## Supported Versions

We provide security updates for the following versions of **PrepAI**:

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

---

## Reporting a Vulnerability

The PrepAI team takes security and user privacy seriously. If you discover a security vulnerability, we appreciate your help in disclosing it to us responsibly.

### How to Report
Please **do not** open a public GitHub issue for security vulnerabilities.

Instead, please send an email to:
📧 **`engineeringstudies5@gmail.com`**

Include the following details in your report:
- **Type of issue**: (e.g. API key leakage, injection, authentication bypass, CSRF)
- **Detailed steps to reproduce**: code samples, HTTP request dumps, or screen recording
- **Potential impact**: how an attacker could exploit this vulnerability
- **Any suggested remediations**: if known

### Response Timeline
- We will acknowledge receipt of your vulnerability report within **48 hours**.
- We will provide a status update or fix within **7 business days**.
- Once a fix is verified and deployed, we will publicly credit the reporter (unless you prefer anonymity).

---

## Security Best Practices for Self-Hosting

1. **Keep Secrets Private**:
   - Never commit `.env` containing your real `GEMINI_API_KEY` to public repositories.
   - Use environment variables or cloud secret managers in production environments.
2. **Firestore Security Rules**:
   - Ensure the rules in `firestore.rules` are actively deployed to enforce strict UID-level user authorization.
3. **API Rate Limiting**:
   - In high-traffic deployments, configure reverse proxies (e.g., Cloudflare, NGINX) to prevent abuse of the `/api/gemini/*` endpoints.
