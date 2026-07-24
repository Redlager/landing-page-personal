// Año dinámico en footer
const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

const cookieConsentKey = 'cn_cookie_consent';

function getCookieConsent() {
  try {
    return window.localStorage.getItem(cookieConsentKey);
  } catch (error) {
    return null;
  }
}

function setCookieConsent(value) {
  try {
    window.localStorage.setItem(cookieConsentKey, value);
  } catch (error) {
    // ignore storage errors
  }
}

function isCookieConsentAccepted() {
  return getCookieConsent() === 'accepted';
}

function injectGoogleAnalytics() {
  if (window.cnAnalyticsInitialized) return;
  const gaSrc = 'https://www.googletagmanager.com/gtag/js?id=G-K5SNMFQC19';
  if (!document.querySelector(`script[src="${gaSrc}"]`)) {
    const gaScript = document.createElement('script');
    gaScript.async = true;
    gaScript.src = gaSrc;
    document.head.appendChild(gaScript);
  }
  window.dataLayer = window.dataLayer || [];
  window.gtag = function() { window.dataLayer.push(arguments); };
  window.gtag('js', new Date());
  window.gtag('config', 'G-K5SNMFQC19', { anonymize_ip: true });
}

function injectClarity() {
  if (document.querySelector('script[src^="https://www.clarity.ms/tag/"]')) return;
  window.clarity = window.clarity || function() { (window.clarity.q = window.clarity.q || []).push(arguments); };
  const clarityScript = document.createElement('script');
  clarityScript.async = true;
  clarityScript.src = 'https://www.clarity.ms/tag/xrkok9cud1';
  document.head.appendChild(clarityScript);
}

function initAnalytics() {
  if (window.cnAnalyticsInitialized) return;
  window.cnAnalyticsInitialized = true;
  injectGoogleAnalytics();
  injectClarity();
}

function showCookieBanner() {
  const banner = document.getElementById('cookie-consent-banner');
  if (banner) banner.classList.remove('hidden');
}

function hideCookieBanner() {
  const banner = document.getElementById('cookie-consent-banner');
  if (banner) banner.classList.add('hidden');
}

function acceptCookieConsent() {
  setCookieConsent('accepted');
  initAnalytics();
  hideCookieBanner();
}

function rejectCookieConsent() {
  setCookieConsent('rejected');
  hideCookieBanner();
}

function setupCookieConsent() {
  const banner = document.getElementById('cookie-consent-banner');
  if (!banner) return;
  const consent = getCookieConsent();
  if (consent === 'accepted') {
    initAnalytics();
    hideCookieBanner();
  } else if (consent === 'rejected') {
    hideCookieBanner();
  } else {
    showCookieBanner();
  }

  const acceptButton = document.getElementById('cookie-consent-accept');
  const rejectButton = document.getElementById('cookie-consent-reject');
  if (acceptButton) acceptButton.addEventListener('click', acceptCookieConsent);
  if (rejectButton) rejectButton.addEventListener('click', rejectCookieConsent);
}

// Animación suave on-scroll
const faders = document.querySelectorAll('.fade-in');
const io = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('in-view');
      io.unobserve(entry.target);
    }
  });
}, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
faders.forEach(el => io.observe(el));

// Smooth scroll para links internos
document.querySelectorAll('a[href^="#"]').forEach(a=>{
  a.addEventListener('click', e=>{
    const hash = a.getAttribute('href');
    if(hash.length>1 && document.querySelector(hash)){
      e.preventDefault();
      document.querySelector(hash).scrollIntoView({behavior:'smooth', block:'start'});
      history.replaceState(null, '', hash);
    }
  });
});

// Fallback simple para imágenes que fallan
document.querySelectorAll('img').forEach(img=>{
  img.addEventListener('error', () => {
    // si la imagen falla, ocultarla y mostrar el alt como texto accesible
    img.style.display = 'none';
    const p = document.createElement('div');
    p.className = 'w-full max-w-xs md:max-w-sm rounded-2xl bg-white/5 text-white/90 flex items-center justify-center mx-auto';
    p.style.height = img.height ? img.height + 'px' : '200px';
    p.textContent = img.alt || 'Imagen';
    img.insertAdjacentElement('afterend', p);
  }, {once:true});
});

