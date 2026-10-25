import { useMemo, useState } from 'react';
import { ChevronRight, ChevronDown, Pencil, Trash2, Plus, GripVertical, Tags } from 'lucide-react';

// Flat list -> tree, grouped by parentId and ordered by sortOrder then name.
function buildTree(items) {
  const byParent = new Map();
  items.forEach((item) => {
    const key = item.parentId || null;
    if (!byParent.has(key)) byParent.set(key, []);
    byParent.get(key).push(item);
  });
  byParent.forEach((list) => list.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.name.localeCompare(b.name)));
  return byParent;
}

// A drop is only valid if the target isn't the dragged node or one of its
// own descendants (would create a cycle).
function isDescendant(items, ancestorId, candidateId) {
  let current = items.find((i) => i.id === candidateId);
  while (current?.parentId) {
    if (String(current.parentId) === String(ancestorId)) return true;
    current = items.find((i) => i.id === current.parentId);
  }
  return false;
}

function Row({ item, depth, byParent, expanded, toggleExpand, onEdit, onDelete, onAdd, dragState, setDragState, handleDrop, items }) {
  const children = byParent.get(item.id) || [];
  const hasChildren = children.length > 0;
  const isExpanded = expanded.has(item.id);
  const isDragOver = dragState.overId === item.id;

  return (
    <div>
      <div
        draggable
        onDragStart={(e) => { e.dataTransfer.setData('text/plain', String(item.id)); setDragState({ draggingId: item.id, overId: null, position: null }); }}
        onDragEnd={() => setDragState({ draggingId: null, overId: null, position: null })}
        onDragOver={(e) => {
          e.preventDefault();
          const rect = e.currentTarget.getBoundingClientRect();
          const ratio = (e.clientY - rect.top) / rect.height;
          const position = ratio < 0.25 ? 'before' : ratio > 0.75 ? 'after' : 'inside';
          setDragState((s) => (s.overId === item.id && s.position === position ? s : { ...s, overId: item.id, position }));
        }}
        onDrop={(e) => { e.preventDefault(); handleDrop(item); }}
        className={`group flex items-center gap-2 rounded-lg border px-2 py-2 transition ${
          isDragOver && dragState.position === 'inside' ? 'border-brand-400 bg-brand-50' : 'border-transparent hover:bg-slate-50'
        } ${isDragOver && dragState.position === 'before' ? 'border-t-2 border-t-brand-500' : ''} ${
          isDragOver && dragState.position === 'after' ? 'border-b-2 border-b-brand-500' : ''
        }`}
        style={{ paddingLeft: depth * 24 + 8 }}
      >
        <GripVertical className="h-4 w-4 shrink-0 cursor-grab text-slate-300 group-hover:text-slate-400" />
        <button
          onClick={() => hasChildren && toggleExpand(item.id)}
          className={`grid h-5 w-5 shrink-0 place-items-center rounded text-slate-400 ${hasChildren ? 'hover:bg-slate-200' : 'opacity-0'}`}
        >
          {isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
        </button>
        {item.image
          ? <img src={item.image} alt="" className="h-8 w-8 shrink-0 rounded-md object-cover" />
          : <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-brand-50 text-brand-600"><Tags className="h-4 w-4" /></span>}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-ink">{item.name}</p>
          <p className="truncate text-xs text-ink-muted">/{item.slug}{item.active === false ? ' · inactive' : ''}</p>
        </div>
        <div className="flex shrink-0 gap-1 opacity-0 transition group-hover:opacity-100">
          <button onClick={() => onAdd(item.id)} className="btn-ghost h-7 w-7 p-0" aria-label="Add subcategory"><Plus className="h-3.5 w-3.5" /></button>
          <button onClick={() => onEdit(item)} className="btn-ghost h-7 w-7 p-0" aria-label="Edit"><Pencil className="h-3.5 w-3.5" /></button>
          <button onClick={() => onDelete(item)} className="btn-ghost h-7 w-7 p-0 text-red-600 hover:bg-red-50" aria-label="Delete"><Trash2 className="h-3.5 w-3.5" /></button>
        </div>
      </div>
      {hasChildren && isExpanded && (
        <div>
          {children.map((child) => (
            <Row key={child.id} item={child} depth={depth + 1} byParent={byParent} expanded={expanded} toggleExpand={toggleExpand}
              onEdit={onEdit} onDelete={onDelete} onAdd={onAdd} dragState={dragState} setDragState={setDragState} handleDrop={handleDrop} items={items} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function CategoryTree({ items, onEdit, onDelete, onAdd, onReorder }) {
  const [expanded, setExpanded] = useState(() => new Set(items.map((i) => i.id))); // start expanded
  const [dragState, setDragState] = useState({ draggingId: null, overId: null, position: null });
  const byParent = useMemo(() => buildTree(items), [items]);
  const roots = byParent.get(null) || [];

  const toggleExpand = (id) => setExpanded((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const handleDrop = (target) => {
    const { draggingId, position } = dragState;
    setDragState({ draggingId: null, overId: null, position: null });
    if (!draggingId || String(draggingId) === String(target.id)) return;
    if (isDescendant(items, draggingId, target.id)) return; // would create a cycle

    let newParentId, siblingList;
    if (position === 'inside') {
      newParentId = target.id;
      siblingList = (byParent.get(target.id) || []).filter((i) => i.id !== draggingId);
      siblingList.push({ id: draggingId });
    } else {
      newParentId = target.parentId || null;
      siblingList = (byParent.get(newParentId) || []).filter((i) => i.id !== draggingId);
      const idx = siblingList.findIndex((i) => i.id === target.id);
      const insertAt = position === 'before' ? idx : idx + 1;
      siblingList.splice(insertAt, 0, { id: draggingId });
    }
    onReorder(siblingList.map((i, index) => ({ id: i.id, parentId: newParentId, sortOrder: index })));
  };

  if (!roots.length) return null;

  return (
    <div className="space-y-0.5" onDragOver={(e) => e.preventDefault()}>
      {roots.map((item) => (
        <Row key={item.id} item={item} depth={0} byParent={byParent} expanded={expanded} toggleExpand={toggleExpand}
          onEdit={onEdit} onDelete={onDelete} onAdd={onAdd} dragState={dragState} setDragState={setDragState} handleDrop={handleDrop} items={items} />
      ))}
    </div>
  );
}
