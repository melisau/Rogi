// Static legal, bot-info and 404 pages (TR/EN). Draft text: have it reviewed by a lawyer before relying on it.
export const CONTACT='budgetbuddy.main.info@gmail.com';
const UPDATED={tr:'8 Kasım 2026',en:'8 November 2026'};
const mail='<a href="mailto:'+CONTACT+'">'+CONTACT+'</a>';

const pages={
 privacy:{
  tr:{path:'/gizlilik',title:'Aydınlatma Metni ve Gizlilik Politikası',body:`
<p>Bu metin, 6698 sayılı Kişisel Verilerin Korunması Kanunu (KVKK) madde 10 uyarınca Rogi'yi kullananları bilgilendirmek için hazırlanmıştır.</p>
<h2>1. Veri sorumlusu</h2>
<p>Rogi, Melisa Uyar tarafından ücretsiz ve kişisel bir araç olarak işletilir. İletişim: ${mail}.</p>
<h2>2. Hangi verileri işliyoruz?</h2>
<ul>
<li><strong>Hesap açarsanız:</strong> ad (isteğe bağlı), e-posta adresi ve şifreniz. Şifre bizim tarafımızda okunamaz; kimlik doğrulama hizmeti tarafından özetlenmiş (hash) olarak saklanır.</li>
<li><strong>Oturum çerezi:</strong> giriş yaptığınızı hatırlamak için zorunlu bir çerez. Reklam veya izleme çerezi kullanılmaz.</li>
<li><strong>Bulut projeleri ve raporlar:</strong> kaydettiğiniz proje adları, taranan adresler ve tarama sonuçları (proje başına son 20 rapor).</li>
<li><strong>Kötüye kullanım koruması:</strong> tarama kotası için IP adresinizden türetilen tek yönlü bir değer, kısa süreliğine. Ham IP adresi ve taranan adres bu amaçla saklanmaz.</li>
<li><strong>Sunucu kayıtları:</strong> barındırma sağlayıcısı istek kayıtlarını (IP, zaman, adres) kısa süre tutar.</li>
</ul>
<p>Hesapsız kullanımda raporlar yalnız kendi tarayıcınızda saklanır, bize gönderilmez. Yerel proje incelemesinde dosyalarınız tarayıcıda işlenir ve sunucuya yüklenmez.</p>
<h2>3. Amaç ve hukuki sebep</h2>
<ul>
<li>Hesabın oluşturulması ve hizmetin sunulması: sözleşmenin kurulması ve ifası (KVKK m.5/2-c).</li>
<li>Güvenlik, kota ve kötüye kullanımın önlenmesi: meşru menfaat (KVKK m.5/2-f).</li>
<li>Hukuki yükümlülükler ve olası uyuşmazlıklar: m.5/2-ç ve m.5/2-e.</li>
</ul>
<h2>4. Aktarım ve yurt dışı</h2>
<p>Veriler, hizmeti çalıştıran şu sağlayıcıların ABD'deki sunucularında işlenir: <strong>Vercel Inc.</strong> (barındırma) ve <strong>Neon</strong> (veritabanı ve kimlik doğrulama). Bu aktarım KVKK madde 9 kapsamında, hizmetin sunulması için gereklidir. Verileriniz satılmaz, reklam amacıyla paylaşılmaz.</p>
<h2>5. Saklama süresi</h2>
<p>Hesap ve bulut verileri, siz silene veya hesabınızın silinmesini isteyene kadar saklanır. Raporları ve projeleri istediğiniz zaman uygulama içinden silebilirsiniz. Hesabınızın tamamen silinmesi için ${mail} adresine hesabınızdaki e-postadan yazmanız yeterlidir; talep en geç 30 gün içinde yerine getirilir.</p>
<h2>6. Haklarınız (KVKK m.11)</h2>
<p>Verilerinizin işlenip işlenmediğini öğrenme, bilgi isteme, düzeltilmesini veya silinmesini isteme, aktarıldığı üçüncü kişileri öğrenme, itiraz etme ve zararın giderilmesini talep etme haklarına sahipsiniz. Başvurularınızı ${mail} adresine iletebilirsiniz. Ayrıca Kişisel Verileri Koruma Kurulu'na şikâyet hakkınız vardır.</p>`},
  en:{path:'/privacy',title:'Privacy Notice',body:`
<p>This notice explains how Rogi processes personal data, including under Turkish Personal Data Protection Law No. 6698 (KVKK).</p>
<h2>1. Who is responsible</h2>
<p>Rogi is operated by Melisa Uyar as a free, personal tool. Contact: ${mail}.</p>
<h2>2. What we process</h2>
<ul>
<li><strong>If you create an account:</strong> name (optional), email address and password. The password is stored hashed by the authentication service and cannot be read by us.</li>
<li><strong>Session cookie:</strong> a strictly necessary cookie that keeps you signed in. No advertising or tracking cookies.</li>
<li><strong>Cloud projects and reports:</strong> project names you save, scanned URLs and scan results (the last 20 reports per project).</li>
<li><strong>Abuse protection:</strong> a one-way value derived from your IP address, kept briefly for the scan quota. The raw IP and the scanned URL are not stored for this purpose.</li>
<li><strong>Server logs:</strong> the hosting provider keeps request logs (IP, time, path) for a short time.</li>
</ul>
<p>Without an account, reports stay in your own browser and are not sent to us. Local project reviews run in your browser; your files are not uploaded.</p>
<h2>3. Purposes and legal bases</h2>
<ul>
<li>Creating your account and providing the service: performance of a contract.</li>
<li>Security, quotas and abuse prevention: legitimate interest.</li>
<li>Legal obligations and the defence of legal claims.</li>
</ul>
<h2>4. Processors and international transfer</h2>
<p>Data is processed on servers in the United States by <strong>Vercel Inc.</strong> (hosting) and <strong>Neon</strong> (database and authentication). This is necessary to provide the service. Your data is not sold or shared for advertising.</p>
<h2>5. Retention</h2>
<p>Account and cloud data are kept until you delete them or ask for your account to be deleted. You can delete reports and projects in the app at any time. To delete your account completely, email ${mail} from the address on your account; we will act within 30 days.</p>
<h2>6. Your rights</h2>
<p>You can ask whether your data is processed, request access, correction or deletion, learn who it was shared with, object, and seek compensation. Write to ${mail}. You may also complain to the Turkish Personal Data Protection Authority or your local data protection authority.</p>`}
 },
 terms:{
  tr:{path:'/kosullar',title:'Kullanım Koşulları',body:`
<h2>1. Hizmet</h2>
<p>Rogi, web siteleri ve geliştirme projeleri için SEO, güvenlik ve kullanılabilirlik ipuçları veren ücretsiz bir denetim aracıdır. Hizmet "olduğu gibi" sunulur; kesintisiz olacağı, hatasız olacağı veya bulguların eksiksiz olacağı garanti edilmez.</p>
<h2>2. İzin verilen kullanım</h2>
<ul>
<li>Yalnız <strong>sahibi olduğunuz veya taramak için izniniz olan</strong> siteleri tarayın.</li>
<li>Rogi'yi başka sistemlere yük bindirmek, erişim kısıtlamalarını aşmak, güvenlik açığı aramak veya kötü amaçla bilgi toplamak için kullanmayın.</li>
<li>Kotaları otomatik araçlarla veya çok sayıda adresle aşmaya çalışmayın.</li>
</ul>
<p>Bu kurallara uyulmazsa erişim önceden haber verilmeden kısıtlanabilir.</p>
<h2>3. Sorumluluğun sınırı</h2>
<p>Bulgular bilgi amaçlıdır; hukuki, güvenlik veya profesyonel danışmanlık yerine geçmez. Bulgulara dayanarak yaptığınız değişikliklerden ve hizmetin kullanılamamasından doğan zararlardan, yürürlükteki hukukun izin verdiği ölçüde sorumluluk kabul edilmez.</p>
<h2>4. Hesap</h2>
<p>Hesabınızın güvenliğinden siz sorumlusunuz. Verilerinizin nasıl işlendiği <a href="/gizlilik">Aydınlatma Metni</a>'nde anlatılır.</p>
<h2>5. Kötüye kullanım bildirimi</h2>
<p>Rogi'nin sitenize izinsiz istek gönderdiğini düşünüyorsanız ${mail} adresine yazın. Tarayıcı hakkında bilgi: <a href="/bot">/bot</a>.</p>
<h2>6. Değişiklikler</h2>
<p>Bu koşullar güncellenebilir; güncel sürüm her zaman bu sayfadadır. Uyuşmazlıklarda Türkiye Cumhuriyeti hukuku uygulanır.</p>`},
  en:{path:'/terms',title:'Terms of Use',body:`
<h2>1. The service</h2>
<p>Rogi is a free audit tool that gives SEO, security and usability hints for websites and development projects. It is provided "as is", without any guarantee of availability, accuracy or completeness.</p>
<h2>2. Acceptable use</h2>
<ul>
<li>Only scan sites <strong>you own or are authorised to scan</strong>.</li>
<li>Do not use Rogi to load other systems, bypass access restrictions, probe for vulnerabilities or collect information for harmful purposes.</li>
<li>Do not try to get around quotas with automation or many addresses.</li>
</ul>
<p>Access may be restricted without notice if these rules are broken.</p>
<h2>3. Limitation of liability</h2>
<p>Findings are informational and are not legal, security or professional advice. To the extent permitted by law, no liability is accepted for changes you make based on findings or for the service being unavailable.</p>
<h2>4. Accounts</h2>
<p>You are responsible for keeping your account secure. How your data is handled is described in the <a href="/privacy">Privacy Notice</a>.</p>
<h2>5. Reporting abuse</h2>
<p>If you believe Rogi sent unwanted requests to your site, email ${mail}. About the crawler: <a href="/bot">/bot</a>.</p>
<h2>6. Changes</h2>
<p>These terms may change; the current version is always on this page. Turkish law applies to disputes.</p>`}
 },
 bot:{
  tr:{path:'/bot',title:'RogiAudit tarayıcısı',body:`
<p>Sunucu kayıtlarınızda <code>RogiAudit/1.0</code> görüyorsanız istek Rogi'den gelmiştir.</p>
<h2>Ne yapar?</h2>
<ul>
<li>Yalnız bir kullanıcı Rogi'de sizin adresinizi taramayı başlattığında çalışır; siteleri kendi kendine dolaşmaz ve dizine eklemez.</li>
<li>Bir taramada ana sayfa, <code>robots.txt</code>, <code>sitemap.xml</code>, en fazla 10 iç bağlantının durum kontrolü ve en fazla 3 bağlı sayfa istenir.</li>
<li>Yalnız herkese açık adreslere bağlanır; form göndermez, giriş yapmaz.</li>
</ul>
<h2>Engellemek veya bildirmek</h2>
<p>User-Agent'ı <code>RogiAudit</code> olan istekleri sunucunuzda engelleyebilirsiniz. İzinsiz kullanım bildirimi için: ${mail}.</p>`},
  en:{path:'/bot',title:'The RogiAudit crawler',body:`
<p>If you see <code>RogiAudit/1.0</code> in your server logs, the request came from Rogi.</p>
<h2>What it does</h2>
<ul>
<li>It runs only when a user starts a scan of your address in Rogi. It does not crawl the web on its own and does not index sites.</li>
<li>One scan requests the home page, <code>robots.txt</code>, <code>sitemap.xml</code>, a status check of up to 10 internal links, and up to 3 linked pages.</li>
<li>It only connects to public addresses, never submits forms and never signs in.</li>
</ul>
<h2>Blocking or reporting</h2>
<p>You can block requests whose User-Agent contains <code>RogiAudit</code>. To report misuse: ${mail}.</p>`}
 }
};

