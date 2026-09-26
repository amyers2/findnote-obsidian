'use strict';

var obsidian = require('obsidian');

/******************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */
/* global Reflect, Promise, SuppressedError, Symbol, Iterator */


function __awaiter(thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
}

typeof SuppressedError === "function" ? SuppressedError : function (error, suppressed, message) {
    var e = new Error(message);
    return e.name = "SuppressedError", e.error = error, e.suppressed = suppressed, e;
};

const FINDNOTE_SERVER = "http://127.0.0.1:8000";
class FindnoteSearchModal extends obsidian.SuggestModal {
    constructor(app, plugin) {
        super(app);
        this.plugin = plugin;
        this.searchTimer = null;
    }
    onOpen() {
        super.onOpen();
        this.setPlaceholder("Search your notes...");
    }
    getSuggestions(query) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!query.trim()) {
                return [];
            }
            if (this.searchTimer !== null) {
                clearTimeout(this.searchTimer);
            }
            return new Promise((resolve) => {
                this.searchTimer = setTimeout(() => __awaiter(this, void 0, void 0, function* () {
                    const results = yield this.plugin.searchNotes(query);
                    resolve(results);
                }), 250);
            });
        });
    }
    renderSuggestion(result, el) {
        el.createEl("div", {
            text: this.plugin.truncateTitle(result.title),
        });
        el.createEl("small", {
            text: `${result.collection}/${result.file}`,
        });
    }
    onChooseSuggestion(result) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.plugin.openResult(result);
        });
    }
}
const VIEW_TYPE_FINDNOTE = "findnote-search";
class FindnoteSearchView extends obsidian.ItemView {
    constructor(leaf, plugin) {
        super(leaf);
        this.plugin = plugin;
        this.searchTimer = null;
        this.searchRequestId = 0;
    }
    getViewType() {
        return VIEW_TYPE_FINDNOTE;
    }
    getDisplayText() {
        return "Findnote";
    }
    showEmptyState(statusEl) {
        statusEl.empty();
        const messageEl = statusEl.createDiv({
            text: "Search your notes",
            cls: "findnote-empty",
        });
        messageEl.style.marginTop = "12px";
        messageEl.style.fontSize = "0.9em";
    }
    showSearchingState(statusEl) {
        statusEl.empty();
        const messageEl = statusEl.createDiv({
            text: "Searching…",
            cls: "findnote-empty",
        });
        messageEl.style.marginTop = "12px";
        messageEl.style.fontSize = "0.9em";
    }
    showNoResultsState(statusEl) {
        statusEl.empty();
        const messageEl = statusEl.createDiv({
            text: "No notes found",
            cls: "findnote-empty",
        });
        messageEl.style.marginTop = "12px";
        messageEl.style.fontSize = "0.9em";
    }
    onOpen() {
        return __awaiter(this, void 0, void 0, function* () {
            this.contentEl.empty();
            this.contentEl.createEl("h2", {
                text: "Findnote",
            });
            const searchContainer = this.contentEl.createDiv();
            searchContainer.style.position = "relative";
            const input = searchContainer.createEl("input", {
                type: "text",
                placeholder: "Search notes...",
            });
            input.style.width = "100%";
            input.style.paddingRight = "30px";
            const clearButton = searchContainer.createEl("button", {
                text: "×",
            });
            clearButton.style.position = "absolute";
            clearButton.style.right = "4px";
            clearButton.style.top = "50%";
            clearButton.style.transform = "translateY(-50%)";
            clearButton.style.display = "none";
            clearButton.style.height = "100%";
            clearButton.style.margin = "0";
            clearButton.style.minHeight = "0";
            clearButton.style.minWidth = "0";
            clearButton.style.padding = "0 6px";
            clearButton.style.border = "none";
            clearButton.style.background = "transparent";
            clearButton.style.boxShadow = "none";
            clearButton.style.fontSize = "18px";
            clearButton.style.cursor = "pointer";
            const statusEl = this.contentEl.createDiv();
            const resultsEl = this.contentEl.createDiv();
            resultsEl.style.marginTop = "12px";
            this.showEmptyState(statusEl);
            input.addEventListener("input", () => {
                clearButton.style.display = input.value ? "block" : "none";
                if (this.searchTimer !== null) {
                    clearTimeout(this.searchTimer);
                }
                if (!input.value.trim()) {
                    this.searchRequestId++;
                    resultsEl.empty();
                    this.showEmptyState(statusEl);
                    return;
                }
                this.showSearchingState(statusEl);
                resultsEl.empty();
                this.searchTimer = setTimeout(() => __awaiter(this, void 0, void 0, function* () {
                    this.searchTimer = null;
                    const requestId = ++this.searchRequestId;
                    try {
                        const results = yield this.plugin.searchNotes(input.value);
                        if (requestId !== this.searchRequestId) {
                            return;
                        }
                        if (results.length === 0) {
                            this.showNoResultsState(statusEl);
                            return;
                        }
                        statusEl.empty();
                        resultsEl.empty();
                        for (const result of results) {
                            const resultEl = resultsEl.createDiv({
                                cls: "findnote-result",
                            });
                            resultEl.setAttribute("tabindex", "0");
                            resultEl.createDiv({
                                text: this.plugin.truncateTitle(result.title),
                                cls: "findnote-result-title",
                            });
                            resultEl.createEl("small", {
                                text: `${result.collection}/${result.file}`,
                                cls: "findnote-result-path",
                            });
                            resultEl.addEventListener("click", () => {
                                void this.plugin.openResult(result);
                            });
                            resultEl.addEventListener("keydown", (event) => {
                                if (event.key === "Enter") {
                                    event.preventDefault();
                                    void this.plugin.openResult(result);
                                    return;
                                }
                                if (event.key !== "ArrowDown" && event.key !== "ArrowUp") {
                                    return;
                                }
                                event.preventDefault();
                                const resultEls = Array.from(resultsEl.querySelectorAll(".findnote-result"));
                                const currentIndex = resultEls.indexOf(resultEl);
                                if (currentIndex === -1) {
                                    return;
                                }
                                if (event.key === "ArrowUp") {
                                    if (currentIndex === 0) {
                                        input.focus();
                                    }
                                    else {
                                        resultEls[currentIndex - 1].focus();
                                    }
                                    return;
                                }
                                if (currentIndex === resultEls.length - 1) {
                                    input.focus();
                                }
                                else {
                                    resultEls[currentIndex + 1].focus();
                                }
                            });
                        }
                    }
                    catch (error) {
                        if (requestId !== this.searchRequestId) {
                            return;
                        }
                        resultsEl.empty();
                        resultsEl.createDiv({
                            text: "Search failed",
                            cls: "findnote-empty",
                        });
                    }
                }), 250);
            });
            input.addEventListener("keydown", (event) => {
                if (event.key !== "ArrowDown" && event.key !== "ArrowUp") {
                    return;
                }
                const resultEls = Array.from(resultsEl.querySelectorAll(".findnote-result"));
                if (resultEls.length === 0) {
                    return;
                }
                event.preventDefault();
                if (event.key === "ArrowDown") {
                    resultEls[0].focus();
                }
                else {
                    resultEls[resultEls.length - 1].focus();
                }
            });
            clearButton.addEventListener("click", () => {
                input.value = "";
                input.dispatchEvent(new Event("input"));
                input.focus();
            });
        });
    }
    onClose() {
        if (this.searchTimer !== null) {
            clearTimeout(this.searchTimer);
            this.searchTimer = null;
        }
        return Promise.resolve();
    }
}
class FindnotePlugin extends obsidian.Plugin {
    onload() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log("Findnote plugin loaded");
            this.registerView(VIEW_TYPE_FINDNOTE, (leaf) => new FindnoteSearchView(leaf, this));
            this.addCommand({
                id: "search",
                name: "Search notes",
                callback: () => {
                    new FindnoteSearchModal(this.app, this).open();
                },
            });
            this.addCommand({
                id: "open-search",
                name: "Open search sidebar",
                callback: () => {
                    void this.activateView();
                },
            });
        });
    }
    activateView() {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const { workspace } = this.app;
            let leaf = (_a = workspace.getLeavesOfType(VIEW_TYPE_FINDNOTE)[0]) !== null && _a !== void 0 ? _a : null;
            if (!leaf) {
                leaf = workspace.getRightLeaf(false);
                if (!leaf) {
                    return;
                }
                yield leaf.setViewState({
                    type: VIEW_TYPE_FINDNOTE,
                    active: true,
                });
            }
            workspace.revealLeaf(leaf);
        });
    }
    parseQuery(query) {
        const result = {
            all: [],
            any: [],
            not: [],
            regex: null,
        };
        const sections = query.trim().split(/\s+(?=(?:all|any|not|re):)/i);
        for (const section of sections) {
            const match = section.match(/^(all|any|not|re):\s*(.*)$/i);
            if (!match) {
                result.all.push(...section.split(/\s+/).filter(Boolean));
                continue;
            }
            const mode = match[1].toLowerCase();
            const value = match[2].trim();
            if (!value) {
                continue;
            }
            if (mode === "re") {
                result.regex = value;
            }
            else if (mode === "all") {
                result.all.push(...value.split(/\s+/).filter(Boolean));
            }
            else if (mode === "any") {
                result.any.push(...value.split(/\s+/).filter(Boolean));
            }
            else if (mode === "not") {
                result.not.push(...value.split(/\s+/).filter(Boolean));
            }
        }
        return result;
    }
    searchNotes(query) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const search = this.parseQuery(query);
                const params = new URLSearchParams();
                for (const word of search.all) {
                    params.append("all", word);
                }
                for (const word of search.any) {
                    params.append("any", word);
                }
                for (const word of search.not) {
                    params.append("not", word);
                }
                if (search.regex) {
                    params.append("re", search.regex);
                }
                const response = yield obsidian.requestUrl({
                    url: `${FINDNOTE_SERVER}/search?${params.toString()}`,
                    method: "GET",
                });
                return response.json;
            }
            catch (error) {
                console.error("Findnote search failed:", error);
                new obsidian.Notice("Findnote server connection failed");
                throw error;
            }
        });
    }
    openResult(result) {
        return __awaiter(this, void 0, void 0, function* () {
            const file = this.app.vault.getAbstractFileByPath(result.file);
            if (!(file instanceof obsidian.TFile)) {
                new obsidian.Notice(`Note not found: ${result.file}`);
                return;
            }
            yield this.app.workspace.getLeaf(false).openFile(file);
            const view = this.app.workspace.getActiveViewOfType(obsidian.MarkdownView);
            if (view) {
                const line = Math.max(0, result.line - 1);
                view.editor.setCursor({
                    line,
                    ch: 0,
                });
                view.editor.scrollIntoView({
                    from: { line, ch: 0 },
                    to: { line, ch: 0 },
                }, true);
            }
        });
    }
    truncateTitle(title, maxWords = 30) {
        const words = title.trim().split(/\s+/);
        if (words.length <= maxWords) {
            return title;
        }
        return words.slice(0, maxWords).join(" ") + "…";
    }
    onunload() {
        console.log("Findnote plugin unloaded");
    }
}

