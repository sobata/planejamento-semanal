import { useState, useRef, useEffect } from 'react';
import { MessageSquare, Check, X } from 'lucide-react';

interface ObservacaoCellProps {
  texto: string | null;
  isLocked: boolean;
  onSave: (texto: string) => void;
}

export function ObservacaoCell({ texto, isLocked, onSave }: ObservacaoCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(texto || '');
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = () => {
    onSave(value.trim());
    setIsEditing(false);
  };

  const handleCancel = () => {
    setValue(texto || '');
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  if (isLocked) {
    return (
      <div className="min-h-[60px] p-1.5">
        {texto ? (
          <span className="text-sm text-gray-600">{texto}</span>
        ) : (
          <span className="text-sm text-gray-400">-</span>
        )}
      </div>
    );
  }

  if (isEditing) {
    return (
      <div className="min-h-[60px] p-1.5">
        <textarea
          ref={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleSave}
          className="w-full p-1 text-sm border border-primary-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-500 resize-none"
          rows={2}
        />
        <div className="flex gap-1 mt-1">
          <button
            onClick={handleSave}
            className="p-1 text-green-600 hover:bg-green-50 rounded"
          >
            <Check className="w-3 h-3" />
          </button>
          <button
            onClick={handleCancel}
            className="p-1 text-gray-500 hover:bg-gray-100 rounded"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-[60px] p-1.5 cursor-pointer hover:bg-gray-50 rounded"
      onClick={() => setIsEditing(true)}
    >
      {texto ? (
        <span className="text-sm text-gray-600">{texto}</span>
      ) : (
        <span className="text-sm text-gray-400 flex items-center gap-1">
          <MessageSquare className="w-3 h-3" />
          Adicionar
        </span>
      )}
    </div>
  );
}
