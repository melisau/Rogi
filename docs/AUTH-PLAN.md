# Rogi hesap ve bulut kayıtları

15 Ekim 2026 kararı: Clerk kullanılmayacak. Kimlik doğrulama Rogi'nin Node sunucusunda Better Auth ile, kalıcı kayıtlar Neon Postgres ile sağlanacak. Ücretsiz kişisel deneme kapsamı korunacak.

## Uygulama sırası

1. Kullanıcı Neon Marketplace koşullarını kabul eder; yalnız Free plan kurulur ve Rogi projesine bağlanır.
2. Bağlantı bilgileri yalnız sunucu ortamında tutulur; Better Auth secret güvenli üretilir. Gizli bilgiler GitHub'a veya tarayıcıya konmaz.
3. Better Auth resmi şeması/migrasyonu uygulanır; `/api/auth/*` handler ve vanilla istemci eklenir. Güvenilir origin production ve yerel geliştirme ile sınırlanır.
4. Kayıt/giriş/çıkış ve oturum sonlanması TR/EN arayüzde doğrulanır. E-posta doğrulama ve şifre sıfırlama için gerçek gönderici kurulmadan bu akışlar tamamlanmış sayılmaz.
5. Proje ve rapor tabloları kullanıcı kimliğiyle ilişkilendirilir. Her sunucu sorgusu doğrulanmış oturum kimliğiyle filtrelenir; istemciden gelen kullanıcı kimliğine güvenilmez.
6. Kullanıcı A/B erişim izolasyonu, oturumsuz 401, farklı origin reddi ve veri kalıcılığı gerçek veritabanıyla sınanır.
7. Yerel eski raporlar kullanıcı onayı olmadan otomatik buluta taşınmaz. Ücretsiz deneme ve mevcut yerel çalışma akışı korunur.

## Mevcut durum

Vercel CLI kaynak listesi: bağlı kaynak yok. Neon şart kabulü bekleniyor. Better Auth henüz uygulamaya eklenmedi. Kalıcı kota ve arka plan işlerinin veritabanına bağımlı kısmı tamamlanmadı.

## Kaynaklar

- https://better-auth.com/docs/installation — PostgreSQL, standart Request/Response ve vanilla istemci
- https://neon.com/docs/introduction/plans — Free plan ve kullanım sınırları

## Doğrulanan yeni durum

Kullanıcı rogi-data Neon kaynağını bağladı. CLI Available/proje bağlantısını, canlı /api/health gerçek SELECT 1 ile HTTP 200 database:connected sonucunu doğruladı. Production sırları yerel indirmeye kapalı; bu koruma değiştirilmeyecek. Mevcut kaynak NEON_AUTH_BASE_URL içeriyor; yeni self-hosted auth şeması oluşturmadan önce bu yönetilen Better Auth hizmeti incelenecek. Hesap oturumu ve kullanıcı veri izolasyonu henüz uygulanmadı.

## Sunucu köprüsü

Yönetilen Neon Auth seçildi; ayrı self-hosted Better Auth şeması oluşturulmadı. Resmi framework-agnostic SDK kullanılıyor ve sürüm 0.6.0-beta sabit. Yalnız giriş/kayıt/çıkış/oturum yolları açık. Çerezler SDK tarafından işlenir; önizleme adaptörü çoklu Set-Cookie başlıklarını ayrı korur. Production/Preview cookie sırları ayrıdır. Canlı get-session 200/null başarılı. UI, gerçek kayıt, e-posta doğrulama ve kullanıcılar arası veri izolasyonu testleri hâlâ yapılacak.

## Canlı kayıt kontrolü

QA kayıt isteği HTTP 403 ve INVALID_ORIGIN verdi. Kullanıcı Neon Console → Auth/Better Auth → Configuration → Domains altında tam https://rogi-audit.vercel.app origin'ini eklemeli (sonunda slash yok). Doküman: https://neon.com/docs/auth/guides/configure-domains. Ayar sonrası aynı kayıt/giriş/oturum/çıkış akışı tekrar test edilecek. Oturum GET 200/null sonucu başarılı kayıt kanıtı değildir.
