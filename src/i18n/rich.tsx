import { Fragment } from 'react';
import { parseRich } from './core';

type Handler = (children: string) => React.ReactNode;

/** Renders a translated sentence that contains <tag>…</tag> markers, e.g. links or bold text. */
export function Rich({ text, tags }: { text: string; tags?: Record<string, Handler> }) {
  const defaults: Record<string, Handler> = {
    b: (c) => <strong className="font-semibold">{c}</strong>,
    code: (c) => <code className="font-semibold">{c}</code>,
  };
  const all = { ...defaults, ...tags };
  return (
    <>
      {parseRich(text).map((part, i) => (
        <Fragment key={i}>{part.tag ? (all[part.tag]?.(part.text) ?? part.text) : part.text}</Fragment>
      ))}
    </>
  );
}

/** Fills `{slot}` markers with React nodes, so word order can differ per language: "{name} opened {what}". */
export function Slots({ text, slots }: { text: string; slots: Record<string, React.ReactNode> }) {
  return (
    <>
      {text.split(/(\{\w+\})/g).map((part, i) => {
        const m = /^\{(\w+)\}$/.exec(part);
        return <Fragment key={i}>{m && m[1] in slots ? slots[m[1]] : part}</Fragment>;
      })}
    </>
  );
}
