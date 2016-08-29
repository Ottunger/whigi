/**
 * Typescript trie implemntation.
 * @module Trie
 * @author Mathonet Grégoire
 */

'use strict';

export class Node {

    public children: {[id: string]: Node};

    /**
     * creates a trie node.
     * @function constructor
     * @public
     * @param {Object} value Value at this node.
     * @param {Boolean} end Leaf node.
     */
    constructor(public value: any, public end: boolean) {
        this.children = {};
    }

}

export class Trie {

    private cnt: number;
    private rootObj: Node;

    /**
     * Creates a trie.
     * @function constructor
     * @public
     */
    constructor() {
        this.cnt = 0;
        this.rootObj = new Node(undefined, false);
    }

    /**
     * Adds an element.
     * @function add
     * @public
     * @param {String} str String value.
     * @param {Object} value Associated value.
     */
    add(str: string, value: any) {
        var cur = this.rootObj, newleaf = false;
        for(var i = 0; i < str.length; i++) {
            var c = str[i];
            if(cur.children.hasOwnProperty(c)) {
                cur = cur.children[c];
                if(i == str.length - 1 && !cur.end) {
                    cur.end = true;
                    this.cnt++;
                }
                if(i == str.length - 1)
                    cur.value = value;
            } else {
                newleaf = true;
                cur = cur.children[c] = new Node(value, i == str.length - 1);
            }
        }
        if(newleaf)
            this.cnt++;
    }

    /**
     * Adds all milestones in string at sequence character. Does not record what is beyond the last milestone, so no milestone in string does not record anything.
     * @function addMilestones
     * @public
     * @param {String} str String value.
     * @param {String} sep Milestone.
     */
    addMilestones(str: string, sel: string) {
        if(sel == '0')
            str = str + '1';
        else
            str = str + '0';

        var parts = str.split(sel), j, init = parts[0];
        for(j = 0; j < parts.length - 1; j++) {
            init += sel;
            this.add(init, undefined);
            init += parts[j + 1];
        }
    }

    /**
     * Finds an element.
     * @function find
     * @public
     * @param {String} str String value.
     * @return {Node} Node.
     */
    find(str: string): Node {
        var cur = this.rootObj;
        var exists = true;
        for(var i = 0; i < str.length && exists; i++) {
            var c = str[i];
            if(!cur.children.hasOwnProperty(c)) {
                exists = false;
            }
            cur = cur.children[c];
        }
        if(!exists || cur.end == false)
            cur = null;
        return cur;
    }

    /**
     * Finds an element.
     * @function find
     * @public
     * @param {String} str String value.
     * @return {Boolean} Has or not.
     */
    has(str: string): boolean {
        return !!this.find(str);
    }

    /**
     * Populate an array with all the nodes beyond one.
     * @function explore
     * @private
     * @param {Node} cur Current node.
     * @param {String} str Current string.
     * @param {String[]} arr Current strings.
     * @param {String} until Optional delimiter.
     * @return {String[]} Populated array.
     */
    private explore(cur: Node, str: string, arr: string[], until: string): string[] {
        var keys = Object.getOwnPropertyNames(cur.children);
        for(var i = 0; i < keys.length; i++) {
            var k = keys[i];
            var next = cur.children[k];
            var nstr = str + k;
            if(next.end)
                arr.push(nstr);
            if(!!until && until == k)
                continue;
            arr.concat(this.explore(next, nstr, arr, until));
        }
        return arr;
    }

    /**
     * Returns all strings beyond one.
     * @function suggestions
     * @public
     * @param {String} str String value.
     * @param {String} until Optional limiter.
     * @return {String[]} Values.
     */
    suggestions(str: string, until?: string): string[] {
        var cur;
        if(!!str && str.length > 0) {
            cur = this.find(str);
            if(!cur)
                return [];
        } else {
            cur = this.rootObj;
        }
        return this.explore(cur, str, [], until);
    }

    /**
     * Returns the number of elements.
     * @fucntion count
     * @public
     * @return {Number} Elements.
     */
    count(): number {
        return this.cnt;
    }

    /**
     * Recursively delete a node.
     * @function deleteHelper
     * @private
     * @param {Node} cur Current node.
     * @param {String} str String.
     * @param {Number} level Level in depth.
     * @return {Boolean} Deleted or not for above.
     */
    private deleteHelper(cur: Node, str: string, level: number): boolean {
        if(!cur)
            return false;
        if(level == str.length) {
            if(cur.end) {
                cur.end = false;
                if(Object.getOwnPropertyNames(cur).length == 0)
                    return true;
                return false;
            }
        } else {
            if(this.deleteHelper(cur.children[str[level]], str, level + 1)) {
                delete cur.children[str[level]];
                return cur.end == false && Object.getOwnPropertyNames(cur).length == 0;
            }
        }
        return false;
    }


    /**
     * Deletes a node.
     * @function remove
     * @public
     * @param {String} str String.
     */
    remove(str: string) {
        if(str.length < 1)
            return;
        this.deleteHelper(this.rootObj, str, 0);
    }

}