const style=`:root{color-scheme:dark;--bg:#111318;--lime:#c5f467;--text:#f5f7fa;--muted:#b5c0d0;--line:#303743}*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--text);font:16px/1.65 Inter,Arial,sans-serif}a{color:var(--lime)}main{max-width:760px;margin:0 auto;padding:32px 16px 64px}header,footer{max-width:760px;margin:0 auto;padding:20px 16px;display:flex;justify-content:space-between;gap:16px;flex-wrap:wrap;align-items:center}header a.brand{font-weight:800;font-size:22px;color:var(--text);text-decoration:none}nav a,footer a{color:var(--muted);margin-left:14px;font-size:14px}footer{border-top:1px solid var(--line);color:var(--muted);font-size:14px}h1{font-size:clamp(28px,6vw,40px);line-height:1.15;margin:8px 0 4px}h2{font-size:20px;margin:32px 0 8px}.meta{color:var(--muted);font-size:14px}code{background:#1d2129;padding:1px 6px;border-radius:4px}li{margin:6px 0}.note{border:1px solid var(--line);border-radius:8px;padding:12px 14px;color:var(--muted);font-size:14px}:focus-visible{outline:3px solid #d9ff70;outline-offset:3px}`;
const esc=v=>String(v).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

export function legalFooter(lang){
 const tr=lang!=='en';
 return '<a href="'+(tr?'/gizlilik':'/privacy')+'">'+(tr?'Gizlilik ve KVKK':'Privacy')+'</a><a href="'+(tr?'/kosullar':'/terms')+'">'+(tr?'Kullanım koşulları':'Terms')+'</a><a href="/bot">'+(tr?'Tarayıcı bilgisi':'Crawler')+'</a>';
}

