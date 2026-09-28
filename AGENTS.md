<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Keep Sera as a front-end prototype backed by typed, tenant-scoped mock services; this preserves the future backend contract without connecting services now.
- Centralize interview eligibility, retry, resume, CEO threshold, and CV unlock rules in `src/lib/rules.ts` so demo controls never replace business logic.
