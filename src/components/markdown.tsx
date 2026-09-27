import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import style from "../css/chat.module.less";

type MarkdownViewProps = {
    content: string;
    streaming?: boolean;
    className?: string;
};

const MarkdownView = React.memo(function MarkdownView({
    content,
    streaming,
    className,
}: MarkdownViewProps) {
    const classNames = [
        style["markdown"],
        streaming ? style["markdown-streaming"] : "",
        className ?? "",
    ]
        .filter(Boolean)
        .join(" ");
    return (
        <div className={classNames}>
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                    a: ({ node, ...rest }) => {
                        void node;
                        return (
                            <a {...rest} target="_blank" rel="noreferrer noopener" />
                        );
                    },
                }}
            >
                {content}
            </ReactMarkdown>
        </div>
    );
});

export default MarkdownView;
