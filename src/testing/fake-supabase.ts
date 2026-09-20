// An in-memory stand-in for a Supabase project's REST API (PostgREST). It is
// plugged in as the `fetch` of a real supabase-js client, so tests exercise the
// real query builder and the requests it produces, not a hand-rolled mock of it.
//
// It implements only what the app uses: paged reads with `order` / `offset` /
// `limit` / `select`, upserts on `id`, and deletes by `id=in.(...)`. It also
// enforces the schema's foreign keys (tm_tasks -> tm_projects `on delete set null`,
// tm_focus_sessions -> tm_tasks `on delete cascade`) so a wrong write order fails here
// the way it would in Postgres.

type Row = Record<string, unknown> & { id: string };

export type FakeRequest = { method: string; table: string; search: URLSearchParams };

export type FakeSupabase = {
  fetch: typeof fetch;
  tables: Record<string, Map<string, Row>>;
  requests: FakeRequest[];
  // The next request to this table with this method fails with the given status.
  failNext: (method: string, table: string, status?: number) => void;
  // Caps rows per response like PostgREST's `max-rows` setting.
  maxRows: number | null;
};

const TABLES = ["tm_projects", "tm_tags", "tm_tasks", "tm_focus_sessions"] as const;

function json(body: unknown, status = 200): Response {
  return new Response(body === null ? null : JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function pgError(status: number, code: string, message: string): Response {
  return json({ code, message, details: null, hint: null }, status);
}

// Parses PostgREST's `in.(a,b,"c d")`.
function parseIn(value: string): string[] {
  const inner = value.replace(/^in\.\(/, "").replace(/\)$/, "");
  return inner === "" ? [] : inner.split(",").map((v) => v.replace(/^"|"$/g, ""));
}

export function createFakeSupabase(): FakeSupabase {
  const tables: FakeSupabase["tables"] = Object.fromEntries(
    TABLES.map((name) => [name, new Map<string, Row>()]),
  );
  const failures: { method: string; table: string; status: number }[] = [];
  const requests: FakeRequest[] = [];
  const fake: FakeSupabase = {
    tables,
    requests,
    maxRows: null,
    failNext: (method, table, status = 500) => {
      failures.push({ method, table, status });
    },
    fetch: (async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = new URL(typeof input === "string" || input instanceof URL ? input : input.url);
      const method = (init?.method ?? "GET").toUpperCase();
      const table = url.pathname.replace(/^\/rest\/v1\//, "");
      const rows = tables[table];
      requests.push({ method, table, search: url.searchParams });

      const failure = failures.findIndex((f) => f.method === method && f.table === table);
      if (failure >= 0) {
        const { status } = failures.splice(failure, 1)[0];
        return pgError(status, "XX000", "simulated failure");
      }
      if (!rows) return pgError(404, "42P01", `relation "${table}" does not exist`);

      if (method === "GET") {
        const sorted = [...rows.values()].sort((a, b) => a.id.localeCompare(b.id));
        const offset = Number(url.searchParams.get("offset") ?? 0);
        const limit = Number(url.searchParams.get("limit") ?? sorted.length);
        const cap = fake.maxRows ?? Infinity;
        const page = sorted.slice(offset, offset + Math.min(limit, cap));
        const columns = (url.searchParams.get("select") ?? "*").split(",").map((c) => c.trim());
        return json(
          page.map((row) =>
            columns[0] === "*" ? row : Object.fromEntries(columns.map((c) => [c, row[c]])),
          ),
        );
      }

      if (method === "POST") {
        const body = JSON.parse(String(init?.body)) as Row[];
        for (const row of body) {
          if (table === "tm_tasks" && row.project_id != null && !tables.tm_projects.has(String(row.project_id))) {
            return pgError(409, "23503", "violates foreign key constraint tasks_project_id_fkey");
          }
          if (table === "tm_focus_sessions" && !tables.tm_tasks.has(String(row.task_id))) {
            return pgError(409, "23503", "violates foreign key constraint focus_sessions_task_id_fkey");
          }
        }
        for (const row of body) rows.set(row.id, row);
        return new Response(null, { status: 201 });
      }

      if (method === "DELETE") {
        const filter = url.searchParams.get("id");
        if (!filter?.startsWith("in.(")) {
          return pgError(400, "PGRST100", "DELETE without an id filter");
        }
        for (const id of parseIn(filter)) {
          rows.delete(id);
          if (table === "tm_projects") {
            for (const task of tables.tm_tasks.values()) {
              if (task.project_id === id) task.project_id = null;
            }
          }
          if (table === "tm_tasks") {
            for (const [sessionId, s] of tables.tm_focus_sessions) {
              if (s.task_id === id) tables.tm_focus_sessions.delete(sessionId);
            }
          }
        }
        return new Response(null, { status: 204 });
      }

      return pgError(405, "PGRST000", `unsupported method ${method}`);
    }) as typeof fetch,
  };
  return fake;
}
