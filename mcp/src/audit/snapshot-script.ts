/*
 * The script an agent runs in the page to hand audit_ui what the browser rendered: one expression,
 * no imports, so it runs unchanged through Playwright's page.evaluate, a browser tool's javascript
 * call or the devtools console. It walks the DOM from the body (or a selector), keeps what is
 * seen, folds wrappers that add nothing, and reads each box off getComputedStyle and its rect.
 * Agents pay for every byte of the result, so it omits whatever is empty or default.
 */

const body = String.raw`(function (rootSelector, maxNodes) {
    var root = rootSelector ? document.querySelector(rootSelector) : document.body;
    if (!root) return { note: 'No element matches ' + rootSelector + '.' };
    var limit = maxNodes || 1500;
    var count = 0;
    var truncated = false;
    var SKIP = { script: 1, style: 1, noscript: 1, template: 1, link: 1, meta: 1, head: 1, title: 1, br: 1, wbr: 1 };
    var GRAPHIC = { svg: 1, img: 1, canvas: 1, video: 1, picture: 1, iframe: 1 };
    var INTERACTIVE_ROLES = { button: 1, tab: 1, menuitem: 1, link: 1, checkbox: 1, switch: 1, option: 1, radio: 1, combobox: 1, textbox: 1, slider: 1, menuitemcheckbox: 1, menuitemradio: 1 };
    var round = function (n) { return Math.round(n * 10) / 10; };
    var num = function (v) { var n = parseFloat(v); return isFinite(n) ? round(n) : 0; };
    var clear = function (c) {
        return !c || c === 'transparent' || /^rgba\([^)]*,\s*0\)$/.test(c) || /\/\s*0%?\s*\)$/.test(c);
    };
    var implicitRole = function (el, tag) {
        if (tag === 'a') return el.hasAttribute('href') ? 'link' : '';
        if (tag === 'button') return 'button';
        if (tag === 'input') {
            var type = (el.getAttribute('type') || 'text').toLowerCase();
            if (type === 'checkbox') return 'checkbox';
            if (type === 'radio') return 'radio';
            if (type === 'range') return 'slider';
            if (type === 'button' || type === 'submit' || type === 'reset' || type === 'image') return 'button';
            if (type === 'search') return 'searchbox';
            if (type === 'number') return 'spinbutton';
            return 'textbox';
        }
        var map = { select: el.multiple ? 'listbox' : 'combobox', textarea: 'textbox', table: 'table', tr: 'row', th: 'columnheader', td: 'cell', ul: 'list', ol: 'list', li: 'listitem', nav: 'navigation', dialog: 'dialog', hr: 'separator', progress: 'progressbar', meter: 'meter', img: 'img', main: 'main', form: 'form', h1: 'heading', h2: 'heading', h3: 'heading', h4: 'heading', h5: 'heading', h6: 'heading' };
        return map[tag] || '';
    };
    var ownText = function (el) {
        var text = '';
        for (var i = 0; i < el.childNodes.length; i++) {
            var n = el.childNodes[i];
            if (n.nodeType === 3) text += n.textContent;
        }
        return text.replace(/\s+/g, ' ').trim().slice(0, 120);
    };
    var short = function (s, n) { s = (s || '').replace(/\s+/g, ' ').trim(); return s.length > n ? s.slice(0, n - 1) + '…' : s; };
    var cssPath = function (el) {
        var parts = [];
        var node = el;
        for (var depth = 0; node && node.nodeType === 1 && depth < 4; depth++) {
            var tag = node.tagName.toLowerCase();
            if (node.id && /^[A-Za-z][\w-]*$/.test(node.id)) { parts.unshift(tag + '#' + node.id); break; }
            var parent = node.parentElement;
            var part = tag;
            if (parent) {
                var same = 0, index = 0;
                for (var i = 0; i < parent.children.length; i++) {
                    if (parent.children[i].tagName === node.tagName) { same++; if (parent.children[i] === node) index = same; }
                }
                if (same > 1) part += ':nth-of-type(' + index + ')';
            }
            parts.unshift(part);
            if (node === root) break;
            node = parent;
        }
        return parts.join(' > ');
    };
    var shortFile = function (file) {
        file = String(file).replace(/\\/g, '/').replace(/[?#].*$/, '');
        var at = file.search(/\/(src|app|components|pages|lib)\//);
        return at >= 0 ? file.slice(at + 1) : file.split('/').slice(-2).join('/');
    };
    var sourceOf = function (el) {
        try {
            for (var key in el) {
                if (key.indexOf('__reactFiber$') === 0) {
                    var fiber = el[key];
                    if (fiber._debugSource) return shortFile(fiber._debugSource.fileName) + ':' + fiber._debugSource.lineNumber;
                    for (var f = fiber.return, i = 0; f && i < 20; f = f.return, i++) {
                        if (f._debugSource && typeof f.type === 'function') return shortFile(f._debugSource.fileName) + ':' + f._debugSource.lineNumber;
                        if (typeof f.type === 'function' || (f.type && typeof f.type === 'object' && f.type.render)) {
                            var t = f.type.render || f.type;
                            var name = f.type.displayName || t.displayName || t.name;
                            if (name) return name;
                        }
                    }
                    return '';
                }
            }
            if (el.__svelte_meta && el.__svelte_meta.loc) return shortFile(el.__svelte_meta.loc.file) + ':' + el.__svelte_meta.loc.line;
            if (el.__vueParentComponent && el.__vueParentComponent.type) {
                var v = el.__vueParentComponent.type;
                return v.__file ? shortFile(v.__file) : (v.__name || v.name || '');
            }
            if (el.__vue__ && el.__vue__.$options) return el.__vue__.$options.__file ? shortFile(el.__vue__.$options.__file) : (el.__vue__.$options.name || '');
            var ng = window.ng;
            if (ng && ng.getComponent) {
                var own = ng.getComponent(el);
                if (own) return own.constructor.name;
                var host = ng.getOwningComponent && ng.getOwningComponent(el);
                if (host) return host.constructor.name;
            }
        } catch (e) { }
        return '';
    };
    var radius = function (cs, w, h) {
        var corner = function (v) {
            var first = String(v).split(' ')[0];
            if (first.indexOf('%') > 0) return round(Math.min(w, h) * parseFloat(first) / 100);
            return num(first);
        };
        var r = [corner(cs.borderTopLeftRadius), corner(cs.borderTopRightRadius), corner(cs.borderBottomRightRadius), corner(cs.borderBottomLeftRadius)];
        if (r[0] === r[1] && r[1] === r[2] && r[2] === r[3]) return r[0] || undefined;
        return r;
    };
    var border = function (cs) {
        var sides = [];
        var width = 0, color = '';
        ['top', 'right', 'bottom', 'left'].forEach(function (side) {
            var cap = side[0].toUpperCase() + side.slice(1);
            var w = num(cs['border' + cap + 'Width']);
            var s = cs['border' + cap + 'Style'];
            var c = cs['border' + cap + 'Color'];
            if (w > 0 && s !== 'none' && s !== 'hidden' && !clear(c)) {
                sides.push(side);
                if (w > width) width = w;
                if (!color) color = c;
            }
        });
        if (!sides.length) return undefined;
        var out = { width: width, color: color };
        var style = cs.borderTopStyle;
        if (style && style !== 'solid' && style !== 'none') out.style = style;
        if (sides.length < 4) out.sides = sides;
        return out;
    };
    var isInteractive = function (el, tag, role, cs, parentCursor) {
        if (tag === 'button' || tag === 'select' || tag === 'textarea') return true;
        if (tag === 'input') return (el.getAttribute('type') || '') !== 'hidden';
        if (tag === 'a' && el.hasAttribute('href')) return true;
        if (INTERACTIVE_ROLES[role]) return true;
        if (el.hasAttribute('tabindex') && el.tabIndex >= 0) return true;
        if (el.onclick || el.hasAttribute('onclick')) return true;
        return cs.cursor === 'pointer' && parentCursor !== 'pointer';
    };

    var walk = function (el, parentSource, parentCursor, depth) {
        var tag = el.tagName.toLowerCase();
        if (SKIP[tag]) return null;
        var cs = getComputedStyle(el);
        if (cs.display === 'none' || cs.visibility === 'hidden' || cs.visibility === 'collapse' || parseFloat(cs.opacity) === 0) return null;
        var rect = el.getBoundingClientRect();
        var contents = cs.display === 'contents';
        if (!contents && rect.width < 1 && rect.height < 1 && cs.overflow !== 'visible') return null;
        if (count >= limit) { truncated = true; return null; }
        count++;

        var node = { tag: tag };
        var explicitRole = el.getAttribute('role') || '';
        var role = explicitRole || implicitRole(el, tag);
        if (role) node.role = role;
        var text = (tag === 'input' || tag === 'textarea') ? short(el.value || el.getAttribute('placeholder') || '', 120) : ownText(el);
        if (tag === 'select' && el.selectedOptions && el.selectedOptions[0]) text = short(el.selectedOptions[0].textContent, 120);
        if (text) node.content = text;
        var interactive = isInteractive(el, tag, role, cs, parentCursor);
        var name = el.getAttribute('aria-label') || el.getAttribute('title') || el.getAttribute('alt') || '';
        if (!name && interactive && !text) name = short(el.innerText || el.textContent, 60);
        if (name) node.name = short(name, 60);
        var classes = typeof el.className === 'string' ? el.className : (el.getAttribute('class') || '');
        classes = short(classes, 160);
        var slot = el.getAttribute('data-slot');
        if (slot) classes += ' data-slot=' + slot;
        if (el.disabled || el.getAttribute('aria-disabled') === 'true') classes += ' [disabled]';
        classes = classes.trim();
        if (classes) node.classes = classes;
        node.id = cssPath(el);
        var source = sourceOf(el);
        if (source && source !== parentSource) node.source = source;

        var box = { x: round(rect.left + window.scrollX), y: round(rect.top + window.scrollY), width: round(rect.width), height: round(rect.height) };
        ['Top', 'Right', 'Bottom', 'Left'].forEach(function (side) {
            var p = num(cs['padding' + side]);
            if (p) box['padding' + side] = p;
        });
        if (/flex|grid/.test(cs.display)) {
            var rg = num(cs.rowGap), cg = num(cs.columnGap);
            if (rg && cg && rg !== cg) { box.rowGap = rg; box.columnGap = cg; }
            else if (rg || cg) box.gap = rg || cg;
        }
        var r = radius(cs, rect.width, rect.height);
        if (r) box.radius = r;
        node.box = box;
        if (!clear(cs.backgroundColor)) node.fill = cs.backgroundColor;
        var b = border(cs);
        if (b) node.border = b;
        if (cs.boxShadow && cs.boxShadow !== 'none') node.shadow = cs.boxShadow;
        if (text || tag === 'input' || tag === 'textarea' || tag === 'select') {
            var font = { size: num(cs.fontSize), weight: Number(cs.fontWeight) || 400, family: short(cs.fontFamily, 60), color: cs.color };
            if (cs.lineHeight !== 'normal') font.lineHeight = num(cs.lineHeight);
            if (cs.letterSpacing !== 'normal' && num(cs.letterSpacing)) font.letterSpacing = num(cs.letterSpacing);
            node.font = font;
        }
        var layout = {};
        if (cs.display !== 'block' && cs.display !== 'inline') layout.display = cs.display;
        if (cs.display === 'inline') layout.display = 'inline';
        if (/flex/.test(cs.display)) layout.direction = cs.flexDirection.indexOf('column') === 0 ? 'column' : 'row';
        if (cs.position !== 'static') layout.position = cs.position;
        if (cs.zIndex !== 'auto') layout.zIndex = Number(cs.zIndex);
        if (parseFloat(cs.opacity) < 1) layout.opacity = round(parseFloat(cs.opacity));
        for (var k in layout) { node.layout = layout; break; }
        if (interactive) node.interactive = true;

        var children = [];
        if (!GRAPHIC[tag] && depth < 60) {
            var kids = el.shadowRoot ? el.shadowRoot.children : el.children;
            for (var i = 0; i < kids.length; i++) {
                var child = walk(kids[i], source || parentSource, cs.cursor, depth + 1);
                if (child) children.push(child);
            }
        }
        if (children.length) node.children = children;

        // A wrapper that adds nothing (no fill, line, shadow, padding, text, role or action) folds into its one child.
        var plain = !node.fill && !node.border && !node.shadow && !text && !interactive && !explicitRole && !slot && !GRAPHIC[tag] &&
            !box.paddingTop && !box.paddingRight && !box.paddingBottom && !box.paddingLeft && (tag === 'div' || tag === 'span' || contents);
        if (plain && children.length === 1) { count--; if (node.source && !children[0].source) children[0].source = node.source; return children[0]; }
        if (plain && !children.length) { count--; return null; }
        return node;
    };

    var tree = walk(root, '', 'auto', 0) || { tag: root.tagName.toLowerCase() };
    var html = document.documentElement;
    var dark = /dark/.test((html.getAttribute('data-mode') || '') + ' ' + (html.getAttribute('data-theme') || '') + ' ' + html.className) ||
        !!document.querySelector('[data-mode="dark"]');
    tree.mode = dark ? 'dark' : 'light';
    tree.viewport = { width: window.innerWidth, height: window.innerHeight };
    if (truncated) tree.note = 'The snapshot stopped at ' + limit + ' nodes; pass a root selector to audit one part of the page.';
    return tree;
})`;

/** The script as one expression, run against the body or the element `root` selects. */
export const snapshotScript = (root?: string, maxNodes?: number) =>
    `${body}(${JSON.stringify(root ?? null)}, ${maxNodes ?? 1500})`;

export const SNAPSHOT_SCRIPT = snapshotScript();
