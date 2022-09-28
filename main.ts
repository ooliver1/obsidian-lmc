import { Plugin } from "obsidian";

function LMCFormatter(_: CodeMirror.EditorConfiguration): CodeMirror.Mode<any> {
    class LMCLexerState {
        previousLinkable: boolean;
        previousVariable: boolean;
        previousDat: boolean;

        constructor() {
            this.previousLinkable = false;
            this.previousVariable = false;
            this.previousDat = false;
        }
    }

    const VARIABLED_KEYWORDS = ["STA", "STO", "LDA"];
    const OTHER_KEYWORDS = ["HLT"];
    const BRANCH_KEYWORDS = ["BRA", "BRZ", "BRP"];
    const MATHS_KEYWORDS = ["ADD", "SUB"];
    const IO_KEYWORDS = ["INP", "OUT", "OTC"];

    const LABELABLE_KEYWORDS = VARIABLED_KEYWORDS.concat(OTHER_KEYWORDS)
        .concat(BRANCH_KEYWORDS)
        .concat(MATHS_KEYWORDS)
        .concat(IO_KEYWORDS);

    const OTHER = OTHER_KEYWORDS.join("|");
    const BRANCH = BRANCH_KEYWORDS.join("|");
    const LABELABLE = LABELABLE_KEYWORDS.join("|");
    const MATHS = MATHS_KEYWORDS.join("|");
    const IO = IO_KEYWORDS.join("|");
    const VARIABLED = VARIABLED_KEYWORDS.join("|");

    const OTHER_KEYWORD_REGEX = RegExp(String.raw`(?:${OTHER})`, "i");
    const IO_REGEX = new RegExp(String.raw`^(?:${IO})`, "i");
    const VARIABLE_KEYWORD_REGEX = new RegExp(
        String.raw`^(?:${VARIABLED})`,
        "i"
    );
    const MATHS_REGEX = new RegExp(String.raw`^(?:${MATHS})`, "i");
    const LABEL_KEYWORD_REGEX = RegExp(
        String.raw`^\w+(?=\s*(?:${LABELABLE}))`,
        "i"
    );
    const BRANCH_KEYWORD_REGEX = RegExp(String.raw`^(?:${BRANCH})`, "i");

    const DAT_REGEX = /DAT/i;

    const VARIABLE_REGEX = /^\w+(?=\s*DAT)/i;
    const DIGIT_REGEX = /\d+/;

    const COMMENT_REGEX = /\S+/;
    const WORD_REGEX = /\w+/;
    const NEWLINE_REGEX = /\n/;

    function tokenCallback(
        stream: CodeMirror.StringStream,
        state: LMCLexerState
    ) {
        let type: string;

        const previousLinkable = state.previousLinkable;
        const previousVariable = state.previousVariable;
        const previousDat = state.previousDat;

        // Reset state here to reduce repetition when it is false most of the time.
        state.previousLinkable = false;
        state.previousVariable = false;
        state.previousDat = false;

        if (stream.match(NEWLINE_REGEX)) {
            return null;
        } else if (previousDat && stream.match(DIGIT_REGEX)) {
            type = "number";
        } else if (stream.match(IO_REGEX)) {
            type = "string";
        } else if (stream.match(MATHS_REGEX)) {
            state.previousVariable = true;
            type = "tag";
        } else if (stream.match(BRANCH_KEYWORD_REGEX)) {
            state.previousLinkable = true;
            type = "keyword";
        } else if (stream.match(VARIABLE_KEYWORD_REGEX)) {
            state.previousVariable = true;
            type = "keyword";
        } else if (stream.match(OTHER_KEYWORD_REGEX)) {
            type = "keyword";
        } else if (stream.match(DAT_REGEX)) {
            state.previousDat = true;
            type = "def";
        } else if (
            (stream.indentation() == stream.column() &&
                stream.match(VARIABLE_REGEX)) ||
            (previousVariable && stream.match(WORD_REGEX))
        ) {
            type = "variable";
        } else if (
            (stream.indentation() == stream.column() &&
                stream.match(LABEL_KEYWORD_REGEX)) ||
            (previousLinkable && stream.match(WORD_REGEX))
        ) {
            type = "link";
        } else if (stream.match(COMMENT_REGEX)) {
            type = "comment";
            stream.skipToEnd();
        } else {
            stream.next();
            return null;
        }

        stream.eatSpace();
        return type;
    }

    return {
        token: tokenCallback,
        startState: () => new LMCLexerState(),
    };
}
CodeMirror.defineMode("lmc", LMCFormatter);
CodeMirror.defineMIME("text/x-lmc", "lmc");
CodeMirror.defineMode("littlemancomputer", LMCFormatter);
CodeMirror.defineMIME("text/x-lmc", "littlemancomputer");
CodeMirror.defineMode("lmc-asm", LMCFormatter);
CodeMirror.defineMIME("text/x-lmc", "lmc-asm");

export default class LMCPlugin extends Plugin {
    // these are the CodeMirror modes that Obsidian uses by default
    implementedModes = ["lmc", "lmc-asm", "littlemancomputer"];

    async onload() {
        // wait for layout to be ready to perform the rest
        this.app.workspace.onLayoutReady(this.layoutReady);
    }

    layoutReady = () => {
        this.app.workspace.off("layout-ready", this.layoutReady);
        this.refreshLeaves();
    };

    onunload() {
        for (const key in CodeMirror.modes) {
            if (
                CodeMirror.modes.hasOwnProperty(key) &&
                this.implementedModes.includes(key)
            ) {
                delete CodeMirror.modes[key];
            }
        }

        this.refreshLeaves();
    }

    refreshLeaves() {
        // re-set the editor mode to refresh the syntax highlighting
        this.app.workspace.iterateCodeMirrors((cm) =>
            cm.setOption("mode", cm.getOption("mode"))
        );
    }
}
