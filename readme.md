# skyanswers

a bot to do misc things in the SkyClient server, originally intended
to only answer tickets, but extended to replace another bot

## running

1. clone it
2. `pnpm i`
3. set `DISCORD_TOKEN` in `.env`
   optional: set `SB_KEY` for the supabase db and `AZURE_QA_KEY` for the azure question answering if you want
4. make sure the bot has edit channel perms
5. `pnpm start`
