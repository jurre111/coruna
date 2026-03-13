# Coruna

The leaked exploit toolkit for various iOS versions. Extracted from `https://sadjd.mijieqi[.]cn/group.html`

Partially deobfuscated, symbolicated, and modified to load decrypted payloads by Claude (thanks @34306 for sponsor) and by hand.

These scripts are modified in a way that allows you to host them locally. Note that this only includes exploit chains for tested devices.

## Analysis
There are so many analysis by other people right now so I'm not doing it again, however I have a generated [ANALYSIS.md](ANALYSIS.md) specifically talking about decryption process and iOS payloads version table.

## Tested on
| Device| Version | WebKit exploit chain |
| :--- | --- | --- |
| iPhone 6s+ | 15.4.1 | jacurutu -> VariantB? |
| iPhone Xs Max | 16.5 | terrorbird -> seedbell -> VariantB |
| iPhone 15 Pro Max | 17.0 | cassowary -> seedbell_pre -> seedbell_17 -> VariantB |

## GitHub Actions build (TweakLoader)

This repo includes `.github/workflows/build-tweakloader.yml` to build `TweakLoader` on `macos-14` with Theos.

- Trigger manually from **Actions → Build TweakLoader → Run workflow**.
- Download artifact `tweakloader-build-<sha>`.
- Use `dist/payloads/TweakLoader.dylib` from that artifact to replace `payloads/TweakLoader.dylib` on your host.

The workflow also emits:

- `dist/build/TweakLoader.dylib`
- `dist/build/SpringBoardTweak.dylib` (when produced)
- `dist/build/*.deb` (when packaging succeeds)
- `dist/payloads-tweakloader.tar.gz`
