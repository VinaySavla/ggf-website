"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";
import "react-quill-new/dist/quill.snow.css";

// Dynamically import ReactQuill to prevent SSR issues
const ReactQuill = dynamic(() => import("react-quill-new"), { 
  ssr: false,
  loading: () => (
    <div className="w-full h-[150px] bg-gray-100 rounded-lg flex items-center justify-center">
      <span className="text-gray-500">Loading editor...</span>
    </div>
  )
});

export default function RichTextEditor({ 
  value, 
  onChange, 
  placeholder = "Enter content...",
  minHeight = "120px"
}) {
  const modules = useMemo(() => ({
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'color': [] }, { 'background': [] }],
      ['link'],
      ['clean']
    ],
    clipboard: {
      matchVisual: false,
    },
  }), []);

  const formats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'list',
    'color', 'background',
    'link'
  ];

  return (
    <div className="rich-text-editor-wrapper mb-4">
      <ReactQuill
        theme="snow"
        value={value || ""}
        onChange={onChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
      />
      <style jsx global>{`
        .rich-text-editor-wrapper {
          position: relative;
        }
        .rich-text-editor-wrapper .ql-container {
          border-bottom-left-radius: 0.5rem;
          border-bottom-right-radius: 0.5rem;
          font-family: inherit;
          font-size: 14px;
          min-height: ${minHeight};
        }
        .rich-text-editor-wrapper .ql-toolbar {
          border-top-left-radius: 0.5rem;
          border-top-right-radius: 0.5rem;
          background: #f9fafb;
          flex-wrap: wrap;
        }
        .rich-text-editor-wrapper .ql-editor {
          min-height: ${minHeight};
          max-height: 300px;
          overflow-y: auto;
        }
        .rich-text-editor-wrapper .ql-editor.ql-blank::before {
          font-style: normal;
          color: #9ca3af;
        }
        /* Responsive toolbar */
        @media (max-width: 640px) {
          .rich-text-editor-wrapper .ql-toolbar {
            padding: 4px;
          }
          .rich-text-editor-wrapper .ql-toolbar .ql-formats {
            margin-right: 8px;
            margin-bottom: 4px;
          }
        }
      `}</style>
    </div>
  );
}
