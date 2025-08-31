// SqlEditor.tsx
import React from "react";
import CodeMirror, { EditorView, type Extension } from "@uiw/react-codemirror";
import { sql } from "@codemirror/lang-sql";
import { tags as t } from "@lezer/highlight";
import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";

interface SqlEditorProps {
  schema: Record<string, string[]>;
  onChange?: (value: string) => void;
  value?: string;
  onSubmit?: () => void;
}

const customSyntaxHighlighting = HighlightStyle.define([
  {
    tag: [t.keyword, t.null],
    color: "#88FF77",
  },
  {
    tag: [t.number, t.typeName, t.float, t.integer],
    color: "#EE99BB",
  },
  {
    tag: t.bool,
    color: "#DDEE66",
  },
  {
    tag: t.comment,
    color: "#66BBFF",
  },
  {
    tag: t.string,
    color: "#11BBFF",
  },
  {
    tag: t.character,
    color: "#55EEEE",
  },
]);

const customEditorTheme: Extension = [
  EditorView.theme(
    {
      "&": {
        width: "100%",
      },
      "&:focus-within": {
        outline: "none",
      },
      ".cm-scroller": {
        fontFamily: "inherit",
        // lineHeight: "1.5",
      },
      ".cm-content": {
        caretColor: "#ffffff",
      },
      ".cm-gutters": {
        backgroundColor: "transparent",
      },
      ".cm-lineNumbers": {
        color: "transparent",
        userSelect: "none",
      },
      ".cm-selectionBackground": {
        backgroundColor: "rgba(245, 245, 245, 0.1) !important",
      },
      ".cm-selectionMatch": {
        backgroundColor: "rgba(245, 245, 245, 0.2)",
        outline: "1px solid rgba(245, 245, 245, 0.5)",
        borderRadius: "0.1rem",
      },
      ".cm-matchingBracket": {
        backgroundColor: "rgba(200, 200, 200, 0.15) !important",
      },
      ".cm-foldPlaceholder": {
        backgroundColor: "transparent",
        border: "none",
      },
      ".cm-activeLineGutter": {
        backgroundColor: "transparent",
        position: "relative",
      },
      ".cm-lineNumbers .cm-activeLineGutter::after": {
        content: "'>'",
        color: "#ffffff",
        position: "absolute",
        left: "0.5rem",
        opacity: "0.7",
        // top: "-0.25rem",
        // fontSize: "1.25rem",
      },
      ".cm-activeLine": {
        backgroundColor: "transparent",
      },
      ".cm-tooltip-autocomplete": {
        backgroundColor: "rgba(0, 0, 0, 0.6)",
        borderRadius: "0.25rem", // rounded-sm = 0.25rem
        zIndex: 1000,
        position: "absolute",
        backdropFilter: "blur(2px)",
      },
      ".cm-tooltip-autocomplete ul li[aria-selected]": {
        backgroundColor: "rgba(245, 245, 245, 0.3)", // bg-neutral-100/95
        borderRadius: "0.25rem", // rounded-sm = 0.25rem
        color: "#ffffff",
      },
    },
    { dark: true }
  ),
  syntaxHighlighting(customSyntaxHighlighting),
];

export const Editor: React.FC<SqlEditorProps> = ({
  schema,
  value = "",
  onChange,
  // onSubmit = () => {},
}) => {
  return (
    <CodeMirror
      placeholder="Enter your SQL query here..."
      value={value}
      // height="" // "2rem"
      maxHeight="20vh"
      theme={customEditorTheme}
      extensions={[
        sql({
          upperCaseKeywords: true,
          // defaultTable: Object.keys(schema)[0], // Optional
          // dialect: SQLite, // Optional
          schema,
        }),
        EditorView.lineWrapping,
      ]}
      indentWithTab={true}
      lang="sql"
      onChange={(value) => onChange?.(value)}
      // onKeyDown={(e) => {
      //   if (!onSubmit) return;
      //   if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      //     onSubmit();
      //     console.log("Submit action triggered from keydown");
      //   }
      // }}
      basicSetup={{ lineNumbers: true, foldGutter: false }}
      className="flex-1"
    />
  );
};
