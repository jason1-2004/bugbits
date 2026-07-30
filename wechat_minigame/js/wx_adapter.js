// BugBits WeChat Mini Game Adapter
// Maps DOM APIs to wx APIs for seamless porting

(function(){
'use strict';

// Only activate in WeChat environment
if (typeof wx === 'undefined' || !wx.createCanvas) {
  if (typeof console !== 'undefined') console.log('[WX] Not in WeChat - adapter skipped');
  return;
}

var sysInfo = wx.getSystemInfoSync();
var W = sysInfo.windowWidth;
var H = sysInfo.windowHeight;
var PR = sysInfo.pixelRatio;

var canvas = wx.createCanvas();
canvas.width = W;
canvas.height = H;
canvas.style = {};

// Simulated DOM for game.js compatibility
var document = {
  _elements: {},
  _nextId: 1,
  getElementById: function(id) { return this._elements[id] || null; },
  createElement: function(tag) {
    var el = {
      id: 'el_' + (this._nextId++),
      tagName: tag,
      _children: [], _parent: null,
      style: {},
      className: '',
      classList: { _classes: [],
        add: function(c) { if(this._classes.indexOf(c)<0) this._classes.push(c); },
        remove: function(c) { var i = this._classes.indexOf(c); if(i>=0) this._classes.splice(i,1); },
        contains: function(c) { return this._classes.indexOf(c)>=0; }
      },
      dataset: {},
      innerHTML: '', textContent: '', display: '', disabled: false,
      _listeners: {},
      addEventListener: function(t,fn) { if(!this._listeners[t]) this._listeners[t]=[]; this._listeners[t].push(fn); },
      removeEventListener: function(t,fn) { if(!this._listeners[t]) return; var i=this._listeners[t].indexOf(fn); if(i>=0) this._listeners[t].splice(i,1); },
      dispatchEvent: function(e) { if(!this._listeners[e.type]) return; for(var i=0;i<this._listeners[e.type].length;i++) { this._listeners[e.type][i](e); } },
      appendChild: function(c) { this._children.push(c); c._parent=this; return c; },
      removeChild: function(c) { var i=this._children.indexOf(c); if(i>=0)this._children.splice(i,1); c._parent=null; return c; },
      querySelector: function() { return null; },
      querySelectorAll: function() { return []; },
      getBoundingClientRect: function() { return {top:0,left:0,width:W,height:H,right:W,bottom:H}; }
    };
    if (tag === 'canvas' || tag === 'Canvas') return canvas;
    this._elements[el.id] = el;
    return el;
  },
  body: {
    appendChild: function() {},
    style: {},
    _listeners: {},
    addEventListener: function(t,fn) {
      if(!this._listeners[t]) this._listeners[t]=[];
      this._listeners[t].push(fn);
      if(t==='click'||t==='touchstart') {
        wx.onTouchStart(function(e) {
          for(var i=0;i<(document.body._listeners[t]||[]).length;i++)
            document.body._listeners[t][i](e);
        });
      }
    },
    removeEventListener: function(t,fn) {
      if(!this._listeners[t]) return;
      var i=this._listeners[t].indexOf(fn); if(i>=0) this._listeners[t].splice(i,1);
    }
  },
  documentElement: { style: {} },
  createTextNode: function(t) { return {nodeValue:t,textContent:t}; },
  addEventListener: function(t,fn) { this.body.addEventListener(t,fn); },
  removeEventListener: function(t,fn) { this.body.removeEventListener(t,fn); },
  readyState: 'complete'
};

// Window polyfill
var window = {
  innerWidth: W, innerHeight: H,
  devicePixelRatio: PR,
  AudioContext: null,
  webkitAudioContext: null,
  localStorage: {
    _data: {},
    getItem: function(k) { try { return wx.getStorageSync(k)||null; } catch(e) { return this._data[k]||null; } },
    setItem: function(k,v) { try { wx.setStorageSync(k,String(v)); } catch(e) { this._data[k]=String(v); } },
    removeItem: function(k) { try { wx.removeStorageSync(k); } catch(e) { delete this._data[k]; } },
    clear: function() { try { wx.clearStorageSync(); } catch(e) { this._data={}; } }
  },
  location: { href: 'wechatgame://bugbits', search: '', hash: '' },
  navigator: { userAgent: 'WeChat-MiniGame', platform: 'WeChat' },
  requestAnimationFrame: function(cb) { return wx.requestAnimationFrame ? wx.requestAnimationFrame(cb) : setTimeout(function(){cb(Date.now());},16); },
  cancelAnimationFrame: function(id) { if(wx.cancelAnimationFrame) wx.cancelAnimationFrame(id); else clearTimeout(id); },
  performance: { now: function() { return Date.now(); } },
  Image: function() { var img = {width:0,height:0,src:'',onload:null,onerror:null}; img.addEventListener=function(t,fn){if(t==='load')img.onload=fn;else if(t==='error')img.onerror=fn;}; return img; }
};

// Install into global scope
var g = (typeof globalThis !== 'undefined') ? globalThis : this;
if (typeof document === 'undefined') g.document = document;
if (typeof window === 'undefined') g.window = window;
if (typeof localStorage === 'undefined') g.localStorage = window.localStorage;

g.__wxCanvas = canvas;
g.__wxCtx = canvas.getContext('2d');
g.__WX_ENV = true;

console.log('[BugBits] WeChat Adapter Active');
console.log('[BugBits] Canvas: ' + W + 'x' + H + ' @' + PR + 'x');

})();