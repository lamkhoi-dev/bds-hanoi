"use client";

import { useRef, useEffect } from 'react';

interface SimpleEditorProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export default function SimpleEditor({ value, onChange, className = '' }: SimpleEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const isInternalChange = useRef(false);

  useEffect(() => {
    if (editorRef.current && !isInternalChange.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || '';
    }
    isInternalChange.current = false;
  }, [value]);

  const handleInput = () => {
    if (editorRef.current) {
      isInternalChange.current = true;
      onChange(editorRef.current.innerHTML);
    }
  };

  const execCommand = (command: string, value: string = '') => {
    document.execCommand(command, false, value);
    handleInput();
    editorRef.current?.focus();
  };

  return (
    <div className={`flex flex-col border border-gray-300 rounded-lg overflow-hidden ${className}`}>
      <div className="flex flex-wrap gap-1 p-2 bg-gray-50 border-b border-gray-300">
        <button type="button" onClick={() => execCommand('bold')} className="p-2 hover:bg-gray-200 rounded font-bold" title="In đậm">B</button>
        <button type="button" onClick={() => execCommand('italic')} className="p-2 hover:bg-gray-200 rounded italic" title="In nghiêng">I</button>
        <button type="button" onClick={() => execCommand('underline')} className="p-2 hover:bg-gray-200 rounded underline" title="Gạch chân">U</button>
        <div className="w-px h-6 bg-gray-300 mx-1 self-center" />
        <button type="button" onClick={() => execCommand('insertOrderedList')} className="p-2 hover:bg-gray-200 rounded" title="Danh sách số">1.</button>
        <button type="button" onClick={() => execCommand('insertUnorderedList')} className="p-2 hover:bg-gray-200 rounded" title="Danh sách chấm">•</button>
        <div className="w-px h-6 bg-gray-300 mx-1 self-center" />
        <button type="button" onClick={() => execCommand('justifyLeft')} className="p-2 hover:bg-gray-200 rounded" title="Căn trái">Trái</button>
        <button type="button" onClick={() => execCommand('justifyCenter')} className="p-2 hover:bg-gray-200 rounded" title="Căn giữa">Giữa</button>
        <button type="button" onClick={() => execCommand('justifyRight')} className="p-2 hover:bg-gray-200 rounded" title="Căn phải">Phải</button>
      </div>
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onBlur={handleInput}
        className="p-4 flex-1 outline-none min-h-[300px] overflow-y-auto prose max-w-none"
      />
    </div>
  );
}
