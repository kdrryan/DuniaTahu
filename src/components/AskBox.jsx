import { useState } from 'react';
import { ArrowUp, Loader2 } from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';

const SUGGESTIONS = {
  id: [
    'Kenapa langit berwarna biru?',
    'Bagaimana gurita bisa ganti warna?',
    'Kenapa kita cegukan?',
    'Bagaimana piramida Giza dibangun?',
  ],
  en: [
    'Why is the sky blue?',
    'How do octopuses change color?',
    'Why do we get hiccups?',
    'How were the pyramids of Giza built?',
  ],
};

const getCaretGaze = (textarea) => {
  if (!textarea || typeof window === 'undefined') return { x: 0, y: 1 };

  const computed = window.getComputedStyle(textarea);
  const mirror = document.createElement('div');
  const marker = document.createElement('span');
  const styles = [
    'boxSizing', 'width', 'padding', 'border', 'fontFamily', 'fontSize',
    'fontWeight', 'fontStyle', 'letterSpacing', 'lineHeight', 'textAlign',
    'textIndent', 'textTransform', 'wordBreak', 'overflowWrap',
  ];

  mirror.style.position = 'fixed';
  mirror.style.visibility = 'hidden';
  mirror.style.left = '-10000px';
  mirror.style.top = '-10000px';
  mirror.style.whiteSpace = 'pre-wrap';
  mirror.style.overflowWrap = 'break-word';
  mirror.style.wordWrap = 'break-word';
  styles.forEach((property) => {
    mirror.style[property] = computed[property];
  });
  mirror.style.height = 'auto';
  mirror.style.minHeight = '0';
  mirror.style.overflow = 'visible';

  const cursor = textarea.selectionStart ?? textarea.value.length;
  mirror.textContent = textarea.value.slice(0, cursor);
  marker.textContent = '\u200b';
  marker.style.display = 'inline-block';
  marker.style.width = '1px';
  marker.style.height = computed.lineHeight === 'normal' ? computed.fontSize : computed.lineHeight;
  mirror.appendChild(marker);
  document.body.appendChild(mirror);

  const markerRect = marker.getBoundingClientRect();
  const mirrorRect = mirror.getBoundingClientRect();
  const inputRect = textarea.getBoundingClientRect();

  // Convert the caret position from the mirror into the real textarea's
  // viewport coordinates, accounting for the textarea's current scroll.
  const clientX = inputRect.left + markerRect.left - mirrorRect.left - textarea.scrollLeft;
  const clientY = inputRect.top + markerRect.top - mirrorRect.top - textarea.scrollTop + markerRect.height / 2;
  mirror.remove();

  return { clientX, clientY };
};

export default function AskBox({ onAsk, loading, onTypingChange, onGazeChange }) {
  const { lang, t } = useLanguage();
  const [value, setValue] = useState('');
  const suggestions = SUGGESTIONS[lang] || SUGGESTIONS.id;

  const submit = (event) => {
    event?.preventDefault();
    const question = value.trim();
    if (!question || loading) return;
    onAsk(question);
    setValue('');
    onTypingChange?.(false);
    onGazeChange?.(null);
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      submit();
    }
  };

  return (
    <div>
      <form onSubmit={submit}>
        <div className="rounded-2xl border border-border/80 bg-muted/45 p-1.5 transition focus-within:border-foreground/25">
          <textarea
            value={value}
            onChange={(event) => {
              const nextValue = event.target.value;
              setValue(nextValue);
              onTypingChange?.(Boolean(nextValue.trim()));
              window.requestAnimationFrame(() => onGazeChange?.(getCaretGaze(event.target)));
            }}
            onFocus={(event) => {
              onTypingChange?.(true);
              onGazeChange?.(getCaretGaze(event.target));
            }}
            onClick={(event) => onGazeChange?.(getCaretGaze(event.target))}
            onSelect={(event) => {
              const textarea = event.currentTarget;
              window.requestAnimationFrame(() => onGazeChange?.(getCaretGaze(textarea)));
            }}
            onKeyUp={(event) => onGazeChange?.(getCaretGaze(event.target))}
            onBlur={() => {
              onTypingChange?.(false);
              onGazeChange?.(null);
            }}
            onKeyDown={handleKeyDown}
            rows={2}
            maxLength={300}
            placeholder={t('ask.placeholder')}
            className="w-full resize-none bg-transparent px-2.5 py-2 text-[14px] leading-relaxed text-foreground outline-none placeholder:text-muted-foreground"
          />
          <div className="flex items-center justify-between gap-2 px-1 pb-0.5">
            <span className="hidden text-[11px] font-medium text-muted-foreground sm:block">
              {t('ask.hint')}
            </span>
            <button
              type="submit"
              disabled={loading || !value.trim()}
              className="ml-auto inline-flex h-8 items-center gap-1.5 rounded-full bg-primary px-3.5 text-[12.5px] font-semibold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-35"
            >
              {loading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> {t('ask.loading')}
                </>
              ) : (
                <>
                  {t('ask.submit')} <ArrowUp className="h-3.5 w-3.5" strokeWidth={2.6} />
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      <div className="mt-2.5 flex flex-wrap gap-1.5">
        {suggestions.map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            disabled={loading}
            onClick={() => onAsk(suggestion)}
            className="rounded-full border border-foreground/10 px-2.5 py-1 text-[11.5px] font-medium text-foreground/55 transition hover:border-foreground/25 hover:text-foreground disabled:opacity-40"
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
}