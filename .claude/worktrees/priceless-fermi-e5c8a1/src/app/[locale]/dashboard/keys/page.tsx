'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Eye, EyeOff, Copy, Pencil, RefreshCw, Trash2, X, Check } from 'lucide-react';
import { type ApiKey, EVAL_TYPES, getStoredKeys, saveKeys, generateApiKey } from '@/lib/mock-data';
import { cn } from '@/lib/utils';
import { useLocale } from 'next-intl';

export default function KeysPage() {
  const locale = useLocale();
  const isZh = locale.startsWith('zh');
  const t = {
    title: isZh ? 'API Key 管理' : 'API Key Management',
    createKey: isZh ? '创建 Key' : 'Create Key',
    name: isZh ? '名称' : 'Name',
    apiKey: 'API Key',
    status: isZh ? '状态' : 'Status',
    evalTypes: isZh ? '评测类型' : 'Eval Types',
    createdAt: isZh ? '创建时间' : 'Created At',
    actions: isZh ? '操作' : 'Actions',
    noData: isZh ? '暂无 API Key，点击上方按钮创建' : 'No API keys yet, click above to create one',
    hide: isZh ? '隐藏' : 'Hide',
    show: isZh ? '显示' : 'Show',
    copy: isZh ? '复制' : 'Copy',
    edit: isZh ? '编辑' : 'Edit',
    regenerate: isZh ? '重新生成' : 'Regenerate',
    confirm: isZh ? '确认' : 'Confirm',
    cancel: isZh ? '取消' : 'Cancel',
    delete: isZh ? '删除' : 'Delete',
  };
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [revealedKeys, setRevealedKeys] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    setKeys(getStoredKeys());
  }, []);

  const persist = useCallback((updated: ApiKey[]) => {
    setKeys(updated);
    saveKeys(updated);
  }, []);

  function toggleEnabled(id: string) {
    persist(keys.map(k => k.id === id ? { ...k, enabled: !k.enabled } : k));
  }

  function toggleReveal(id: string) {
    setRevealedKeys(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  async function copyKey(key: string, id: string) {
    await navigator.clipboard.writeText(key);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  function deleteKey(id: string) {
    persist(keys.filter(k => k.id !== id));
    setDeleteConfirm(null);
  }

  function refreshKey(id: string) {
    const { key, secret } = generateApiKey();
    persist(keys.map(k => k.id === id ? { ...k, key, secret } : k));
  }

  function handleCreate(newKey: ApiKey) {
    persist([...keys, newKey]);
    setShowCreate(false);
  }

  function maskKey(key: string) {
    if (key.length <= 12) return key;
    return key.slice(0, 6) + '•••' + key.slice(-4);
  }

  const evalTypeMap = Object.fromEntries(EVAL_TYPES.map(t => [t.id, t.name]));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold tracking-tight">{t.title}</h1>
      </div>

      <button
        onClick={() => setShowCreate(true)}
        className="inline-flex items-center gap-2 h-9 px-4 text-sm font-medium rounded-lg bg-foreground text-background hover:bg-foreground/90 transition-colors mb-6"
      >
        <Plus className="h-4 w-4" />
        {t.createKey}
      </button>

      {/* Table */}
      <div className="rounded-xl border border-border bg-background overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">{t.name}</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">API Key</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">{t.status}</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">{t.evalTypes}</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">{t.createdAt}</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">{t.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {keys.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-muted-foreground">
                    {t.noData}
                  </td>
                </tr>
              ) : (
                keys.map(k => (
                  <tr
                    key={k.id}
                    className={cn(
                      'hover:bg-muted/20 transition-colors',
                      !k.enabled && 'bg-muted/20 opacity-60'
                    )}
                  >
                    <td className="py-3.5 px-4 font-medium">{k.name}</td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <code className="text-xs font-mono text-muted-foreground">
                          {revealedKeys.has(k.id) ? k.key : maskKey(k.key)}
                        </code>
                        <button
                          onClick={() => toggleReveal(k.id)}
                          className="text-muted-foreground hover:text-foreground transition-colors"
                          title={revealedKeys.has(k.id) ? t.hide : t.show}
                        >
                          {revealedKeys.has(k.id) ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                        </button>
                        <button
                          onClick={() => copyKey(k.key, k.id)}
                          className="text-muted-foreground hover:text-foreground transition-colors"
                          title={t.copy}
                        >
                          {copiedId === k.id ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <button
                        onClick={() => toggleEnabled(k.id)}
                        className={cn(
                          'relative inline-flex h-5 w-9 items-center rounded-full transition-colors',
                          k.enabled ? 'bg-foreground' : 'bg-muted-foreground/30'
                        )}
                      >
                        <span
                          className={cn(
                            'inline-block h-3.5 w-3.5 transform rounded-full bg-background transition-transform',
                            k.enabled ? 'translate-x-[18px]' : 'translate-x-[3px]'
                          )}
                        />
                      </button>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex flex-wrap gap-1.5 max-w-xs">
                        {k.evalTypes.map(t => (
                          <span
                            key={t}
                            title={evalTypeMap[t] || t}
                            className="inline-block whitespace-nowrap text-[11px] px-2 py-0.5 rounded-md bg-muted text-muted-foreground border border-border/60"
                          >
                            <span className="sm:hidden">{(evalTypeMap[t] || t).slice(0, 3)}</span>
                            <span className="hidden sm:inline">{evalTypeMap[t] || t}</span>
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-muted-foreground text-xs whitespace-nowrap">
                      {new Date(k.createdAt).toLocaleString(isZh ? 'zh-CN' : 'en-US')}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {/* edit - placeholder */}}
                          className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                          title={t.edit}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => refreshKey(k.id)}
                          className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                          title={t.regenerate}
                        >
                          <RefreshCw className="h-3.5 w-3.5" />
                        </button>
                        {deleteConfirm === k.id ? (
                          <div className="flex items-center gap-1 ml-1">
                            <button
                              onClick={() => deleteKey(k.id)}
                              className="h-7 px-2 rounded text-xs font-medium bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
                            >
                              {t.confirm}
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(null)}
                              className="h-7 px-2 rounded text-xs text-muted-foreground hover:text-foreground transition-colors"
                            >
                              {t.cancel}
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirm(k.id)}
                            className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                            title={t.delete}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Modal */}
      {showCreate && (
        <CreateKeyModal
          locale={locale}
          onClose={() => setShowCreate(false)}
          onCreate={handleCreate}
          existingCount={keys.length}
        />
      )}
    </div>
  );
}

function CreateKeyModal({
  locale,
  onClose,
  onCreate,
  existingCount,
}: {
  locale: string;
  onClose: () => void;
  onCreate: (key: ApiKey) => void;
  existingCount: number;
}) {
  const isZh = locale.startsWith('zh');
  const t = {
    title: isZh ? '创建 API Key' : 'Create API Key',
    name: isZh ? '名称' : 'Name',
    namePlaceholder: isZh ? '用于标识该 Key 的备注名' : 'A display name for this key',
    evalTypes: isZh ? '评测类型' : 'Eval Types',
    cancel: isZh ? '取消' : 'Cancel',
    create: isZh ? '创建' : 'Create',
    errName: isZh ? '请输入名称' : 'Please enter a name',
    errTypes: isZh ? '请至少选择一种评测类型' : 'Please select at least one eval type',
  };
  const [name, setName] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<Set<string>>(new Set());
  const [error, setError] = useState('');

  function toggleType(id: string) {
    setSelectedTypes(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function handleCreate() {
    if (!name.trim()) {
      setError(t.errName);
      return;
    }
    if (selectedTypes.size === 0) {
      setError(t.errTypes);
      return;
    }

    const { key, secret } = generateApiKey();
    const newKey: ApiKey = {
      id: String(existingCount + 1 + Date.now()),
      name: name.trim(),
      key,
      secret,
      enabled: true,
      evalTypes: Array.from(selectedTypes),
      createdAt: new Date().toISOString(),
      lastUsedAt: null,
    };
    onCreate(newKey);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-background rounded-xl border border-border shadow-xl p-6 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold">{t.title}</h2>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-destructive/10 text-destructive text-sm px-4 py-2.5">
            {error}
          </div>
        )}

        <div className="mb-5">
          <label className="text-sm font-medium mb-1.5 block">{t.name}</label>
          <input
            type="text"
            value={name}
            onChange={e => { setName(e.target.value); setError(''); }}
            placeholder={t.namePlaceholder}
            className="w-full h-10 px-3 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-foreground/30 transition-colors placeholder:text-muted-foreground"
          />
        </div>

        <div className="mb-6">
          <label className="text-sm font-medium mb-3 block">{t.evalTypes}</label>
          <div className="grid grid-cols-2 gap-2">
            {EVAL_TYPES.map(t => (
              <label
                key={t.id}
                className={cn(
                  'flex items-center gap-2.5 px-3 py-2 rounded-lg border text-sm cursor-pointer transition-colors',
                  selectedTypes.has(t.id)
                    ? 'border-foreground/30 bg-muted/50'
                    : 'border-border hover:border-border/80 hover:bg-muted/20'
                )}
              >
                <input
                  type="checkbox"
                  checked={selectedTypes.has(t.id)}
                  onChange={() => { toggleType(t.id); setError(''); }}
                  className="h-4 w-4 rounded border-border accent-foreground"
                />
                <span className="whitespace-nowrap text-[11px] sm:text-xs" title={t.name}>
                  <span className="sm:hidden">{t.name.slice(0, 3)}</span>
                  <span className="hidden sm:inline">{t.name}</span>
                </span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="h-9 px-4 text-sm font-medium rounded-lg border border-border hover:bg-muted transition-colors"
          >
            {t.cancel}
          </button>
          <button
            onClick={handleCreate}
            className="h-9 px-4 text-sm font-medium rounded-lg bg-foreground text-background hover:bg-foreground/90 transition-colors"
          >
            {t.create}
          </button>
        </div>
      </div>
    </div>
  );
}
