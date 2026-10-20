# Tarama güvenliği

Bu sürüm prototip güvenlik iyileştirmelerini içerir; tam bir güvenlik denetimi değildir.

- İndirme sınırı: yanıt başına 1.200.000 byte, API isteği 4096 byte.
- Zaman sınırı: bir tarama için 30 saniye; DNS istekleri 5 saniye.
- Kota: Vercel yayınında Neon üzerinde atomik, dağıtık kota vardır: istemci başına dakikada 5, toplam dakikada 60 tarama ve 3 eşzamanlı izin (ayrıntılar docs/QUOTAS.md). Kota erişilemezse tarama 503 ile kapanır. Yerel ve Worker yolunda yalnız örnek içi sınır vardır. Cloudflare dışındaki yayınlarda cf-connecting-ip güvenilir proxy tarafından silinip yeniden yazılmalıdır.
- Her yönlendirme öncesi hedef doğrulanır. HTTP'ye düşüş ve farklı hostname engellenir.
- A/AAAA DNS cevapları herkese açık adreslerle sınırlandırılır.
- DNS rebinding: Vercel/Node yolunda kapalıdır (aşağıya bakın). Cloudflare Worker yolunda IP sabitleme olmadığı için açıktır; bu yüzden Worker'da güvenli transport yoksa tarama 503 ile reddedilir.
- SCAN_ALLOWED_HOSTS virgülle ayrılmış operatör kontrollü sabit hostname listesidir; keyfi kullanıcı hedefleri için güvenlik garantisi vermez.
- Sonuçlar ve kontrol listesi notları yerel depolamadadır. Ortak bilgisayarda hassas notlar tutulmamalıdır. Bulut projeleri ve raporları kullanıcı tarafından tek tek veya topluca silinebilir.

## Vercel/Node yolu

server/transport.js, DNS sonucunu socket lookup callback içinde doğrular ve aynı IPleri bağlantıya verir. TLS sertifika doğrulaması kapatılmamıştır. Bu yol yerel Node önizlemesinde ve Vercel Function içinde kullanılır. Socket aşamasında özel IPye rebinding ve karışık DNS yanıtları test edildi.

## JavaScript render (headless Chromium)

Ham HTML'de boş bir uygulama kabuğu görünen sayfalar (H1 veya iç bağlantı yok, framework bağlama noktası boş) server/render.js ile Chromium'da açılır.

Ağ sınırları:
- Chromium hedef siteye kendisi bağlanmaz. Her istek page.route ile yakalanır; yalnız aynı origin'e GET ile document/script/stylesheet/fetch/xhr istekleri, yukarıdaki doğrulanmış Node transport'u üzerinden yanıtlanır. Diğer her şey iptal edilir.
- Sınırlar: sayfa başına 30 istek, 4 MB toplam kaynak, oluşan HTML için 1,2 MB. Service worker, indirme ve WebSocket kapalıdır.
- page.route dışında kalabilecek trafik (preconnect, DNS prefetch, WebRTC, tarayıcı arka plan servisleri) için ikinci katman: tüm hostname'ler `MAP * ~NOTFOUND` ile çözümsüz bırakılır, proxy kapalı bir yerel porta yönlendirilir (`<-loopback>` dahil) ve WebRTC ham UDP kullanamaz.
  - Not: önceki `MAP * 0.0.0.0` kuralı Linux'ta yerel makineye bağlanır. Gerçek Chromium ile yapılan denemede eski bayraklarla 6 kaçış denemesinin 6'sı yerel bir test sunucusuna ulaştı; yeni bayraklarla hiçbiri ulaşmadı.
- Tarama başına tek tarayıcı açılır, sayfalar sırayla render edilir, tarama iptal edildiğinde veya 30 saniye dolduğunda aktif sayfa hemen kapatılır.

Açık risk — sandbox ve sırlar:
- @sparticuz/chromium sunucusuz ortamda `--no-sandbox` ile çalışır. Taranan sitenin JavaScript'i, DATABASE_URL, NEON_AUTH_COOKIE_SECRET ve kota HMAC anahtarının bulunduğu aynı Vercel fonksiyonunda çalışır. Chromium renderer açığı bu sırların ele geçirilmesine yol açabilir.
- Şu anki yayın Vercel Authentication arkasında kişisel denemedir; bu risk kabul edilebilir düzeydedir.
- Herkese açık yayından önce render, sır içermeyen ayrı bir servise/projeye taşınmalı veya `ROGI_RENDER=off` ile kapatılmalıdır. Kapalıyken JavaScript ile oluşan sayfalar puanlanmaz ve "doğrulanamadı" olarak raporlanır.

İlk yayın Vercel Authentication arkasındaki kişisel denemedir. Ticari üretim erişimi tamamlanmamıştır.
