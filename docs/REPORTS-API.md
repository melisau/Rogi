# Bulut raporları

POST /api/projects/:uuid/reports: JSON {url,locale} alır, sunucuda yeni tarama yapar ve gerçek sonucu projeye kaydeder. locale tr/en isteğe bağlıdır. İstemcinin score/checks/report alanları reddedilir. Sahiplik taramadan önce doğrulanır. Yöntem tekrar tarama yaptığı için normal tarama kotasına dahildir. Aynı origin ve JSON gerekir; istek 4096 byte sınırındadır. Oluşan rapor 256 KB'yi aşarsa kayıt 413 ile reddedilir.

GET /api/projects/:uuid/reports: son 20 raporun id,created_at,url,score özeti.
GET /api/projects/:uuid/reports/:reportUuid: payload dahil rapor.
DELETE /api/projects/:uuid/reports/:reportUuid: kendi raporunu siler; aynı Origin gerekir, başka kullanıcının raporu 404.

Sahiplik bütün sorgularda hem proje hem rapor üzerinden doğrulanır. Başka kullanıcıya ait kimliklerde 404; oturumsuz istekte 401. Yanıtlar no-store. Tarama başarısızsa sonuç kayıt edilmez; özgün HTTP hata ve Retry-After korunur. API sırları veya oturum tokenları rapor payload'una eklenmez.

Her projede son 20 rapor tutulur. Kaydetme ve eski rapor temizliği proje advisory lock ile aynı transaction'dadır. Silinen proje raporları FK cascade ile temizlenir; hesap silme sonrası veri temizliği henüz uygulanmadı. Tarayıcıdaki önceki raporlar otomatik yüklenmez. Bu API istemciden gönderilen eski raporu gerçek sunucu raporu gibi saklamaz.

Canlı doğrulama: A hesabında example.com taraması 13 kontrol ile kaydedildi (201), aynı rapor geri okundu (200), payload deep equality geçti. B hesabında tekil ve liste 404. scripts/verify-reports.mjs build sırasında izole QA projesinde retention ve owner filtresini gerçek DB ile sınar; QA projesi sonunda silinir.

Rapor görüntüleme ve kaydetme arayüzü henüz tamamlanmadı.

## Arayüz

Proje kartında Raporlar bölümünü açıp kayıtlı raporu seçin; /app?project=...&report=... adresi bulguları yükler. Proje bağlamında Tarayıp projeye kaydet yeni sunucu taraması oluşturur. Normal Analizi başlat yerel akıştır. Önceki yerel raporlar ve kontrol listesi notları buluta yüklenmez. İstek iptalinde Vercel disconnect sinyali iletilmezse sunucu kaydı tamamlayabilir; arayüz listeyi kontrol etmeyi bildirir.
