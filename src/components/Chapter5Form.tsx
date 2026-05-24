// ============================================================
// Career Compass v3 · 章 5 「深度反思」表单
//
// 整合 basic + context + dimensions 三段为单页表单。
// 与 v2 的差异:
//   1. emoji icon 全部换 Lucide React(SKILL 强制约束)
//   2. 视觉走 v3 design token(罗盘蓝 + 暖白 + Inter/Noto Sans SC)
//   3. 表单完成后跳 /report(v2 是 onChapterDone 回调,v3 直接 router 跳转)
// ============================================================

import { useEffect, useState } from "react";
import { Heart, Dumbbell, Wallet } from "lucide-react";
import { store } from "../lib/store";
import type {
  BasicInfo, Context, Dimensions,
  EducationLevel, CareerStage, TargetLocation
} from "../lib/types";

const GENDER_OPTIONS: BasicInfo["gender"][] = ["男", "女", "其他"];
const EDUCATION_LEVELS: EducationLevel[] = [
  "高中在读", "高中毕业", "大学在读", "大学毕业",
  "硕士在读", "硕士毕业", "博士在读", "博士毕业"
];
const CAREER_STAGES: CareerStage[] = [
  "在校探索", "应届求职", "在职稳定", "考虑转型",
  "主动创业", "自由职业", "待业", "退休返聘"
];
const TARGET_LOCATIONS: TargetLocation[] = [
  "一线（北上广深）", "新一线（杭州/成都/武汉等）",
  "二线", "三四线", "海外", "远程", "不限"
];
const MIN_CHARS = 50;

