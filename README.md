# FairShare — expense splitting with on-chain settlement

React + Vite app for splitting expenses and committing final settlements to **Polygon Amoy** testnet.

---

## On-chain settlement (Polygon Amoy)

### Deploy the contract

1. Install deps and compile:
   ```bash
   npm install
   npm run compile
   ```
2. Set in `.env`:
   - `AMOY_RPC_URL=https://rpc-amoy.polygon.technology` (optional; default used)
   - `DEPLOYER_PRIVATE_KEY=0x...` (wallet with testnet MATIC for gas)
3. Deploy:
   ```bash
   npm run deploy:amoy
   ```
4. Add the printed contract address to `.env`:
   ```bash
   VITE_SETTLEMENT_LEDGER_ADDRESS=0x...
   ```

### Run the app

```bash
npm run dev
```

- **Finalize**: From a group, go to **Settle** → **Commit to chain (Polygon Amoy)**. Connect MetaMask, switch to Polygon Amoy (80002), and commit. You’ll be redirected to the **Proof** page.
- **Proof**: View settlement ID, hash, and **Verify** that the downloaded canonical JSON hashes to the on-chain value. Explorer link: [amoy.polygonscan.com](https://amoy.polygonscan.com).

### DB migration (wallet + settlements)

Run in Supabase SQL Editor (or your migration runner) the contents of `supabase/migrations/20260222000000_add_wallet_and_settlements.sql` so that `members.wallet_address` and `group_settlements` exist.

---

# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
