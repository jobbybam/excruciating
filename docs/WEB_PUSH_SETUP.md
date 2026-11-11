# Web push setup and domain moves

Excruciating sends push alerts for direct messages. The sender appears as the notification title and the message appears underneath it. Public chat does not send push alerts.

## Configure VAPID keys

1. From the repository root, run `npm install` if needed, then `npm run generate:vapid`. This prints a matching public and private key plus a sample subject. Generate the pair once and keep the private key private.
2. In Cloudflare, open **Workers & Pages → excruciating → Settings → Variables and Secrets**.
3. For the **Production** environment, add `VAPID_PUBLIC_KEY` as a regular variable and `VAPID_SUBJECT` as a regular variable. Use `mailto:you@example.com` for the subject, or an HTTPS site URL you control.
4. Add `VAPID_PRIVATE_KEY` as an **encrypted secret**. Do not put the private key in the repository, a screenshot, chat, or a committed configuration file.
5. Repeat the values for **Preview** only if you want push notifications on preview deployments. Save and trigger a new deployment after changing the values.
6. Confirm the API reports notifications as configured by opening `/api/chat/notifications` on the deployed site. It should return `enabled: true` and the public key; it must never return the private key.
7. Users sign in, install the site on their Home Screen on iPhone/iPad, open it from that icon, and tap **Enable notifications**. The browser permission request happens only after that tap.

For local Pages Functions development, put the same three variables in the ignored `.dev.vars` file at the repository root. Never commit that file.

## Move Excruciating to a new domain

1. Add the new custom domain to the existing Cloudflare Pages project and wait for its HTTPS certificate to become active before directing users to it.
2. If `VAPID_SUBJECT` is a `mailto:` contact, it can stay as-is. If it is the old site URL, update it to the new HTTPS URL. The VAPID key pair itself does not need to change solely because the hostname changed.
3. Keep the same `VAPID_PUBLIC_KEY` and encrypted `VAPID_PRIVATE_KEY` in the new production deployment. The pair must match; do not generate a fresh pair unless you intend to re-subscribe every device.
4. A domain is a different browser origin. Users will need to open the new domain, sign in again, add it to their Home Screen if they use iPhone/iPad, and enable notifications there. Push subscriptions and login cookies do not transfer between domains.
5. Keep the old domain and project available until the new one is working. Verify a direct message reaches a test device from the new domain before retiring the old address. Old subscriptions can then be removed from the old deployment or allowed to expire.

## Quick troubleshooting

- `/api/chat/notifications` returns `enabled: false`: one or more VAPID values are missing in the deployment environment, or the deployment has not been rebuilt.
- Permission is blocked: re-enable notifications in the device/browser settings. A web page cannot reset a denied permission.
- iPhone/iPad cannot enable push: use iOS/iPadOS 16.4 or later, add the site to the Home Screen, open it from that icon, and use the in-app **Enable notifications** button.
- Push setup is configured but DM alerts do not arrive: confirm the user is signed in on the device, the device subscription is registered, and a new deployment includes the VAPID secrets.
