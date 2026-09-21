import { 
    App,
    ItemView,
    MarkdownView,
    Notice,
    Plugin,
    requestUrl,
    SuggestModal,
    TFile,
    WorkspaceLeaf,
} from "obsidian";

const FINDNOTE_SERVER = "http://127.0.0.1:8000";

interface SearchResult {
    collection: string;
    file: string;
    index: number;
    line: number;
    title: string;
}

class FindnoteSearchModal extends SuggestModal<SearchResult> {
    private searchTimer: ReturnType<typeof setTimeout> | null = null;

    constructor(
        app: App,
        private plugin: FindnotePlugin,
    ) {
        super(app);
    }

    onOpen() {
        super.onOpen();
        this.setPlaceholder("Search your notes...");
    }

    async getSuggestions(query: string): Promise<SearchResult[]> {
        if (!query.trim()) {
            return [];
        }

        if (this.searchTimer !== null) {
            clearTimeout(this.searchTimer);
        }

        return new Promise((resolve) => {
            this.searchTimer = setTimeout(async () => {
                try {
                    const search = this.plugin.parseQuery(query);
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

                    const response = await requestUrl({
                        url: `${FINDNOTE_SERVER}/search?${params.toString()}`,
                        method: "GET",
                    });

                    resolve(response.json as SearchResult[]);

                } catch (error) {
                    console.error("Findnote search failed:", error);
                    new Notice("Findnote server connection failed");
                    resolve([]);
                }
            }, 250);
        });
    }

    renderSuggestion(result: SearchResult, el: HTMLElement) {
        el.createEl("div", {
            text: this.plugin.truncateTitle(result.title),
        });

        el.createEl("small", {
            text: `${result.collection}/${result.file}`,
        });
    }

    async onChooseSuggestion(result: SearchResult) {
        const file = this.app.vault.getAbstractFileByPath(result.file);

        if (!(file instanceof TFile)) {
            new Notice(`Note not found: ${result.file}`);
            return;
        }

        await this.app.workspace.getLeaf(false).openFile(file);

        const view = this.app.workspace.getActiveViewOfType(MarkdownView);

        if (view) {
            const line = Math.max(0, result.line - 1);

            view.editor.setCursor({
                line,
                ch: 0,
            });

            view.editor.scrollIntoView(
                {
                    from: { line, ch: 0 },
                    to: { line, ch: 0 },
                },
                true
            );
        }
    }
}

const VIEW_TYPE_FINDNOTE = "findnote-search";

class FindnoteSearchView extends ItemView {
    constructor(
        leaf: WorkspaceLeaf,
        private plugin: FindnotePlugin,
    ) {
        super(leaf);
    }

    getViewType(): string {
        return VIEW_TYPE_FINDNOTE;
    }

    getDisplayText(): string {
        return "Findnote";
    }

    async onOpen(): Promise<void> {
        this.contentEl.empty();

        this.contentEl.createEl("h2", {
            text: "Findnote",
        });

        const input = this.contentEl.createEl("input", {
            type: "text",
            placeholder: "Search notes...",
        });

        input.style.width = "100%";

        const resultsEl = this.contentEl.createDiv();

        input.addEventListener("input", async () => {
            const results = await this.search(input.value);

            resultsEl.empty();

            for (const result of results) {
                resultsEl.createDiv({
                    text: this.plugin.truncateTitle(result.title),
                });
            }
        });
    }

    private async search(query: string): Promise<SearchResult[]> {
        const search = this.plugin.parseQuery(query);
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

        const response = await requestUrl({
            url: `${FINDNOTE_SERVER}/search?${params.toString()}`,
            method: "GET",
        });

        return response.json;
    }

    async onClose(): Promise<void> {
        this.contentEl.empty();
    }
}

export default class FindnotePlugin extends Plugin {
    async onload() {
        console.log("Findnote plugin loaded");

        this.registerView(
            VIEW_TYPE_FINDNOTE,
            (leaf) => new FindnoteSearchView(leaf, this)
        );

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
    }

    async activateView(): Promise<void> {
        const { workspace } = this.app;

        let leaf: WorkspaceLeaf | null =
            workspace.getLeavesOfType(VIEW_TYPE_FINDNOTE)[0] ?? null;

        if (!leaf) {
            leaf = workspace.getRightLeaf(false);

            if (!leaf) {
                return;
            }

            await leaf.setViewState({
                type: VIEW_TYPE_FINDNOTE,
                active: true,
            });
        }

        workspace.revealLeaf(leaf);
    }

    parseQuery(query: string): {
        all: string[];
        any: string[];
        not: string[];
        regex: string | null;
    } {
        const result = {
            all: [] as string[],
            any: [] as string[],
            not: [] as string[],
            regex: null as string | null,
        };

        const sections = query.trim().split(
            /\s+(?=(?:all|any|not|re):)/i
        );

        for (const section of sections) {
            const match = section.match(
                /^(all|any|not|re):\s*(.*)$/i
            );

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
            } else if (mode === "all") {
                result.all.push(...value.split(/\s+/).filter(Boolean));
            } else if (mode === "any") {
                result.any.push(...value.split(/\s+/).filter(Boolean));
            } else if (mode === "not") {
                result.not.push(...value.split(/\s+/).filter(Boolean));
            }
        }

        return result;
    }

    truncateTitle(title: string, maxWords = 30): string {
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
