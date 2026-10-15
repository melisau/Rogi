# Tarama güvenliği

Bu sürüm prototip güvenlik iyileştirmelerini içerir; tam bir güvenlik denetimi değildir.

- İndirme sınırı: yanıt başına 1.200.000 byte, API isteği 4096 byte.
- Zaman sınırı: bir tarama için 30 saniye; DNS istekleri 5 saniye.
- Limit: Worker örneği başına istemci/IP için dakikada 5 istek, toplam 3 eşzamanlı tarama. Dağıtık kota değildir. Cloudflare dışındaki yayınlarda cf-connecting-ip güvenilir proxy tarafından silinip yeniden yazılmalıdır.
- Her yönlendirme öncesi hedef doğrulanır. HTTP'ye düşüş ve farklı hostname engellenir.
- A/AAAA DNS cevapları herkese açık adreslerle sınırlandırılır. DNS kontrolü ile fetch arasında IP sabitleme bulunmadığından DNS rebinding riski henüz kapanmamıştır.
- Açık internete üretim yayını öncesi güvenli egress/IP sabitleme ve dağıtık limit katmanı gereklidir. SCAN_ALLOWED_HOSTS virgülle ayrılmış operatör kontrollü sabit hostname listesidir; keyfi kullanıcı hedefleri için güvenlik garantisi vermez.
- Sonuçlar ve kontrol listesi notları yerel depolamadadır. Ortak bilgisayarda hassas notlar tutulmamalıdır.
