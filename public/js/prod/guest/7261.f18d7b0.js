(self.webpackChunkeva_dav = self.webpackChunkeva_dav || []).push([
    [7261], {
        6200: function(e, t, s) {
            function r() {
                null !== document.getElementById("template-form-login") ? (document.querySelectorAll(".is-btn-login").forEach(((e, t, s) => {
                    e.addEventListener("click", (function() {
                        let e;
                        s.forEach((e => {
                            e.disabled = !0
                        }));
                        let t = new n.A(null, (() => {
                                t = null, r = null, s.forEach((e => {
                                    e.disabled = !1
                                })), grecaptcha.reset(e), e = null
                            })),
                            r = document.getElementById("template-form-login").content.querySelector(".form-login").cloneNode(!0);
                        r.addEventListener("submit", (function(s) {
                            s.preventDefault(), "" !== this.ga_code.value || "" !== grecaptcha.getResponse(e) ? (this.querySelector(".my-form__is").disabled = !0, function(s) {
                                function r() {
                                    this.parentNode.classList.remove("error"), this.classList.remove("error"), this.classList.remove("has-listener"), this.removeEventListener("input", r)
                                }

                                function o() {
                                    let e = [s.email, s.password];
                                    s.querySelector(".form-login__error-msg").hidden = !0, this.classList.add("hide"), s.ga_code.parentNode.classList.add("hide"), s.ga_code.parentNode.classList.remove("showed"), s.ga_code.value = "", s.ga_code.disabled = !0, s.ga_code.dispatchEvent(new Event("input")), e.forEach((e => {
                                        e.classList.remove("error"), e.parentNode.classList.remove("error", "hide")
                                    })), e = null, s.querySelector(".my-form__group.it-recaptcha").classList.remove("hide"), this.removeEventListener("click", o)
                                }
                                fetch(s.action, {
                                    method: "post",
                                    credentials: "same-origin",
                                    body: new FormData(s)
                                }).then((n => n.json().then((n => {
                                    let l = [s.email, s.password, s.ga_code];
                                    if (l.forEach((e => {
                                            e.classList.contains("has-listener") || (e.classList.add("has-listener"), e.addEventListener("input", r))
                                        })), l = null, null !== n) {
                                        if (void 0 !== n.route) location.href = n.route;
                                        else if (void 0 !== n.userActivationEmail) t.close(), (0, a.A)(n.message);
                                        else if (void 0 !== n.needGA) {
                                            let e = s.ga_code.parentNode,
                                                t = [s.email, s.password];
                                            e.classList.contains("showed") ? (s.querySelector(".form-login__error-msg").textContent = n.message.system || n.message, s.querySelector(".form-login__error-msg").hidden = !1, e.classList.add("error"), s.ga_code.classList.add("error")) : (s.querySelector(".form-login__error-msg").hidden = !0, e.classList.add("showed")), t.forEach((e => {
                                                e.parentNode.classList.add("hide"), e.dispatchEvent(new Event("input"))
                                            })), s.querySelector(".form-login__btn-back").addEventListener("click", o), s.ga_code.disabled = !1, e.classList.remove("hide"), s.querySelector(".form-login__btn-back").classList.remove("hide"), s.querySelector(".my-form__is").disabled = !1, s.querySelector(".my-form__group.it-recaptcha").classList.add("hide"), t = null, e = null
                                        } else {
                                            let e = [s.email, s.password];
                                            s.querySelector(".form-login__error-msg").textContent = n.message.system || n.message, s.querySelector(".form-login__error-msg").hidden = !1, e.forEach((e => {
                                                e.parentNode.classList.add("error"), e.classList.add("error")
                                            })), s.querySelector(".my-form__is").disabled = !1, e = null
                                        }
                                        n = null
                                    }
                                    grecaptcha.reset(e)
                                })))).catch((() => {
                                    s.querySelector(".my-form__is").disabled = !1
                                }))
                            }(this)) : this.querySelector(".my-form__w-recaptcha").classList.add("error")
                        })), r.querySelector(".is-btn-forgot-password").addEventListener("click", (function() {
                            let e = null;
                            r.email.checkValidity() && (e = r.email.value), t.close(), (0, i.A)(e)
                        })), t.insertContent(r), t.open(), this.blur(), (0, l.A)((t => {
                            e = (0, o.A)(t, "login-recaptcha", (e => {
                                r.reCaptcha.value = e, r.querySelector(".my-form__w-recaptcha").classList.remove("error")
                            }))
                        }))
                    }))
                })), -1 !== location.search.indexOf("login") && document.querySelector(".is-btn-login").dispatchEvent(new Event("click"))) : document.querySelectorAll(".is-btn-login").forEach((e => {
                    e.addEventListener("click", (function() {
                        location.href = document.querySelector(".is-lk-go-cabinet").href
                    }))
                }))
            }
            s.d(t, {
                A: function() {
                    return r
                }
            });
            var o = s(8355),
                n = s(1486),
                l = s(5888),
                i = s(2833),
                a = s(5229)
        },
        2833: function(e, t, s) {
            function r(e, t) {
                let s, r = new o.A(null, (() => {
                        r = null, i = null, grecaptcha.reset(s), s = null
                    })),
                    i = document.getElementById("template-reset-password").content.querySelector(".form-password-reset").cloneNode(!0);
                null !== e && (i.email.value = e), i.addEventListener("submit", (function(e) {
                    e.preventDefault(), "" !== grecaptcha.getResponse(s) ? (this.querySelector(".my-form__is").disabled = !0, function(e) {
                        function n() {
                            this.parentNode.classList.remove("error"), this.classList.remove("error"), this.classList.remove("has-listener"), this.removeEventListener("input", n)
                        }
                        let l = "";
                        "string" == typeof t && (l = "?token=" + t), fetch(e.action + l, {
                            method: "post",
                            credentials: "same-origin",
                            body: new FormData(e)
                        }).then((l => l.json().then((l => {
                            "string" == typeof t && (e.password.classList.contains("has-listener") || (e.password.classList.add("has-listener"), e.password.addEventListener("input", n))), null !== l && ("success" === l.status ? (r.close(), function(e, t = !1) {
                                let s = new o.A(null, (() => {
                                        r = null, s = null
                                    })),
                                    r = document.getElementById("template-reset-password-popup").content.querySelector(".password-reset-popup").cloneNode(!0);
                                t ? (r.querySelector(".is-saved").classList.add("it-show"), r.querySelector(".password-reset-popup__btn-login").addEventListener("click", (function() {
                                    s.close(), document.querySelector(".is-btn-login").dispatchEvent(new Event("click"))
                                })), r.querySelector(".password-reset-popup__btn-login").classList.add("it-show")) : r.querySelector(".is-recovery").classList.add("it-show"), r.querySelector(".password-reset-popup__tx").textContent = e, s.insertContent(r), s.open()
                            }(l.message, "string" == typeof t)) : "error" === l.status && (e.querySelector(".form-password-reset__error-msg").textContent = l.message.system || l.message, e.querySelector(".form-password-reset__error-msg").hidden = !1, "string" == typeof t && (e.password.parentNode.classList.add("error"), e.password.classList.add("error")))), e.querySelector(".my-form__is").disabled = !1, grecaptcha.reset(s), l = null
                        })))).catch((() => {
                            e.querySelector(".my-form__is").disabled = !1
                        }))
                    }(this)) : this.querySelector(".my-form__w-recaptcha").classList.add("error")
                })), i.querySelector(".is-btn-login").addEventListener("click", (function() {
                    r.close(), document.querySelector(".is-btn-login").dispatchEvent(new Event("click"))
                })), r.insertContent(i), "string" == typeof t && (i.email.parentNode.classList.add("hide"), i.email.disabled = !0, i.password.parentNode.classList.remove("hide"), i.password.disabled = !1), r.open(), (0, n.A)((e => {
                    s = (0, l.A)(e, "reset-password-recaptcha", (e => {
                        i.reCaptcha.value = e, i.querySelector(".my-form__w-recaptcha").classList.remove("error")
                    }))
                }))
            }
            s.d(t, {
                A: function() {
                    return r
                }
            });
            var o = s(1486),
                n = s(5888),
                l = s(8355)
        },
        5229: function(e, t, s) {
            function r(e) {
                let t, s = new o.A("msg-email-activate__popup", (() => {
                        void 0 !== t && clearTimeout(t), s = null
                    })),
                    r = document.getElementById("template-msg-email-activate").content.querySelector(".msg-email-activate").cloneNode(!0);
                "1" === r.dataset.id || "3" === r.dataset.id ? r.querySelector(".msg-email-activate__w-tx.is-short").hidden = !1 : r.querySelector(".msg-email-activate__w-tx.is-full").hidden = !1, r.querySelector(".msg-email-activate__tx.response").innerHTML = e, r.querySelectorAll(".is-btn-resend").forEach((e => {
                    e.addEventListener("click", (function() {
                        this.disabled = !0, void 0 !== t && clearTimeout(t);
                        let e = new FormData;
                        e.set(document.getElementById("csrf-token").name, document.getElementById("csrf-token").value), fetch("/site/resend", {
                            method: "post",
                            credentials: "same-origin",
                            body: e
                        }).then((e => e.json().then((e => {
                            if (null !== e) {
                                let s = r.querySelector(".msg-email-activate__msg-info");
                                s.textContent = e.message, "success" === e.status ? (s.classList.remove("error"), s.classList.add("success")) : (s.classList.remove("success"), s.classList.add("error")), s.hidden = !1, t = setTimeout((() => {
                                    s.hidden = !0, s = null
                                }), 4e3)
                            }
                            this.disabled = !1, e = null
                        })))).catch((() => {
                            this.disabled = !1
                        })), e = null
                    }))
                })), s.insertContent(r), s.open()
            }
            s.d(t, {
                A: function() {
                    return r
                }
            });
            var o = s(1486)
        },
        1486: function(e, t, s) {
            function r(e, t) {
                this.template = document.getElementById("template-popup").content.querySelector(".my-popup").cloneNode(!0), this.open = function() {
                    document.addEventListener("keydown", this.closeEsc), document.body.classList.add("no-scroll"), null !== e && this.template.classList.add(e), document.body.appendChild(this.template), this.template.classList.add("open")
                }, this.closeEsc = e => {
                    27 === e.keyCode && this.close()
                }, this.close = function() {
                    if (document.body.classList.contains("mobile-menu-open") || document.body.classList.remove("no-scroll"), document.removeEventListener("keydown", this.closeEsc), this.template.classList.remove("open"), document.body.removeChild(this.template), this.template = null, void 0 !== t) return t()
                }, this.insertContent = function(e) {
                    this.template.querySelector(".my-popup__cnt").appendChild(e)
                }, this.template.querySelectorAll(".my-popup__bg, .my-popup__btn-close").forEach((e => {
                    e.addEventListener("click", (() => {
                        this.close()
                    }))
                }))
            }
            s.d(t, {
                A: function() {
                    return r
                }
            })
        },
        5888: function(e, t, s) {
            function r(e) {
                let t = document.getElementById("re-captcha");
                if (null === t) return window.grecaptcha = {
                    getResponse() {
                        return "1"
                    },
                    reset() {
                        return !1
                    },
                    render() {
                        return "1"
                    }
                }, e(null);
                if (t.classList.contains("ready")) return e(t.value); {
                    window.recaptchaOnloadCallback = function() {
                        return t.classList.add("ready"), e(t.value)
                    };
                    let s = document.createElement("script");
                    s.async = !0, s.src = "https://www.google.com/recaptcha/api.js?render=explicit&onload=recaptchaOnloadCallback", document.body.appendChild(s), s = null
                }
            }
            s.d(t, {
                A: function() {
                    return r
                }
            })
        },
        8355: function(e, t, s) {
            function r(e, t, s, r) {
                return grecaptcha.render(t, {
                    sitekey: e,
                    callback: s,
                    "expired-callback": r
                })
            }
            s.d(t, {
                A: function() {
                    return r
                }
            })
        },
        2332: function(e, t, s) {
            function r() {
                document.getElementById("my-loading").classList.add("hide"), document.body.classList.remove("no-scroll")
            }
            s.d(t, {
                A: function() {
                    return r
                }
            })
        }
    }
]);