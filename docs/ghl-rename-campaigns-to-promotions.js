/* Rename "Campaigns" -> "Promotions" in the client portal (desktop sidebar, mobile menu, headings).
 * Paste into the portal's Custom JS. Safe to run more than once. */
(function () {
  var FROM = /^(\s*)Campaigns(\s*)$/;
  var TO = "Promotions";
  var SKIP = "SCRIPT,STYLE,TEXTAREA,INPUT,NOSCRIPT,CODE,PRE";

  function swap(root) {
    if (!root) return;
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: function (n) {
        if (!FROM.test(n.nodeValue)) return NodeFilter.FILTER_REJECT;
        var p = n.parentNode;
        return p && SKIP.indexOf(p.nodeName) === -1 ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
      },
    });
    var hits = [];
    while (walker.nextNode()) hits.push(walker.currentNode);
    hits.forEach(function (n) {
      n.nodeValue = n.nodeValue.replace(FROM, "$1" + TO + "$2");
    });
    // tooltips / aria labels on icon-only items (collapsed sidebar, mobile bottom bar)
    root.querySelectorAll && root.querySelectorAll('[title="Campaigns"],[aria-label="Campaigns"],[data-original-title="Campaigns"]').forEach(function (el) {
      ["title", "aria-label", "data-original-title"].forEach(function (a) {
        if (el.getAttribute(a) === "Campaigns") el.setAttribute(a, TO);
      });
    });
  }

  var queued = false;
  function run() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(function () {
      queued = false;
      swap(document.body);
    });
  }

  // The portal is a single-page app and the mobile drawer is rendered on demand, so keep watching.
  new MutationObserver(run).observe(document.documentElement, { childList: true, subtree: true, characterData: true });
  window.addEventListener("popstate", run);
  window.addEventListener("resize", run);
  document.addEventListener("click", function () { setTimeout(run, 50); }, true);
  run();
})();
