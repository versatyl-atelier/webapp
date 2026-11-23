# Trello

The app creates Trello cards for projects, phases and pieces. Card moves in Trello flow back to the app through webhooks.

- Trello calls `<BETTER_AUTH_URL>/api/trello/webhook`, so the deployment must be reachable from the internet. Webhooks can't be registered from localhost
- Managers configure destinations, list-to-stage mappings and webhooks at `/gestionnaire/trello`

## Setup

Set these variables in `.env`, `.env.staging` and `.env.prod`, and in the Vercel Preview and Production environments:

| Variable        | Value                                                                       |
| --------------- | --------------------------------------------------------------------------- |
| `TRELLO_KEY`    | API key of the Trello Power-Up (trello.com/power-ups/admin)                 |
| `TRELLO_TOKEN`  | Token authorized for a service account that is a member of every board used |
| `TRELLO_SECRET` | The Power-Up's secret, used to verify the signature of incoming webhooks    |

- Never put real values in `.env.example`, it is committed
