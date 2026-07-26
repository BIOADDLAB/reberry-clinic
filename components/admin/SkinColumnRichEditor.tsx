'use client';

import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import { EditorContent, useEditor, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useEffect, useRef, useState } from 'react';

interface SkinColumnRichEditorProps {
    value: string;
    onChange: (html: string) => void;
    onImageUpload: (file: File) => Promise<string>;
    onUploadError: (message: string) => void;
    onUploadingChange?: (uploading: boolean) => void;
    disabled?: boolean;
}

const toolButtonClass =
    'rounded-md border px-2.5 py-1.5 text-caption-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40';

function ToolButton({
    active,
    disabled,
    label,
    onClick,
}: {
    active?: boolean;
    disabled?: boolean;
    label: string;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            aria-pressed={active}
            disabled={disabled}
            onMouseDown={(event) => event.preventDefault()}
            onClick={onClick}
            className={`${toolButtonClass} ${
                active
                    ? 'border-cocoa bg-cocoa text-cream hover:bg-deep'
                    : 'border-cocoa/15 bg-white text-cocoa hover:bg-cocoa/5'
            }`}
        >
            {label}
        </button>
    );
}

const normalizeLink = (rawValue: string): string | null => {
    const value = rawValue.trim();
    if (!value) return '';

    try {
        const url = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`);
        return url.protocol === 'http:' || url.protocol === 'https:' ? url.toString() : null;
    } catch {
        return null;
    }
};

function EditorToolbar({
    editor,
    disabled,
    uploading,
    onChooseImage,
}: {
    editor: Editor;
    disabled: boolean;
    uploading: boolean;
    onChooseImage: () => void;
}) {
    const setLink = () => {
        const previousUrl = editor.getAttributes('link').href as string | undefined;
        const rawValue = window.prompt('연결할 URL을 입력하세요.', previousUrl ?? 'https://');
        if (rawValue === null) return;

        const href = normalizeLink(rawValue);
        if (href === null) {
            window.alert('올바른 http 또는 https 주소를 입력하세요.');
            return;
        }
        if (!href) {
            editor.chain().focus().extendMarkRange('link').unsetLink().run();
            return;
        }
        editor.chain().focus().extendMarkRange('link').setLink({ href }).run();
    };

    return (
        <div className="flex flex-wrap gap-1.5 border-b border-cocoa/10 bg-[#F5F2EC]/60 p-2.5">
            <ToolButton
                label="본문"
                active={editor.isActive('paragraph')}
                disabled={disabled}
                onClick={() => editor.chain().focus().setParagraph().run()}
            />
            <ToolButton
                label="제목 2"
                active={editor.isActive('heading', { level: 2 })}
                disabled={disabled}
                onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            />
            <ToolButton
                label="제목 3"
                active={editor.isActive('heading', { level: 3 })}
                disabled={disabled}
                onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            />
            <span aria-hidden className="mx-0.5 w-px bg-cocoa/10" />
            <ToolButton
                label="굵게"
                active={editor.isActive('bold')}
                disabled={disabled}
                onClick={() => editor.chain().focus().toggleBold().run()}
            />
            <ToolButton
                label="기울임"
                active={editor.isActive('italic')}
                disabled={disabled}
                onClick={() => editor.chain().focus().toggleItalic().run()}
            />
            <ToolButton
                label="밑줄"
                active={editor.isActive('underline')}
                disabled={disabled}
                onClick={() => editor.chain().focus().toggleUnderline().run()}
            />
            <ToolButton
                label="취소선"
                active={editor.isActive('strike')}
                disabled={disabled}
                onClick={() => editor.chain().focus().toggleStrike().run()}
            />
            <span aria-hidden className="mx-0.5 w-px bg-cocoa/10" />
            <ToolButton
                label="글머리"
                active={editor.isActive('bulletList')}
                disabled={disabled}
                onClick={() => editor.chain().focus().toggleBulletList().run()}
            />
            <ToolButton
                label="번호"
                active={editor.isActive('orderedList')}
                disabled={disabled}
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
            />
            <ToolButton
                label="인용"
                active={editor.isActive('blockquote')}
                disabled={disabled}
                onClick={() => editor.chain().focus().toggleBlockquote().run()}
            />
            <ToolButton
                label="링크"
                active={editor.isActive('link')}
                disabled={disabled}
                onClick={setLink}
            />
            <ToolButton
                label={uploading ? '이미지 업로드 중…' : '이미지'}
                disabled={disabled || uploading}
                onClick={onChooseImage}
            />
            <span aria-hidden className="mx-0.5 w-px bg-cocoa/10" />
            <ToolButton
                label="실행 취소"
                disabled={disabled || !editor.can().chain().focus().undo().run()}
                onClick={() => editor.chain().focus().undo().run()}
            />
            <ToolButton
                label="다시 실행"
                disabled={disabled || !editor.can().chain().focus().redo().run()}
                onClick={() => editor.chain().focus().redo().run()}
            />
        </div>
    );
}

export default function SkinColumnRichEditor({
    value,
    onChange,
    onImageUpload,
    onUploadError,
    onUploadingChange,
    disabled = false,
}: SkinColumnRichEditorProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);
    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: { levels: [2, 3] },
                link: {
                    openOnClick: false,
                    autolink: true,
                    defaultProtocol: 'https',
                    HTMLAttributes: { rel: 'noopener noreferrer nofollow', target: '_blank' },
                },
            }),
            Image.configure({
                inline: false,
                allowBase64: false,
                HTMLAttributes: { loading: 'lazy' },
            }),
            Placeholder.configure({ placeholder: '피부칼럼 본문을 입력하세요.' }),
        ],
        content: value,
        editable: !disabled,
        immediatelyRender: false,
        editorProps: {
            attributes: {
                class: 'skin-column-editor-content min-h-[360px] px-4 py-4 focus:outline-none',
            },
        },
        onUpdate: ({ editor: currentEditor }) => onChange(currentEditor.getHTML()),
    });

    useEffect(() => {
        if (!editor || editor.getHTML() === value) return;
        editor.commands.setContent(value, { emitUpdate: false });
    }, [editor, value]);

    useEffect(() => {
        editor?.setEditable(!disabled);
    }, [disabled, editor]);

    const handleImageChange = async (file: File | undefined) => {
        if (!file || !editor) return;
        if (!file.type.startsWith('image/')) {
            onUploadError('이미지 파일만 본문에 넣을 수 있습니다.');
            return;
        }
        if (file.size > 10 * 1024 * 1024) {
            onUploadError('본문 이미지는 10MB 이하만 업로드할 수 있습니다.');
            return;
        }

        setUploading(true);
        onUploadingChange?.(true);
        try {
            const url = await onImageUpload(file);
            editor.chain().focus().setImage({ src: url, alt: file.name }).run();
        } catch (error) {
            onUploadError(error instanceof Error ? error.message : '본문 이미지 업로드에 실패했습니다.');
        } finally {
            setUploading(false);
            onUploadingChange?.(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    return (
        <div className="overflow-hidden rounded-xl border border-cocoa/15 bg-white focus-within:border-cocoa/40">
            {editor ? (
                <EditorToolbar
                    editor={editor}
                    disabled={disabled}
                    uploading={uploading}
                    onChooseImage={() => fileInputRef.current?.click()}
                />
            ) : (
                <div className="border-b border-cocoa/10 bg-[#F5F2EC]/60 p-3 text-caption text-latte">
                    에디터를 불러오는 중…
                </div>
            )}
            <EditorContent editor={editor} />
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="sr-only"
                disabled={disabled || uploading}
                onChange={(event) => void handleImageChange(event.target.files?.[0])}
            />
        </div>
    );
}
