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
