# Contributing

## Run it locally

```sh
dsh plugin --profile dev add /abs/path/to/dsh-sansheng-liubu
```

Restart the desktop app afterwards — slots are registered at startup, so a hot reload proves nothing.

## What to check after a change

- **Assembly still holds** — the four requirements: the package name sits in the profile's `dsh.profile.bundles`; `dsh.bundle.patch` points at `cordis.patch.yml`; `dsh.client.platform: "web"` **and** `exports["./client"]` are both present; `lib/index.js` stays a valid cordis plugin.
- **`sl-*` class names stay put** — the stylesheet and the components are matched by name only; renaming one is a silent visual break.
- **Nothing to sync** — the installed `node_modules/dsh-sansheng-liubu` is a junction to this source tree, so there is no second copy to update. Edit here, restart; never hand-edit inside `node_modules`.

## Before opening a PR

Say what you did **not** run — build, browser, restart — and back every change with `file:line` plus the first 40 characters of that line. "It works" is not evidence.

Keep `README.md` and `README.zh.md` in step: same headings, same order, same claims.

MIT, same as the package.