export default function Chapter5Form() {
  const [basic, setBasic] = useState<Partial<BasicInfo>>({});
  const [ctx, setCtx] = useState<Context>({});
  const [dim, setDim] = useState<Partial<Dimensions>>({});
  const [error, setError] = useState<string | null>(null);

  // hydrate from localStorage
  useEffect(() => {
    const p = store.load();
    if (p?.basic) setBasic(p.basic);
    if (p?.context) setCtx(p.context);
    if (p?.dimensions) setDim(p.dimensions);
  }, []);

  const dimChars = {
    passion: (dim.passion ?? "").trim().length,
    strength: (dim.strength ?? "").trim().length,
    value: (dim.value ?? "").trim().length
  };
  const dimAllOk =
    dimChars.passion >= MIN_CHARS &&
    dimChars.strength >= MIN_CHARS &&
    dimChars.value >= MIN_CHARS;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!basic.name?.trim()) return setError("请填写姓名");
    const age = Number(basic.age);
    if (!age || age < 12 || age > 80) return setError("请填写 12-80 之间的年龄");
    if (!ctx.careerStage) return setError("请选择当前的职业阶段");

    if (!dimAllOk) {
      const missing = (["passion", "strength", "value"] as const)
        .filter((k) => dimChars[k] < MIN_CHARS)
        .map((k) => ({ passion: "择己所爱", strength: "择己所长", value: "择己所利" }[k]))
        .join(" / ");
      return setError(`三段自述每段需 ≥ ${MIN_CHARS} 字,还差:${missing}`);
    }

    const finalBasic: BasicInfo = { name: basic.name.trim(), age, gender: basic.gender };
    const finalDim: Dimensions = {
      passion: dim.passion!.trim(),
      strength: dim.strength!.trim(),
      value: dim.value!.trim()
    };
    store.completeModule("basic", "basic", finalBasic);
    store.completeModule("context", "context", ctx);
    store.completeModule("dimensions", "dimensions", finalDim);

    // 跳报告页
    window.location.href = "/report";
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-10">
      <p className="text-sm leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
        这是最后一章。请尽量具体 — 三段自述是 AI 写出深度报告的关键,比前面所有量表加起来都重要。
      </p>

      {/* === 基本信息 === */}
      <Section title="基本信息" required>
        <Field label="你希望我们怎么称呼你?" required>
          <Input
            value={basic.name ?? ""}
            onChange={(v) => setBasic({ ...basic, name: v })}
            placeholder="姓名 / 昵称"
          />
        </Field>
        <Row>
          <Field label="年龄" required hint="数字即可,例如 28">
            <Input
              type="number"
              value={basic.age ?? ""}
              onChange={(v) => setBasic({ ...basic, age: v ? Number(v) : undefined })}
              placeholder="年龄"
            />
          </Field>
          <Field label="性别(可选)">
            <Pills
              value={basic.gender}
              onChange={(v) => setBasic({ ...basic, gender: v as BasicInfo["gender"] })}
              options={GENDER_OPTIONS as readonly string[]}
            />
          </Field>
        </Row>
      </Section>

      {/* === 教育 === */}
      <Section title="教育">
        <Row>
          <Field label="当前阶段">
            <Select
              value={ctx.educationLevel ?? ""}
              onChange={(v) => setCtx({ ...ctx, educationLevel: (v || undefined) as EducationLevel })}
              options={EDUCATION_LEVELS}
            />
          </Field>
          <Field label="毕业年份" hint="预计或实际,如 2027">
            <Input
              type="number"
              value={ctx.graduationYear ?? ""}
              onChange={(v) => setCtx({ ...ctx, graduationYear: v ? Number(v) : undefined })}
              placeholder="2027"
            />
          </Field>
        </Row>
        <Field label="学校" hint="含层级,如:浙江大学(985)">
          <Input
            value={ctx.school ?? ""}
            onChange={(v) => setCtx({ ...ctx, school: v || undefined })}
            placeholder="学校名 + 层级"
          />
        </Field>
        <Field label="专业" hint="含双学位/辅修">
          <Input
            value={ctx.major ?? ""}
            onChange={(v) => setCtx({ ...ctx, major: v || undefined })}
            placeholder="专业方向"
          />
        </Field>
      </Section>

      {/* === 工作 === */}
      <Section title="工作">
        <Row>
          <Field label="工作年限" hint="应届填 0">
            <Input
              type="number"
              value={ctx.workYears ?? ""}
              onChange={(v) => setCtx({ ...ctx, workYears: v ? Number(v) : undefined })}
              placeholder="0"
            />
          </Field>
          <Field label="当前行业">
            <Input
              value={ctx.currentIndustry ?? ""}
              onChange={(v) => setCtx({ ...ctx, currentIndustry: v || undefined })}
              placeholder="互联网 / 教育..."
            />
          </Field>
        </Row>
        <Field label="当前角色">
          <Input
            value={ctx.currentRole ?? ""}
            onChange={(v) => setCtx({ ...ctx, currentRole: v || undefined })}
            placeholder="产品经理 / 大三学生..."
          />
        </Field>
      </Section>

      {/* === 意向 === */}
      <Section title="意向与定位" required>
        <Field label="当前职业阶段" required>
          <Pills
            value={ctx.careerStage}
            onChange={(v) => setCtx({ ...ctx, careerStage: v as CareerStage })}
            options={CAREER_STAGES}
          />
        </Field>
        <Field label="目标工作地">
          <Pills
            value={ctx.targetLocation}
            onChange={(v) => setCtx({ ...ctx, targetLocation: v as TargetLocation })}
            options={TARGET_LOCATIONS}
          />
        </Field>
      </Section>

      {/* === 期待与约束(可选) === */}
      <Section title="期待与约束(可选)">
        <Row>
          <Field label="可接受最低年薪(万元)">
            <Input
              type="number"
              value={ctx.incomeFloor ?? ""}
              onChange={(v) => setCtx({ ...ctx, incomeFloor: v ? Number(v) : undefined })}
              placeholder="15"
            />
          </Field>
          <Field label="理想年薪(万元)">
            <Input
              type="number"
              value={ctx.incomeTarget ?? ""}
              onChange={(v) => setCtx({ ...ctx, incomeTarget: v ? Number(v) : undefined })}
              placeholder="50"
            />
          </Field>
        </Row>
        <Field label="其他约束" hint="家庭 / 健康 / 时间 / 签证身份">
          <textarea
            value={ctx.constraints ?? ""}
            onChange={(e) => setCtx({ ...ctx, constraints: e.target.value || undefined })}
            placeholder="如:H1B 抽签限制;家有老人需照顾..."
            rows={2}
            className="w-full px-3 py-2.5 rounded-md text-base resize-none focus:outline-none"
            style={{
              background: "var(--color-surface-warm)",
              border: "1.5px solid var(--color-border)",
              color: "var(--color-text-primary)"
            }}
          />
        </Field>
      </Section>

      {/* === 三段自述 (必填) === */}
      <Section title={`三段自述(每段 ≥ ${MIN_CHARS} 字)`} required>
        <DimField
          icon={<Heart size={20} style={{ color: "var(--color-brand)" }} />}
          label="择己所爱(兴趣与热情)"
          placeholder="什么活动 / 主题让你感到有内驱力、能进入心流?说说你最想做、做了不嫌累的事..."
          value={dim.passion ?? ""}
          onChange={(v) => setDim({ ...dim, passion: v })}
          chars={dimChars.passion}
        />
        <DimField
          icon={<Dumbbell size={20} style={{ color: "var(--color-brand)" }} />}
          label="择己所长(技能与优势)"
          placeholder="你最强的硬技能与软技能是什么?举一个具体成就案例(项目/作品/事件)..."
          value={dim.strength ?? ""}
          onChange={(v) => setDim({ ...dim, strength: v })}
          chars={dimChars.strength}
        />
        <DimField
          icon={<Wallet size={20} style={{ color: "var(--color-brand)" }} />}
          label="择己所利(个人与财务目标)"
          placeholder="你对收入、生活方式、职业发展有什么期待?理想的工作日常 / 五年画像 / 不愿妥协的底线..."
          value={dim.value ?? ""}
          onChange={(v) => setDim({ ...dim, value: v })}
          chars={dimChars.value}
        />
      </Section>

      {error && (
        <p className="text-sm font-medium" style={{ color: "var(--color-error)" }}>
          {error}
        </p>
      )}

      <div className="pt-6" style={{ borderTop: "1px solid var(--color-border-light)" }}>
        <button
          type="submit"
          className="px-8 py-3 text-base font-semibold rounded-md transition-opacity hover:opacity-90 cursor-pointer"
          style={{ background: "var(--color-brand)", color: "white" }}
        >
          完成测评 →
        </button>
      </div>
    </form>
  );
}

