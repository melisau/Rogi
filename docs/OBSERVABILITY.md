# Rogi servis ölçümleri

Node/Vercel adaptörü her tarama isteği sonucu için JSON log üretir:

```json
{"event":"rogi.audit","status":200,"outcome":"success","durationMs":950,"activeScans":1}
```

`outcome`: success, limited (429), cancelled (499), timeout (504), failure (diğer 5xx), rejected (diğer 4xx). `activeScans` yanıt hazırlanırken bu sunucu örneğinde çalışan tarama sayısıdır; küresel kullanıcı/kota sayısı değildir. İptalin görülmesi sunucunun Request.signal sinyalini iletmesine bağlıdır. Bağlantı kesilmesi iletilmezse 30 saniye sınırı uygulanır.

Vercel proje Logs ekranında `rogi.audit` arayın; süre ve sonuç koduyla yavaş tarama veya kapasite reddini inceleyin. Bu kayıtlar bir kalıcı analitik veritabanı veya alarm sistemi değildir. Vercel planının log saklama sınırları geçerlidir.

Özel metrik kaydı yalnız yukarıdaki beş alanı içerir. Site URL'si, IP, sorgu parametresi, notlar, rapor kanıtı, ham exception ve anahtarlar eklenmez. Hosting sağlayıcısının kendi erişim logları ayrı davranabilir. Ölçüm yazıcısındaki hata taramayı başarısız hale getirmez.

Doğrulama: metrics.test.mjs başarılı/limit sonuçlarını, alan izin listesini ve bozuk log sink toleransını; cancellation.test.mjs iptal kodunu ve kapasite serbest kalmasını sınar.
