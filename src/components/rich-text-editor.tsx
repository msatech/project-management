'use client'

import { useEditor, EditorContent, ReactRenderer } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Mention from '@tiptap/extension-mention'
import tippy from 'tippy.js'
import 'tippy.js/dist/tippy.css' 
import { Bold, Italic, List, ListOrdered, Strikethrough } from 'lucide-react'
import { Toggle } from '@/components/ui/toggle'
import { useEffect, useState, forwardRef, useImperativeHandle } from 'react'

// Suggestion list component for Mentions
const MentionList = forwardRef((props: any, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0)

  const selectItem = (index: number) => {
    const item = props.items[index]

    if (item) {
      props.command({ id: item.id, label: item.name }) // Passing ID and Name
    }
  }

  const upHandler = () => {
    setSelectedIndex((selectedIndex + props.items.length - 1) % props.items.length)
  }

  const downHandler = () => {
    setSelectedIndex((selectedIndex + 1) % props.items.length)
  }

  const enterHandler = () => {
    selectItem(selectedIndex)
  }

  useEffect(() => setSelectedIndex(0), [props.items])

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }: any) => {
      if (event.key === 'ArrowUp') {
        upHandler()
        return true
      }

      if (event.key === 'ArrowDown') {
        downHandler()
        return true
      }

      if (event.key === 'Enter') {
        enterHandler()
        return true
      }

      return false
    },
  }))

  return (
    <div className="bg-popover text-popover-foreground border rounded-md shadow-md p-1 min-w-[150px] overflow-hidden">
      {props.items.length ? (
        props.items.map((item: any, index: number) => (
          <button
            key={index}
            className={`w-full text-left px-2 py-1.5 text-sm rounded-sm flex items-center gap-2 ${
              index === selectedIndex ? 'bg-accent text-accent-foreground' : ''
            }`}
            onClick={() => selectItem(index)}
          >
             {/* Simple Avatar Fallback */}
             <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold">
                {item.name.charAt(0)}
             </div>
            {item.name}
          </button>
        ))
      ) : (
        <div className="px-2 py-1.5 text-sm text-muted-foreground">No users found</div>
      )}
    </div>
  )
})

MentionList.displayName = 'MentionList'

// Main Editor Component
interface RichTextEditorProps {
    value?: string
    onChange?: (content: string) => void
    editable?: boolean
    placeholder?: string
    users?: any[] // List of users for mentions
    className?: string
}

export function RichTextEditor({ value, onChange, editable = true, users = [], className }: RichTextEditorProps) {
  
  const editor = useEditor({
    extensions: [
      StarterKit,
      Mention.configure({
        HTMLAttributes: {
          class: 'mention',
        },
        suggestion: {
          items: ({ query }) => {
            return users.filter(user => user.name.toLowerCase().startsWith(query.toLowerCase())).slice(0, 5)
          },
          render: () => {
            let component: any
            let popup: any

            return {
              onStart: (props) => {
                component = new ReactRenderer(MentionList, {
                  props,
                  editor: props.editor,
                })

                if (!props.clientRect) {
                  return
                }

                popup = tippy(document.body, {
                  getReferenceClientRect: props.clientRect as () => DOMRect,
                  appendTo: () => document.body,
                  content: component.element,
                  showOnCreate: true,
                  interactive: true,
                  trigger: 'manual',
                  placement: 'bottom-start',
                })
              },

              onUpdate(props) {
                component.updateProps(props)

                if (!props.clientRect) {
                  return
                }

                popup[0].setProps({
                  getReferenceClientRect: props.clientRect,
                })
              },

              onKeyDown(props) {
                if (props.event.key === 'Escape') {
                  popup[0].hide()

                  return true
                }

                return component.ref?.onKeyDown(props)
              },

              onExit() {
                popup[0].destroy()
                component.destroy()
              },
            }
          },
        },
      }),
    ],
    content: value,
    editable: editable,
    onUpdate: ({ editor }) => {
        onChange?.(editor.getHTML())
    },
    editorProps: {
        attributes: {
            class: 'prose prose-sm dark:prose-invert max-w-none focus:outline-none min-h-[80px]',
        },
    },
    immediatelyRender: false,
  })

  // Sync content if value changes externally (and editor is not focused to avoid cursor jumps, rough heuristic)
  useEffect(() => {
    if (editor && value !== editor.getHTML() && !editor.isFocused) {
        editor.commands.setContent(value || '')
    }
  }, [value, editor])
  
  // Toggle editable state
  useEffect(() => {
     editor?.setEditable(editable)
  }, [editable, editor])

  if (!editor) {
    return null
  }

  // Toolbar
  if (!editable) {
     return <EditorContent editor={editor} className={className} />
  }

  return (
    <div className={`border rounded-md ${className}`}>
      <div className="flex items-center gap-1 border-b bg-muted/20 p-1">
        <Toggle
          size="sm"
          pressed={editor.isActive('bold')}
          onPressedChange={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold className="h-4 w-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive('italic')}
          onPressedChange={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic className="h-4 w-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive('strike')}
          onPressedChange={() => editor.chain().focus().toggleStrike().run()}
        >
          <Strikethrough className="h-4 w-4" />
        </Toggle>
        <div className="w-px h-4 bg-border mx-1" />
        <Toggle
          size="sm"
          pressed={editor.isActive('bulletList')}
          onPressedChange={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List className="h-4 w-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive('orderedList')}
          onPressedChange={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered className="h-4 w-4" />
        </Toggle>
      </div>
      <div className="p-3">
        <EditorContent editor={editor} />
      </div>

      <style jsx global>{`
        .mention {
            background-color: hsla(var(--primary), 0.1);
            color: hsl(var(--primary));
            border-radius: 0.25rem;
            padding: 0.125rem 0.25rem;
            box-decoration-break: clone;
            font-weight: 500;
        }
      `}</style>
    </div>
  )
}