// ─── 子组件 ───────────────────────────────────────────────────

function Section({
  title,
  required,
  children
}: {
  title: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-5">
      <h2
        className="text-xs tracking-widest uppercase font-semibold"
        style={{ color: "var(--color-text-muted)" }}
      >
        {title}
        {required && <span style={{ color: "var(--color-error)", marginLeft: "0.25rem" }}>*</span>}
      </h2>
      {children}
    </div>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 md:grid-cols-2 gap-6">{children}</div>;
}

function Field({
  label,
  hint,
  required,
  children
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        className="block text-sm font-medium mb-1"
        style={{ color: "var(--color-text-primary)" }}
      >
        {label}
        {required && <span style={{ color: "var(--color-error)", marginLeft: "0.25rem" }}>*</span>}
      </label>
      {hint && (
        <p className="text-xs mb-2" style={{ color: "var(--color-text-muted)" }}>
          {hint}
        </p>
      )}
      <div>{children}</div>
    </div>
  );
}

function Input({
  type = "text",
  value,
  onChange,
  placeholder
}: {
  type?: string;
  value: string | number;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-3 py-2.5 rounded-md text-base focus:outline-none"
      style={{
        background: "var(--color-surface-warm)",
        border: "1.5px solid var(--color-border)",
        color: "var(--color-text-primary)"
      }}
    />
  );
}

function Select({
  value,
  onChange,
  options
}: {
  value: string;
  onChange: (v: string) => void;
  options: readonly string[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-3 py-2.5 rounded-md text-base focus:outline-none cursor-pointer"
      style={{
        background: "var(--color-surface-warm)",
        border: "1.5px solid var(--color-border)",
        color: "var(--color-text-primary)"
      }}
    >
      <option value="">请选择...</option>
      {options.map((opt) => (
        <option key={opt} value={opt}>
          {opt}
        </option>
      ))}
    </select>
  );
}

function Pills<T extends string>({
  value,
  onChange,
  options
}: {
  value?: T;
  onChange: (v: T) => void;
  options: readonly string[];
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const selected = value === opt;
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt as T)}
            className="px-3 py-1.5 rounded-md text-sm transition cursor-pointer"
            style={{
              background: selected ? "var(--color-brand)" : "var(--color-surface-warm)",
              color: selected ? "white" : "var(--color-text-secondary)",
              border: `1.5px solid ${selected ? "var(--color-brand)" : "transparent"}`
            }}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}

function DimField({
  icon,
  label,
  placeholder,
  value,
  onChange,
  chars
}: {
  icon: React.ReactNode;
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  chars: number;
}) {
  const ok = chars >= MIN_CHARS;
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label
          className="flex items-center gap-2 text-sm font-medium"
          style={{ color: "var(--color-text-primary)" }}
        >
          {icon}
          {label}
          <span style={{ color: "var(--color-error)" }}>*</span>
        </label>
        <span
          className="text-xs"
          style={{ color: ok ? "var(--color-success)" : "var(--color-text-muted)" }}
        >
          {chars} / {MIN_CHARS}
          {ok && " ✓"}
        </span>
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={4}
        className="w-full px-3 py-2.5 rounded-md text-base resize-none focus:outline-none leading-relaxed"
        style={{
          background: "var(--color-surface-warm)",
          border: `1.5px solid ${ok ? "var(--color-brand-light)" : "var(--color-border)"}`,
          color: "var(--color-text-primary)"
        }}
      />
    </div>
  );
}
