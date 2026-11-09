<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

- Phone-only signup uses a validated server function with native Auth user creation; privileged credentials remain server-only because SMS-free signup cannot use ordinary confirmation flow.
- Registration profiles are caller-scoped through RLS and authenticated server functions; a single root account provider owns session updates and account display.
- Admin rights come only from leaders holding a leadership position flagged admin (checked by the is_admin database function in RLS); UI admin checks are cosmetic.
- Family groups are assigned in the database when a profile completes registration, so placement never depends on the browser.
- Every delete goes through the ConfirmDelete dialog (typed DELETE plus confirmation tick).
- Public event registration writes directly with anonymous insert-only access; registrant lists stay admin/self readable.

- The public root renders authentication; management pages live under the managed authenticated layout at named URLs to prevent signed-out content flashes.
- Profile updates must replace the caller-keyed profile query before navigation so completion cannot leave stale gating state.

- AppShell owns scroll layering and page contents discovery through shared card markers; only short single-column siblings stack so tall content remains accessible.
