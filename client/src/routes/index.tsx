import Dialog from "@/components/Dialog";
import { Editor } from "@/components/Editor";
import Table from "@/components/Table";
import Tooltip from "@/components/Tooltip";
import { useChat, useConnect, useExecuteQuery } from "@/utils/hooks";
import { createFileRoute } from "@tanstack/react-router";
import clsx from "clsx";
import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";

// TODOs

// ? Priority Scope:
// * Integrate session with db connection, currently it sets the same db connection for all sessions
// * Improve the prompt for generation, still not very good
// * Maybe add edit query feature
// * Error handling is straight up missing
// * Improve code quality, it's a mess right now and a lot of bad practices just to get it working

// ? Future Scope:
// * Theme support (just different preset colors for now)
// * Add edit for suggested queries
// * Add query history and saving views
// * Add chart creation based on views
// * Multiple database connections and saving connections

export const Route = createFileRoute("/")({
  component: App,
});

function App() {
  const [sql, setSql] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [history, setHistory] = useState<
    {
      role: "user" | "assistant";
      content: string;
      query?: string;
      state?: "pending" | "approved" | "rejected" | undefined;
    }[]
  >([]);

  const chatWindow = useRef<HTMLDivElement>(null);

  const [schema, setSchema] = useState<Record<string, string[]>>({});

  const [data, setData] = useState<Record<string, any>[]>([]);

  // DB Connection
  const [isConnected, setIsConnected] = useState(false);
  const {
    mutate: connect,
    error: connectionError,
    isPending: isConnecting,
    data: connectionData,
  } = useConnect();

  // useEffect(() => {
  //   connect("sqlite:///demo/chinook.db");
  // }, []);

  const resetState = () => {
    setHistory([]);
    setData([]);
    setSql("");
    setMessage("");

    queryReset();
    chatReset();

    if (chatWindow.current) {
      chatWindow.current.classList.remove("mask-bottom", "mask-top");
    }
  };

  useEffect(() => {
    if (connectionData) {
      // const schema: Record<string, string[]> = {};

      // Object.keys(connectionData.schema).forEach((table) => {
      //   schema[table.toLowerCase()] = connectionData.schema[table].map((col) =>
      //     col.toLowerCase()
      //   );
      // });

      setSchema(connectionData.schema);
      console.log("Connected to database:", connectionData);
      setIsConnected(true);
      setRequired(false);
      setShowDialog(false);

      resetState();
    }
  }, [connectionData]);

  useEffect(() => {
    if (connectionError) {
      console.error("Connection error:", connectionError);
      setIsConnected(false);
    }
  }, [connectionError]);

  // DB Query
  const {
    mutate: executeQuery,
    // error: queryError,
    isPending: isQuerying,
    data: queryData,
    reset: queryReset,
  } = useExecuteQuery();

  useEffect(() => {
    if (queryData) {
      setData(queryData.result);
      console.log("Query executed successfully:", queryData);
    }
  }, [queryData]);

  // DB Chat
  const {
    mutate: chat,
    // error: chatError,
    isPending: isChatting,
    data: chatData,
    reset: chatReset,
  } = useChat();

  const updateHistory = (update: (value: typeof history) => typeof history) => {
    setHistory(update);
    if (chatWindow.current) {
      // chatWindow.current.scrollTop = chatWindow.current.scrollHeight;
      setTimeout(() => {
        chatWindow.current?.scrollTo({
          top: chatWindow.current.scrollHeight,
          behavior: "smooth",
        });
      }, 0);
    }
  };

  const sendMessage = () => {
    chat({ message, threadId: chatData?.threadId });
    updateHistory((prev) => [...prev, { role: "user", content: message }]);
    setMessage("");
  };

  useEffect(() => {
    if (chatData) {
      setMessage("");
      updateHistory((prev) => [
        ...prev,
        {
          role: "assistant",
          content: chatData.pendingQuery
            ? "I've generated the following SQL query. Do you want me to execute it?"
            : chatData.response,
          query: chatData.pendingQuery,
          state: chatData.pendingQuery ? "pending" : undefined,
        },
      ]);
      console.log("Chat message sent successfully:", chatData);
    }
  }, [chatData]);

  const approve = (index: number) => {
    const query = history[index].query;
    if (!query) return;

    chat({ message: "", threadId: chatData?.threadId, confirm: true });
    updateHistory((prev) =>
      prev.map((msg, i) => (i === index ? { ...msg, state: "approved" } : msg))
    );
    executeQuery(query);
  };
  const reject = (index: number) => {
    chat({ message: "", threadId: chatData?.threadId, confirm: false });
    updateHistory((prev) =>
      prev.map((msg, i) => (i === index ? { ...msg, state: "rejected" } : msg))
    );
  };

  // DB Connection Dialog
  const [showDialog, setShowDialog] = useState(true);
  const [required, setRequired] = useState(true);
  const [dbUrl, setDbUrl] = useState("");

  return (
    <>
      {/* opacity-30 dark: */}
      <div className="fixed inset-0 bg-radial to-indigo-800 from-indigo-950 from-70% opacity-20 pointer-events-none transition-all duration-300 ease-in-out"></div>
      <Dialog
        title="Connect To Database"
        required={required}
        open={showDialog}
        setOpen={(open) => {
          if (!required) {
            setShowDialog(open);
          }
        }}
        trigger={
          <Tooltip content={dbUrl}>
            <button
              onClick={() => setShowDialog(true)}
              className="leading-none p-2 z-[2] absolute top-2 left-3 rounded-md hover:bg-neutral-100/10 ease-out transition-all duration-300 flex gap-2.5 items-center"
            >
              {isConnected ? "Connected" : "Disconnected"}
              <span
                className={clsx("rounded-full size-2 relative", {
                  "bg-red-500 shadow-lg shadow-red-500/50": !isConnected,
                  "bg-green-500 shadow-lg shadow-green-500/50 animate-pulse":
                    isConnected,
                })}
                style={{
                  boxShadow: isConnected
                    ? "0 0 10px rgba(34, 197, 94, 0.6), 0 0 20px rgba(34, 197, 94, 0.4), 0 0 30px rgba(34, 197, 94, 0.2)"
                    : "0 0 10px rgba(239, 68, 68, 0.6), 0 0 20px rgba(239, 68, 68, 0.4), 0 0 30px rgba(239, 68, 68, 0.2)",
                }}
              >
                {/* Inner glow layer */}
                <span
                  className={clsx("absolute inset-0 rounded-full blur-sm", {
                    "bg-red-400/80": !isConnected,
                    "bg-green-400/80 animate-pulse": isConnected,
                  })}
                ></span>
                {/* Outer glow layer */}
                <span
                  className={clsx("absolute inset-0 rounded-full blur-md", {
                    "bg-red-300/40": !isConnected,
                    "bg-green-300/40 animate-pulse": isConnected,
                  })}
                  style={{
                    transform: "scale(1.5)",
                  }}
                ></span>
              </span>
            </button>
          </Tooltip>
        }
        close={
          required ? null : (
            <button
              className="absolute top-3 right-3 cursor-pointer hover:bg-neutral-100/10 transition-all duration-300 ease-in-out rounded-full p-1"
              onClick={() => setShowDialog(false)}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="size-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18 18 6M6 6l12 12"
                />
              </svg>
            </button>
          )
        }
      >
        <div className="mt-4 flex flex-col gap-2">
          <p>Enter the URL to connect to your database.</p>
          <p className="text-sm text-neutral-400 -mt-2">
            For a quick test: <code>sqlite:///demo/Chinook.db</code>
          </p>
          <form
            className="flex p-2 gap-2 border border-neutral-100/10 rounded-md focus-within:ring ring-neutral-100/30"
            onSubmit={(e) => {
              e.preventDefault();
              if (!dbUrl.trim()) return;
              connect(dbUrl.trim());
            }}
          >
            <input
              type="text"
              className="flex-1 leading-none outline-none"
              placeholder="Database Connection URL"
              value={dbUrl}
              onChange={(e) => setDbUrl(e.target.value)}
            />
            <button
              type="submit"
              className="bg-neutral-100/20 leading-none rounded-sm px-1.5 text-sm cursor-pointer"
            >
              {isConnecting ? "Connecting..." : "Connect"}
            </button>
          </form>
        </div>
      </Dialog>
      <div className="absolute top-0 right-0 rounded-bl-xl bg-black/30 p-4 leading-none z-100">
        WIP
      </div>
      <div className="h-screen flex flex-col items-center justify-center selection:bg-neutral-100/10">
        <div className="h-full min-h-0 w-full flex flex-col items-center justify-center p-16 relative">
          {data?.length > 0 ? (
            <Table data={data} />
          ) : (
            <div className="absolute top-1/2 left-1/2 -translate-1/2 opacity-60 flex flex-col items-center gap-4">
              <h4 className="text-7xl text-center">(0^0)</h4>
              <p className="text-xl">Query results will appear here</p>
            </div>
          )}
        </div>
        <div className="shrink-0 w-full flex gap-1 rounded-t-lg bg-neutral-100/5 border border-b-0 border-neutral-100/10 p-2 focus:outline-none focus-within:ring focus-within:ring-neutral-500/30 transition-all duration-300 ease-out mt-auto">
          <Editor
            schema={schema}
            onChange={setSql}
            onSubmit={() => executeQuery(sql)}
          />
          <Tooltip content="Cmd/Ctrl + Enter to run query">
            <button
              onClick={() => {
                executeQuery(sql);
              }}
              disabled={isQuerying || !sql.trim()}
              className={clsx(
                "flex p-2 rounded-md border border-neutral-100/10 bg-neutral-900/65 transition-all duration-300 ease-out leading-1 items-center mb-auto",
                isQuerying || !sql.trim()
                  ? "opacity-50"
                  : "cursor-pointer hover:bg-neutral-100/10"
              )}
            >
              <span className="-mt-0.5">Run</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="size-4 ml-1 -mr-1"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m8.25 4.5 7.5 7.5-7.5 7.5"
                />
              </svg>
            </button>
          </Tooltip>
        </div>
        <div className="w-full min-h-1/4 max-h-[40vh] flex flex-col border border-neutral-100/10 p-2 bg-neutral-100/5 transition-all duration-300 ease-out gap-1 h-fit">
          {message.length > 0 || history?.length > 0 ? null : (
            <div className="flex-1 min-h-0 overflow-hidden flex flex-col items-center justify-center opacity-60">
              <h4 className="text-3xl text-center">Chat with Assistant</h4>
              <p>Ask me anything about your database</p>
            </div>
          )}
          <div
            ref={chatWindow}
            className="overflow-y-auto flex flex-col mask-transition"
            onScroll={() => {
              if (!chatWindow.current) return;
              const { scrollTop, scrollHeight, clientHeight } =
                chatWindow.current;

              if (scrollTop + clientHeight < scrollHeight) {
                // User has not reached the bottom
                chatWindow.current.classList.add("mask-bottom");
              } else {
                // User has reached the bottom
                chatWindow.current.classList.remove("mask-bottom");
              }
              if (scrollTop !== 0) {
                // User has not reached the top
                chatWindow.current.classList.add("mask-top");
              } else {
                chatWindow.current.classList.remove("mask-top");
              }
            }}
          >
            {history.map((message, index) => (
              <div
                key={index}
                className={clsx("p-2 rounded-md markdown", {
                  "bg-neutral-100/10 text-neutral-100": message.role === "user",
                  // "bg-neutral-900/65 text-neutral-100":
                  //   message.role === "assistant",
                })}
              >
                <ReactMarkdown>
                  {(message.role === "user" ? "**You:** " : "") +
                    message.content}
                </ReactMarkdown>
                {message.query && (
                  <div className="flex flex-col gap-1 mt-2">
                    <div className="rounded-md bg-neutral-900/80 p-2 py-1 border border-neutral-100/10 font-mono text-[0.9rem]">
                      {message.query}
                    </div>
                    {message.state && (
                      <div className="flex gap-2">
                        {message.state !== "rejected" && (
                          <button
                            className={clsx(
                              "p-2 leading-none rounded-md border border-neutral-100/10 bg-neutral-900/80 ",
                              {
                                "cursor-pointer hover:bg-neutral-100/10":
                                  message.state === "pending",
                                "opacity-50": message.state !== "pending",
                              }
                            )}
                            onClick={() => approve(index)}
                          >
                            {message.state === "approved"
                              ? "Approved"
                              : "Approve"}
                          </button>
                        )}
                        {message.state !== "approved" && (
                          <button
                            className={clsx(
                              "p-2 leading-none rounded-md border border-neutral-100/10 bg-neutral-900/80 ",
                              {
                                "cursor-pointer hover:bg-neutral-100/10":
                                  message.state === "pending",
                                "opacity-50": message.state !== "pending",
                              }
                            )}
                            onClick={() => reject(index)}
                          >
                            {message.state === "rejected"
                              ? "Rejected"
                              : "Reject"}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
            {isChatting && <div className="chat-loader mt-2 ml-2"></div>}
          </div>
          <div className="w-full flex -mb-0.5 mt-auto overflow-hidden gap-2 shrink-0">
            <div className="relative min-h-6 max-h-60 overflow-hidden h-full flex-1">
              <textarea
                placeholder="Type your message here..."
                onChange={(e) => setMessage(e.target.value)}
                value={message}
                onKeyDown={(e) => {
                  if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                className="w-full h-full absolute max-w-[100vw] break-words mt-auto bg-transparent resize-none outline-none overflow-y-auto left-0 top-0 p-2"
              />
              <div className=" whitespace-pre-wrap break-words visibility-none max-h-60 text-transparent bg-transparent select-none pointer-events-none  p-2 ">
                {message + "."}
              </div>
            </div>
            <Tooltip content="Cmd/Ctrl + Enter to send">
              <button
                onClick={() => {
                  sendMessage();
                }}
                disabled={isChatting || !message.trim()}
                className={clsx(
                  "flex p-2 rounded-md border border-neutral-100/10 bg-neutral-900/65  transition-all duration-300 ease-out leading-1 items-center mb-auto mt-1",
                  isChatting || !message.trim()
                    ? "opacity-50"
                    : "cursor-pointer hover:bg-neutral-100/10"
                )}
              >
                <span className="-mt-0.5">Send</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="size-4 ml-1 -mr-1"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m8.25 4.5 7.5 7.5-7.5 7.5"
                  />
                </svg>
              </button>
            </Tooltip>
          </div>
        </div>
      </div>
    </>
  );
}

