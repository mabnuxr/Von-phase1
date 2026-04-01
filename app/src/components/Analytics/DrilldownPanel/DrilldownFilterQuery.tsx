import { useRef, useState, useLayoutEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { FunnelIcon } from "@phosphor-icons/react";

// ── SQL WHERE-clause parser ────────────────────────────────────

interface FilterCondition {
  column: string;
  operator: string;
  value: string;
  /** The logical connector that precedes this condition ("and" / "or"). Unused for the first condition. */
  connector?: "and" | "or";
}

const SQL_OPERATOR_LABELS: Record<string, string> = {
  "=": "is",
  "!=": "is not",
  "<>": "is not",
  ">": "is greater than",
  ">=": "is at least",
  "<": "is less than",
  "<=": "is at most",
  LIKE: "contains",
  "NOT LIKE": "does not contain",
  IN: "is any of",
  "NOT IN": "is not any of",
  BETWEEN: "is between",
  "IS NULL": "is blank",
  "IS NOT NULL": "is not blank",
};

/** Pretty-print a column name: strip quotes, replace underscores, title-case */
function formatColumn(col: string): string {
  // Strip surrounding double-quotes or backticks
  const stripped = col.replace(/^["`]|["`]$/g, "");
  return stripped.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Strip surrounding single quotes from a SQL value */
function stripQuotes(val: string): string {
  return val.replace(/^'(.*)'$/, "$1");
}

/** Regex source for a SQL identifier: word, dotted (table.col), double-quoted, or backtick-quoted */
const COL = `(?:"[^"]+"|` + "`[^`]+" + "`" + `|\\w+(?:\\.\\w+)*)`;

/** Split a string on commas that are not inside quotes or parentheses */
function splitTopLevelCommas(input: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let inQuote = false;
  let start = 0;

  for (let i = 0; i < input.length; i++) {
    const ch = input[i];
    if (ch === "'") {
      if (inQuote && input[i + 1] === "'") {
        i++;
      } else {
        inQuote = !inQuote;
      }
      continue;
    }
    if (inQuote) continue;
    if (ch === "(") depth++;
    else if (ch === ")") depth--;
    else if (ch === "," && depth === 0) {
      parts.push(input.slice(start, i));
      start = i + 1;
    }
  }
  parts.push(input.slice(start));
  return parts;
}

/**
 * Parse the WHERE clause from a SQL query into human-readable conditions.
 * Handles: col = 'val', col >= val, col IN ('a','b'), col BETWEEN a AND b,
 * col IS NULL, col IS NOT NULL, col LIKE '%val%'.
 * Strips the common `1=1 AND` prefix.
 */
function parseWhereClause(query: string): FilterCondition[] {
  // Extract everything between WHERE and ORDER BY / GROUP BY / LIMIT / end
  const whereMatch = query.match(
    /\bWHERE\s+(.*?)(?:\s+ORDER\s+BY|\s+GROUP\s+BY|\s+LIMIT\s+|\s+HAVING\s+|$)/is,
  );
  if (!whereMatch) return [];

  let clause = whereMatch[1].trim();
  // Strip leading 1=1 AND
  clause = clause.replace(/^1\s*=\s*1\s+AND\s+/i, "").trim();
  if (!clause || clause === "1=1") return [];

  const conditions: FilterCondition[] = [];

  // Split on top-level AND / OR (not inside parentheses or quotes)
  const parts = splitOnTopLevelLogical(clause);

  for (const { text, connector } of parts) {
    const trimmed = text.trim();
    if (!trimmed) continue;

    // IS NOT NULL
    const isNotNullMatch = trimmed.match(new RegExp(`^(${COL})\\s+IS\\s+NOT\\s+NULL$`, "i"));
    if (isNotNullMatch) {
      conditions.push({
        column: formatColumn(isNotNullMatch[1]),
        operator: "is not blank",
        value: "",
        connector,
      });
      continue;
    }

    // IS NULL
    const isNullMatch = trimmed.match(new RegExp(`^(${COL})\\s+IS\\s+NULL$`, "i"));
    if (isNullMatch) {
      conditions.push({
        column: formatColumn(isNullMatch[1]),
        operator: "is blank",
        value: "",
        connector,
      });
      continue;
    }

    // NOT IN (...)
    const notInMatch = trimmed.match(new RegExp(`^(${COL})\\s+NOT\\s+IN\\s*\\((.+)\\)$`, "i"));
    if (notInMatch) {
      const values = splitTopLevelCommas(notInMatch[2])
        .map((v: string) => stripQuotes(v.trim()))
        .join(", ");
      conditions.push({
        column: formatColumn(notInMatch[1]),
        operator: "is not any of",
        value: values,
        connector,
      });
      continue;
    }

    // IN (...)
    const inMatch = trimmed.match(new RegExp(`^(${COL})\\s+IN\\s*\\((.+)\\)$`, "i"));
    if (inMatch) {
      const values = splitTopLevelCommas(inMatch[2])
        .map((v: string) => stripQuotes(v.trim()))
        .join(", ");
      conditions.push({
        column: formatColumn(inMatch[1]),
        operator: "is any of",
        value: values,
        connector,
      });
      continue;
    }

    // BETWEEN ... AND ...
    const betweenMatch = trimmed.match(new RegExp(`^(${COL})\\s+BETWEEN\\s+(.+?)\\s+AND\\s+(.+)$`, "i"));
    if (betweenMatch) {
      conditions.push({
        column: formatColumn(betweenMatch[1]),
        operator: "is between",
        value: `${stripQuotes(betweenMatch[2].trim())} and ${stripQuotes(betweenMatch[3].trim())}`,
        connector,
      });
      continue;
    }

    // NOT LIKE
    const notLikeMatch = trimmed.match(new RegExp(`^(${COL})\\s+NOT\\s+LIKE\\s+(.+)$`, "i"));
    if (notLikeMatch) {
      conditions.push({
        column: formatColumn(notLikeMatch[1]),
        operator: "does not contain",
        value: stripQuotes(notLikeMatch[2].trim()).replace(/%/g, ""),
        connector,
      });
      continue;
    }

    // LIKE
    const likeMatch = trimmed.match(new RegExp(`^(${COL})\\s+LIKE\\s+(.+)$`, "i"));
    if (likeMatch) {
      conditions.push({
        column: formatColumn(likeMatch[1]),
        operator: "contains",
        value: stripQuotes(likeMatch[2].trim()).replace(/%/g, ""),
        connector,
      });
      continue;
    }

    // Standard comparison: col op value
    const compMatch = trimmed.match(new RegExp(`^(${COL})\\s*(!=|<>|>=|<=|=|>|<)\\s*(.+)$`));
    if (compMatch) {
      conditions.push({
        column: formatColumn(compMatch[1]),
        operator: SQL_OPERATOR_LABELS[compMatch[2]] ?? compMatch[2],
        value: stripQuotes(compMatch[3].trim()),
        connector,
      });
      continue;
    }
  }

  return conditions;
}

/** Split a SQL clause on top-level AND / OR (not inside parentheses or quoted strings) */
function splitOnTopLevelLogical(
  clause: string,
): { text: string; connector?: "and" | "or" }[] {
  const parts: { text: string; connector?: "and" | "or" }[] = [];
  let depth = 0;
  let inQuote = false;
  let start = 0;
  let nextConnector: "and" | "or" | undefined;

  for (let i = 0; i < clause.length; i++) {
    const ch = clause[i];

    // Toggle single-quote state, handling escaped quotes ('')
    if (ch === "'") {
      if (inQuote && clause[i + 1] === "'") {
        i++; // skip escaped quote
      } else {
        inQuote = !inQuote;
      }
      continue;
    }

    if (inQuote) continue;

    if (ch === "(") depth++;
    else if (ch === ")") depth--;
    else if (depth === 0 && (i === 0 || /\s/.test(clause[i - 1]))) {
      const andMatch = clause.slice(i).match(/^AND\s/i);
      const orMatch = clause.slice(i).match(/^OR\s/i);

      if (andMatch) {
        // Don't split BETWEEN ... AND ...
        const preceding = clause.slice(start, i).trim();
        if (/\bBETWEEN\s+\S+\s*$/i.test(preceding)) continue;

        parts.push({ text: preceding, connector: nextConnector });
        i += 3; // skip "AND"
        start = i;
        nextConnector = "and";
      } else if (orMatch) {
        parts.push({
          text: clause.slice(start, i).trim(),
          connector: nextConnector,
        });
        i += 2; // skip "OR"
        start = i;
        nextConnector = "or";
      }
    }
  }
  parts.push({ text: clause.slice(start).trim(), connector: nextConnector });
  return parts;
}

// ── Component ──────────────────────────────────────────────────

interface DrilldownFilterQueryProps {
  query: string;
}

export function DrilldownFilterQuery({ query }: DrilldownFilterQueryProps) {
  const conditions = parseWhereClause(query);
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  const updatePosition = useCallback(() => {
    if (!buttonRef.current || !popoverRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const popoverWidth = popoverRef.current.offsetWidth || 400;
    const viewportWidth = window.innerWidth;

    const top = rect.bottom + 8;
    // Right-align if button is in right half, left-align if in left half
    const buttonCenter = rect.left + rect.width / 2;
    const preferred =
      buttonCenter > viewportWidth / 2 ? rect.right - popoverWidth : rect.left;
    const left = Math.max(
      16,
      Math.min(preferred, viewportWidth - popoverWidth - 16),
    );

    setPosition({ top, left });
  }, []);

  useLayoutEffect(() => {
    if (isOpen) updatePosition();
  }, [isOpen, updatePosition]);

  // Close on outside click
  useLayoutEffect(() => {
    if (!isOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (
        !popoverRef.current?.contains(e.target as Node) &&
        !buttonRef.current?.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [isOpen]);

  if (conditions.length === 0) return null;

  return (
    <>
      <button
        ref={buttonRef}
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-1.5 px-2 py-1.5 text-sm font-medium text-gray-800 bg-transparent border border-gray-200/70 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-colors cursor-pointer"
      >
        <FunnelIcon size={14} />
        <span>Filter</span>
        <span className="ml-0.5 px-1.5 py-0.5 bg-gray-50 border border-gray-200 text-gray-900 text-[10px] font-medium rounded-md">
          {conditions.length}
        </span>
      </button>

      {createPortal(
        <AnimatePresence>
          {isOpen && (
            <motion.div
              ref={popoverRef}
              initial={{ opacity: 0, y: -6, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.97 }}
              transition={{ type: "spring", duration: 0.25, bounce: 0.1 }}
              className="fixed z-[10000] min-w-[360px] max-w-[520px] bg-white rounded-xl border border-gray-200 shadow-lg"
              style={{ top: position.top, left: position.left }}
            >
              <div className="flex flex-col gap-0.5 px-3 py-2.5 bg-gray-50 border border-gray-100 rounded-lg m-3">
                {conditions.map((cond, i) => (
                  <div
                    key={i}
                    className="flex items-baseline gap-2 text-sm leading-relaxed"
                  >
                    <span className="text-gray-400 shrink-0 w-10 text-right">
                      {i === 0 ? "Where" : (cond.connector ?? "and")}
                    </span>
                    <span className="text-gray-700">
                      <span className="font-semibold text-gray-900">
                        {cond.column}
                      </span>{" "}
                      {cond.operator}
                      {cond.value && (
                        <>
                          {" "}
                          &ldquo;
                          <span className="font-medium">{cond.value}</span>
                          &rdquo;
                        </>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </>
  );
}
