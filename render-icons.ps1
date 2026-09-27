# Rendert icon.svg nach icons/icon{16,32,48,128}.png (braucht Chrome und Python mit Pillow)
$chrome = "C:\Program Files\Google\Chrome\Application\chrome.exe"
$svg = (Resolve-Path "$PSScriptRoot\icon.svg").Path -replace '\\', '/'
$big = Join-Path $env:TEMP "rainbow-icon-512.png"
New-Item -ItemType Directory -Force "$PSScriptRoot\icons" | Out-Null
Start-Process -Wait -FilePath $chrome -ArgumentList "--headless=new", "--disable-gpu", "--hide-scrollbars",
  "--default-background-color=00000000", "--window-size=512,512", "--virtual-time-budget=2000",
  "--screenshot=$big", "file:///$svg"
python -c @"
from PIL import Image
im = Image.open(r'$big').convert('RGBA')
assert im.getbbox(), 'Render ist leer, nochmal ausfuehren'
for s in (16, 32, 48, 128):
    im.resize((s, s), Image.LANCZOS).save(r'$PSScriptRoot\icons\icon%d.png' % s)
print('ok')
"@
