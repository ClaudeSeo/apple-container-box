#!/bin/bash
# npm install 후 Electron.app 번들 이름을 앱 이름으로 패치

PLIST="node_modules/electron/dist/Electron.app/Contents/Info.plist"

if [ ! -f "$PLIST" ]; then
  echo "[rename-electron] Electron.app not found, skipping"
  exit 0
fi

/usr/libexec/PlistBuddy -c "Set :CFBundleName 'Container Box'" "$PLIST"
/usr/libexec/PlistBuddy -c "Set :CFBundleDisplayName 'Container Box'" "$PLIST"
echo "[rename-electron] Electron.app renamed to 'Container Box'"
