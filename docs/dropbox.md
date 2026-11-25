# Dropbox

Project files live in Dropbox, one folder per project.

- The app only creates folders for projects created in the app. Imported (Trello) projects are never linked to a folder
- Folders are tracked by their Dropbox id, so renaming or moving them in Dropbox keeps the link

## Setup

Set these variables in `.env`, `.env.staging` and `.env.prod`, and in the Vercel Preview and Production environments (a deploy without them can't reach Dropbox):

| Variable                | Value                                                                    |
| ----------------------- | ------------------------------------------------------------------------ |
| `DROPBOX_APP_KEY`       | App key (Dropbox App Console → Settings)                                 |
| `DROPBOX_APP_SECRET`    | App secret (same page)                                                   |
| `DROPBOX_REFRESH_TOKEN` | Long-lived refresh token, obtained once with `token_access_type=offline` |
| `DROPBOX_ROOT_PATH`     | Folder holding one folder per project, e.g. `/Projets`                   |

- The Dropbox app needs the `files.content.read`, `files.content.write`, `files.metadata.read` and `files.metadata.write` permissions
- The refresh token is not the "Generate access token" button, which gives a 4-hour access token. Authorize the app at `https://www.dropbox.com/oauth2/authorize?client_id=<APP_KEY>&response_type=code&token_access_type=offline`, then exchange the returned code at `https://api.dropbox.com/oauth2/token` (`grant_type=authorization_code`, with the app key and secret as basic auth)
- Never put real values in `.env.example`, it is committed
