import { page } from "./page.js";

const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" }
});

function safeUrl(value) {
  const url = new URL(value);
  if (!["http:", "https:"].includes(url.protocol) || url.username || url.password || (url.port && !["80", "443"].includes(url.port))) throw new Error("Geçerli bir http veya https adresi girin.");
  const host = url.hostname.toLowerCase();
  if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local") || host.endsWith(".internal") || /^[\d.]+$/.test(host) || host.includes(":")) throw new Error("Yalnızca herkese açık alan adları taranabilir.");
  url.hash = "";
  return url;
}
async function get(url) {
  let current = safeUrl(url);
  for (let i = 0; i < 4; i++) {
    const response = await fetch(current, { redirect: "manual", headers: { "user-agent": "RogiSEOAudit/1.0", accept: "text/html,text/plain,application/xml;q=0.8" }, signal: AbortSignal.timeout(10000) });
    if ([301,302,303,307,308].includes(response.status)) {
      const next = safeUrl(new URL(response.headers.get("location") || "", current).href);
      if (next.hostname !== current.hostname) throw new Error("Başka alan adına yönlendirme taranmadı.");
      current = next; continue;
    }
    const type = response.headers.get("content-type") || "";
    const body = (await response.text()).slice(0, 1200000);
    return { status: response.status, body, type, url: current.href };
  }
  throw new Error("Çok fazla yönlendirme var.");
}
const matches = (html, re) => [...html.matchAll(re)];
const attr = (tag, name) => {
  const hit = tag.match(new RegExp("(?:^|\\s)" + name + "\\s*=\\s*([\"'])(.*?)\\1", "i"));
  return hit?.[2]?.trim() || "";
};
function analyze(html, url, status) {
  const checks = [];
  const add = (id, label, ok, detail, category, priority = "Orta") => checks.push({ id, label, status: ok ? "pass" : "fail", detail, category, priority });
  const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.replace(/<[^>]+>/g,"").trim() || "";
  const metas = matches(html, /<meta\b[^>]*>/gi).map(x => x[0]);
  const links = matches(html, /<link\b[^>]*>/gi).map(x => x[0]);
  const headings = matches(html, /<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>/gi).map(x => ({ level: Number(x[1]), text: x[2].replace(/<[^>]+>/g, "").trim() }));
  const description = attr(metas.find(x => attr(x, "name").toLowerCase() === "description") || "", "content");
  const canonical = attr(links.find(x => attr(x, "rel").toLowerCase().split(/\s+/).includes("canonical")) || "", "href");
  const robots = attr(metas.find(x => attr(x, "name").toLowerCase() === "robots") || "", "content");
  const images = matches(html, /<img\b[^>]*>/gi).map(x => x[0]);
  const anchors = matches(html, /<a\b[^>]*>/gi).map(x => x[0]);
  const internal = anchors.filter(x => { try { return new URL(attr(x, "href"), url).hostname === new URL(url).hostname; } catch { return false; } });
  const schemas = matches(html, /<script\b[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>/gi);
  const cleanPath = new URL(url).pathname;
  add("title","Özgün sayfa başlığı",!!title && title.length >= 20 && title.length <= 65, title || "Başlık bulunamadı.","İçerik","Yüksek");
  add("description","Meta açıklama",description.length >= 70 && description.length <= 165, description || "Meta açıklama bulunamadı.","İçerik");
  add("h1","Tek H1 başlığı",headings.filter(x => x.level === 1).length === 1, headings.filter(x => x.level === 1).length + " adet H1 bulundu.","İçerik","Yüksek");
  add("hierarchy","Başlık hiyerarşisi",!headings.some((h,i) => i && h.level > headings[i-1].level + 1), "H1–H3 sırası incelendi.","İçerik");
  add("url","Anlaşılır URL",cleanPath.length <= 100 && !/[çğıöşüÇĞİÖŞÜ]/.test(url) && new URL(url).search === "", cleanPath + new URL(url).search,"Teknik");
  add("canonical","Canonical etiketi",!!canonical, canonical || "Canonical bulunamadı.","Teknik","Yüksek");
  add("index","İndeksleme izni",!/(^|,)\s*noindex/i.test(robots), robots || "noindex bulunamadı.","Teknik","Yüksek");
  add("alt","Görsel alt metinleri",images.every(x => x.includes("alt=") && !!attr(x, "alt")), images.length + " görselin " + images.filter(x => !attr(x, "alt")).length + " tanesinde açıklama eksik.","Medya");
  add("internal","İç bağlantılar",internal.length > 0, internal.length + " iç bağlantı bulundu.","Bağlantılar");
  add("schema","Yapısal veri",schemas.length > 0, schemas.length + " JSON-LD bloğu bulundu.","Teknik");
  add("https","HTTPS",new URL(url).protocol === "https:",new URL(url).protocol.toUpperCase(),"Güvenlik","Yüksek");
  add("http","Sayfa yanıtı",status === 200,"HTTP " + status,"Teknik","Yüksek");
  return { checks, title, description, headings, internalLinks: [...new Set(internal.map(x => { try { return new URL(attr(x,"href"),url).href; } catch { return ""; } }))].filter(Boolean).slice(0,20), images: images.length };
}
async function scan(input) {
  const target = safeUrl(input);
  const home = await get(target.href);
  if (!home.type.includes("html")) throw new Error("Adres HTML sayfası döndürmedi.");
  const analysis = analyze(home.body, home.url, home.status);
  const origin = new URL(home.url).origin;
  const extra = await Promise.allSettled([get(origin + "/robots.txt"), get(origin + "/sitemap.xml")]);
  const check = (id,label,ok,detail,category="Teknik") => analysis.checks.push({id,label,status:ok?"pass":"fail",detail,category,priority:"Orta"});
  const robot = extra[0].status === "fulfilled" ? extra[0].value : null;
  const sitemap = extra[1].status === "fulfilled" ? extra[1].value : null;
  check("robots","robots.txt",robot?.status === 200 && /user-agent:/i.test(robot.body),robot?.status === 200 ? "Dosya erişilebilir." : "Dosya bulunamadı veya okunamadı.");
  check("sitemap","XML sitemap",sitemap?.status === 200 && /<urlset|<sitemapindex/i.test(sitemap.body),sitemap?.status === 200 ? "Sitemap erişilebilir." : "Sitemap bulunamadı veya XML biçimi tanınmadı.");
  const total = analysis.checks.length;
  const passed = analysis.checks.filter(x => x.status === "pass").length;
  return { url: home.url, scannedAt: new Date().toISOString(), score: Math.round(passed/total*100), passed, total, ...analysis,
    manual: ["Google Search Console bağlantısı ve indeks raporu","Anahtar kelime ve içerik özgünlüğü","Gerçek kullanıcıda mobil görünüm","PageSpeed / Core Web Vitals ölçümü","Görsellerin sıkıştırılması ve gerçek boyutu","Bozuk bağlantılar ve 301 yönlendirmeleri","Faydalı 404 sayfası","Google arama sonucundaki başlık ve açıklama","Formlar, menü ve footer bağlantıları","Gizli sekme ve yavaş ağ testi","Başka biriyle kullanılabilirlik testi"]
  };
}
export default { async fetch(request) {
  const path = new URL(request.url).pathname;
  if (path === "/api/scan" && request.method === "POST") {
    try {
      const body = await request.json();
      return json(await scan(body.url));
    } catch (e) { return json({ error: e.message || "Tarama tamamlanamadı." }, 400); }
  }
  if (path === "/") return new Response(page, { headers: { "content-type": "text/html; charset=utf-8" } });
  if (path === "/robots.txt") return new Response("User-agent: *\nAllow: /\nSitemap: " + new URL(request.url).origin + "/sitemap.xml", {headers:{"content-type":"text/plain"}});
  if (path === "/sitemap.xml") return new Response('<?xml version="1.0"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>'+new URL(request.url).origin+'/</loc></url></urlset>',{headers:{"content-type":"application/xml"}});
  return new Response("Sayfa bulunamadı. Ana sayfaya dönün: /", {status:404,headers:{"content-type":"text/plain; charset=utf-8"}});
}};
