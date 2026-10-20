# Bulut proje API'si

GET /api/projects: oturumdaki kullanıcının en fazla 20 projesi.
POST /api/projects: {name,url} ile yeni proje; başarı 201. URL henüz yayında olmayan proje için boş bırakılabilir. Dolu URL public HTTP(S) URL kontrolünden geçer; kaydetmek URL'ye ağ isteği yapmaz.
GET /api/projects/:uuid: kendi projesi 200, bulunamayan veya başka kullanıcının projesi 404.
PATCH /api/projects/:uuid: {name,url} ile kendi projesini günceller. Sahiplik değiştirilemez.
DELETE /api/projects/:uuid: kendi projesini ve (FK cascade ile) bütün raporlarını siler; 200 {deleted}, başka kullanıcının veya olmayan proje 404.
DELETE /api/projects: gövde tam olarak {"confirm":"delete-all"} olmalıdır; kullanıcının bütün projelerini ve raporlarını siler, 200 {deletedProjects}. Onay gövdesi yoksa 400.

Yazma istekleri aynı Origin ve application/json gerektirir, boyut sınırı 4096 byte. İsim 1–100 karakter; URL en fazla 2048 karakter. Başka alanlar reddedilir. Oturum yoksa 401; auth/veritabanı erişilemiyorsa güvenli 503 döner. Yanıtlar no-store. Oturum çerezi yenilenirse ayrı Set-Cookie başlıkları aktarılır.

Sahip kimliği istemciden alınmaz. Sunucu resmi Neon Auth SDK ile oturum okur ve bütün SELECT/UPDATE sorgularını owner_id ile sınırlar. INSERT sahibi oturumdan alır. rogi_private şeması browser Data API'ye açılmaz; veritabanı sahibi bağlantısı yalnız sunucudadır. Kullanıcı başına 20 proje kontrolü transaction advisory lock ile atomiktir.

Canlı doğrulama: iki ayrı QA hesabında oluşturma/kalıcılık, foreign read/PATCH 404, foreign list boş, anonim 401. Test bilgileri .env önekli yerel dosyalarda; GitHub'a gönderilmez. 63 yerel test geçti.

Silme işlemleri arayüzde onay penceresiyle yapılır ve geri alınamaz. Henüz hazır olmayanlar: silmeyi geri alma ve Neon Auth hesabının kendisinin silinmesi; hesap silinmeden önce "Tüm projeleri ve raporları sil" ile bulut verisi temizlenebilir. Projelerin kayıtlı olması bu işlerin tamamlandığı anlamına gelmez.
