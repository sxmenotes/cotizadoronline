import React, { useState } from 'react';
import { useSettingsStore } from '../../store/settingsStore';
import {
  Button,
  Card,
  SectionHeader,
  Select,
  Textarea,
  Input,
  Badge,
  toast,
} from '../../ui';
import type { ContentBlock, ProjectType, TermsContent } from '../../domain/types';
import { validateTokens, resolveTokens } from '../../domain/tokens';
import { AlertCircle, Trash2, Eye } from 'lucide-react';

export const TermsTab: React.FC = () => {
  const { terms, catalog, updateTerms } = useSettingsStore();
  const [selectedPageIndex, setSelectedPageIndex] = useState<number>(0);
  const [selectedSectionIndex, setSelectedSectionIndex] = useState<number>(0);

  const currentPage = terms.pages[selectedPageIndex];
  const currentSection = currentPage?.sections[selectedSectionIndex];

  // Estado temporal de edición
  const [editingBlockIndex, setEditingBlockIndex] = useState<number | null>(null);
  const [blockDraft, setBlockDraft] = useState<ContentBlock | null>(null);

  const availableTokens = [
    { token: '{{build:<planId>}}', desc: 'Precio construcción (ej: {{build:landingPlus}})' },
    { token: '{{sale:<planId>}}', desc: 'Precio venta (ej: {{sale:landingFull}})' },
    { token: '{{sub:<subId>}}', desc: 'Precio mensual suscripción (ej: {{sub:basico}})' },
    { token: '{{hosting}}', desc: 'Precio mensual del hosting' },
    { token: '{{extraPage}}', desc: 'Precio de página adicional' },
    { token: '{{pages:<planId>}}', desc: 'Páginas incluidas del plan' },
    { token: '{{deposit%}}', desc: 'Porcentaje de abono (ej: 50%)' },
    { token: '{{days}}', desc: 'Plazo en días hábiles (ej: 8)' },
  ];

  const handleStartEdit = (index: number) => {
    const block = currentSection?.blocks[index];
    if (!block) return;
    setEditingBlockIndex(index);
    setBlockDraft(JSON.parse(JSON.stringify(block)));
  };

  const handleSaveBlock = async () => {
    if (editingBlockIndex === null || !blockDraft || !currentPage || !currentSection) return;

    // Si es tipo texto o callout, validar tokens
    if (blockDraft.type === 'paragraph' || blockDraft.type === 'callout') {
      const validation = validateTokens(blockDraft.content, catalog);
      if (!validation.isValid) {
        toast.error(`Error de tokens: ${validation.errors.join(', ')}`);
        return;
      }
    }

    const updatedTerms: TermsContent = JSON.parse(JSON.stringify(terms));
    const page = updatedTerms.pages[selectedPageIndex];
    const sec = page?.sections[selectedSectionIndex];
    if (!sec) return;

    sec.blocks[editingBlockIndex] = blockDraft;
    await updateTerms(updatedTerms);

    setEditingBlockIndex(null);
    setBlockDraft(null);
    toast.success('Bloque normativo actualizado');
  };

  const handleDeleteBlock = async (index: number) => {
    const updatedTerms: TermsContent = JSON.parse(JSON.stringify(terms));
    const page = updatedTerms.pages[selectedPageIndex];
    const sec = page?.sections[selectedSectionIndex];
    if (!sec) return;

    sec.blocks.splice(index, 1);
    await updateTerms(updatedTerms);
    toast.success('Bloque eliminado');
  };

  const handleAddBlock = async (type: ContentBlock['type']) => {
    const updatedTerms: TermsContent = JSON.parse(JSON.stringify(terms));
    const page = updatedTerms.pages[selectedPageIndex];
    const sec = page?.sections[selectedSectionIndex];
    if (!sec) return;

    let newBlock: ContentBlock;
    if (type === 'paragraph') {
      newBlock = { type: 'paragraph', content: 'Nuevo párrafo de condiciones.' };
    } else if (type === 'callout') {
      newBlock = { type: 'callout', content: 'Nota importante o ejemplo para el cliente.' };
    } else if (type === 'list') {
      newBlock = { type: 'list', items: ['Punto 1', 'Punto 2'] };
    } else if (type === 'tags') {
      newBlock = { type: 'tags', tags: ['Etiqueta 1', 'Etiqueta 2'] };
    } else if (type === 'catalogTable') {
      newBlock = { type: 'catalogTable', source: 'plans' };
    } else {
      newBlock = {
        type: 'table',
        rows: [
          ['Columna 1', 'Columna 2'],
          ['Dato A', 'Dato B'],
        ],
      };
    }

    sec.blocks.push(newBlock);
    await updateTerms(updatedTerms);
    toast.success('Bloque agregado');
  };

  return (
    <div className="flex flex-col gap-8">
      <SectionHeader
        eyebrow="Términos & Condiciones"
        title="Cláusulas y Textos Normativos"
        description="Gestiona el contenido estructurado de las páginas normativas del documento PDF."
      />

      {/* Selector de página y sección */}
      <div className="flex flex-wrap items-center gap-4 border-b border-hairline pb-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold tracking-wider text-ink-muted uppercase">
            Página PDF:
          </span>
          <div className="flex gap-1">
            {terms.pages.map((p, idx) => (
              <Button
                key={p.pageNumber}
                variant={selectedPageIndex === idx ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => {
                  setSelectedPageIndex(idx);
                  setSelectedSectionIndex(0);
                  setEditingBlockIndex(null);
                }}
              >
                Pág. {p.pageNumber}
              </Button>
            ))}
          </div>
        </div>

        {currentPage && currentPage.sections.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold tracking-wider text-ink-muted uppercase">
              Sección:
            </span>
            <div className="flex gap-1">
              {currentPage.sections.map((sec, idx) => (
                <Button
                  key={sec.id}
                  variant={selectedSectionIndex === idx ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => {
                    setSelectedSectionIndex(idx);
                    setEditingBlockIndex(null);
                  }}
                >
                  {sec.title || `Sección ${idx + 1}`}
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Referencia de Tokens disponibles */}
      <Card className="p-4 bg-navy-50/50 border-navy-100">
        <div className="flex items-start gap-2 text-xs text-navy-900">
          <AlertCircle className="h-4 w-4 text-navy-600 shrink-0 mt-0.5" />
          <div>
            <strong>Gramática de Tokens Dinámicos:</strong> En los textos normativos,
            los montos y parámetros nunca deben escribirse de forma estática. Usa tokens:
            <div className="mt-2 grid grid-cols-1 gap-1.5 sm:grid-cols-2 lg:grid-cols-4 font-mono text-[11px]">
              {availableTokens.map((t) => (
                <div key={t.token} className="rounded bg-white p-1.5 border border-hairline">
                  <span className="text-navy-700 font-bold">{t.token}</span>
                  <p className="text-ink-muted text-[10px]">{t.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Lista de bloques de la sección activa */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="font-serif text-lg font-semibold text-navy-900">
            {currentSection?.title || 'Contenido de la Sección'}
          </h3>

          <div className="flex items-center gap-2">
            <span className="text-xs text-ink-muted">Agregar bloque:</span>
            <Button variant="secondary" size="sm" onClick={() => handleAddBlock('paragraph')}>
              + Párrafo
            </Button>
            <Button variant="secondary" size="sm" onClick={() => handleAddBlock('callout')}>
              + Destacado
            </Button>
            <Button variant="secondary" size="sm" onClick={() => handleAddBlock('tags')}>
              + Tags
            </Button>
          </div>
        </div>

        {currentSection?.blocks.map((block, bIdx) => {
          const isEditing = editingBlockIndex === bIdx;

          return (
            <Card key={bIdx} className="p-5 flex flex-col gap-3">
              <div className="flex items-center justify-between border-b border-hairline pb-2">
                <div className="flex items-center gap-2">
                  <Badge variant="default" size="sm">
                    {block.type}
                  </Badge>
                  {block.showWhen?.projectType && (
                    <Badge variant="navy" size="sm">
                      Solo {block.showWhen.projectType}
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {!isEditing ? (
                    <>
                      <Button variant="secondary" size="sm" onClick={() => handleStartEdit(bIdx)}>
                        Editar
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteBlock(bIdx)}
                        className="text-danger hover:bg-red-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button variant="ghost" size="sm" onClick={() => setEditingBlockIndex(null)}>
                        Cancelar
                      </Button>
                      <Button variant="primary" size="sm" onClick={handleSaveBlock}>
                        Guardar
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {/* Modo Edición */}
              {isEditing && blockDraft ? (
                <div className="flex flex-col gap-4 py-2">
                  <div className="flex items-center gap-4">
                    <span className="text-xs font-semibold text-ink-muted">Mostrar solo si:</span>
                    <Select
                      className="w-48"
                      value={blockDraft.showWhen?.projectType || 'all'}
                      onChange={(e) => {
                        const val = e.target.value as ProjectType | 'all';
                        setBlockDraft({
                          ...blockDraft,
                          showWhen: val === 'all' ? undefined : { projectType: val },
                        });
                      }}
                      options={[
                        { value: 'all', label: 'Siempre visible' },
                        { value: 'construccion', label: 'Solo Construcción' },
                        { value: 'venta', label: 'Solo Venta con código' },
                      ]}
                    />
                  </div>

                  {(blockDraft.type === 'paragraph' || blockDraft.type === 'callout') && (
                    <div className="flex flex-col gap-2">
                      <Textarea
                        rows={4}
                        value={blockDraft.content}
                        onChange={(e) =>
                          setBlockDraft({ ...blockDraft, content: e.target.value })
                        }
                      />
                      {/* Validación de tokens en vivo */}
                      {(() => {
                        const val = validateTokens(blockDraft.content, catalog);
                        if (!val.isValid) {
                          return (
                            <p className="text-xs text-danger font-medium">
                              ⚠️ Error en tokens: {val.errors.join(', ')}
                            </p>
                          );
                        }
                        return (
                          <div className="mt-2 rounded bg-paper p-2.5 text-xs text-ink-muted">
                            <span className="font-semibold text-navy-700 flex items-center gap-1 mb-1">
                              <Eye className="h-3.5 w-3.5" /> Vista previa con tokens resueltos:
                            </span>
                            <p>
                              {resolveTokens(blockDraft.content, {
                                catalog,
                                currency: 'CLP',
                              })}
                            </p>
                          </div>
                        );
                      })()}
                    </div>
                  )}

                  {blockDraft.type === 'tags' && (
                    <Input
                      label="Etiquetas (separadas por comas)"
                      value={blockDraft.tags.join(', ')}
                      onChange={(e) =>
                        setBlockDraft({
                          ...blockDraft,
                          tags: e.target.value.split(',').map((t) => t.trim()),
                        })
                      }
                    />
                  )}
                </div>
              ) : (
                /* Modo Lectura */
                <div className="text-sm text-ink leading-relaxed">
                  {(block.type === 'paragraph' || block.type === 'callout') && (
                    <div className={block.type === 'callout' ? 'rounded bg-paper-2 p-3 border-l-2 border-navy-700 font-medium' : ''}>
                      <p>{block.content}</p>
                      <p className="mt-1 text-xs text-ink-muted italic">
                        Resolución:{' '}
                        {resolveTokens(block.content, { catalog, currency: 'CLP' })}
                      </p>
                    </div>
                  )}

                  {block.type === 'list' && (
                    <ul className="list-disc pl-5 space-y-1">
                      {block.items.map((it, i) => (
                        <li key={i}>{it}</li>
                      ))}
                    </ul>
                  )}

                  {block.type === 'tags' && (
                    <div className="flex flex-wrap gap-1.5">
                      {block.tags.map((tg, i) => (
                        <Badge key={i} variant="navy">
                          {tg}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {block.type === 'table' && (
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left border-collapse">
                        <tbody>
                          {block.rows.map((row, rI) => (
                            <tr key={rI} className="border-b border-hairline">
                              {row.map((cell, cI) => (
                                <td key={cI} className="p-2">
                                  {cell}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {block.type === 'catalogTable' && (
                    <p className="text-xs text-navy-700 italic font-medium">
                      📊 Tabla generada automáticamente desde el catálogo ({block.source})
                    </p>
                  )}
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
};
