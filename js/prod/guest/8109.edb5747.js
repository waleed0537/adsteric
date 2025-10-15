(self.webpackChunkeva_dav = self.webpackChunkeva_dav || []).push([
    [8109], {
        8109: function(t, e, n) {
            function i(t, e) {
                var n = Object.keys(t);
                if (Object.getOwnPropertySymbols) {
                    var i = Object.getOwnPropertySymbols(t);
                    e && (i = i.filter((function(e) {
                        return Object.getOwnPropertyDescriptor(t, e).enumerable
                    }))), n.push.apply(n, i)
                }
                return n
            }

            function r(t) {
                for (var e = 1; e < arguments.length; e++) {
                    var n = null != arguments[e] ? arguments[e] : {};
                    e % 2 ? i(Object(n), !0).forEach((function(e) {
                        c(t, e, n[e])
                    })) : Object.getOwnPropertyDescriptors ? Object.defineProperties(t, Object.getOwnPropertyDescriptors(n)) : i(Object(n)).forEach((function(e) {
                        Object.defineProperty(t, e, Object.getOwnPropertyDescriptor(n, e))
                    }))
                }
                return t
            }

            function o(t) {
                return o = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(t) {
                    return typeof t
                } : function(t) {
                    return t && "function" == typeof Symbol && t.constructor === Symbol && t !== Symbol.prototype ? "symbol" : typeof t
                }, o(t)
            }

            function s(t, e) {
                if (!(t instanceof e)) throw new TypeError("Cannot call a class as a function")
            }

            function u(t, e) {
                for (var n = 0; n < e.length; n++) {
                    var i = e[n];
                    i.enumerable = i.enumerable || !1, i.configurable = !0, "value" in i && (i.writable = !0), Object.defineProperty(t, i.key, i)
                }
            }

            function a(t, e, n) {
                return e && u(t.prototype, e), n && u(t, n), t
            }

            function c(t, e, n) {
                return e in t ? Object.defineProperty(t, e, {
                    value: n,
                    enumerable: !0,
                    configurable: !0,
                    writable: !0
                }) : t[e] = n, t
            }

            function l(t) {
                return l = Object.setPrototypeOf ? Object.getPrototypeOf : function(t) {
                    return t.__proto__ || Object.getPrototypeOf(t)
                }, l(t)
            }

            function f(t, e) {
                return f = Object.setPrototypeOf || function(t, e) {
                    return t.__proto__ = e, t
                }, f(t, e)
            }

            function d() {
                return d = "undefined" != typeof Reflect && Reflect.get ? Reflect.get : function(t, e, n) {
                    var i = function(t, e) {
                        for (; !{}.hasOwnProperty.call(t, e) && null !== (t = l(t)););
                        return t
                    }(t, e);
                    if (i) {
                        var r = Object.getOwnPropertyDescriptor(i, e);
                        return r.get ? r.get.call(arguments.length < 3 ? t : n) : r.value
                    }
                }, d.apply(this, arguments)
            }

            function h(t) {
                return parseInt(t)
            }

            function v(t) {
                return "string" == typeof t
            }

            function p(t) {
                var e = o(t);
                return "function" === e || "object" === e && !!t
            }

            function m(t) {
                return "function" == typeof t
            }

            function g(t) {
                return void 0 === t
            }

            function y(t) {
                return t.constructor === Array
            }

            function b(t, e, n) {
                Object.defineProperty(t, e, n)
            }

            function w(t, e) {
                var n = Object.assign({}, t, e);
                return e.hasOwnProperty("classes") && (n.classes = Object.assign({}, t.classes, e.classes), ["direction", "type", "slide", "arrow", "nav"].forEach((function(i) {
                    e.classes.hasOwnProperty(i) && (n.classes[i] = r(r({}, t.classes[i]), e.classes[i]))
                }))), e.hasOwnProperty("breakpoints") && (n.breakpoints = Object.assign({}, t.breakpoints, e.breakpoints)), n
            }

            function _() {
                return (new Date).getTime()
            }

            function k(t, e, n) {
                var i, r, o, s, u = arguments.length > 2 && void 0 !== n ? n : {},
                    a = 0,
                    c = function() {
                        a = !1 === u.leading ? 0 : _(), i = null, s = t.apply(r, o), i || (r = o = null)
                    },
                    l = function() {
                        var n = _();
                        a || !1 !== u.leading || (a = n);
                        var l = e - (n - a);
                        return r = this, o = arguments, l <= 0 || l > e ? (i && (clearTimeout(i), i = null), a = n, s = t.apply(r, o), i || (r = o = null)) : i || !1 === u.trailing || (i = setTimeout(c, l)), s
                    };
                return l.cancel = function() {
                    clearTimeout(i), a = 0, i = r = o = null
                }, l
            }

            function S(t) {
                if (t && t.parentNode) {
                    for (var e = t.parentNode.firstChild, n = []; e; e = e.nextSibling) 1 === e.nodeType && e !== t && n.push(e);
                    return n
                }
                return []
            }

            function O(t) {
                return [].slice.call(t)
            }

            function H(t, e) {
                return {
                    modify: function(t) {
                        return e.Direction.is("rtl") ? -t : t
                    }
                }
            }

            function T(t, e) {
                return {
                    modify: function(t) {
                        var n = Math.floor(t / e.Sizes.slideWidth);
                        return t + e.Gaps.value * n
                    }
                }
            }

            function x(t, e) {
                return {
                    modify: function(t) {
                        return t + e.Clones.grow / 2
                    }
                }
            }

            function j(t, e) {
                return {
                    modify: function(n) {
                        if (t.settings.focusAt >= 0) {
                            var i = e.Peek.value;
                            return p(i) ? n - i.before : n - i
                        }
                        return n
                    }
                }
            }

            function A(t, e) {
                return {
                    modify: function(n) {
                        var i = e.Gaps.value,
                            r = e.Sizes.width,
                            o = t.settings.focusAt,
                            s = e.Sizes.slideWidth;
                        return "center" === o ? n - (r / 2 - s / 2) : n - s * o - i * o
                    }
                }
            }

            function P(t, e, n) {
                var i = new B,
                    r = 0,
                    o = 0,
                    s = 0,
                    u = !1,
                    a = !!G && {
                        passive: !0
                    },
                    c = {
                        mount: function() {
                            this.bindSwipeStart()
                        },
                        start: function(e) {
                            if (!u && !t.disabled) {
                                this.disable();
                                var i = this.touches(e);
                                r = null, o = h(i.pageX), s = h(i.pageY), this.bindSwipeMove(), this.bindSwipeEnd(), n.emit("swipe.start")
                            }
                        },
                        move: function(i) {
                            if (!t.disabled) {
                                var u = t.settings,
                                    a = u.touchAngle,
                                    c = u.touchRatio,
                                    l = u.classes,
                                    f = this.touches(i),
                                    d = h(f.pageX) - o,
                                    v = h(f.pageY) - s,
                                    p = Math.abs(d << 2),
                                    m = Math.abs(v << 2),
                                    g = Math.sqrt(p + m);
                                if (!(180 * (r = Math.asin(Math.sqrt(m) / g)) / Math.PI < a)) return !1;
                                i.stopPropagation(), e.Move.make(d * parseFloat(c)), e.Html.root.classList.add(l.dragging), n.emit("swipe.move")
                            }
                        },
                        end: function(i) {
                            if (!t.disabled) {
                                var s = t.settings,
                                    u = s.perSwipe,
                                    a = s.touchAngle,
                                    c = s.classes,
                                    l = this.touches(i),
                                    f = this.threshold(i),
                                    d = l.pageX - o,
                                    h = 180 * r / Math.PI;
                                this.enable(), d > f && h < a ? e.Run.make(e.Direction.resolve("".concat(u, "<"))) : d < -f && h < a ? e.Run.make(e.Direction.resolve("".concat(u, ">"))) : e.Move.make(), e.Html.root.classList.remove(c.dragging), this.unbindSwipeMove(), this.unbindSwipeEnd(), n.emit("swipe.end")
                            }
                        },
                        bindSwipeStart: function() {
                            var n = this,
                                r = t.settings,
                                o = r.swipeThreshold,
                                s = r.dragThreshold;
                            o && i.on(N[0], e.Html.wrapper, (function(t) {
                                n.start(t)
                            }), a), s && i.on(N[1], e.Html.wrapper, (function(t) {
                                n.start(t)
                            }), a)
                        },
                        unbindSwipeStart: function() {
                            i.off(N[0], e.Html.wrapper, a), i.off(N[1], e.Html.wrapper, a)
                        },
                        bindSwipeMove: function() {
                            var n = this;
                            i.on(X, e.Html.wrapper, k((function(t) {
                                n.move(t)
                            }), t.settings.throttle), a)
                        },
                        unbindSwipeMove: function() {
                            i.off(X, e.Html.wrapper, a)
                        },
                        bindSwipeEnd: function() {
                            var t = this;
                            i.on(Y, e.Html.wrapper, (function(e) {
                                t.end(e)
                            }))
                        },
                        unbindSwipeEnd: function() {
                            i.off(Y, e.Html.wrapper)
                        },
                        touches: function(t) {
                            return J.indexOf(t.type) > -1 ? t : t.touches[0] || t.changedTouches[0]
                        },
                        threshold: function(e) {
                            var n = t.settings;
                            return J.indexOf(e.type) > -1 ? n.dragThreshold : n.swipeThreshold
                        },
                        enable: function() {
                            return u = !1, e.Transition.enable(), this
                        },
                        disable: function() {
                            return u = !0, e.Transition.disable(), this
                        }
                    };
                return n.on("build.after", (function() {
                    e.Html.root.classList.add(t.settings.classes.swipeable)
                })), n.on("destroy", (function() {
                    c.unbindSwipeStart(), c.unbindSwipeMove(), c.unbindSwipeEnd(), i.destroy()
                })), c
            }

            function R(t, e, n) {
                var i = new B,
                    r = !!G && {
                        passive: !0
                    },
                    o = {
                        mount: function() {
                            this._n = e.Html.root.querySelectorAll(K), this._c = e.Html.root.querySelectorAll(Q), this._arrowControls = {
                                previous: e.Html.root.querySelectorAll(U),
                                next: e.Html.root.querySelectorAll(Z)
                            }, this.addBindings()
                        },
                        setActive: function() {
                            for (var t = 0; t < this._n.length; t++) this.addClass(this._n[t].children)
                        },
                        removeActive: function() {
                            for (var t = 0; t < this._n.length; t++) this.removeClass(this._n[t].children)
                        },
                        addClass: function(e) {
                            var n = t.settings,
                                i = e[t.index];
                            i && (i.classList.add(n.classes.nav.active), S(i).forEach((function(t) {
                                t.classList.remove(n.classes.nav.active)
                            })))
                        },
                        removeClass: function(e) {
                            var n = e[t.index];
                            null == n || n.classList.remove(t.settings.classes.nav.active)
                        },
                        setArrowState: function() {
                            if (!t.settings.rewind) {
                                var n = o._arrowControls.next,
                                    i = o._arrowControls.previous;
                                this.resetArrowState(n, i), 0 === t.index && this.disableArrow(i), t.index === e.Run.length && this.disableArrow(n)
                            }
                        },
                        resetArrowState: function() {
                            for (var e = t.settings, n = arguments.length, i = Array(n), r = 0; r < n; r++) i[r] = arguments[r];
                            i.forEach((function(t) {
                                O(t).forEach((function(t) {
                                    t.classList.remove(e.classes.arrow.disabled)
                                }))
                            }))
                        },
                        disableArrow: function() {
                            for (var e = t.settings, n = arguments.length, i = Array(n), r = 0; r < n; r++) i[r] = arguments[r];
                            i.forEach((function(t) {
                                O(t).forEach((function(t) {
                                    t.classList.add(e.classes.arrow.disabled)
                                }))
                            }))
                        },
                        addBindings: function() {
                            for (var t = 0; t < this._c.length; t++) this.bind(this._c[t].children)
                        },
                        removeBindings: function() {
                            for (var t = 0; t < this._c.length; t++) this.unbind(this._c[t].children)
                        },
                        bind: function(t) {
                            for (var e = 0; e < t.length; e++) i.on("click", t[e], this.click), i.on("touchstart", t[e], this.click, r)
                        },
                        unbind: function(t) {
                            for (var e = 0; e < t.length; e++) i.off(["click", "touchstart"], t[e])
                        },
                        click: function(t) {
                            G || "touchstart" !== t.type || t.preventDefault();
                            var n = t.currentTarget.getAttribute("data-glide-dir");
                            e.Run.make(e.Direction.resolve(n))
                        }
                    };
                return b(o, "items", {
                    get: function() {
                        return o._c
                    }
                }), n.on(["mount.after", "move.after"], (function() {
                    o.setActive()
                })), n.on(["mount.after", "run"], (function() {
                    o.setArrowState()
                })), n.on("destroy", (function() {
                    o.removeBindings(), o.removeActive(), i.destroy()
                })), o
            }

            function C(t, e, n) {
                var i = new B,
                    r = {
                        mount: function() {
                            this.enable(), this.start(), t.settings.hoverpause && this.bind()
                        },
                        enable: function() {
                            this._e = !0
                        },
                        disable: function() {
                            this._e = !1
                        },
                        start: function() {
                            var i = this;
                            this._e && (this.enable(), t.settings.autoplay && g(this._i) && (this._i = setInterval((function() {
                                i.stop(), e.Run.make(">"), i.start(), n.emit("autoplay")
                            }), this.time)))
                        },
                        stop: function() {
                            this._i = clearInterval(this._i)
                        },
                        bind: function() {
                            var t = this;
                            i.on("mouseover", e.Html.root, (function() {
                                t._e && t.stop()
                            })), i.on("mouseout", e.Html.root, (function() {
                                t._e && t.start()
                            }))
                        },
                        unbind: function() {
                            i.off(["mouseover", "mouseout"], e.Html.root)
                        }
                    };
                return b(r, "time", {
                    get: function() {
                        return h(e.Html.slides[t.index].getAttribute("data-glide-autoplay") || t.settings.autoplay)
                    }
                }), n.on(["destroy", "update"], (function() {
                    r.unbind()
                })), n.on(["run.before", "swipe.start", "update"], (function() {
                    r.stop()
                })), n.on(["pause", "destroy"], (function() {
                    r.disable(), r.stop()
                })), n.on(["run.after", "swipe.end"], (function() {
                    r.start()
                })), n.on(["play"], (function() {
                    r.enable(), r.start()
                })), n.on("update", (function() {
                    r.mount()
                })), n.on("destroy", (function() {
                    i.destroy()
                })), r
            }

            function E(t) {
                return p(t) ? Object.keys(e = t).sort().reduce((function(t, n) {
                    return t[n] = e[n], t[n], t
                }), {}) : {};
                var e
            }

            function z(t, e, n) {
                var i = new B,
                    r = t.settings,
                    o = E(r.breakpoints),
                    s = Object.assign({}, r),
                    u = {
                        match: function(t) {
                            if (void 0 !== window.matchMedia)
                                for (var e in t)
                                    if (t.hasOwnProperty(e) && window.matchMedia("(max-width: ".concat(e, "px)")).matches) return t[e];
                            return s
                        }
                    };
                return Object.assign(r, u.match(o)), i.on("resize", window, k((function() {
                    t.settings = w(r, u.match(o))
                }), t.settings.throttle)), n.on("update", (function() {
                    o = E(o), s = Object.assign({}, r)
                })), n.on("destroy", (function() {
                    i.off("resize", window)
                })), u
            }
            n.d(e, {
                Ay: function() {
                    return tt
                },
                H2: function() {
                    return R
                },
                Hp: function() {
                    return P
                },
                Ij: function() {
                    return C
                },
                Rp: function() {
                    return z
                }
            });
            var M = {
                    type: "slider",
                    startAt: 0,
                    perView: 1,
                    focusAt: 0,
                    gap: 10,
                    autoplay: !1,
                    hoverpause: !0,
                    keyboard: !0,
                    bound: !1,
                    swipeThreshold: 80,
                    dragThreshold: 120,
                    perSwipe: "",
                    touchRatio: .5,
                    touchAngle: 45,
                    animationDuration: 400,
                    rewind: !0,
                    rewindDuration: 800,
                    animationTimingFunc: "cubic-bezier(.165, .840, .440, 1)",
                    waitForTransition: !0,
                    throttle: 10,
                    direction: "ltr",
                    peek: 0,
                    cloningRatio: 1,
                    breakpoints: {},
                    classes: {
                        swipeable: "glide--swipeable",
                        dragging: "glide--dragging",
                        direction: {
                            ltr: "glide--ltr",
                            rtl: "glide--rtl"
                        },
                        type: {
                            slider: "glide--slider",
                            carousel: "glide--carousel"
                        },
                        slide: {
                            clone: "glide__slide--clone",
                            active: "glide__slide--active"
                        },
                        arrow: {
                            disabled: "glide__arrow--disabled"
                        },
                        nav: {
                            active: "glide__bullet--active"
                        }
                    }
                },
                L = function() {
                    function t(e) {
                        var n = arguments.length > 0 && void 0 !== e ? e : {};
                        s(this, t), this.events = n, this.hop = n.hasOwnProperty
                    }
                    return a(t, [{
                        key: "on",
                        value: function(t, e) {
                            if (!y(t)) {
                                this.hop.call(this.events, t) || (this.events[t] = []);
                                var n = this.events[t].push(e) - 1;
                                return {
                                    remove: function() {
                                        delete this.events[t][n]
                                    }
                                }
                            }
                            for (var i = 0; i < t.length; i++) this.on(t[i], e)
                        }
                    }, {
                        key: "emit",
                        value: function(t, e) {
                            if (y(t))
                                for (var n = 0; n < t.length; n++) this.emit(t[n], e);
                            else this.hop.call(this.events, t) && this.events[t].forEach((function(t) {
                                t(e || {})
                            }))
                        }
                    }]), t
                }(),
                D = function() {
                    function t(e, n) {
                        var i = arguments.length > 1 && void 0 !== n ? n : {};
                        s(this, t), this._c = {}, this._t = [], this._e = new L, this.disabled = !1, this.selector = e, this.settings = w(M, i), this.index = this.settings.startAt
                    }
                    return a(t, [{
                        key: "mount",
                        value: function(t) {
                            var e = arguments.length > 0 && void 0 !== t ? t : {};
                            return this._e.emit("mount.before"), p(e) && (this._c = function(t, e, n) {
                                var i = {};
                                for (var r in e) m(e[r]) && (i[r] = e[r](t, i, n));
                                for (var o in i) m(i[o].mount) && i[o].mount();
                                return i
                            }(this, e, this._e)), this._e.emit("mount.after"), this
                        }
                    }, {
                        key: "mutate",
                        value: function(t) {
                            var e = arguments.length > 0 && void 0 !== t ? t : [];
                            return y(e) && (this._t = e), this
                        }
                    }, {
                        key: "update",
                        value: function(t) {
                            var e = arguments.length > 0 && void 0 !== t ? t : {};
                            return this.settings = w(this.settings, e), e.hasOwnProperty("startAt") && (this.index = e.startAt), this._e.emit("update"), this
                        }
                    }, {
                        key: "go",
                        value: function(t) {
                            return this._c.Run.make(t), this
                        }
                    }, {
                        key: "move",
                        value: function(t) {
                            return this._c.Transition.disable(), this._c.Move.make(t), this
                        }
                    }, {
                        key: "destroy",
                        value: function() {
                            return this._e.emit("destroy"), this
                        }
                    }, {
                        key: "play",
                        value: function(t) {
                            var e = arguments.length > 0 && void 0 !== t && t;
                            return e && (this.settings.autoplay = e), this._e.emit("play"), this
                        }
                    }, {
                        key: "pause",
                        value: function() {
                            return this._e.emit("pause"), this
                        }
                    }, {
                        key: "disable",
                        value: function() {
                            return this.disabled = !0, this
                        }
                    }, {
                        key: "enable",
                        value: function() {
                            return this.disabled = !1, this
                        }
                    }, {
                        key: "on",
                        value: function(t, e) {
                            return this._e.on(t, e), this
                        }
                    }, {
                        key: "isType",
                        value: function(t) {
                            return this.settings.type === t
                        }
                    }, {
                        key: "settings",
                        get: function() {
                            return this._o
                        },
                        set: function(t) {
                            p(t) && (this._o = t)
                        }
                    }, {
                        key: "index",
                        get: function() {
                            return this._i
                        },
                        set: function(t) {
                            this._i = h(t)
                        }
                    }, {
                        key: "type",
                        get: function() {
                            return this.settings.type
                        }
                    }, {
                        key: "disabled",
                        get: function() {
                            return this._d
                        },
                        set: function(t) {
                            this._d = !!t
                        }
                    }]), t
                }(),
                W = {
                    ltr: ["marginLeft", "marginRight"],
                    rtl: ["marginRight", "marginLeft"]
                },
                B = function() {
                    function t(e) {
                        var n = arguments.length > 0 && void 0 !== e ? e : {};
                        s(this, t), this.listeners = n
                    }
                    return a(t, [{
                        key: "on",
                        value: function(t, e, n, i) {
                            var r = arguments.length > 3 && void 0 !== i && i;
                            v(t) && (t = [t]);
                            for (var o = 0; o < t.length; o++) this.listeners[t[o]] = n, e.addEventListener(t[o], this.listeners[t[o]], r)
                        }
                    }, {
                        key: "off",
                        value: function(t, e, n) {
                            var i = arguments.length > 2 && void 0 !== n && n;
                            v(t) && (t = [t]);
                            for (var r = 0; r < t.length; r++) e.removeEventListener(t[r], this.listeners[t[r]], i)
                        }
                    }, {
                        key: "destroy",
                        value: function() {
                            delete this.listeners
                        }
                    }]), t
                }(),
                I = ["ltr", "rtl"],
                V = {
                    ">": "<",
                    "<": ">",
                    "=": "="
                },
                q = !1;
            try {
                var F = Object.defineProperty({}, "passive", {
                    get: function() {
                        q = !0
                    }
                });
                window.addEventListener("testPassive", null, F), window.removeEventListener("testPassive", null, F)
            } catch (t) {}
            var G = q,
                N = ["touchstart", "mousedown"],
                X = ["touchmove", "mousemove"],
                Y = ["touchend", "touchcancel", "mouseup", "mouseleave"],
                J = ["mousedown", "mousemove", "mouseup", "mouseleave"],
                K = '[data-glide-el="controls[nav]"]',
                Q = '[data-glide-el^="controls"]',
                U = "".concat(Q, ' [data-glide-dir*="<"]'),
                Z = "".concat(Q, ' [data-glide-dir*=">"]'),
                $ = {
                    Html: function(t, e, n) {
                        var i = {
                            mount: function() {
                                this.root = t.selector, this.track = this.root.querySelector('[data-glide-el="track"]'), this.collectSlides()
                            },
                            collectSlides: function() {
                                this.slides = O(this.wrapper.children).filter((function(e) {
                                    return !e.classList.contains(t.settings.classes.slide.clone)
                                }))
                            }
                        };
                        return b(i, "root", {
                            get: function() {
                                return i._r
                            },
                            set: function(t) {
                                v(t) && (t = document.querySelector(t)), null !== t && (i._r = t)
                            }
                        }), b(i, "track", {
                            get: function() {
                                return i._t
                            },
                            set: function(t) {
                                i._t = t
                            }
                        }), b(i, "wrapper", {
                            get: function() {
                                return i.track.children[0]
                            }
                        }), n.on("update", (function() {
                            i.collectSlides()
                        })), i
                    },
                    Translate: function(t, e, n) {
                        var i = {
                            set: function(n) {
                                var i = function(t, e) {
                                        var n = [T, x, j, A].concat(t._t, [H]);
                                        return {
                                            mutate: function(i) {
                                                for (var r = 0; r < n.length; r++) {
                                                    var o = n[r];
                                                    m(o) && m(o().modify) && (i = o(t, e, void 0).modify(i))
                                                }
                                                return i
                                            }
                                        }
                                    }(t, e).mutate(n),
                                    r = "translate3d(".concat(-1 * i, "px, 0px, 0px)");
                                e.Html.wrapper.style.mozTransform = r, e.Html.wrapper.style.webkitTransform = r, e.Html.wrapper.style.transform = r
                            },
                            remove: function() {
                                e.Html.wrapper.style.transform = ""
                            },
                            getStartIndex: function() {
                                var n = e.Sizes.length,
                                    i = t.index,
                                    r = t.settings.perView;
                                return e.Run.isOffset(">") || e.Run.isOffset("|>") ? n + (i - r) : (i + r) % n
                            },
                            getTravelDistance: function() {
                                var n = e.Sizes.slideWidth * t.settings.perView;
                                return e.Run.isOffset(">") || e.Run.isOffset("|>") ? -1 * n : n
                            }
                        };
                        return n.on("move", (function(r) {
                            if (!t.isType("carousel") || !e.Run.isOffset()) return i.set(r.movement);
                            e.Transition.after((function() {
                                n.emit("translate.jump"), i.set(e.Sizes.slideWidth * t.index)
                            }));
                            var o = e.Sizes.slideWidth * e.Translate.getStartIndex();
                            return i.set(o - e.Translate.getTravelDistance())
                        })), n.on("destroy", (function() {
                            i.remove()
                        })), i
                    },
                    Transition: function(t, e, n) {
                        var i = !1,
                            r = {
                                compose: function(e) {
                                    var n = t.settings;
                                    return i ? "".concat(e, " 0ms ").concat(n.animationTimingFunc) : "".concat(e, " ").concat(this.duration, "ms ").concat(n.animationTimingFunc)
                                },
                                set: function(t) {
                                    var n = arguments.length > 0 && void 0 !== t ? t : "transform";
                                    e.Html.wrapper.style.transition = this.compose(n)
                                },
                                remove: function() {
                                    e.Html.wrapper.style.transition = ""
                                },
                                after: function(t) {
                                    setTimeout((function() {
                                        t()
                                    }), this.duration)
                                },
                                enable: function() {
                                    i = !1, this.set()
                                },
                                disable: function() {
                                    i = !0, this.set()
                                }
                            };
                        return b(r, "duration", {
                            get: function() {
                                var n = t.settings;
                                return t.isType("slider") && e.Run.offset ? n.rewindDuration : n.animationDuration
                            }
                        }), n.on("move", (function() {
                            r.set()
                        })), n.on(["build.before", "resize", "translate.jump"], (function() {
                            r.disable()
                        })), n.on("run", (function() {
                            r.enable()
                        })), n.on("destroy", (function() {
                            r.remove()
                        })), r
                    },
                    Direction: function(t, e, n) {
                        var i = {
                            mount: function() {
                                this.value = t.settings.direction
                            },
                            resolve: function(t) {
                                var e = t.slice(0, 1);
                                return this.is("rtl") ? t.split(e).join(V[e]) : t
                            },
                            is: function(t) {
                                return this.value === t
                            },
                            addClass: function() {
                                e.Html.root.classList.add(t.settings.classes.direction[this.value])
                            },
                            removeClass: function() {
                                e.Html.root.classList.remove(t.settings.classes.direction[this.value])
                            }
                        };
                        return b(i, "value", {
                            get: function() {
                                return i._v
                            },
                            set: function(t) {
                                I.indexOf(t) > -1 && (i._v = t)
                            }
                        }), n.on(["destroy", "update"], (function() {
                            i.removeClass()
                        })), n.on("update", (function() {
                            i.mount()
                        })), n.on(["build.before", "update"], (function() {
                            i.addClass()
                        })), i
                    },
                    Peek: function(t, e, n) {
                        var i = {
                            mount: function() {
                                this.value = t.settings.peek
                            }
                        };
                        return b(i, "value", {
                            get: function() {
                                return i._v
                            },
                            set: function(t) {
                                p(t) ? (t.before = h(t.before), t.after = h(t.after)) : t = h(t), i._v = t
                            }
                        }), b(i, "reductor", {
                            get: function() {
                                var e = i.value,
                                    n = t.settings.perView;
                                return p(e) ? e.before / n + e.after / n : 2 * e / n
                            }
                        }), n.on(["resize", "update"], (function() {
                            i.mount()
                        })), i
                    },
                    Sizes: function(t, e, n) {
                        var i = {
                            setupSlides: function() {
                                for (var t = "".concat(this.slideWidth, "px"), n = e.Html.slides, i = 0; i < n.length; i++) n[i].style.width = t
                            },
                            setupWrapper: function() {
                                e.Html.wrapper.style.width = "".concat(this.wrapperSize, "px")
                            },
                            remove: function() {
                                for (var t = e.Html.slides, n = 0; n < t.length; n++) t[n].style.width = "";
                                e.Html.wrapper.style.width = ""
                            }
                        };
                        return b(i, "length", {
                            get: function() {
                                return e.Html.slides.length
                            }
                        }), b(i, "width", {
                            get: function() {
                                return e.Html.track.offsetWidth
                            }
                        }), b(i, "wrapperSize", {
                            get: function() {
                                return i.slideWidth * i.length + e.Gaps.grow + e.Clones.grow
                            }
                        }), b(i, "slideWidth", {
                            get: function() {
                                return i.width / t.settings.perView - e.Peek.reductor - e.Gaps.reductor
                            }
                        }), n.on(["build.before", "resize", "update"], (function() {
                            i.setupSlides(), i.setupWrapper()
                        })), n.on("destroy", (function() {
                            i.remove()
                        })), i
                    },
                    Gaps: function(t, e, n) {
                        var i = {
                            apply: function(t) {
                                for (var n = 0, i = t.length; n < i; n++) {
                                    var r = t[n].style,
                                        o = e.Direction.value;
                                    r[W[o][0]] = 0 !== n ? "".concat(this.value / 2, "px") : "", n !== t.length - 1 ? r[W[o][1]] = "".concat(this.value / 2, "px") : r[W[o][1]] = ""
                                }
                            },
                            remove: function(t) {
                                for (var e = 0, n = t.length; e < n; e++) {
                                    var i = t[e].style;
                                    i.marginLeft = "", i.marginRight = ""
                                }
                            }
                        };
                        return b(i, "value", {
                            get: function() {
                                return h(t.settings.gap)
                            }
                        }), b(i, "grow", {
                            get: function() {
                                return i.value * e.Sizes.length
                            }
                        }), b(i, "reductor", {
                            get: function() {
                                var e = t.settings.perView;
                                return i.value * (e - 1) / e
                            }
                        }), n.on(["build.after", "update"], k((function() {
                            i.apply(e.Html.wrapper.children)
                        }), 30)), n.on("destroy", (function() {
                            i.remove(e.Html.wrapper.children)
                        })), i
                    },
                    Move: function(t, e, n) {
                        var i = {
                            mount: function() {
                                this._o = 0
                            },
                            make: function(t) {
                                var i = this,
                                    r = arguments.length > 0 && void 0 !== t ? t : 0;
                                this.offset = r, n.emit("move", {
                                    movement: this.value
                                }), e.Transition.after((function() {
                                    n.emit("move.after", {
                                        movement: i.value
                                    })
                                }))
                            }
                        };
                        return b(i, "offset", {
                            get: function() {
                                return i._o
                            },
                            set: function(t) {
                                i._o = g(t) ? 0 : h(t)
                            }
                        }), b(i, "translate", {
                            get: function() {
                                return e.Sizes.slideWidth * t.index
                            }
                        }), b(i, "value", {
                            get: function() {
                                var t = this.offset,
                                    n = this.translate;
                                return e.Direction.is("rtl") ? n + t : n - t
                            }
                        }), n.on(["build.before", "run"], (function() {
                            i.make()
                        })), i
                    },
                    Clones: function(t, e, n) {
                        var i = {
                            mount: function() {
                                this.items = [], t.isType("carousel") && (this.items = this.collect())
                            },
                            collect: function(n) {
                                var i = arguments.length > 0 && void 0 !== n ? n : [],
                                    r = e.Html.slides,
                                    o = t.settings,
                                    s = o.perView,
                                    u = o.classes,
                                    a = o.cloningRatio;
                                if (r.length > 0)
                                    for (var c = s + +!!t.settings.peek + Math.round(s / 2), l = r.slice(0, c).reverse(), f = r.slice(-1 * c), d = 0; d < Math.max(a, Math.floor(s / r.length)); d++) {
                                        for (var h = 0; h < l.length; h++) {
                                            var v = l[h].cloneNode(!0);
                                            v.classList.add(u.slide.clone), i.push(v)
                                        }
                                        for (var p = 0; p < f.length; p++) {
                                            var m = f[p].cloneNode(!0);
                                            m.classList.add(u.slide.clone), i.unshift(m)
                                        }
                                    }
                                return i
                            },
                            append: function() {
                                for (var t = this.items, n = e.Html, i = n.wrapper, r = n.slides, o = Math.floor(t.length / 2), s = t.slice(0, o).reverse(), u = t.slice(-1 * o).reverse(), a = "".concat(e.Sizes.slideWidth, "px"), c = 0; c < u.length; c++) i.appendChild(u[c]);
                                for (var l = 0; l < s.length; l++) i.insertBefore(s[l], r[0]);
                                for (var f = 0; f < t.length; f++) t[f].style.width = a
                            },
                            remove: function() {
                                for (var t = this.items, n = 0; n < t.length; n++) e.Html.wrapper.removeChild(t[n])
                            }
                        };
                        return b(i, "grow", {
                            get: function() {
                                return (e.Sizes.slideWidth + e.Gaps.value) * i.items.length
                            }
                        }), n.on("update", (function() {
                            i.remove(), i.mount(), i.append()
                        })), n.on("build.before", (function() {
                            t.isType("carousel") && i.append()
                        })), n.on("destroy", (function() {
                            i.remove()
                        })), i
                    },
                    Resize: function(t, e, n) {
                        var i = new B,
                            r = {
                                mount: function() {
                                    this.bind()
                                },
                                bind: function() {
                                    i.on("resize", window, k((function() {
                                        n.emit("resize")
                                    }), t.settings.throttle))
                                },
                                unbind: function() {
                                    i.off("resize", window)
                                }
                            };
                        return n.on("destroy", (function() {
                            r.unbind(), i.destroy()
                        })), r
                    },
                    Build: function(t, e, n) {
                        var i = {
                            mount: function() {
                                n.emit("build.before"), this.typeClass(), this.activeClass(), n.emit("build.after")
                            },
                            typeClass: function() {
                                e.Html.root.classList.add(t.settings.classes.type[t.settings.type])
                            },
                            activeClass: function() {
                                var n = t.settings.classes,
                                    i = e.Html.slides[t.index];
                                i && (i.classList.add(n.slide.active), S(i).forEach((function(t) {
                                    t.classList.remove(n.slide.active)
                                })))
                            },
                            removeClasses: function() {
                                var n = t.settings.classes,
                                    i = n.type,
                                    r = n.slide;
                                e.Html.root.classList.remove(i[t.settings.type]), e.Html.slides.forEach((function(t) {
                                    t.classList.remove(r.active)
                                }))
                            }
                        };
                        return n.on(["destroy", "update"], (function() {
                            i.removeClasses()
                        })), n.on(["resize", "update"], (function() {
                            i.mount()
                        })), n.on("move.after", (function() {
                            i.activeClass()
                        })), i
                    },
                    Run: function(t, e, n) {
                        var i = {
                            mount: function() {
                                this._o = !1
                            },
                            make: function(i) {
                                var r = this;
                                t.disabled || (!t.settings.waitForTransition || t.disable(), this.move = i, n.emit("run.before", this.move), this.calculate(), n.emit("run", this.move), e.Transition.after((function() {
                                    r.isStart() && n.emit("run.start", r.move), r.isEnd() && n.emit("run.end", r.move), r.isOffset() && (r._o = !1, n.emit("run.offset", r.move)), n.emit("run.after", r.move), t.enable()
                                })))
                            },
                            calculate: function() {
                                var e = this.move,
                                    n = this.length,
                                    r = e.steps,
                                    o = e.direction,
                                    s = 1;
                                if ("=" === o) return t.settings.bound && h(r) > n ? void(t.index = n) : void(t.index = r);
                                if (">" !== o || ">" !== r)
                                    if ("<" !== o || "<" !== r) {
                                        if ("|" === o && (s = t.settings.perView || 1), ">" === o || "|" === o && ">" === r) {
                                            var u = function(e) {
                                                var n = t.index;
                                                return t.isType("carousel") ? n + e : n + (e - n % e)
                                            }(s);
                                            return u > n && (this._o = !0), void(t.index = function(e, n) {
                                                var r = i.length;
                                                return e <= r ? e : t.isType("carousel") ? e - (r + 1) : t.settings.rewind ? i.isBound() && !i.isEnd() ? r : 0 : i.isBound() ? r : Math.floor(r / n) * n
                                            }(u, s))
                                        }
                                        if ("<" === o || "|" === o && "<" === r) {
                                            var a = function(e) {
                                                var n = t.index;
                                                return t.isType("carousel") ? n - e : (Math.ceil(n / e) - 1) * e
                                            }(s);
                                            return a < 0 && (this._o = !0), void(t.index = function(e, n) {
                                                var r = i.length;
                                                return e >= 0 ? e : t.isType("carousel") ? e + (r + 1) : t.settings.rewind ? i.isBound() && i.isStart() ? r : Math.floor(r / n) * n : 0
                                            }(a, s))
                                        }
                                        "Invalid direction pattern [".concat(o).concat(r, "] has been used")
                                    } else t.index = 0;
                                else t.index = n
                            },
                            isStart: function() {
                                return t.index <= 0
                            },
                            isEnd: function() {
                                return t.index >= this.length
                            },
                            isOffset: function(t) {
                                var e = arguments.length > 0 && void 0 !== t ? t : void 0;
                                return e ? !!this._o && ("|>" === e ? "|" === this.move.direction && ">" === this.move.steps : "|<" === e ? "|" === this.move.direction && "<" === this.move.steps : this.move.direction === e) : this._o
                            },
                            isBound: function() {
                                return t.isType("slider") && "center" !== t.settings.focusAt && t.settings.bound
                            }
                        };
                        return b(i, "move", {
                            get: function() {
                                return this._m
                            },
                            set: function(t) {
                                var e = t.substr(1);
                                this._m = {
                                    direction: t.substr(0, 1),
                                    steps: e ? h(e) ? h(e) : e : 0
                                }
                            }
                        }), b(i, "length", {
                            get: function() {
                                var n = t.settings,
                                    i = e.Html.slides.length;
                                return this.isBound() ? i - 1 - (h(n.perView) - 1) + h(n.focusAt) : i - 1
                            }
                        }), b(i, "offset", {
                            get: function() {
                                return this._o
                            }
                        }), i
                    }
                },
                tt = function(t) {
                    function e() {
                        return s(this, e), r.apply(this, arguments)
                    }! function(t, e) {
                        if ("function" != typeof e && null !== e) throw new TypeError("Super expression must either be null or a function");
                        t.prototype = Object.create(e && e.prototype, {
                            constructor: {
                                value: t,
                                writable: !0,
                                configurable: !0
                            }
                        }), e && f(t, e)
                    }(e, t);
                    var n, i, r = (n = e, i = function() {
                        if ("undefined" == typeof Reflect || !Reflect.construct) return !1;
                        if (Reflect.construct.sham) return !1;
                        if ("function" == typeof Proxy) return !0;
                        try {
                            return Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], (function() {}))), !0
                        } catch (t) {
                            return !1
                        }
                    }(), function() {
                        var t, e = l(n);
                        if (i) {
                            var r = l(this).constructor;
                            t = Reflect.construct(e, arguments, r)
                        } else t = e.apply(this, arguments);
                        return function(t, e) {
                            if (e && ("object" == typeof e || "function" == typeof e)) return e;
                            if (void 0 !== e) throw new TypeError("Derived constructors may only return object or undefined");
                            return function(t) {
                                if (void 0 === t) throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
                                return t
                            }(t)
                        }(this, t)
                    });
                    return a(e, [{
                        key: "mount",
                        value: function(t) {
                            var n = arguments.length > 0 && void 0 !== t ? t : {};
                            return d(l(e.prototype), "mount", this).call(this, Object.assign({}, $, n))
                        }
                    }]), e
                }(D)
        }
    }
]);