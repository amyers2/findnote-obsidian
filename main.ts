import { 
    App,
    ItemView,
    MarkdownView,
    Notice,
    Plugin,
    PluginSettingTab,
    requestUrl,
    Setting,
    SuggestModal,
    TFile,
    WorkspaceLeaf,
} from "obsidian";

interface SearchResult
{
    collection: string;
    file: string;
    index: number;
    line: number;
    title: string;
}

interface FindnoteSettings
{
    serverUrl: string;
    collections: string[];
}

const DEFAULT_SETTINGS: FindnoteSettings =
{
    serverUrl: "http://127.0.0.1:8000",
    collections: [],
};

class FindnoteSearchModal extends SuggestModal<SearchResult>
{
    private searchTimer: ReturnType<typeof setTimeout> | null = null;

    constructor(
        app: App,
        private plugin: FindnotePlugin)
    {
        super(app);
    }

    onOpen()
    {
        super.onOpen();
        this.setPlaceholder("Search your notes...");
    }

    async getSuggestions(query: string): Promise<SearchResult[]>
    {
        if (!query.trim())
        {
            return [];
        }

        if (this.searchTimer !== null)
        {
            clearTimeout(this.searchTimer);
        }

        return new Promise((resolve) =>
        {
            this.searchTimer = setTimeout(async () => {
                const results = await this.plugin.searchNotes(query);
                resolve(results);
            }, 250);
        });
    }

    renderSuggestion(result: SearchResult, el: HTMLElement)
    {
        el.createEl("div",
        {
            text: this.plugin.truncateTitle(result.title),
        });

        el.createEl("small",
        {
            text: `${result.collection}/${result.file}`,
        });
    }

    async onChooseSuggestion(result: SearchResult)
    {
        await this.plugin.openResult(result);
    }
}

const VIEW_TYPE_FINDNOTE = "findnote-search";

class FindnoteSearchView extends ItemView
{
    private searchTimer: ReturnType<typeof setTimeout> | null = null;
    private searchRequestId = 0;

    constructor(
        leaf: WorkspaceLeaf,
        private plugin: FindnotePlugin)
    {
        super(leaf);
    }

    getViewType(): string
    {
        return VIEW_TYPE_FINDNOTE;
    }

    getDisplayText(): string
    {
        return "Findnote";
    }

    private showEmptyState(statusEl: HTMLElement): void
    {
        statusEl.empty();

        const messageEl = statusEl.createDiv(
        {
            text: "Search your notes",
            cls: "findnote-empty",
        });

        messageEl.style.marginTop = "12px";
        messageEl.style.fontSize = "0.9em";
    }

    private showSearchingState(statusEl: HTMLElement): void
    {
        statusEl.empty();

        const messageEl = statusEl.createDiv(
        {
            text: "Searching…",
            cls: "findnote-empty",
        });

        messageEl.style.marginTop = "12px";
        messageEl.style.fontSize = "0.9em";
    }

    private showNoResultsState(statusEl: HTMLElement): void
    {
        statusEl.empty();

        const messageEl = statusEl.createDiv(
        {
            text: "No notes found",
            cls: "findnote-empty",
        });

        messageEl.style.marginTop = "12px";
        messageEl.style.fontSize = "0.9em";
    }

