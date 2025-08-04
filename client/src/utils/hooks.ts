import { useMutation } from "@tanstack/react-query";
import { connectToDatabase, chat, executeQuery } from "./api";

export function useConnect() {
  return useMutation({
    mutationKey: ["connect"],
    mutationFn: (uri: string) => connectToDatabase(uri),
  });
}

export function useExecuteQuery() {
  return useMutation({
    mutationKey: ["execute"],
    mutationFn: (query: string, threadId?: string) =>
      executeQuery(query, threadId),
  });
}

export function useChat() {
  return useMutation({
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
  });
}