function shell(lang,title,content,{alternate,origin,canonical}={}){
 const tr=lang!=='en';
 const head='<link rel="icon" href="/favicon.svg" type="image/svg+xml">'+(canonical?'<link rel="canonical" href="'+esc(origin+canonical)+'">':'')+(alternate?'<link rel="alternate" hreflang="tr" href="'+esc(origin+alternate.tr)+'"><link rel="alternate" hreflang="en" href="'+esc(origin+alternate.en)+'">':'');
 return '<!doctype html><html lang="'+(tr?'tr':'en')+'"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'+esc(title)+' — Rogi</title>'+head+'<style>'+style+'</style></head><body><header><a class="brand" href="/'+(tr?'tr':'en')+'">rogi</a><nav aria-label="'+(tr?'Ana menü':'Main navigation')+'"><a href="/app">'+(tr?'Analizi başlat':'Start audit')+'</a></nav></header><main id="main-content">'+content+'</main><footer><span>Rogi</span><span>'+legalFooter(lang)+'</span></footer></body></html>';
}

// Returns {html,status} for a legal/bot path, or null.
export function legalPage(pathname,origin){
 for(const page of Object.values(pages))for(const lang of ['tr','en']){
  const p=page[lang];if(p.path!==pathname)continue;
  // /bot is one path for both languages: pick by ?lang=en.
  const alternate=page.tr.path!==page.en.path?{tr:page.tr.path,en:page.en.path}:null;
  const other=lang==='tr'?page.en:page.tr;
  const switcher=alternate?'<p class="meta"><a href="'+other.path+'" hreflang="'+(lang==='tr'?'en':'tr')+'">'+(lang==='tr'?'English':'Türkçe')+'</a></p>':'';
  const draft='<p class="note">'+(lang==='tr'?'Son güncelleme: ':'Last updated: ')+UPDATED[lang]+'</p>';
  const body=alternate?p.body:pages.bot.tr.body+'<hr style="border-color:#303743;margin:40px 0" lang="en"><div lang="en"><h1 style="font-size:28px">'+pages.bot.en.title+'</h1>'+pages.bot.en.body+'</div>';
  return {status:200,html:shell(lang,p.title,'<h1>'+esc(p.title)+'</h1>'+switcher+draft+body,{alternate,origin,canonical:p.path})};
 }
 return null;
}

export function notFoundPage(pathname){
 const lang=/^\/(en|privacy|terms)(\/|$)/.test(pathname)?'en':'tr';
 const content='<h1>404</h1><p><strong>Bu sayfa bulunamadı.</strong> Adres yanlış yazılmış ya da sayfa kaldırılmış olabilir.</p><p><a href="/tr">Ana sayfaya dön</a> · <a href="/app">Analizi başlat</a></p><hr style="border-color:#303743;margin:32px 0"><div lang="en"><p><strong>This page could not be found.</strong> The address may be mistyped or the page may have been removed.</p><p><a href="/en">Back to home</a> · <a href="/app">Start audit</a></p></div>';
 return shell(lang,lang==='tr'?'Sayfa bulunamadı':'Page not found',content).replace('<head>','<head><meta name="robots" content="noindex">');
}

export const favicon='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#111318"/><path d="M20 46V18h13a9 9 0 0 1 2 17.8L45 46h-8l-9-10h-1v10zm7-16h5a3 3 0 0 0 0-6h-5z" fill="#c5f467"/></svg>';
export const legalPaths=Object.values(pages).flatMap(p=>[p.tr.path,p.en.path]);