module.exports = FindnotePlugin;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZXMiOlsibm9kZV9tb2R1bGVzL3RzbGliL3RzbGliLmVzNi5qcyIsIm1haW4udHMiXSwic291cmNlc0NvbnRlbnQiOlsiLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxyXG5Db3B5cmlnaHQgKGMpIE1pY3Jvc29mdCBDb3Jwb3JhdGlvbi5cclxuXHJcblBlcm1pc3Npb24gdG8gdXNlLCBjb3B5LCBtb2RpZnksIGFuZC9vciBkaXN0cmlidXRlIHRoaXMgc29mdHdhcmUgZm9yIGFueVxyXG5wdXJwb3NlIHdpdGggb3Igd2l0aG91dCBmZWUgaXMgaGVyZWJ5IGdyYW50ZWQuXHJcblxyXG5USEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiIEFORCBUSEUgQVVUSE9SIERJU0NMQUlNUyBBTEwgV0FSUkFOVElFUyBXSVRIXHJcblJFR0FSRCBUTyBUSElTIFNPRlRXQVJFIElOQ0xVRElORyBBTEwgSU1QTElFRCBXQVJSQU5USUVTIE9GIE1FUkNIQU5UQUJJTElUWVxyXG5BTkQgRklUTkVTUy4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFIEFVVEhPUiBCRSBMSUFCTEUgRk9SIEFOWSBTUEVDSUFMLCBESVJFQ1QsXHJcbklORElSRUNULCBPUiBDT05TRVFVRU5USUFMIERBTUFHRVMgT1IgQU5ZIERBTUFHRVMgV0hBVFNPRVZFUiBSRVNVTFRJTkcgRlJPTVxyXG5MT1NTIE9GIFVTRSwgREFUQSBPUiBQUk9GSVRTLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgTkVHTElHRU5DRSBPUlxyXG5PVEhFUiBUT1JUSU9VUyBBQ1RJT04sIEFSSVNJTkcgT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgVVNFIE9SXHJcblBFUkZPUk1BTkNFIE9GIFRISVMgU09GVFdBUkUuXHJcbioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqICovXHJcbi8qIGdsb2JhbCBSZWZsZWN0LCBQcm9taXNlLCBTdXBwcmVzc2VkRXJyb3IsIFN5bWJvbCwgSXRlcmF0b3IgKi9cclxuXHJcbnZhciBleHRlbmRTdGF0aWNzID0gZnVuY3Rpb24oZCwgYikge1xyXG4gICAgZXh0ZW5kU3RhdGljcyA9IE9iamVjdC5zZXRQcm90b3R5cGVPZiB8fFxyXG4gICAgICAgICh7IF9fcHJvdG9fXzogW10gfSBpbnN0YW5jZW9mIEFycmF5ICYmIGZ1bmN0aW9uIChkLCBiKSB7IGQuX19wcm90b19fID0gYjsgfSkgfHxcclxuICAgICAgICBmdW5jdGlvbiAoZCwgYikgeyBmb3IgKHZhciBwIGluIGIpIGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwoYiwgcCkpIGRbcF0gPSBiW3BdOyB9O1xyXG4gICAgcmV0dXJuIGV4dGVuZFN0YXRpY3MoZCwgYik7XHJcbn07XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gX19leHRlbmRzKGQsIGIpIHtcclxuICAgIGlmICh0eXBlb2YgYiAhPT0gXCJmdW5jdGlvblwiICYmIGIgIT09IG51bGwpXHJcbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkNsYXNzIGV4dGVuZHMgdmFsdWUgXCIgKyBTdHJpbmcoYikgKyBcIiBpcyBub3QgYSBjb25zdHJ1Y3RvciBvciBudWxsXCIpO1xyXG4gICAgZXh0ZW5kU3RhdGljcyhkLCBiKTtcclxuICAgIGZ1bmN0aW9uIF9fKCkgeyB0aGlzLmNvbnN0cnVjdG9yID0gZDsgfVxyXG4gICAgZC5wcm90b3R5cGUgPSBiID09PSBudWxsID8gT2JqZWN0LmNyZWF0ZShiKSA6IChfXy5wcm90b3R5cGUgPSBiLnByb3RvdHlwZSwgbmV3IF9fKCkpO1xyXG59XHJcblxyXG5leHBvcnQgdmFyIF9fYXNzaWduID0gZnVuY3Rpb24oKSB7XHJcbiAgICBfX2Fzc2lnbiA9IE9iamVjdC5hc3NpZ24gfHwgZnVuY3Rpb24gX19hc3NpZ24odCkge1xyXG4gICAgICAgIGZvciAodmFyIHMsIGkgPSAxLCBuID0gYXJndW1lbnRzLmxlbmd0aDsgaSA8IG47IGkrKykge1xyXG4gICAgICAgICAgICBzID0gYXJndW1lbnRzW2ldO1xyXG4gICAgICAgICAgICBmb3IgKHZhciBwIGluIHMpIGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwocywgcCkpIHRbcF0gPSBzW3BdO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gdDtcclxuICAgIH1cclxuICAgIHJldHVybiBfX2Fzc2lnbi5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gX19yZXN0KHMsIGUpIHtcclxuICAgIHZhciB0ID0ge307XHJcbiAgICBmb3IgKHZhciBwIGluIHMpIGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwocywgcCkgJiYgZS5pbmRleE9mKHApIDwgMClcclxuICAgICAgICB0W3BdID0gc1twXTtcclxuICAgIGlmIChzICE9IG51bGwgJiYgdHlwZW9mIE9iamVjdC5nZXRPd25Qcm9wZXJ0eVN5bWJvbHMgPT09IFwiZnVuY3Rpb25cIilcclxuICAgICAgICBmb3IgKHZhciBpID0gMCwgcCA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eVN5bWJvbHMocyk7IGkgPCBwLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIGlmIChlLmluZGV4T2YocFtpXSkgPCAwICYmIE9iamVjdC5wcm90b3R5cGUucHJvcGVydHlJc0VudW1lcmFibGUuY2FsbChzLCBwW2ldKSlcclxuICAgICAgICAgICAgICAgIHRbcFtpXV0gPSBzW3BbaV1dO1xyXG4gICAgICAgIH1cclxuICAgIHJldHVybiB0O1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gX19kZWNvcmF0ZShkZWNvcmF0b3JzLCB0YXJnZXQsIGtleSwgZGVzYykge1xyXG4gICAgdmFyIGMgPSBhcmd1bWVudHMubGVuZ3RoLCByID0gYyA8IDMgPyB0YXJnZXQgOiBkZXNjID09PSBudWxsID8gZGVzYyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IodGFyZ2V0LCBrZXkpIDogZGVzYywgZDtcclxuICAgIGlmICh0eXBlb2YgUmVmbGVjdCA9PT0gXCJvYmplY3RcIiAmJiB0eXBlb2YgUmVmbGVjdC5kZWNvcmF0ZSA9PT0gXCJmdW5jdGlvblwiKSByID0gUmVmbGVjdC5kZWNvcmF0ZShkZWNvcmF0b3JzLCB0YXJnZXQsIGtleSwgZGVzYyk7XHJcbiAgICBlbHNlIGZvciAodmFyIGkgPSBkZWNvcmF0b3JzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSBpZiAoZCA9IGRlY29yYXRvcnNbaV0pIHIgPSAoYyA8IDMgPyBkKHIpIDogYyA+IDMgPyBkKHRhcmdldCwga2V5LCByKSA6IGQodGFyZ2V0LCBrZXkpKSB8fCByO1xyXG4gICAgcmV0dXJuIGMgPiAzICYmIHIgJiYgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRhcmdldCwga2V5LCByKSwgcjtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9fcGFyYW0ocGFyYW1JbmRleCwgZGVjb3JhdG9yKSB7XHJcbiAgICByZXR1cm4gZnVuY3Rpb24gKHRhcmdldCwga2V5KSB7IGRlY29yYXRvcih0YXJnZXQsIGtleSwgcGFyYW1JbmRleCk7IH1cclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9fZXNEZWNvcmF0ZShjdG9yLCBkZXNjcmlwdG9ySW4sIGRlY29yYXRvcnMsIGNvbnRleHRJbiwgaW5pdGlhbGl6ZXJzLCBleHRyYUluaXRpYWxpemVycykge1xyXG4gICAgZnVuY3Rpb24gYWNjZXB0KGYpIHsgaWYgKGYgIT09IHZvaWQgMCAmJiB0eXBlb2YgZiAhPT0gXCJmdW5jdGlvblwiKSB0aHJvdyBuZXcgVHlwZUVycm9yKFwiRnVuY3Rpb24gZXhwZWN0ZWRcIik7IHJldHVybiBmOyB9XHJcbiAgICB2YXIga2luZCA9IGNvbnRleHRJbi5raW5kLCBrZXkgPSBraW5kID09PSBcImdldHRlclwiID8gXCJnZXRcIiA6IGtpbmQgPT09IFwic2V0dGVyXCIgPyBcInNldFwiIDogXCJ2YWx1ZVwiO1xyXG4gICAgdmFyIHRhcmdldCA9ICFkZXNjcmlwdG9ySW4gJiYgY3RvciA/IGNvbnRleHRJbltcInN0YXRpY1wiXSA/IGN0b3IgOiBjdG9yLnByb3RvdHlwZSA6IG51bGw7XHJcbiAgICB2YXIgZGVzY3JpcHRvciA9IGRlc2NyaXB0b3JJbiB8fCAodGFyZ2V0ID8gT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcih0YXJnZXQsIGNvbnRleHRJbi5uYW1lKSA6IHt9KTtcclxuICAgIHZhciBfLCBkb25lID0gZmFsc2U7XHJcbiAgICBmb3IgKHZhciBpID0gZGVjb3JhdG9ycy5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xyXG4gICAgICAgIHZhciBjb250ZXh0ID0ge307XHJcbiAgICAgICAgZm9yICh2YXIgcCBpbiBjb250ZXh0SW4pIGNvbnRleHRbcF0gPSBwID09PSBcImFjY2Vzc1wiID8ge30gOiBjb250ZXh0SW5bcF07XHJcbiAgICAgICAgZm9yICh2YXIgcCBpbiBjb250ZXh0SW4uYWNjZXNzKSBjb250ZXh0LmFjY2Vzc1twXSA9IGNvbnRleHRJbi5hY2Nlc3NbcF07XHJcbiAgICAgICAgY29udGV4dC5hZGRJbml0aWFsaXplciA9IGZ1bmN0aW9uIChmKSB7IGlmIChkb25lKSB0aHJvdyBuZXcgVHlwZUVycm9yKFwiQ2Fubm90IGFkZCBpbml0aWFsaXplcnMgYWZ0ZXIgZGVjb3JhdGlvbiBoYXMgY29tcGxldGVkXCIpOyBleHRyYUluaXRpYWxpemVycy5wdXNoKGFjY2VwdChmIHx8IG51bGwpKTsgfTtcclxuICAgICAgICB2YXIgcmVzdWx0ID0gKDAsIGRlY29yYXRvcnNbaV0pKGtpbmQgPT09IFwiYWNjZXNzb3JcIiA/IHsgZ2V0OiBkZXNjcmlwdG9yLmdldCwgc2V0OiBkZXNjcmlwdG9yLnNldCB9IDogZGVzY3JpcHRvcltrZXldLCBjb250ZXh0KTtcclxuICAgICAgICBpZiAoa2luZCA9PT0gXCJhY2Nlc3NvclwiKSB7XHJcbiAgICAgICAgICAgIGlmIChyZXN1bHQgPT09IHZvaWQgMCkgY29udGludWU7XHJcbiAgICAgICAgICAgIGlmIChyZXN1bHQgPT09IG51bGwgfHwgdHlwZW9mIHJlc3VsdCAhPT0gXCJvYmplY3RcIikgdGhyb3cgbmV3IFR5cGVFcnJvcihcIk9iamVjdCBleHBlY3RlZFwiKTtcclxuICAgICAgICAgICAgaWYgKF8gPSBhY2NlcHQocmVzdWx0LmdldCkpIGRlc2NyaXB0b3IuZ2V0ID0gXztcclxuICAgICAgICAgICAgaWYgKF8gPSBhY2NlcHQocmVzdWx0LnNldCkpIGRlc2NyaXB0b3Iuc2V0ID0gXztcclxuICAgICAgICAgICAgaWYgKF8gPSBhY2NlcHQocmVzdWx0LmluaXQpKSBpbml0aWFsaXplcnMudW5zaGlmdChfKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSBpZiAoXyA9IGFjY2VwdChyZXN1bHQpKSB7XHJcbiAgICAgICAgICAgIGlmIChraW5kID09PSBcImZpZWxkXCIpIGluaXRpYWxpemVycy51bnNoaWZ0KF8pO1xyXG4gICAgICAgICAgICBlbHNlIGRlc2NyaXB0b3Jba2V5XSA9IF87XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgaWYgKHRhcmdldCkgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRhcmdldCwgY29udGV4dEluLm5hbWUsIGRlc2NyaXB0b3IpO1xyXG4gICAgZG9uZSA9IHRydWU7XHJcbn07XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gX19ydW5Jbml0aWFsaXplcnModGhpc0FyZywgaW5pdGlhbGl6ZXJzLCB2YWx1ZSkge1xyXG4gICAgdmFyIHVzZVZhbHVlID0gYXJndW1lbnRzLmxlbmd0aCA+IDI7XHJcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGluaXRpYWxpemVycy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgIHZhbHVlID0gdXNlVmFsdWUgPyBpbml0aWFsaXplcnNbaV0uY2FsbCh0aGlzQXJnLCB2YWx1ZSkgOiBpbml0aWFsaXplcnNbaV0uY2FsbCh0aGlzQXJnKTtcclxuICAgIH1cclxuICAgIHJldHVybiB1c2VWYWx1ZSA/IHZhbHVlIDogdm9pZCAwO1xyXG59O1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9fcHJvcEtleSh4KSB7XHJcbiAgICByZXR1cm4gdHlwZW9mIHggPT09IFwic3ltYm9sXCIgPyB4IDogXCJcIi5jb25jYXQoeCk7XHJcbn07XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gX19zZXRGdW5jdGlvbk5hbWUoZiwgbmFtZSwgcHJlZml4KSB7XHJcbiAgICBpZiAodHlwZW9mIG5hbWUgPT09IFwic3ltYm9sXCIpIG5hbWUgPSBuYW1lLmRlc2NyaXB0aW9uID8gXCJbXCIuY29uY2F0KG5hbWUuZGVzY3JpcHRpb24sIFwiXVwiKSA6IFwiXCI7XHJcbiAgICByZXR1cm4gT2JqZWN0LmRlZmluZVByb3BlcnR5KGYsIFwibmFtZVwiLCB7IGNvbmZpZ3VyYWJsZTogdHJ1ZSwgdmFsdWU6IHByZWZpeCA/IFwiXCIuY29uY2F0KHByZWZpeCwgXCIgXCIsIG5hbWUpIDogbmFtZSB9KTtcclxufTtcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX21ldGFkYXRhKG1ldGFkYXRhS2V5LCBtZXRhZGF0YVZhbHVlKSB7XHJcbiAgICBpZiAodHlwZW9mIFJlZmxlY3QgPT09IFwib2JqZWN0XCIgJiYgdHlwZW9mIFJlZmxlY3QubWV0YWRhdGEgPT09IFwiZnVuY3Rpb25cIikgcmV0dXJuIFJlZmxlY3QubWV0YWRhdGEobWV0YWRhdGFLZXksIG1ldGFkYXRhVmFsdWUpO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gX19hd2FpdGVyKHRoaXNBcmcsIF9hcmd1bWVudHMsIFAsIGdlbmVyYXRvcikge1xyXG4gICAgZnVuY3Rpb24gYWRvcHQodmFsdWUpIHsgcmV0dXJuIHZhbHVlIGluc3RhbmNlb2YgUCA/IHZhbHVlIDogbmV3IFAoZnVuY3Rpb24gKHJlc29sdmUpIHsgcmVzb2x2ZSh2YWx1ZSk7IH0pOyB9XHJcbiAgICByZXR1cm4gbmV3IChQIHx8IChQID0gUHJvbWlzZSkpKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcclxuICAgICAgICBmdW5jdGlvbiBmdWxmaWxsZWQodmFsdWUpIHsgdHJ5IHsgc3RlcChnZW5lcmF0b3IubmV4dCh2YWx1ZSkpOyB9IGNhdGNoIChlKSB7IHJlamVjdChlKTsgfSB9XHJcbiAgICAgICAgZnVuY3Rpb24gcmVqZWN0ZWQodmFsdWUpIHsgdHJ5IHsgc3RlcChnZW5lcmF0b3JbXCJ0aHJvd1wiXSh2YWx1ZSkpOyB9IGNhdGNoIChlKSB7IHJlamVjdChlKTsgfSB9XHJcbiAgICAgICAgZnVuY3Rpb24gc3RlcChyZXN1bHQpIHsgcmVzdWx0LmRvbmUgPyByZXNvbHZlKHJlc3VsdC52YWx1ZSkgOiBhZG9wdChyZXN1bHQudmFsdWUpLnRoZW4oZnVsZmlsbGVkLCByZWplY3RlZCk7IH1cclxuICAgICAgICBzdGVwKChnZW5lcmF0b3IgPSBnZW5lcmF0b3IuYXBwbHkodGhpc0FyZywgX2FyZ3VtZW50cyB8fCBbXSkpLm5leHQoKSk7XHJcbiAgICB9KTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9fZ2VuZXJhdG9yKHRoaXNBcmcsIGJvZHkpIHtcclxuICAgIHZhciBfID0geyBsYWJlbDogMCwgc2VudDogZnVuY3Rpb24oKSB7IGlmICh0WzBdICYgMSkgdGhyb3cgdFsxXTsgcmV0dXJuIHRbMV07IH0sIHRyeXM6IFtdLCBvcHM6IFtdIH0sIGYsIHksIHQsIGcgPSBPYmplY3QuY3JlYXRlKCh0eXBlb2YgSXRlcmF0b3IgPT09IFwiZnVuY3Rpb25cIiA/IEl0ZXJhdG9yIDogT2JqZWN0KS5wcm90b3R5cGUpO1xyXG4gICAgcmV0dXJuIGcubmV4dCA9IHZlcmIoMCksIGdbXCJ0aHJvd1wiXSA9IHZlcmIoMSksIGdbXCJyZXR1cm5cIl0gPSB2ZXJiKDIpLCB0eXBlb2YgU3ltYm9sID09PSBcImZ1bmN0aW9uXCIgJiYgKGdbU3ltYm9sLml0ZXJhdG9yXSA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gdGhpczsgfSksIGc7XHJcbiAgICBmdW5jdGlvbiB2ZXJiKG4pIHsgcmV0dXJuIGZ1bmN0aW9uICh2KSB7IHJldHVybiBzdGVwKFtuLCB2XSk7IH07IH1cclxuICAgIGZ1bmN0aW9uIHN0ZXAob3ApIHtcclxuICAgICAgICBpZiAoZikgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkdlbmVyYXRvciBpcyBhbHJlYWR5IGV4ZWN1dGluZy5cIik7XHJcbiAgICAgICAgd2hpbGUgKGcgJiYgKGcgPSAwLCBvcFswXSAmJiAoXyA9IDApKSwgXykgdHJ5IHtcclxuICAgICAgICAgICAgaWYgKGYgPSAxLCB5ICYmICh0ID0gb3BbMF0gJiAyID8geVtcInJldHVyblwiXSA6IG9wWzBdID8geVtcInRocm93XCJdIHx8ICgodCA9IHlbXCJyZXR1cm5cIl0pICYmIHQuY2FsbCh5KSwgMCkgOiB5Lm5leHQpICYmICEodCA9IHQuY2FsbCh5LCBvcFsxXSkpLmRvbmUpIHJldHVybiB0O1xyXG4gICAgICAgICAgICBpZiAoeSA9IDAsIHQpIG9wID0gW29wWzBdICYgMiwgdC52YWx1ZV07XHJcbiAgICAgICAgICAgIHN3aXRjaCAob3BbMF0pIHtcclxuICAgICAgICAgICAgICAgIGNhc2UgMDogY2FzZSAxOiB0ID0gb3A7IGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgY2FzZSA0OiBfLmxhYmVsKys7IHJldHVybiB7IHZhbHVlOiBvcFsxXSwgZG9uZTogZmFsc2UgfTtcclxuICAgICAgICAgICAgICAgIGNhc2UgNTogXy5sYWJlbCsrOyB5ID0gb3BbMV07IG9wID0gWzBdOyBjb250aW51ZTtcclxuICAgICAgICAgICAgICAgIGNhc2UgNzogb3AgPSBfLm9wcy5wb3AoKTsgXy50cnlzLnBvcCgpOyBjb250aW51ZTtcclxuICAgICAgICAgICAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCEodCA9IF8udHJ5cywgdCA9IHQubGVuZ3RoID4gMCAmJiB0W3QubGVuZ3RoIC0gMV0pICYmIChvcFswXSA9PT0gNiB8fCBvcFswXSA9PT0gMikpIHsgXyA9IDA7IGNvbnRpbnVlOyB9XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKG9wWzBdID09PSAzICYmICghdCB8fCAob3BbMV0gPiB0WzBdICYmIG9wWzFdIDwgdFszXSkpKSB7IF8ubGFiZWwgPSBvcFsxXTsgYnJlYWs7IH1cclxuICAgICAgICAgICAgICAgICAgICBpZiAob3BbMF0gPT09IDYgJiYgXy5sYWJlbCA8IHRbMV0pIHsgXy5sYWJlbCA9IHRbMV07IHQgPSBvcDsgYnJlYWs7IH1cclxuICAgICAgICAgICAgICAgICAgICBpZiAodCAmJiBfLmxhYmVsIDwgdFsyXSkgeyBfLmxhYmVsID0gdFsyXTsgXy5vcHMucHVzaChvcCk7IGJyZWFrOyB9XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRbMl0pIF8ub3BzLnBvcCgpO1xyXG4gICAgICAgICAgICAgICAgICAgIF8udHJ5cy5wb3AoKTsgY29udGludWU7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgb3AgPSBib2R5LmNhbGwodGhpc0FyZywgXyk7XHJcbiAgICAgICAgfSBjYXRjaCAoZSkgeyBvcCA9IFs2LCBlXTsgeSA9IDA7IH0gZmluYWxseSB7IGYgPSB0ID0gMDsgfVxyXG4gICAgICAgIGlmIChvcFswXSAmIDUpIHRocm93IG9wWzFdOyByZXR1cm4geyB2YWx1ZTogb3BbMF0gPyBvcFsxXSA6IHZvaWQgMCwgZG9uZTogdHJ1ZSB9O1xyXG4gICAgfVxyXG59XHJcblxyXG5leHBvcnQgdmFyIF9fY3JlYXRlQmluZGluZyA9IE9iamVjdC5jcmVhdGUgPyAoZnVuY3Rpb24obywgbSwgaywgazIpIHtcclxuICAgIGlmIChrMiA9PT0gdW5kZWZpbmVkKSBrMiA9IGs7XHJcbiAgICB2YXIgZGVzYyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IobSwgayk7XHJcbiAgICBpZiAoIWRlc2MgfHwgKFwiZ2V0XCIgaW4gZGVzYyA/ICFtLl9fZXNNb2R1bGUgOiBkZXNjLndyaXRhYmxlIHx8IGRlc2MuY29uZmlndXJhYmxlKSkge1xyXG4gICAgICAgIGRlc2MgPSB7IGVudW1lcmFibGU6IHRydWUsIGdldDogZnVuY3Rpb24oKSB7IHJldHVybiBtW2tdOyB9IH07XHJcbiAgICB9XHJcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkobywgazIsIGRlc2MpO1xyXG59KSA6IChmdW5jdGlvbihvLCBtLCBrLCBrMikge1xyXG4gICAgaWYgKGsyID09PSB1bmRlZmluZWQpIGsyID0gaztcclxuICAgIG9bazJdID0gbVtrXTtcclxufSk7XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gX19leHBvcnRTdGFyKG0sIG8pIHtcclxuICAgIGZvciAodmFyIHAgaW4gbSkgaWYgKHAgIT09IFwiZGVmYXVsdFwiICYmICFPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwobywgcCkpIF9fY3JlYXRlQmluZGluZyhvLCBtLCBwKTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9fdmFsdWVzKG8pIHtcclxuICAgIHZhciBzID0gdHlwZW9mIFN5bWJvbCA9PT0gXCJmdW5jdGlvblwiICYmIFN5bWJvbC5pdGVyYXRvciwgbSA9IHMgJiYgb1tzXSwgaSA9IDA7XHJcbiAgICBpZiAobSkgcmV0dXJuIG0uY2FsbChvKTtcclxuICAgIGlmIChvICYmIHR5cGVvZiBvLmxlbmd0aCA9PT0gXCJudW1iZXJcIikgcmV0dXJuIHtcclxuICAgICAgICBuZXh0OiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIGlmIChvICYmIGkgPj0gby5sZW5ndGgpIG8gPSB2b2lkIDA7XHJcbiAgICAgICAgICAgIHJldHVybiB7IHZhbHVlOiBvICYmIG9baSsrXSwgZG9uZTogIW8gfTtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcihzID8gXCJPYmplY3QgaXMgbm90IGl0ZXJhYmxlLlwiIDogXCJTeW1ib2wuaXRlcmF0b3IgaXMgbm90IGRlZmluZWQuXCIpO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gX19yZWFkKG8sIG4pIHtcclxuICAgIHZhciBtID0gdHlwZW9mIFN5bWJvbCA9PT0gXCJmdW5jdGlvblwiICYmIG9bU3ltYm9sLml0ZXJhdG9yXTtcclxuICAgIGlmICghbSkgcmV0dXJuIG87XHJcbiAgICB2YXIgaSA9IG0uY2FsbChvKSwgciwgYXIgPSBbXSwgZTtcclxuICAgIHRyeSB7XHJcbiAgICAgICAgd2hpbGUgKChuID09PSB2b2lkIDAgfHwgbi0tID4gMCkgJiYgIShyID0gaS5uZXh0KCkpLmRvbmUpIGFyLnB1c2goci52YWx1ZSk7XHJcbiAgICB9XHJcbiAgICBjYXRjaCAoZXJyb3IpIHsgZSA9IHsgZXJyb3I6IGVycm9yIH07IH1cclxuICAgIGZpbmFsbHkge1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIGlmIChyICYmICFyLmRvbmUgJiYgKG0gPSBpW1wicmV0dXJuXCJdKSkgbS5jYWxsKGkpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBmaW5hbGx5IHsgaWYgKGUpIHRocm93IGUuZXJyb3I7IH1cclxuICAgIH1cclxuICAgIHJldHVybiBhcjtcclxufVxyXG5cclxuLyoqIEBkZXByZWNhdGVkICovXHJcbmV4cG9ydCBmdW5jdGlvbiBfX3NwcmVhZCgpIHtcclxuICAgIGZvciAodmFyIGFyID0gW10sIGkgPSAwOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKVxyXG4gICAgICAgIGFyID0gYXIuY29uY2F0KF9fcmVhZChhcmd1bWVudHNbaV0pKTtcclxuICAgIHJldHVybiBhcjtcclxufVxyXG5cclxuLyoqIEBkZXByZWNhdGVkICovXHJcbmV4cG9ydCBmdW5jdGlvbiBfX3NwcmVhZEFycmF5cygpIHtcclxuICAgIGZvciAodmFyIHMgPSAwLCBpID0gMCwgaWwgPSBhcmd1bWVudHMubGVuZ3RoOyBpIDwgaWw7IGkrKykgcyArPSBhcmd1bWVudHNbaV0ubGVuZ3RoO1xyXG4gICAgZm9yICh2YXIgciA9IEFycmF5KHMpLCBrID0gMCwgaSA9IDA7IGkgPCBpbDsgaSsrKVxyXG4gICAgICAgIGZvciAodmFyIGEgPSBhcmd1bWVudHNbaV0sIGogPSAwLCBqbCA9IGEubGVuZ3RoOyBqIDwgamw7IGorKywgaysrKVxyXG4gICAgICAgICAgICByW2tdID0gYVtqXTtcclxuICAgIHJldHVybiByO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gX19zcHJlYWRBcnJheSh0bywgZnJvbSwgcGFjaykge1xyXG4gICAgaWYgKHBhY2sgfHwgYXJndW1lbnRzLmxlbmd0aCA9PT0gMikgZm9yICh2YXIgaSA9IDAsIGwgPSBmcm9tLmxlbmd0aCwgYXI7IGkgPCBsOyBpKyspIHtcclxuICAgICAgICBpZiAoYXIgfHwgIShpIGluIGZyb20pKSB7XHJcbiAgICAgICAgICAgIGlmICghYXIpIGFyID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoZnJvbSwgMCwgaSk7XHJcbiAgICAgICAgICAgIGFyW2ldID0gZnJvbVtpXTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICByZXR1cm4gdG8uY29uY2F0KGFyIHx8IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGZyb20pKTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9fYXdhaXQodikge1xyXG4gICAgcmV0dXJuIHRoaXMgaW5zdGFuY2VvZiBfX2F3YWl0ID8gKHRoaXMudiA9IHYsIHRoaXMpIDogbmV3IF9fYXdhaXQodik7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX2FzeW5jR2VuZXJhdG9yKHRoaXNBcmcsIF9hcmd1bWVudHMsIGdlbmVyYXRvcikge1xyXG4gICAgaWYgKCFTeW1ib2wuYXN5bmNJdGVyYXRvcikgdGhyb3cgbmV3IFR5cGVFcnJvcihcIlN5bWJvbC5hc3luY0l0ZXJhdG9yIGlzIG5vdCBkZWZpbmVkLlwiKTtcclxuICAgIHZhciBnID0gZ2VuZXJhdG9yLmFwcGx5KHRoaXNBcmcsIF9hcmd1bWVudHMgfHwgW10pLCBpLCBxID0gW107XHJcbiAgICByZXR1cm4gaSA9IE9iamVjdC5jcmVhdGUoKHR5cGVvZiBBc3luY0l0ZXJhdG9yID09PSBcImZ1bmN0aW9uXCIgPyBBc3luY0l0ZXJhdG9yIDogT2JqZWN0KS5wcm90b3R5cGUpLCB2ZXJiKFwibmV4dFwiKSwgdmVyYihcInRocm93XCIpLCB2ZXJiKFwicmV0dXJuXCIsIGF3YWl0UmV0dXJuKSwgaVtTeW1ib2wuYXN5bmNJdGVyYXRvcl0gPSBmdW5jdGlvbiAoKSB7IHJldHVybiB0aGlzOyB9LCBpO1xyXG4gICAgZnVuY3Rpb24gYXdhaXRSZXR1cm4oZikgeyByZXR1cm4gZnVuY3Rpb24gKHYpIHsgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh2KS50aGVuKGYsIHJlamVjdCk7IH07IH1cclxuICAgIGZ1bmN0aW9uIHZlcmIobiwgZikgeyBpZiAoZ1tuXSkgeyBpW25dID0gZnVuY3Rpb24gKHYpIHsgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uIChhLCBiKSB7IHEucHVzaChbbiwgdiwgYSwgYl0pID4gMSB8fCByZXN1bWUobiwgdik7IH0pOyB9OyBpZiAoZikgaVtuXSA9IGYoaVtuXSk7IH0gfVxyXG4gICAgZnVuY3Rpb24gcmVzdW1lKG4sIHYpIHsgdHJ5IHsgc3RlcChnW25dKHYpKTsgfSBjYXRjaCAoZSkgeyBzZXR0bGUocVswXVszXSwgZSk7IH0gfVxyXG4gICAgZnVuY3Rpb24gc3RlcChyKSB7IHIudmFsdWUgaW5zdGFuY2VvZiBfX2F3YWl0ID8gUHJvbWlzZS5yZXNvbHZlKHIudmFsdWUudikudGhlbihmdWxmaWxsLCByZWplY3QpIDogc2V0dGxlKHFbMF1bMl0sIHIpOyB9XHJcbiAgICBmdW5jdGlvbiBmdWxmaWxsKHZhbHVlKSB7IHJlc3VtZShcIm5leHRcIiwgdmFsdWUpOyB9XHJcbiAgICBmdW5jdGlvbiByZWplY3QodmFsdWUpIHsgcmVzdW1lKFwidGhyb3dcIiwgdmFsdWUpOyB9XHJcbiAgICBmdW5jdGlvbiBzZXR0bGUoZiwgdikgeyBpZiAoZih2KSwgcS5zaGlmdCgpLCBxLmxlbmd0aCkgcmVzdW1lKHFbMF1bMF0sIHFbMF1bMV0pOyB9XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX2FzeW5jRGVsZWdhdG9yKG8pIHtcclxuICAgIHZhciBpLCBwO1xyXG4gICAgcmV0dXJuIGkgPSB7fSwgdmVyYihcIm5leHRcIiksIHZlcmIoXCJ0aHJvd1wiLCBmdW5jdGlvbiAoZSkgeyB0aHJvdyBlOyB9KSwgdmVyYihcInJldHVyblwiKSwgaVtTeW1ib2wuaXRlcmF0b3JdID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gdGhpczsgfSwgaTtcclxuICAgIGZ1bmN0aW9uIHZlcmIobiwgZikgeyBpW25dID0gb1tuXSA/IGZ1bmN0aW9uICh2KSB7IHJldHVybiAocCA9ICFwKSA/IHsgdmFsdWU6IF9fYXdhaXQob1tuXSh2KSksIGRvbmU6IGZhbHNlIH0gOiBmID8gZih2KSA6IHY7IH0gOiBmOyB9XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX2FzeW5jVmFsdWVzKG8pIHtcclxuICAgIGlmICghU3ltYm9sLmFzeW5jSXRlcmF0b3IpIHRocm93IG5ldyBUeXBlRXJyb3IoXCJTeW1ib2wuYXN5bmNJdGVyYXRvciBpcyBub3QgZGVmaW5lZC5cIik7XHJcbiAgICB2YXIgbSA9IG9bU3ltYm9sLmFzeW5jSXRlcmF0b3JdLCBpO1xyXG4gICAgcmV0dXJuIG0gPyBtLmNhbGwobykgOiAobyA9IHR5cGVvZiBfX3ZhbHVlcyA9PT0gXCJmdW5jdGlvblwiID8gX192YWx1ZXMobykgOiBvW1N5bWJvbC5pdGVyYXRvcl0oKSwgaSA9IHt9LCB2ZXJiKFwibmV4dFwiKSwgdmVyYihcInRocm93XCIpLCB2ZXJiKFwicmV0dXJuXCIpLCBpW1N5bWJvbC5hc3luY0l0ZXJhdG9yXSA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuIHRoaXM7IH0sIGkpO1xyXG4gICAgZnVuY3Rpb24gdmVyYihuKSB7IGlbbl0gPSBvW25dICYmIGZ1bmN0aW9uICh2KSB7IHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7IHYgPSBvW25dKHYpLCBzZXR0bGUocmVzb2x2ZSwgcmVqZWN0LCB2LmRvbmUsIHYudmFsdWUpOyB9KTsgfTsgfVxyXG4gICAgZnVuY3Rpb24gc2V0dGxlKHJlc29sdmUsIHJlamVjdCwgZCwgdikgeyBQcm9taXNlLnJlc29sdmUodikudGhlbihmdW5jdGlvbih2KSB7IHJlc29sdmUoeyB2YWx1ZTogdiwgZG9uZTogZCB9KTsgfSwgcmVqZWN0KTsgfVxyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gX19tYWtlVGVtcGxhdGVPYmplY3QoY29va2VkLCByYXcpIHtcclxuICAgIGlmIChPYmplY3QuZGVmaW5lUHJvcGVydHkpIHsgT2JqZWN0LmRlZmluZVByb3BlcnR5KGNvb2tlZCwgXCJyYXdcIiwgeyB2YWx1ZTogcmF3IH0pOyB9IGVsc2UgeyBjb29rZWQucmF3ID0gcmF3OyB9XHJcbiAgICByZXR1cm4gY29va2VkO1xyXG59O1xyXG5cclxudmFyIF9fc2V0TW9kdWxlRGVmYXVsdCA9IE9iamVjdC5jcmVhdGUgPyAoZnVuY3Rpb24obywgdikge1xyXG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KG8sIFwiZGVmYXVsdFwiLCB7IGVudW1lcmFibGU6IHRydWUsIHZhbHVlOiB2IH0pO1xyXG59KSA6IGZ1bmN0aW9uKG8sIHYpIHtcclxuICAgIG9bXCJkZWZhdWx0XCJdID0gdjtcclxufTtcclxuXHJcbnZhciBvd25LZXlzID0gZnVuY3Rpb24obykge1xyXG4gICAgb3duS2V5cyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eU5hbWVzIHx8IGZ1bmN0aW9uIChvKSB7XHJcbiAgICAgICAgdmFyIGFyID0gW107XHJcbiAgICAgICAgZm9yICh2YXIgayBpbiBvKSBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG8sIGspKSBhclthci5sZW5ndGhdID0gaztcclxuICAgICAgICByZXR1cm4gYXI7XHJcbiAgICB9O1xyXG4gICAgcmV0dXJuIG93bktleXMobyk7XHJcbn07XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gX19pbXBvcnRTdGFyKG1vZCkge1xyXG4gICAgaWYgKG1vZCAmJiBtb2QuX19lc01vZHVsZSkgcmV0dXJuIG1vZDtcclxuICAgIHZhciByZXN1bHQgPSB7fTtcclxuICAgIGlmIChtb2QgIT0gbnVsbCkgZm9yICh2YXIgayA9IG93bktleXMobW9kKSwgaSA9IDA7IGkgPCBrLmxlbmd0aDsgaSsrKSBpZiAoa1tpXSAhPT0gXCJkZWZhdWx0XCIpIF9fY3JlYXRlQmluZGluZyhyZXN1bHQsIG1vZCwga1tpXSk7XHJcbiAgICBfX3NldE1vZHVsZURlZmF1bHQocmVzdWx0LCBtb2QpO1xyXG4gICAgcmV0dXJuIHJlc3VsdDtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9faW1wb3J0RGVmYXVsdChtb2QpIHtcclxuICAgIHJldHVybiAobW9kICYmIG1vZC5fX2VzTW9kdWxlKSA/IG1vZCA6IHsgZGVmYXVsdDogbW9kIH07XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX2NsYXNzUHJpdmF0ZUZpZWxkR2V0KHJlY2VpdmVyLCBzdGF0ZSwga2luZCwgZikge1xyXG4gICAgaWYgKGtpbmQgPT09IFwiYVwiICYmICFmKSB0aHJvdyBuZXcgVHlwZUVycm9yKFwiUHJpdmF0ZSBhY2Nlc3NvciB3YXMgZGVmaW5lZCB3aXRob3V0IGEgZ2V0dGVyXCIpO1xyXG4gICAgaWYgKHR5cGVvZiBzdGF0ZSA9PT0gXCJmdW5jdGlvblwiID8gcmVjZWl2ZXIgIT09IHN0YXRlIHx8ICFmIDogIXN0YXRlLmhhcyhyZWNlaXZlcikpIHRocm93IG5ldyBUeXBlRXJyb3IoXCJDYW5ub3QgcmVhZCBwcml2YXRlIG1lbWJlciBmcm9tIGFuIG9iamVjdCB3aG9zZSBjbGFzcyBkaWQgbm90IGRlY2xhcmUgaXRcIik7XHJcbiAgICByZXR1cm4ga2luZCA9PT0gXCJtXCIgPyBmIDoga2luZCA9PT0gXCJhXCIgPyBmLmNhbGwocmVjZWl2ZXIpIDogZiA/IGYudmFsdWUgOiBzdGF0ZS5nZXQocmVjZWl2ZXIpO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gX19jbGFzc1ByaXZhdGVGaWVsZFNldChyZWNlaXZlciwgc3RhdGUsIHZhbHVlLCBraW5kLCBmKSB7XHJcbiAgICBpZiAoa2luZCA9PT0gXCJtXCIpIHRocm93IG5ldyBUeXBlRXJyb3IoXCJQcml2YXRlIG1ldGhvZCBpcyBub3Qgd3JpdGFibGVcIik7XHJcbiAgICBpZiAoa2luZCA9PT0gXCJhXCIgJiYgIWYpIHRocm93IG5ldyBUeXBlRXJyb3IoXCJQcml2YXRlIGFjY2Vzc29yIHdhcyBkZWZpbmVkIHdpdGhvdXQgYSBzZXR0ZXJcIik7XHJcbiAgICBpZiAodHlwZW9mIHN0YXRlID09PSBcImZ1bmN0aW9uXCIgPyByZWNlaXZlciAhPT0gc3RhdGUgfHwgIWYgOiAhc3RhdGUuaGFzKHJlY2VpdmVyKSkgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkNhbm5vdCB3cml0ZSBwcml2YXRlIG1lbWJlciB0byBhbiBvYmplY3Qgd2hvc2UgY2xhc3MgZGlkIG5vdCBkZWNsYXJlIGl0XCIpO1xyXG4gICAgcmV0dXJuIChraW5kID09PSBcImFcIiA/IGYuY2FsbChyZWNlaXZlciwgdmFsdWUpIDogZiA/IGYudmFsdWUgPSB2YWx1ZSA6IHN0YXRlLnNldChyZWNlaXZlciwgdmFsdWUpKSwgdmFsdWU7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX2NsYXNzUHJpdmF0ZUZpZWxkSW4oc3RhdGUsIHJlY2VpdmVyKSB7XHJcbiAgICBpZiAocmVjZWl2ZXIgPT09IG51bGwgfHwgKHR5cGVvZiByZWNlaXZlciAhPT0gXCJvYmplY3RcIiAmJiB0eXBlb2YgcmVjZWl2ZXIgIT09IFwiZnVuY3Rpb25cIikpIHRocm93IG5ldyBUeXBlRXJyb3IoXCJDYW5ub3QgdXNlICdpbicgb3BlcmF0b3Igb24gbm9uLW9iamVjdFwiKTtcclxuICAgIHJldHVybiB0eXBlb2Ygc3RhdGUgPT09IFwiZnVuY3Rpb25cIiA/IHJlY2VpdmVyID09PSBzdGF0ZSA6IHN0YXRlLmhhcyhyZWNlaXZlcik7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX2FkZERpc3Bvc2FibGVSZXNvdXJjZShlbnYsIHZhbHVlLCBhc3luYykge1xyXG4gICAgaWYgKHZhbHVlICE9PSBudWxsICYmIHZhbHVlICE9PSB2b2lkIDApIHtcclxuICAgICAgICBpZiAodHlwZW9mIHZhbHVlICE9PSBcIm9iamVjdFwiICYmIHR5cGVvZiB2YWx1ZSAhPT0gXCJmdW5jdGlvblwiKSB0aHJvdyBuZXcgVHlwZUVycm9yKFwiT2JqZWN0IGV4cGVjdGVkLlwiKTtcclxuICAgICAgICB2YXIgZGlzcG9zZSwgaW5uZXI7XHJcbiAgICAgICAgaWYgKGFzeW5jKSB7XHJcbiAgICAgICAgICAgIGlmICghU3ltYm9sLmFzeW5jRGlzcG9zZSkgdGhyb3cgbmV3IFR5cGVFcnJvcihcIlN5bWJvbC5hc3luY0Rpc3Bvc2UgaXMgbm90IGRlZmluZWQuXCIpO1xyXG4gICAgICAgICAgICBkaXNwb3NlID0gdmFsdWVbU3ltYm9sLmFzeW5jRGlzcG9zZV07XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChkaXNwb3NlID09PSB2b2lkIDApIHtcclxuICAgICAgICAgICAgaWYgKCFTeW1ib2wuZGlzcG9zZSkgdGhyb3cgbmV3IFR5cGVFcnJvcihcIlN5bWJvbC5kaXNwb3NlIGlzIG5vdCBkZWZpbmVkLlwiKTtcclxuICAgICAgICAgICAgZGlzcG9zZSA9IHZhbHVlW1N5bWJvbC5kaXNwb3NlXTtcclxuICAgICAgICAgICAgaWYgKGFzeW5jKSBpbm5lciA9IGRpc3Bvc2U7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICh0eXBlb2YgZGlzcG9zZSAhPT0gXCJmdW5jdGlvblwiKSB0aHJvdyBuZXcgVHlwZUVycm9yKFwiT2JqZWN0IG5vdCBkaXNwb3NhYmxlLlwiKTtcclxuICAgICAgICBpZiAoaW5uZXIpIGRpc3Bvc2UgPSBmdW5jdGlvbigpIHsgdHJ5IHsgaW5uZXIuY2FsbCh0aGlzKTsgfSBjYXRjaCAoZSkgeyByZXR1cm4gUHJvbWlzZS5yZWplY3QoZSk7IH0gfTtcclxuICAgICAgICBlbnYuc3RhY2sucHVzaCh7IHZhbHVlOiB2YWx1ZSwgZGlzcG9zZTogZGlzcG9zZSwgYXN5bmM6IGFzeW5jIH0pO1xyXG4gICAgfVxyXG4gICAgZWxzZSBpZiAoYXN5bmMpIHtcclxuICAgICAgICBlbnYuc3RhY2sucHVzaCh7IGFzeW5jOiB0cnVlIH0pO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHZhbHVlO1xyXG5cclxufVxyXG5cclxudmFyIF9TdXBwcmVzc2VkRXJyb3IgPSB0eXBlb2YgU3VwcHJlc3NlZEVycm9yID09PSBcImZ1bmN0aW9uXCIgPyBTdXBwcmVzc2VkRXJyb3IgOiBmdW5jdGlvbiAoZXJyb3IsIHN1cHByZXNzZWQsIG1lc3NhZ2UpIHtcclxuICAgIHZhciBlID0gbmV3IEVycm9yKG1lc3NhZ2UpO1xyXG4gICAgcmV0dXJuIGUubmFtZSA9IFwiU3VwcHJlc3NlZEVycm9yXCIsIGUuZXJyb3IgPSBlcnJvciwgZS5zdXBwcmVzc2VkID0gc3VwcHJlc3NlZCwgZTtcclxufTtcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX2Rpc3Bvc2VSZXNvdXJjZXMoZW52KSB7XHJcbiAgICBmdW5jdGlvbiBmYWlsKGUpIHtcclxuICAgICAgICBlbnYuZXJyb3IgPSBlbnYuaGFzRXJyb3IgPyBuZXcgX1N1cHByZXNzZWRFcnJvcihlLCBlbnYuZXJyb3IsIFwiQW4gZXJyb3Igd2FzIHN1cHByZXNzZWQgZHVyaW5nIGRpc3Bvc2FsLlwiKSA6IGU7XHJcbiAgICAgICAgZW52Lmhhc0Vycm9yID0gdHJ1ZTtcclxuICAgIH1cclxuICAgIHZhciByLCBzID0gMDtcclxuICAgIGZ1bmN0aW9uIG5leHQoKSB7XHJcbiAgICAgICAgd2hpbGUgKHIgPSBlbnYuc3RhY2sucG9wKCkpIHtcclxuICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICAgIGlmICghci5hc3luYyAmJiBzID09PSAxKSByZXR1cm4gcyA9IDAsIGVudi5zdGFjay5wdXNoKHIpLCBQcm9taXNlLnJlc29sdmUoKS50aGVuKG5leHQpO1xyXG4gICAgICAgICAgICAgICAgaWYgKHIuZGlzcG9zZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciByZXN1bHQgPSByLmRpc3Bvc2UuY2FsbChyLnZhbHVlKTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoci5hc3luYykgcmV0dXJuIHMgfD0gMiwgUHJvbWlzZS5yZXNvbHZlKHJlc3VsdCkudGhlbihuZXh0LCBmdW5jdGlvbihlKSB7IGZhaWwoZSk7IHJldHVybiBuZXh0KCk7IH0pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgZWxzZSBzIHw9IDE7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgY2F0Y2ggKGUpIHtcclxuICAgICAgICAgICAgICAgIGZhaWwoZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKHMgPT09IDEpIHJldHVybiBlbnYuaGFzRXJyb3IgPyBQcm9taXNlLnJlamVjdChlbnYuZXJyb3IpIDogUHJvbWlzZS5yZXNvbHZlKCk7XHJcbiAgICAgICAgaWYgKGVudi5oYXNFcnJvcikgdGhyb3cgZW52LmVycm9yO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIG5leHQoKTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9fcmV3cml0ZVJlbGF0aXZlSW1wb3J0RXh0ZW5zaW9uKHBhdGgsIHByZXNlcnZlSnN4KSB7XHJcbiAgICBpZiAodHlwZW9mIHBhdGggPT09IFwic3RyaW5nXCIgJiYgL15cXC5cXC4/XFwvLy50ZXN0KHBhdGgpKSB7XHJcbiAgICAgICAgcmV0dXJuIHBhdGgucmVwbGFjZSgvXFwuKHRzeCkkfCgoPzpcXC5kKT8pKCg/OlxcLlteLi9dKz8pPylcXC4oW2NtXT8pdHMkL2ksIGZ1bmN0aW9uIChtLCB0c3gsIGQsIGV4dCwgY20pIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRzeCA/IHByZXNlcnZlSnN4ID8gXCIuanN4XCIgOiBcIi5qc1wiIDogZCAmJiAoIWV4dCB8fCAhY20pID8gbSA6IChkICsgZXh0ICsgXCIuXCIgKyBjbS50b0xvd2VyQ2FzZSgpICsgXCJqc1wiKTtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuICAgIHJldHVybiBwYXRoO1xyXG59XHJcblxyXG5leHBvcnQgZGVmYXVsdCB7XHJcbiAgICBfX2V4dGVuZHM6IF9fZXh0ZW5kcyxcclxuICAgIF9fYXNzaWduOiBfX2Fzc2lnbixcclxuICAgIF9fcmVzdDogX19yZXN0LFxyXG4gICAgX19kZWNvcmF0ZTogX19kZWNvcmF0ZSxcclxuICAgIF9fcGFyYW06IF9fcGFyYW0sXHJcbiAgICBfX2VzRGVjb3JhdGU6IF9fZXNEZWNvcmF0ZSxcclxuICAgIF9fcnVuSW5pdGlhbGl6ZXJzOiBfX3J1bkluaXRpYWxpemVycyxcclxuICAgIF9fcHJvcEtleTogX19wcm9wS2V5LFxyXG4gICAgX19zZXRGdW5jdGlvbk5hbWU6IF9fc2V0RnVuY3Rpb25OYW1lLFxyXG4gICAgX19tZXRhZGF0YTogX19tZXRhZGF0YSxcclxuICAgIF9fYXdhaXRlcjogX19hd2FpdGVyLFxyXG4gICAgX19nZW5lcmF0b3I6IF9fZ2VuZXJhdG9yLFxyXG4gICAgX19jcmVhdGVCaW5kaW5nOiBfX2NyZWF0ZUJpbmRpbmcsXHJcbiAgICBfX2V4cG9ydFN0YXI6IF9fZXhwb3J0U3RhcixcclxuICAgIF9fdmFsdWVzOiBfX3ZhbHVlcyxcclxuICAgIF9fcmVhZDogX19yZWFkLFxyXG4gICAgX19zcHJlYWQ6IF9fc3ByZWFkLFxyXG4gICAgX19zcHJlYWRBcnJheXM6IF9fc3ByZWFkQXJyYXlzLFxyXG4gICAgX19zcHJlYWRBcnJheTogX19zcHJlYWRBcnJheSxcclxuICAgIF9fYXdhaXQ6IF9fYXdhaXQsXHJcbiAgICBfX2FzeW5jR2VuZXJhdG9yOiBfX2FzeW5jR2VuZXJhdG9yLFxyXG4gICAgX19hc3luY0RlbGVnYXRvcjogX19hc3luY0RlbGVnYXRvcixcclxuICAgIF9fYXN5bmNWYWx1ZXM6IF9fYXN5bmNWYWx1ZXMsXHJcbiAgICBfX21ha2VUZW1wbGF0ZU9iamVjdDogX19tYWtlVGVtcGxhdGVPYmplY3QsXHJcbiAgICBfX2ltcG9ydFN0YXI6IF9faW1wb3J0U3RhcixcclxuICAgIF9faW1wb3J0RGVmYXVsdDogX19pbXBvcnREZWZhdWx0LFxyXG4gICAgX19jbGFzc1ByaXZhdGVGaWVsZEdldDogX19jbGFzc1ByaXZhdGVGaWVsZEdldCxcclxuICAgIF9fY2xhc3NQcml2YXRlRmllbGRTZXQ6IF9fY2xhc3NQcml2YXRlRmllbGRTZXQsXHJcbiAgICBfX2NsYXNzUHJpdmF0ZUZpZWxkSW46IF9fY2xhc3NQcml2YXRlRmllbGRJbixcclxuICAgIF9fYWRkRGlzcG9zYWJsZVJlc291cmNlOiBfX2FkZERpc3Bvc2FibGVSZXNvdXJjZSxcclxuICAgIF9fZGlzcG9zZVJlc291cmNlczogX19kaXNwb3NlUmVzb3VyY2VzLFxyXG4gICAgX19yZXdyaXRlUmVsYXRpdmVJbXBvcnRFeHRlbnNpb246IF9fcmV3cml0ZVJlbGF0aXZlSW1wb3J0RXh0ZW5zaW9uLFxyXG59O1xyXG4iLCJpbXBvcnQgeyBcbiAgICBBcHAsXG4gICAgSXRlbVZpZXcsXG4gICAgTWFya2Rvd25WaWV3LFxuICAgIE5vdGljZSxcbiAgICBQbHVnaW4sXG4gICAgcmVxdWVzdFVybCxcbiAgICBTdWdnZXN0TW9kYWwsXG4gICAgVEZpbGUsXG4gICAgV29ya3NwYWNlTGVhZixcbn0gZnJvbSBcIm9ic2lkaWFuXCI7XG5cbmNvbnN0IEZJTkROT1RFX1NFUlZFUiA9IFwiaHR0cDovLzEyNy4wLjAuMTo4MDAwXCI7XG5cbmludGVyZmFjZSBTZWFyY2hSZXN1bHRcbntcbiAgICBjb2xsZWN0aW9uOiBzdHJpbmc7XG4gICAgZmlsZTogc3RyaW5nO1xuICAgIGluZGV4OiBudW1iZXI7XG4gICAgbGluZTogbnVtYmVyO1xuICAgIHRpdGxlOiBzdHJpbmc7XG59XG5cbmNsYXNzIEZpbmRub3RlU2VhcmNoTW9kYWwgZXh0ZW5kcyBTdWdnZXN0TW9kYWw8U2VhcmNoUmVzdWx0Plxue1xuICAgIHByaXZhdGUgc2VhcmNoVGltZXI6IFJldHVyblR5cGU8dHlwZW9mIHNldFRpbWVvdXQ+IHwgbnVsbCA9IG51bGw7XG5cbiAgICBjb25zdHJ1Y3RvcihcbiAgICAgICAgYXBwOiBBcHAsXG4gICAgICAgIHByaXZhdGUgcGx1Z2luOiBGaW5kbm90ZVBsdWdpbilcbiAgICB7XG4gICAgICAgIHN1cGVyKGFwcCk7XG4gICAgfVxuXG4gICAgb25PcGVuKClcbiAgICB7XG4gICAgICAgIHN1cGVyLm9uT3BlbigpO1xuICAgICAgICB0aGlzLnNldFBsYWNlaG9sZGVyKFwiU2VhcmNoIHlvdXIgbm90ZXMuLi5cIik7XG4gICAgfVxuXG4gICAgYXN5bmMgZ2V0U3VnZ2VzdGlvbnMocXVlcnk6IHN0cmluZyk6IFByb21pc2U8U2VhcmNoUmVzdWx0W10+XG4gICAge1xuICAgICAgICBpZiAoIXF1ZXJ5LnRyaW0oKSlcbiAgICAgICAge1xuICAgICAgICAgICAgcmV0dXJuIFtdO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRoaXMuc2VhcmNoVGltZXIgIT09IG51bGwpXG4gICAgICAgIHtcbiAgICAgICAgICAgIGNsZWFyVGltZW91dCh0aGlzLnNlYXJjaFRpbWVyKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT5cbiAgICAgICAge1xuICAgICAgICAgICAgdGhpcy5zZWFyY2hUaW1lciA9IHNldFRpbWVvdXQoYXN5bmMgKCkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IHJlc3VsdHMgPSBhd2FpdCB0aGlzLnBsdWdpbi5zZWFyY2hOb3RlcyhxdWVyeSk7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZShyZXN1bHRzKTtcbiAgICAgICAgICAgIH0sIDI1MCk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHJlbmRlclN1Z2dlc3Rpb24ocmVzdWx0OiBTZWFyY2hSZXN1bHQsIGVsOiBIVE1MRWxlbWVudClcbiAgICB7XG4gICAgICAgIGVsLmNyZWF0ZUVsKFwiZGl2XCIsXG4gICAgICAgIHtcbiAgICAgICAgICAgIHRleHQ6IHRoaXMucGx1Z2luLnRydW5jYXRlVGl0bGUocmVzdWx0LnRpdGxlKSxcbiAgICAgICAgfSk7XG5cbiAgICAgICAgZWwuY3JlYXRlRWwoXCJzbWFsbFwiLFxuICAgICAgICB7XG4gICAgICAgICAgICB0ZXh0OiBgJHtyZXN1bHQuY29sbGVjdGlvbn0vJHtyZXN1bHQuZmlsZX1gLFxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBhc3luYyBvbkNob29zZVN1Z2dlc3Rpb24ocmVzdWx0OiBTZWFyY2hSZXN1bHQpXG4gICAge1xuICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi5vcGVuUmVzdWx0KHJlc3VsdCk7XG4gICAgfVxufVxuXG5jb25zdCBWSUVXX1RZUEVfRklORE5PVEUgPSBcImZpbmRub3RlLXNlYXJjaFwiO1xuXG5jbGFzcyBGaW5kbm90ZVNlYXJjaFZpZXcgZXh0ZW5kcyBJdGVtVmlld1xue1xuICAgIHByaXZhdGUgc2VhcmNoVGltZXI6IFJldHVyblR5cGU8dHlwZW9mIHNldFRpbWVvdXQ+IHwgbnVsbCA9IG51bGw7XG4gICAgcHJpdmF0ZSBzZWFyY2hSZXF1ZXN0SWQgPSAwO1xuXG4gICAgY29uc3RydWN0b3IoXG4gICAgICAgIGxlYWY6IFdvcmtzcGFjZUxlYWYsXG4gICAgICAgIHByaXZhdGUgcGx1Z2luOiBGaW5kbm90ZVBsdWdpbilcbiAgICB7XG4gICAgICAgIHN1cGVyKGxlYWYpO1xuICAgIH1cblxuICAgIGdldFZpZXdUeXBlKCk6IHN0cmluZ1xuICAgIHtcbiAgICAgICAgcmV0dXJuIFZJRVdfVFlQRV9GSU5ETk9URTtcbiAgICB9XG5cbiAgICBnZXREaXNwbGF5VGV4dCgpOiBzdHJpbmdcbiAgICB7XG4gICAgICAgIHJldHVybiBcIkZpbmRub3RlXCI7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBzaG93RW1wdHlTdGF0ZShzdGF0dXNFbDogSFRNTEVsZW1lbnQpOiB2b2lkXG4gICAge1xuICAgICAgICBzdGF0dXNFbC5lbXB0eSgpO1xuXG4gICAgICAgIGNvbnN0IG1lc3NhZ2VFbCA9IHN0YXR1c0VsLmNyZWF0ZURpdihcbiAgICAgICAge1xuICAgICAgICAgICAgdGV4dDogXCJTZWFyY2ggeW91ciBub3Rlc1wiLFxuICAgICAgICAgICAgY2xzOiBcImZpbmRub3RlLWVtcHR5XCIsXG4gICAgICAgIH0pO1xuXG4gICAgICAgIG1lc3NhZ2VFbC5zdHlsZS5tYXJnaW5Ub3AgPSBcIjEycHhcIjtcbiAgICAgICAgbWVzc2FnZUVsLnN0eWxlLmZvbnRTaXplID0gXCIwLjllbVwiO1xuICAgIH1cblxuICAgIHByaXZhdGUgc2hvd1NlYXJjaGluZ1N0YXRlKHN0YXR1c0VsOiBIVE1MRWxlbWVudCk6IHZvaWRcbiAgICB7XG4gICAgICAgIHN0YXR1c0VsLmVtcHR5KCk7XG5cbiAgICAgICAgY29uc3QgbWVzc2FnZUVsID0gc3RhdHVzRWwuY3JlYXRlRGl2KFxuICAgICAgICB7XG4gICAgICAgICAgICB0ZXh0OiBcIlNlYXJjaGluZ+KAplwiLFxuICAgICAgICAgICAgY2xzOiBcImZpbmRub3RlLWVtcHR5XCIsXG4gICAgICAgIH0pO1xuXG4gICAgICAgIG1lc3NhZ2VFbC5zdHlsZS5tYXJnaW5Ub3AgPSBcIjEycHhcIjtcbiAgICAgICAgbWVzc2FnZUVsLnN0eWxlLmZvbnRTaXplID0gXCIwLjllbVwiO1xuICAgIH1cblxuICAgIHByaXZhdGUgc2hvd05vUmVzdWx0c1N0YXRlKHN0YXR1c0VsOiBIVE1MRWxlbWVudCk6IHZvaWRcbiAgICB7XG4gICAgICAgIHN0YXR1c0VsLmVtcHR5KCk7XG5cbiAgICAgICAgY29uc3QgbWVzc2FnZUVsID0gc3RhdHVzRWwuY3JlYXRlRGl2KFxuICAgICAgICB7XG4gICAgICAgICAgICB0ZXh0OiBcIk5vIG5vdGVzIGZvdW5kXCIsXG4gICAgICAgICAgICBjbHM6IFwiZmluZG5vdGUtZW1wdHlcIixcbiAgICAgICAgfSk7XG5cbiAgICAgICAgbWVzc2FnZUVsLnN0eWxlLm1hcmdpblRvcCA9IFwiMTJweFwiO1xuICAgICAgICBtZXNzYWdlRWwuc3R5bGUuZm9udFNpemUgPSBcIjAuOWVtXCI7XG4gICAgfVxuXG4gICAgYXN5bmMgb25PcGVuKCk6IFByb21pc2U8dm9pZD5cbiAgICB7XG4gICAgICAgIHRoaXMuY29udGVudEVsLmVtcHR5KCk7XG5cbiAgICAgICAgdGhpcy5jb250ZW50RWwuY3JlYXRlRWwoXCJoMlwiLFxuICAgICAgICB7XG4gICAgICAgICAgICB0ZXh0OiBcIkZpbmRub3RlXCIsXG4gICAgICAgIH0pO1xuXG4gICAgICAgIGNvbnN0IHNlYXJjaENvbnRhaW5lciA9IHRoaXMuY29udGVudEVsLmNyZWF0ZURpdigpO1xuXG4gICAgICAgIHNlYXJjaENvbnRhaW5lci5zdHlsZS5wb3NpdGlvbiA9IFwicmVsYXRpdmVcIjtcblxuICAgICAgICBjb25zdCBpbnB1dCA9IHNlYXJjaENvbnRhaW5lci5jcmVhdGVFbChcImlucHV0XCIsXG4gICAgICAgIHtcbiAgICAgICAgICAgIHR5cGU6IFwidGV4dFwiLFxuICAgICAgICAgICAgcGxhY2Vob2xkZXI6IFwiU2VhcmNoIG5vdGVzLi4uXCIsXG4gICAgICAgIH0pO1xuXG4gICAgICAgIGlucHV0LnN0eWxlLndpZHRoID0gXCIxMDAlXCI7XG4gICAgICAgIGlucHV0LnN0eWxlLnBhZGRpbmdSaWdodCA9IFwiMzBweFwiO1xuXG4gICAgICAgIGNvbnN0IGNsZWFyQnV0dG9uID0gc2VhcmNoQ29udGFpbmVyLmNyZWF0ZUVsKFwiYnV0dG9uXCIsXG4gICAgICAgIHtcbiAgICAgICAgICAgIHRleHQ6IFwiw5dcIixcbiAgICAgICAgfSk7XG5cbiAgICAgICAgY2xlYXJCdXR0b24uc3R5bGUucG9zaXRpb24gPSBcImFic29sdXRlXCI7XG4gICAgICAgIGNsZWFyQnV0dG9uLnN0eWxlLnJpZ2h0ID0gXCI0cHhcIjtcbiAgICAgICAgY2xlYXJCdXR0b24uc3R5bGUudG9wID0gXCI1MCVcIjtcbiAgICAgICAgY2xlYXJCdXR0b24uc3R5bGUudHJhbnNmb3JtID0gXCJ0cmFuc2xhdGVZKC01MCUpXCI7XG4gICAgICAgIGNsZWFyQnV0dG9uLnN0eWxlLmRpc3BsYXkgPSBcIm5vbmVcIjtcbiAgICAgICAgY2xlYXJCdXR0b24uc3R5bGUuaGVpZ2h0ID0gXCIxMDAlXCI7XG4gICAgICAgIGNsZWFyQnV0dG9uLnN0eWxlLm1hcmdpbiA9IFwiMFwiO1xuICAgICAgICBjbGVhckJ1dHRvbi5zdHlsZS5taW5IZWlnaHQgPSBcIjBcIjtcbiAgICAgICAgY2xlYXJCdXR0b24uc3R5bGUubWluV2lkdGggPSBcIjBcIjtcbiAgICAgICAgY2xlYXJCdXR0b24uc3R5bGUucGFkZGluZyA9IFwiMCA2cHhcIjtcbiAgICAgICAgY2xlYXJCdXR0b24uc3R5bGUuYm9yZGVyID0gXCJub25lXCI7XG4gICAgICAgIGNsZWFyQnV0dG9uLnN0eWxlLmJhY2tncm91bmQgPSBcInRyYW5zcGFyZW50XCI7XG4gICAgICAgIGNsZWFyQnV0dG9uLnN0eWxlLmJveFNoYWRvdyA9IFwibm9uZVwiO1xuICAgICAgICBjbGVhckJ1dHRvbi5zdHlsZS5mb250U2l6ZSA9IFwiMThweFwiO1xuICAgICAgICBjbGVhckJ1dHRvbi5zdHlsZS5jdXJzb3IgPSBcInBvaW50ZXJcIjtcblxuICAgICAgICBjb25zdCBzdGF0dXNFbCA9IHRoaXMuY29udGVudEVsLmNyZWF0ZURpdigpO1xuXG4gICAgICAgIGNvbnN0IHJlc3VsdHNFbCA9IHRoaXMuY29udGVudEVsLmNyZWF0ZURpdigpO1xuXG4gICAgICAgIHJlc3VsdHNFbC5zdHlsZS5tYXJnaW5Ub3AgPSBcIjEycHhcIjtcblxuICAgICAgICB0aGlzLnNob3dFbXB0eVN0YXRlKHN0YXR1c0VsKTtcblxuICAgICAgICBpbnB1dC5hZGRFdmVudExpc3RlbmVyKFwiaW5wdXRcIiwgKCkgPT5cbiAgICAgICAge1xuICAgICAgICAgICAgY2xlYXJCdXR0b24uc3R5bGUuZGlzcGxheSA9IGlucHV0LnZhbHVlID8gXCJibG9ja1wiIDogXCJub25lXCI7XG5cbiAgICAgICAgICAgIGlmICh0aGlzLnNlYXJjaFRpbWVyICE9PSBudWxsKVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGNsZWFyVGltZW91dCh0aGlzLnNlYXJjaFRpbWVyKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKCFpbnB1dC52YWx1ZS50cmltKCkpXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgdGhpcy5zZWFyY2hSZXF1ZXN0SWQrKztcbiAgICAgICAgICAgICAgICByZXN1bHRzRWwuZW1wdHkoKTtcbiAgICAgICAgICAgICAgICB0aGlzLnNob3dFbXB0eVN0YXRlKHN0YXR1c0VsKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRoaXMuc2hvd1NlYXJjaGluZ1N0YXRlKHN0YXR1c0VsKTtcbiAgICAgICAgICAgIHJlc3VsdHNFbC5lbXB0eSgpO1xuXG4gICAgICAgICAgICB0aGlzLnNlYXJjaFRpbWVyID0gc2V0VGltZW91dChhc3luYyAoKSA9PlxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHRoaXMuc2VhcmNoVGltZXIgPSBudWxsO1xuXG4gICAgICAgICAgICAgICAgY29uc3QgcmVxdWVzdElkID0gKyt0aGlzLnNlYXJjaFJlcXVlc3RJZDtcblxuICAgICAgICAgICAgICAgIHRyeVxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgcmVzdWx0cyA9IGF3YWl0IHRoaXMucGx1Z2luLnNlYXJjaE5vdGVzKGlucHV0LnZhbHVlKTtcblxuICAgICAgICAgICAgICAgICAgICBpZiAocmVxdWVzdElkICE9PSB0aGlzLnNlYXJjaFJlcXVlc3RJZClcbiAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKHJlc3VsdHMubGVuZ3RoID09PSAwKVxuICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnNob3dOb1Jlc3VsdHNTdGF0ZShzdGF0dXNFbCk7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBzdGF0dXNFbC5lbXB0eSgpO1xuICAgICAgICAgICAgICAgICAgICByZXN1bHRzRWwuZW1wdHkoKTtcblxuICAgICAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IHJlc3VsdCBvZiByZXN1bHRzKVxuICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCByZXN1bHRFbCA9IHJlc3VsdHNFbC5jcmVhdGVEaXYoXG4gICAgICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xzOiBcImZpbmRub3RlLXJlc3VsdFwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdEVsLnNldEF0dHJpYnV0ZShcInRhYmluZGV4XCIsIFwiMFwiKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0RWwuY3JlYXRlRGl2KFxuICAgICAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRleHQ6IHRoaXMucGx1Z2luLnRydW5jYXRlVGl0bGUocmVzdWx0LnRpdGxlKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbHM6IFwiZmluZG5vdGUtcmVzdWx0LXRpdGxlXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0RWwuY3JlYXRlRWwoXCJzbWFsbFwiLFxuICAgICAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRleHQ6IGAke3Jlc3VsdC5jb2xsZWN0aW9ufS8ke3Jlc3VsdC5maWxlfWAsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xzOiBcImZpbmRub3RlLXJlc3VsdC1wYXRoXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0RWwuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+XG4gICAgICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdm9pZCB0aGlzLnBsdWdpbi5vcGVuUmVzdWx0KHJlc3VsdCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0RWwuYWRkRXZlbnRMaXN0ZW5lcihcImtleWRvd25cIiwgKGV2ZW50KSA9PlxuICAgICAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChldmVudC5rZXkgPT09IFwiRW50ZXJcIilcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZvaWQgdGhpcy5wbHVnaW4ub3BlblJlc3VsdChyZXN1bHQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGV2ZW50LmtleSAhPT0gXCJBcnJvd0Rvd25cIiAmJiBldmVudC5rZXkgIT09IFwiQXJyb3dVcFwiKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCByZXN1bHRFbHMgPVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBBcnJheS5mcm9tKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0c0VsLnF1ZXJ5U2VsZWN0b3JBbGw8SFRNTEVsZW1lbnQ+KFwiLmZpbmRub3RlLXJlc3VsdFwiKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICApO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgY3VycmVudEluZGV4ID0gcmVzdWx0RWxzLmluZGV4T2YocmVzdWx0RWwpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGN1cnJlbnRJbmRleCA9PT0gLTEpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGV2ZW50LmtleSA9PT0gXCJBcnJvd1VwXCIpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoY3VycmVudEluZGV4ID09PSAwKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbnB1dC5mb2N1cygpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0RWxzW2N1cnJlbnRJbmRleCAtIDFdLmZvY3VzKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGN1cnJlbnRJbmRleCA9PT0gcmVzdWx0RWxzLmxlbmd0aCAtIDEpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbnB1dC5mb2N1cygpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXN1bHRFbHNbY3VycmVudEluZGV4ICsgMV0uZm9jdXMoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjYXRjaCAoZXJyb3IpXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBpZiAocmVxdWVzdElkICE9PSB0aGlzLnNlYXJjaFJlcXVlc3RJZClcbiAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0c0VsLmVtcHR5KCk7XG5cbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0c0VsLmNyZWF0ZURpdihcbiAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGV4dDogXCJTZWFyY2ggZmFpbGVkXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBjbHM6IFwiZmluZG5vdGUtZW1wdHlcIixcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSwgMjUwKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgaW5wdXQuYWRkRXZlbnRMaXN0ZW5lcihcImtleWRvd25cIiwgKGV2ZW50KSA9PlxuICAgICAgICB7XG4gICAgICAgICAgICBpZiAoZXZlbnQua2V5ICE9PSBcIkFycm93RG93blwiICYmIGV2ZW50LmtleSAhPT0gXCJBcnJvd1VwXCIpXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCByZXN1bHRFbHMgPVxuICAgICAgICAgICAgICAgIEFycmF5LmZyb20oXG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdHNFbC5xdWVyeVNlbGVjdG9yQWxsPEhUTUxFbGVtZW50PihcIi5maW5kbm90ZS1yZXN1bHRcIilcbiAgICAgICAgICAgICAgICApO1xuXG4gICAgICAgICAgICBpZiAocmVzdWx0RWxzLmxlbmd0aCA9PT0gMClcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG5cbiAgICAgICAgICAgIGlmIChldmVudC5rZXkgPT09IFwiQXJyb3dEb3duXCIpXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgcmVzdWx0RWxzWzBdLmZvY3VzKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgcmVzdWx0RWxzW3Jlc3VsdEVscy5sZW5ndGggLSAxXS5mb2N1cygpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICBjbGVhckJ1dHRvbi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT5cbiAgICAgICAge1xuICAgICAgICAgICAgaW5wdXQudmFsdWUgPSBcIlwiO1xuICAgICAgICAgICAgaW5wdXQuZGlzcGF0Y2hFdmVudChuZXcgRXZlbnQoXCJpbnB1dFwiKSk7XG4gICAgICAgICAgICBpbnB1dC5mb2N1cygpO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBvbkNsb3NlKCk6IFByb21pc2U8dm9pZD5cbiAgICB7XG4gICAgICAgIGlmICh0aGlzLnNlYXJjaFRpbWVyICE9PSBudWxsKVxuICAgICAgICB7XG4gICAgICAgICAgICBjbGVhclRpbWVvdXQodGhpcy5zZWFyY2hUaW1lcik7XG4gICAgICAgICAgICB0aGlzLnNlYXJjaFRpbWVyID0gbnVsbDtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcbiAgICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEZpbmRub3RlUGx1Z2luIGV4dGVuZHMgUGx1Z2luXG57XG4gICAgYXN5bmMgb25sb2FkKClcbiAgICB7XG4gICAgICAgIGNvbnNvbGUubG9nKFwiRmluZG5vdGUgcGx1Z2luIGxvYWRlZFwiKTtcblxuICAgICAgICB0aGlzLnJlZ2lzdGVyVmlldyhcbiAgICAgICAgICAgIFZJRVdfVFlQRV9GSU5ETk9URSxcbiAgICAgICAgICAgIChsZWFmKSA9PiBuZXcgRmluZG5vdGVTZWFyY2hWaWV3KGxlYWYsIHRoaXMpXG4gICAgICAgICk7XG5cbiAgICAgICAgdGhpcy5hZGRDb21tYW5kKFxuICAgICAgICB7XG4gICAgICAgICAgICBpZDogXCJzZWFyY2hcIixcbiAgICAgICAgICAgIG5hbWU6IFwiU2VhcmNoIG5vdGVzXCIsXG4gICAgICAgICAgICBjYWxsYmFjazogKCkgPT5cbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBuZXcgRmluZG5vdGVTZWFyY2hNb2RhbCh0aGlzLmFwcCwgdGhpcykub3BlbigpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSk7XG5cbiAgICAgICAgdGhpcy5hZGRDb21tYW5kKFxuICAgICAgICB7XG4gICAgICAgICAgICBpZDogXCJvcGVuLXNlYXJjaFwiLFxuICAgICAgICAgICAgbmFtZTogXCJPcGVuIHNlYXJjaCBzaWRlYmFyXCIsXG4gICAgICAgICAgICBjYWxsYmFjazogKCkgPT5cbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICB2b2lkIHRoaXMuYWN0aXZhdGVWaWV3KCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBhc3luYyBhY3RpdmF0ZVZpZXcoKTogUHJvbWlzZTx2b2lkPlxuICAgIHtcbiAgICAgICAgY29uc3QgeyB3b3Jrc3BhY2UgfSA9IHRoaXMuYXBwO1xuXG4gICAgICAgIGxldCBsZWFmOiBXb3Jrc3BhY2VMZWFmIHwgbnVsbCA9XG4gICAgICAgICAgICB3b3Jrc3BhY2UuZ2V0TGVhdmVzT2ZUeXBlKFZJRVdfVFlQRV9GSU5ETk9URSlbMF0gPz8gbnVsbDtcblxuICAgICAgICBpZiAoIWxlYWYpXG4gICAgICAgIHtcbiAgICAgICAgICAgIGxlYWYgPSB3b3Jrc3BhY2UuZ2V0UmlnaHRMZWFmKGZhbHNlKTtcblxuICAgICAgICAgICAgaWYgKCFsZWFmKVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgYXdhaXQgbGVhZi5zZXRWaWV3U3RhdGUoXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgdHlwZTogVklFV19UWVBFX0ZJTkROT1RFLFxuICAgICAgICAgICAgICAgIGFjdGl2ZTogdHJ1ZSxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgd29ya3NwYWNlLnJldmVhbExlYWYobGVhZik7XG4gICAgfVxuXG4gICAgcGFyc2VRdWVyeShxdWVyeTogc3RyaW5nKTpcbiAgICB7XG4gICAgICAgIGFsbDogc3RyaW5nW107XG4gICAgICAgIGFueTogc3RyaW5nW107XG4gICAgICAgIG5vdDogc3RyaW5nW107XG4gICAgICAgIHJlZ2V4OiBzdHJpbmcgfCBudWxsO1xuICAgIH1cbiAgICB7XG4gICAgICAgIGNvbnN0IHJlc3VsdCA9XG4gICAgICAgIHtcbiAgICAgICAgICAgIGFsbDogW10gYXMgc3RyaW5nW10sXG4gICAgICAgICAgICBhbnk6IFtdIGFzIHN0cmluZ1tdLFxuICAgICAgICAgICAgbm90OiBbXSBhcyBzdHJpbmdbXSxcbiAgICAgICAgICAgIHJlZ2V4OiBudWxsIGFzIHN0cmluZyB8IG51bGwsXG4gICAgICAgIH07XG5cbiAgICAgICAgY29uc3Qgc2VjdGlvbnMgPSBxdWVyeS50cmltKCkuc3BsaXQoXG4gICAgICAgICAgICAvXFxzKyg/PSg/OmFsbHxhbnl8bm90fHJlKTopL2lcbiAgICAgICAgKTtcblxuICAgICAgICBmb3IgKGNvbnN0IHNlY3Rpb24gb2Ygc2VjdGlvbnMpXG4gICAgICAgIHtcbiAgICAgICAgICAgIGNvbnN0IG1hdGNoID0gc2VjdGlvbi5tYXRjaChcbiAgICAgICAgICAgICAgICAvXihhbGx8YW55fG5vdHxyZSk6XFxzKiguKikkL2lcbiAgICAgICAgICAgICk7XG5cbiAgICAgICAgICAgIGlmICghbWF0Y2gpXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgcmVzdWx0LmFsbC5wdXNoKC4uLnNlY3Rpb24uc3BsaXQoL1xccysvKS5maWx0ZXIoQm9vbGVhbikpO1xuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCBtb2RlID0gbWF0Y2hbMV0udG9Mb3dlckNhc2UoKTtcbiAgICAgICAgICAgIGNvbnN0IHZhbHVlID0gbWF0Y2hbMl0udHJpbSgpO1xuXG4gICAgICAgICAgICBpZiAoIXZhbHVlKVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAobW9kZSA9PT0gXCJyZVwiKVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHJlc3VsdC5yZWdleCA9IHZhbHVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAobW9kZSA9PT0gXCJhbGxcIilcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICByZXN1bHQuYWxsLnB1c2goLi4udmFsdWUuc3BsaXQoL1xccysvKS5maWx0ZXIoQm9vbGVhbikpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAobW9kZSA9PT0gXCJhbnlcIilcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICByZXN1bHQuYW55LnB1c2goLi4udmFsdWUuc3BsaXQoL1xccysvKS5maWx0ZXIoQm9vbGVhbikpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAobW9kZSA9PT0gXCJub3RcIilcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICByZXN1bHQubm90LnB1c2goLi4udmFsdWUuc3BsaXQoL1xccysvKS5maWx0ZXIoQm9vbGVhbikpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9XG5cbiAgICBhc3luYyBzZWFyY2hOb3RlcyhxdWVyeTogc3RyaW5nKTogUHJvbWlzZTxTZWFyY2hSZXN1bHRbXT5cbiAgICB7XG4gICAgICAgIHRyeVxuICAgICAgICB7XG4gICAgICAgICAgICBjb25zdCBzZWFyY2ggPSB0aGlzLnBhcnNlUXVlcnkocXVlcnkpO1xuICAgICAgICAgICAgY29uc3QgcGFyYW1zID0gbmV3IFVSTFNlYXJjaFBhcmFtcygpO1xuXG4gICAgICAgICAgICBmb3IgKGNvbnN0IHdvcmQgb2Ygc2VhcmNoLmFsbClcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBwYXJhbXMuYXBwZW5kKFwiYWxsXCIsIHdvcmQpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBmb3IgKGNvbnN0IHdvcmQgb2Ygc2VhcmNoLmFueSlcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBwYXJhbXMuYXBwZW5kKFwiYW55XCIsIHdvcmQpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBmb3IgKGNvbnN0IHdvcmQgb2Ygc2VhcmNoLm5vdClcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBwYXJhbXMuYXBwZW5kKFwibm90XCIsIHdvcmQpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoc2VhcmNoLnJlZ2V4KVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHBhcmFtcy5hcHBlbmQoXCJyZVwiLCBzZWFyY2gucmVnZXgpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IHJlcXVlc3RVcmwoXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgdXJsOiBgJHtGSU5ETk9URV9TRVJWRVJ9L3NlYXJjaD8ke3BhcmFtcy50b1N0cmluZygpfWAsXG4gICAgICAgICAgICAgICAgbWV0aG9kOiBcIkdFVFwiLFxuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIHJldHVybiByZXNwb25zZS5qc29uO1xuXG4gICAgICAgIH1cbiAgICAgICAgY2F0Y2ggKGVycm9yKVxuICAgICAgICB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKFwiRmluZG5vdGUgc2VhcmNoIGZhaWxlZDpcIiwgZXJyb3IpO1xuICAgICAgICAgICAgbmV3IE5vdGljZShcIkZpbmRub3RlIHNlcnZlciBjb25uZWN0aW9uIGZhaWxlZFwiKTtcbiAgICAgICAgICAgIHRocm93IGVycm9yO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgYXN5bmMgb3BlblJlc3VsdChyZXN1bHQ6IFNlYXJjaFJlc3VsdCk6IFByb21pc2U8dm9pZD5cbiAgICB7XG4gICAgICAgIGNvbnN0IGZpbGUgPSB0aGlzLmFwcC52YXVsdC5nZXRBYnN0cmFjdEZpbGVCeVBhdGgocmVzdWx0LmZpbGUpO1xuXG4gICAgICAgIGlmICghKGZpbGUgaW5zdGFuY2VvZiBURmlsZSkpXG4gICAgICAgIHtcbiAgICAgICAgICAgIG5ldyBOb3RpY2UoYE5vdGUgbm90IGZvdW5kOiAke3Jlc3VsdC5maWxlfWApO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgYXdhaXQgdGhpcy5hcHAud29ya3NwYWNlLmdldExlYWYoZmFsc2UpLm9wZW5GaWxlKGZpbGUpO1xuXG4gICAgICAgIGNvbnN0IHZpZXcgPSB0aGlzLmFwcC53b3Jrc3BhY2UuZ2V0QWN0aXZlVmlld09mVHlwZShNYXJrZG93blZpZXcpO1xuXG4gICAgICAgIGlmICh2aWV3KVxuICAgICAgICB7XG4gICAgICAgICAgICBjb25zdCBsaW5lID0gTWF0aC5tYXgoMCwgcmVzdWx0LmxpbmUgLSAxKTtcblxuICAgICAgICAgICAgdmlldy5lZGl0b3Iuc2V0Q3Vyc29yKFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGxpbmUsXG4gICAgICAgICAgICAgICAgY2g6IDAsXG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgdmlldy5lZGl0b3Iuc2Nyb2xsSW50b1ZpZXcoXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBmcm9tOiB7IGxpbmUsIGNoOiAwIH0sXG4gICAgICAgICAgICAgICAgICAgIHRvOiB7IGxpbmUsIGNoOiAwIH0sXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICB0cnVlXG4gICAgICAgICAgICApO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgdHJ1bmNhdGVUaXRsZSh0aXRsZTogc3RyaW5nLCBtYXhXb3JkcyA9IDMwKTogc3RyaW5nXG4gICAge1xuICAgICAgICBjb25zdCB3b3JkcyA9IHRpdGxlLnRyaW0oKS5zcGxpdCgvXFxzKy8pO1xuXG4gICAgICAgIGlmICh3b3Jkcy5sZW5ndGggPD0gbWF4V29yZHMpXG4gICAgICAgIHtcbiAgICAgICAgICAgIHJldHVybiB0aXRsZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB3b3Jkcy5zbGljZSgwLCBtYXhXb3Jkcykuam9pbihcIiBcIikgKyBcIuKAplwiO1xuICAgIH1cblxuICAgIG9udW5sb2FkKClcbiAgICB7XG4gICAgICAgIGNvbnNvbGUubG9nKFwiRmluZG5vdGUgcGx1Z2luIHVubG9hZGVkXCIpO1xuICAgIH1cbn1cbiJdLCJuYW1lcyI6WyJTdWdnZXN0TW9kYWwiLCJJdGVtVmlldyIsIlBsdWdpbiIsInJlcXVlc3RVcmwiLCJOb3RpY2UiLCJURmlsZSIsIk1hcmtkb3duVmlldyJdLCJtYXBwaW5ncyI6Ijs7OztBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBa0dBO0FBQ08sU0FBUyxTQUFTLENBQUMsT0FBTyxFQUFFLFVBQVUsRUFBRSxDQUFDLEVBQUUsU0FBUyxFQUFFO0FBQzdELElBQUksU0FBUyxLQUFLLENBQUMsS0FBSyxFQUFFLEVBQUUsT0FBTyxLQUFLLFlBQVksQ0FBQyxHQUFHLEtBQUssR0FBRyxJQUFJLENBQUMsQ0FBQyxVQUFVLE9BQU8sRUFBRSxFQUFFLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNoSCxJQUFJLE9BQU8sS0FBSyxDQUFDLEtBQUssQ0FBQyxHQUFHLE9BQU8sQ0FBQyxFQUFFLFVBQVUsT0FBTyxFQUFFLE1BQU0sRUFBRTtBQUMvRCxRQUFRLFNBQVMsU0FBUyxDQUFDLEtBQUssRUFBRSxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFD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