    async onOpen(): Promise<void>
    {
        this.contentEl.empty();

        this.contentEl.createEl("h2",
        {
            text: "Findnote",
        });

        const searchContainer = this.contentEl.createDiv();

        searchContainer.style.position = "relative";

        const input = searchContainer.createEl("input",
        {
            type: "text",
            placeholder: "Search notes...",
        });

        input.style.width = "100%";
        input.style.paddingRight = "30px";

        const clearButton = searchContainer.createEl("button",
        {
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

        input.addEventListener("input", () =>
        {
            clearButton.style.display = input.value ? "block" : "none";

            if (this.searchTimer !== null)
            {
                clearTimeout(this.searchTimer);
            }

            if (!input.value.trim())
            {
                this.searchRequestId++;
                resultsEl.empty();
                this.showEmptyState(statusEl);
                return;
            }

            this.showSearchingState(statusEl);
            resultsEl.empty();

            this.searchTimer = setTimeout(async () =>
            {
                this.searchTimer = null;

                const requestId = ++this.searchRequestId;

                try
                {
                    const results = await this.plugin.searchNotes(input.value);

                    if (requestId !== this.searchRequestId)
                    {
                        return;
                    }

                    if (results.length === 0)
                    {
                        if (this.plugin.settings.collections.length === 0)
                        {
                            this.showNoCollectionsState(statusEl);
                        }
                        else
                        {
                            this.showNoResultsState(statusEl);
                        }

                        return;
                    }

                    statusEl.empty();
                    resultsEl.empty();

                    for (const result of results)
                    {
                        const resultEl = resultsEl.createDiv(
                        {
                            cls: "findnote-result",
                        });

                        resultEl.setAttribute("tabindex", "0");

                        resultEl.createDiv(
                        {
                            text: this.plugin.truncateTitle(result.title),
                            cls: "findnote-result-title",
                        });

                        resultEl.createEl("small",
                        {
                            text: `${result.collection}/${result.file}`,
                            cls: "findnote-result-path",
                        });

                        resultEl.addEventListener("click", () =>
                        {
                            void this.plugin.openResult(result);
                        });

                        resultEl.addEventListener("keydown", (event) =>
                        {
                            if (event.key === "Enter")
                            {
                                event.preventDefault();
                                void this.plugin.openResult(result);
                                return;
                            }

                            if (event.key !== "ArrowDown" && event.key !== "ArrowUp")
                            {
                                return;
                            }

                            event.preventDefault();

                            const resultEls =
                                Array.from(
                                    resultsEl.querySelectorAll<HTMLElement>(".findnote-result")
                                );

                            const currentIndex = resultEls.indexOf(resultEl);

                            if (currentIndex === -1)
                            {
                                return;
                            }

                            if (event.key === "ArrowUp")
                            {
                                if (currentIndex === 0)
                                {
                                    input.focus();
                                }
                                else
                                {
                                    resultEls[currentIndex - 1].focus();
                                }

                                return;
                            }

                            if (currentIndex === resultEls.length - 1)
                            {
                                input.focus();
                            }
                            else
                            {
                                resultEls[currentIndex + 1].focus();
                            }
                        });
                    }
                }
                catch (error)
                {
                    if (requestId !== this.searchRequestId)
                    {
                        return;
                    }

                    resultsEl.empty();

                    resultsEl.createDiv(
                    {
                        text: "Search failed",
                        cls: "findnote-empty",
                    });
                }
            }, 250);
        });

        input.addEventListener("keydown", (event) =>
        {
            if (event.key !== "ArrowDown" && event.key !== "ArrowUp")
            {
                return;
            }

            const resultEls =
                Array.from(
                    resultsEl.querySelectorAll<HTMLElement>(".findnote-result")
                );

            if (resultEls.length === 0)
            {
                return;
            }

            event.preventDefault();

            if (event.key === "ArrowDown")
            {
                resultEls[0].focus();
            }
            else
            {
                resultEls[resultEls.length - 1].focus();
            }
        });

        clearButton.addEventListener("click", () =>
        {
            input.value = "";
            input.dispatchEvent(new Event("input"));
            input.focus();
        });
    }

    private showNoCollectionsState(statusEl: HTMLElement): void
    {
        statusEl.empty();

        const messageEl = statusEl.createDiv(
        {
            text: "No collections selected",
            cls: "findnote-empty",
        });

        messageEl.style.marginTop = "12px";
        messageEl.style.fontSize = "0.9em";
    }

    onClose(): Promise<void>
    {
        if (this.searchTimer !== null)
        {
            clearTimeout(this.searchTimer);
            this.searchTimer = null;
        }

        return Promise.resolve();
    }
}

class FindnoteSettingTab extends PluginSettingTab
{
    plugin: FindnotePlugin;

    constructor(app: App, plugin: FindnotePlugin)
    {
        super(app, plugin);
        this.plugin = plugin;
    }

    async display(): Promise<void>
    {
        const { containerEl } = this;

        containerEl.empty();

        const backButton = containerEl.createEl("button",
        {
            text: "← Back",
        });

        backButton.style.marginBottom = "18px";

        backButton.addEventListener("click", () =>
        {
            (this.app as any).setting.openTabById("community-plugins");
        });

        new Setting(containerEl)
            .setName("Server URL")
            .setDesc("The URL of the Findnote server.")
            .addText((text) =>
            {
                text
                    .setPlaceholder("http://127.0.0.1:8000")
                    .setValue(this.plugin.settings.serverUrl)
                    .onChange(async (value) =>
                    {
                        this.plugin.settings.serverUrl = value.trim();
                        await this.plugin.saveSettings();
                    });
            });

        containerEl.createEl("h3",
        {
            text: "Collections",
        });

        const collectionsDescription = containerEl.createEl("p",
        {
            text: "Select which collections to search.",
        });

        collectionsDescription.style.marginLeft = "18px";

        try
        {
            const collections = await this.plugin.getCollections();

            for (const collection of this.plugin.settings.collections)
            {
                if (collections.indexOf(collection) === -1)
                {
                    new Setting(containerEl)
                        .setName(collection)
                        .setDesc("Currently unavailable")
                        .addToggle((toggle) =>
                        {
                            toggle
                                .setValue(true)
                                .onChange(async (value) =>
                                {
                                    if (!value)
                                    {
                                        this.plugin.settings.collections =
                                            this.plugin.settings.collections.filter(
                                                (name) => name !== collection
                                            );

                                        await this.plugin.saveSettings();
                                    }
                                });
                        });
                }
            }

            for (const collection of collections)
            {
                new Setting(containerEl)
                    .setName(collection)
                    .addToggle((toggle) =>
                    {
                        toggle
                            .setValue(
                                this.plugin.settings.collections.indexOf(collection) !== -1
                            )
                            .onChange(async (value) =>
                            {
                                if (value)
                                {
                                    if (this.plugin.settings.collections.lastIndexOf(collection) === -1)
                                    {
                                        this.plugin.settings.collections.push(collection);
                                    }
                                }
                                else
                                {
                                    this.plugin.settings.collections =
                                        this.plugin.settings.collections.filter(
                                            (name) => name !== collection
                                        );
                                }

                                await this.plugin.saveSettings();
                            });
                    });
            }
        }
        catch (error)
        {
            new Setting(containerEl)
                .setName("Unable to load collections")
                .setDesc("Check the server URL and make sure the Findnote server is running.");
        }
    }
}

export default class FindnotePlugin extends Plugin
{
    settings: FindnoteSettings;
    availableCollections: string[] = [];

    async onload()
    {
        await this.loadSettings();

        this.addSettingTab(
            new FindnoteSettingTab(this.app, this)
        );
        
        console.log("Findnote plugin loaded");

        this.registerView(
            VIEW_TYPE_FINDNOTE,
            (leaf) => new FindnoteSearchView(leaf, this)
        );

        this.addCommand(
        {
            id: "search",
            name: "Search notes",
            callback: () =>
            {
                new FindnoteSearchModal(this.app, this).open();
            },
        });

        this.addCommand(
        {
            id: "open-search",
            name: "Open search sidebar",
            callback: () =>
            {
                void this.activateView();
            },
        });
    }

    async activateView(): Promise<void>
    {
        const { workspace } = this.app;

        let leaf: WorkspaceLeaf | null =
            workspace.getLeavesOfType(VIEW_TYPE_FINDNOTE)[0] ?? null;

        if (!leaf)
        {
            leaf = workspace.getRightLeaf(false);

            if (!leaf)
            {
                return;
            }

            await leaf.setViewState(
            {
                type: VIEW_TYPE_FINDNOTE,
                active: true,
            });
        }

        workspace.revealLeaf(leaf);
    }

    parseQuery(query: string):
    {
        all: string[];
        any: string[];
        not: string[];
        regex: string | null;
    }
    {
        const result =
        {
            all: [] as string[],
            any: [] as string[],
            not: [] as string[],
            regex: null as string | null,
        };

        const sections = query.trim().split(
            /\s+(?=(?:all|any|not|re):)/i
        );

        for (const section of sections)
        {
            const match = section.match(
                /^(all|any|not|re):\s*(.*)$/i
            );

            if (!match)
            {
                result.all.push(...section.split(/\s+/).filter(Boolean));
                continue;
            }

            const mode = match[1].toLowerCase();
            const value = match[2].trim();

            if (!value)
            {
                continue;
            }

            if (mode === "re")
            {
                result.regex = value;
            }
            else if (mode === "all")
            {
                result.all.push(...value.split(/\s+/).filter(Boolean));
            }
            else if (mode === "any")
            {
                result.any.push(...value.split(/\s+/).filter(Boolean));
            }
            else if (mode === "not")
            {
                result.not.push(...value.split(/\s+/).filter(Boolean));
            }
        }

        return result;
    }

    async searchNotes(query: string): Promise<SearchResult[]>
    {
        if (this.settings.collections.length === 0)
        {
            return [];
        }

        try
        {
            const search = this.parseQuery(query);
            const params = new URLSearchParams();

            for (const word of search.all)
            {
                params.append("all", word);
            }

            for (const word of search.any)
            {
                params.append("any", word);
            }

            for (const word of search.not)
            {
                params.append("not", word);
            }

            for (const collection of this.settings.collections)
            {
                if (this.availableCollections.indexOf(collection) !== -1)
                {
                    params.append("collection", collection);
                }
            }

            if (search.regex)
            {
                params.append("re", search.regex);
            }

            const response = await requestUrl(
            {
                url: `${this.settings.serverUrl}/search?${params.toString()}`,
                method: "GET",
            });

            return response.json;

        }
        catch (error)
        {
            console.error("Findnote search failed:", error);
            new Notice("Findnote server connection failed");
            throw error;
        }
    }

    async getCollections(): Promise<string[]>
    {
        const response = await requestUrl(
        {
            url: `${this.settings.serverUrl}/collections`,
            method: "GET",
        });

        const collections: { name: string }[] = response.json;

        this.availableCollections =
            collections.map((collection) => collection.name);

        return this.availableCollections;
    }

    async openResult(result: SearchResult): Promise<void>
    {
        const file = this.app.vault.getAbstractFileByPath(result.file);

        if (!(file instanceof TFile))
        {
            new Notice(`Note not found: ${result.file}`);
            return;
        }

        await this.app.workspace.getLeaf(false).openFile(file);

        const view = this.app.workspace.getActiveViewOfType(MarkdownView);

        if (view)
        {
            const line = Math.max(0, result.line - 1);

            view.editor.setCursor(
            {
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

    truncateTitle(title: string, maxWords = 30): string
    {
        const words = title.trim().split(/\s+/);

        if (words.length <= maxWords)
        {
            return title;
        }

        return words.slice(0, maxWords).join(" ") + "…";
    }

    async loadSettings(): Promise<void>
    {
        this.settings = Object.assign(
            {},
            DEFAULT_SETTINGS,
            await this.loadData()
        );
    }

    async saveSettings(): Promise<void>
    {
        await this.saveData(this.settings);
    }

    onunload()
    {
        console.log("Findnote plugin unloaded");
    }
}
