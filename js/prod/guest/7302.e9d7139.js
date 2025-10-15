(self.webpackChunkeva_dav = self.webpackChunkeva_dav || []).push([
    [7302], {
        3666: function(e, t, n) {
            function l() {
                function e(e) {
                    this === e.target && this.classList.contains("open") && (this.removeAttribute("style"), this.style.setProperty("overflow", "visible"))
                }

                function t(e, t) {
                    function l(e, t, n) {
                        e.style.setProperty(t, n)
                    }
                    let i = e.parentNode,
                        s = e.offsetHeight + "px";
                    t ? (l(i, "overflow", "hidden"), n ? (l(i, "height", s), i.classList.remove("open"), setTimeout((() => {
                        l(i, "height", "0")
                    }), 32)) : (i.classList.remove("open"), l(i, "height", "0"))) : (n ? (l(i, "overflow", "hidden"), l(i, "height", s)) : (l(i, "height", "auto"), l(i, "overflow", "visible")), i.classList.add("open"))
                }
                const n = !matchMedia("(prefers-reduced-motion: reduce)").matches;
                document.querySelectorAll(".accordion__h:not(.accordion-init)").forEach((l => {
                    l.classList.add("accordion-init"), l.addEventListener("click", (function() {
                        let e = this.closest(".accordions"),
                            n = this.nextElementSibling.firstElementChild;
                        null !== e && (e.querySelectorAll(".accordion__h.open").forEach((e => {
                            this !== e && (e.classList.remove("open"), t(e.nextElementSibling.firstElementChild, !0))
                        })), e = null), this.classList.toggle("open"), this.classList.contains("open") ? t(n, !1) : t(n, !0), n = null
                    })), n && l.nextElementSibling.addEventListener("transitionend", e)
                }))
            }
            n.d(t, {
                A: function() {
                    return l
                }
            })
        },
        6883: function(e, t, n) {
            function l() {
                let e = document.querySelectorAll(".follow-block:not(.init)"),
                    t = e.length;
                if (0 !== t) {
                    const n = !matchMedia("(prefers-reduced-motion: reduce)").matches;
                    let l = [],
                        s = innerHeight,
                        o = innerWidth;

                    function r() {
                        this.classList.add("anim-end"), this.removeEventListener("animationend", r)
                    }

                    function a() {
                        null !== l && l.forEach(((i, o) => {
                            null !== i && !e[o].classList.contains("in-sight") && i <= s + pageYOffset && (n ? e[o].addEventListener("animationend", r) : e[o].classList.add("anim-end"), e[o].classList.add("in-sight"), l[o] = null), o === t - 1 && 0 === Math.max(...l) && (removeEventListener("scroll", c), l = null, e = null)
                        }))
                    }

                    function c() {
                        a()
                    }
                    e.forEach((e => {
                        e.classList.add("init"), l.push(e.getBoundingClientRect().top + pageYOffset)
                    })), addEventListener("scroll", c), a(), (0, i.A)((t => {
                        o !== t && (o = t, null !== e && (removeEventListener("scroll", c), s = innerHeight, e.forEach(((e, t) => {
                            e.classList.contains("in-sight") ? l[t] = null : l[t] = e.getBoundingClientRect().top + pageYOffset
                        })), addEventListener("scroll", c), a()))
                    }))
                } else e = null
            }
            n.d(t, {
                A: function() {
                    return l
                }
            });
            var i = n(5554)
        },
        2025: function(e, t, n) {
            function l() {
                let e = document.querySelectorAll(".lazy-load:not(.init)");
                if (0 !== e.length) {
                    const t = document.body.classList.contains("support-webp");
                    let n = innerHeight,
                        l = innerWidth,
                        s = [];

                    function o() {
                        this.classList.add("ready"), this.removeEventListener("load", o)
                    }

                    function r() {
                        null !== s && s.forEach(((l, i) => {
                            null !== l && !e[i].classList.contains("has-listener") && l <= n + pageYOffset && (e[i].classList.add("has-listener"), "IMG" === e[i].tagName && e[i].addEventListener("load", o), t && e[i].classList.contains("has-webp") ? e[i].src = e[i].dataset.src.replace(/\.jpg|\.png/, ".webp") : e[i].src = e[i].dataset.src, s[i] = null, 0 === Math.max(...s) && (removeEventListener("scroll", a), s = null, e = null))
                        }))
                    }

                    function a() {
                        r()
                    }
                    e.forEach((e => {
                        e.classList.add("init"), s.push(e.getBoundingClientRect().top + pageYOffset)
                    })), addEventListener("scroll", a), r(), (0, i.A)((t => {
                        l !== t && (l = t, null !== e && (removeEventListener("scroll", a), n = innerHeight, e.forEach(((e, t) => {
                            e.classList.contains("ready") ? s[t] = null : s[t] = e.getBoundingClientRect().top + pageYOffset
                        })), addEventListener("scroll", a), r()))
                    }))
                } else e = null
            }
            n.d(t, {
                A: function() {
                    return l
                }
            });
            var i = n(5554)
        },
        631: function(e, t, n) {
            function l() {
                (0, o.A)();
                let e = document.querySelectorAll(".odometer:not(.init)");
                if (matchMedia("(prefers-reduced-motion: reduce)").matches || 0 === e.length) e = null;
                else {
                    let t = [],
                        n = innerHeight,
                        l = innerWidth;

                    function i() {
                        null !== t && t.forEach(((l, i) => {
                            if (null !== l && !e[i].classList.contains("has-listener") && l <= n + pageYOffset) {
                                let n = parseFloat(e[i].textContent);
                                e[i].classList.add("has-listener");
                                let l = new(s())({
                                    el: e[i],
                                    value: 0
                                });
                                l.update(n), l.stopWatchingMutations(), l = null, t[i] = null, 0 === Math.max(...t) && (removeEventListener("scroll", a), t = null, e = null)
                            }
                        }))
                    }

                    function a() {
                        i()
                    }
                    e.forEach((e => {
                        e.classList.add("init"), t.push(e.getBoundingClientRect().top + pageYOffset)
                    })), addEventListener("scroll", a), i(), (0, r.A)((s => {
                        l !== s && (l = s, null !== e && (removeEventListener("scroll", a), n = innerHeight, e.forEach(((e, n) => {
                            e.classList.contains("odometer-run") ? t[n] = null : t[n] = e.getBoundingClientRect().top + pageYOffset
                        })), addEventListener("scroll", a), i()))
                    }))
                }
            }
            n.d(t, {
                A: function() {
                    return l
                }
            });
            var i = n(6975),
                s = n.n(i),
                o = n(6830),
                r = n(5554)
        },
        7302: function(e, t, n) {
            var l = n(2332),
                i = n(631),
                s = n(3666),
                o = n(2025),
                r = n(6883),
                a = n(8109),
                c = n(5554),
                d = n(1486),
                u = n(6200),
                f = n(2833);
            ! function() {
                function e() {
                    l.go(this.dataset.goTo)
                }

                function t(e) {
                    768 <= n && 0 === e.steps && (e.steps = -4)
                }
                document.querySelectorAll(".leading__slider .glide__arrow").forEach((t => {
                    t.addEventListener("click", e)
                }));
                let n = innerWidth,
                    l = null;
                const i = {
                    type: "slider",
                    bound: !0,
                    focusAt: 0,
                    autoplay: 3e3,
                    animationTimingFunc: "ease",
                    animationDuration: matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 600,
                    hoverpause: !1,
                    perView: 4,
                    gap: 0
                };
                767 >= n && (i.type = "carousel", i.focusAt = "center", i.perView = 3), 424 >= n && (i.perView = 2), 767 >= n && (l = new a.Ay(".leading__slider", i).on("run.before", t).mount({
                    Autoplay: a.Ij,
                    Swipe: a.Hp
                })), (0, c.A)((e => {
                    n !== e && (n = e, 767 >= n && (i.type = "carousel", i.focusAt = "center", i.perView = 3), 424 >= n && (i.perView = 2), 768 <= n ? null !== l && (l.destroy(), l = null) : (null !== l && (l.destroy(), l = null), l = new a.Ay(".leading__slider", i).on("run.before", t).mount({
                        Autoplay: a.Ij,
                        Swipe: a.Hp
                    })))
                }), 320)
            }(),
            function() {
                function e() {
                    this.classList.add("ready"), this.play(), this.removeEventListener("loadeddata", e)
                }

                function t() {
                    i.go(this.dataset.goTo)
                }

                function n() {
                    let e = document.querySelectorAll(".formats__i"),
                        t = e[i._i],
                        n = t.querySelector(".formats__i-video");
                    document.querySelectorAll(".formats__nav-i").forEach((e => {
                        e.classList.remove("active")
                    })), e.forEach((e => {
                        e.classList.remove("show")
                    })), n.classList.contains("ready") ? n.play() : n.src = n.dataset.src, i._c.Html.slides[i._i].firstElementChild.classList.add("active"), t.classList.add("show"), n = null, t = null, e = null
                }

                function l() {
                    let e = document.querySelectorAll(".formats__i"),
                        t = e[this.dataset.index].querySelector(".formats__i-video");
                    this.closest(".glide__slides").querySelectorAll(".formats__nav-i").forEach((e => {
                        e.classList.remove("active")
                    })), e.forEach((e => {
                        e.classList.remove("show")
                    })), this.closest(".formats").querySelectorAll(".formats__i-video").forEach((e => {
                        e.pause()
                    })), t.classList.contains("ready") ? t.play() : t.src = t.dataset.src, this.classList.add("active"), e[this.dataset.index].classList.add("show"), t = null, e = null
                }
                let i, s = innerWidth;
                const o = {
                    type: "carousel",
                    animationTimingFunc: "ease",
                    focusAt: "center",
                    animationDuration: matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 600,
                    perView: 2,
                    gap: 16
                };
                let r = !1,
                    d = !1;
                document.querySelectorAll(".formats__i-video").forEach((t => {
                    t.addEventListener("loadeddata", e)
                })), document.querySelector(".formats__nav-i").classList.add("active"), 768 > s ? (r = !0, document.querySelectorAll(".formats__nav .glide__arrow").forEach((e => {
                    e.addEventListener("click", t)
                })), i = new a.Ay(".formats__nav", o).on("run.after", n).mount({
                    Swipe: a.Hp
                })) : (d = !0, document.querySelectorAll(".formats__nav-i").forEach((e => {
                    e.addEventListener("click", l)
                }))), (0, c.A)((e => {
                    s !== e && (s = e, 768 > s ? r || (r = !0, d = !1, document.querySelectorAll(".formats__nav-i").forEach((e => {
                        e.removeEventListener("click", l)
                    })), document.querySelectorAll(".formats__nav .glide__arrow").forEach((e => {
                        e.addEventListener("click", t)
                    })), i = new a.Ay(".formats__nav", o).on("run.after", n).mount({
                        Swipe: a.Hp
                    }), i.go("=" + document.querySelector(".formats__nav-i.active").dataset.index)) : d || (d = !0, r = !1, document.querySelectorAll(".formats__nav .glide__arrow").forEach((e => {
                        e.removeEventListener("click", t)
                    })), i.destroy(), i = void 0, document.querySelectorAll(".formats__nav-i").forEach((e => {
                        e.addEventListener("click", l)
                    }))))
                }))
            }(),
            function() {
                function e(e, t, n) {
                    e.style.setProperty("width", t + "px"), e.style.setProperty("transform", "translateX(" + n + "px)")
                }

                function t() {
                    this.classList.add("ready"), this.removeEventListener("load", t)
                }

                function n() {
                    let e = [];
                    document.querySelectorAll(".benefits__i").forEach((t => {
                        t.removeAttribute("style"), e.push(t.offsetHeight), t.style.setProperty("height", "100%")
                    })), document.querySelector(".benefits__slider .glide__slides").style.setProperty("height", Math.max(...e) + 100 + "px"), e = null
                }

                function l() {
                    s.go(this.dataset.goTo)
                }

                function i() {
                    document.querySelectorAll(".benefits__slider .glide__bullet").forEach((e => {
                        e.classList.remove("glide__bullet--active")
                    })), document.querySelector(".benefits__slider .glide__bullets").children[s._i].classList.add("glide__bullet--active")
                }
                let s;
                const o = {
                    type: "carousel",
                    animationTimingFunc: "ease",
                    animationDuration: matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 600,
                    focusAt: "center",
                    perView: 2,
                    gap: 0,
                    breakpoints: {
                        767: {
                            perView: 1
                        }
                    }
                };
                let r = !1,
                    d = !1,
                    u = innerWidth,
                    f = document.querySelectorAll(".benefits__type-btn");
                f.forEach(((n, l) => {
                    0 === l && e(n.parentNode.querySelector(".benefits__type-slider"), n.offsetWidth, n.offsetLeft), n.addEventListener("click", (function() {
                        if (!this.classList.contains("active")) {
                            let n = document.querySelector(".benefits__slider");
                            f.forEach((e => {
                                e.classList.remove("active")
                            })), e(this.parentNode.querySelector(".benefits__type-slider"), this.offsetWidth, this.offsetLeft), document.querySelectorAll(".arg .benefits__i-ic:not(.ready)").forEach((e => {
                                e.addEventListener("load", t), e.src = e.dataset.src
                            })), this.classList.add("active"), n.classList.toggle("pub"), n.classList.toggle("arg"), n = null
                        }
                    }))
                }));
                let _ = document.createDocumentFragment();
                document.querySelectorAll(".benefits__slider .glide__slide").forEach(((e, t) => {
                    let n = document.createElement("div");
                    n.addEventListener("click", l), n.classList.add("glide__bullet"), n.dataset.goTo = "=" + t, 0 === t && n.classList.add("glide__bullet--active"), _.appendChild(n), n = null
                })), document.querySelector(".benefits__slider .glide__bullets").appendChild(_), _ = null, 1110 > u ? (r = !0, document.querySelectorAll(".benefits__slider .glide__arrow").forEach((e => {
                    e.addEventListener("click", l)
                })), s = new a.Ay(".benefits__slider", o).on("build.after", (function() {
                    n()
                })).on("run", i).mount({
                    Breakpoints: a.Rp,
                    Swipe: a.Hp
                })) : (d = !0, n()), (0, c.A)((t => {
                    if (u !== t) {
                        u = t, 1110 > u ? r || (r = !0, d = !1, document.querySelectorAll(".benefits__slider .glide__arrow").forEach((e => {
                            e.addEventListener("click", l)
                        })), s = new a.Ay(".benefits__slider", o).on("build.after", (function() {
                            n()
                        })).on("run", i).mount({
                            Breakpoints: a.Rp,
                            Swipe: a.Hp
                        })) : d || (d = !0, r = !1, document.querySelectorAll(".benefits__slider .glide__arrow").forEach((e => {
                            e.removeEventListener("click", l)
                        })), s.destroy(), s = void 0, n());
                        let c = document.querySelector(".benefits__type-btn.active");
                        e(c.parentNode.querySelector(".benefits__type-slider"), c.offsetWidth, c.offsetLeft), c = null
                    }
                }))
            }(),
            function() {
                function e() {
                    this.classList.add("ready"), this.removeEventListener("load", e)
                }

                function t(e) {
                    let t = document.createDocumentFragment();
                    e.querySelectorAll(".glide__slide").forEach(((e, l) => {
                        let i = document.createElement("div");
                        i.addEventListener("click", (function() {
                            n.go(this.dataset.goTo)
                        })), i.classList.add("glide__bullet"), i.dataset.goTo = "=" + l, 0 === l && i.classList.add("glide__bullet--active"), t.appendChild(i), i = null
                    })), e.querySelector(".glide__bullets").appendChild(t), t = null;
                    let n = new a.Ay(e, {
                        autoplay: 3e3,
                        type: "carousel",
                        animationTimingFunc: "ease",
                        animationDuration: matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 600,
                        hoverpause: !1,
                        gap: 0,
                        dragThreshold: !1
                    }).on("run", (function() {
                        e.querySelectorAll(".glide__bullet").forEach((e => {
                            e.classList.remove("glide__bullet--active")
                        })), e.querySelector(".glide__bullets").children[n._i].classList.add("glide__bullet--active")
                    })).mount({
                        Autoplay: a.Ij,
                        Swipe: a.Hp
                    })
                }
                let n = document.querySelectorAll(".panel__slider-w-img");
                n.forEach((e => {
                    e.addEventListener("click", (function() {
                        if (!this.classList.contains("disabled")) {
                            function e() {
                                t.insertContent(l), t.open(), this.removeEventListener("load", e), l = null
                            }
                            n.forEach((e => {
                                e.classList.add("disabled")
                            }));
                            let t = new d.A("panel__popup", (() => {
                                    t = null, n.forEach((e => {
                                        e.classList.remove("disabled")
                                    })), i = null
                                })),
                                l = document.createDocumentFragment(),
                                i = document.createElement("img");
                            i.addEventListener("load", e), i.classList.add("panel__popup-img"), i.src = this.dataset.bigImg, i.alt = "image", l.appendChild(i)
                        }
                    }))
                })), t(document.querySelector(".panel__slider.show")), document.querySelectorAll(".panel__info-i-h").forEach((n => {
                    n.addEventListener("click", (function() {
                        if (document.querySelectorAll(".panel__slider").forEach((e => {
                                e.classList.remove("show")
                            })), this.classList.contains("arg") && document.querySelector(".panel__slider.arg").classList.add("show"), this.classList.contains("pub")) {
                            let n = document.querySelector(".panel__slider.pub");
                            n.classList.add("show"), n.classList.contains("glide--swipeable") || (t(n), n.querySelectorAll(".panel__slider-img:not(ready)").forEach((t => {
                                t.addEventListener("load", e), t.src = t.dataset.src
                            }))), n = null
                        }
                    }))
                }))
            }(), (0, i.A)(), null !== document.querySelector(".blog") && function() {
                    function e() {
                        document.querySelectorAll(".blog__slider .glide__bullet").forEach((e => {
                            e.classList.remove("glide__bullet--active")
                        })), document.querySelector(".blog__slider .glide__bullets").children[t._i].classList.add("glide__bullet--active")
                    }
                    let t;
                    const n = {
                        type: "carousel",
                        animationTimingFunc: "ease",
                        animationDuration: 600,
                        perView: 1,
                        gap: 0
                    };
                    let l = !1,
                        i = !1,
                        s = innerWidth,
                        o = document.createDocumentFragment();
                    document.querySelectorAll(".blog__i").forEach(((e, n) => {
                        let l = document.createElement("div");
                        l.addEventListener("click", (function() {
                            t.go(this.dataset.goTo)
                        })), l.classList.add("glide__bullet"), l.dataset.goTo = "=" + n, 0 === n && l.classList.add("glide__bullet--active"), o.appendChild(l), l = null
                    })), document.querySelector(".blog__slider .glide__bullets").appendChild(o), o = null, 768 > s ? (l = !0, t = new a.Ay(".blog__slider", n).on("run", e).mount({
                        Swipe: a.Hp
                    })) : i = !0, (0, c.A)((o => {
                        s !== o && (s = o, 768 > s ? l || (l = !0, i = !1, t = new a.Ay(".blog__slider", n).on("run", e).mount({
                            Swipe: a.Hp
                        })) : i || (i = !0, l = !1, t.destroy(), t = void 0))
                    }))
                }(),
                function() {
                    function e() {
                        (0 == o._i % 4 || o._i >= 11) && (document.querySelectorAll(".payment__slider .glide__bullet").forEach((e => {
                            e.classList.remove("glide__bullet--active")
                        })), document.querySelector(".payment__slider .glide__bullets").children[o._i].classList.add("glide__bullet--active"))
                    }

                    function t() {
                        o.go(this.dataset.goTo)
                    }

                    function n(e) {
                        768 <= i && 0 === e.steps && (e.steps = -4)
                    }
                    let l = document.createDocumentFragment();
                    document.querySelectorAll(".payment__i").forEach(((e, n) => {
                        let i = document.createElement("div");
                        i.addEventListener("click", t), i.classList.add("glide__bullet"), i.dataset.goTo = "=" + n, 0 === n && i.classList.add("glide__bullet--active"), l.appendChild(i), i = null
                    })), document.querySelector(".payment__slider .glide__bullets").appendChild(l), l = null, document.querySelectorAll(".payment__slider .glide__arrow").forEach((e => {
                        e.addEventListener("click", t)
                    }));
                    let i = innerWidth;
                    const s = {
                        type: "slider",
                        bound: !0,
                        focusAt: 0,
                        autoplay: 3e3,
                        animationTimingFunc: "ease",
                        animationDuration: matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 600,
                        hoverpause: !1,
                        perView: 4,
                        gap: 0
                    };
                    767 >= i && (s.type = "carousel", s.focusAt = "center", s.perView = 3), 424 >= i && (s.perView = 2);
                    let o = new a.Ay(".payment__slider", s).on("run.before", n).on("run", e).mount({
                        Autoplay: a.Ij,
                        Swipe: a.Hp
                    });
                    (0, c.A)((t => {
                        i !== t && (i = t, 767 >= i && (s.type = "carousel", s.focusAt = "center", s.perView = 3), 424 >= i && (s.perView = 2), 768 <= i && (s.type = "slider", s.focusAt = 0, s.perView = 4), o.destroy(), o = null, o = new a.Ay(".payment__slider", s).on("run.before", n).on("run", e).mount({
                            Autoplay: a.Ij,
                            Swipe: a.Hp
                        }))
                    }), 320)
                }(), (0, l.A)(), (0, s.A)(), (0, o.A)(), (0, r.A)(), (0, u.A)(), null !== new URL(location.href).searchParams.get("reset-password") && (0, f.A)(null, new URL(location.href).searchParams.get("reset-password"))
        },
        6830: function(e, t, n) {
            function l() {
                document.querySelectorAll(".odometer:not(.init-rounding)").forEach((e => {
                    e.classList.add("init-rounding");
                    let t = "",
                        n = "",
                        l = parseInt(e.textContent, 10);
                    1e9 <= l ? (t = "b", n = (parseInt(l.toString().slice(0, -7), 10) / 100).toFixed(1)) : 1e6 <= l ? (t = "m", n = (parseInt(l.toString().slice(0, -4), 10) / 100).toFixed(1)) : 1e3 <= l ? (t = "k", n = (parseInt(l.toString().slice(0, -2), 10) / 10).toFixed(1)) : n = l.toString(), -1 !== n.indexOf(".") && "0" === n[n.length - 1] && (n = n.slice(0, -2)), e.textContent = n, null !== e.nextElementSibling && (e.nextElementSibling.textContent = t)
                }))
            }
            n.d(t, {
                A: function() {
                    return l
                }
            })
        }
    }
]);