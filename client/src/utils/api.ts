export async function connectToDatabase(uri: string): Promise<{
  message: string;
  dialect: string;
  schema: Record<string, string[]>;
}> {
  const res = await fetch(`${import.meta.env.VITE_SERVER_URL}/connect`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ uri }),
  });

  if (!res.ok) {
    throw new Error(`HTTP error! status: ${res.status}`);
  }

  return res.json();
}

export async function executeQuery(
  query: string,
  threadId?: string
): Promise<{
  result: Record<string, any>[];
  threadId: string;
}> {
  const res = await fetch(`${import.meta.env.VITE_SERVER_URL}/query`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query, thread_id: threadId }),
  });

  if (!res.ok) {
    throw new Error(`HTTP error! status: ${res.status}`);
  }

  const data = await res.json();

  return {
    result: data.result,
    threadId: data.thread_id,
  };
}

export async function chat(
  message: string,
  threadId?: string,
  confirm?: boolean
): Promise<{
  response: string;
  threadId: string;
  requiresConfirmation: boolean;
  pendingQuery?: string;
}> {
  const res = await fetch(`${import.meta.env.VITE_SERVER_URL}/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message,
      thread_id: threadId,
      confirm_execution: confirm,
    }),
  });

  if (!res.ok) {
    throw new Error(`HTTP error! status: ${res.status}`);
  }

  const data = await res.json();

  return {
    response: data.response,
    threadId: data.thread_id,
    requiresConfirmation: data.requires_confirmation,
    pendingQuery: data.pending_query || undefined,
  };
}