// IntersectionObserver para animar .fade-in
if('IntersectionObserver' in window){
  const io = new IntersectionObserver((entries, obs)=>{
    entries.forEach(en=>{
      if(en.isIntersecting){
        en.target.classList.add('in-view');
        obs.unobserve(en.target);
      }
    });
  }, {threshold: .12});
  document.querySelectorAll('.fade-in').forEach(el => {
    el.classList.add('opacity-0', 'translate-y-4', 'transition', 'duration-700');
    io.observe(el);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const y = document.getElementById("year");
  if (y) y.textContent = new Date().getFullYear();

  // UTM capture, persist in cookie (30 days) and send to Google Analytics (gtag)
  (function(){
    const utmKeys = ['utm_source','utm_medium','utm_campaign','utm_term','utm_content'];

    function parseQuery(search){
      const out = {};
      if(!search) return out;
      const q = search.charAt(0)==='?'?search.substring(1):search;
      const usp = new URLSearchParams(q);
      for(const [k,v] of usp.entries()){
        if(utmKeys.includes(k) || k.startsWith('utm_')) out[k] = v;
      }
      return out;
    }

    function setCookie(name, value, days){
      const maxAge = days ? '; Max-Age=' + (days*24*60*60) : '';
      const secure = location.protocol === 'https:' ? '; Secure; SameSite=Lax' : '; SameSite=Lax';
      document.cookie = name + '=' + encodeURIComponent(value) + maxAge + '; Path=/' + secure;
    }

    function getCookie(name){
      const pairs = document.cookie ? document.cookie.split('; ') : [];
      for(const p of pairs){
        const idx = p.indexOf('=');
        if(idx>0){
          const k = p.substring(0, idx);
          const v = p.substring(idx+1);
          if(k === name) return decodeURIComponent(v);
        }
      }
      return null;
    }

    // send event to gtag when available, retrying up to maxAttempts
    function sendGtagEvent(eventName, params){
      const maxAttempts = 50; // ~10s with 200ms interval
      let attempts = 0;
      const trySend = () => {
        attempts++;
        if(window.gtag && typeof window.gtag === 'function'){
          try{ window.gtag('event', eventName, params); }catch(e){}
        } else if(attempts < maxAttempts){
          setTimeout(trySend, 200);
        }
      };
      trySend();
    }

    try{
      const urlUtms = parseQuery(location.search);
      const savedRaw = getCookie('cn_utms');
      let savedObj = {};
      if(savedRaw){
        try{ savedObj = JSON.parse(savedRaw); }catch(e){ savedObj = {}; }
      }

      const hasUrlUtms = Object.keys(urlUtms).length > 0;
      if(hasUrlUtms){
        const merged = Object.assign({}, savedObj, urlUtms);
        setCookie('cn_utms', JSON.stringify(merged), 30);
        sendGtagEvent('utm_parameters', Object.assign({event_category: 'utm_capture', non_interaction: true}, merged));
      } else if(Object.keys(savedObj).length > 0){
        // No UTM in URL but we have saved UTMs — notify GA so they are associated with this session/pageview
        sendGtagEvent('utm_parameters', Object.assign({event_category: 'utm_capture_from_cookie', non_interaction: true}, savedObj));
      }

      // Helper to read saved UTMs for attaching to other events
      const getSavedUtms = () => {
        const raw = getCookie('cn_utms');
        if(!raw) return {};
        try{ return JSON.parse(raw); }catch(e){ return {}; }
      };

      // Generic click tracker for links matching selector
      function attachClickTracker(selector, eventName, extraProps){
        document.querySelectorAll(selector).forEach(el=>{
          el.addEventListener('click', (ev)=>{
            const utms = getSavedUtms();
            const payload = Object.assign({event_category: 'engagement', non_interaction: false}, extraProps||{}, utms);
            sendGtagEvent(eventName, payload);
          });
        });
      }

      // WhatsApp (wa.me, api.whatsapp.com, whatsapp.com)
      attachClickTracker('a[href*="wa.me"], a[href*="api.whatsapp.com"], a[href*="whatsapp.com"]', 'click_whatsapp');

      // Email (mailto or Cloudflare email-protection link)
      attachClickTracker('a[href^="mailto:"] , a[href*="/cdn-cgi/l/email-protection"]', 'click_email');

      // Instagram links
      attachClickTracker('a[href*="instagram.com"]', 'click_instagram');

      // Phone calls (tel:)
      attachClickTracker('a[href^="tel:"]', 'click_llamar');

      // Form submissions
      document.querySelectorAll('form').forEach(f => {
        f.addEventListener('submit', (e) => {
          const utms = getSavedUtms();
          const payload = Object.assign({event_category: 'engagement', non_interaction: false, form_action: f.action || null, form_id: f.id || null}, utms);
          sendGtagEvent('submit_form', payload);
        }, {passive:true});
      });

      // Scroll 90% — fire once
      let scroll90Fired = false;
      function checkScroll90(){
        if(scroll90Fired) return;
        const sh = document.documentElement.scrollHeight || document.body.scrollHeight;
        const reached = (window.scrollY + window.innerHeight) / sh;
        if(reached >= 0.9){
          scroll90Fired = true;
          const utms = getSavedUtms();
          sendGtagEvent('scroll_90', Object.assign({event_category: 'engagement', non_interaction: true}, utms));
        }
      }
      window.addEventListener('scroll', throttle(checkScroll90, 200));

      // simple throttle
      function throttle(fn, wait){
        let t = null;
        return function(){
          if(t) return;
          t = setTimeout(()=>{ fn(); t = null; }, wait);
        };
      }

    }catch(e){
      console.warn('UTM capture / tracking enhancements failed', e);
    }
    setupCookieConsent();
  })();
});