# LiiiGHTNOTES frontend

This client folder is the canonical frontend checkout for https://github.com/babekizulu/liiightwave-notes. The sibling server folder has its own repository: https://github.com/babekizulu/liiightnotes-server.

Use Node.js 24. Run npm ci, npm run lint and npm run build. For local development start the sibling server, then npm run dev here.

Netlify builds main at the repository root and publishes dist. Set API_ORIGIN to the Railway API's plain HTTPS origin. netlify.toml generates a same-origin API proxy. No backend secrets belong in Netlify build variables.

Future frontend commits: git add src; git commit -m "Update frontend"; git push origin main.

The earlier production/accounts-security branch is a historical combined release candidate; deployments now use the separate repositories' main branches.
