# Rogi görev listesi

Son güncelleme: 15 Ekim 2026. [x] doğrulanmış tamamlanan iş, [ ] kalan iş.
Geliştirme dalı: codex/rogi-backlog. Yerel çalışma klasörü Windows tarafından yazmaya kapalı; kod geçici çalışma kopyasında test edilip GitHub'a kaydediliyor.

## P0 — Yayın öncesi
- [x] API yöntem/JSON/girdi/doğrudan origin kontrolleri; güvenli hata mesajları.
- [x] Worker örneği içinde dakika başına 5 istek ve 3 eşzamanlı tarama sınırı.
- [ ] Dağıtık ve kalıcı kullanım sınırları (mevcut sınırlar Worker örneğine özeldir).
- [x] URL, port, kimlik bilgisi, özel/rezerve DNS adresi ve yönlendirme denetimleri.
- [x] Vercel/Node için socket DNS lookup sırasında doğrulanmış IP seçimi; özel/rezerve IP'ye rebinding engellenir.
- [ ] Cloudflare Worker yolunda aynı bağlantı garantisi; DoH kontrolü tek başına yeterli değildir. Şimdilik üretim yolu Vercel/Node olarak seçildi.
- [x] İndirme sırasında byte sınırı, istek boyutu ve tarama zaman sınırı.
- [x] parse5 ile HTML ayrıştırma; dekoratif alt, JSON-LD, X-Robots-Tag doğruluğu.
- [x] Geçti / hata / doğrulanamadı / uygulanamaz ayrımı; puan paydasının düzeltilmesi.
- [x] 30 motor/API/Node transport/UI helper/i18n testi; izole kopyada npm test ve bundle build geçti.
- [x] GitHub Actions test/build yapılandırması.
- [x] GitHub Actions'ın uzak çalışmasının doğrulanması (push ve PR, ikisi de başarılı).
- [x] Kişisel ve ticari olmayan Vercel Hobby yayını: https://rogi-audit.vercel.app (Vercel Authentication korumalı).
- [x] Yayında /app ve gerçek example.com taraması HTTP 200 ile doğrulandı.

## P1 — Ana ürün
- [x] Bulguların durum ve önceliğe göre sıralanması; önceliğin gösterilmesi.
- [x] Başarısız bulguda kanıt, önerilen düzeltme ve yeniden doğrulama.
- [ ] Kontrole özgü efor değerleri ve efora göre sıralama (şimdilik varsayılan düşük).
- [x] Kontrol listelerinde durum, not/kanıt ve site bazlı tarayıcı kaydı.
- [x] Son 10 raporun yerel geçmişi ve önceki taramaya göre değişen durum sayısı.
- [x] Ayrıntılı yeni/çözülen/değişen/değişmeyen/kaldırılan bulgu karşılaştırması; bilinmeyen sonuçlar çözülmüş sayılmaz.
- [x] Uygulama, raporlar, kontrol listeleri, dışa aktarma ve API hata/sonuçlarında TR/EN desteği.
- [x] Proje incelemesinde okunmayan dosya sayısının bildirilmesi.
- [x] Atlanan dosyaların isim ve neden bazında listelenmesi; klasör, tür, boyut ve adet sınırı.
- [ ] Framework metadata ve route desteği.
- [x] JSON/CSV rapor dışa aktarma; CSV formül başlangıçlarının etkisizleştirilmesi.
- [x] JSON ve CSV indirme tarayıcıda doğrulandı.

## P2 — SaaS
- [ ] Kullanıcı hesabı ve oturum.
- [ ] Veritabanı ve kullanıcıya ait projeler.
- [ ] Kullanıcı bazlı erişim kontrolü.
- [ ] Arka plan tarama, ilerleme, iptal ve yeniden deneme.
- [ ] Hata ve servis kullanım ölçümleri.
- [ ] Ücretli plan, kota ve ödeme (ürün kararı gerekiyor).

## P3 — Kalite
- [ ] Kontrollü çok sayfalı tarama.
- [ ] PageSpeed/Core Web Vitals ve bozuk bağlantılar.
- [ ] Kapsamlı klavye ve erişilebilirlik doğrulaması.
- [x] 1440px masaüstü ve 390px mobil rapor ekranı; yatay sayfa taşması yok.
- [ ] Landing canonical, sosyal metaveri ve dil URL'leri.
- [ ] Eski seo-kontrol kopyasını ortak motorla birleştirme.
- [ ] Yerel Git geçmişini GitHub ile eşitleme (Windows dosya yazma engeli).

## Doğrulama kaydı
- Motor/API/transport: 30 test geçti, build başarılı; npm audit 0 bilinen açık.
- In-app browser: gerçek example.com taraması, rapor geçmişi, filtreler ve yenileme sonrası kontrol listesi durum/not kalıcılığı doğrulandı.
- İlk tarayıcı kontrolde konsolda uygulama hatası/uyarısı yok.
- Sahte tarama puanı kullanılmadı; test hedefinden gerçek API sonucu alındı.
- Güvenlik ve mobil listeleri kullanıcı doğrulamasıdır; otomatik güvenlik onayı değildir.
- Kayıtlar bu tarayıcıya aittir; bulut, ekip paylaşımı ve hesaplar henüz yok.

## Karar / erişim gerektiren işler
- Canlı hosting ve alan adı: dağıtık limit ve güvenli egress uygulaması için mevcut sağlayıcı bilgisi gerekecek.
- Hesap ve veritabanı kurulumu: sağlayıcı ve hesap erişimi gerekecek.
- Faturalandırma: ücretsiz/ücretli ürün kararı, planlar ve ödeme hesabı gerekecek.
- Kullanıcıdan bilgi gerekince bu sohbet içinde soru/bildirim gönderilecek; e-posta/mesaj gönderimi kurulmadı.

## Hosting kararı
- Kullanıcı ücretsiz, kişisel ve ticari olmayan deneme yayınını seçti.
- Mevcut Vercel hesabının Hobby planı CLI API ile doğrulandı; ücretli hizmet açılmadı.
- Proje: rogi-audit, team: melisaus-projects. İlk yayın Vercel tarafından production olarak atandı; Authentication koruması açık.
- MCP proje oluşturma 403 döndü; aynı hesap/ekipte CLI fallback başarılı oldu.

- 15 Ekim devam doğrulaması: gerçek yeniden taramada 13 değişmeyen kontrol gösterildi. Dört dosyalı proje fixtureında bir dosya okundu; üç atlama nedeni (boyut, tür, klasör) tarayıcıda doğrulandı. Konsolda uygulama hatası yok.

- TR/EN QA: kayıtlı raporlar, karşılaştırma, proje incelemesi, güvenlik listesi ve API sonuçları iki dilde doğrulandı. Dil değişiminde notlar ve orijinal site içeriği korundu. 390px mobil ve masaüstünde yatay taşma veya konsol hatası yok.
