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

const DEFAULT_SETTINGS = {
    serverUrl: "http://127.0.0.1:8000",
    collections: [],
};
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
            const optionsDetails = this.contentEl.createEl("details", {
                cls: "findnote-options",
            });
            const optionsSummary = optionsDetails.createEl("summary", {
                text: "Search options",
            });
            const matchCaseRow = optionsDetails.createDiv({
                cls: "findnote-option",
            });
            matchCaseRow.createSpan({
                text: "Match case",
            });
            const matchCaseToggle = matchCaseRow.createEl("input", {
                type: "checkbox",
            });
            matchCaseToggle.addClass("findnote-toggle-input");
            const matchCaseSwitch = matchCaseRow.createSpan({
                cls: "findnote-toggle",
            });
            matchCaseSwitch.appendChild(matchCaseToggle);
            matchCaseSwitch.createSpan({
                cls: "findnote-toggle-slider",
            });
            matchCaseSwitch.addEventListener("click", () => {
                matchCaseToggle.checked = !matchCaseToggle.checked;
                updateOptionIndicators();
                input.dispatchEvent(new Event("input"));
            });
            const wholeWordRow = optionsDetails.createDiv({
                cls: "findnote-option",
            });
            wholeWordRow.createSpan({
                text: "Whole word",
            });
            const wholeWordToggle = wholeWordRow.createEl("input", {
                type: "checkbox",
            });
            wholeWordToggle.addClass("findnote-toggle-input");
            const wholeWordSwitch = wholeWordRow.createSpan({
                cls: "findnote-toggle",
            });
            wholeWordSwitch.appendChild(wholeWordToggle);
            wholeWordSwitch.createSpan({
                cls: "findnote-toggle-slider",
            });
            wholeWordSwitch.addEventListener("click", () => {
                wholeWordToggle.checked = !wholeWordToggle.checked;
                updateOptionIndicators();
                input.dispatchEvent(new Event("input"));
            });
            const updateOptionIndicators = () => {
                optionsSummary.empty();
                optionsSummary.appendText("Search options");
                if (matchCaseToggle.checked) {
                    optionsSummary.createSpan({
                        text: "Case",
                        cls: "findnote-option-indicator",
                    });
                }
                if (wholeWordToggle.checked) {
                    optionsSummary.createSpan({
                        text: "Word",
                        cls: "findnote-option-indicator",
                    });
                }
            };
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
                        const results = yield this.plugin.searchNotes(input.value, matchCaseToggle.checked, wholeWordToggle.checked);
                        if (requestId !== this.searchRequestId) {
                            return;
                        }
                        if (results.length === 0) {
                            if (this.plugin.settings.collections.length === 0) {
                                this.showNoCollectionsState(statusEl);
                            }
                            else {
                                this.showNoResultsState(statusEl);
                            }
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
    showNoCollectionsState(statusEl) {
        statusEl.empty();
        const messageEl = statusEl.createDiv({
            text: "No collections selected",
            cls: "findnote-empty",
        });
        messageEl.style.marginTop = "12px";
        messageEl.style.fontSize = "0.9em";
    }
    onClose() {
        if (this.searchTimer !== null) {
            clearTimeout(this.searchTimer);
            this.searchTimer = null;
        }
        return Promise.resolve();
    }
}
class FindnoteSettingTab extends obsidian.PluginSettingTab {
    constructor(app, plugin) {
        super(app, plugin);
        this.plugin = plugin;
    }
    display() {
        return __awaiter(this, void 0, void 0, function* () {
            const { containerEl } = this;
            containerEl.empty();
            const backButton = containerEl.createEl("button", {
                text: "← Back",
            });
            backButton.style.marginBottom = "18px";
            backButton.addEventListener("click", () => {
                this.app.setting.openTabById("community-plugins");
            });
            new obsidian.Setting(containerEl)
                .setName("Server URL")
                .setDesc("The URL of the Findnote server.")
                .addText((text) => {
                text
                    .setPlaceholder("http://127.0.0.1:8000")
                    .setValue(this.plugin.settings.serverUrl)
                    .onChange((value) => __awaiter(this, void 0, void 0, function* () {
                    this.plugin.settings.serverUrl = value.trim();
                    yield this.plugin.saveSettings();
                }));
            });
            containerEl.createEl("h3", {
                text: "Collections",
            });
            const collectionsDescription = containerEl.createEl("p", {
                text: "Select which collections to search.",
            });
            collectionsDescription.style.marginLeft = "18px";
            try {
                const collections = yield this.plugin.getCollections();
                for (const collection of this.plugin.settings.collections) {
                    if (collections.indexOf(collection) === -1) {
                        new obsidian.Setting(containerEl)
                            .setName(collection)
                            .setDesc("Currently unavailable")
                            .addToggle((toggle) => {
                            toggle
                                .setValue(true)
                                .onChange((value) => __awaiter(this, void 0, void 0, function* () {
                                if (!value) {
                                    this.plugin.settings.collections =
                                        this.plugin.settings.collections.filter((name) => name !== collection);
                                    yield this.plugin.saveSettings();
                                }
                            }));
                        });
                    }
                }
                for (const collection of collections) {
                    new obsidian.Setting(containerEl)
                        .setName(collection)
                        .addToggle((toggle) => {
                        toggle
                            .setValue(this.plugin.settings.collections.indexOf(collection) !== -1)
                            .onChange((value) => __awaiter(this, void 0, void 0, function* () {
                            if (value) {
                                if (this.plugin.settings.collections.lastIndexOf(collection) === -1) {
                                    this.plugin.settings.collections.push(collection);
                                }
                            }
                            else {
                                this.plugin.settings.collections =
                                    this.plugin.settings.collections.filter((name) => name !== collection);
                            }
                            yield this.plugin.saveSettings();
                        }));
                    });
                }
            }
            catch (error) {
                new obsidian.Setting(containerEl)
                    .setName("Unable to load collections")
                    .setDesc("Check the server URL and make sure the Findnote server is running.");
            }
        });
    }
}
class FindnotePlugin extends obsidian.Plugin {
    constructor() {
        super(...arguments);
        this.availableCollections = [];
    }
    onload() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.loadSettings();
            this.addSettingTab(new FindnoteSettingTab(this.app, this));
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
    searchNotes(query_1) {
        return __awaiter(this, arguments, void 0, function* (query, matchCase = false, wholeWord = false) {
            if (this.settings.collections.length === 0) {
                return [];
            }
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
                for (const collection of this.settings.collections) {
                    if (this.availableCollections.indexOf(collection) !== -1) {
                        params.append("collection", collection);
                    }
                }
                if (search.regex) {
                    params.append("re", search.regex);
                }
                params.set("match_case", String(matchCase));
                params.set("whole_word", String(wholeWord));
                const response = yield obsidian.requestUrl({
                    url: `${this.settings.serverUrl}/search?${params.toString()}`,
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
    getCollections() {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield obsidian.requestUrl({
                url: `${this.settings.serverUrl}/collections`,
                method: "GET",
            });
            const collections = response.json;
            this.availableCollections =
                collections.map((collection) => collection.name);
            return this.availableCollections;
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
    loadSettings() {
        return __awaiter(this, void 0, void 0, function* () {
            this.settings = Object.assign({}, DEFAULT_SETTINGS, yield this.loadData());
        });
    }
    saveSettings() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.saveData(this.settings);
        });
    }
    onunload() {
        console.log("Findnote plugin unloaded");
    }
}

module.exports = FindnotePlugin;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZXMiOlsibm9kZV9tb2R1bGVzL3RzbGliL3RzbGliLmVzNi5qcyIsIm1haW4udHMiXSwic291cmNlc0NvbnRlbnQiOlsiLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxyXG5Db3B5cmlnaHQgKGMpIE1pY3Jvc29mdCBDb3Jwb3JhdGlvbi5cclxuXHJcblBlcm1pc3Npb24gdG8gdXNlLCBjb3B5LCBtb2RpZnksIGFuZC9vciBkaXN0cmlidXRlIHRoaXMgc29mdHdhcmUgZm9yIGFueVxyXG5wdXJwb3NlIHdpdGggb3Igd2l0aG91dCBmZWUgaXMgaGVyZWJ5IGdyYW50ZWQuXHJcblxyXG5USEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiIEFORCBUSEUgQVVUSE9SIERJU0NMQUlNUyBBTEwgV0FSUkFOVElFUyBXSVRIXHJcblJFR0FSRCBUTyBUSElTIFNPRlRXQVJFIElOQ0xVRElORyBBTEwgSU1QTElFRCBXQVJSQU5USUVTIE9GIE1FUkNIQU5UQUJJTElUWVxyXG5BTkQgRklUTkVTUy4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFIEFVVEhPUiBCRSBMSUFCTEUgRk9SIEFOWSBTUEVDSUFMLCBESVJFQ1QsXHJcbklORElSRUNULCBPUiBDT05TRVFVRU5USUFMIERBTUFHRVMgT1IgQU5ZIERBTUFHRVMgV0hBVFNPRVZFUiBSRVNVTFRJTkcgRlJPTVxyXG5MT1NTIE9GIFVTRSwgREFUQSBPUiBQUk9GSVRTLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgTkVHTElHRU5DRSBPUlxyXG5PVEhFUiBUT1JUSU9VUyBBQ1RJT04sIEFSSVNJTkcgT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgVVNFIE9SXHJcblBFUkZPUk1BTkNFIE9GIFRISVMgU09GVFdBUkUuXHJcbioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqICovXHJcbi8qIGdsb2JhbCBSZWZsZWN0LCBQcm9taXNlLCBTdXBwcmVzc2VkRXJyb3IsIFN5bWJvbCwgSXRlcmF0b3IgKi9cclxuXHJcbnZhciBleHRlbmRTdGF0aWNzID0gZnVuY3Rpb24oZCwgYikge1xyXG4gICAgZXh0ZW5kU3RhdGljcyA9IE9iamVjdC5zZXRQcm90b3R5cGVPZiB8fFxyXG4gICAgICAgICh7IF9fcHJvdG9fXzogW10gfSBpbnN0YW5jZW9mIEFycmF5ICYmIGZ1bmN0aW9uIChkLCBiKSB7IGQuX19wcm90b19fID0gYjsgfSkgfHxcclxuICAgICAgICBmdW5jdGlvbiAoZCwgYikgeyBmb3IgKHZhciBwIGluIGIpIGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwoYiwgcCkpIGRbcF0gPSBiW3BdOyB9O1xyXG4gICAgcmV0dXJuIGV4dGVuZFN0YXRpY3MoZCwgYik7XHJcbn07XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gX19leHRlbmRzKGQsIGIpIHtcclxuICAgIGlmICh0eXBlb2YgYiAhPT0gXCJmdW5jdGlvblwiICYmIGIgIT09IG51bGwpXHJcbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkNsYXNzIGV4dGVuZHMgdmFsdWUgXCIgKyBTdHJpbmcoYikgKyBcIiBpcyBub3QgYSBjb25zdHJ1Y3RvciBvciBudWxsXCIpO1xyXG4gICAgZXh0ZW5kU3RhdGljcyhkLCBiKTtcclxuICAgIGZ1bmN0aW9uIF9fKCkgeyB0aGlzLmNvbnN0cnVjdG9yID0gZDsgfVxyXG4gICAgZC5wcm90b3R5cGUgPSBiID09PSBudWxsID8gT2JqZWN0LmNyZWF0ZShiKSA6IChfXy5wcm90b3R5cGUgPSBiLnByb3RvdHlwZSwgbmV3IF9fKCkpO1xyXG59XHJcblxyXG5leHBvcnQgdmFyIF9fYXNzaWduID0gZnVuY3Rpb24oKSB7XHJcbiAgICBfX2Fzc2lnbiA9IE9iamVjdC5hc3NpZ24gfHwgZnVuY3Rpb24gX19hc3NpZ24odCkge1xyXG4gICAgICAgIGZvciAodmFyIHMsIGkgPSAxLCBuID0gYXJndW1lbnRzLmxlbmd0aDsgaSA8IG47IGkrKykge1xyXG4gICAgICAgICAgICBzID0gYXJndW1lbnRzW2ldO1xyXG4gICAgICAgICAgICBmb3IgKHZhciBwIGluIHMpIGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwocywgcCkpIHRbcF0gPSBzW3BdO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gdDtcclxuICAgIH1cclxuICAgIHJldHVybiBfX2Fzc2lnbi5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gX19yZXN0KHMsIGUpIHtcclxuICAgIHZhciB0ID0ge307XHJcbiAgICBmb3IgKHZhciBwIGluIHMpIGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwocywgcCkgJiYgZS5pbmRleE9mKHApIDwgMClcclxuICAgICAgICB0W3BdID0gc1twXTtcclxuICAgIGlmIChzICE9IG51bGwgJiYgdHlwZW9mIE9iamVjdC5nZXRPd25Qcm9wZXJ0eVN5bWJvbHMgPT09IFwiZnVuY3Rpb25cIilcclxuICAgICAgICBmb3IgKHZhciBpID0gMCwgcCA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eVN5bWJvbHMocyk7IGkgPCBwLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIGlmIChlLmluZGV4T2YocFtpXSkgPCAwICYmIE9iamVjdC5wcm90b3R5cGUucHJvcGVydHlJc0VudW1lcmFibGUuY2FsbChzLCBwW2ldKSlcclxuICAgICAgICAgICAgICAgIHRbcFtpXV0gPSBzW3BbaV1dO1xyXG4gICAgICAgIH1cclxuICAgIHJldHVybiB0O1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gX19kZWNvcmF0ZShkZWNvcmF0b3JzLCB0YXJnZXQsIGtleSwgZGVzYykge1xyXG4gICAgdmFyIGMgPSBhcmd1bWVudHMubGVuZ3RoLCByID0gYyA8IDMgPyB0YXJnZXQgOiBkZXNjID09PSBudWxsID8gZGVzYyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IodGFyZ2V0LCBrZXkpIDogZGVzYywgZDtcclxuICAgIGlmICh0eXBlb2YgUmVmbGVjdCA9PT0gXCJvYmplY3RcIiAmJiB0eXBlb2YgUmVmbGVjdC5kZWNvcmF0ZSA9PT0gXCJmdW5jdGlvblwiKSByID0gUmVmbGVjdC5kZWNvcmF0ZShkZWNvcmF0b3JzLCB0YXJnZXQsIGtleSwgZGVzYyk7XHJcbiAgICBlbHNlIGZvciAodmFyIGkgPSBkZWNvcmF0b3JzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSBpZiAoZCA9IGRlY29yYXRvcnNbaV0pIHIgPSAoYyA8IDMgPyBkKHIpIDogYyA+IDMgPyBkKHRhcmdldCwga2V5LCByKSA6IGQodGFyZ2V0LCBrZXkpKSB8fCByO1xyXG4gICAgcmV0dXJuIGMgPiAzICYmIHIgJiYgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRhcmdldCwga2V5LCByKSwgcjtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9fcGFyYW0ocGFyYW1JbmRleCwgZGVjb3JhdG9yKSB7XHJcbiAgICByZXR1cm4gZnVuY3Rpb24gKHRhcmdldCwga2V5KSB7IGRlY29yYXRvcih0YXJnZXQsIGtleSwgcGFyYW1JbmRleCk7IH1cclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9fZXNEZWNvcmF0ZShjdG9yLCBkZXNjcmlwdG9ySW4sIGRlY29yYXRvcnMsIGNvbnRleHRJbiwgaW5pdGlhbGl6ZXJzLCBleHRyYUluaXRpYWxpemVycykge1xyXG4gICAgZnVuY3Rpb24gYWNjZXB0KGYpIHsgaWYgKGYgIT09IHZvaWQgMCAmJiB0eXBlb2YgZiAhPT0gXCJmdW5jdGlvblwiKSB0aHJvdyBuZXcgVHlwZUVycm9yKFwiRnVuY3Rpb24gZXhwZWN0ZWRcIik7IHJldHVybiBmOyB9XHJcbiAgICB2YXIga2luZCA9IGNvbnRleHRJbi5raW5kLCBrZXkgPSBraW5kID09PSBcImdldHRlclwiID8gXCJnZXRcIiA6IGtpbmQgPT09IFwic2V0dGVyXCIgPyBcInNldFwiIDogXCJ2YWx1ZVwiO1xyXG4gICAgdmFyIHRhcmdldCA9ICFkZXNjcmlwdG9ySW4gJiYgY3RvciA/IGNvbnRleHRJbltcInN0YXRpY1wiXSA/IGN0b3IgOiBjdG9yLnByb3RvdHlwZSA6IG51bGw7XHJcbiAgICB2YXIgZGVzY3JpcHRvciA9IGRlc2NyaXB0b3JJbiB8fCAodGFyZ2V0ID8gT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcih0YXJnZXQsIGNvbnRleHRJbi5uYW1lKSA6IHt9KTtcclxuICAgIHZhciBfLCBkb25lID0gZmFsc2U7XHJcbiAgICBmb3IgKHZhciBpID0gZGVjb3JhdG9ycy5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xyXG4gICAgICAgIHZhciBjb250ZXh0ID0ge307XHJcbiAgICAgICAgZm9yICh2YXIgcCBpbiBjb250ZXh0SW4pIGNvbnRleHRbcF0gPSBwID09PSBcImFjY2Vzc1wiID8ge30gOiBjb250ZXh0SW5bcF07XHJcbiAgICAgICAgZm9yICh2YXIgcCBpbiBjb250ZXh0SW4uYWNjZXNzKSBjb250ZXh0LmFjY2Vzc1twXSA9IGNvbnRleHRJbi5hY2Nlc3NbcF07XHJcbiAgICAgICAgY29udGV4dC5hZGRJbml0aWFsaXplciA9IGZ1bmN0aW9uIChmKSB7IGlmIChkb25lKSB0aHJvdyBuZXcgVHlwZUVycm9yKFwiQ2Fubm90IGFkZCBpbml0aWFsaXplcnMgYWZ0ZXIgZGVjb3JhdGlvbiBoYXMgY29tcGxldGVkXCIpOyBleHRyYUluaXRpYWxpemVycy5wdXNoKGFjY2VwdChmIHx8IG51bGwpKTsgfTtcclxuICAgICAgICB2YXIgcmVzdWx0ID0gKDAsIGRlY29yYXRvcnNbaV0pKGtpbmQgPT09IFwiYWNjZXNzb3JcIiA/IHsgZ2V0OiBkZXNjcmlwdG9yLmdldCwgc2V0OiBkZXNjcmlwdG9yLnNldCB9IDogZGVzY3JpcHRvcltrZXldLCBjb250ZXh0KTtcclxuICAgICAgICBpZiAoa2luZCA9PT0gXCJhY2Nlc3NvclwiKSB7XHJcbiAgICAgICAgICAgIGlmIChyZXN1bHQgPT09IHZvaWQgMCkgY29udGludWU7XHJcbiAgICAgICAgICAgIGlmIChyZXN1bHQgPT09IG51bGwgfHwgdHlwZW9mIHJlc3VsdCAhPT0gXCJvYmplY3RcIikgdGhyb3cgbmV3IFR5cGVFcnJvcihcIk9iamVjdCBleHBlY3RlZFwiKTtcclxuICAgICAgICAgICAgaWYgKF8gPSBhY2NlcHQocmVzdWx0LmdldCkpIGRlc2NyaXB0b3IuZ2V0ID0gXztcclxuICAgICAgICAgICAgaWYgKF8gPSBhY2NlcHQocmVzdWx0LnNldCkpIGRlc2NyaXB0b3Iuc2V0ID0gXztcclxuICAgICAgICAgICAgaWYgKF8gPSBhY2NlcHQocmVzdWx0LmluaXQpKSBpbml0aWFsaXplcnMudW5zaGlmdChfKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSBpZiAoXyA9IGFjY2VwdChyZXN1bHQpKSB7XHJcbiAgICAgICAgICAgIGlmIChraW5kID09PSBcImZpZWxkXCIpIGluaXRpYWxpemVycy51bnNoaWZ0KF8pO1xyXG4gICAgICAgICAgICBlbHNlIGRlc2NyaXB0b3Jba2V5XSA9IF87XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgaWYgKHRhcmdldCkgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRhcmdldCwgY29udGV4dEluLm5hbWUsIGRlc2NyaXB0b3IpO1xyXG4gICAgZG9uZSA9IHRydWU7XHJcbn07XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gX19ydW5Jbml0aWFsaXplcnModGhpc0FyZywgaW5pdGlhbGl6ZXJzLCB2YWx1ZSkge1xyXG4gICAgdmFyIHVzZVZhbHVlID0gYXJndW1lbnRzLmxlbmd0aCA+IDI7XHJcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGluaXRpYWxpemVycy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgIHZhbHVlID0gdXNlVmFsdWUgPyBpbml0aWFsaXplcnNbaV0uY2FsbCh0aGlzQXJnLCB2YWx1ZSkgOiBpbml0aWFsaXplcnNbaV0uY2FsbCh0aGlzQXJnKTtcclxuICAgIH1cclxuICAgIHJldHVybiB1c2VWYWx1ZSA/IHZhbHVlIDogdm9pZCAwO1xyXG59O1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9fcHJvcEtleSh4KSB7XHJcbiAgICByZXR1cm4gdHlwZW9mIHggPT09IFwic3ltYm9sXCIgPyB4IDogXCJcIi5jb25jYXQoeCk7XHJcbn07XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gX19zZXRGdW5jdGlvbk5hbWUoZiwgbmFtZSwgcHJlZml4KSB7XHJcbiAgICBpZiAodHlwZW9mIG5hbWUgPT09IFwic3ltYm9sXCIpIG5hbWUgPSBuYW1lLmRlc2NyaXB0aW9uID8gXCJbXCIuY29uY2F0KG5hbWUuZGVzY3JpcHRpb24sIFwiXVwiKSA6IFwiXCI7XHJcbiAgICByZXR1cm4gT2JqZWN0LmRlZmluZVByb3BlcnR5KGYsIFwibmFtZVwiLCB7IGNvbmZpZ3VyYWJsZTogdHJ1ZSwgdmFsdWU6IHByZWZpeCA/IFwiXCIuY29uY2F0KHByZWZpeCwgXCIgXCIsIG5hbWUpIDogbmFtZSB9KTtcclxufTtcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX21ldGFkYXRhKG1ldGFkYXRhS2V5LCBtZXRhZGF0YVZhbHVlKSB7XHJcbiAgICBpZiAodHlwZW9mIFJlZmxlY3QgPT09IFwib2JqZWN0XCIgJiYgdHlwZW9mIFJlZmxlY3QubWV0YWRhdGEgPT09IFwiZnVuY3Rpb25cIikgcmV0dXJuIFJlZmxlY3QubWV0YWRhdGEobWV0YWRhdGFLZXksIG1ldGFkYXRhVmFsdWUpO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gX19hd2FpdGVyKHRoaXNBcmcsIF9hcmd1bWVudHMsIFAsIGdlbmVyYXRvcikge1xyXG4gICAgZnVuY3Rpb24gYWRvcHQodmFsdWUpIHsgcmV0dXJuIHZhbHVlIGluc3RhbmNlb2YgUCA/IHZhbHVlIDogbmV3IFAoZnVuY3Rpb24gKHJlc29sdmUpIHsgcmVzb2x2ZSh2YWx1ZSk7IH0pOyB9XHJcbiAgICByZXR1cm4gbmV3IChQIHx8IChQID0gUHJvbWlzZSkpKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcclxuICAgICAgICBmdW5jdGlvbiBmdWxmaWxsZWQodmFsdWUpIHsgdHJ5IHsgc3RlcChnZW5lcmF0b3IubmV4dCh2YWx1ZSkpOyB9IGNhdGNoIChlKSB7IHJlamVjdChlKTsgfSB9XHJcbiAgICAgICAgZnVuY3Rpb24gcmVqZWN0ZWQodmFsdWUpIHsgdHJ5IHsgc3RlcChnZW5lcmF0b3JbXCJ0aHJvd1wiXSh2YWx1ZSkpOyB9IGNhdGNoIChlKSB7IHJlamVjdChlKTsgfSB9XHJcbiAgICAgICAgZnVuY3Rpb24gc3RlcChyZXN1bHQpIHsgcmVzdWx0LmRvbmUgPyByZXNvbHZlKHJlc3VsdC52YWx1ZSkgOiBhZG9wdChyZXN1bHQudmFsdWUpLnRoZW4oZnVsZmlsbGVkLCByZWplY3RlZCk7IH1cclxuICAgICAgICBzdGVwKChnZW5lcmF0b3IgPSBnZW5lcmF0b3IuYXBwbHkodGhpc0FyZywgX2FyZ3VtZW50cyB8fCBbXSkpLm5leHQoKSk7XHJcbiAgICB9KTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9fZ2VuZXJhdG9yKHRoaXNBcmcsIGJvZHkpIHtcclxuICAgIHZhciBfID0geyBsYWJlbDogMCwgc2VudDogZnVuY3Rpb24oKSB7IGlmICh0WzBdICYgMSkgdGhyb3cgdFsxXTsgcmV0dXJuIHRbMV07IH0sIHRyeXM6IFtdLCBvcHM6IFtdIH0sIGYsIHksIHQsIGcgPSBPYmplY3QuY3JlYXRlKCh0eXBlb2YgSXRlcmF0b3IgPT09IFwiZnVuY3Rpb25cIiA/IEl0ZXJhdG9yIDogT2JqZWN0KS5wcm90b3R5cGUpO1xyXG4gICAgcmV0dXJuIGcubmV4dCA9IHZlcmIoMCksIGdbXCJ0aHJvd1wiXSA9IHZlcmIoMSksIGdbXCJyZXR1cm5cIl0gPSB2ZXJiKDIpLCB0eXBlb2YgU3ltYm9sID09PSBcImZ1bmN0aW9uXCIgJiYgKGdbU3ltYm9sLml0ZXJhdG9yXSA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gdGhpczsgfSksIGc7XHJcbiAgICBmdW5jdGlvbiB2ZXJiKG4pIHsgcmV0dXJuIGZ1bmN0aW9uICh2KSB7IHJldHVybiBzdGVwKFtuLCB2XSk7IH07IH1cclxuICAgIGZ1bmN0aW9uIHN0ZXAob3ApIHtcclxuICAgICAgICBpZiAoZikgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkdlbmVyYXRvciBpcyBhbHJlYWR5IGV4ZWN1dGluZy5cIik7XHJcbiAgICAgICAgd2hpbGUgKGcgJiYgKGcgPSAwLCBvcFswXSAmJiAoXyA9IDApKSwgXykgdHJ5IHtcclxuICAgICAgICAgICAgaWYgKGYgPSAxLCB5ICYmICh0ID0gb3BbMF0gJiAyID8geVtcInJldHVyblwiXSA6IG9wWzBdID8geVtcInRocm93XCJdIHx8ICgodCA9IHlbXCJyZXR1cm5cIl0pICYmIHQuY2FsbCh5KSwgMCkgOiB5Lm5leHQpICYmICEodCA9IHQuY2FsbCh5LCBvcFsxXSkpLmRvbmUpIHJldHVybiB0O1xyXG4gICAgICAgICAgICBpZiAoeSA9IDAsIHQpIG9wID0gW29wWzBdICYgMiwgdC52YWx1ZV07XHJcbiAgICAgICAgICAgIHN3aXRjaCAob3BbMF0pIHtcclxuICAgICAgICAgICAgICAgIGNhc2UgMDogY2FzZSAxOiB0ID0gb3A7IGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgY2FzZSA0OiBfLmxhYmVsKys7IHJldHVybiB7IHZhbHVlOiBvcFsxXSwgZG9uZTogZmFsc2UgfTtcclxuICAgICAgICAgICAgICAgIGNhc2UgNTogXy5sYWJlbCsrOyB5ID0gb3BbMV07IG9wID0gWzBdOyBjb250aW51ZTtcclxuICAgICAgICAgICAgICAgIGNhc2UgNzogb3AgPSBfLm9wcy5wb3AoKTsgXy50cnlzLnBvcCgpOyBjb250aW51ZTtcclxuICAgICAgICAgICAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCEodCA9IF8udHJ5cywgdCA9IHQubGVuZ3RoID4gMCAmJiB0W3QubGVuZ3RoIC0gMV0pICYmIChvcFswXSA9PT0gNiB8fCBvcFswXSA9PT0gMikpIHsgXyA9IDA7IGNvbnRpbnVlOyB9XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKG9wWzBdID09PSAzICYmICghdCB8fCAob3BbMV0gPiB0WzBdICYmIG9wWzFdIDwgdFszXSkpKSB7IF8ubGFiZWwgPSBvcFsxXTsgYnJlYWs7IH1cclxuICAgICAgICAgICAgICAgICAgICBpZiAob3BbMF0gPT09IDYgJiYgXy5sYWJlbCA8IHRbMV0pIHsgXy5sYWJlbCA9IHRbMV07IHQgPSBvcDsgYnJlYWs7IH1cclxuICAgICAgICAgICAgICAgICAgICBpZiAodCAmJiBfLmxhYmVsIDwgdFsyXSkgeyBfLmxhYmVsID0gdFsyXTsgXy5vcHMucHVzaChvcCk7IGJyZWFrOyB9XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRbMl0pIF8ub3BzLnBvcCgpO1xyXG4gICAgICAgICAgICAgICAgICAgIF8udHJ5cy5wb3AoKTsgY29udGludWU7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgb3AgPSBib2R5LmNhbGwodGhpc0FyZywgXyk7XHJcbiAgICAgICAgfSBjYXRjaCAoZSkgeyBvcCA9IFs2LCBlXTsgeSA9IDA7IH0gZmluYWxseSB7IGYgPSB0ID0gMDsgfVxyXG4gICAgICAgIGlmIChvcFswXSAmIDUpIHRocm93IG9wWzFdOyByZXR1cm4geyB2YWx1ZTogb3BbMF0gPyBvcFsxXSA6IHZvaWQgMCwgZG9uZTogdHJ1ZSB9O1xyXG4gICAgfVxyXG59XHJcblxyXG5leHBvcnQgdmFyIF9fY3JlYXRlQmluZGluZyA9IE9iamVjdC5jcmVhdGUgPyAoZnVuY3Rpb24obywgbSwgaywgazIpIHtcclxuICAgIGlmIChrMiA9PT0gdW5kZWZpbmVkKSBrMiA9IGs7XHJcbiAgICB2YXIgZGVzYyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IobSwgayk7XHJcbiAgICBpZiAoIWRlc2MgfHwgKFwiZ2V0XCIgaW4gZGVzYyA/ICFtLl9fZXNNb2R1bGUgOiBkZXNjLndyaXRhYmxlIHx8IGRlc2MuY29uZmlndXJhYmxlKSkge1xyXG4gICAgICAgIGRlc2MgPSB7IGVudW1lcmFibGU6IHRydWUsIGdldDogZnVuY3Rpb24oKSB7IHJldHVybiBtW2tdOyB9IH07XHJcbiAgICB9XHJcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkobywgazIsIGRlc2MpO1xyXG59KSA6IChmdW5jdGlvbihvLCBtLCBrLCBrMikge1xyXG4gICAgaWYgKGsyID09PSB1bmRlZmluZWQpIGsyID0gaztcclxuICAgIG9bazJdID0gbVtrXTtcclxufSk7XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gX19leHBvcnRTdGFyKG0sIG8pIHtcclxuICAgIGZvciAodmFyIHAgaW4gbSkgaWYgKHAgIT09IFwiZGVmYXVsdFwiICYmICFPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwobywgcCkpIF9fY3JlYXRlQmluZGluZyhvLCBtLCBwKTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9fdmFsdWVzKG8pIHtcclxuICAgIHZhciBzID0gdHlwZW9mIFN5bWJvbCA9PT0gXCJmdW5jdGlvblwiICYmIFN5bWJvbC5pdGVyYXRvciwgbSA9IHMgJiYgb1tzXSwgaSA9IDA7XHJcbiAgICBpZiAobSkgcmV0dXJuIG0uY2FsbChvKTtcclxuICAgIGlmIChvICYmIHR5cGVvZiBvLmxlbmd0aCA9PT0gXCJudW1iZXJcIikgcmV0dXJuIHtcclxuICAgICAgICBuZXh0OiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIGlmIChvICYmIGkgPj0gby5sZW5ndGgpIG8gPSB2b2lkIDA7XHJcbiAgICAgICAgICAgIHJldHVybiB7IHZhbHVlOiBvICYmIG9baSsrXSwgZG9uZTogIW8gfTtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcihzID8gXCJPYmplY3QgaXMgbm90IGl0ZXJhYmxlLlwiIDogXCJTeW1ib2wuaXRlcmF0b3IgaXMgbm90IGRlZmluZWQuXCIpO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gX19yZWFkKG8sIG4pIHtcclxuICAgIHZhciBtID0gdHlwZW9mIFN5bWJvbCA9PT0gXCJmdW5jdGlvblwiICYmIG9bU3ltYm9sLml0ZXJhdG9yXTtcclxuICAgIGlmICghbSkgcmV0dXJuIG87XHJcbiAgICB2YXIgaSA9IG0uY2FsbChvKSwgciwgYXIgPSBbXSwgZTtcclxuICAgIHRyeSB7XHJcbiAgICAgICAgd2hpbGUgKChuID09PSB2b2lkIDAgfHwgbi0tID4gMCkgJiYgIShyID0gaS5uZXh0KCkpLmRvbmUpIGFyLnB1c2goci52YWx1ZSk7XHJcbiAgICB9XHJcbiAgICBjYXRjaCAoZXJyb3IpIHsgZSA9IHsgZXJyb3I6IGVycm9yIH07IH1cclxuICAgIGZpbmFsbHkge1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIGlmIChyICYmICFyLmRvbmUgJiYgKG0gPSBpW1wicmV0dXJuXCJdKSkgbS5jYWxsKGkpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBmaW5hbGx5IHsgaWYgKGUpIHRocm93IGUuZXJyb3I7IH1cclxuICAgIH1cclxuICAgIHJldHVybiBhcjtcclxufVxyXG5cclxuLyoqIEBkZXByZWNhdGVkICovXHJcbmV4cG9ydCBmdW5jdGlvbiBfX3NwcmVhZCgpIHtcclxuICAgIGZvciAodmFyIGFyID0gW10sIGkgPSAwOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKVxyXG4gICAgICAgIGFyID0gYXIuY29uY2F0KF9fcmVhZChhcmd1bWVudHNbaV0pKTtcclxuICAgIHJldHVybiBhcjtcclxufVxyXG5cclxuLyoqIEBkZXByZWNhdGVkICovXHJcbmV4cG9ydCBmdW5jdGlvbiBfX3NwcmVhZEFycmF5cygpIHtcclxuICAgIGZvciAodmFyIHMgPSAwLCBpID0gMCwgaWwgPSBhcmd1bWVudHMubGVuZ3RoOyBpIDwgaWw7IGkrKykgcyArPSBhcmd1bWVudHNbaV0ubGVuZ3RoO1xyXG4gICAgZm9yICh2YXIgciA9IEFycmF5KHMpLCBrID0gMCwgaSA9IDA7IGkgPCBpbDsgaSsrKVxyXG4gICAgICAgIGZvciAodmFyIGEgPSBhcmd1bWVudHNbaV0sIGogPSAwLCBqbCA9IGEubGVuZ3RoOyBqIDwgamw7IGorKywgaysrKVxyXG4gICAgICAgICAgICByW2tdID0gYVtqXTtcclxuICAgIHJldHVybiByO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gX19zcHJlYWRBcnJheSh0bywgZnJvbSwgcGFjaykge1xyXG4gICAgaWYgKHBhY2sgfHwgYXJndW1lbnRzLmxlbmd0aCA9PT0gMikgZm9yICh2YXIgaSA9IDAsIGwgPSBmcm9tLmxlbmd0aCwgYXI7IGkgPCBsOyBpKyspIHtcclxuICAgICAgICBpZiAoYXIgfHwgIShpIGluIGZyb20pKSB7XHJcbiAgICAgICAgICAgIGlmICghYXIpIGFyID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoZnJvbSwgMCwgaSk7XHJcbiAgICAgICAgICAgIGFyW2ldID0gZnJvbVtpXTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICByZXR1cm4gdG8uY29uY2F0KGFyIHx8IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGZyb20pKTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9fYXdhaXQodikge1xyXG4gICAgcmV0dXJuIHRoaXMgaW5zdGFuY2VvZiBfX2F3YWl0ID8gKHRoaXMudiA9IHYsIHRoaXMpIDogbmV3IF9fYXdhaXQodik7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX2FzeW5jR2VuZXJhdG9yKHRoaXNBcmcsIF9hcmd1bWVudHMsIGdlbmVyYXRvcikge1xyXG4gICAgaWYgKCFTeW1ib2wuYXN5bmNJdGVyYXRvcikgdGhyb3cgbmV3IFR5cGVFcnJvcihcIlN5bWJvbC5hc3luY0l0ZXJhdG9yIGlzIG5vdCBkZWZpbmVkLlwiKTtcclxuICAgIHZhciBnID0gZ2VuZXJhdG9yLmFwcGx5KHRoaXNBcmcsIF9hcmd1bWVudHMgfHwgW10pLCBpLCBxID0gW107XHJcbiAgICByZXR1cm4gaSA9IE9iamVjdC5jcmVhdGUoKHR5cGVvZiBBc3luY0l0ZXJhdG9yID09PSBcImZ1bmN0aW9uXCIgPyBBc3luY0l0ZXJhdG9yIDogT2JqZWN0KS5wcm90b3R5cGUpLCB2ZXJiKFwibmV4dFwiKSwgdmVyYihcInRocm93XCIpLCB2ZXJiKFwicmV0dXJuXCIsIGF3YWl0UmV0dXJuKSwgaVtTeW1ib2wuYXN5bmNJdGVyYXRvcl0gPSBmdW5jdGlvbiAoKSB7IHJldHVybiB0aGlzOyB9LCBpO1xyXG4gICAgZnVuY3Rpb24gYXdhaXRSZXR1cm4oZikgeyByZXR1cm4gZnVuY3Rpb24gKHYpIHsgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh2KS50aGVuKGYsIHJlamVjdCk7IH07IH1cclxuICAgIGZ1bmN0aW9uIHZlcmIobiwgZikgeyBpZiAoZ1tuXSkgeyBpW25dID0gZnVuY3Rpb24gKHYpIHsgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uIChhLCBiKSB7IHEucHVzaChbbiwgdiwgYSwgYl0pID4gMSB8fCByZXN1bWUobiwgdik7IH0pOyB9OyBpZiAoZikgaVtuXSA9IGYoaVtuXSk7IH0gfVxyXG4gICAgZnVuY3Rpb24gcmVzdW1lKG4sIHYpIHsgdHJ5IHsgc3RlcChnW25dKHYpKTsgfSBjYXRjaCAoZSkgeyBzZXR0bGUocVswXVszXSwgZSk7IH0gfVxyXG4gICAgZnVuY3Rpb24gc3RlcChyKSB7IHIudmFsdWUgaW5zdGFuY2VvZiBfX2F3YWl0ID8gUHJvbWlzZS5yZXNvbHZlKHIudmFsdWUudikudGhlbihmdWxmaWxsLCByZWplY3QpIDogc2V0dGxlKHFbMF1bMl0sIHIpOyB9XHJcbiAgICBmdW5jdGlvbiBmdWxmaWxsKHZhbHVlKSB7IHJlc3VtZShcIm5leHRcIiwgdmFsdWUpOyB9XHJcbiAgICBmdW5jdGlvbiByZWplY3QodmFsdWUpIHsgcmVzdW1lKFwidGhyb3dcIiwgdmFsdWUpOyB9XHJcbiAgICBmdW5jdGlvbiBzZXR0bGUoZiwgdikgeyBpZiAoZih2KSwgcS5zaGlmdCgpLCBxLmxlbmd0aCkgcmVzdW1lKHFbMF1bMF0sIHFbMF1bMV0pOyB9XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX2FzeW5jRGVsZWdhdG9yKG8pIHtcclxuICAgIHZhciBpLCBwO1xyXG4gICAgcmV0dXJuIGkgPSB7fSwgdmVyYihcIm5leHRcIiksIHZlcmIoXCJ0aHJvd1wiLCBmdW5jdGlvbiAoZSkgeyB0aHJvdyBlOyB9KSwgdmVyYihcInJldHVyblwiKSwgaVtTeW1ib2wuaXRlcmF0b3JdID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gdGhpczsgfSwgaTtcclxuICAgIGZ1bmN0aW9uIHZlcmIobiwgZikgeyBpW25dID0gb1tuXSA/IGZ1bmN0aW9uICh2KSB7IHJldHVybiAocCA9ICFwKSA/IHsgdmFsdWU6IF9fYXdhaXQob1tuXSh2KSksIGRvbmU6IGZhbHNlIH0gOiBmID8gZih2KSA6IHY7IH0gOiBmOyB9XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX2FzeW5jVmFsdWVzKG8pIHtcclxuICAgIGlmICghU3ltYm9sLmFzeW5jSXRlcmF0b3IpIHRocm93IG5ldyBUeXBlRXJyb3IoXCJTeW1ib2wuYXN5bmNJdGVyYXRvciBpcyBub3QgZGVmaW5lZC5cIik7XHJcbiAgICB2YXIgbSA9IG9bU3ltYm9sLmFzeW5jSXRlcmF0b3JdLCBpO1xyXG4gICAgcmV0dXJuIG0gPyBtLmNhbGwobykgOiAobyA9IHR5cGVvZiBfX3ZhbHVlcyA9PT0gXCJmdW5jdGlvblwiID8gX192YWx1ZXMobykgOiBvW1N5bWJvbC5pdGVyYXRvcl0oKSwgaSA9IHt9LCB2ZXJiKFwibmV4dFwiKSwgdmVyYihcInRocm93XCIpLCB2ZXJiKFwicmV0dXJuXCIpLCBpW1N5bWJvbC5hc3luY0l0ZXJhdG9yXSA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuIHRoaXM7IH0sIGkpO1xyXG4gICAgZnVuY3Rpb24gdmVyYihuKSB7IGlbbl0gPSBvW25dICYmIGZ1bmN0aW9uICh2KSB7IHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7IHYgPSBvW25dKHYpLCBzZXR0bGUocmVzb2x2ZSwgcmVqZWN0LCB2LmRvbmUsIHYudmFsdWUpOyB9KTsgfTsgfVxyXG4gICAgZnVuY3Rpb24gc2V0dGxlKHJlc29sdmUsIHJlamVjdCwgZCwgdikgeyBQcm9taXNlLnJlc29sdmUodikudGhlbihmdW5jdGlvbih2KSB7IHJlc29sdmUoeyB2YWx1ZTogdiwgZG9uZTogZCB9KTsgfSwgcmVqZWN0KTsgfVxyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gX19tYWtlVGVtcGxhdGVPYmplY3QoY29va2VkLCByYXcpIHtcclxuICAgIGlmIChPYmplY3QuZGVmaW5lUHJvcGVydHkpIHsgT2JqZWN0LmRlZmluZVByb3BlcnR5KGNvb2tlZCwgXCJyYXdcIiwgeyB2YWx1ZTogcmF3IH0pOyB9IGVsc2UgeyBjb29rZWQucmF3ID0gcmF3OyB9XHJcbiAgICByZXR1cm4gY29va2VkO1xyXG59O1xyXG5cclxudmFyIF9fc2V0TW9kdWxlRGVmYXVsdCA9IE9iamVjdC5jcmVhdGUgPyAoZnVuY3Rpb24obywgdikge1xyXG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KG8sIFwiZGVmYXVsdFwiLCB7IGVudW1lcmFibGU6IHRydWUsIHZhbHVlOiB2IH0pO1xyXG59KSA6IGZ1bmN0aW9uKG8sIHYpIHtcclxuICAgIG9bXCJkZWZhdWx0XCJdID0gdjtcclxufTtcclxuXHJcbnZhciBvd25LZXlzID0gZnVuY3Rpb24obykge1xyXG4gICAgb3duS2V5cyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eU5hbWVzIHx8IGZ1bmN0aW9uIChvKSB7XHJcbiAgICAgICAgdmFyIGFyID0gW107XHJcbiAgICAgICAgZm9yICh2YXIgayBpbiBvKSBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG8sIGspKSBhclthci5sZW5ndGhdID0gaztcclxuICAgICAgICByZXR1cm4gYXI7XHJcbiAgICB9O1xyXG4gICAgcmV0dXJuIG93bktleXMobyk7XHJcbn07XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gX19pbXBvcnRTdGFyKG1vZCkge1xyXG4gICAgaWYgKG1vZCAmJiBtb2QuX19lc01vZHVsZSkgcmV0dXJuIG1vZDtcclxuICAgIHZhciByZXN1bHQgPSB7fTtcclxuICAgIGlmIChtb2QgIT0gbnVsbCkgZm9yICh2YXIgayA9IG93bktleXMobW9kKSwgaSA9IDA7IGkgPCBrLmxlbmd0aDsgaSsrKSBpZiAoa1tpXSAhPT0gXCJkZWZhdWx0XCIpIF9fY3JlYXRlQmluZGluZyhyZXN1bHQsIG1vZCwga1tpXSk7XHJcbiAgICBfX3NldE1vZHVsZURlZmF1bHQocmVzdWx0LCBtb2QpO1xyXG4gICAgcmV0dXJuIHJlc3VsdDtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9faW1wb3J0RGVmYXVsdChtb2QpIHtcclxuICAgIHJldHVybiAobW9kICYmIG1vZC5fX2VzTW9kdWxlKSA/IG1vZCA6IHsgZGVmYXVsdDogbW9kIH07XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX2NsYXNzUHJpdmF0ZUZpZWxkR2V0KHJlY2VpdmVyLCBzdGF0ZSwga2luZCwgZikge1xyXG4gICAgaWYgKGtpbmQgPT09IFwiYVwiICYmICFmKSB0aHJvdyBuZXcgVHlwZUVycm9yKFwiUHJpdmF0ZSBhY2Nlc3NvciB3YXMgZGVmaW5lZCB3aXRob3V0IGEgZ2V0dGVyXCIpO1xyXG4gICAgaWYgKHR5cGVvZiBzdGF0ZSA9PT0gXCJmdW5jdGlvblwiID8gcmVjZWl2ZXIgIT09IHN0YXRlIHx8ICFmIDogIXN0YXRlLmhhcyhyZWNlaXZlcikpIHRocm93IG5ldyBUeXBlRXJyb3IoXCJDYW5ub3QgcmVhZCBwcml2YXRlIG1lbWJlciBmcm9tIGFuIG9iamVjdCB3aG9zZSBjbGFzcyBkaWQgbm90IGRlY2xhcmUgaXRcIik7XHJcbiAgICByZXR1cm4ga2luZCA9PT0gXCJtXCIgPyBmIDoga2luZCA9PT0gXCJhXCIgPyBmLmNhbGwocmVjZWl2ZXIpIDogZiA/IGYudmFsdWUgOiBzdGF0ZS5nZXQocmVjZWl2ZXIpO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gX19jbGFzc1ByaXZhdGVGaWVsZFNldChyZWNlaXZlciwgc3RhdGUsIHZhbHVlLCBraW5kLCBmKSB7XHJcbiAgICBpZiAoa2luZCA9PT0gXCJtXCIpIHRocm93IG5ldyBUeXBlRXJyb3IoXCJQcml2YXRlIG1ldGhvZCBpcyBub3Qgd3JpdGFibGVcIik7XHJcbiAgICBpZiAoa2luZCA9PT0gXCJhXCIgJiYgIWYpIHRocm93IG5ldyBUeXBlRXJyb3IoXCJQcml2YXRlIGFjY2Vzc29yIHdhcyBkZWZpbmVkIHdpdGhvdXQgYSBzZXR0ZXJcIik7XHJcbiAgICBpZiAodHlwZW9mIHN0YXRlID09PSBcImZ1bmN0aW9uXCIgPyByZWNlaXZlciAhPT0gc3RhdGUgfHwgIWYgOiAhc3RhdGUuaGFzKHJlY2VpdmVyKSkgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkNhbm5vdCB3cml0ZSBwcml2YXRlIG1lbWJlciB0byBhbiBvYmplY3Qgd2hvc2UgY2xhc3MgZGlkIG5vdCBkZWNsYXJlIGl0XCIpO1xyXG4gICAgcmV0dXJuIChraW5kID09PSBcImFcIiA/IGYuY2FsbChyZWNlaXZlciwgdmFsdWUpIDogZiA/IGYudmFsdWUgPSB2YWx1ZSA6IHN0YXRlLnNldChyZWNlaXZlciwgdmFsdWUpKSwgdmFsdWU7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX2NsYXNzUHJpdmF0ZUZpZWxkSW4oc3RhdGUsIHJlY2VpdmVyKSB7XHJcbiAgICBpZiAocmVjZWl2ZXIgPT09IG51bGwgfHwgKHR5cGVvZiByZWNlaXZlciAhPT0gXCJvYmplY3RcIiAmJiB0eXBlb2YgcmVjZWl2ZXIgIT09IFwiZnVuY3Rpb25cIikpIHRocm93IG5ldyBUeXBlRXJyb3IoXCJDYW5ub3QgdXNlICdpbicgb3BlcmF0b3Igb24gbm9uLW9iamVjdFwiKTtcclxuICAgIHJldHVybiB0eXBlb2Ygc3RhdGUgPT09IFwiZnVuY3Rpb25cIiA/IHJlY2VpdmVyID09PSBzdGF0ZSA6IHN0YXRlLmhhcyhyZWNlaXZlcik7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX2FkZERpc3Bvc2FibGVSZXNvdXJjZShlbnYsIHZhbHVlLCBhc3luYykge1xyXG4gICAgaWYgKHZhbHVlICE9PSBudWxsICYmIHZhbHVlICE9PSB2b2lkIDApIHtcclxuICAgICAgICBpZiAodHlwZW9mIHZhbHVlICE9PSBcIm9iamVjdFwiICYmIHR5cGVvZiB2YWx1ZSAhPT0gXCJmdW5jdGlvblwiKSB0aHJvdyBuZXcgVHlwZUVycm9yKFwiT2JqZWN0IGV4cGVjdGVkLlwiKTtcclxuICAgICAgICB2YXIgZGlzcG9zZSwgaW5uZXI7XHJcbiAgICAgICAgaWYgKGFzeW5jKSB7XHJcbiAgICAgICAgICAgIGlmICghU3ltYm9sLmFzeW5jRGlzcG9zZSkgdGhyb3cgbmV3IFR5cGVFcnJvcihcIlN5bWJvbC5hc3luY0Rpc3Bvc2UgaXMgbm90IGRlZmluZWQuXCIpO1xyXG4gICAgICAgICAgICBkaXNwb3NlID0gdmFsdWVbU3ltYm9sLmFzeW5jRGlzcG9zZV07XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChkaXNwb3NlID09PSB2b2lkIDApIHtcclxuICAgICAgICAgICAgaWYgKCFTeW1ib2wuZGlzcG9zZSkgdGhyb3cgbmV3IFR5cGVFcnJvcihcIlN5bWJvbC5kaXNwb3NlIGlzIG5vdCBkZWZpbmVkLlwiKTtcclxuICAgICAgICAgICAgZGlzcG9zZSA9IHZhbHVlW1N5bWJvbC5kaXNwb3NlXTtcclxuICAgICAgICAgICAgaWYgKGFzeW5jKSBpbm5lciA9IGRpc3Bvc2U7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICh0eXBlb2YgZGlzcG9zZSAhPT0gXCJmdW5jdGlvblwiKSB0aHJvdyBuZXcgVHlwZUVycm9yKFwiT2JqZWN0IG5vdCBkaXNwb3NhYmxlLlwiKTtcclxuICAgICAgICBpZiAoaW5uZXIpIGRpc3Bvc2UgPSBmdW5jdGlvbigpIHsgdHJ5IHsgaW5uZXIuY2FsbCh0aGlzKTsgfSBjYXRjaCAoZSkgeyByZXR1cm4gUHJvbWlzZS5yZWplY3QoZSk7IH0gfTtcclxuICAgICAgICBlbnYuc3RhY2sucHVzaCh7IHZhbHVlOiB2YWx1ZSwgZGlzcG9zZTogZGlzcG9zZSwgYXN5bmM6IGFzeW5jIH0pO1xyXG4gICAgfVxyXG4gICAgZWxzZSBpZiAoYXN5bmMpIHtcclxuICAgICAgICBlbnYuc3RhY2sucHVzaCh7IGFzeW5jOiB0cnVlIH0pO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHZhbHVlO1xyXG5cclxufVxyXG5cclxudmFyIF9TdXBwcmVzc2VkRXJyb3IgPSB0eXBlb2YgU3VwcHJlc3NlZEVycm9yID09PSBcImZ1bmN0aW9uXCIgPyBTdXBwcmVzc2VkRXJyb3IgOiBmdW5jdGlvbiAoZXJyb3IsIHN1cHByZXNzZWQsIG1lc3NhZ2UpIHtcclxuICAgIHZhciBlID0gbmV3IEVycm9yKG1lc3NhZ2UpO1xyXG4gICAgcmV0dXJuIGUubmFtZSA9IFwiU3VwcHJlc3NlZEVycm9yXCIsIGUuZXJyb3IgPSBlcnJvciwgZS5zdXBwcmVzc2VkID0gc3VwcHJlc3NlZCwgZTtcclxufTtcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX2Rpc3Bvc2VSZXNvdXJjZXMoZW52KSB7XHJcbiAgICBmdW5jdGlvbiBmYWlsKGUpIHtcclxuICAgICAgICBlbnYuZXJyb3IgPSBlbnYuaGFzRXJyb3IgPyBuZXcgX1N1cHByZXNzZWRFcnJvcihlLCBlbnYuZXJyb3IsIFwiQW4gZXJyb3Igd2FzIHN1cHByZXNzZWQgZHVyaW5nIGRpc3Bvc2FsLlwiKSA6IGU7XHJcbiAgICAgICAgZW52Lmhhc0Vycm9yID0gdHJ1ZTtcclxuICAgIH1cclxuICAgIHZhciByLCBzID0gMDtcclxuICAgIGZ1bmN0aW9uIG5leHQoKSB7XHJcbiAgICAgICAgd2hpbGUgKHIgPSBlbnYuc3RhY2sucG9wKCkpIHtcclxuICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICAgIGlmICghci5hc3luYyAmJiBzID09PSAxKSByZXR1cm4gcyA9IDAsIGVudi5zdGFjay5wdXNoKHIpLCBQcm9taXNlLnJlc29sdmUoKS50aGVuKG5leHQpO1xyXG4gICAgICAgICAgICAgICAgaWYgKHIuZGlzcG9zZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciByZXN1bHQgPSByLmRpc3Bvc2UuY2FsbChyLnZhbHVlKTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoci5hc3luYykgcmV0dXJuIHMgfD0gMiwgUHJvbWlzZS5yZXNvbHZlKHJlc3VsdCkudGhlbihuZXh0LCBmdW5jdGlvbihlKSB7IGZhaWwoZSk7IHJldHVybiBuZXh0KCk7IH0pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgZWxzZSBzIHw9IDE7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgY2F0Y2ggKGUpIHtcclxuICAgICAgICAgICAgICAgIGZhaWwoZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKHMgPT09IDEpIHJldHVybiBlbnYuaGFzRXJyb3IgPyBQcm9taXNlLnJlamVjdChlbnYuZXJyb3IpIDogUHJvbWlzZS5yZXNvbHZlKCk7XHJcbiAgICAgICAgaWYgKGVudi5oYXNFcnJvcikgdGhyb3cgZW52LmVycm9yO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIG5leHQoKTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9fcmV3cml0ZVJlbGF0aXZlSW1wb3J0RXh0ZW5zaW9uKHBhdGgsIHByZXNlcnZlSnN4KSB7XHJcbiAgICBpZiAodHlwZW9mIHBhdGggPT09IFwic3RyaW5nXCIgJiYgL15cXC5cXC4/XFwvLy50ZXN0KHBhdGgpKSB7XHJcbiAgICAgICAgcmV0dXJuIHBhdGgucmVwbGFjZSgvXFwuKHRzeCkkfCgoPzpcXC5kKT8pKCg/OlxcLlteLi9dKz8pPylcXC4oW2NtXT8pdHMkL2ksIGZ1bmN0aW9uIChtLCB0c3gsIGQsIGV4dCwgY20pIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRzeCA/IHByZXNlcnZlSnN4ID8gXCIuanN4XCIgOiBcIi5qc1wiIDogZCAmJiAoIWV4dCB8fCAhY20pID8gbSA6IChkICsgZXh0ICsgXCIuXCIgKyBjbS50b0xvd2VyQ2FzZSgpICsgXCJqc1wiKTtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuICAgIHJldHVybiBwYXRoO1xyXG59XHJcblxyXG5leHBvcnQgZGVmYXVsdCB7XHJcbiAgICBfX2V4dGVuZHM6IF9fZXh0ZW5kcyxcclxuICAgIF9fYXNzaWduOiBfX2Fzc2lnbixcclxuICAgIF9fcmVzdDogX19yZXN0LFxyXG4gICAgX19kZWNvcmF0ZTogX19kZWNvcmF0ZSxcclxuICAgIF9fcGFyYW06IF9fcGFyYW0sXHJcbiAgICBfX2VzRGVjb3JhdGU6IF9fZXNEZWNvcmF0ZSxcclxuICAgIF9fcnVuSW5pdGlhbGl6ZXJzOiBfX3J1bkluaXRpYWxpemVycyxcclxuICAgIF9fcHJvcEtleTogX19wcm9wS2V5LFxyXG4gICAgX19zZXRGdW5jdGlvbk5hbWU6IF9fc2V0RnVuY3Rpb25OYW1lLFxyXG4gICAgX19tZXRhZGF0YTogX19tZXRhZGF0YSxcclxuICAgIF9fYXdhaXRlcjogX19hd2FpdGVyLFxyXG4gICAgX19nZW5lcmF0b3I6IF9fZ2VuZXJhdG9yLFxyXG4gICAgX19jcmVhdGVCaW5kaW5nOiBfX2NyZWF0ZUJpbmRpbmcsXHJcbiAgICBfX2V4cG9ydFN0YXI6IF9fZXhwb3J0U3RhcixcclxuICAgIF9fdmFsdWVzOiBfX3ZhbHVlcyxcclxuICAgIF9fcmVhZDogX19yZWFkLFxyXG4gICAgX19zcHJlYWQ6IF9fc3ByZWFkLFxyXG4gICAgX19zcHJlYWRBcnJheXM6IF9fc3ByZWFkQXJyYXlzLFxyXG4gICAgX19zcHJlYWRBcnJheTogX19zcHJlYWRBcnJheSxcclxuICAgIF9fYXdhaXQ6IF9fYXdhaXQsXHJcbiAgICBfX2FzeW5jR2VuZXJhdG9yOiBfX2FzeW5jR2VuZXJhdG9yLFxyXG4gICAgX19hc3luY0RlbGVnYXRvcjogX19hc3luY0RlbGVnYXRvcixcclxuICAgIF9fYXN5bmNWYWx1ZXM6IF9fYXN5bmNWYWx1ZXMsXHJcbiAgICBfX21ha2VUZW1wbGF0ZU9iamVjdDogX19tYWtlVGVtcGxhdGVPYmplY3QsXHJcbiAgICBfX2ltcG9ydFN0YXI6IF9faW1wb3J0U3RhcixcclxuICAgIF9faW1wb3J0RGVmYXVsdDogX19pbXBvcnREZWZhdWx0LFxyXG4gICAgX19jbGFzc1ByaXZhdGVGaWVsZEdldDogX19jbGFzc1ByaXZhdGVGaWVsZEdldCxcclxuICAgIF9fY2xhc3NQcml2YXRlRmllbGRTZXQ6IF9fY2xhc3NQcml2YXRlRmllbGRTZXQsXHJcbiAgICBfX2NsYXNzUHJpdmF0ZUZpZWxkSW46IF9fY2xhc3NQcml2YXRlRmllbGRJbixcclxuICAgIF9fYWRkRGlzcG9zYWJsZVJlc291cmNlOiBfX2FkZERpc3Bvc2FibGVSZXNvdXJjZSxcclxuICAgIF9fZGlzcG9zZVJlc291cmNlczogX19kaXNwb3NlUmVzb3VyY2VzLFxyXG4gICAgX19yZXdyaXRlUmVsYXRpdmVJbXBvcnRFeHRlbnNpb246IF9fcmV3cml0ZVJlbGF0aXZlSW1wb3J0RXh0ZW5zaW9uLFxyXG59O1xyXG4iLCJpbXBvcnQgeyBcbiAgICBBcHAsXG4gICAgSXRlbVZpZXcsXG4gICAgTWFya2Rvd25WaWV3LFxuICAgIE5vdGljZSxcbiAgICBQbHVnaW4sXG4gICAgUGx1Z2luU2V0dGluZ1RhYixcbiAgICByZXF1ZXN0VXJsLFxuICAgIFNldHRpbmcsXG4gICAgU3VnZ2VzdE1vZGFsLFxuICAgIFRGaWxlLFxuICAgIFdvcmtzcGFjZUxlYWYsXG59IGZyb20gXCJvYnNpZGlhblwiO1xuXG5pbnRlcmZhY2UgU2VhcmNoUmVzdWx0XG57XG4gICAgY29sbGVjdGlvbjogc3RyaW5nO1xuICAgIGZpbGU6IHN0cmluZztcbiAgICBpbmRleDogbnVtYmVyO1xuICAgIGxpbmU6IG51bWJlcjtcbiAgICB0aXRsZTogc3RyaW5nO1xufVxuXG5pbnRlcmZhY2UgRmluZG5vdGVTZXR0aW5nc1xue1xuICAgIHNlcnZlclVybDogc3RyaW5nO1xuICAgIGNvbGxlY3Rpb25zOiBzdHJpbmdbXTtcbn1cblxuY29uc3QgREVGQVVMVF9TRVRUSU5HUzogRmluZG5vdGVTZXR0aW5ncyA9XG57XG4gICAgc2VydmVyVXJsOiBcImh0dHA6Ly8xMjcuMC4wLjE6ODAwMFwiLFxuICAgIGNvbGxlY3Rpb25zOiBbXSxcbn07XG5cbmNsYXNzIEZpbmRub3RlU2VhcmNoTW9kYWwgZXh0ZW5kcyBTdWdnZXN0TW9kYWw8U2VhcmNoUmVzdWx0Plxue1xuICAgIHByaXZhdGUgc2VhcmNoVGltZXI6IFJldHVyblR5cGU8dHlwZW9mIHNldFRpbWVvdXQ+IHwgbnVsbCA9IG51bGw7XG5cbiAgICBjb25zdHJ1Y3RvcihcbiAgICAgICAgYXBwOiBBcHAsXG4gICAgICAgIHByaXZhdGUgcGx1Z2luOiBGaW5kbm90ZVBsdWdpbilcbiAgICB7XG4gICAgICAgIHN1cGVyKGFwcCk7XG4gICAgfVxuXG4gICAgb25PcGVuKClcbiAgICB7XG4gICAgICAgIHN1cGVyLm9uT3BlbigpO1xuICAgICAgICB0aGlzLnNldFBsYWNlaG9sZGVyKFwiU2VhcmNoIHlvdXIgbm90ZXMuLi5cIik7XG4gICAgfVxuXG4gICAgYXN5bmMgZ2V0U3VnZ2VzdGlvbnMocXVlcnk6IHN0cmluZyk6IFByb21pc2U8U2VhcmNoUmVzdWx0W10+XG4gICAge1xuICAgICAgICBpZiAoIXF1ZXJ5LnRyaW0oKSlcbiAgICAgICAge1xuICAgICAgICAgICAgcmV0dXJuIFtdO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRoaXMuc2VhcmNoVGltZXIgIT09IG51bGwpXG4gICAgICAgIHtcbiAgICAgICAgICAgIGNsZWFyVGltZW91dCh0aGlzLnNlYXJjaFRpbWVyKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT5cbiAgICAgICAge1xuICAgICAgICAgICAgdGhpcy5zZWFyY2hUaW1lciA9IHNldFRpbWVvdXQoYXN5bmMgKCkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IHJlc3VsdHMgPSBhd2FpdCB0aGlzLnBsdWdpbi5zZWFyY2hOb3RlcyhxdWVyeSk7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZShyZXN1bHRzKTtcbiAgICAgICAgICAgIH0sIDI1MCk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHJlbmRlclN1Z2dlc3Rpb24ocmVzdWx0OiBTZWFyY2hSZXN1bHQsIGVsOiBIVE1MRWxlbWVudClcbiAgICB7XG4gICAgICAgIGVsLmNyZWF0ZUVsKFwiZGl2XCIsXG4gICAgICAgIHtcbiAgICAgICAgICAgIHRleHQ6IHRoaXMucGx1Z2luLnRydW5jYXRlVGl0bGUocmVzdWx0LnRpdGxlKSxcbiAgICAgICAgfSk7XG5cbiAgICAgICAgZWwuY3JlYXRlRWwoXCJzbWFsbFwiLFxuICAgICAgICB7XG4gICAgICAgICAgICB0ZXh0OiBgJHtyZXN1bHQuY29sbGVjdGlvbn0vJHtyZXN1bHQuZmlsZX1gLFxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBhc3luYyBvbkNob29zZVN1Z2dlc3Rpb24ocmVzdWx0OiBTZWFyY2hSZXN1bHQpXG4gICAge1xuICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi5vcGVuUmVzdWx0KHJlc3VsdCk7XG4gICAgfVxufVxuXG5jb25zdCBWSUVXX1RZUEVfRklORE5PVEUgPSBcImZpbmRub3RlLXNlYXJjaFwiO1xuXG5jbGFzcyBGaW5kbm90ZVNlYXJjaFZpZXcgZXh0ZW5kcyBJdGVtVmlld1xue1xuICAgIHByaXZhdGUgc2VhcmNoVGltZXI6IFJldHVyblR5cGU8dHlwZW9mIHNldFRpbWVvdXQ+IHwgbnVsbCA9IG51bGw7XG4gICAgcHJpdmF0ZSBzZWFyY2hSZXF1ZXN0SWQgPSAwO1xuXG4gICAgY29uc3RydWN0b3IoXG4gICAgICAgIGxlYWY6IFdvcmtzcGFjZUxlYWYsXG4gICAgICAgIHByaXZhdGUgcGx1Z2luOiBGaW5kbm90ZVBsdWdpbilcbiAgICB7XG4gICAgICAgIHN1cGVyKGxlYWYpO1xuICAgIH1cblxuICAgIGdldFZpZXdUeXBlKCk6IHN0cmluZ1xuICAgIHtcbiAgICAgICAgcmV0dXJuIFZJRVdfVFlQRV9GSU5ETk9URTtcbiAgICB9XG5cbiAgICBnZXREaXNwbGF5VGV4dCgpOiBzdHJpbmdcbiAgICB7XG4gICAgICAgIHJldHVybiBcIkZpbmRub3RlXCI7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBzaG93RW1wdHlTdGF0ZShzdGF0dXNFbDogSFRNTEVsZW1lbnQpOiB2b2lkXG4gICAge1xuICAgICAgICBzdGF0dXNFbC5lbXB0eSgpO1xuXG4gICAgICAgIGNvbnN0IG1lc3NhZ2VFbCA9IHN0YXR1c0VsLmNyZWF0ZURpdihcbiAgICAgICAge1xuICAgICAgICAgICAgdGV4dDogXCJTZWFyY2ggeW91ciBub3Rlc1wiLFxuICAgICAgICAgICAgY2xzOiBcImZpbmRub3RlLWVtcHR5XCIsXG4gICAgICAgIH0pO1xuXG4gICAgICAgIG1lc3NhZ2VFbC5zdHlsZS5tYXJnaW5Ub3AgPSBcIjEycHhcIjtcbiAgICAgICAgbWVzc2FnZUVsLnN0eWxlLmZvbnRTaXplID0gXCIwLjllbVwiO1xuICAgIH1cblxuICAgIHByaXZhdGUgc2hvd1NlYXJjaGluZ1N0YXRlKHN0YXR1c0VsOiBIVE1MRWxlbWVudCk6IHZvaWRcbiAgICB7XG4gICAgICAgIHN0YXR1c0VsLmVtcHR5KCk7XG5cbiAgICAgICAgY29uc3QgbWVzc2FnZUVsID0gc3RhdHVzRWwuY3JlYXRlRGl2KFxuICAgICAgICB7XG4gICAgICAgICAgICB0ZXh0OiBcIlNlYXJjaGluZ+KAplwiLFxuICAgICAgICAgICAgY2xzOiBcImZpbmRub3RlLWVtcHR5XCIsXG4gICAgICAgIH0pO1xuXG4gICAgICAgIG1lc3NhZ2VFbC5zdHlsZS5tYXJnaW5Ub3AgPSBcIjEycHhcIjtcbiAgICAgICAgbWVzc2FnZUVsLnN0eWxlLmZvbnRTaXplID0gXCIwLjllbVwiO1xuICAgIH1cblxuICAgIHByaXZhdGUgc2hvd05vUmVzdWx0c1N0YXRlKHN0YXR1c0VsOiBIVE1MRWxlbWVudCk6IHZvaWRcbiAgICB7XG4gICAgICAgIHN0YXR1c0VsLmVtcHR5KCk7XG5cbiAgICAgICAgY29uc3QgbWVzc2FnZUVsID0gc3RhdHVzRWwuY3JlYXRlRGl2KFxuICAgICAgICB7XG4gICAgICAgICAgICB0ZXh0OiBcIk5vIG5vdGVzIGZvdW5kXCIsXG4gICAgICAgICAgICBjbHM6IFwiZmluZG5vdGUtZW1wdHlcIixcbiAgICAgICAgfSk7XG5cbiAgICAgICAgbWVzc2FnZUVsLnN0eWxlLm1hcmdpblRvcCA9IFwiMTJweFwiO1xuICAgICAgICBtZXNzYWdlRWwuc3R5bGUuZm9udFNpemUgPSBcIjAuOWVtXCI7XG4gICAgfVxuXG4gICAgYXN5bmMgb25PcGVuKCk6IFByb21pc2U8dm9pZD5cbiAgICB7XG4gICAgICAgIHRoaXMuY29udGVudEVsLmVtcHR5KCk7XG5cbiAgICAgICAgdGhpcy5jb250ZW50RWwuY3JlYXRlRWwoXCJoMlwiLFxuICAgICAgICB7XG4gICAgICAgICAgICB0ZXh0OiBcIkZpbmRub3RlXCIsXG4gICAgICAgIH0pO1xuXG4gICAgICAgIGNvbnN0IHNlYXJjaENvbnRhaW5lciA9IHRoaXMuY29udGVudEVsLmNyZWF0ZURpdigpO1xuXG4gICAgICAgIHNlYXJjaENvbnRhaW5lci5zdHlsZS5wb3NpdGlvbiA9IFwicmVsYXRpdmVcIjtcblxuICAgICAgICBjb25zdCBpbnB1dCA9IHNlYXJjaENvbnRhaW5lci5jcmVhdGVFbChcImlucHV0XCIsXG4gICAgICAgIHtcbiAgICAgICAgICAgIHR5cGU6IFwidGV4dFwiLFxuICAgICAgICAgICAgcGxhY2Vob2xkZXI6IFwiU2VhcmNoIG5vdGVzLi4uXCIsXG4gICAgICAgIH0pO1xuXG4gICAgICAgIGlucHV0LnN0eWxlLndpZHRoID0gXCIxMDAlXCI7XG4gICAgICAgIGlucHV0LnN0eWxlLnBhZGRpbmdSaWdodCA9IFwiMzBweFwiO1xuXG4gICAgICAgIGNvbnN0IG9wdGlvbnNEZXRhaWxzID0gdGhpcy5jb250ZW50RWwuY3JlYXRlRWwoXCJkZXRhaWxzXCIsXG4gICAgICAgIHtcbiAgICAgICAgICAgIGNsczogXCJmaW5kbm90ZS1vcHRpb25zXCIsXG4gICAgICAgIH0pO1xuXG4gICAgICAgIGNvbnN0IG9wdGlvbnNTdW1tYXJ5ID0gb3B0aW9uc0RldGFpbHMuY3JlYXRlRWwoXCJzdW1tYXJ5XCIsXG4gICAgICAgIHtcbiAgICAgICAgICAgIHRleHQ6IFwiU2VhcmNoIG9wdGlvbnNcIixcbiAgICAgICAgfSk7XG5cbiAgICAgICAgY29uc3QgbWF0Y2hDYXNlUm93ID0gb3B0aW9uc0RldGFpbHMuY3JlYXRlRGl2KHtcbiAgICAgICAgICAgIGNsczogXCJmaW5kbm90ZS1vcHRpb25cIixcbiAgICAgICAgfSk7XG5cbiAgICAgICAgbWF0Y2hDYXNlUm93LmNyZWF0ZVNwYW4oe1xuICAgICAgICAgICAgdGV4dDogXCJNYXRjaCBjYXNlXCIsXG4gICAgICAgIH0pO1xuXG4gICAgICAgIGNvbnN0IG1hdGNoQ2FzZVRvZ2dsZSA9IG1hdGNoQ2FzZVJvdy5jcmVhdGVFbChcImlucHV0XCIsIHtcbiAgICAgICAgICAgIHR5cGU6IFwiY2hlY2tib3hcIixcbiAgICAgICAgfSk7XG5cbiAgICAgICAgbWF0Y2hDYXNlVG9nZ2xlLmFkZENsYXNzKFwiZmluZG5vdGUtdG9nZ2xlLWlucHV0XCIpO1xuXG4gICAgICAgIGNvbnN0IG1hdGNoQ2FzZVN3aXRjaCA9IG1hdGNoQ2FzZVJvdy5jcmVhdGVTcGFuKHtcbiAgICAgICAgICAgIGNsczogXCJmaW5kbm90ZS10b2dnbGVcIixcbiAgICAgICAgfSk7XG5cbiAgICAgICAgbWF0Y2hDYXNlU3dpdGNoLmFwcGVuZENoaWxkKG1hdGNoQ2FzZVRvZ2dsZSk7XG4gICAgICAgIG1hdGNoQ2FzZVN3aXRjaC5jcmVhdGVTcGFuKHtcbiAgICAgICAgICAgIGNsczogXCJmaW5kbm90ZS10b2dnbGUtc2xpZGVyXCIsXG4gICAgICAgIH0pO1xuXG4gICAgICAgIG1hdGNoQ2FzZVN3aXRjaC5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4ge1xuICAgICAgICAgICAgbWF0Y2hDYXNlVG9nZ2xlLmNoZWNrZWQgPSAhbWF0Y2hDYXNlVG9nZ2xlLmNoZWNrZWQ7XG4gICAgICAgICAgICB1cGRhdGVPcHRpb25JbmRpY2F0b3JzKCk7XG4gICAgICAgICAgICBpbnB1dC5kaXNwYXRjaEV2ZW50KG5ldyBFdmVudChcImlucHV0XCIpKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgY29uc3Qgd2hvbGVXb3JkUm93ID0gb3B0aW9uc0RldGFpbHMuY3JlYXRlRGl2KHtcbiAgICAgICAgICAgIGNsczogXCJmaW5kbm90ZS1vcHRpb25cIixcbiAgICAgICAgfSk7XG5cbiAgICAgICAgd2hvbGVXb3JkUm93LmNyZWF0ZVNwYW4oe1xuICAgICAgICAgICAgdGV4dDogXCJXaG9sZSB3b3JkXCIsXG4gICAgICAgIH0pO1xuXG4gICAgICAgIGNvbnN0IHdob2xlV29yZFRvZ2dsZSA9IHdob2xlV29yZFJvdy5jcmVhdGVFbChcImlucHV0XCIsIHtcbiAgICAgICAgICAgIHR5cGU6IFwiY2hlY2tib3hcIixcbiAgICAgICAgfSk7XG5cbiAgICAgICAgd2hvbGVXb3JkVG9nZ2xlLmFkZENsYXNzKFwiZmluZG5vdGUtdG9nZ2xlLWlucHV0XCIpO1xuXG4gICAgICAgIGNvbnN0IHdob2xlV29yZFN3aXRjaCA9IHdob2xlV29yZFJvdy5jcmVhdGVTcGFuKHtcbiAgICAgICAgICAgIGNsczogXCJmaW5kbm90ZS10b2dnbGVcIixcbiAgICAgICAgfSk7XG5cbiAgICAgICAgd2hvbGVXb3JkU3dpdGNoLmFwcGVuZENoaWxkKHdob2xlV29yZFRvZ2dsZSk7XG4gICAgICAgIHdob2xlV29yZFN3aXRjaC5jcmVhdGVTcGFuKHtcbiAgICAgICAgICAgIGNsczogXCJmaW5kbm90ZS10b2dnbGUtc2xpZGVyXCIsXG4gICAgICAgIH0pO1xuXG4gICAgICAgIHdob2xlV29yZFN3aXRjaC5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4ge1xuICAgICAgICAgICAgd2hvbGVXb3JkVG9nZ2xlLmNoZWNrZWQgPSAhd2hvbGVXb3JkVG9nZ2xlLmNoZWNrZWQ7XG4gICAgICAgICAgICB1cGRhdGVPcHRpb25JbmRpY2F0b3JzKCk7XG4gICAgICAgICAgICBpbnB1dC5kaXNwYXRjaEV2ZW50KG5ldyBFdmVudChcImlucHV0XCIpKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgY29uc3QgdXBkYXRlT3B0aW9uSW5kaWNhdG9ycyA9ICgpID0+XG4gICAgICAgIHtcbiAgICAgICAgICAgIG9wdGlvbnNTdW1tYXJ5LmVtcHR5KCk7XG5cbiAgICAgICAgICAgIG9wdGlvbnNTdW1tYXJ5LmFwcGVuZFRleHQoXCJTZWFyY2ggb3B0aW9uc1wiKTtcblxuICAgICAgICAgICAgaWYgKG1hdGNoQ2FzZVRvZ2dsZS5jaGVja2VkKVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIG9wdGlvbnNTdW1tYXJ5LmNyZWF0ZVNwYW4oXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICB0ZXh0OiBcIkNhc2VcIixcbiAgICAgICAgICAgICAgICAgICAgY2xzOiBcImZpbmRub3RlLW9wdGlvbi1pbmRpY2F0b3JcIixcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHdob2xlV29yZFRvZ2dsZS5jaGVja2VkKVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIG9wdGlvbnNTdW1tYXJ5LmNyZWF0ZVNwYW4oXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICB0ZXh0OiBcIldvcmRcIixcbiAgICAgICAgICAgICAgICAgICAgY2xzOiBcImZpbmRub3RlLW9wdGlvbi1pbmRpY2F0b3JcIixcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICBjb25zdCBjbGVhckJ1dHRvbiA9IHNlYXJjaENvbnRhaW5lci5jcmVhdGVFbChcImJ1dHRvblwiLFxuICAgICAgICB7XG4gICAgICAgICAgICB0ZXh0OiBcIsOXXCIsXG4gICAgICAgIH0pO1xuXG4gICAgICAgIGNsZWFyQnV0dG9uLnN0eWxlLnBvc2l0aW9uID0gXCJhYnNvbHV0ZVwiO1xuICAgICAgICBjbGVhckJ1dHRvbi5zdHlsZS5yaWdodCA9IFwiNHB4XCI7XG4gICAgICAgIGNsZWFyQnV0dG9uLnN0eWxlLnRvcCA9IFwiNTAlXCI7XG4gICAgICAgIGNsZWFyQnV0dG9uLnN0eWxlLnRyYW5zZm9ybSA9IFwidHJhbnNsYXRlWSgtNTAlKVwiO1xuICAgICAgICBjbGVhckJ1dHRvbi5zdHlsZS5kaXNwbGF5ID0gXCJub25lXCI7XG4gICAgICAgIGNsZWFyQnV0dG9uLnN0eWxlLmhlaWdodCA9IFwiMTAwJVwiO1xuICAgICAgICBjbGVhckJ1dHRvbi5zdHlsZS5tYXJnaW4gPSBcIjBcIjtcbiAgICAgICAgY2xlYXJCdXR0b24uc3R5bGUubWluSGVpZ2h0ID0gXCIwXCI7XG4gICAgICAgIGNsZWFyQnV0dG9uLnN0eWxlLm1pbldpZHRoID0gXCIwXCI7XG4gICAgICAgIGNsZWFyQnV0dG9uLnN0eWxlLnBhZGRpbmcgPSBcIjAgNnB4XCI7XG4gICAgICAgIGNsZWFyQnV0dG9uLnN0eWxlLmJvcmRlciA9IFwibm9uZVwiO1xuICAgICAgICBjbGVhckJ1dHRvbi5zdHlsZS5iYWNrZ3JvdW5kID0gXCJ0cmFuc3BhcmVudFwiO1xuICAgICAgICBjbGVhckJ1dHRvbi5zdHlsZS5ib3hTaGFkb3cgPSBcIm5vbmVcIjtcbiAgICAgICAgY2xlYXJCdXR0b24uc3R5bGUuZm9udFNpemUgPSBcIjE4cHhcIjtcbiAgICAgICAgY2xlYXJCdXR0b24uc3R5bGUuY3Vyc29yID0gXCJwb2ludGVyXCI7XG5cbiAgICAgICAgY29uc3Qgc3RhdHVzRWwgPSB0aGlzLmNvbnRlbnRFbC5jcmVhdGVEaXYoKTtcblxuICAgICAgICBjb25zdCByZXN1bHRzRWwgPSB0aGlzLmNvbnRlbnRFbC5jcmVhdGVEaXYoKTtcblxuICAgICAgICByZXN1bHRzRWwuc3R5bGUubWFyZ2luVG9wID0gXCIxMnB4XCI7XG5cbiAgICAgICAgdGhpcy5zaG93RW1wdHlTdGF0ZShzdGF0dXNFbCk7XG5cbiAgICAgICAgaW5wdXQuYWRkRXZlbnRMaXN0ZW5lcihcImlucHV0XCIsICgpID0+XG4gICAgICAgIHtcbiAgICAgICAgICAgIGNsZWFyQnV0dG9uLnN0eWxlLmRpc3BsYXkgPSBpbnB1dC52YWx1ZSA/IFwiYmxvY2tcIiA6IFwibm9uZVwiO1xuXG4gICAgICAgICAgICBpZiAodGhpcy5zZWFyY2hUaW1lciAhPT0gbnVsbClcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBjbGVhclRpbWVvdXQodGhpcy5zZWFyY2hUaW1lcik7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICghaW5wdXQudmFsdWUudHJpbSgpKVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHRoaXMuc2VhcmNoUmVxdWVzdElkKys7XG4gICAgICAgICAgICAgICAgcmVzdWx0c0VsLmVtcHR5KCk7XG4gICAgICAgICAgICAgICAgdGhpcy5zaG93RW1wdHlTdGF0ZShzdGF0dXNFbCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0aGlzLnNob3dTZWFyY2hpbmdTdGF0ZShzdGF0dXNFbCk7XG4gICAgICAgICAgICByZXN1bHRzRWwuZW1wdHkoKTtcblxuICAgICAgICAgICAgdGhpcy5zZWFyY2hUaW1lciA9IHNldFRpbWVvdXQoYXN5bmMgKCkgPT5cbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICB0aGlzLnNlYXJjaFRpbWVyID0gbnVsbDtcblxuICAgICAgICAgICAgICAgIGNvbnN0IHJlcXVlc3RJZCA9ICsrdGhpcy5zZWFyY2hSZXF1ZXN0SWQ7XG5cbiAgICAgICAgICAgICAgICB0cnlcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHJlc3VsdHMgPSBhd2FpdCB0aGlzLnBsdWdpbi5zZWFyY2hOb3RlcyhcbiAgICAgICAgICAgICAgICAgICAgICAgIGlucHV0LnZhbHVlLFxuICAgICAgICAgICAgICAgICAgICAgICAgbWF0Y2hDYXNlVG9nZ2xlLmNoZWNrZWQsXG4gICAgICAgICAgICAgICAgICAgICAgICB3aG9sZVdvcmRUb2dnbGUuY2hlY2tlZFxuICAgICAgICAgICAgICAgICAgICApO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmIChyZXF1ZXN0SWQgIT09IHRoaXMuc2VhcmNoUmVxdWVzdElkKVxuICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBpZiAocmVzdWx0cy5sZW5ndGggPT09IDApXG4gICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLnBsdWdpbi5zZXR0aW5ncy5jb2xsZWN0aW9ucy5sZW5ndGggPT09IDApXG4gICAgICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5zaG93Tm9Db2xsZWN0aW9uc1N0YXRlKHN0YXR1c0VsKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnNob3dOb1Jlc3VsdHNTdGF0ZShzdGF0dXNFbCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIHN0YXR1c0VsLmVtcHR5KCk7XG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdHNFbC5lbXB0eSgpO1xuXG4gICAgICAgICAgICAgICAgICAgIGZvciAoY29uc3QgcmVzdWx0IG9mIHJlc3VsdHMpXG4gICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHJlc3VsdEVsID0gcmVzdWx0c0VsLmNyZWF0ZURpdihcbiAgICAgICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbHM6IFwiZmluZG5vdGUtcmVzdWx0XCIsXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0RWwuc2V0QXR0cmlidXRlKFwidGFiaW5kZXhcIiwgXCIwXCIpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICByZXN1bHRFbC5jcmVhdGVEaXYoXG4gICAgICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGV4dDogdGhpcy5wbHVnaW4udHJ1bmNhdGVUaXRsZShyZXN1bHQudGl0bGUpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsczogXCJmaW5kbm90ZS1yZXN1bHQtdGl0bGVcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICByZXN1bHRFbC5jcmVhdGVFbChcInNtYWxsXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGV4dDogYCR7cmVzdWx0LmNvbGxlY3Rpb259LyR7cmVzdWx0LmZpbGV9YCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbHM6IFwiZmluZG5vdGUtcmVzdWx0LXBhdGhcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICByZXN1bHRFbC5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT5cbiAgICAgICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2b2lkIHRoaXMucGx1Z2luLm9wZW5SZXN1bHQocmVzdWx0KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICByZXN1bHRFbC5hZGRFdmVudExpc3RlbmVyKFwia2V5ZG93blwiLCAoZXZlbnQpID0+XG4gICAgICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGV2ZW50LmtleSA9PT0gXCJFbnRlclwiKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdm9pZCB0aGlzLnBsdWdpbi5vcGVuUmVzdWx0KHJlc3VsdCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZXZlbnQua2V5ICE9PSBcIkFycm93RG93blwiICYmIGV2ZW50LmtleSAhPT0gXCJBcnJvd1VwXCIpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHJlc3VsdEVscyA9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIEFycmF5LmZyb20oXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXN1bHRzRWwucXVlcnlTZWxlY3RvckFsbDxIVE1MRWxlbWVudD4oXCIuZmluZG5vdGUtcmVzdWx0XCIpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBjdXJyZW50SW5kZXggPSByZXN1bHRFbHMuaW5kZXhPZihyZXN1bHRFbCk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoY3VycmVudEluZGV4ID09PSAtMSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZXZlbnQua2V5ID09PSBcIkFycm93VXBcIilcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjdXJyZW50SW5kZXggPT09IDApXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlucHV0LmZvY3VzKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXN1bHRFbHNbY3VycmVudEluZGV4IC0gMV0uZm9jdXMoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoY3VycmVudEluZGV4ID09PSByZXN1bHRFbHMubGVuZ3RoIC0gMSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlucHV0LmZvY3VzKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdEVsc1tjdXJyZW50SW5kZXggKyAxXS5mb2N1cygpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGNhdGNoIChlcnJvcilcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChyZXF1ZXN0SWQgIT09IHRoaXMuc2VhcmNoUmVxdWVzdElkKVxuICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICByZXN1bHRzRWwuZW1wdHkoKTtcblxuICAgICAgICAgICAgICAgICAgICByZXN1bHRzRWwuY3JlYXRlRGl2KFxuICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0ZXh0OiBcIlNlYXJjaCBmYWlsZWRcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIGNsczogXCJmaW5kbm90ZS1lbXB0eVwiLFxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LCAyNTApO1xuICAgICAgICB9KTtcblxuICAgICAgICBpbnB1dC5hZGRFdmVudExpc3RlbmVyKFwia2V5ZG93blwiLCAoZXZlbnQpID0+XG4gICAgICAgIHtcbiAgICAgICAgICAgIGlmIChldmVudC5rZXkgIT09IFwiQXJyb3dEb3duXCIgJiYgZXZlbnQua2V5ICE9PSBcIkFycm93VXBcIilcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbnN0IHJlc3VsdEVscyA9XG4gICAgICAgICAgICAgICAgQXJyYXkuZnJvbShcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0c0VsLnF1ZXJ5U2VsZWN0b3JBbGw8SFRNTEVsZW1lbnQ+KFwiLmZpbmRub3RlLXJlc3VsdFwiKVxuICAgICAgICAgICAgICAgICk7XG5cbiAgICAgICAgICAgIGlmIChyZXN1bHRFbHMubGVuZ3RoID09PSAwKVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcblxuICAgICAgICAgICAgaWYgKGV2ZW50LmtleSA9PT0gXCJBcnJvd0Rvd25cIilcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICByZXN1bHRFbHNbMF0uZm9jdXMoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICByZXN1bHRFbHNbcmVzdWx0RWxzLmxlbmd0aCAtIDFdLmZvY3VzKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGNsZWFyQnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PlxuICAgICAgICB7XG4gICAgICAgICAgICBpbnB1dC52YWx1ZSA9IFwiXCI7XG4gICAgICAgICAgICBpbnB1dC5kaXNwYXRjaEV2ZW50KG5ldyBFdmVudChcImlucHV0XCIpKTtcbiAgICAgICAgICAgIGlucHV0LmZvY3VzKCk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHByaXZhdGUgc2hvd05vQ29sbGVjdGlvbnNTdGF0ZShzdGF0dXNFbDogSFRNTEVsZW1lbnQpOiB2b2lkXG4gICAge1xuICAgICAgICBzdGF0dXNFbC5lbXB0eSgpO1xuXG4gICAgICAgIGNvbnN0IG1lc3NhZ2VFbCA9IHN0YXR1c0VsLmNyZWF0ZURpdihcbiAgICAgICAge1xuICAgICAgICAgICAgdGV4dDogXCJObyBjb2xsZWN0aW9ucyBzZWxlY3RlZFwiLFxuICAgICAgICAgICAgY2xzOiBcImZpbmRub3RlLWVtcHR5XCIsXG4gICAgICAgIH0pO1xuXG4gICAgICAgIG1lc3NhZ2VFbC5zdHlsZS5tYXJnaW5Ub3AgPSBcIjEycHhcIjtcbiAgICAgICAgbWVzc2FnZUVsLnN0eWxlLmZvbnRTaXplID0gXCIwLjllbVwiO1xuICAgIH1cblxuICAgIG9uQ2xvc2UoKTogUHJvbWlzZTx2b2lkPlxuICAgIHtcbiAgICAgICAgaWYgKHRoaXMuc2VhcmNoVGltZXIgIT09IG51bGwpXG4gICAgICAgIHtcbiAgICAgICAgICAgIGNsZWFyVGltZW91dCh0aGlzLnNlYXJjaFRpbWVyKTtcbiAgICAgICAgICAgIHRoaXMuc2VhcmNoVGltZXIgPSBudWxsO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xuICAgIH1cbn1cblxuY2xhc3MgRmluZG5vdGVTZXR0aW5nVGFiIGV4dGVuZHMgUGx1Z2luU2V0dGluZ1RhYlxue1xuICAgIHBsdWdpbjogRmluZG5vdGVQbHVnaW47XG5cbiAgICBjb25zdHJ1Y3RvcihhcHA6IEFwcCwgcGx1Z2luOiBGaW5kbm90ZVBsdWdpbilcbiAgICB7XG4gICAgICAgIHN1cGVyKGFwcCwgcGx1Z2luKTtcbiAgICAgICAgdGhpcy5wbHVnaW4gPSBwbHVnaW47XG4gICAgfVxuXG4gICAgYXN5bmMgZGlzcGxheSgpOiBQcm9taXNlPHZvaWQ+XG4gICAge1xuICAgICAgICBjb25zdCB7IGNvbnRhaW5lckVsIH0gPSB0aGlzO1xuXG4gICAgICAgIGNvbnRhaW5lckVsLmVtcHR5KCk7XG5cbiAgICAgICAgY29uc3QgYmFja0J1dHRvbiA9IGNvbnRhaW5lckVsLmNyZWF0ZUVsKFwiYnV0dG9uXCIsXG4gICAgICAgIHtcbiAgICAgICAgICAgIHRleHQ6IFwi4oaQIEJhY2tcIixcbiAgICAgICAgfSk7XG5cbiAgICAgICAgYmFja0J1dHRvbi5zdHlsZS5tYXJnaW5Cb3R0b20gPSBcIjE4cHhcIjtcblxuICAgICAgICBiYWNrQnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoKSA9PlxuICAgICAgICB7XG4gICAgICAgICAgICAodGhpcy5hcHAgYXMgYW55KS5zZXR0aW5nLm9wZW5UYWJCeUlkKFwiY29tbXVuaXR5LXBsdWdpbnNcIik7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuICAgICAgICAgICAgLnNldE5hbWUoXCJTZXJ2ZXIgVVJMXCIpXG4gICAgICAgICAgICAuc2V0RGVzYyhcIlRoZSBVUkwgb2YgdGhlIEZpbmRub3RlIHNlcnZlci5cIilcbiAgICAgICAgICAgIC5hZGRUZXh0KCh0ZXh0KSA9PlxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHRleHRcbiAgICAgICAgICAgICAgICAgICAgLnNldFBsYWNlaG9sZGVyKFwiaHR0cDovLzEyNy4wLjAuMTo4MDAwXCIpXG4gICAgICAgICAgICAgICAgICAgIC5zZXRWYWx1ZSh0aGlzLnBsdWdpbi5zZXR0aW5ncy5zZXJ2ZXJVcmwpXG4gICAgICAgICAgICAgICAgICAgIC5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+XG4gICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLnNlcnZlclVybCA9IHZhbHVlLnRyaW0oKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgIGNvbnRhaW5lckVsLmNyZWF0ZUVsKFwiaDNcIixcbiAgICAgICAge1xuICAgICAgICAgICAgdGV4dDogXCJDb2xsZWN0aW9uc1wiLFxuICAgICAgICB9KTtcblxuICAgICAgICBjb25zdCBjb2xsZWN0aW9uc0Rlc2NyaXB0aW9uID0gY29udGFpbmVyRWwuY3JlYXRlRWwoXCJwXCIsXG4gICAgICAgIHtcbiAgICAgICAgICAgIHRleHQ6IFwiU2VsZWN0IHdoaWNoIGNvbGxlY3Rpb25zIHRvIHNlYXJjaC5cIixcbiAgICAgICAgfSk7XG5cbiAgICAgICAgY29sbGVjdGlvbnNEZXNjcmlwdGlvbi5zdHlsZS5tYXJnaW5MZWZ0ID0gXCIxOHB4XCI7XG5cbiAgICAgICAgdHJ5XG4gICAgICAgIHtcbiAgICAgICAgICAgIGNvbnN0IGNvbGxlY3Rpb25zID0gYXdhaXQgdGhpcy5wbHVnaW4uZ2V0Q29sbGVjdGlvbnMoKTtcblxuICAgICAgICAgICAgZm9yIChjb25zdCBjb2xsZWN0aW9uIG9mIHRoaXMucGx1Z2luLnNldHRpbmdzLmNvbGxlY3Rpb25zKVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGlmIChjb2xsZWN0aW9ucy5pbmRleE9mKGNvbGxlY3Rpb24pID09PSAtMSlcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuICAgICAgICAgICAgICAgICAgICAgICAgLnNldE5hbWUoY29sbGVjdGlvbilcbiAgICAgICAgICAgICAgICAgICAgICAgIC5zZXREZXNjKFwiQ3VycmVudGx5IHVuYXZhaWxhYmxlXCIpXG4gICAgICAgICAgICAgICAgICAgICAgICAuYWRkVG9nZ2xlKCh0b2dnbGUpID0+XG4gICAgICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdG9nZ2xlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5zZXRWYWx1ZSh0cnVlKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAub25DaGFuZ2UoYXN5bmMgKHZhbHVlKSA9PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIXZhbHVlKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLmNvbGxlY3Rpb25zID1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MuY29sbGVjdGlvbnMuZmlsdGVyKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKG5hbWUpID0+IG5hbWUgIT09IGNvbGxlY3Rpb25cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZm9yIChjb25zdCBjb2xsZWN0aW9uIG9mIGNvbGxlY3Rpb25zKVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxuICAgICAgICAgICAgICAgICAgICAuc2V0TmFtZShjb2xsZWN0aW9uKVxuICAgICAgICAgICAgICAgICAgICAuYWRkVG9nZ2xlKCh0b2dnbGUpID0+XG4gICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRvZ2dsZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5zZXRWYWx1ZShcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MuY29sbGVjdGlvbnMuaW5kZXhPZihjb2xsZWN0aW9uKSAhPT0gLTFcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLm9uQ2hhbmdlKGFzeW5jICh2YWx1ZSkgPT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICh2YWx1ZSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMucGx1Z2luLnNldHRpbmdzLmNvbGxlY3Rpb25zLmxhc3RJbmRleE9mKGNvbGxlY3Rpb24pID09PSAtMSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5jb2xsZWN0aW9ucy5wdXNoKGNvbGxlY3Rpb24pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MuY29sbGVjdGlvbnMgPVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLmNvbGxlY3Rpb25zLmZpbHRlcihcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKG5hbWUpID0+IG5hbWUgIT09IGNvbGxlY3Rpb25cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYXdhaXQgdGhpcy5wbHVnaW4uc2F2ZVNldHRpbmdzKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGNhdGNoIChlcnJvcilcbiAgICAgICAge1xuICAgICAgICAgICAgbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG4gICAgICAgICAgICAgICAgLnNldE5hbWUoXCJVbmFibGUgdG8gbG9hZCBjb2xsZWN0aW9uc1wiKVxuICAgICAgICAgICAgICAgIC5zZXREZXNjKFwiQ2hlY2sgdGhlIHNlcnZlciBVUkwgYW5kIG1ha2Ugc3VyZSB0aGUgRmluZG5vdGUgc2VydmVyIGlzIHJ1bm5pbmcuXCIpO1xuICAgICAgICB9XG4gICAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBGaW5kbm90ZVBsdWdpbiBleHRlbmRzIFBsdWdpblxue1xuICAgIHNldHRpbmdzOiBGaW5kbm90ZVNldHRpbmdzO1xuICAgIGF2YWlsYWJsZUNvbGxlY3Rpb25zOiBzdHJpbmdbXSA9IFtdO1xuXG4gICAgYXN5bmMgb25sb2FkKClcbiAgICB7XG4gICAgICAgIGF3YWl0IHRoaXMubG9hZFNldHRpbmdzKCk7XG5cbiAgICAgICAgdGhpcy5hZGRTZXR0aW5nVGFiKFxuICAgICAgICAgICAgbmV3IEZpbmRub3RlU2V0dGluZ1RhYih0aGlzLmFwcCwgdGhpcylcbiAgICAgICAgKTtcbiAgICAgICAgXG4gICAgICAgIGNvbnNvbGUubG9nKFwiRmluZG5vdGUgcGx1Z2luIGxvYWRlZFwiKTtcblxuICAgICAgICB0aGlzLnJlZ2lzdGVyVmlldyhcbiAgICAgICAgICAgIFZJRVdfVFlQRV9GSU5ETk9URSxcbiAgICAgICAgICAgIChsZWFmKSA9PiBuZXcgRmluZG5vdGVTZWFyY2hWaWV3KGxlYWYsIHRoaXMpXG4gICAgICAgICk7XG5cbiAgICAgICAgdGhpcy5hZGRDb21tYW5kKFxuICAgICAgICB7XG4gICAgICAgICAgICBpZDogXCJzZWFyY2hcIixcbiAgICAgICAgICAgIG5hbWU6IFwiU2VhcmNoIG5vdGVzXCIsXG4gICAgICAgICAgICBjYWxsYmFjazogKCkgPT5cbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBuZXcgRmluZG5vdGVTZWFyY2hNb2RhbCh0aGlzLmFwcCwgdGhpcykub3BlbigpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSk7XG5cbiAgICAgICAgdGhpcy5hZGRDb21tYW5kKFxuICAgICAgICB7XG4gICAgICAgICAgICBpZDogXCJvcGVuLXNlYXJjaFwiLFxuICAgICAgICAgICAgbmFtZTogXCJPcGVuIHNlYXJjaCBzaWRlYmFyXCIsXG4gICAgICAgICAgICBjYWxsYmFjazogKCkgPT5cbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICB2b2lkIHRoaXMuYWN0aXZhdGVWaWV3KCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBhc3luYyBhY3RpdmF0ZVZpZXcoKTogUHJvbWlzZTx2b2lkPlxuICAgIHtcbiAgICAgICAgY29uc3QgeyB3b3Jrc3BhY2UgfSA9IHRoaXMuYXBwO1xuXG4gICAgICAgIGxldCBsZWFmOiBXb3Jrc3BhY2VMZWFmIHwgbnVsbCA9XG4gICAgICAgICAgICB3b3Jrc3BhY2UuZ2V0TGVhdmVzT2ZUeXBlKFZJRVdfVFlQRV9GSU5ETk9URSlbMF0gPz8gbnVsbDtcblxuICAgICAgICBpZiAoIWxlYWYpXG4gICAgICAgIHtcbiAgICAgICAgICAgIGxlYWYgPSB3b3Jrc3BhY2UuZ2V0UmlnaHRMZWFmKGZhbHNlKTtcblxuICAgICAgICAgICAgaWYgKCFsZWFmKVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgYXdhaXQgbGVhZi5zZXRWaWV3U3RhdGUoXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgdHlwZTogVklFV19UWVBFX0ZJTkROT1RFLFxuICAgICAgICAgICAgICAgIGFjdGl2ZTogdHJ1ZSxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgd29ya3NwYWNlLnJldmVhbExlYWYobGVhZik7XG4gICAgfVxuXG4gICAgcGFyc2VRdWVyeShxdWVyeTogc3RyaW5nKTpcbiAgICB7XG4gICAgICAgIGFsbDogc3RyaW5nW107XG4gICAgICAgIGFueTogc3RyaW5nW107XG4gICAgICAgIG5vdDogc3RyaW5nW107XG4gICAgICAgIHJlZ2V4OiBzdHJpbmcgfCBudWxsO1xuICAgIH1cbiAgICB7XG4gICAgICAgIGNvbnN0IHJlc3VsdCA9XG4gICAgICAgIHtcbiAgICAgICAgICAgIGFsbDogW10gYXMgc3RyaW5nW10sXG4gICAgICAgICAgICBhbnk6IFtdIGFzIHN0cmluZ1tdLFxuICAgICAgICAgICAgbm90OiBbXSBhcyBzdHJpbmdbXSxcbiAgICAgICAgICAgIHJlZ2V4OiBudWxsIGFzIHN0cmluZyB8IG51bGwsXG4gICAgICAgIH07XG5cbiAgICAgICAgY29uc3Qgc2VjdGlvbnMgPSBxdWVyeS50cmltKCkuc3BsaXQoXG4gICAgICAgICAgICAvXFxzKyg/PSg/OmFsbHxhbnl8bm90fHJlKTopL2lcbiAgICAgICAgKTtcblxuICAgICAgICBmb3IgKGNvbnN0IHNlY3Rpb24gb2Ygc2VjdGlvbnMpXG4gICAgICAgIHtcbiAgICAgICAgICAgIGNvbnN0IG1hdGNoID0gc2VjdGlvbi5tYXRjaChcbiAgICAgICAgICAgICAgICAvXihhbGx8YW55fG5vdHxyZSk6XFxzKiguKikkL2lcbiAgICAgICAgICAgICk7XG5cbiAgICAgICAgICAgIGlmICghbWF0Y2gpXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgcmVzdWx0LmFsbC5wdXNoKC4uLnNlY3Rpb24uc3BsaXQoL1xccysvKS5maWx0ZXIoQm9vbGVhbikpO1xuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCBtb2RlID0gbWF0Y2hbMV0udG9Mb3dlckNhc2UoKTtcbiAgICAgICAgICAgIGNvbnN0IHZhbHVlID0gbWF0Y2hbMl0udHJpbSgpO1xuXG4gICAgICAgICAgICBpZiAoIXZhbHVlKVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAobW9kZSA9PT0gXCJyZVwiKVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHJlc3VsdC5yZWdleCA9IHZhbHVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAobW9kZSA9PT0gXCJhbGxcIilcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICByZXN1bHQuYWxsLnB1c2goLi4udmFsdWUuc3BsaXQoL1xccysvKS5maWx0ZXIoQm9vbGVhbikpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAobW9kZSA9PT0gXCJhbnlcIilcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICByZXN1bHQuYW55LnB1c2goLi4udmFsdWUuc3BsaXQoL1xccysvKS5maWx0ZXIoQm9vbGVhbikpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAobW9kZSA9PT0gXCJub3RcIilcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICByZXN1bHQubm90LnB1c2goLi4udmFsdWUuc3BsaXQoL1xccysvKS5maWx0ZXIoQm9vbGVhbikpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9XG5cbiAgICBhc3luYyBzZWFyY2hOb3RlcyhcbiAgICAgICAgcXVlcnk6IHN0cmluZyxcbiAgICAgICAgbWF0Y2hDYXNlID0gZmFsc2UsXG4gICAgICAgIHdob2xlV29yZCA9IGZhbHNlXG4gICAgKTogUHJvbWlzZTxTZWFyY2hSZXN1bHRbXT5cbiAgICB7XG4gICAgICAgIGlmICh0aGlzLnNldHRpbmdzLmNvbGxlY3Rpb25zLmxlbmd0aCA9PT0gMClcbiAgICAgICAge1xuICAgICAgICAgICAgcmV0dXJuIFtdO1xuICAgICAgICB9XG5cbiAgICAgICAgdHJ5XG4gICAgICAgIHtcbiAgICAgICAgICAgIGNvbnN0IHNlYXJjaCA9IHRoaXMucGFyc2VRdWVyeShxdWVyeSk7XG4gICAgICAgICAgICBjb25zdCBwYXJhbXMgPSBuZXcgVVJMU2VhcmNoUGFyYW1zKCk7XG5cbiAgICAgICAgICAgIGZvciAoY29uc3Qgd29yZCBvZiBzZWFyY2guYWxsKVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHBhcmFtcy5hcHBlbmQoXCJhbGxcIiwgd29yZCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGZvciAoY29uc3Qgd29yZCBvZiBzZWFyY2guYW55KVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHBhcmFtcy5hcHBlbmQoXCJhbnlcIiwgd29yZCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGZvciAoY29uc3Qgd29yZCBvZiBzZWFyY2gubm90KVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHBhcmFtcy5hcHBlbmQoXCJub3RcIiwgd29yZCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGZvciAoY29uc3QgY29sbGVjdGlvbiBvZiB0aGlzLnNldHRpbmdzLmNvbGxlY3Rpb25zKVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLmF2YWlsYWJsZUNvbGxlY3Rpb25zLmluZGV4T2YoY29sbGVjdGlvbikgIT09IC0xKVxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgcGFyYW1zLmFwcGVuZChcImNvbGxlY3Rpb25cIiwgY29sbGVjdGlvbik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoc2VhcmNoLnJlZ2V4KVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHBhcmFtcy5hcHBlbmQoXCJyZVwiLCBzZWFyY2gucmVnZXgpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBwYXJhbXMuc2V0KFwibWF0Y2hfY2FzZVwiLCBTdHJpbmcobWF0Y2hDYXNlKSk7XG4gICAgICAgICAgICBwYXJhbXMuc2V0KFwid2hvbGVfd29yZFwiLCBTdHJpbmcod2hvbGVXb3JkKSk7XG5cbiAgICAgICAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgcmVxdWVzdFVybChcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICB1cmw6IGAke3RoaXMuc2V0dGluZ3Muc2VydmVyVXJsfS9zZWFyY2g/JHtwYXJhbXMudG9TdHJpbmcoKX1gLFxuICAgICAgICAgICAgICAgIG1ldGhvZDogXCJHRVRcIixcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICByZXR1cm4gcmVzcG9uc2UuanNvbjtcblxuICAgICAgICB9XG4gICAgICAgIGNhdGNoIChlcnJvcilcbiAgICAgICAge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihcIkZpbmRub3RlIHNlYXJjaCBmYWlsZWQ6XCIsIGVycm9yKTtcbiAgICAgICAgICAgIG5ldyBOb3RpY2UoXCJGaW5kbm90ZSBzZXJ2ZXIgY29ubmVjdGlvbiBmYWlsZWRcIik7XG4gICAgICAgICAgICB0aHJvdyBlcnJvcjtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGFzeW5jIGdldENvbGxlY3Rpb25zKCk6IFByb21pc2U8c3RyaW5nW10+XG4gICAge1xuICAgICAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IHJlcXVlc3RVcmwoXG4gICAgICAgIHtcbiAgICAgICAgICAgIHVybDogYCR7dGhpcy5zZXR0aW5ncy5zZXJ2ZXJVcmx9L2NvbGxlY3Rpb25zYCxcbiAgICAgICAgICAgIG1ldGhvZDogXCJHRVRcIixcbiAgICAgICAgfSk7XG5cbiAgICAgICAgY29uc3QgY29sbGVjdGlvbnM6IHsgbmFtZTogc3RyaW5nIH1bXSA9IHJlc3BvbnNlLmpzb247XG5cbiAgICAgICAgdGhpcy5hdmFpbGFibGVDb2xsZWN0aW9ucyA9XG4gICAgICAgICAgICBjb2xsZWN0aW9ucy5tYXAoKGNvbGxlY3Rpb24pID0+IGNvbGxlY3Rpb24ubmFtZSk7XG5cbiAgICAgICAgcmV0dXJuIHRoaXMuYXZhaWxhYmxlQ29sbGVjdGlvbnM7XG4gICAgfVxuXG4gICAgYXN5bmMgb3BlblJlc3VsdChyZXN1bHQ6IFNlYXJjaFJlc3VsdCk6IFByb21pc2U8dm9pZD5cbiAgICB7XG4gICAgICAgIGNvbnN0IGZpbGUgPSB0aGlzLmFwcC52YXVsdC5nZXRBYnN0cmFjdEZpbGVCeVBhdGgocmVzdWx0LmZpbGUpO1xuXG4gICAgICAgIGlmICghKGZpbGUgaW5zdGFuY2VvZiBURmlsZSkpXG4gICAgICAgIHtcbiAgICAgICAgICAgIG5ldyBOb3RpY2UoYE5vdGUgbm90IGZvdW5kOiAke3Jlc3VsdC5maWxlfWApO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgYXdhaXQgdGhpcy5hcHAud29ya3NwYWNlLmdldExlYWYoZmFsc2UpLm9wZW5GaWxlKGZpbGUpO1xuXG4gICAgICAgIGNvbnN0IHZpZXcgPSB0aGlzLmFwcC53b3Jrc3BhY2UuZ2V0QWN0aXZlVmlld09mVHlwZShNYXJrZG93blZpZXcpO1xuXG4gICAgICAgIGlmICh2aWV3KVxuICAgICAgICB7XG4gICAgICAgICAgICBjb25zdCBsaW5lID0gTWF0aC5tYXgoMCwgcmVzdWx0LmxpbmUgLSAxKTtcblxuICAgICAgICAgICAgdmlldy5lZGl0b3Iuc2V0Q3Vyc29yKFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGxpbmUsXG4gICAgICAgICAgICAgICAgY2g6IDAsXG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgdmlldy5lZGl0b3Iuc2Nyb2xsSW50b1ZpZXcoXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBmcm9tOiB7IGxpbmUsIGNoOiAwIH0sXG4gICAgICAgICAgICAgICAgICAgIHRvOiB7IGxpbmUsIGNoOiAwIH0sXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICB0cnVlXG4gICAgICAgICAgICApO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgdHJ1bmNhdGVUaXRsZSh0aXRsZTogc3RyaW5nLCBtYXhXb3JkcyA9IDMwKTogc3RyaW5nXG4gICAge1xuICAgICAgICBjb25zdCB3b3JkcyA9IHRpdGxlLnRyaW0oKS5zcGxpdCgvXFxzKy8pO1xuXG4gICAgICAgIGlmICh3b3Jkcy5sZW5ndGggPD0gbWF4V29yZHMpXG4gICAgICAgIHtcbiAgICAgICAgICAgIHJldHVybiB0aXRsZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB3b3Jkcy5zbGljZSgwLCBtYXhXb3Jkcykuam9pbihcIiBcIikgKyBcIuKAplwiO1xuICAgIH1cblxuICAgIGFzeW5jIGxvYWRTZXR0aW5ncygpOiBQcm9taXNlPHZvaWQ+XG4gICAge1xuICAgICAgICB0aGlzLnNldHRpbmdzID0gT2JqZWN0LmFzc2lnbihcbiAgICAgICAgICAgIHt9LFxuICAgICAgICAgICAgREVGQVVMVF9TRVRUSU5HUyxcbiAgICAgICAgICAgIGF3YWl0IHRoaXMubG9hZERhdGEoKVxuICAgICAgICApO1xuICAgIH1cblxuICAgIGFzeW5jIHNhdmVTZXR0aW5ncygpOiBQcm9taXNlPHZvaWQ+XG4gICAge1xuICAgICAgICBhd2FpdCB0aGlzLnNhdmVEYXRhKHRoaXMuc2V0dGluZ3MpO1xuICAgIH1cblxuICAgIG9udW5sb2FkKClcbiAgICB7XG4gICAgICAgIGNvbnNvbGUubG9nKFwiRmluZG5vdGUgcGx1Z2luIHVubG9hZGVkXCIpO1xuICAgIH1cbn1cbiJdLCJuYW1lcyI6WyJTdWdnZXN0TW9kYWwiLCJJdGVtVmlldyIsIlBsdWdpblNldHRpbmdUYWIiLCJTZXR0aW5nIiwiUGx1Z2luIiwicmVxdWVzdFVybCIsIk5vdGljZSIsIlRGaWxlIiwiTWFya2Rvd25WaWV3Il0sIm1hcHBpbmdzIjoiOzs7O0FBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFrR0E7QUFDTyxTQUFTLFNBQVMsQ0FBQyxPQUFPLEVBQUUsVUFBVSxFQUFFLENBQUMsRUFBRSxTQUFTLEVBQUU7QUFDN0QsSUFBSSxTQUFTLEtBQUssQ0FBQyxLQUFLLEVBQUUsRUFBRSxPQUFPLEtBQUssWUFBWSxDQUFDLEdBQUcsS0FBSyxHQUFHLElBQUksQ0FBQyxDQUFDLFVBQVUsT0FBTyxFQUFFLEVBQUUsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ2hILElBQUksT0FBTyxLQUFLLENBQUMsS0FBSyxDQUFDLEdBQUcsT0FBTyxDQUFDLEVBQUUsVUFBVSxPQUFPLEVBQUUsTUFBTSxFQUFFO0FBQy9ELFFBQVEsU0FBUyxTQUFTLENBQUMsS0FBSyxFQUFFLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLEVBQUUsRUFBRSxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNuRyxRQUFRLFNBQVMsUUFBUSxDQUFDLEtBQUssRUFBRSxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMs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QztBQUV0RCxZQUFBLE1BQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLG1CQUFtQixDQUFDRSxxQkFBWSxDQUFDO1lBRWpFLElBQUksSUFBSSxFQUNSO0FBQ0ksZ0JBQUEsTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsTUFBTSxDQUFDLElBQUksR0FBRyxDQUFDLENBQUM7QUFFekMsZ0JBQUEsSUFBSSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQ3JCO29CQUNJLElBQUk7QUFDSixvQkFBQSxFQUFFLEVBQUUsQ0FBQztBQUNSLGlCQUFBLENBQUM7QUFFRixnQkFBQSxJQUFJLENBQUMsTUFBTSxDQUFDLGNBQWMsQ0FDdEI7QUFDSSxvQkFBQSxJQUFJLEVBQUUsRUFBRSxJQUFJLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRTtBQUNyQixvQkFBQSxFQUFFLEVBQUUsRUFBRSxJQUFJLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRTtpQkFDdEIsRUFDRCxJQUFJLENBQ1A7WUFDTDtRQUNKLENBQUMsQ0FBQTtBQUFBLElBQUE7QUFFRCxJQUFBLGFBQWEsQ0FBQyxLQUFhLEVBQUUsUUFBUSxHQUFHLEVBQUUsRUFBQTtRQUV0QyxNQUFNLEtBQUssR0FBRyxLQUFLLENBQUMsSUFBSSxFQUFFLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQztBQUV2QyxRQUFBLElBQUksS0FBSyxDQUFDLE1BQU0sSUFBSSxRQUFRLEVBQzVCO0FBQ0ksWUFBQSxPQUFPLEtBQUs7UUFDaEI7QUFFQSxRQUFBLE9BQU8sS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsUUFBUSxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxHQUFHLEdBQUc7SUFDbkQ7SUFFTSxZQUFZLEdBQUE7O0FBRWQsWUFBQSxJQUFJLENBQUMsUUFBUSxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQ3pCLEVBQUUsRUFDRixnQkFBZ0IsRUFDaEIsTUFBTSxJQUFJLENBQUMsUUFBUSxFQUFFLENBQ3hCO1FBQ0wsQ0FBQyxDQUFBO0FBQUEsSUFBQTtJQUVLLFlBQVksR0FBQTs7WUFFZCxNQUFNLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQztRQUN0QyxDQUFDLENBQUE7QUFBQSxJQUFBO0lBRUQsUUFBUSxHQUFBO0FBRUosUUFBQSxPQUFPLENBQUMsR0FBRyxDQUFDLDBCQUEwQixDQUFDO0lBQzNDO0FBQ0g7OyIsInhfZ29vZ2xlX2lnbm9yZUxpc3QiOlswXX0=
