# Rogi görev listesi

Son güncelleme: 15 Ekim 2026. [x] kanıtla doğrulanan iş, [ ] kalan iş.
Kod: codex/rogi-backlog; inceleme: https://github.com/melisau/Rogi/pull/1.
Kişisel/ticari olmayan Hobby yayını: https://rogi-audit.vercel.app (Vercel Authentication korumalı).
Eski adım kayıtları: docs/IMPLEMENTATION-LOG.md. Bu dosya güncel durumun özetidir.

## P0 — Yayın ve güvenlik
- [x] API yöntem, JSON, boyut, origin ve URL doğrulaması; güvenli hatalar.
- [x] Özel/rezerve adres ve port engeli; yönlendirme doğrulaması.
- [x] Node socket lookup sırasında public IP seçimi; DNS rebinding engeli.
- [x] Güvenli transport bulunmayan Worker API yolu 503 ile kapalı.
- [x] 1.2 MB yanıt, 4096 byte istek ve 30 saniye tarama sınırı.
- [x] parse5 HTML ayrıştırma; X-Robots-Tag ve JSON-LD kontrolleri.
- [x] Geçti/hata/doğrulanamadı/uygulanamaz ayrımı ve doğru puan paydası.
- [x] Örnek içi 5/dakika ve 3 eşzamanlı tarama ek koruması.
- [x] Neon atomik kalıcı kota: istemci 5/dakika, toplam 60/dakika, 3 eşzamanlı izin. Ham IP yerine HMAC; izin 60 saniyede sona erer.
- [x] Kota erişilemiyorsa yayın taraması 503 ile kapalı.
- [x] GitHub Actions test/build; son yayınlanan UI kontrolleri başarılı.
- [x] Gerçek veritabanında build sırasında kota ve rapor saklama/izolasyon kontrolü.
- [x] Ücretsiz kişisel Vercel Hobby yayını ve gerçek site taraması doğrulandı.

## P1 — Ana ürün
- [x] Öncelik, durum ve tahmini efor sırası.
- [x] Kanıt, düzeltme önerisi ve yeniden doğrulama.
- [x] Site bazlı yerel kontrol listesi durum ve notları.
- [x] Son 10 yerel rapor; yeni/çözülen/değişen/değişmeyen/kaldırılan karşılaştırması.
- [x] TR/EN landing, uygulama, API sonuçları, hesap ve proje ekranı.
- [x] Proje dosyası incelemesi; atlanan dosyaların isim/neden/kapsam bildirimi.
- [x] Next metadata/rota ve JSX title/description/canonical/H1 AST incelemesi; kaynak çalıştırılmaz.
- [x] JSON/CSV dışa aktarma; CSV formül başlangıcı koruması.
- [x] Yerel tarama iptali ve yeniden başlatma; Node disconnect sinyali testi.
- [x] Projeden tarama alanına geçiş, sunucuda yeni tarama ile buluta kaydetme, proje rapor listesi ve rapor açma.
- [ ] Tüm hesap→proje→tarama→rapor akışının tek gerçek tarayıcı oturumunda son kabul testi. UI QA fixtureları ve gerçek API testleri ayrı geçti.

## P2 — Hesap ve kalıcı veri
- [x] Neon rogi-data bağlı; canlı SELECT 1 ve sağlık kontrolü başarılı.
- [x] Yönetilen Neon Better Auth: kayıt, oturum, çıkış ve yeniden giriş gerçek QA hesabıyla API'de doğrulandı.
- [x] Kullanıcı projeleri ve proje başına son 20 sunucu raporu.
- [x] Kullanıcı erişim kontrolü: iki gerçek hesapta proje okuma/değiştirme ve rapor okuma/listeleme izolasyonu; anonim istek 401.
- [x] 20 proje ve 20 rapor sınırları transaction kilitleriyle korunur.
- [x] TR/EN proje oluşturma/düzenleme ve bulut rapor UI QA.
- [ ] E-posta doğrulama ve şifre sıfırlama akışları.
- [ ] Proje silme/geri alma ve hesap silmede ilişkili verilerin temizlenmesi.
- [ ] Kalıcı arka plan taraması, ilerleme, iptal ve yeniden deneme. Mevcut tarama istek süresince çalışır; kuyruk değildir.
- [x] İçerik/IP/URL kaydetmeyen yapılandırılmış tarama süre/sonuç logları.
- [ ] Kalıcı ölçüm geçmişi, eşik alarmları ve kullanım paneli.
- [ ] Ücretli ürün/plan/ödeme kararı. Kullanıcı şu an ücretsiz kişisel deneme seçti; ücretli hizmet açılmayacak.

## P3 — Kalite ve tarama kapsamı
- [ ] Kontrollü çok sayfalı tarama.
- [x] İsteğe bağlı bozuk iç bağlantı kontrolü ve URL/HTTP/durum kanıt listesi. İlk 20 adaydan en fazla 10 aynı-origin bağlantı; iki eşzamanlı istek. IANA üzerinde yerel tarayıcı ve canlı API aynı sonucu verdi: 8 geçti, 2 doğrulanamadı; HTTP 200.
- [ ] PageSpeed/Core Web Vitals ölçümü.
- [ ] Kapsamlı erişilebilirlik ve gerçek ekran okuyucu doğrulaması. Skip link, odak, seçili durum ve temel klavye akışları geçti.
- [x] Masaüstü ve 390px mobil rapor/proje ekranı QA; son mobil dil düğmesi sıkışması düzeltildi.
- [x] /tr, /en SSR; canonical, hreflang, sosyal metaveri, WebSite JSON-LD ve sitemap.
- [x] Eski seo-kontrol giriş noktası ortak motora bağlı; iki build doğrulandı.
- [ ] Yerel Git eşitleme: asıl Windows klasörüne yazma hâlâ başarısız. İzole çalışma kopyası test edilip GitHub'a kaydediliyor.

## Kanıt ve sınırlar
- Son tam UI yayını: 68 test + build ve gerçek Postgres kontrolleri geçti. Bağlantı motoru ve UI ile 71 test geçti; canlı API ve yerel gerçek tarayıcı kontrolü tamamlandı.
- QA gerçek hesap bilgileri .env önekli yerel dosyalarda; GitHub'a veya yayına gönderilmez.
- UI oluştur/düzenle/kaydet/listele/aç ve TR/EN akışları QA fixturelarıyla; API kalıcılık/izolasyonu gerçek Neon ile ayrı doğrulandı.
- Normal tarama ve kontrol listesi notları yereldir. Yalnız açık bulut eylemi sunucu raporu kaydeder.
- Vercel disconnect iletmezse iptal edilen bulut isteği kaydı tamamlayabilir; arayüz listeyi kontrol etmeyi bildirir.
- Güvenlik ve mobil kontrol listeleri otomatik güvenlik sertifikası değildir.
- Clerk kullanıcı kararıyla çıkarıldı. Neon kurulumu ve production domain izni tamamlandı; eski koşul kabulü talepleri artık beklemiyor.

- Bağlantı QA: İngilizce HTTP sonucu açıklaması düzeltildi; rapor geçmişinden geri açma ve dil metinleri doğrulandı, konsol hatası yok. Dış siteye yönlenen/erişilemeyen URL'ler bozuk olarak işaretlenmedi. HEAD'de 404/410, 405 veya 501 varsa GET doğrulaması yapılır.
