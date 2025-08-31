import { useMutation } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { connectToDatabase, chat, executeQuery } from "./api";

export type Message = {
  role: "user" | "assistant" | "error";
  content: string;
  query?: string;
  state?: "pending" | "approved" | "rejected" | undefined;
};

export function useConnectionManager({
  onSuccess,
  onError,
}: {
  onSuccess?: (data: {
    message: string;
    dialect: string;
    schema: Record<string, string[]>;
    threadId: string;
  }) => void;
  onError?: (error: Error) => void;
} = {}) {
  const [state, setState] = useState({
    isConnected: false,
    schema: {} as Record<string, string[]>,
    threadId: undefined as string | undefined,
    dialect: undefined as string | undefined,
  });

  const connectMutation = useMutation({
    mutationFn: connectToDatabase,
    mutationKey: ["connect"],
    onSuccess: (data) => {
      setState({
        isConnected: true,
        schema: data.schema,
        threadId: data.threadId,
        dialect: data.dialect,
      });
      if (onSuccess) onSuccess(data);
    },
    onError: (err) => {
      setState({
        isConnected: false,
        schema: {},
        threadId: undefined,
        dialect: undefined,
      });
      if (onError) onError(err);
    },
  });

  return {
    ...state,
    connect: connectMutation.mutate,
    isConnecting: connectMutation.isPending,
    error: connectMutation.error,
  };
}

export function useChatManager({
  onSuccess,
  onError,
}: {
  onSuccess?: (data: {
    response: string;
    threadId: string;
    requiresConfirmation: boolean;
    pendingQuery?: string;
  }) => void;
  onError?: (error: Error) => void;
} = {}) {
  const [history, setHistory] = useState<Message[]>([]);

  const chatMutation = useMutation({
    mutationKey: ["chat"],
    mutationFn: ({
      message,
      threadId,
      confirm,
    }: {
      message: string;
      threadId?: string;
      confirm?: boolean;
    }) => chat(message, threadId, confirm),
    onSuccess: (data) => {
      const message: Message = {
        role: "assistant",
        content: data.pendingQuery
          ? "I've generated the following SQL query. Do you want me to execute it?"
          : data.response,
        query: data.pendingQuery,
        state: data.pendingQuery ? "pending" : undefined,
      };
      setHistory((prev) => [...prev, message]);
      if (onSuccess) onSuccess(data);
    },
    onError: (err) => {
      const message: Message = {
        role: "error",
        content: `There was an error processing your request:\n ${
          err.message || "Unknown error occurred"
        }`,
      };
      setHistory((prev) => [...prev, message]);
      if (onError) onError(err);
    },
  });

  const resetHistory = () => {
    setHistory([]);
  };

  const sendMessage = useCallback(
    ({ message, threadId }: { message: string; threadId?: string }) => {
      setHistory((prev) => [...prev, { role: "user", content: message }]);
      chatMutation.mutate({ message, threadId });
    },
    [chatMutation]
  );

  const approveQuery = useCallback(
    (index: number, threadId?: string) => {
      chatMutation.mutate({ message: "", threadId, confirm: true });
      setHistory((prev) =>
        prev.map((msg, i) =>
          i === index ? { ...msg, state: "approved" } : msg
        )
      );
    },
    [chatMutation]
  );

  const rejectQuery = useCallback(
    (index: number, threadId?: string) => {
      chatMutation.mutate({ message: "", threadId, confirm: true });
      setHistory((prev) =>
        prev.map((msg, i) =>
          i === index ? { ...msg, state: "rejected" } : msg
        )
      );
    },
    [chatMutation]
  );

  return {
    history,
    resetHistory,
    resetChat: chatMutation.reset,
    sendMessage,
    approveQuery,
    rejectQuery,
    mutate: chatMutation.mutate,
    isChatting: chatMutation.isPending,
    error: chatMutation.error,
  };
}

export function useExecuteQueryManager({
  onSuccess,
  onError,
}: {
  onSuccess?: (data: {
    result: Record<string, any>[];
    threadId: string;
  }) => void;
  onError?: (error: Error) => void;
} = {}) {
  const execute = useMutation({
    mutationKey: ["execute"],
    mutationFn: ({ query, threadId }: { query: string; threadId?: string }) =>
      executeQuery(query, threadId),
    onSuccess,
    onError,
  });

  return {
    execute: execute.mutate,
    isQuerying: execute.isPending,
    error: execute.error,
    data: execute.data,
    reset: execute.reset,
  };
}
