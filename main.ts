import { Notice, Plugin, requestUrl, SuggestModal } from "obsidian";

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
            text: this.truncateTitle(result.title),
        });

        el.createEl("small", {
            text: `${result.collection}/${result.file}`,
        });
    }

    onChooseSuggestion(result: SearchResult) {
        new Notice(
            `${result.title}\n${result.collection}/${result.file}:${result.line}`
        );
    }

    private parseQuery(query: string): {
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

    private truncateTitle(title: string, maxWords = 30): string {
        const words = title.trim().split(/\s+/);

        if (words.length <= maxWords) {
            return title;
        }

        return words.slice(0, maxWords).join(" ") + "…";
    }
}

export default class FindnotePlugin extends Plugin {
    async onload() {
        console.log("Findnote plugin loaded");

        this.addCommand({
            id: "search",
            name: "Search notes",
            callback: () => {
                new FindnoteSearchModal(this.app).open();
            },
        });
    }

    onunload() {
        console.log("Findnote plugin unloaded");
    }
}
