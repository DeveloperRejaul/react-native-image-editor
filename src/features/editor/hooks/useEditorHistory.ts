import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Generic undo/redo for a serialisable "document". Instead of instrumenting
 * every mutation, it watches the serialised doc: when it changes and settles
 * (debounced, so a drag collapses to one entry), the previous doc is pushed
 * onto the undo stack. undo()/redo() restore a doc and suppress the resulting
 * change so it doesn't create a new history entry.
 */
export function useEditorHistory<T>(
  doc: T,
  restore: (doc: T) => void,
  { debounceMs = 350, limit = 60 }: { debounceMs?: number; limit?: number } = {},
) {
  const serialized = JSON.stringify(doc);
  const past = useRef<string[]>([]);
  const future = useRef<string[]>([]);
  const baseline = useRef<string>(serialized);
  const suppress = useRef(false);
  const [, bump] = useState(0);
  const rerender = () => bump(n => n + 1);

  useEffect(() => {
    if (suppress.current) {
      suppress.current = false;
      baseline.current = serialized;
      return;
    }
    if (serialized === baseline.current) return;
    const t = setTimeout(() => {
      past.current.push(baseline.current);
      if (past.current.length > limit) past.current.shift();
      future.current = [];
      baseline.current = serialized;
      rerender();
    }, debounceMs);
    return () => clearTimeout(t);
  }, [serialized, debounceMs, limit]);

  const undo = useCallback(() => {
    if (past.current.length === 0) return;
    const prev = past.current.pop() as string;
    future.current.push(baseline.current);
    suppress.current = true;
    baseline.current = prev;
    restore(JSON.parse(prev) as T);
    rerender();
  }, [restore]);

  const redo = useCallback(() => {
    if (future.current.length === 0) return;
    const next = future.current.pop() as string;
    past.current.push(baseline.current);
    suppress.current = true;
    baseline.current = next;
    restore(JSON.parse(next) as T);
    rerender();
  }, [restore]);

  return {
    undo,
    redo,
    canUndo: past.current.length > 0,
    canRedo: future.current.length > 0,
  };
}
