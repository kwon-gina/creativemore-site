/* THE CNM site runtime: runs the page's Component class on the pre-rendered markup.
   data-dca = attribute templates, data-dct = text templates, data-dce = events, data-dcr = refs. */
(function () {
  'use strict';
  var RX = /\{\{\s*([A-Za-z0-9_.$]+)\s*\}\}/g;

  /* lazy autoplay: videos play only while near the viewport (saves bandwidth) */
  var io = ('IntersectionObserver' in window) ? new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      var v = e.target;
      if (e.isIntersecting) {
        if (v.preload === 'none') { v.preload = 'auto'; }
        v.muted = true;
        try { var p = v.play(); if (p && p.catch) { p.catch(function () {}); } } catch (err) {}
      } else {
        try { v.pause(); } catch (err) {}
      }
    });
  }, { rootMargin: '240px 0px' }) : null;
  window.__dcLazy = function (el, on) {
    if (!el) { return; }
    if (!io) {
      try { if (on) { var p = el.play(); if (p && p.catch) { p.catch(function () {}); } } else { el.pause(); } } catch (err) {}
      return;
    }
    if (on) { io.observe(el); } else { io.unobserve(el); try { el.pause(); } catch (err) {} }
  };

  function DCLogic() { this.state = {}; this.props = {}; }
  var comp = null, vals = {}, bindings = [], refs = [], pending = false, mounted = false, early = false;

  DCLogic.prototype.setState = function (patch) {
    if (typeof patch === 'function') { patch = patch(this.state, this.props); }
    if (!patch) { return; }
    this.state = Object.assign({}, this.state || {}, patch);
    schedule();
  };
  window.DCLogic = DCLogic;

  function look(v, path) {
    return path.split('.').reduce(function (o, k) { return (o === null || o === undefined) ? undefined : o[k]; }, v);
  }
  function fill(tpl, v) {
    return tpl.replace(RX, function (m, k) {
      var x = look(v, k);
      return (x === null || x === undefined || typeof x === 'function') ? '' : String(x);
    });
  }
  function render() {
    vals = comp.renderVals() || {};
    for (var i = 0; i < bindings.length; i++) {
      var b = bindings[i], s = fill(b.tpl, vals);
      if (b.attr) { if (b.el.getAttribute(b.attr) !== s) { b.el.setAttribute(b.attr, s); } }
      else if (b.el.textContent !== s) { b.el.textContent = s; }
    }
    for (var j = 0; j < refs.length; j++) {
      var r = refs[j], fn = vals[r.name];
      if (typeof fn === 'function' && r.fn !== fn) {
        if (r.fn) { try { r.fn(null); } catch (err) {} }
        r.fn = fn;
        try { fn(r.el); } catch (err) { if (window.console) { console.error(err); } }
      }
    }
  }
  function schedule() {
    if (!mounted) { early = true; return; }
    if (pending) { return; }
    pending = true;
    Promise.resolve().then(function () {
      pending = false;
      render();
      if (comp.componentDidUpdate) { try { comp.componentDidUpdate({}); } catch (err) { if (window.console) { console.error(err); } } }
    });
  }
  function bindEvent(el, ev, name) {
    var types = ev === 'change' ? ['input', 'change'] : [ev];
    types.forEach(function (t) {
      el.addEventListener(t, function (e) { var fn = vals[name]; if (typeof fn === 'function') { fn(e); } });
    });
  }

  /* contact form: posts to the form endpoint (Google Apps Script web app) which mails the inquiry to thecnm@creativemore.co.kr */
  function contactForm() {
    var f = document.querySelector('form[aria-label="프로젝트 문의"]');
    if (!f) { return; }
    var m = document.querySelector('meta[name="cnm-form-endpoint"]');
    var ep = m ? (m.getAttribute('content') || '') : '';
    var bs = f.querySelectorAll('button[type="button"]');
    var btn = bs[bs.length - 1];
    if (!btn) { return; }
    var agree = f.querySelector('#c-agree');
    var lab = agree && agree.closest ? agree.closest('label') : null;
    var labDisp = lab ? lab.style.display : '';
    var row = btn.parentElement;
    var hp = document.createElement('input');
    hp.type = 'text'; hp.name = 'website'; hp.tabIndex = -1; hp.autocomplete = 'off';
    hp.setAttribute('aria-hidden', 'true');
    hp.style.cssText = 'position:absolute;left:-10000px;top:0;width:1px;height:1px;opacity:0';
    f.appendChild(hp);
    var msg = document.createElement('span');
    msg.setAttribute('role', 'status');
    msg.setAttribute('aria-live', 'polite');
    msg.style.cssText = 'display:none;font-size:14px;font-weight:800;line-height:1.45;max-width:62%';
    row.insertBefore(msg, btn);
    var label = btn.firstChild;
    var setLabel = function (t) { if (label && label.nodeType === 3) { label.nodeValue = t; } };
    var show = function (t, ok) {
      msg.textContent = t; msg.style.color = ok ? '#15804C' : '#C2373A'; msg.style.display = 'block';
      if (lab) { lab.style.display = 'none'; }
    };
    var reset = function () { msg.style.display = 'none'; if (lab) { lab.style.display = labDisp; } setLabel('Send'); btn.disabled = false; btn.style.opacity = ''; };
    var setSent = function (v) { if (comp) { comp.setState({ sent: v }); } };
    f.addEventListener('input', function () { if (comp && comp.state && comp.state.sent) { setSent(''); reset(); } });
    btn.addEventListener('click', function () {
      if (btn.disabled) { return; }
      if (f.reportValidity && !f.reportValidity()) { return; }
      if (!ep) { show('접수 연결 준비 중, thecnm@creativemore.co.kr 로 보내 주세요', false); return; }
      var q = function (s) { var x = f.querySelector(s); return x ? (x.value || '').trim() : ''; };
      var svc = Array.prototype.map.call(f.querySelectorAll('input[name=service]:checked'), function (x) { return x.value; }).join(', ');
      var data = new URLSearchParams();
      data.append('services', svc); data.append('name', q('#c-name')); data.append('company', q('#c-company'));
      data.append('phone', q('#c-phone')); data.append('email', q('#c-email')); data.append('schedule', q('#c-date'));
      data.append('message', q('#c-msg')); data.append('page', location.href); data.append('website', hp.value);
      btn.disabled = true; btn.style.opacity = '0.7'; setLabel('Sending'); setSent('go');
      fetch(ep, { method: 'POST', mode: 'no-cors', body: data }).then(function () {
        setSent('ok'); setLabel('Sent'); btn.style.opacity = ''; show('접수 완료, 확인 후 연락드릴게요', true);
      }).catch(function () {
        setSent('err'); btn.disabled = false; btn.style.opacity = ''; setLabel('Send'); show('전송 실패, thecnm@creativemore.co.kr 로 보내 주세요', false);
      });
    });
  }

  function init() {
    var sc = document.querySelector('script[type="text/x-dc"]');
    if (!sc) { return; }
    var Component = new Function('DCLogic', sc.textContent + '\n;return Component;')(DCLogic);
    comp = new Component();
    comp.state = comp.state || {};
    comp.props = comp.props || {};
    Array.prototype.forEach.call(document.querySelectorAll('[data-dca]'), function (el) {
      JSON.parse(el.getAttribute('data-dca')).forEach(function (p) { bindings.push({ el: el, attr: p[0], tpl: p[1] }); });
    });
    Array.prototype.forEach.call(document.querySelectorAll('[data-dct]'), function (el) {
      bindings.push({ el: el, attr: null, tpl: el.getAttribute('data-dct') });
    });
    Array.prototype.forEach.call(document.querySelectorAll('[data-dce]'), function (el) {
      el.getAttribute('data-dce').split(';').forEach(function (p) { var kv = p.split(':'); bindEvent(el, kv[0], kv[1]); });
    });
    Array.prototype.forEach.call(document.querySelectorAll('[data-dcr]'), function (el) {
      refs.push({ el: el, name: el.getAttribute('data-dcr'), fn: null });
    });
    render();
    mounted = true;
    if (early) { schedule(); }   /* setState called from a ref during the first render (React commit order) */
    if (comp.componentDidMount) { try { comp.componentDidMount(); } catch (err) { if (window.console) { console.error(err); } } }
    contactForm();
  }
  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', init); } else { init(); }
})();
