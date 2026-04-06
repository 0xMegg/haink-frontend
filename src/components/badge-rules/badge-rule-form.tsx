'use client';

import * as React from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const FIELD_OPTIONS = [
  { value: 'price', label: '가격 (price)' },
  { value: 'productName', label: '상품명 (productName)' },
  { value: 'createdDaysAgo', label: '생성일 기준 일수 (createdDaysAgo)' },
] as const;

const OPERATOR_OPTIONS = [
  { value: 'EQ', label: '=' },
  { value: 'NEQ', label: '≠' },
  { value: 'GT', label: '>' },
  { value: 'GTE', label: '≥' },
  { value: 'LT', label: '<' },
  { value: 'LTE', label: '≤' },
] as const;

const conditionSchema = z.object({
  conditionType: z.literal('PRODUCT_FIELD'),
  field: z.string().min(1, '필드를 선택하세요'),
  operator: z.string().min(1, '연산자를 선택하세요'),
  value: z.string().min(1, '값을 입력하세요'),
});

const badgeRuleFormSchema = z.object({
  name: z.string().min(1, '규칙명을 입력하세요'),
  badgeLabel: z.string().min(1, '배지 라벨을 입력하세요'),
  priority: z.number().int().min(0),
  displayStartAt: z.string().optional(),
  displayEndAt: z.string().optional(),
  conditions: z.array(conditionSchema).min(1, '조건을 1개 이상 추가하세요'),
});

type BadgeRuleFormValues = z.infer<typeof badgeRuleFormSchema>;

const selectClassName =
  'flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2';

interface BadgeRuleFormProps {
  onCreated: () => void;
}

export function BadgeRuleForm({ onCreated }: BadgeRuleFormProps) {
  const [isSubmitting, setSubmitting] = React.useState(false);

  const form = useForm<BadgeRuleFormValues>({
    resolver: zodResolver(badgeRuleFormSchema),
    defaultValues: {
      name: '',
      badgeLabel: '',
      priority: 0,
      displayStartAt: '',
      displayEndAt: '',
      conditions: [{ conditionType: 'PRODUCT_FIELD', field: '', operator: '', value: '' }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'conditions',
  });

  const handleSubmit = form.handleSubmit(async (values) => {
    try {
      setSubmitting(true);
      const body = {
        name: values.name,
        badgeLabel: values.badgeLabel,
        badgeType: 'TEXT',
        priority: values.priority,
        displayStartAt: values.displayStartAt || null,
        displayEndAt: values.displayEndAt || null,
        conditions: values.conditions.map((c, index) => ({
          conditionType: c.conditionType,
          operator: c.operator,
          valueJson: { field: c.field, value: c.value },
          sortOrder: index,
        })),
      };

      const res = await fetch('/api/badge-rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? '규칙 생성에 실패했습니다.');
      }

      toast.success('배지 규칙이 생성되었습니다.');
      form.reset();
      onCreated();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : '알 수 없는 오류';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  });

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border p-4">
      <h3 className="text-lg font-semibold">새 배지 규칙 생성</h3>

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="규칙명" required>
          <Input placeholder="예: 신상품 NEW 배지" {...form.register('name')} />
          <FormError message={form.formState.errors.name?.message} />
        </Field>

        <Field label="배지 라벨" required>
          <Input placeholder="예: NEW, SALE" {...form.register('badgeLabel')} />
          <FormError message={form.formState.errors.badgeLabel?.message} />
        </Field>

        <Field label="우선순위">
          <Input type="number" min={0} step={1} {...form.register('priority', { valueAsNumber: true })} />
          <FormError message={form.formState.errors.priority?.message} />
        </Field>

        <div />

        <Field label="표시 시작일">
          <Input type="datetime-local" {...form.register('displayStartAt')} />
        </Field>

        <Field label="표시 종료일">
          <Input type="datetime-local" {...form.register('displayEndAt')} />
        </Field>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>조건</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => append({ conditionType: 'PRODUCT_FIELD', field: '', operator: '', value: '' })}
          >
            조건 추가
          </Button>
        </div>
        <FormError message={form.formState.errors.conditions?.message} />

        {fields.map((field, index) => (
          <div key={field.id} className="flex items-start gap-2">
            <select
              className={selectClassName}
              {...form.register(`conditions.${index}.field`)}
            >
              <option value="">필드 선택</option>
              {FIELD_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>

            <select
              className={selectClassName}
              {...form.register(`conditions.${index}.operator`)}
            >
              <option value="">연산자</option>
              {OPERATOR_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>

            <Input
              placeholder="값"
              {...form.register(`conditions.${index}.value`)}
            />

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => remove(index)}
              disabled={fields.length <= 1}
              className="shrink-0"
            >
              삭제
            </Button>
          </div>
        ))}
      </div>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? '생성 중...' : '규칙 생성'}
      </Button>
    </form>
  );
}

function Field({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) {
  return (
    <div className="flex flex-col gap-2">
      <Label>
        {label}
        {required ? <span className="ml-1 text-destructive">*</span> : null}
      </Label>
      {children}
    </div>
  );
}

function FormError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-sm text-destructive">{message}</p>;
}
