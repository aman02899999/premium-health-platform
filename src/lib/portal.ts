// The two-site chooser ("portal") shown on a visitor's first homepage visit and at /portal.

/** Premium Health Platform is part of this app, served under /health (same domain, same login). */
export const healthHref = "/health";

export const PORTAL_KEY = "rfc-portal";

/**
 * Runs before first paint on "/": decides whether the chooser overlay shows, so
 * there's no flash for returning visitors. Skipped for people who arrived from a
 * search engine (they searched for the gym — and Google penalises interstitials
 * on search landings), for crawlers, and with ?portal=0.
 */
export const PORTAL_BOOT = `(function(){try{
var q=location.search;if(/[?&]portal=0/.test(q))return;
var force=/[?&]portal=1/.test(q);
if(!force){
if(localStorage.getItem(${JSON.stringify(PORTAL_KEY)}))return;
if(/bot|crawl|spider|slurp|lighthouse|preview/i.test(navigator.userAgent)||navigator.webdriver)return;
if(/(^|\\.)(google|bing|duckduckgo|yahoo|yandex|ecosia)\\./i.test((document.referrer.split('/')[2]||'')))return;
}
document.documentElement.setAttribute('data-portal','show');
}catch(e){}})();`;
