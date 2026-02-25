'use client';

import * as React from 'react';
import dynamic from 'next/dynamic';
import type Quill from 'quill';
import { toast } from 'sonner';

import { resolveImageUrl } from '@/lib/image-url';

import 'react-quill/dist/quill.snow.css';

const ReactQuill = dynamic(() => import('react-quill'), {
  ssr: false,
  loading: () => <div className="rounded-md border bg-muted/30 p-4 text-sm text-muted-foreground">에디터를 불러오는 중...</div>,
});

const toolbarOptions = [
  [{ header: [1, 2, 3, false] }],
  ['bold', 'italic', 'underline', 'strike'],
  [{ list: 'ordered' }, { list: 'bullet' }],
  [{ color: [] }, { background: [] }],
  ['link', 'image', 'clean'],
];

const formats = ['header', 'bold', 'italic', 'underline', 'strike', 'list', 'bullet', 'color', 'background', 'link', 'image'];

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  const handleChange = React.useCallback(
    (_content: string, _delta: unknown, _source: string, editor: { getHTML: () => string }) => {
      const html = editor?.getHTML?.() ?? '';
      const cleaned = html.replace(/<p><br><\/p>/gi, '').trim() ? html : '';
      onChange(cleaned);
    },
    [onChange]
  );

  const insertImage = React.useCallback((editor: Quill, storageKey: string) => {
    const range = editor.getSelection(true);
    const url = resolveImageUrl(storageKey) ?? storageKey;
    const index = range?.index ?? editor.getLength();
    editor.insertEmbed(index, 'image', url, 'user');
    editor.setSelection({ index: index + 1, length: 0 }, 'user');
  }, []);

  const uploadImageFile = React.useCallback(async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch('/api/uploads', {
      method: 'POST',
      body: formData,
    });
    const data = await res.json();
    if (!res.ok || !data?.storageKey) {
      const message = typeof data?.error === 'string' ? data.error : '이미지 업로드에 실패했습니다.';
      throw new Error(message);
    }
    return data.storageKey as string;
  }, []);

  const modules = React.useMemo(
    () => ({
      toolbar: {
        container: toolbarOptions,
        handlers: {
          image: function handler(this: { quill: Quill }) {
            const editor = this?.quill;
            if (!editor) return;
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.onchange = async () => {
              const file = input.files?.[0];
              if (!file) return;
              try {
                const storageKey = await uploadImageFile(file);
                insertImage(editor, storageKey);
                toast.success('이미지가 추가되었습니다.');
              } catch (error) {
                const message = error instanceof Error ? error.message : '이미지 업로드 실패';
                toast.error(message);
              }
            };
            input.click();
          },
        },
      },
    }),
    [insertImage, uploadImageFile]
  );

  return (
    <div className="rounded-lg border bg-background">
      <ReactQuill theme="snow" value={value} onChange={handleChange} modules={modules} formats={formats} placeholder={placeholder} />
    </div>
  );
}
