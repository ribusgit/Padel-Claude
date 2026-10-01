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

- Render class development through the shared `SessionDevelopment` UI so court diagrams and YouTube links stay consistent across calendars and portals.
- Store each exercise diagram as a semantic preset (`auto`, `rally`, `serve`, `net`, or `lob`) so editors and session views render the same graphic.
- Custom court drawings live in the private `court-drawings` bucket + `court_drawings` table; a class's `drawing_id` overrides the exercise preset inside `SessionDevelopment`. Why: coaches' own drawings must render identically everywhere.
- The initiation curriculum follows the uploaded 26-session academy program, distributed 9/8/9 across the three trimesters. Why: Pista, class assignment, and student views must share the approved teaching sequence.
