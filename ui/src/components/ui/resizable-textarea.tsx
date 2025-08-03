// import { cn } from '@/lib/utils';
// import {
//   useEffect,
//   useRef,
//   type RefObject,
//   type TextareaHTMLAttributes,
//   type KeyboardEvent,
//   type ClipboardEvent,
//   useImperativeHandle,
// } from 'react';

// interface ResizableTextareaProps
//   extends TextareaHTMLAttributes<HTMLTextAreaElement> {
//   input: string;
//   disableAutosize?: boolean;
//   maxHeight?: number;
//   onEnterPress?: () => void;
//   onCustomKeyDown?: (e: KeyboardEvent<HTMLTextAreaElement>) => void;
//   onPaste?: (e: ClipboardEvent<HTMLTextAreaElement>) => void;
//   disabled?: boolean;
//   rows?: number;
//   textareaRef?: RefObject<HTMLTextAreaElement>;
// }

// const ResizableTextarea = ({
//   input,
//   disableAutosize = false,
//   maxHeight = 140,
//   placeholder,
//   onChange,
//   onEnterPress,
//   onCustomKeyDown,
//   onPaste,
//   className,
//   disabled = false,
//   rows = 2,
//   textareaRef,
//   ...props
// }: ResizableTextareaProps) => {
//   const internalRef = useRef<HTMLTextAreaElement | null>(null);

//   useEffect(() => {
//     if (disableAutosize || !internalRef.current) return;

//     internalRef.current.style.height = 'auto';
//     internalRef.current.style.height =
//       typeof maxHeight === 'number'
//         ? `${Math.min(internalRef.current.scrollHeight, maxHeight)}px`
//         : `min(${internalRef.current.scrollHeight}px, ${maxHeight})`;
//   }, [input, maxHeight, disableAutosize]);

//   useImperativeHandle<HTMLTextAreaElement | null, any>(textareaRef, () => ({
//     focus: () => {
//       internalRef.current?.focus();
//     },
//     clear: () => {
//       if (internalRef.current) {
//         internalRef.current.value = '';
//       }
//     },
//   }));
//   const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
//     if (e.key === 'Enter' && !e.shiftKey) {
//       e.preventDefault();
//       if (!disabled) {
//         onEnterPress?.();
//       }
//     }
//     onCustomKeyDown?.(e);
//   };

//   return (
//     <textarea
//       ref={internalRef}
//       value={input}
//       onChange={onChange}
//       onKeyDown={handleKeyDown}
//       placeholder={placeholder}
//       onPaste={onPaste}
//       className={cn(
//         'w-full resize-none border-none bg-transparent text-base outline-none placeholder:text-muted-foreground  disabled:cursor-not-allowed disabled:opacity-50 ',
//         'min-h-[28px] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
//         className,
//       )}
//       rows={rows}
//       disabled={disabled}
//       {...props}
//     />
//   );
// };

// export default ResizableTextarea;
import { cn } from '@/lib/utils';
import {
  useEffect,
  type TextareaHTMLAttributes,
  type KeyboardEvent,
  type ClipboardEvent,
  forwardRef,
} from 'react';

interface ResizableTextareaProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  input?: string;
  disableAutosize?: boolean;
  maxHeight?: number | string;
  onEnterPress?: (event: KeyboardEvent<HTMLTextAreaElement>) => void;
  onCustomKeyDown?: (e: KeyboardEvent<HTMLTextAreaElement>) => void;
  onPaste?: (e: ClipboardEvent<HTMLTextAreaElement>) => void;
}

const ResizableTextarea = forwardRef<
  HTMLTextAreaElement,
  ResizableTextareaProps
>(
  (
    {
      input,
      disableAutosize = false,
      maxHeight = 140,
      placeholder,
      onChange,
      onEnterPress,
      onCustomKeyDown,
      onPaste,
      className,
      disabled = false,
      rows = 2,
      ...props
    },
    ref,
  ) => {
    useEffect(() => {
      if (disableAutosize || !ref || typeof ref !== 'object' || !ref.current)
        return;

      const textarea = ref.current;
      textarea.style.height = 'auto';

      const newHeight =
        typeof maxHeight === 'number'
          ? `${Math.min(textarea.scrollHeight, maxHeight)}px`
          : `min(${textarea.scrollHeight}px, ${maxHeight})`;

      textarea.style.height = newHeight;
    }, [input, maxHeight, disableAutosize, ref]);

    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if (!disabled) {
          onEnterPress?.(e);
        }
      }
      onCustomKeyDown?.(e);
    };

    return (
      <textarea
        ref={ref}
        value={input}
        onChange={onChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        onPaste={onPaste}
        className={cn(
          'w-full leading-relaxed tracking-tight resize-none text-base outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50',
          'min-h-[44px] border-none bg-transparent shadow-none  focus-visible:ring-0 focus-visible:ring-offset-0',
          className,
        )}
        rows={rows}
        disabled={disabled}
        {...props}
      />
    );
  },
);

ResizableTextarea.displayName = 'ResizableTextarea';

export default ResizableTextarea;
