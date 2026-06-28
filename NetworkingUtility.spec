# -*- mode: python ; coding: utf-8 -*-

import os

# Web assets that must ship inside the exe. Only bundle files that actually
# exist so a missing optional asset (e.g. icon) never breaks the build.
_ASSET_CANDIDATES = [
    'index.html',
    'style.css',
    'filter.js',
    'theme-elements.css',
    'floral-theme.css',
    'icon.png',
]
datas = [(f, '.') for f in _ASSET_CANDIDATES if os.path.exists(f)]

# Use the icon only if it is present, otherwise let PyInstaller use the default.
_icon = 'icon.ico' if os.path.exists('icon.ico') else None


a = Analysis(
    ['app.py'],
    pathex=[],
    binaries=[],
    datas=datas,
    hiddenimports=[],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    noarchive=False,
    optimize=0,
)
pyz = PYZ(a.pure)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.datas,
    [],
    name='NetworkingUtility',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=False,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
    icon=_icon,
)
