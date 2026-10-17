# Rogi ücretsiz deneme kotaları

Yayın taramaları Neon Postgres üzerinden bütün sunucu örneklerinin paylaştığı izin sistemini kullanır. İstemci başına dakikada 5, uygulama toplamında dakikada 60 istek ve 3 eşzamanlı tarama izni vardır. Dakika pencereleri veritabanı saatine göre sabittir. Kimliği Vercel edge tarafından yazılan IP'nin purpose-specific HMAC değerinden türetilir; ham IP veya taranan URL bu tablolara yazılmaz. Paylaşılan IP kullananlar aynı istemci kotasını paylaşır; bu henüz hesap bazlı abonelik kotası değildir.

claim_scan veritabanı transaction advisory lock ile sayaç ve izinleri atomik tutar. Bırakılan izin hemen silinir; kapanan sunucudan kalan izin 60 saniye sonra sonraki talepte temizlenir. Motor 30 saniye ile sınırlıdır. Eski dakika pencereleri yeni taleplerde temizlenir. Kota DB erişimi başarısızsa yayın API'si 503 döner. Lokal DATABASE_URL yoksa örnek içi sınırlarla test edilir.

migrations/001-scan-quota.sql build sırasında yalnız VERCEL=1 ortamında uygulanır. Migration transaction içinde kilitlidir; mevcut kullanıcı veya rapor tablolarına dokunmaz. scripts/verify-quota.mjs gerçek DB'de izole rastgele QA scope ile eşzamanlı talep, izin bırakma ve rate eşiklerini kontrol eder; kendi QA satırlarını sonunda temizler. Bu adım başarısızsa build tamamlanmaz.

59 yerel test API'de kota reddini, Retry-After, hata sonrası release ve quota unavailable durumunda taramanın çalışmadığını doğrular. Gerçek PostgreSQL build doğrulaması ayrıca gereklidir.
