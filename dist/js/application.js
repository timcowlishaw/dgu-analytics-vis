(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/*!
  * domready (c) Dustin Diaz 2014 - License MIT
  */
!function (name, definition) {

  if (typeof module != 'undefined') module.exports = definition()
  else if (typeof define == 'function' && typeof define.amd == 'object') define(definition)
  else this[name] = definition()

}('domready', function () {

  var fns = [], listener
    , doc = document
    , hack = doc.documentElement.doScroll
    , domContentLoaded = 'DOMContentLoaded'
    , loaded = (hack ? /^loaded|^c/ : /^loaded|^i|^c/).test(doc.readyState)


  if (!loaded)
  doc.addEventListener(domContentLoaded, listener = function () {
    doc.removeEventListener(domContentLoaded, listener)
    loaded = 1
    while (listener = fns.shift()) listener()
  })

  return function (fn) {
    loaded ? fn() : fns.push(fn)
  }

});

},{}],2:[function(require,module,exports){
/*
Slick Finder
*/"use strict"

// Notable changes from Slick.Finder 1.0.x

// faster bottom -> up expression matching
// prefers mental sanity over *obsessive compulsive* milliseconds savings
// uses prototypes instead of objects
// tries to use matchesSelector smartly, whenever available
// can populate objects as well as arrays
// lots of stuff is broken or not implemented

var parse = require("./parser")

// utilities

var index = 0,
    counter = document.__counter = (parseInt(document.__counter || -1, 36) + 1).toString(36),
    key = "uid:" + counter

var uniqueID = function(n, xml){
    if (n === window) return "window"
    if (n === document) return "document"
    if (n === document.documentElement) return "html"

    if (xml) {
        var uid = n.getAttribute(key)
        if (!uid) {
            uid = (index++).toString(36)
            n.setAttribute(key, uid)
        }
        return uid
    } else {
        return n[key] || (n[key] = (index++).toString(36))
    }
}

var uniqueIDXML = function(n) {
    return uniqueID(n, true)
}

var isArray = Array.isArray || function(object){
    return Object.prototype.toString.call(object) === "[object Array]"
}

// tests

var uniqueIndex = 0;

var HAS = {

    GET_ELEMENT_BY_ID: function(test, id){
        id = "slick_" + (uniqueIndex++);
        // checks if the document has getElementById, and it works
        test.innerHTML = '<a id="' + id + '"></a>'
        return !!this.getElementById(id)
    },

    QUERY_SELECTOR: function(test){
        // this supposedly fixes a webkit bug with matchesSelector / querySelector & nth-child
        test.innerHTML = '_<style>:nth-child(2){}</style>'

        // checks if the document has querySelectorAll, and it works
        test.innerHTML = '<a class="MiX"></a>'

        return test.querySelectorAll('.MiX').length === 1
    },

    EXPANDOS: function(test, id){
        id = "slick_" + (uniqueIndex++);
        // checks if the document has elements that support expandos
        test._custom_property_ = id
        return test._custom_property_ === id
    },

    // TODO: use this ?

    // CHECKED_QUERY_SELECTOR: function(test){
    //
    //     // checks if the document supports the checked query selector
    //     test.innerHTML = '<select><option selected="selected">a</option></select>'
    //     return test.querySelectorAll(':checked').length === 1
    // },

    // TODO: use this ?

    // EMPTY_ATTRIBUTE_QUERY_SELECTOR: function(test){
    //
    //     // checks if the document supports the empty attribute query selector
    //     test.innerHTML = '<a class=""></a>'
    //     return test.querySelectorAll('[class*=""]').length === 1
    // },

    MATCHES_SELECTOR: function(test){

        test.className = "MiX"

        // checks if the document has matchesSelector, and we can use it.

        var matches = test.matchesSelector || test.mozMatchesSelector || test.webkitMatchesSelector

        // if matchesSelector trows errors on incorrect syntax we can use it
        if (matches) try {
            matches.call(test, ':slick')
        } catch(e){
            // just as a safety precaution, also test if it works on mixedcase (like querySelectorAll)
            return matches.call(test, ".MiX") ? matches : false
        }

        return false
    },

    GET_ELEMENTS_BY_CLASS_NAME: function(test){
        test.innerHTML = '<a class="f"></a><a class="b"></a>'
        if (test.getElementsByClassName('b').length !== 1) return false

        test.firstChild.className = 'b'
        if (test.getElementsByClassName('b').length !== 2) return false

        // Opera 9.6 getElementsByClassName doesnt detects the class if its not the first one
        test.innerHTML = '<a class="a"></a><a class="f b a"></a>'
        if (test.getElementsByClassName('a').length !== 2) return false

        // tests passed
        return true
    },

    // no need to know

    // GET_ELEMENT_BY_ID_NOT_NAME: function(test, id){
    //     test.innerHTML = '<a name="'+ id +'"></a><b id="'+ id +'"></b>'
    //     return this.getElementById(id) !== test.firstChild
    // },

    // this is always checked for and fixed

    // STAR_GET_ELEMENTS_BY_TAG_NAME: function(test){
    //
    //     // IE returns comment nodes for getElementsByTagName('*') for some documents
    //     test.appendChild(this.createComment(''))
    //     if (test.getElementsByTagName('*').length > 0) return false
    //
    //     // IE returns closed nodes (EG:"</foo>") for getElementsByTagName('*') for some documents
    //     test.innerHTML = 'foo</foo>'
    //     if (test.getElementsByTagName('*').length) return false
    //
    //     // tests passed
    //     return true
    // },

    // this is always checked for and fixed

    // STAR_QUERY_SELECTOR: function(test){
    //
    //     // returns closed nodes (EG:"</foo>") for querySelector('*') for some documents
    //     test.innerHTML = 'foo</foo>'
    //     return !!(test.querySelectorAll('*').length)
    // },

    GET_ATTRIBUTE: function(test){
        // tests for working getAttribute implementation
        var shout = "fus ro dah"
        test.innerHTML = '<a class="' + shout + '"></a>'
        return test.firstChild.getAttribute('class') === shout
    }

}

// Finder

var Finder = function Finder(document){

    this.document        = document
    var root = this.root = document.documentElement
    this.tested          = {}

    // uniqueID

    this.uniqueID = this.has("EXPANDOS") ? uniqueID : uniqueIDXML

    // getAttribute

    this.getAttribute = (this.has("GET_ATTRIBUTE")) ? function(node, name){

        return node.getAttribute(name)

    } : function(node, name){

        node = node.getAttributeNode(name)
        return (node && node.specified) ? node.value : null

    }

    // hasAttribute

    this.hasAttribute = (root.hasAttribute) ? function(node, attribute){

        return node.hasAttribute(attribute)

    } : function(node, attribute) {

        node = node.getAttributeNode(attribute)
        return !!(node && node.specified)

    }

    // contains

    this.contains = (document.contains && root.contains) ? function(context, node){

        return context.contains(node)

    } : (root.compareDocumentPosition) ? function(context, node){

        return context === node || !!(context.compareDocumentPosition(node) & 16)

    } : function(context, node){

        do {
            if (node === context) return true
        } while ((node = node.parentNode))

        return false
    }

    // sort
    // credits to Sizzle (http://sizzlejs.com/)

    this.sorter = (root.compareDocumentPosition) ? function(a, b){

        if (!a.compareDocumentPosition || !b.compareDocumentPosition) return 0
        return a.compareDocumentPosition(b) & 4 ? -1 : a === b ? 0 : 1

    } : ('sourceIndex' in root) ? function(a, b){

        if (!a.sourceIndex || !b.sourceIndex) return 0
        return a.sourceIndex - b.sourceIndex

    } : (document.createRange) ? function(a, b){

        if (!a.ownerDocument || !b.ownerDocument) return 0
        var aRange = a.ownerDocument.createRange(),
            bRange = b.ownerDocument.createRange()

        aRange.setStart(a, 0)
        aRange.setEnd(a, 0)
        bRange.setStart(b, 0)
        bRange.setEnd(b, 0)
        return aRange.compareBoundaryPoints(Range.START_TO_END, bRange)

    } : null

    this.failed = {}

    var nativeMatches = this.has("MATCHES_SELECTOR")

    if (nativeMatches) this.matchesSelector = function(node, expression){

        if (this.failed[expression]) return null

        try {
            return nativeMatches.call(node, expression)
        } catch(e){
            if (slick.debug) console.warn("matchesSelector failed on " + expression)
            this.failed[expression] = true
            return null
        }

    }

    if (this.has("QUERY_SELECTOR")){

        this.querySelectorAll = function(node, expression){

            if (this.failed[expression]) return true

            var result, _id, _expression, _combinator, _node


            // non-document rooted QSA
            // credits to Andrew Dupont

            if (node !== this.document){

                _combinator = expression[0].combinator

                _id         = node.getAttribute("id")
                _expression = expression

                if (!_id){
                    _node = node
                    _id = "__slick__"
                    _node.setAttribute("id", _id)
                }

                expression = "#" + _id + " " + _expression


                // these combinators need a parentNode due to how querySelectorAll works, which is:
                // finding all the elements that match the given selector
                // then filtering by the ones that have the specified element as an ancestor
                if (_combinator.indexOf("~") > -1 || _combinator.indexOf("+") > -1){

                    node = node.parentNode
                    if (!node) result = true
                    // if node has no parentNode, we return "true" as if it failed, without polluting the failed cache

                }

            }

            if (!result) try {
                result = node.querySelectorAll(expression.toString())
            } catch(e){
                if (slick.debug) console.warn("querySelectorAll failed on " + (_expression || expression))
                result = this.failed[_expression || expression] = true
            }

            if (_node) _node.removeAttribute("id")

            return result

        }

    }

}

Finder.prototype.has = function(FEATURE){

    var tested        = this.tested,
        testedFEATURE = tested[FEATURE]

    if (testedFEATURE != null) return testedFEATURE

    var root     = this.root,
        document = this.document,
        testNode = document.createElement("div")

    testNode.setAttribute("style", "display: none;")

    root.appendChild(testNode)

    var TEST = HAS[FEATURE], result = false

    if (TEST) try {
        result = TEST.call(document, testNode)
    } catch(e){}

    if (slick.debug && !result) console.warn("document has no " + FEATURE)

    root.removeChild(testNode)

    return tested[FEATURE] = result

}

var combinators = {

    " ": function(node, part, push){

        var item, items

        var noId = !part.id, noTag = !part.tag, noClass = !part.classes

        if (part.id && node.getElementById && this.has("GET_ELEMENT_BY_ID")){
            item = node.getElementById(part.id)

            // return only if id is found, else keep checking
            // might be a tad slower on non-existing ids, but less insane

            if (item && item.getAttribute('id') === part.id){
                items = [item]
                noId = true
                // if tag is star, no need to check it in match()
                if (part.tag === "*") noTag = true
            }
        }

        if (!items){

            if (part.classes && node.getElementsByClassName && this.has("GET_ELEMENTS_BY_CLASS_NAME")){
                items = node.getElementsByClassName(part.classList)
                noClass = true
                // if tag is star, no need to check it in match()
                if (part.tag === "*") noTag = true
            } else {
                items = node.getElementsByTagName(part.tag)
                // if tag is star, need to check it in match because it could select junk, boho
                if (part.tag !== "*") noTag = true
            }

            if (!items || !items.length) return false

        }

        for (var i = 0; item = items[i++];)
            if ((noTag && noId && noClass && !part.attributes && !part.pseudos) || this.match(item, part, noTag, noId, noClass))
                push(item)

        return true

    },

    ">": function(node, part, push){ // direct children
        if ((node = node.firstChild)) do {
            if (node.nodeType == 1 && this.match(node, part)) push(node)
        } while ((node = node.nextSibling))
    },

    "+": function(node, part, push){ // next sibling
        while ((node = node.nextSibling)) if (node.nodeType == 1){
            if (this.match(node, part)) push(node)
            break
        }
    },

    "^": function(node, part, push){ // first child
        node = node.firstChild
        if (node){
            if (node.nodeType === 1){
                if (this.match(node, part)) push(node)
            } else {
                combinators['+'].call(this, node, part, push)
            }
        }
    },

    "~": function(node, part, push){ // next siblings
        while ((node = node.nextSibling)){
            if (node.nodeType === 1 && this.match(node, part)) push(node)
        }
    },

    "++": function(node, part, push){ // next sibling and previous sibling
        combinators['+'].call(this, node, part, push)
        combinators['!+'].call(this, node, part, push)
    },

    "~~": function(node, part, push){ // next siblings and previous siblings
        combinators['~'].call(this, node, part, push)
        combinators['!~'].call(this, node, part, push)
    },

    "!": function(node, part, push){ // all parent nodes up to document
        while ((node = node.parentNode)) if (node !== this.document && this.match(node, part)) push(node)
    },

    "!>": function(node, part, push){ // direct parent (one level)
        node = node.parentNode
        if (node !== this.document && this.match(node, part)) push(node)
    },

    "!+": function(node, part, push){ // previous sibling
        while ((node = node.previousSibling)) if (node.nodeType == 1){
            if (this.match(node, part)) push(node)
            break
        }
    },

    "!^": function(node, part, push){ // last child
        node = node.lastChild
        if (node){
            if (node.nodeType == 1){
                if (this.match(node, part)) push(node)
            } else {
                combinators['!+'].call(this, node, part, push)
            }
        }
    },

    "!~": function(node, part, push){ // previous siblings
        while ((node = node.previousSibling)){
            if (node.nodeType === 1 && this.match(node, part)) push(node)
        }
    }

}

Finder.prototype.search = function(context, expression, found){

    if (!context) context = this.document
    else if (!context.nodeType && context.document) context = context.document

    var expressions = parse(expression)

    // no expressions were parsed. todo: is this really necessary?
    if (!expressions || !expressions.length) throw new Error("invalid expression")

    if (!found) found = []

    var uniques, push = isArray(found) ? function(node){
        found[found.length] = node
    } : function(node){
        found[found.length++] = node
    }

    // if there is more than one expression we need to check for duplicates when we push to found
    // this simply saves the old push and wraps it around an uid dupe check.
    if (expressions.length > 1){
        uniques = {}
        var plush = push
        push = function(node){
            var uid = uniqueID(node)
            if (!uniques[uid]){
                uniques[uid] = true
                plush(node)
            }
        }
    }

    // walker

    var node, nodes, part

    main: for (var i = 0; expression = expressions[i++];){

        // querySelector

        // TODO: more functional tests

        // if there is querySelectorAll (and the expression does not fail) use it.
        if (!slick.noQSA && this.querySelectorAll){

            nodes = this.querySelectorAll(context, expression)
            if (nodes !== true){
                if (nodes && nodes.length) for (var j = 0; node = nodes[j++];) if (node.nodeName > '@'){
                    push(node)
                }
                continue main
            }
        }

        // if there is only one part in the expression we don't need to check each part for duplicates.
        // todo: this might be too naive. while solid, there can be expression sequences that do not
        // produce duplicates. "body div" for instance, can never give you each div more than once.
        // "body div a" on the other hand might.
        if (expression.length === 1){

            part = expression[0]
            combinators[part.combinator].call(this, context, part, push)

        } else {

            var cs = [context], c, f, u, p = function(node){
                var uid = uniqueID(node)
                if (!u[uid]){
                    u[uid] = true
                    f[f.length] = node
                }
            }

            // loop the expression parts
            for (var j = 0; part = expression[j++];){
                f = []; u = {}
                // loop the contexts
                for (var k = 0; c = cs[k++];) combinators[part.combinator].call(this, c, part, p)
                // nothing was found, the expression failed, continue to the next expression.
                if (!f.length) continue main
                cs = f // set the contexts for future parts (if any)
            }

            if (i === 0) found = f // first expression. directly set found.
            else for (var l = 0; l < f.length; l++) push(f[l]) // any other expression needs to push to found.
        }

    }

    if (uniques && found && found.length > 1) this.sort(found)

    return found

}

Finder.prototype.sort = function(nodes){
    return this.sorter ? Array.prototype.sort.call(nodes, this.sorter) : nodes
}

// TODO: most of these pseudo selectors include <html> and qsa doesnt. fixme.

var pseudos = {


    // TODO: returns different results than qsa empty.

    'empty': function(){
        return !(this && this.nodeType === 1) && !(this.innerText || this.textContent || '').length
    },

    'not': function(expression){
        return !slick.match(this, expression)
    },

    'contains': function(text){
        return (this.innerText || this.textContent || '').indexOf(text) > -1
    },

    'first-child': function(){
        var node = this
        while ((node = node.previousSibling)) if (node.nodeType == 1) return false
        return true
    },

    'last-child': function(){
        var node = this
        while ((node = node.nextSibling)) if (node.nodeType == 1) return false
        return true
    },

    'only-child': function(){
        var prev = this
        while ((prev = prev.previousSibling)) if (prev.nodeType == 1) return false

        var next = this
        while ((next = next.nextSibling)) if (next.nodeType == 1) return false

        return true
    },

    'first-of-type': function(){
        var node = this, nodeName = node.nodeName
        while ((node = node.previousSibling)) if (node.nodeName == nodeName) return false
        return true
    },

    'last-of-type': function(){
        var node = this, nodeName = node.nodeName
        while ((node = node.nextSibling)) if (node.nodeName == nodeName) return false
        return true
    },

    'only-of-type': function(){
        var prev = this, nodeName = this.nodeName
        while ((prev = prev.previousSibling)) if (prev.nodeName == nodeName) return false
        var next = this
        while ((next = next.nextSibling)) if (next.nodeName == nodeName) return false
        return true
    },

    'enabled': function(){
        return !this.disabled
    },

    'disabled': function(){
        return this.disabled
    },

    'checked': function(){
        return this.checked || this.selected
    },

    'selected': function(){
        return this.selected
    },

    'focus': function(){
        var doc = this.ownerDocument
        return doc.activeElement === this && (this.href || this.type || slick.hasAttribute(this, 'tabindex'))
    },

    'root': function(){
        return (this === this.ownerDocument.documentElement)
    }

}

Finder.prototype.match = function(node, bit, noTag, noId, noClass){

    // TODO: more functional tests ?

    if (!slick.noQSA && this.matchesSelector){
        var matches = this.matchesSelector(node, bit)
        if (matches !== null) return matches
    }

    // normal matching

    if (!noTag && bit.tag){

        var nodeName = node.nodeName.toLowerCase()
        if (bit.tag === "*"){
            if (nodeName < "@") return false
        } else if (nodeName != bit.tag){
            return false
        }

    }

    if (!noId && bit.id && node.getAttribute('id') !== bit.id) return false

    var i, part

    if (!noClass && bit.classes){

        var className = this.getAttribute(node, "class")
        if (!className) return false

        for (part in bit.classes) if (!RegExp('(^|\\s)' + bit.classes[part] + '(\\s|$)').test(className)) return false
    }

    var name, value

    if (bit.attributes) for (i = 0; part = bit.attributes[i++];){

        var operator  = part.operator,
            escaped   = part.escapedValue

        name  = part.name
        value = part.value

        if (!operator){

            if (!this.hasAttribute(node, name)) return false

        } else {

            var actual = this.getAttribute(node, name)
            if (actual == null) return false

            switch (operator){
                case '^=' : if (!RegExp(      '^' + escaped            ).test(actual)) return false; break
                case '$=' : if (!RegExp(            escaped + '$'      ).test(actual)) return false; break
                case '~=' : if (!RegExp('(^|\\s)' + escaped + '(\\s|$)').test(actual)) return false; break
                case '|=' : if (!RegExp(      '^' + escaped + '(-|$)'  ).test(actual)) return false; break

                case '='  : if (actual !== value) return false; break
                case '*=' : if (actual.indexOf(value) === -1) return false; break
                default   : return false
            }

        }
    }

    if (bit.pseudos) for (i = 0; part = bit.pseudos[i++];){

        name  = part.name
        value = part.value

        if (pseudos[name]) return pseudos[name].call(node, value)

        if (value != null){
            if (this.getAttribute(node, name) !== value) return false
        } else {
            if (!this.hasAttribute(node, name)) return false
        }

    }

    return true

}

Finder.prototype.matches = function(node, expression){

    var expressions = parse(expression)

    if (expressions.length === 1 && expressions[0].length === 1){ // simplest match
        return this.match(node, expressions[0][0])
    }

    // TODO: more functional tests ?

    if (!slick.noQSA && this.matchesSelector){
        var matches = this.matchesSelector(node, expressions)
        if (matches !== null) return matches
    }

    var nodes = this.search(this.document, expression, {length: 0})

    for (var i = 0, res; res = nodes[i++];) if (node === res) return true
    return false

}

var finders = {}

var finder = function(context){
    var doc = context || document
    if (doc.ownerDocument) doc = doc.ownerDocument
    else if (doc.document) doc = doc.document

    if (doc.nodeType !== 9) throw new TypeError("invalid document")

    var uid = uniqueID(doc)
    return finders[uid] || (finders[uid] = new Finder(doc))
}

// ... API ...

var slick = function(expression, context){
    return slick.search(expression, context)
}

slick.search = function(expression, context, found){
    return finder(context).search(context, expression, found)
}

slick.find = function(expression, context){
    return finder(context).search(context, expression)[0] || null
}

slick.getAttribute = function(node, name){
    return finder(node).getAttribute(node, name)
}

slick.hasAttribute = function(node, name){
    return finder(node).hasAttribute(node, name)
}

slick.contains = function(context, node){
    return finder(context).contains(context, node)
}

slick.matches = function(node, expression){
    return finder(node).matches(node, expression)
}

slick.sort = function(nodes){
    if (nodes && nodes.length > 1) finder(nodes[0]).sort(nodes)
    return nodes
}

slick.parse = parse;

// slick.debug = true
// slick.noQSA  = true

module.exports = slick

},{"./parser":4}],3:[function(require,module,exports){
(function (global){
/*
slick
*/"use strict"

module.exports = "document" in global ? require("./finder") : { parse: require("./parser") }

}).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./finder":2,"./parser":4}],4:[function(require,module,exports){
/*
Slick Parser
 - originally created by the almighty Thomas Aylott <@subtlegradient> (http://subtlegradient.com)
*/"use strict"

// Notable changes from Slick.Parser 1.0.x

// The parser now uses 2 classes: Expressions and Expression
// `new Expressions` produces an array-like object containing a list of Expression objects
// - Expressions::toString() produces a cleaned up expressions string
// `new Expression` produces an array-like object
// - Expression::toString() produces a cleaned up expression string
// The only exposed method is parse, which produces a (cached) `new Expressions` instance
// parsed.raw is no longer present, use .toString()
// parsed.expression is now useless, just use the indices
// parsed.reverse() has been removed for now, due to its apparent uselessness
// Other changes in the Expressions object:
// - classNames are now unique, and save both escaped and unescaped values
// - attributes now save both escaped and unescaped values
// - pseudos now save both escaped and unescaped values

var escapeRe   = /([-.*+?^${}()|[\]\/\\])/g,
    unescapeRe = /\\/g

var escape = function(string){
    // XRegExp v2.0.0-beta-3
    // « https://github.com/slevithan/XRegExp/blob/master/src/xregexp.js
    return (string + "").replace(escapeRe, '\\$1')
}

var unescape = function(string){
    return (string + "").replace(unescapeRe, '')
}

var slickRe = RegExp(
/*
#!/usr/bin/env ruby
puts "\t\t" + DATA.read.gsub(/\(\?x\)|\s+#.*$|\s+|\\$|\\n/,'')
__END__
    "(?x)^(?:\
      \\s* ( , ) \\s*               # Separator          \n\
    | \\s* ( <combinator>+ ) \\s*   # Combinator         \n\
    |      ( \\s+ )                 # CombinatorChildren \n\
    |      ( <unicode>+ | \\* )     # Tag                \n\
    | \\#  ( <unicode>+       )     # ID                 \n\
    | \\.  ( <unicode>+       )     # ClassName          \n\
    |                               # Attribute          \n\
    \\[  \
        \\s* (<unicode1>+)  (?:  \
            \\s* ([*^$!~|]?=)  (?:  \
                \\s* (?:\
                    ([\"']?)(.*?)\\9 \
                )\
            )  \
        )?  \\s*  \
    \\](?!\\]) \n\
    |   :+ ( <unicode>+ )(?:\
    \\( (?:\
        (?:([\"'])([^\\12]*)\\12)|((?:\\([^)]+\\)|[^()]*)+)\
    ) \\)\
    )?\
    )"
*/
"^(?:\\s*(,)\\s*|\\s*(<combinator>+)\\s*|(\\s+)|(<unicode>+|\\*)|\\#(<unicode>+)|\\.(<unicode>+)|\\[\\s*(<unicode1>+)(?:\\s*([*^$!~|]?=)(?:\\s*(?:([\"']?)(.*?)\\9)))?\\s*\\](?!\\])|(:+)(<unicode>+)(?:\\((?:(?:([\"'])([^\\13]*)\\13)|((?:\\([^)]+\\)|[^()]*)+))\\))?)"
    .replace(/<combinator>/, '[' + escape(">+~`!@$%^&={}\\;</") + ']')
    .replace(/<unicode>/g, '(?:[\\w\\u00a1-\\uFFFF-]|\\\\[^\\s0-9a-f])')
    .replace(/<unicode1>/g, '(?:[:\\w\\u00a1-\\uFFFF-]|\\\\[^\\s0-9a-f])')
)

// Part

var Part = function Part(combinator){
    this.combinator = combinator || " "
    this.tag = "*"
}

Part.prototype.toString = function(){

    if (!this.raw){

        var xpr = "", k, part

        xpr += this.tag || "*"
        if (this.id) xpr += "#" + this.id
        if (this.classes) xpr += "." + this.classList.join(".")
        if (this.attributes) for (k = 0; part = this.attributes[k++];){
            xpr += "[" + part.name + (part.operator ? part.operator + '"' + part.value + '"' : '') + "]"
        }
        if (this.pseudos) for (k = 0; part = this.pseudos[k++];){
            xpr += ":" + part.name
            if (part.value) xpr += "(" + part.value + ")"
        }

        this.raw = xpr

    }

    return this.raw
}

// Expression

var Expression = function Expression(){
    this.length = 0
}

Expression.prototype.toString = function(){

    if (!this.raw){

        var xpr = ""

        for (var j = 0, bit; bit = this[j++];){
            if (j !== 1) xpr += " "
            if (bit.combinator !== " ") xpr += bit.combinator + " "
            xpr += bit
        }

        this.raw = xpr

    }

    return this.raw
}

var replacer = function(
    rawMatch,

    separator,
    combinator,
    combinatorChildren,

    tagName,
    id,
    className,

    attributeKey,
    attributeOperator,
    attributeQuote,
    attributeValue,

    pseudoMarker,
    pseudoClass,
    pseudoQuote,
    pseudoClassQuotedValue,
    pseudoClassValue
){

    var expression, current

    if (separator || !this.length){
        expression = this[this.length++] = new Expression
        if (separator) return ''
    }

    if (!expression) expression = this[this.length - 1]

    if (combinator || combinatorChildren || !expression.length){
        current = expression[expression.length++] = new Part(combinator)
    }

    if (!current) current = expression[expression.length - 1]

    if (tagName){

        current.tag = unescape(tagName)

    } else if (id){

        current.id = unescape(id)

    } else if (className){

        var unescaped = unescape(className)

        var classes = current.classes || (current.classes = {})
        if (!classes[unescaped]){
            classes[unescaped] = escape(className)
            var classList = current.classList || (current.classList = [])
            classList.push(unescaped)
            classList.sort()
        }

    } else if (pseudoClass){

        pseudoClassValue = pseudoClassValue || pseudoClassQuotedValue

        ;(current.pseudos || (current.pseudos = [])).push({
            type         : pseudoMarker.length == 1 ? 'class' : 'element',
            name         : unescape(pseudoClass),
            escapedName  : escape(pseudoClass),
            value        : pseudoClassValue ? unescape(pseudoClassValue) : null,
            escapedValue : pseudoClassValue ? escape(pseudoClassValue) : null
        })

    } else if (attributeKey){

        attributeValue = attributeValue ? escape(attributeValue) : null

        ;(current.attributes || (current.attributes = [])).push({
            operator     : attributeOperator,
            name         : unescape(attributeKey),
            escapedName  : escape(attributeKey),
            value        : attributeValue ? unescape(attributeValue) : null,
            escapedValue : attributeValue ? escape(attributeValue) : null
        })

    }

    return ''

}

// Expressions

var Expressions = function Expressions(expression){
    this.length = 0

    var self = this

    var original = expression, replaced

    while (expression){
        replaced = expression.replace(slickRe, function(){
            return replacer.apply(self, arguments)
        })
        if (replaced === expression) throw new Error(original + ' is an invalid expression')
        expression = replaced
    }
}

Expressions.prototype.toString = function(){
    if (!this.raw){
        var expressions = []
        for (var i = 0, expression; expression = this[i++];) expressions.push(expression)
        this.raw = expressions.join(", ")
    }

    return this.raw
}

var cache = {}

var parse = function(expression){
    if (expression == null) return null
    expression = ('' + expression).replace(/^\s+|\s+$/g, '')
    return cache[expression] || (cache[expression] = new Expressions(expression))
}

module.exports = parse

},{}],5:[function(require,module,exports){
var domready = require("domready");
var dgua = require("./dgua");
var slick = require("slick");
domready(function() {
  if(slick.find("#dgu-analytics")) {
    var application = new dgua.Application("#dgu-analytics");
    application.init();
  }
});

},{"./dgua":6,"domready":1,"slick":3}],6:[function(require,module,exports){
module.exports = {
  Application: require("./dgua/application")

};

},{"./dgua/application":7}],7:[function(require,module,exports){
var Application = function(selector) {
  this._selector = selector;
};

Application.prototype = {
  init: function() {
  }
};

module.exports = Application;

},{}]},{},[5])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy90aW0vc3JjL2RhdGEuZ292LnVrL2FuYWx5dGljcy12aXMvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsIi9Vc2Vycy90aW0vc3JjL2RhdGEuZ292LnVrL2FuYWx5dGljcy12aXMvbm9kZV9tb2R1bGVzL2RvbXJlYWR5L3JlYWR5LmpzIiwiL1VzZXJzL3RpbS9zcmMvZGF0YS5nb3YudWsvYW5hbHl0aWNzLXZpcy9ub2RlX21vZHVsZXMvc2xpY2svZmluZGVyLmpzIiwiL1VzZXJzL3RpbS9zcmMvZGF0YS5nb3YudWsvYW5hbHl0aWNzLXZpcy9ub2RlX21vZHVsZXMvc2xpY2svaW5kZXguanMiLCIvVXNlcnMvdGltL3NyYy9kYXRhLmdvdi51ay9hbmFseXRpY3MtdmlzL25vZGVfbW9kdWxlcy9zbGljay9wYXJzZXIuanMiLCIvVXNlcnMvdGltL3NyYy9kYXRhLmdvdi51ay9hbmFseXRpY3MtdmlzL3NyYy9qcy9hcHBsaWNhdGlvbi5qcyIsIi9Vc2Vycy90aW0vc3JjL2RhdGEuZ292LnVrL2FuYWx5dGljcy12aXMvc3JjL2pzL2RndWEuanMiLCIvVXNlcnMvdGltL3NyYy9kYXRhLmdvdi51ay9hbmFseXRpY3MtdmlzL3NyYy9qcy9kZ3VhL2FwcGxpY2F0aW9uLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN3pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1BBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMVBBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDSkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt0aHJvdyBuZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpfXZhciBmPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChmLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGYsZi5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIvKiFcbiAgKiBkb21yZWFkeSAoYykgRHVzdGluIERpYXogMjAxNCAtIExpY2Vuc2UgTUlUXG4gICovXG4hZnVuY3Rpb24gKG5hbWUsIGRlZmluaXRpb24pIHtcblxuICBpZiAodHlwZW9mIG1vZHVsZSAhPSAndW5kZWZpbmVkJykgbW9kdWxlLmV4cG9ydHMgPSBkZWZpbml0aW9uKClcbiAgZWxzZSBpZiAodHlwZW9mIGRlZmluZSA9PSAnZnVuY3Rpb24nICYmIHR5cGVvZiBkZWZpbmUuYW1kID09ICdvYmplY3QnKSBkZWZpbmUoZGVmaW5pdGlvbilcbiAgZWxzZSB0aGlzW25hbWVdID0gZGVmaW5pdGlvbigpXG5cbn0oJ2RvbXJlYWR5JywgZnVuY3Rpb24gKCkge1xuXG4gIHZhciBmbnMgPSBbXSwgbGlzdGVuZXJcbiAgICAsIGRvYyA9IGRvY3VtZW50XG4gICAgLCBoYWNrID0gZG9jLmRvY3VtZW50RWxlbWVudC5kb1Njcm9sbFxuICAgICwgZG9tQ29udGVudExvYWRlZCA9ICdET01Db250ZW50TG9hZGVkJ1xuICAgICwgbG9hZGVkID0gKGhhY2sgPyAvXmxvYWRlZHxeYy8gOiAvXmxvYWRlZHxeaXxeYy8pLnRlc3QoZG9jLnJlYWR5U3RhdGUpXG5cblxuICBpZiAoIWxvYWRlZClcbiAgZG9jLmFkZEV2ZW50TGlzdGVuZXIoZG9tQ29udGVudExvYWRlZCwgbGlzdGVuZXIgPSBmdW5jdGlvbiAoKSB7XG4gICAgZG9jLnJlbW92ZUV2ZW50TGlzdGVuZXIoZG9tQ29udGVudExvYWRlZCwgbGlzdGVuZXIpXG4gICAgbG9hZGVkID0gMVxuICAgIHdoaWxlIChsaXN0ZW5lciA9IGZucy5zaGlmdCgpKSBsaXN0ZW5lcigpXG4gIH0pXG5cbiAgcmV0dXJuIGZ1bmN0aW9uIChmbikge1xuICAgIGxvYWRlZCA/IGZuKCkgOiBmbnMucHVzaChmbilcbiAgfVxuXG59KTtcbiIsIi8qXG5TbGljayBGaW5kZXJcbiovXCJ1c2Ugc3RyaWN0XCJcblxuLy8gTm90YWJsZSBjaGFuZ2VzIGZyb20gU2xpY2suRmluZGVyIDEuMC54XG5cbi8vIGZhc3RlciBib3R0b20gLT4gdXAgZXhwcmVzc2lvbiBtYXRjaGluZ1xuLy8gcHJlZmVycyBtZW50YWwgc2FuaXR5IG92ZXIgKm9ic2Vzc2l2ZSBjb21wdWxzaXZlKiBtaWxsaXNlY29uZHMgc2F2aW5nc1xuLy8gdXNlcyBwcm90b3R5cGVzIGluc3RlYWQgb2Ygb2JqZWN0c1xuLy8gdHJpZXMgdG8gdXNlIG1hdGNoZXNTZWxlY3RvciBzbWFydGx5LCB3aGVuZXZlciBhdmFpbGFibGVcbi8vIGNhbiBwb3B1bGF0ZSBvYmplY3RzIGFzIHdlbGwgYXMgYXJyYXlzXG4vLyBsb3RzIG9mIHN0dWZmIGlzIGJyb2tlbiBvciBub3QgaW1wbGVtZW50ZWRcblxudmFyIHBhcnNlID0gcmVxdWlyZShcIi4vcGFyc2VyXCIpXG5cbi8vIHV0aWxpdGllc1xuXG52YXIgaW5kZXggPSAwLFxuICAgIGNvdW50ZXIgPSBkb2N1bWVudC5fX2NvdW50ZXIgPSAocGFyc2VJbnQoZG9jdW1lbnQuX19jb3VudGVyIHx8IC0xLCAzNikgKyAxKS50b1N0cmluZygzNiksXG4gICAga2V5ID0gXCJ1aWQ6XCIgKyBjb3VudGVyXG5cbnZhciB1bmlxdWVJRCA9IGZ1bmN0aW9uKG4sIHhtbCl7XG4gICAgaWYgKG4gPT09IHdpbmRvdykgcmV0dXJuIFwid2luZG93XCJcbiAgICBpZiAobiA9PT0gZG9jdW1lbnQpIHJldHVybiBcImRvY3VtZW50XCJcbiAgICBpZiAobiA9PT0gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50KSByZXR1cm4gXCJodG1sXCJcblxuICAgIGlmICh4bWwpIHtcbiAgICAgICAgdmFyIHVpZCA9IG4uZ2V0QXR0cmlidXRlKGtleSlcbiAgICAgICAgaWYgKCF1aWQpIHtcbiAgICAgICAgICAgIHVpZCA9IChpbmRleCsrKS50b1N0cmluZygzNilcbiAgICAgICAgICAgIG4uc2V0QXR0cmlidXRlKGtleSwgdWlkKVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiB1aWRcbiAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gbltrZXldIHx8IChuW2tleV0gPSAoaW5kZXgrKykudG9TdHJpbmcoMzYpKVxuICAgIH1cbn1cblxudmFyIHVuaXF1ZUlEWE1MID0gZnVuY3Rpb24obikge1xuICAgIHJldHVybiB1bmlxdWVJRChuLCB0cnVlKVxufVxuXG52YXIgaXNBcnJheSA9IEFycmF5LmlzQXJyYXkgfHwgZnVuY3Rpb24ob2JqZWN0KXtcbiAgICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKG9iamVjdCkgPT09IFwiW29iamVjdCBBcnJheV1cIlxufVxuXG4vLyB0ZXN0c1xuXG52YXIgdW5pcXVlSW5kZXggPSAwO1xuXG52YXIgSEFTID0ge1xuXG4gICAgR0VUX0VMRU1FTlRfQllfSUQ6IGZ1bmN0aW9uKHRlc3QsIGlkKXtcbiAgICAgICAgaWQgPSBcInNsaWNrX1wiICsgKHVuaXF1ZUluZGV4KyspO1xuICAgICAgICAvLyBjaGVja3MgaWYgdGhlIGRvY3VtZW50IGhhcyBnZXRFbGVtZW50QnlJZCwgYW5kIGl0IHdvcmtzXG4gICAgICAgIHRlc3QuaW5uZXJIVE1MID0gJzxhIGlkPVwiJyArIGlkICsgJ1wiPjwvYT4nXG4gICAgICAgIHJldHVybiAhIXRoaXMuZ2V0RWxlbWVudEJ5SWQoaWQpXG4gICAgfSxcblxuICAgIFFVRVJZX1NFTEVDVE9SOiBmdW5jdGlvbih0ZXN0KXtcbiAgICAgICAgLy8gdGhpcyBzdXBwb3NlZGx5IGZpeGVzIGEgd2Via2l0IGJ1ZyB3aXRoIG1hdGNoZXNTZWxlY3RvciAvIHF1ZXJ5U2VsZWN0b3IgJiBudGgtY2hpbGRcbiAgICAgICAgdGVzdC5pbm5lckhUTUwgPSAnXzxzdHlsZT46bnRoLWNoaWxkKDIpe308L3N0eWxlPidcblxuICAgICAgICAvLyBjaGVja3MgaWYgdGhlIGRvY3VtZW50IGhhcyBxdWVyeVNlbGVjdG9yQWxsLCBhbmQgaXQgd29ya3NcbiAgICAgICAgdGVzdC5pbm5lckhUTUwgPSAnPGEgY2xhc3M9XCJNaVhcIj48L2E+J1xuXG4gICAgICAgIHJldHVybiB0ZXN0LnF1ZXJ5U2VsZWN0b3JBbGwoJy5NaVgnKS5sZW5ndGggPT09IDFcbiAgICB9LFxuXG4gICAgRVhQQU5ET1M6IGZ1bmN0aW9uKHRlc3QsIGlkKXtcbiAgICAgICAgaWQgPSBcInNsaWNrX1wiICsgKHVuaXF1ZUluZGV4KyspO1xuICAgICAgICAvLyBjaGVja3MgaWYgdGhlIGRvY3VtZW50IGhhcyBlbGVtZW50cyB0aGF0IHN1cHBvcnQgZXhwYW5kb3NcbiAgICAgICAgdGVzdC5fY3VzdG9tX3Byb3BlcnR5XyA9IGlkXG4gICAgICAgIHJldHVybiB0ZXN0Ll9jdXN0b21fcHJvcGVydHlfID09PSBpZFxuICAgIH0sXG5cbiAgICAvLyBUT0RPOiB1c2UgdGhpcyA/XG5cbiAgICAvLyBDSEVDS0VEX1FVRVJZX1NFTEVDVE9SOiBmdW5jdGlvbih0ZXN0KXtcbiAgICAvL1xuICAgIC8vICAgICAvLyBjaGVja3MgaWYgdGhlIGRvY3VtZW50IHN1cHBvcnRzIHRoZSBjaGVja2VkIHF1ZXJ5IHNlbGVjdG9yXG4gICAgLy8gICAgIHRlc3QuaW5uZXJIVE1MID0gJzxzZWxlY3Q+PG9wdGlvbiBzZWxlY3RlZD1cInNlbGVjdGVkXCI+YTwvb3B0aW9uPjwvc2VsZWN0PidcbiAgICAvLyAgICAgcmV0dXJuIHRlc3QucXVlcnlTZWxlY3RvckFsbCgnOmNoZWNrZWQnKS5sZW5ndGggPT09IDFcbiAgICAvLyB9LFxuXG4gICAgLy8gVE9ETzogdXNlIHRoaXMgP1xuXG4gICAgLy8gRU1QVFlfQVRUUklCVVRFX1FVRVJZX1NFTEVDVE9SOiBmdW5jdGlvbih0ZXN0KXtcbiAgICAvL1xuICAgIC8vICAgICAvLyBjaGVja3MgaWYgdGhlIGRvY3VtZW50IHN1cHBvcnRzIHRoZSBlbXB0eSBhdHRyaWJ1dGUgcXVlcnkgc2VsZWN0b3JcbiAgICAvLyAgICAgdGVzdC5pbm5lckhUTUwgPSAnPGEgY2xhc3M9XCJcIj48L2E+J1xuICAgIC8vICAgICByZXR1cm4gdGVzdC5xdWVyeVNlbGVjdG9yQWxsKCdbY2xhc3MqPVwiXCJdJykubGVuZ3RoID09PSAxXG4gICAgLy8gfSxcblxuICAgIE1BVENIRVNfU0VMRUNUT1I6IGZ1bmN0aW9uKHRlc3Qpe1xuXG4gICAgICAgIHRlc3QuY2xhc3NOYW1lID0gXCJNaVhcIlxuXG4gICAgICAgIC8vIGNoZWNrcyBpZiB0aGUgZG9jdW1lbnQgaGFzIG1hdGNoZXNTZWxlY3RvciwgYW5kIHdlIGNhbiB1c2UgaXQuXG5cbiAgICAgICAgdmFyIG1hdGNoZXMgPSB0ZXN0Lm1hdGNoZXNTZWxlY3RvciB8fCB0ZXN0Lm1vek1hdGNoZXNTZWxlY3RvciB8fCB0ZXN0LndlYmtpdE1hdGNoZXNTZWxlY3RvclxuXG4gICAgICAgIC8vIGlmIG1hdGNoZXNTZWxlY3RvciB0cm93cyBlcnJvcnMgb24gaW5jb3JyZWN0IHN5bnRheCB3ZSBjYW4gdXNlIGl0XG4gICAgICAgIGlmIChtYXRjaGVzKSB0cnkge1xuICAgICAgICAgICAgbWF0Y2hlcy5jYWxsKHRlc3QsICc6c2xpY2snKVxuICAgICAgICB9IGNhdGNoKGUpe1xuICAgICAgICAgICAgLy8ganVzdCBhcyBhIHNhZmV0eSBwcmVjYXV0aW9uLCBhbHNvIHRlc3QgaWYgaXQgd29ya3Mgb24gbWl4ZWRjYXNlIChsaWtlIHF1ZXJ5U2VsZWN0b3JBbGwpXG4gICAgICAgICAgICByZXR1cm4gbWF0Y2hlcy5jYWxsKHRlc3QsIFwiLk1pWFwiKSA/IG1hdGNoZXMgOiBmYWxzZVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgfSxcblxuICAgIEdFVF9FTEVNRU5UU19CWV9DTEFTU19OQU1FOiBmdW5jdGlvbih0ZXN0KXtcbiAgICAgICAgdGVzdC5pbm5lckhUTUwgPSAnPGEgY2xhc3M9XCJmXCI+PC9hPjxhIGNsYXNzPVwiYlwiPjwvYT4nXG4gICAgICAgIGlmICh0ZXN0LmdldEVsZW1lbnRzQnlDbGFzc05hbWUoJ2InKS5sZW5ndGggIT09IDEpIHJldHVybiBmYWxzZVxuXG4gICAgICAgIHRlc3QuZmlyc3RDaGlsZC5jbGFzc05hbWUgPSAnYidcbiAgICAgICAgaWYgKHRlc3QuZ2V0RWxlbWVudHNCeUNsYXNzTmFtZSgnYicpLmxlbmd0aCAhPT0gMikgcmV0dXJuIGZhbHNlXG5cbiAgICAgICAgLy8gT3BlcmEgOS42IGdldEVsZW1lbnRzQnlDbGFzc05hbWUgZG9lc250IGRldGVjdHMgdGhlIGNsYXNzIGlmIGl0cyBub3QgdGhlIGZpcnN0IG9uZVxuICAgICAgICB0ZXN0LmlubmVySFRNTCA9ICc8YSBjbGFzcz1cImFcIj48L2E+PGEgY2xhc3M9XCJmIGIgYVwiPjwvYT4nXG4gICAgICAgIGlmICh0ZXN0LmdldEVsZW1lbnRzQnlDbGFzc05hbWUoJ2EnKS5sZW5ndGggIT09IDIpIHJldHVybiBmYWxzZVxuXG4gICAgICAgIC8vIHRlc3RzIHBhc3NlZFxuICAgICAgICByZXR1cm4gdHJ1ZVxuICAgIH0sXG5cbiAgICAvLyBubyBuZWVkIHRvIGtub3dcblxuICAgIC8vIEdFVF9FTEVNRU5UX0JZX0lEX05PVF9OQU1FOiBmdW5jdGlvbih0ZXN0LCBpZCl7XG4gICAgLy8gICAgIHRlc3QuaW5uZXJIVE1MID0gJzxhIG5hbWU9XCInKyBpZCArJ1wiPjwvYT48YiBpZD1cIicrIGlkICsnXCI+PC9iPidcbiAgICAvLyAgICAgcmV0dXJuIHRoaXMuZ2V0RWxlbWVudEJ5SWQoaWQpICE9PSB0ZXN0LmZpcnN0Q2hpbGRcbiAgICAvLyB9LFxuXG4gICAgLy8gdGhpcyBpcyBhbHdheXMgY2hlY2tlZCBmb3IgYW5kIGZpeGVkXG5cbiAgICAvLyBTVEFSX0dFVF9FTEVNRU5UU19CWV9UQUdfTkFNRTogZnVuY3Rpb24odGVzdCl7XG4gICAgLy9cbiAgICAvLyAgICAgLy8gSUUgcmV0dXJucyBjb21tZW50IG5vZGVzIGZvciBnZXRFbGVtZW50c0J5VGFnTmFtZSgnKicpIGZvciBzb21lIGRvY3VtZW50c1xuICAgIC8vICAgICB0ZXN0LmFwcGVuZENoaWxkKHRoaXMuY3JlYXRlQ29tbWVudCgnJykpXG4gICAgLy8gICAgIGlmICh0ZXN0LmdldEVsZW1lbnRzQnlUYWdOYW1lKCcqJykubGVuZ3RoID4gMCkgcmV0dXJuIGZhbHNlXG4gICAgLy9cbiAgICAvLyAgICAgLy8gSUUgcmV0dXJucyBjbG9zZWQgbm9kZXMgKEVHOlwiPC9mb28+XCIpIGZvciBnZXRFbGVtZW50c0J5VGFnTmFtZSgnKicpIGZvciBzb21lIGRvY3VtZW50c1xuICAgIC8vICAgICB0ZXN0LmlubmVySFRNTCA9ICdmb288L2Zvbz4nXG4gICAgLy8gICAgIGlmICh0ZXN0LmdldEVsZW1lbnRzQnlUYWdOYW1lKCcqJykubGVuZ3RoKSByZXR1cm4gZmFsc2VcbiAgICAvL1xuICAgIC8vICAgICAvLyB0ZXN0cyBwYXNzZWRcbiAgICAvLyAgICAgcmV0dXJuIHRydWVcbiAgICAvLyB9LFxuXG4gICAgLy8gdGhpcyBpcyBhbHdheXMgY2hlY2tlZCBmb3IgYW5kIGZpeGVkXG5cbiAgICAvLyBTVEFSX1FVRVJZX1NFTEVDVE9SOiBmdW5jdGlvbih0ZXN0KXtcbiAgICAvL1xuICAgIC8vICAgICAvLyByZXR1cm5zIGNsb3NlZCBub2RlcyAoRUc6XCI8L2Zvbz5cIikgZm9yIHF1ZXJ5U2VsZWN0b3IoJyonKSBmb3Igc29tZSBkb2N1bWVudHNcbiAgICAvLyAgICAgdGVzdC5pbm5lckhUTUwgPSAnZm9vPC9mb28+J1xuICAgIC8vICAgICByZXR1cm4gISEodGVzdC5xdWVyeVNlbGVjdG9yQWxsKCcqJykubGVuZ3RoKVxuICAgIC8vIH0sXG5cbiAgICBHRVRfQVRUUklCVVRFOiBmdW5jdGlvbih0ZXN0KXtcbiAgICAgICAgLy8gdGVzdHMgZm9yIHdvcmtpbmcgZ2V0QXR0cmlidXRlIGltcGxlbWVudGF0aW9uXG4gICAgICAgIHZhciBzaG91dCA9IFwiZnVzIHJvIGRhaFwiXG4gICAgICAgIHRlc3QuaW5uZXJIVE1MID0gJzxhIGNsYXNzPVwiJyArIHNob3V0ICsgJ1wiPjwvYT4nXG4gICAgICAgIHJldHVybiB0ZXN0LmZpcnN0Q2hpbGQuZ2V0QXR0cmlidXRlKCdjbGFzcycpID09PSBzaG91dFxuICAgIH1cblxufVxuXG4vLyBGaW5kZXJcblxudmFyIEZpbmRlciA9IGZ1bmN0aW9uIEZpbmRlcihkb2N1bWVudCl7XG5cbiAgICB0aGlzLmRvY3VtZW50ICAgICAgICA9IGRvY3VtZW50XG4gICAgdmFyIHJvb3QgPSB0aGlzLnJvb3QgPSBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnRcbiAgICB0aGlzLnRlc3RlZCAgICAgICAgICA9IHt9XG5cbiAgICAvLyB1bmlxdWVJRFxuXG4gICAgdGhpcy51bmlxdWVJRCA9IHRoaXMuaGFzKFwiRVhQQU5ET1NcIikgPyB1bmlxdWVJRCA6IHVuaXF1ZUlEWE1MXG5cbiAgICAvLyBnZXRBdHRyaWJ1dGVcblxuICAgIHRoaXMuZ2V0QXR0cmlidXRlID0gKHRoaXMuaGFzKFwiR0VUX0FUVFJJQlVURVwiKSkgPyBmdW5jdGlvbihub2RlLCBuYW1lKXtcblxuICAgICAgICByZXR1cm4gbm9kZS5nZXRBdHRyaWJ1dGUobmFtZSlcblxuICAgIH0gOiBmdW5jdGlvbihub2RlLCBuYW1lKXtcblxuICAgICAgICBub2RlID0gbm9kZS5nZXRBdHRyaWJ1dGVOb2RlKG5hbWUpXG4gICAgICAgIHJldHVybiAobm9kZSAmJiBub2RlLnNwZWNpZmllZCkgPyBub2RlLnZhbHVlIDogbnVsbFxuXG4gICAgfVxuXG4gICAgLy8gaGFzQXR0cmlidXRlXG5cbiAgICB0aGlzLmhhc0F0dHJpYnV0ZSA9IChyb290Lmhhc0F0dHJpYnV0ZSkgPyBmdW5jdGlvbihub2RlLCBhdHRyaWJ1dGUpe1xuXG4gICAgICAgIHJldHVybiBub2RlLmhhc0F0dHJpYnV0ZShhdHRyaWJ1dGUpXG5cbiAgICB9IDogZnVuY3Rpb24obm9kZSwgYXR0cmlidXRlKSB7XG5cbiAgICAgICAgbm9kZSA9IG5vZGUuZ2V0QXR0cmlidXRlTm9kZShhdHRyaWJ1dGUpXG4gICAgICAgIHJldHVybiAhIShub2RlICYmIG5vZGUuc3BlY2lmaWVkKVxuXG4gICAgfVxuXG4gICAgLy8gY29udGFpbnNcblxuICAgIHRoaXMuY29udGFpbnMgPSAoZG9jdW1lbnQuY29udGFpbnMgJiYgcm9vdC5jb250YWlucykgPyBmdW5jdGlvbihjb250ZXh0LCBub2RlKXtcblxuICAgICAgICByZXR1cm4gY29udGV4dC5jb250YWlucyhub2RlKVxuXG4gICAgfSA6IChyb290LmNvbXBhcmVEb2N1bWVudFBvc2l0aW9uKSA/IGZ1bmN0aW9uKGNvbnRleHQsIG5vZGUpe1xuXG4gICAgICAgIHJldHVybiBjb250ZXh0ID09PSBub2RlIHx8ICEhKGNvbnRleHQuY29tcGFyZURvY3VtZW50UG9zaXRpb24obm9kZSkgJiAxNilcblxuICAgIH0gOiBmdW5jdGlvbihjb250ZXh0LCBub2RlKXtcblxuICAgICAgICBkbyB7XG4gICAgICAgICAgICBpZiAobm9kZSA9PT0gY29udGV4dCkgcmV0dXJuIHRydWVcbiAgICAgICAgfSB3aGlsZSAoKG5vZGUgPSBub2RlLnBhcmVudE5vZGUpKVxuXG4gICAgICAgIHJldHVybiBmYWxzZVxuICAgIH1cblxuICAgIC8vIHNvcnRcbiAgICAvLyBjcmVkaXRzIHRvIFNpenpsZSAoaHR0cDovL3NpenpsZWpzLmNvbS8pXG5cbiAgICB0aGlzLnNvcnRlciA9IChyb290LmNvbXBhcmVEb2N1bWVudFBvc2l0aW9uKSA/IGZ1bmN0aW9uKGEsIGIpe1xuXG4gICAgICAgIGlmICghYS5jb21wYXJlRG9jdW1lbnRQb3NpdGlvbiB8fCAhYi5jb21wYXJlRG9jdW1lbnRQb3NpdGlvbikgcmV0dXJuIDBcbiAgICAgICAgcmV0dXJuIGEuY29tcGFyZURvY3VtZW50UG9zaXRpb24oYikgJiA0ID8gLTEgOiBhID09PSBiID8gMCA6IDFcblxuICAgIH0gOiAoJ3NvdXJjZUluZGV4JyBpbiByb290KSA/IGZ1bmN0aW9uKGEsIGIpe1xuXG4gICAgICAgIGlmICghYS5zb3VyY2VJbmRleCB8fCAhYi5zb3VyY2VJbmRleCkgcmV0dXJuIDBcbiAgICAgICAgcmV0dXJuIGEuc291cmNlSW5kZXggLSBiLnNvdXJjZUluZGV4XG5cbiAgICB9IDogKGRvY3VtZW50LmNyZWF0ZVJhbmdlKSA/IGZ1bmN0aW9uKGEsIGIpe1xuXG4gICAgICAgIGlmICghYS5vd25lckRvY3VtZW50IHx8ICFiLm93bmVyRG9jdW1lbnQpIHJldHVybiAwXG4gICAgICAgIHZhciBhUmFuZ2UgPSBhLm93bmVyRG9jdW1lbnQuY3JlYXRlUmFuZ2UoKSxcbiAgICAgICAgICAgIGJSYW5nZSA9IGIub3duZXJEb2N1bWVudC5jcmVhdGVSYW5nZSgpXG5cbiAgICAgICAgYVJhbmdlLnNldFN0YXJ0KGEsIDApXG4gICAgICAgIGFSYW5nZS5zZXRFbmQoYSwgMClcbiAgICAgICAgYlJhbmdlLnNldFN0YXJ0KGIsIDApXG4gICAgICAgIGJSYW5nZS5zZXRFbmQoYiwgMClcbiAgICAgICAgcmV0dXJuIGFSYW5nZS5jb21wYXJlQm91bmRhcnlQb2ludHMoUmFuZ2UuU1RBUlRfVE9fRU5ELCBiUmFuZ2UpXG5cbiAgICB9IDogbnVsbFxuXG4gICAgdGhpcy5mYWlsZWQgPSB7fVxuXG4gICAgdmFyIG5hdGl2ZU1hdGNoZXMgPSB0aGlzLmhhcyhcIk1BVENIRVNfU0VMRUNUT1JcIilcblxuICAgIGlmIChuYXRpdmVNYXRjaGVzKSB0aGlzLm1hdGNoZXNTZWxlY3RvciA9IGZ1bmN0aW9uKG5vZGUsIGV4cHJlc3Npb24pe1xuXG4gICAgICAgIGlmICh0aGlzLmZhaWxlZFtleHByZXNzaW9uXSkgcmV0dXJuIG51bGxcblxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgcmV0dXJuIG5hdGl2ZU1hdGNoZXMuY2FsbChub2RlLCBleHByZXNzaW9uKVxuICAgICAgICB9IGNhdGNoKGUpe1xuICAgICAgICAgICAgaWYgKHNsaWNrLmRlYnVnKSBjb25zb2xlLndhcm4oXCJtYXRjaGVzU2VsZWN0b3IgZmFpbGVkIG9uIFwiICsgZXhwcmVzc2lvbilcbiAgICAgICAgICAgIHRoaXMuZmFpbGVkW2V4cHJlc3Npb25dID0gdHJ1ZVxuICAgICAgICAgICAgcmV0dXJuIG51bGxcbiAgICAgICAgfVxuXG4gICAgfVxuXG4gICAgaWYgKHRoaXMuaGFzKFwiUVVFUllfU0VMRUNUT1JcIikpe1xuXG4gICAgICAgIHRoaXMucXVlcnlTZWxlY3RvckFsbCA9IGZ1bmN0aW9uKG5vZGUsIGV4cHJlc3Npb24pe1xuXG4gICAgICAgICAgICBpZiAodGhpcy5mYWlsZWRbZXhwcmVzc2lvbl0pIHJldHVybiB0cnVlXG5cbiAgICAgICAgICAgIHZhciByZXN1bHQsIF9pZCwgX2V4cHJlc3Npb24sIF9jb21iaW5hdG9yLCBfbm9kZVxuXG5cbiAgICAgICAgICAgIC8vIG5vbi1kb2N1bWVudCByb290ZWQgUVNBXG4gICAgICAgICAgICAvLyBjcmVkaXRzIHRvIEFuZHJldyBEdXBvbnRcblxuICAgICAgICAgICAgaWYgKG5vZGUgIT09IHRoaXMuZG9jdW1lbnQpe1xuXG4gICAgICAgICAgICAgICAgX2NvbWJpbmF0b3IgPSBleHByZXNzaW9uWzBdLmNvbWJpbmF0b3JcblxuICAgICAgICAgICAgICAgIF9pZCAgICAgICAgID0gbm9kZS5nZXRBdHRyaWJ1dGUoXCJpZFwiKVxuICAgICAgICAgICAgICAgIF9leHByZXNzaW9uID0gZXhwcmVzc2lvblxuXG4gICAgICAgICAgICAgICAgaWYgKCFfaWQpe1xuICAgICAgICAgICAgICAgICAgICBfbm9kZSA9IG5vZGVcbiAgICAgICAgICAgICAgICAgICAgX2lkID0gXCJfX3NsaWNrX19cIlxuICAgICAgICAgICAgICAgICAgICBfbm9kZS5zZXRBdHRyaWJ1dGUoXCJpZFwiLCBfaWQpXG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgZXhwcmVzc2lvbiA9IFwiI1wiICsgX2lkICsgXCIgXCIgKyBfZXhwcmVzc2lvblxuXG5cbiAgICAgICAgICAgICAgICAvLyB0aGVzZSBjb21iaW5hdG9ycyBuZWVkIGEgcGFyZW50Tm9kZSBkdWUgdG8gaG93IHF1ZXJ5U2VsZWN0b3JBbGwgd29ya3MsIHdoaWNoIGlzOlxuICAgICAgICAgICAgICAgIC8vIGZpbmRpbmcgYWxsIHRoZSBlbGVtZW50cyB0aGF0IG1hdGNoIHRoZSBnaXZlbiBzZWxlY3RvclxuICAgICAgICAgICAgICAgIC8vIHRoZW4gZmlsdGVyaW5nIGJ5IHRoZSBvbmVzIHRoYXQgaGF2ZSB0aGUgc3BlY2lmaWVkIGVsZW1lbnQgYXMgYW4gYW5jZXN0b3JcbiAgICAgICAgICAgICAgICBpZiAoX2NvbWJpbmF0b3IuaW5kZXhPZihcIn5cIikgPiAtMSB8fCBfY29tYmluYXRvci5pbmRleE9mKFwiK1wiKSA+IC0xKXtcblxuICAgICAgICAgICAgICAgICAgICBub2RlID0gbm9kZS5wYXJlbnROb2RlXG4gICAgICAgICAgICAgICAgICAgIGlmICghbm9kZSkgcmVzdWx0ID0gdHJ1ZVxuICAgICAgICAgICAgICAgICAgICAvLyBpZiBub2RlIGhhcyBubyBwYXJlbnROb2RlLCB3ZSByZXR1cm4gXCJ0cnVlXCIgYXMgaWYgaXQgZmFpbGVkLCB3aXRob3V0IHBvbGx1dGluZyB0aGUgZmFpbGVkIGNhY2hlXG5cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKCFyZXN1bHQpIHRyeSB7XG4gICAgICAgICAgICAgICAgcmVzdWx0ID0gbm9kZS5xdWVyeVNlbGVjdG9yQWxsKGV4cHJlc3Npb24udG9TdHJpbmcoKSlcbiAgICAgICAgICAgIH0gY2F0Y2goZSl7XG4gICAgICAgICAgICAgICAgaWYgKHNsaWNrLmRlYnVnKSBjb25zb2xlLndhcm4oXCJxdWVyeVNlbGVjdG9yQWxsIGZhaWxlZCBvbiBcIiArIChfZXhwcmVzc2lvbiB8fCBleHByZXNzaW9uKSlcbiAgICAgICAgICAgICAgICByZXN1bHQgPSB0aGlzLmZhaWxlZFtfZXhwcmVzc2lvbiB8fCBleHByZXNzaW9uXSA9IHRydWVcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKF9ub2RlKSBfbm9kZS5yZW1vdmVBdHRyaWJ1dGUoXCJpZFwiKVxuXG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0XG5cbiAgICAgICAgfVxuXG4gICAgfVxuXG59XG5cbkZpbmRlci5wcm90b3R5cGUuaGFzID0gZnVuY3Rpb24oRkVBVFVSRSl7XG5cbiAgICB2YXIgdGVzdGVkICAgICAgICA9IHRoaXMudGVzdGVkLFxuICAgICAgICB0ZXN0ZWRGRUFUVVJFID0gdGVzdGVkW0ZFQVRVUkVdXG5cbiAgICBpZiAodGVzdGVkRkVBVFVSRSAhPSBudWxsKSByZXR1cm4gdGVzdGVkRkVBVFVSRVxuXG4gICAgdmFyIHJvb3QgICAgID0gdGhpcy5yb290LFxuICAgICAgICBkb2N1bWVudCA9IHRoaXMuZG9jdW1lbnQsXG4gICAgICAgIHRlc3ROb2RlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKVxuXG4gICAgdGVzdE5vZGUuc2V0QXR0cmlidXRlKFwic3R5bGVcIiwgXCJkaXNwbGF5OiBub25lO1wiKVxuXG4gICAgcm9vdC5hcHBlbmRDaGlsZCh0ZXN0Tm9kZSlcblxuICAgIHZhciBURVNUID0gSEFTW0ZFQVRVUkVdLCByZXN1bHQgPSBmYWxzZVxuXG4gICAgaWYgKFRFU1QpIHRyeSB7XG4gICAgICAgIHJlc3VsdCA9IFRFU1QuY2FsbChkb2N1bWVudCwgdGVzdE5vZGUpXG4gICAgfSBjYXRjaChlKXt9XG5cbiAgICBpZiAoc2xpY2suZGVidWcgJiYgIXJlc3VsdCkgY29uc29sZS53YXJuKFwiZG9jdW1lbnQgaGFzIG5vIFwiICsgRkVBVFVSRSlcblxuICAgIHJvb3QucmVtb3ZlQ2hpbGQodGVzdE5vZGUpXG5cbiAgICByZXR1cm4gdGVzdGVkW0ZFQVRVUkVdID0gcmVzdWx0XG5cbn1cblxudmFyIGNvbWJpbmF0b3JzID0ge1xuXG4gICAgXCIgXCI6IGZ1bmN0aW9uKG5vZGUsIHBhcnQsIHB1c2gpe1xuXG4gICAgICAgIHZhciBpdGVtLCBpdGVtc1xuXG4gICAgICAgIHZhciBub0lkID0gIXBhcnQuaWQsIG5vVGFnID0gIXBhcnQudGFnLCBub0NsYXNzID0gIXBhcnQuY2xhc3Nlc1xuXG4gICAgICAgIGlmIChwYXJ0LmlkICYmIG5vZGUuZ2V0RWxlbWVudEJ5SWQgJiYgdGhpcy5oYXMoXCJHRVRfRUxFTUVOVF9CWV9JRFwiKSl7XG4gICAgICAgICAgICBpdGVtID0gbm9kZS5nZXRFbGVtZW50QnlJZChwYXJ0LmlkKVxuXG4gICAgICAgICAgICAvLyByZXR1cm4gb25seSBpZiBpZCBpcyBmb3VuZCwgZWxzZSBrZWVwIGNoZWNraW5nXG4gICAgICAgICAgICAvLyBtaWdodCBiZSBhIHRhZCBzbG93ZXIgb24gbm9uLWV4aXN0aW5nIGlkcywgYnV0IGxlc3MgaW5zYW5lXG5cbiAgICAgICAgICAgIGlmIChpdGVtICYmIGl0ZW0uZ2V0QXR0cmlidXRlKCdpZCcpID09PSBwYXJ0LmlkKXtcbiAgICAgICAgICAgICAgICBpdGVtcyA9IFtpdGVtXVxuICAgICAgICAgICAgICAgIG5vSWQgPSB0cnVlXG4gICAgICAgICAgICAgICAgLy8gaWYgdGFnIGlzIHN0YXIsIG5vIG5lZWQgdG8gY2hlY2sgaXQgaW4gbWF0Y2goKVxuICAgICAgICAgICAgICAgIGlmIChwYXJ0LnRhZyA9PT0gXCIqXCIpIG5vVGFnID0gdHJ1ZVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCFpdGVtcyl7XG5cbiAgICAgICAgICAgIGlmIChwYXJ0LmNsYXNzZXMgJiYgbm9kZS5nZXRFbGVtZW50c0J5Q2xhc3NOYW1lICYmIHRoaXMuaGFzKFwiR0VUX0VMRU1FTlRTX0JZX0NMQVNTX05BTUVcIikpe1xuICAgICAgICAgICAgICAgIGl0ZW1zID0gbm9kZS5nZXRFbGVtZW50c0J5Q2xhc3NOYW1lKHBhcnQuY2xhc3NMaXN0KVxuICAgICAgICAgICAgICAgIG5vQ2xhc3MgPSB0cnVlXG4gICAgICAgICAgICAgICAgLy8gaWYgdGFnIGlzIHN0YXIsIG5vIG5lZWQgdG8gY2hlY2sgaXQgaW4gbWF0Y2goKVxuICAgICAgICAgICAgICAgIGlmIChwYXJ0LnRhZyA9PT0gXCIqXCIpIG5vVGFnID0gdHJ1ZVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBpdGVtcyA9IG5vZGUuZ2V0RWxlbWVudHNCeVRhZ05hbWUocGFydC50YWcpXG4gICAgICAgICAgICAgICAgLy8gaWYgdGFnIGlzIHN0YXIsIG5lZWQgdG8gY2hlY2sgaXQgaW4gbWF0Y2ggYmVjYXVzZSBpdCBjb3VsZCBzZWxlY3QganVuaywgYm9ob1xuICAgICAgICAgICAgICAgIGlmIChwYXJ0LnRhZyAhPT0gXCIqXCIpIG5vVGFnID0gdHJ1ZVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoIWl0ZW1zIHx8ICFpdGVtcy5sZW5ndGgpIHJldHVybiBmYWxzZVxuXG4gICAgICAgIH1cblxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaXRlbSA9IGl0ZW1zW2krK107KVxuICAgICAgICAgICAgaWYgKChub1RhZyAmJiBub0lkICYmIG5vQ2xhc3MgJiYgIXBhcnQuYXR0cmlidXRlcyAmJiAhcGFydC5wc2V1ZG9zKSB8fCB0aGlzLm1hdGNoKGl0ZW0sIHBhcnQsIG5vVGFnLCBub0lkLCBub0NsYXNzKSlcbiAgICAgICAgICAgICAgICBwdXNoKGl0ZW0pXG5cbiAgICAgICAgcmV0dXJuIHRydWVcblxuICAgIH0sXG5cbiAgICBcIj5cIjogZnVuY3Rpb24obm9kZSwgcGFydCwgcHVzaCl7IC8vIGRpcmVjdCBjaGlsZHJlblxuICAgICAgICBpZiAoKG5vZGUgPSBub2RlLmZpcnN0Q2hpbGQpKSBkbyB7XG4gICAgICAgICAgICBpZiAobm9kZS5ub2RlVHlwZSA9PSAxICYmIHRoaXMubWF0Y2gobm9kZSwgcGFydCkpIHB1c2gobm9kZSlcbiAgICAgICAgfSB3aGlsZSAoKG5vZGUgPSBub2RlLm5leHRTaWJsaW5nKSlcbiAgICB9LFxuXG4gICAgXCIrXCI6IGZ1bmN0aW9uKG5vZGUsIHBhcnQsIHB1c2gpeyAvLyBuZXh0IHNpYmxpbmdcbiAgICAgICAgd2hpbGUgKChub2RlID0gbm9kZS5uZXh0U2libGluZykpIGlmIChub2RlLm5vZGVUeXBlID09IDEpe1xuICAgICAgICAgICAgaWYgKHRoaXMubWF0Y2gobm9kZSwgcGFydCkpIHB1c2gobm9kZSlcbiAgICAgICAgICAgIGJyZWFrXG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgXCJeXCI6IGZ1bmN0aW9uKG5vZGUsIHBhcnQsIHB1c2gpeyAvLyBmaXJzdCBjaGlsZFxuICAgICAgICBub2RlID0gbm9kZS5maXJzdENoaWxkXG4gICAgICAgIGlmIChub2RlKXtcbiAgICAgICAgICAgIGlmIChub2RlLm5vZGVUeXBlID09PSAxKXtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5tYXRjaChub2RlLCBwYXJ0KSkgcHVzaChub2RlKVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBjb21iaW5hdG9yc1snKyddLmNhbGwodGhpcywgbm9kZSwgcGFydCwgcHVzaClcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBcIn5cIjogZnVuY3Rpb24obm9kZSwgcGFydCwgcHVzaCl7IC8vIG5leHQgc2libGluZ3NcbiAgICAgICAgd2hpbGUgKChub2RlID0gbm9kZS5uZXh0U2libGluZykpe1xuICAgICAgICAgICAgaWYgKG5vZGUubm9kZVR5cGUgPT09IDEgJiYgdGhpcy5tYXRjaChub2RlLCBwYXJ0KSkgcHVzaChub2RlKVxuICAgICAgICB9XG4gICAgfSxcblxuICAgIFwiKytcIjogZnVuY3Rpb24obm9kZSwgcGFydCwgcHVzaCl7IC8vIG5leHQgc2libGluZyBhbmQgcHJldmlvdXMgc2libGluZ1xuICAgICAgICBjb21iaW5hdG9yc1snKyddLmNhbGwodGhpcywgbm9kZSwgcGFydCwgcHVzaClcbiAgICAgICAgY29tYmluYXRvcnNbJyErJ10uY2FsbCh0aGlzLCBub2RlLCBwYXJ0LCBwdXNoKVxuICAgIH0sXG5cbiAgICBcIn5+XCI6IGZ1bmN0aW9uKG5vZGUsIHBhcnQsIHB1c2gpeyAvLyBuZXh0IHNpYmxpbmdzIGFuZCBwcmV2aW91cyBzaWJsaW5nc1xuICAgICAgICBjb21iaW5hdG9yc1snfiddLmNhbGwodGhpcywgbm9kZSwgcGFydCwgcHVzaClcbiAgICAgICAgY29tYmluYXRvcnNbJyF+J10uY2FsbCh0aGlzLCBub2RlLCBwYXJ0LCBwdXNoKVxuICAgIH0sXG5cbiAgICBcIiFcIjogZnVuY3Rpb24obm9kZSwgcGFydCwgcHVzaCl7IC8vIGFsbCBwYXJlbnQgbm9kZXMgdXAgdG8gZG9jdW1lbnRcbiAgICAgICAgd2hpbGUgKChub2RlID0gbm9kZS5wYXJlbnROb2RlKSkgaWYgKG5vZGUgIT09IHRoaXMuZG9jdW1lbnQgJiYgdGhpcy5tYXRjaChub2RlLCBwYXJ0KSkgcHVzaChub2RlKVxuICAgIH0sXG5cbiAgICBcIiE+XCI6IGZ1bmN0aW9uKG5vZGUsIHBhcnQsIHB1c2gpeyAvLyBkaXJlY3QgcGFyZW50IChvbmUgbGV2ZWwpXG4gICAgICAgIG5vZGUgPSBub2RlLnBhcmVudE5vZGVcbiAgICAgICAgaWYgKG5vZGUgIT09IHRoaXMuZG9jdW1lbnQgJiYgdGhpcy5tYXRjaChub2RlLCBwYXJ0KSkgcHVzaChub2RlKVxuICAgIH0sXG5cbiAgICBcIiErXCI6IGZ1bmN0aW9uKG5vZGUsIHBhcnQsIHB1c2gpeyAvLyBwcmV2aW91cyBzaWJsaW5nXG4gICAgICAgIHdoaWxlICgobm9kZSA9IG5vZGUucHJldmlvdXNTaWJsaW5nKSkgaWYgKG5vZGUubm9kZVR5cGUgPT0gMSl7XG4gICAgICAgICAgICBpZiAodGhpcy5tYXRjaChub2RlLCBwYXJ0KSkgcHVzaChub2RlKVxuICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBcIiFeXCI6IGZ1bmN0aW9uKG5vZGUsIHBhcnQsIHB1c2gpeyAvLyBsYXN0IGNoaWxkXG4gICAgICAgIG5vZGUgPSBub2RlLmxhc3RDaGlsZFxuICAgICAgICBpZiAobm9kZSl7XG4gICAgICAgICAgICBpZiAobm9kZS5ub2RlVHlwZSA9PSAxKXtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5tYXRjaChub2RlLCBwYXJ0KSkgcHVzaChub2RlKVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBjb21iaW5hdG9yc1snISsnXS5jYWxsKHRoaXMsIG5vZGUsIHBhcnQsIHB1c2gpXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgXCIhflwiOiBmdW5jdGlvbihub2RlLCBwYXJ0LCBwdXNoKXsgLy8gcHJldmlvdXMgc2libGluZ3NcbiAgICAgICAgd2hpbGUgKChub2RlID0gbm9kZS5wcmV2aW91c1NpYmxpbmcpKXtcbiAgICAgICAgICAgIGlmIChub2RlLm5vZGVUeXBlID09PSAxICYmIHRoaXMubWF0Y2gobm9kZSwgcGFydCkpIHB1c2gobm9kZSlcbiAgICAgICAgfVxuICAgIH1cblxufVxuXG5GaW5kZXIucHJvdG90eXBlLnNlYXJjaCA9IGZ1bmN0aW9uKGNvbnRleHQsIGV4cHJlc3Npb24sIGZvdW5kKXtcblxuICAgIGlmICghY29udGV4dCkgY29udGV4dCA9IHRoaXMuZG9jdW1lbnRcbiAgICBlbHNlIGlmICghY29udGV4dC5ub2RlVHlwZSAmJiBjb250ZXh0LmRvY3VtZW50KSBjb250ZXh0ID0gY29udGV4dC5kb2N1bWVudFxuXG4gICAgdmFyIGV4cHJlc3Npb25zID0gcGFyc2UoZXhwcmVzc2lvbilcblxuICAgIC8vIG5vIGV4cHJlc3Npb25zIHdlcmUgcGFyc2VkLiB0b2RvOiBpcyB0aGlzIHJlYWxseSBuZWNlc3Nhcnk/XG4gICAgaWYgKCFleHByZXNzaW9ucyB8fCAhZXhwcmVzc2lvbnMubGVuZ3RoKSB0aHJvdyBuZXcgRXJyb3IoXCJpbnZhbGlkIGV4cHJlc3Npb25cIilcblxuICAgIGlmICghZm91bmQpIGZvdW5kID0gW11cblxuICAgIHZhciB1bmlxdWVzLCBwdXNoID0gaXNBcnJheShmb3VuZCkgPyBmdW5jdGlvbihub2RlKXtcbiAgICAgICAgZm91bmRbZm91bmQubGVuZ3RoXSA9IG5vZGVcbiAgICB9IDogZnVuY3Rpb24obm9kZSl7XG4gICAgICAgIGZvdW5kW2ZvdW5kLmxlbmd0aCsrXSA9IG5vZGVcbiAgICB9XG5cbiAgICAvLyBpZiB0aGVyZSBpcyBtb3JlIHRoYW4gb25lIGV4cHJlc3Npb24gd2UgbmVlZCB0byBjaGVjayBmb3IgZHVwbGljYXRlcyB3aGVuIHdlIHB1c2ggdG8gZm91bmRcbiAgICAvLyB0aGlzIHNpbXBseSBzYXZlcyB0aGUgb2xkIHB1c2ggYW5kIHdyYXBzIGl0IGFyb3VuZCBhbiB1aWQgZHVwZSBjaGVjay5cbiAgICBpZiAoZXhwcmVzc2lvbnMubGVuZ3RoID4gMSl7XG4gICAgICAgIHVuaXF1ZXMgPSB7fVxuICAgICAgICB2YXIgcGx1c2ggPSBwdXNoXG4gICAgICAgIHB1c2ggPSBmdW5jdGlvbihub2RlKXtcbiAgICAgICAgICAgIHZhciB1aWQgPSB1bmlxdWVJRChub2RlKVxuICAgICAgICAgICAgaWYgKCF1bmlxdWVzW3VpZF0pe1xuICAgICAgICAgICAgICAgIHVuaXF1ZXNbdWlkXSA9IHRydWVcbiAgICAgICAgICAgICAgICBwbHVzaChub2RlKVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgLy8gd2Fsa2VyXG5cbiAgICB2YXIgbm9kZSwgbm9kZXMsIHBhcnRcblxuICAgIG1haW46IGZvciAodmFyIGkgPSAwOyBleHByZXNzaW9uID0gZXhwcmVzc2lvbnNbaSsrXTspe1xuXG4gICAgICAgIC8vIHF1ZXJ5U2VsZWN0b3JcblxuICAgICAgICAvLyBUT0RPOiBtb3JlIGZ1bmN0aW9uYWwgdGVzdHNcblxuICAgICAgICAvLyBpZiB0aGVyZSBpcyBxdWVyeVNlbGVjdG9yQWxsIChhbmQgdGhlIGV4cHJlc3Npb24gZG9lcyBub3QgZmFpbCkgdXNlIGl0LlxuICAgICAgICBpZiAoIXNsaWNrLm5vUVNBICYmIHRoaXMucXVlcnlTZWxlY3RvckFsbCl7XG5cbiAgICAgICAgICAgIG5vZGVzID0gdGhpcy5xdWVyeVNlbGVjdG9yQWxsKGNvbnRleHQsIGV4cHJlc3Npb24pXG4gICAgICAgICAgICBpZiAobm9kZXMgIT09IHRydWUpe1xuICAgICAgICAgICAgICAgIGlmIChub2RlcyAmJiBub2Rlcy5sZW5ndGgpIGZvciAodmFyIGogPSAwOyBub2RlID0gbm9kZXNbaisrXTspIGlmIChub2RlLm5vZGVOYW1lID4gJ0AnKXtcbiAgICAgICAgICAgICAgICAgICAgcHVzaChub2RlKVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjb250aW51ZSBtYWluXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyBpZiB0aGVyZSBpcyBvbmx5IG9uZSBwYXJ0IGluIHRoZSBleHByZXNzaW9uIHdlIGRvbid0IG5lZWQgdG8gY2hlY2sgZWFjaCBwYXJ0IGZvciBkdXBsaWNhdGVzLlxuICAgICAgICAvLyB0b2RvOiB0aGlzIG1pZ2h0IGJlIHRvbyBuYWl2ZS4gd2hpbGUgc29saWQsIHRoZXJlIGNhbiBiZSBleHByZXNzaW9uIHNlcXVlbmNlcyB0aGF0IGRvIG5vdFxuICAgICAgICAvLyBwcm9kdWNlIGR1cGxpY2F0ZXMuIFwiYm9keSBkaXZcIiBmb3IgaW5zdGFuY2UsIGNhbiBuZXZlciBnaXZlIHlvdSBlYWNoIGRpdiBtb3JlIHRoYW4gb25jZS5cbiAgICAgICAgLy8gXCJib2R5IGRpdiBhXCIgb24gdGhlIG90aGVyIGhhbmQgbWlnaHQuXG4gICAgICAgIGlmIChleHByZXNzaW9uLmxlbmd0aCA9PT0gMSl7XG5cbiAgICAgICAgICAgIHBhcnQgPSBleHByZXNzaW9uWzBdXG4gICAgICAgICAgICBjb21iaW5hdG9yc1twYXJ0LmNvbWJpbmF0b3JdLmNhbGwodGhpcywgY29udGV4dCwgcGFydCwgcHVzaClcblxuICAgICAgICB9IGVsc2Uge1xuXG4gICAgICAgICAgICB2YXIgY3MgPSBbY29udGV4dF0sIGMsIGYsIHUsIHAgPSBmdW5jdGlvbihub2RlKXtcbiAgICAgICAgICAgICAgICB2YXIgdWlkID0gdW5pcXVlSUQobm9kZSlcbiAgICAgICAgICAgICAgICBpZiAoIXVbdWlkXSl7XG4gICAgICAgICAgICAgICAgICAgIHVbdWlkXSA9IHRydWVcbiAgICAgICAgICAgICAgICAgICAgZltmLmxlbmd0aF0gPSBub2RlXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBsb29wIHRoZSBleHByZXNzaW9uIHBhcnRzXG4gICAgICAgICAgICBmb3IgKHZhciBqID0gMDsgcGFydCA9IGV4cHJlc3Npb25baisrXTspe1xuICAgICAgICAgICAgICAgIGYgPSBbXTsgdSA9IHt9XG4gICAgICAgICAgICAgICAgLy8gbG9vcCB0aGUgY29udGV4dHNcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBrID0gMDsgYyA9IGNzW2srK107KSBjb21iaW5hdG9yc1twYXJ0LmNvbWJpbmF0b3JdLmNhbGwodGhpcywgYywgcGFydCwgcClcbiAgICAgICAgICAgICAgICAvLyBub3RoaW5nIHdhcyBmb3VuZCwgdGhlIGV4cHJlc3Npb24gZmFpbGVkLCBjb250aW51ZSB0byB0aGUgbmV4dCBleHByZXNzaW9uLlxuICAgICAgICAgICAgICAgIGlmICghZi5sZW5ndGgpIGNvbnRpbnVlIG1haW5cbiAgICAgICAgICAgICAgICBjcyA9IGYgLy8gc2V0IHRoZSBjb250ZXh0cyBmb3IgZnV0dXJlIHBhcnRzIChpZiBhbnkpXG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChpID09PSAwKSBmb3VuZCA9IGYgLy8gZmlyc3QgZXhwcmVzc2lvbi4gZGlyZWN0bHkgc2V0IGZvdW5kLlxuICAgICAgICAgICAgZWxzZSBmb3IgKHZhciBsID0gMDsgbCA8IGYubGVuZ3RoOyBsKyspIHB1c2goZltsXSkgLy8gYW55IG90aGVyIGV4cHJlc3Npb24gbmVlZHMgdG8gcHVzaCB0byBmb3VuZC5cbiAgICAgICAgfVxuXG4gICAgfVxuXG4gICAgaWYgKHVuaXF1ZXMgJiYgZm91bmQgJiYgZm91bmQubGVuZ3RoID4gMSkgdGhpcy5zb3J0KGZvdW5kKVxuXG4gICAgcmV0dXJuIGZvdW5kXG5cbn1cblxuRmluZGVyLnByb3RvdHlwZS5zb3J0ID0gZnVuY3Rpb24obm9kZXMpe1xuICAgIHJldHVybiB0aGlzLnNvcnRlciA/IEFycmF5LnByb3RvdHlwZS5zb3J0LmNhbGwobm9kZXMsIHRoaXMuc29ydGVyKSA6IG5vZGVzXG59XG5cbi8vIFRPRE86IG1vc3Qgb2YgdGhlc2UgcHNldWRvIHNlbGVjdG9ycyBpbmNsdWRlIDxodG1sPiBhbmQgcXNhIGRvZXNudC4gZml4bWUuXG5cbnZhciBwc2V1ZG9zID0ge1xuXG5cbiAgICAvLyBUT0RPOiByZXR1cm5zIGRpZmZlcmVudCByZXN1bHRzIHRoYW4gcXNhIGVtcHR5LlxuXG4gICAgJ2VtcHR5JzogZnVuY3Rpb24oKXtcbiAgICAgICAgcmV0dXJuICEodGhpcyAmJiB0aGlzLm5vZGVUeXBlID09PSAxKSAmJiAhKHRoaXMuaW5uZXJUZXh0IHx8IHRoaXMudGV4dENvbnRlbnQgfHwgJycpLmxlbmd0aFxuICAgIH0sXG5cbiAgICAnbm90JzogZnVuY3Rpb24oZXhwcmVzc2lvbil7XG4gICAgICAgIHJldHVybiAhc2xpY2subWF0Y2godGhpcywgZXhwcmVzc2lvbilcbiAgICB9LFxuXG4gICAgJ2NvbnRhaW5zJzogZnVuY3Rpb24odGV4dCl7XG4gICAgICAgIHJldHVybiAodGhpcy5pbm5lclRleHQgfHwgdGhpcy50ZXh0Q29udGVudCB8fCAnJykuaW5kZXhPZih0ZXh0KSA+IC0xXG4gICAgfSxcblxuICAgICdmaXJzdC1jaGlsZCc6IGZ1bmN0aW9uKCl7XG4gICAgICAgIHZhciBub2RlID0gdGhpc1xuICAgICAgICB3aGlsZSAoKG5vZGUgPSBub2RlLnByZXZpb3VzU2libGluZykpIGlmIChub2RlLm5vZGVUeXBlID09IDEpIHJldHVybiBmYWxzZVxuICAgICAgICByZXR1cm4gdHJ1ZVxuICAgIH0sXG5cbiAgICAnbGFzdC1jaGlsZCc6IGZ1bmN0aW9uKCl7XG4gICAgICAgIHZhciBub2RlID0gdGhpc1xuICAgICAgICB3aGlsZSAoKG5vZGUgPSBub2RlLm5leHRTaWJsaW5nKSkgaWYgKG5vZGUubm9kZVR5cGUgPT0gMSkgcmV0dXJuIGZhbHNlXG4gICAgICAgIHJldHVybiB0cnVlXG4gICAgfSxcblxuICAgICdvbmx5LWNoaWxkJzogZnVuY3Rpb24oKXtcbiAgICAgICAgdmFyIHByZXYgPSB0aGlzXG4gICAgICAgIHdoaWxlICgocHJldiA9IHByZXYucHJldmlvdXNTaWJsaW5nKSkgaWYgKHByZXYubm9kZVR5cGUgPT0gMSkgcmV0dXJuIGZhbHNlXG5cbiAgICAgICAgdmFyIG5leHQgPSB0aGlzXG4gICAgICAgIHdoaWxlICgobmV4dCA9IG5leHQubmV4dFNpYmxpbmcpKSBpZiAobmV4dC5ub2RlVHlwZSA9PSAxKSByZXR1cm4gZmFsc2VcblxuICAgICAgICByZXR1cm4gdHJ1ZVxuICAgIH0sXG5cbiAgICAnZmlyc3Qtb2YtdHlwZSc6IGZ1bmN0aW9uKCl7XG4gICAgICAgIHZhciBub2RlID0gdGhpcywgbm9kZU5hbWUgPSBub2RlLm5vZGVOYW1lXG4gICAgICAgIHdoaWxlICgobm9kZSA9IG5vZGUucHJldmlvdXNTaWJsaW5nKSkgaWYgKG5vZGUubm9kZU5hbWUgPT0gbm9kZU5hbWUpIHJldHVybiBmYWxzZVxuICAgICAgICByZXR1cm4gdHJ1ZVxuICAgIH0sXG5cbiAgICAnbGFzdC1vZi10eXBlJzogZnVuY3Rpb24oKXtcbiAgICAgICAgdmFyIG5vZGUgPSB0aGlzLCBub2RlTmFtZSA9IG5vZGUubm9kZU5hbWVcbiAgICAgICAgd2hpbGUgKChub2RlID0gbm9kZS5uZXh0U2libGluZykpIGlmIChub2RlLm5vZGVOYW1lID09IG5vZGVOYW1lKSByZXR1cm4gZmFsc2VcbiAgICAgICAgcmV0dXJuIHRydWVcbiAgICB9LFxuXG4gICAgJ29ubHktb2YtdHlwZSc6IGZ1bmN0aW9uKCl7XG4gICAgICAgIHZhciBwcmV2ID0gdGhpcywgbm9kZU5hbWUgPSB0aGlzLm5vZGVOYW1lXG4gICAgICAgIHdoaWxlICgocHJldiA9IHByZXYucHJldmlvdXNTaWJsaW5nKSkgaWYgKHByZXYubm9kZU5hbWUgPT0gbm9kZU5hbWUpIHJldHVybiBmYWxzZVxuICAgICAgICB2YXIgbmV4dCA9IHRoaXNcbiAgICAgICAgd2hpbGUgKChuZXh0ID0gbmV4dC5uZXh0U2libGluZykpIGlmIChuZXh0Lm5vZGVOYW1lID09IG5vZGVOYW1lKSByZXR1cm4gZmFsc2VcbiAgICAgICAgcmV0dXJuIHRydWVcbiAgICB9LFxuXG4gICAgJ2VuYWJsZWQnOiBmdW5jdGlvbigpe1xuICAgICAgICByZXR1cm4gIXRoaXMuZGlzYWJsZWRcbiAgICB9LFxuXG4gICAgJ2Rpc2FibGVkJzogZnVuY3Rpb24oKXtcbiAgICAgICAgcmV0dXJuIHRoaXMuZGlzYWJsZWRcbiAgICB9LFxuXG4gICAgJ2NoZWNrZWQnOiBmdW5jdGlvbigpe1xuICAgICAgICByZXR1cm4gdGhpcy5jaGVja2VkIHx8IHRoaXMuc2VsZWN0ZWRcbiAgICB9LFxuXG4gICAgJ3NlbGVjdGVkJzogZnVuY3Rpb24oKXtcbiAgICAgICAgcmV0dXJuIHRoaXMuc2VsZWN0ZWRcbiAgICB9LFxuXG4gICAgJ2ZvY3VzJzogZnVuY3Rpb24oKXtcbiAgICAgICAgdmFyIGRvYyA9IHRoaXMub3duZXJEb2N1bWVudFxuICAgICAgICByZXR1cm4gZG9jLmFjdGl2ZUVsZW1lbnQgPT09IHRoaXMgJiYgKHRoaXMuaHJlZiB8fCB0aGlzLnR5cGUgfHwgc2xpY2suaGFzQXR0cmlidXRlKHRoaXMsICd0YWJpbmRleCcpKVxuICAgIH0sXG5cbiAgICAncm9vdCc6IGZ1bmN0aW9uKCl7XG4gICAgICAgIHJldHVybiAodGhpcyA9PT0gdGhpcy5vd25lckRvY3VtZW50LmRvY3VtZW50RWxlbWVudClcbiAgICB9XG5cbn1cblxuRmluZGVyLnByb3RvdHlwZS5tYXRjaCA9IGZ1bmN0aW9uKG5vZGUsIGJpdCwgbm9UYWcsIG5vSWQsIG5vQ2xhc3Mpe1xuXG4gICAgLy8gVE9ETzogbW9yZSBmdW5jdGlvbmFsIHRlc3RzID9cblxuICAgIGlmICghc2xpY2subm9RU0EgJiYgdGhpcy5tYXRjaGVzU2VsZWN0b3Ipe1xuICAgICAgICB2YXIgbWF0Y2hlcyA9IHRoaXMubWF0Y2hlc1NlbGVjdG9yKG5vZGUsIGJpdClcbiAgICAgICAgaWYgKG1hdGNoZXMgIT09IG51bGwpIHJldHVybiBtYXRjaGVzXG4gICAgfVxuXG4gICAgLy8gbm9ybWFsIG1hdGNoaW5nXG5cbiAgICBpZiAoIW5vVGFnICYmIGJpdC50YWcpe1xuXG4gICAgICAgIHZhciBub2RlTmFtZSA9IG5vZGUubm9kZU5hbWUudG9Mb3dlckNhc2UoKVxuICAgICAgICBpZiAoYml0LnRhZyA9PT0gXCIqXCIpe1xuICAgICAgICAgICAgaWYgKG5vZGVOYW1lIDwgXCJAXCIpIHJldHVybiBmYWxzZVxuICAgICAgICB9IGVsc2UgaWYgKG5vZGVOYW1lICE9IGJpdC50YWcpe1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgICAgIH1cblxuICAgIH1cblxuICAgIGlmICghbm9JZCAmJiBiaXQuaWQgJiYgbm9kZS5nZXRBdHRyaWJ1dGUoJ2lkJykgIT09IGJpdC5pZCkgcmV0dXJuIGZhbHNlXG5cbiAgICB2YXIgaSwgcGFydFxuXG4gICAgaWYgKCFub0NsYXNzICYmIGJpdC5jbGFzc2VzKXtcblxuICAgICAgICB2YXIgY2xhc3NOYW1lID0gdGhpcy5nZXRBdHRyaWJ1dGUobm9kZSwgXCJjbGFzc1wiKVxuICAgICAgICBpZiAoIWNsYXNzTmFtZSkgcmV0dXJuIGZhbHNlXG5cbiAgICAgICAgZm9yIChwYXJ0IGluIGJpdC5jbGFzc2VzKSBpZiAoIVJlZ0V4cCgnKF58XFxcXHMpJyArIGJpdC5jbGFzc2VzW3BhcnRdICsgJyhcXFxcc3wkKScpLnRlc3QoY2xhc3NOYW1lKSkgcmV0dXJuIGZhbHNlXG4gICAgfVxuXG4gICAgdmFyIG5hbWUsIHZhbHVlXG5cbiAgICBpZiAoYml0LmF0dHJpYnV0ZXMpIGZvciAoaSA9IDA7IHBhcnQgPSBiaXQuYXR0cmlidXRlc1tpKytdOyl7XG5cbiAgICAgICAgdmFyIG9wZXJhdG9yICA9IHBhcnQub3BlcmF0b3IsXG4gICAgICAgICAgICBlc2NhcGVkICAgPSBwYXJ0LmVzY2FwZWRWYWx1ZVxuXG4gICAgICAgIG5hbWUgID0gcGFydC5uYW1lXG4gICAgICAgIHZhbHVlID0gcGFydC52YWx1ZVxuXG4gICAgICAgIGlmICghb3BlcmF0b3Ipe1xuXG4gICAgICAgICAgICBpZiAoIXRoaXMuaGFzQXR0cmlidXRlKG5vZGUsIG5hbWUpKSByZXR1cm4gZmFsc2VcblxuICAgICAgICB9IGVsc2Uge1xuXG4gICAgICAgICAgICB2YXIgYWN0dWFsID0gdGhpcy5nZXRBdHRyaWJ1dGUobm9kZSwgbmFtZSlcbiAgICAgICAgICAgIGlmIChhY3R1YWwgPT0gbnVsbCkgcmV0dXJuIGZhbHNlXG5cbiAgICAgICAgICAgIHN3aXRjaCAob3BlcmF0b3Ipe1xuICAgICAgICAgICAgICAgIGNhc2UgJ149JyA6IGlmICghUmVnRXhwKCAgICAgICdeJyArIGVzY2FwZWQgICAgICAgICAgICApLnRlc3QoYWN0dWFsKSkgcmV0dXJuIGZhbHNlOyBicmVha1xuICAgICAgICAgICAgICAgIGNhc2UgJyQ9JyA6IGlmICghUmVnRXhwKCAgICAgICAgICAgIGVzY2FwZWQgKyAnJCcgICAgICApLnRlc3QoYWN0dWFsKSkgcmV0dXJuIGZhbHNlOyBicmVha1xuICAgICAgICAgICAgICAgIGNhc2UgJ349JyA6IGlmICghUmVnRXhwKCcoXnxcXFxccyknICsgZXNjYXBlZCArICcoXFxcXHN8JCknKS50ZXN0KGFjdHVhbCkpIHJldHVybiBmYWxzZTsgYnJlYWtcbiAgICAgICAgICAgICAgICBjYXNlICd8PScgOiBpZiAoIVJlZ0V4cCggICAgICAnXicgKyBlc2NhcGVkICsgJygtfCQpJyAgKS50ZXN0KGFjdHVhbCkpIHJldHVybiBmYWxzZTsgYnJlYWtcblxuICAgICAgICAgICAgICAgIGNhc2UgJz0nICA6IGlmIChhY3R1YWwgIT09IHZhbHVlKSByZXR1cm4gZmFsc2U7IGJyZWFrXG4gICAgICAgICAgICAgICAgY2FzZSAnKj0nIDogaWYgKGFjdHVhbC5pbmRleE9mKHZhbHVlKSA9PT0gLTEpIHJldHVybiBmYWxzZTsgYnJlYWtcbiAgICAgICAgICAgICAgICBkZWZhdWx0ICAgOiByZXR1cm4gZmFsc2VcbiAgICAgICAgICAgIH1cblxuICAgICAgICB9XG4gICAgfVxuXG4gICAgaWYgKGJpdC5wc2V1ZG9zKSBmb3IgKGkgPSAwOyBwYXJ0ID0gYml0LnBzZXVkb3NbaSsrXTspe1xuXG4gICAgICAgIG5hbWUgID0gcGFydC5uYW1lXG4gICAgICAgIHZhbHVlID0gcGFydC52YWx1ZVxuXG4gICAgICAgIGlmIChwc2V1ZG9zW25hbWVdKSByZXR1cm4gcHNldWRvc1tuYW1lXS5jYWxsKG5vZGUsIHZhbHVlKVxuXG4gICAgICAgIGlmICh2YWx1ZSAhPSBudWxsKXtcbiAgICAgICAgICAgIGlmICh0aGlzLmdldEF0dHJpYnV0ZShub2RlLCBuYW1lKSAhPT0gdmFsdWUpIHJldHVybiBmYWxzZVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgaWYgKCF0aGlzLmhhc0F0dHJpYnV0ZShub2RlLCBuYW1lKSkgcmV0dXJuIGZhbHNlXG4gICAgICAgIH1cblxuICAgIH1cblxuICAgIHJldHVybiB0cnVlXG5cbn1cblxuRmluZGVyLnByb3RvdHlwZS5tYXRjaGVzID0gZnVuY3Rpb24obm9kZSwgZXhwcmVzc2lvbil7XG5cbiAgICB2YXIgZXhwcmVzc2lvbnMgPSBwYXJzZShleHByZXNzaW9uKVxuXG4gICAgaWYgKGV4cHJlc3Npb25zLmxlbmd0aCA9PT0gMSAmJiBleHByZXNzaW9uc1swXS5sZW5ndGggPT09IDEpeyAvLyBzaW1wbGVzdCBtYXRjaFxuICAgICAgICByZXR1cm4gdGhpcy5tYXRjaChub2RlLCBleHByZXNzaW9uc1swXVswXSlcbiAgICB9XG5cbiAgICAvLyBUT0RPOiBtb3JlIGZ1bmN0aW9uYWwgdGVzdHMgP1xuXG4gICAgaWYgKCFzbGljay5ub1FTQSAmJiB0aGlzLm1hdGNoZXNTZWxlY3Rvcil7XG4gICAgICAgIHZhciBtYXRjaGVzID0gdGhpcy5tYXRjaGVzU2VsZWN0b3Iobm9kZSwgZXhwcmVzc2lvbnMpXG4gICAgICAgIGlmIChtYXRjaGVzICE9PSBudWxsKSByZXR1cm4gbWF0Y2hlc1xuICAgIH1cblxuICAgIHZhciBub2RlcyA9IHRoaXMuc2VhcmNoKHRoaXMuZG9jdW1lbnQsIGV4cHJlc3Npb24sIHtsZW5ndGg6IDB9KVxuXG4gICAgZm9yICh2YXIgaSA9IDAsIHJlczsgcmVzID0gbm9kZXNbaSsrXTspIGlmIChub2RlID09PSByZXMpIHJldHVybiB0cnVlXG4gICAgcmV0dXJuIGZhbHNlXG5cbn1cblxudmFyIGZpbmRlcnMgPSB7fVxuXG52YXIgZmluZGVyID0gZnVuY3Rpb24oY29udGV4dCl7XG4gICAgdmFyIGRvYyA9IGNvbnRleHQgfHwgZG9jdW1lbnRcbiAgICBpZiAoZG9jLm93bmVyRG9jdW1lbnQpIGRvYyA9IGRvYy5vd25lckRvY3VtZW50XG4gICAgZWxzZSBpZiAoZG9jLmRvY3VtZW50KSBkb2MgPSBkb2MuZG9jdW1lbnRcblxuICAgIGlmIChkb2Mubm9kZVR5cGUgIT09IDkpIHRocm93IG5ldyBUeXBlRXJyb3IoXCJpbnZhbGlkIGRvY3VtZW50XCIpXG5cbiAgICB2YXIgdWlkID0gdW5pcXVlSUQoZG9jKVxuICAgIHJldHVybiBmaW5kZXJzW3VpZF0gfHwgKGZpbmRlcnNbdWlkXSA9IG5ldyBGaW5kZXIoZG9jKSlcbn1cblxuLy8gLi4uIEFQSSAuLi5cblxudmFyIHNsaWNrID0gZnVuY3Rpb24oZXhwcmVzc2lvbiwgY29udGV4dCl7XG4gICAgcmV0dXJuIHNsaWNrLnNlYXJjaChleHByZXNzaW9uLCBjb250ZXh0KVxufVxuXG5zbGljay5zZWFyY2ggPSBmdW5jdGlvbihleHByZXNzaW9uLCBjb250ZXh0LCBmb3VuZCl7XG4gICAgcmV0dXJuIGZpbmRlcihjb250ZXh0KS5zZWFyY2goY29udGV4dCwgZXhwcmVzc2lvbiwgZm91bmQpXG59XG5cbnNsaWNrLmZpbmQgPSBmdW5jdGlvbihleHByZXNzaW9uLCBjb250ZXh0KXtcbiAgICByZXR1cm4gZmluZGVyKGNvbnRleHQpLnNlYXJjaChjb250ZXh0LCBleHByZXNzaW9uKVswXSB8fCBudWxsXG59XG5cbnNsaWNrLmdldEF0dHJpYnV0ZSA9IGZ1bmN0aW9uKG5vZGUsIG5hbWUpe1xuICAgIHJldHVybiBmaW5kZXIobm9kZSkuZ2V0QXR0cmlidXRlKG5vZGUsIG5hbWUpXG59XG5cbnNsaWNrLmhhc0F0dHJpYnV0ZSA9IGZ1bmN0aW9uKG5vZGUsIG5hbWUpe1xuICAgIHJldHVybiBmaW5kZXIobm9kZSkuaGFzQXR0cmlidXRlKG5vZGUsIG5hbWUpXG59XG5cbnNsaWNrLmNvbnRhaW5zID0gZnVuY3Rpb24oY29udGV4dCwgbm9kZSl7XG4gICAgcmV0dXJuIGZpbmRlcihjb250ZXh0KS5jb250YWlucyhjb250ZXh0LCBub2RlKVxufVxuXG5zbGljay5tYXRjaGVzID0gZnVuY3Rpb24obm9kZSwgZXhwcmVzc2lvbil7XG4gICAgcmV0dXJuIGZpbmRlcihub2RlKS5tYXRjaGVzKG5vZGUsIGV4cHJlc3Npb24pXG59XG5cbnNsaWNrLnNvcnQgPSBmdW5jdGlvbihub2Rlcyl7XG4gICAgaWYgKG5vZGVzICYmIG5vZGVzLmxlbmd0aCA+IDEpIGZpbmRlcihub2Rlc1swXSkuc29ydChub2RlcylcbiAgICByZXR1cm4gbm9kZXNcbn1cblxuc2xpY2sucGFyc2UgPSBwYXJzZTtcblxuLy8gc2xpY2suZGVidWcgPSB0cnVlXG4vLyBzbGljay5ub1FTQSAgPSB0cnVlXG5cbm1vZHVsZS5leHBvcnRzID0gc2xpY2tcbiIsIihmdW5jdGlvbiAoZ2xvYmFsKXtcbi8qXG5zbGlja1xuKi9cInVzZSBzdHJpY3RcIlxuXG5tb2R1bGUuZXhwb3J0cyA9IFwiZG9jdW1lbnRcIiBpbiBnbG9iYWwgPyByZXF1aXJlKFwiLi9maW5kZXJcIikgOiB7IHBhcnNlOiByZXF1aXJlKFwiLi9wYXJzZXJcIikgfVxuXG59KS5jYWxsKHRoaXMsdHlwZW9mIHNlbGYgIT09IFwidW5kZWZpbmVkXCIgPyBzZWxmIDogdHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdyA6IHt9KSIsIi8qXG5TbGljayBQYXJzZXJcbiAtIG9yaWdpbmFsbHkgY3JlYXRlZCBieSB0aGUgYWxtaWdodHkgVGhvbWFzIEF5bG90dCA8QHN1YnRsZWdyYWRpZW50PiAoaHR0cDovL3N1YnRsZWdyYWRpZW50LmNvbSlcbiovXCJ1c2Ugc3RyaWN0XCJcblxuLy8gTm90YWJsZSBjaGFuZ2VzIGZyb20gU2xpY2suUGFyc2VyIDEuMC54XG5cbi8vIFRoZSBwYXJzZXIgbm93IHVzZXMgMiBjbGFzc2VzOiBFeHByZXNzaW9ucyBhbmQgRXhwcmVzc2lvblxuLy8gYG5ldyBFeHByZXNzaW9uc2AgcHJvZHVjZXMgYW4gYXJyYXktbGlrZSBvYmplY3QgY29udGFpbmluZyBhIGxpc3Qgb2YgRXhwcmVzc2lvbiBvYmplY3RzXG4vLyAtIEV4cHJlc3Npb25zOjp0b1N0cmluZygpIHByb2R1Y2VzIGEgY2xlYW5lZCB1cCBleHByZXNzaW9ucyBzdHJpbmdcbi8vIGBuZXcgRXhwcmVzc2lvbmAgcHJvZHVjZXMgYW4gYXJyYXktbGlrZSBvYmplY3Rcbi8vIC0gRXhwcmVzc2lvbjo6dG9TdHJpbmcoKSBwcm9kdWNlcyBhIGNsZWFuZWQgdXAgZXhwcmVzc2lvbiBzdHJpbmdcbi8vIFRoZSBvbmx5IGV4cG9zZWQgbWV0aG9kIGlzIHBhcnNlLCB3aGljaCBwcm9kdWNlcyBhIChjYWNoZWQpIGBuZXcgRXhwcmVzc2lvbnNgIGluc3RhbmNlXG4vLyBwYXJzZWQucmF3IGlzIG5vIGxvbmdlciBwcmVzZW50LCB1c2UgLnRvU3RyaW5nKClcbi8vIHBhcnNlZC5leHByZXNzaW9uIGlzIG5vdyB1c2VsZXNzLCBqdXN0IHVzZSB0aGUgaW5kaWNlc1xuLy8gcGFyc2VkLnJldmVyc2UoKSBoYXMgYmVlbiByZW1vdmVkIGZvciBub3csIGR1ZSB0byBpdHMgYXBwYXJlbnQgdXNlbGVzc25lc3Ncbi8vIE90aGVyIGNoYW5nZXMgaW4gdGhlIEV4cHJlc3Npb25zIG9iamVjdDpcbi8vIC0gY2xhc3NOYW1lcyBhcmUgbm93IHVuaXF1ZSwgYW5kIHNhdmUgYm90aCBlc2NhcGVkIGFuZCB1bmVzY2FwZWQgdmFsdWVzXG4vLyAtIGF0dHJpYnV0ZXMgbm93IHNhdmUgYm90aCBlc2NhcGVkIGFuZCB1bmVzY2FwZWQgdmFsdWVzXG4vLyAtIHBzZXVkb3Mgbm93IHNhdmUgYm90aCBlc2NhcGVkIGFuZCB1bmVzY2FwZWQgdmFsdWVzXG5cbnZhciBlc2NhcGVSZSAgID0gLyhbLS4qKz9eJHt9KCl8W1xcXVxcL1xcXFxdKS9nLFxuICAgIHVuZXNjYXBlUmUgPSAvXFxcXC9nXG5cbnZhciBlc2NhcGUgPSBmdW5jdGlvbihzdHJpbmcpe1xuICAgIC8vIFhSZWdFeHAgdjIuMC4wLWJldGEtM1xuICAgIC8vIMKrIGh0dHBzOi8vZ2l0aHViLmNvbS9zbGV2aXRoYW4vWFJlZ0V4cC9ibG9iL21hc3Rlci9zcmMveHJlZ2V4cC5qc1xuICAgIHJldHVybiAoc3RyaW5nICsgXCJcIikucmVwbGFjZShlc2NhcGVSZSwgJ1xcXFwkMScpXG59XG5cbnZhciB1bmVzY2FwZSA9IGZ1bmN0aW9uKHN0cmluZyl7XG4gICAgcmV0dXJuIChzdHJpbmcgKyBcIlwiKS5yZXBsYWNlKHVuZXNjYXBlUmUsICcnKVxufVxuXG52YXIgc2xpY2tSZSA9IFJlZ0V4cChcbi8qXG4jIS91c3IvYmluL2VudiBydWJ5XG5wdXRzIFwiXFx0XFx0XCIgKyBEQVRBLnJlYWQuZ3N1YigvXFwoXFw/eFxcKXxcXHMrIy4qJHxcXHMrfFxcXFwkfFxcXFxuLywnJylcbl9fRU5EX19cbiAgICBcIig/eCleKD86XFxcbiAgICAgIFxcXFxzKiAoICwgKSBcXFxccyogICAgICAgICAgICAgICAjIFNlcGFyYXRvciAgICAgICAgICBcXG5cXFxuICAgIHwgXFxcXHMqICggPGNvbWJpbmF0b3I+KyApIFxcXFxzKiAgICMgQ29tYmluYXRvciAgICAgICAgIFxcblxcXG4gICAgfCAgICAgICggXFxcXHMrICkgICAgICAgICAgICAgICAgICMgQ29tYmluYXRvckNoaWxkcmVuIFxcblxcXG4gICAgfCAgICAgICggPHVuaWNvZGU+KyB8IFxcXFwqICkgICAgICMgVGFnICAgICAgICAgICAgICAgIFxcblxcXG4gICAgfCBcXFxcIyAgKCA8dW5pY29kZT4rICAgICAgICkgICAgICMgSUQgICAgICAgICAgICAgICAgIFxcblxcXG4gICAgfCBcXFxcLiAgKCA8dW5pY29kZT4rICAgICAgICkgICAgICMgQ2xhc3NOYW1lICAgICAgICAgIFxcblxcXG4gICAgfCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAjIEF0dHJpYnV0ZSAgICAgICAgICBcXG5cXFxuICAgIFxcXFxbICBcXFxuICAgICAgICBcXFxccyogKDx1bmljb2RlMT4rKSAgKD86ICBcXFxuICAgICAgICAgICAgXFxcXHMqIChbKl4kIX58XT89KSAgKD86ICBcXFxuICAgICAgICAgICAgICAgIFxcXFxzKiAoPzpcXFxuICAgICAgICAgICAgICAgICAgICAoW1xcXCInXT8pKC4qPylcXFxcOSBcXFxuICAgICAgICAgICAgICAgIClcXFxuICAgICAgICAgICAgKSAgXFxcbiAgICAgICAgKT8gIFxcXFxzKiAgXFxcbiAgICBcXFxcXSg/IVxcXFxdKSBcXG5cXFxuICAgIHwgICA6KyAoIDx1bmljb2RlPisgKSg/OlxcXG4gICAgXFxcXCggKD86XFxcbiAgICAgICAgKD86KFtcXFwiJ10pKFteXFxcXDEyXSopXFxcXDEyKXwoKD86XFxcXChbXildK1xcXFwpfFteKCldKikrKVxcXG4gICAgKSBcXFxcKVxcXG4gICAgKT9cXFxuICAgIClcIlxuKi9cblwiXig/OlxcXFxzKigsKVxcXFxzKnxcXFxccyooPGNvbWJpbmF0b3I+KylcXFxccyp8KFxcXFxzKyl8KDx1bmljb2RlPit8XFxcXCopfFxcXFwjKDx1bmljb2RlPispfFxcXFwuKDx1bmljb2RlPispfFxcXFxbXFxcXHMqKDx1bmljb2RlMT4rKSg/OlxcXFxzKihbKl4kIX58XT89KSg/OlxcXFxzKig/OihbXFxcIiddPykoLio/KVxcXFw5KSkpP1xcXFxzKlxcXFxdKD8hXFxcXF0pfCg6KykoPHVuaWNvZGU+KykoPzpcXFxcKCg/Oig/OihbXFxcIiddKShbXlxcXFwxM10qKVxcXFwxMyl8KCg/OlxcXFwoW14pXStcXFxcKXxbXigpXSopKykpXFxcXCkpPylcIlxuICAgIC5yZXBsYWNlKC88Y29tYmluYXRvcj4vLCAnWycgKyBlc2NhcGUoXCI+K35gIUAkJV4mPXt9XFxcXDs8L1wiKSArICddJylcbiAgICAucmVwbGFjZSgvPHVuaWNvZGU+L2csICcoPzpbXFxcXHdcXFxcdTAwYTEtXFxcXHVGRkZGLV18XFxcXFxcXFxbXlxcXFxzMC05YS1mXSknKVxuICAgIC5yZXBsYWNlKC88dW5pY29kZTE+L2csICcoPzpbOlxcXFx3XFxcXHUwMGExLVxcXFx1RkZGRi1dfFxcXFxcXFxcW15cXFxcczAtOWEtZl0pJylcbilcblxuLy8gUGFydFxuXG52YXIgUGFydCA9IGZ1bmN0aW9uIFBhcnQoY29tYmluYXRvcil7XG4gICAgdGhpcy5jb21iaW5hdG9yID0gY29tYmluYXRvciB8fCBcIiBcIlxuICAgIHRoaXMudGFnID0gXCIqXCJcbn1cblxuUGFydC5wcm90b3R5cGUudG9TdHJpbmcgPSBmdW5jdGlvbigpe1xuXG4gICAgaWYgKCF0aGlzLnJhdyl7XG5cbiAgICAgICAgdmFyIHhwciA9IFwiXCIsIGssIHBhcnRcblxuICAgICAgICB4cHIgKz0gdGhpcy50YWcgfHwgXCIqXCJcbiAgICAgICAgaWYgKHRoaXMuaWQpIHhwciArPSBcIiNcIiArIHRoaXMuaWRcbiAgICAgICAgaWYgKHRoaXMuY2xhc3NlcykgeHByICs9IFwiLlwiICsgdGhpcy5jbGFzc0xpc3Quam9pbihcIi5cIilcbiAgICAgICAgaWYgKHRoaXMuYXR0cmlidXRlcykgZm9yIChrID0gMDsgcGFydCA9IHRoaXMuYXR0cmlidXRlc1trKytdOyl7XG4gICAgICAgICAgICB4cHIgKz0gXCJbXCIgKyBwYXJ0Lm5hbWUgKyAocGFydC5vcGVyYXRvciA/IHBhcnQub3BlcmF0b3IgKyAnXCInICsgcGFydC52YWx1ZSArICdcIicgOiAnJykgKyBcIl1cIlxuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLnBzZXVkb3MpIGZvciAoayA9IDA7IHBhcnQgPSB0aGlzLnBzZXVkb3NbaysrXTspe1xuICAgICAgICAgICAgeHByICs9IFwiOlwiICsgcGFydC5uYW1lXG4gICAgICAgICAgICBpZiAocGFydC52YWx1ZSkgeHByICs9IFwiKFwiICsgcGFydC52YWx1ZSArIFwiKVwiXG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLnJhdyA9IHhwclxuXG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXMucmF3XG59XG5cbi8vIEV4cHJlc3Npb25cblxudmFyIEV4cHJlc3Npb24gPSBmdW5jdGlvbiBFeHByZXNzaW9uKCl7XG4gICAgdGhpcy5sZW5ndGggPSAwXG59XG5cbkV4cHJlc3Npb24ucHJvdG90eXBlLnRvU3RyaW5nID0gZnVuY3Rpb24oKXtcblxuICAgIGlmICghdGhpcy5yYXcpe1xuXG4gICAgICAgIHZhciB4cHIgPSBcIlwiXG5cbiAgICAgICAgZm9yICh2YXIgaiA9IDAsIGJpdDsgYml0ID0gdGhpc1tqKytdOyl7XG4gICAgICAgICAgICBpZiAoaiAhPT0gMSkgeHByICs9IFwiIFwiXG4gICAgICAgICAgICBpZiAoYml0LmNvbWJpbmF0b3IgIT09IFwiIFwiKSB4cHIgKz0gYml0LmNvbWJpbmF0b3IgKyBcIiBcIlxuICAgICAgICAgICAgeHByICs9IGJpdFxuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5yYXcgPSB4cHJcblxuICAgIH1cblxuICAgIHJldHVybiB0aGlzLnJhd1xufVxuXG52YXIgcmVwbGFjZXIgPSBmdW5jdGlvbihcbiAgICByYXdNYXRjaCxcblxuICAgIHNlcGFyYXRvcixcbiAgICBjb21iaW5hdG9yLFxuICAgIGNvbWJpbmF0b3JDaGlsZHJlbixcblxuICAgIHRhZ05hbWUsXG4gICAgaWQsXG4gICAgY2xhc3NOYW1lLFxuXG4gICAgYXR0cmlidXRlS2V5LFxuICAgIGF0dHJpYnV0ZU9wZXJhdG9yLFxuICAgIGF0dHJpYnV0ZVF1b3RlLFxuICAgIGF0dHJpYnV0ZVZhbHVlLFxuXG4gICAgcHNldWRvTWFya2VyLFxuICAgIHBzZXVkb0NsYXNzLFxuICAgIHBzZXVkb1F1b3RlLFxuICAgIHBzZXVkb0NsYXNzUXVvdGVkVmFsdWUsXG4gICAgcHNldWRvQ2xhc3NWYWx1ZVxuKXtcblxuICAgIHZhciBleHByZXNzaW9uLCBjdXJyZW50XG5cbiAgICBpZiAoc2VwYXJhdG9yIHx8ICF0aGlzLmxlbmd0aCl7XG4gICAgICAgIGV4cHJlc3Npb24gPSB0aGlzW3RoaXMubGVuZ3RoKytdID0gbmV3IEV4cHJlc3Npb25cbiAgICAgICAgaWYgKHNlcGFyYXRvcikgcmV0dXJuICcnXG4gICAgfVxuXG4gICAgaWYgKCFleHByZXNzaW9uKSBleHByZXNzaW9uID0gdGhpc1t0aGlzLmxlbmd0aCAtIDFdXG5cbiAgICBpZiAoY29tYmluYXRvciB8fCBjb21iaW5hdG9yQ2hpbGRyZW4gfHwgIWV4cHJlc3Npb24ubGVuZ3RoKXtcbiAgICAgICAgY3VycmVudCA9IGV4cHJlc3Npb25bZXhwcmVzc2lvbi5sZW5ndGgrK10gPSBuZXcgUGFydChjb21iaW5hdG9yKVxuICAgIH1cblxuICAgIGlmICghY3VycmVudCkgY3VycmVudCA9IGV4cHJlc3Npb25bZXhwcmVzc2lvbi5sZW5ndGggLSAxXVxuXG4gICAgaWYgKHRhZ05hbWUpe1xuXG4gICAgICAgIGN1cnJlbnQudGFnID0gdW5lc2NhcGUodGFnTmFtZSlcblxuICAgIH0gZWxzZSBpZiAoaWQpe1xuXG4gICAgICAgIGN1cnJlbnQuaWQgPSB1bmVzY2FwZShpZClcblxuICAgIH0gZWxzZSBpZiAoY2xhc3NOYW1lKXtcblxuICAgICAgICB2YXIgdW5lc2NhcGVkID0gdW5lc2NhcGUoY2xhc3NOYW1lKVxuXG4gICAgICAgIHZhciBjbGFzc2VzID0gY3VycmVudC5jbGFzc2VzIHx8IChjdXJyZW50LmNsYXNzZXMgPSB7fSlcbiAgICAgICAgaWYgKCFjbGFzc2VzW3VuZXNjYXBlZF0pe1xuICAgICAgICAgICAgY2xhc3Nlc1t1bmVzY2FwZWRdID0gZXNjYXBlKGNsYXNzTmFtZSlcbiAgICAgICAgICAgIHZhciBjbGFzc0xpc3QgPSBjdXJyZW50LmNsYXNzTGlzdCB8fCAoY3VycmVudC5jbGFzc0xpc3QgPSBbXSlcbiAgICAgICAgICAgIGNsYXNzTGlzdC5wdXNoKHVuZXNjYXBlZClcbiAgICAgICAgICAgIGNsYXNzTGlzdC5zb3J0KClcbiAgICAgICAgfVxuXG4gICAgfSBlbHNlIGlmIChwc2V1ZG9DbGFzcyl7XG5cbiAgICAgICAgcHNldWRvQ2xhc3NWYWx1ZSA9IHBzZXVkb0NsYXNzVmFsdWUgfHwgcHNldWRvQ2xhc3NRdW90ZWRWYWx1ZVxuXG4gICAgICAgIDsoY3VycmVudC5wc2V1ZG9zIHx8IChjdXJyZW50LnBzZXVkb3MgPSBbXSkpLnB1c2goe1xuICAgICAgICAgICAgdHlwZSAgICAgICAgIDogcHNldWRvTWFya2VyLmxlbmd0aCA9PSAxID8gJ2NsYXNzJyA6ICdlbGVtZW50JyxcbiAgICAgICAgICAgIG5hbWUgICAgICAgICA6IHVuZXNjYXBlKHBzZXVkb0NsYXNzKSxcbiAgICAgICAgICAgIGVzY2FwZWROYW1lICA6IGVzY2FwZShwc2V1ZG9DbGFzcyksXG4gICAgICAgICAgICB2YWx1ZSAgICAgICAgOiBwc2V1ZG9DbGFzc1ZhbHVlID8gdW5lc2NhcGUocHNldWRvQ2xhc3NWYWx1ZSkgOiBudWxsLFxuICAgICAgICAgICAgZXNjYXBlZFZhbHVlIDogcHNldWRvQ2xhc3NWYWx1ZSA/IGVzY2FwZShwc2V1ZG9DbGFzc1ZhbHVlKSA6IG51bGxcbiAgICAgICAgfSlcblxuICAgIH0gZWxzZSBpZiAoYXR0cmlidXRlS2V5KXtcblxuICAgICAgICBhdHRyaWJ1dGVWYWx1ZSA9IGF0dHJpYnV0ZVZhbHVlID8gZXNjYXBlKGF0dHJpYnV0ZVZhbHVlKSA6IG51bGxcblxuICAgICAgICA7KGN1cnJlbnQuYXR0cmlidXRlcyB8fCAoY3VycmVudC5hdHRyaWJ1dGVzID0gW10pKS5wdXNoKHtcbiAgICAgICAgICAgIG9wZXJhdG9yICAgICA6IGF0dHJpYnV0ZU9wZXJhdG9yLFxuICAgICAgICAgICAgbmFtZSAgICAgICAgIDogdW5lc2NhcGUoYXR0cmlidXRlS2V5KSxcbiAgICAgICAgICAgIGVzY2FwZWROYW1lICA6IGVzY2FwZShhdHRyaWJ1dGVLZXkpLFxuICAgICAgICAgICAgdmFsdWUgICAgICAgIDogYXR0cmlidXRlVmFsdWUgPyB1bmVzY2FwZShhdHRyaWJ1dGVWYWx1ZSkgOiBudWxsLFxuICAgICAgICAgICAgZXNjYXBlZFZhbHVlIDogYXR0cmlidXRlVmFsdWUgPyBlc2NhcGUoYXR0cmlidXRlVmFsdWUpIDogbnVsbFxuICAgICAgICB9KVxuXG4gICAgfVxuXG4gICAgcmV0dXJuICcnXG5cbn1cblxuLy8gRXhwcmVzc2lvbnNcblxudmFyIEV4cHJlc3Npb25zID0gZnVuY3Rpb24gRXhwcmVzc2lvbnMoZXhwcmVzc2lvbil7XG4gICAgdGhpcy5sZW5ndGggPSAwXG5cbiAgICB2YXIgc2VsZiA9IHRoaXNcblxuICAgIHZhciBvcmlnaW5hbCA9IGV4cHJlc3Npb24sIHJlcGxhY2VkXG5cbiAgICB3aGlsZSAoZXhwcmVzc2lvbil7XG4gICAgICAgIHJlcGxhY2VkID0gZXhwcmVzc2lvbi5yZXBsYWNlKHNsaWNrUmUsIGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICByZXR1cm4gcmVwbGFjZXIuYXBwbHkoc2VsZiwgYXJndW1lbnRzKVxuICAgICAgICB9KVxuICAgICAgICBpZiAocmVwbGFjZWQgPT09IGV4cHJlc3Npb24pIHRocm93IG5ldyBFcnJvcihvcmlnaW5hbCArICcgaXMgYW4gaW52YWxpZCBleHByZXNzaW9uJylcbiAgICAgICAgZXhwcmVzc2lvbiA9IHJlcGxhY2VkXG4gICAgfVxufVxuXG5FeHByZXNzaW9ucy5wcm90b3R5cGUudG9TdHJpbmcgPSBmdW5jdGlvbigpe1xuICAgIGlmICghdGhpcy5yYXcpe1xuICAgICAgICB2YXIgZXhwcmVzc2lvbnMgPSBbXVxuICAgICAgICBmb3IgKHZhciBpID0gMCwgZXhwcmVzc2lvbjsgZXhwcmVzc2lvbiA9IHRoaXNbaSsrXTspIGV4cHJlc3Npb25zLnB1c2goZXhwcmVzc2lvbilcbiAgICAgICAgdGhpcy5yYXcgPSBleHByZXNzaW9ucy5qb2luKFwiLCBcIilcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy5yYXdcbn1cblxudmFyIGNhY2hlID0ge31cblxudmFyIHBhcnNlID0gZnVuY3Rpb24oZXhwcmVzc2lvbil7XG4gICAgaWYgKGV4cHJlc3Npb24gPT0gbnVsbCkgcmV0dXJuIG51bGxcbiAgICBleHByZXNzaW9uID0gKCcnICsgZXhwcmVzc2lvbikucmVwbGFjZSgvXlxccyt8XFxzKyQvZywgJycpXG4gICAgcmV0dXJuIGNhY2hlW2V4cHJlc3Npb25dIHx8IChjYWNoZVtleHByZXNzaW9uXSA9IG5ldyBFeHByZXNzaW9ucyhleHByZXNzaW9uKSlcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBwYXJzZVxuIiwidmFyIGRvbXJlYWR5ID0gcmVxdWlyZShcImRvbXJlYWR5XCIpO1xudmFyIGRndWEgPSByZXF1aXJlKFwiLi9kZ3VhXCIpO1xudmFyIHNsaWNrID0gcmVxdWlyZShcInNsaWNrXCIpO1xuZG9tcmVhZHkoZnVuY3Rpb24oKSB7XG4gIGlmKHNsaWNrLmZpbmQoXCIjZGd1LWFuYWx5dGljc1wiKSkge1xuICAgIHZhciBhcHBsaWNhdGlvbiA9IG5ldyBkZ3VhLkFwcGxpY2F0aW9uKFwiI2RndS1hbmFseXRpY3NcIik7XG4gICAgYXBwbGljYXRpb24uaW5pdCgpO1xuICB9XG59KTtcbiIsIm1vZHVsZS5leHBvcnRzID0ge1xuICBBcHBsaWNhdGlvbjogcmVxdWlyZShcIi4vZGd1YS9hcHBsaWNhdGlvblwiKVxuXG59O1xuIiwidmFyIEFwcGxpY2F0aW9uID0gZnVuY3Rpb24oc2VsZWN0b3IpIHtcbiAgdGhpcy5fc2VsZWN0b3IgPSBzZWxlY3Rvcjtcbn07XG5cbkFwcGxpY2F0aW9uLnByb3RvdHlwZSA9IHtcbiAgaW5pdDogZnVuY3Rpb24oKSB7XG4gIH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gQXBwbGljYXRpb247XG4iXX0=
