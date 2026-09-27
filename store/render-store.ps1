# Rendert die Web-Store-Grafiken nach store/out/ (braucht Chrome und Python mit Pillow)
$chrome = "C:\Program Files\Google\Chrome\Application\chrome.exe"
$root = Split-Path $PSScriptRoot
$out = "$PSScriptRoot\out"
New-Item -ItemType Directory -Force $out | Out-Null
$page = "file:///" + ("$PSScriptRoot\assets.html" -replace '\\', '/')

function Shot($name, $w, $h, $url, $bg = "ffffffff") {
  Start-Process -Wait -FilePath $chrome -ArgumentList "--headless=new", "--disable-gpu", "--hide-scrollbars",
    "--default-background-color=$bg", "--window-size=$w,$h", "--virtual-time-budget=3000",
    "--screenshot=$out\$name", $url
}
Shot "screenshot-1280x800.png" 1280 800 "$page`?a=shot"
Shot "promo-small-440x280.png" 440 280 "$page`?a=small"
Shot "promo-marquee-1400x560.png" 1400 560 "$page`?a=marquee"
Shot "icon-512.png" 512 512 ("file:///" + ("$root\icon.svg" -replace '\\', '/')) "00000000"

python -c @"
from PIL import Image
out = r'$out'
# Store verlangt 24-Bit-PNG ohne Alpha
for n in ('screenshot-1280x800', 'promo-small-440x280', 'promo-marquee-1400x560'):
    im = Image.open(f'{out}/{n}.png')
    assert im.convert('L').getextrema() != (255, 255), f'{n} ist leer, nochmal ausfuehren'
    im.convert('RGB').save(f'{out}/{n}.png')
# Store-Icon: 96 px Herz mit 16 px transparentem Rand (Chrome-Richtlinie)
big = Image.open(f'{out}/icon-512.png').convert('RGBA')
assert big.getbbox(), 'Icon ist leer, nochmal ausfuehren'
icon = Image.new('RGBA', (128, 128))
icon.paste(big.resize((96, 96), Image.LANCZOS), (16, 16))
icon.save(f'{out}/store-icon-128.png')
print('ok')
"@
Remove-Item "$out\icon-512.png"
