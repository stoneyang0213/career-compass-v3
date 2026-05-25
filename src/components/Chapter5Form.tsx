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
import { Heart, Dumbbell, Wallet, GraduationCap, Briefcase } from "lucide-react";
import { store } from "../lib/store";
import type {
  BasicInfo, Context, Dimensions,
  EducationLevel, CareerStage, TargetLocation, IdentityRole
} from "../lib/types";

const GENDER_OPTIONS: BasicInfo["gender"][] = ["男", "女", "其他"];
const EDUCATION_LEVELS_STUDENT: EducationLevel[] = [
  "高中在读", "大学在读", "硕士在读", "博士在读"
];
const EDUCATION_LEVELS_PRO: EducationLevel[] = [
  "高中毕业", "大学毕业", "硕士毕业", "博士毕业"
];
const CAREER_STAGES_STUDENT: CareerStage[] = ["在校探索", "应届求职"];
const CAREER_STAGES_PRO: CareerStage[] = [
  "在职稳定", "考虑转型", "主动创业", "自由职业", "待业", "退休返聘"
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
  const [email, setEmail] = useState<string>("");
  const [consent, setConsent] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // hydrate from localStorage
  useEffect(() => {
    const p = store.load();
    if (p?.basic) setBasic(p.basic);
    if (p?.context) setCtx(p.context);
    if (p?.dimensions) setDim(p.dimensions);
    if (p?.email) setEmail(p.email);
    if (p?.consent) setConsent(p.consent);
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

  const identity: IdentityRole = ctx.identityRole ?? "professional";
  const isStudent = identity === "student";

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!ctx.identityRole) return setError("请选择你目前的身份(学生 / 职场)");
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

    if (!consent) return setError("请勾选'我同意匿名用于产品改进',这是生成报告的前提");

    const trimmedEmail = email.trim();
    if (trimmedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      return setError("邮箱格式不对(可以留空)");
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

    // v3.2 新增:把 email + consent 写入 store
    const p = store.load();
    if (p) {
      p.email = trimmedEmail || undefined;
      p.consent = true;
      store.save(p);
    }

    window.location.href = "/report";
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-10">
      <p className="text-sm leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
        这是最后一章。请尽量具体 — 三段自述是 AI 写出深度报告的关键,比前面所有量表加起来都重要。
      </p>

      {/* === 身份选择 (v3.2 新增) === */}
      <Section title="你目前的身份" required>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <IdentityCard
            icon={<GraduationCap size={22} />}
            label="学生"
            subtitle="高中 / 大学 / 研究生在读"
            selected={ctx.identityRole === "student"}
            onClick={() => setCtx({ ...ctx, identityRole: "student", careerStage: undefined })}
          />
          <IdentityCard
            icon={<Briefcase size={22} />}
            label="职场"
            subtitle="在职 / 求职 / 转型 / 创业"
            selected={ctx.identityRole === "professional"}
            onClick={() => setCtx({ ...ctx, identityRole: "professional", careerStage: undefined })}
          />
        </div>
      </Section>

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
              options={isStudent ? EDUCATION_LEVELS_STUDENT : EDUCATION_LEVELS_PRO}
            />
          </Field>
          {isStudent ? (
            <Field label="年级" hint="例如:高三 / 大二 / 研一">
              <Input
                value={ctx.grade ?? ""}
                onChange={(v) => setCtx({ ...ctx, grade: v || undefined })}
                placeholder="高三 / 大二 / 研一..."
              />
            </Field>
          ) : (
            <Field label="毕业年份" hint="预计或实际,如 2027">
              <Input
                type="number"
                value={ctx.graduationYear ?? ""}
                onChange={(v) => setCtx({ ...ctx, graduationYear: v ? Number(v) : undefined })}
                placeholder="2027"
              />
            </Field>
          )}
        </Row>
        <Field label="学校" hint={isStudent ? "学校名" : "含层级,如:浙江大学(985)"}>
          <Input
            value={ctx.school ?? ""}
            onChange={(v) => setCtx({ ...ctx, school: v || undefined })}
            placeholder={isStudent ? "在读学校" : "学校名 + 层级"}
          />
        </Field>
        <Field
          label={isStudent ? "专业 / 文理科" : "专业"}
          hint={isStudent ? "未定专业的高中生可填:理科 / 文科 / 未定" : "含双学位/辅修"}
        >
          <Input
            value={ctx.major ?? ""}
            onChange={(v) => setCtx({ ...ctx, major: v || undefined })}
            placeholder={isStudent ? "理科 / 文科 / 计算机..." : "专业方向"}
          />
        </Field>
      </Section>

      {/* === 工作 (仅职场显示) === */}
      {!isStudent && (
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
              placeholder="产品经理 / 设计师..."
            />
          </Field>
        </Section>
      )}

      {/* === 意向与定位 === */}
      <Section title="意向与定位" required>
        <Field label="当前阶段" required>
          <Pills
            value={ctx.careerStage}
            onChange={(v) => setCtx({ ...ctx, careerStage: v as CareerStage })}
            options={isStudent ? CAREER_STAGES_STUDENT : CAREER_STAGES_PRO}
          />
        </Field>
        <Field label={isStudent ? "目标地域(求职 / 读研)" : "目标工作地"}>
          <Pills
            value={ctx.targetLocation}
            onChange={(v) => setCtx({ ...ctx, targetLocation: v as TargetLocation })}
            options={TARGET_LOCATIONS}
          />
        </Field>
      </Section>

      {/* === 期待与约束 (学生 = 困惑点;职场 = 收入 + 约束) === */}
      {isStudent ? (
        <Section title="目前最纠结什么(可选)">
          <Field
            label="一句话说说现在最大的困惑"
            hint="例如:不知道是选交叉学科还是传统理工 / 想知道兴趣能不能当饭吃 / 高考分数刚过线...写一两句即可"
          >
            <textarea
              value={ctx.constraints ?? ""}
              onChange={(e) => setCtx({ ...ctx, constraints: e.target.value || undefined })}
              placeholder="最近最纠结的事..."
              rows={3}
              className="w-full px-3 py-2.5 rounded-md text-base resize-none focus:outline-none"
              style={{
                background: "var(--color-surface-warm)",
                border: "1.5px solid var(--color-border)",
                color: "var(--color-text-primary)"
              }}
            />
          </Field>
        </Section>
      ) : (
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
      )}

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

      {/* === 邮箱 + 同意 === */}
      <Section title="你的邮箱" required>
        <Field
          label=""
          hint="可选。报告可以备份到你的邮箱,后期我们会基于你的反馈持续优化。"
        >
          <Input
            type="email"
            value={email}
            onChange={(v) => setEmail(v)}
            placeholder="13510092636@139.com"
          />
        </Field>

        <label
          className="flex items-start gap-3 cursor-pointer p-3 rounded-md transition"
          style={{
            background: consent ? "var(--color-brand-light)" : "var(--color-surface-warm)",
            border: `1.5px solid ${consent ? "var(--color-brand)" : "var(--color-border)"}`
          }}
        >
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            className="mt-0.5 shrink-0"
            style={{ width: 18, height: 18, accentColor: "var(--color-brand)" }}
          />
          <span className="text-sm leading-relaxed" style={{ color: "var(--color-text-primary)" }}>
            把报告备份到我邮箱,并接收 Career Compass 的产品改进通知。
            <span style={{ color: "var(--color-error)" }}> *</span>
          </span>
        </label>
      </Section>

      {error && (
        <p className="text-sm font-medium" style={{ color: "var(--color-error)" }}>
          {error}
        </p>
      )}

      <div className="pt-6" style={{ borderTop: "1px solid var(--color-border-light)" }}>
        <button
          type="submit"
          disabled={!consent}
          className="px-8 py-3 text-base font-semibold rounded-md transition-opacity hover:opacity-90 cursor-pointer disabled:cursor-not-allowed"
          style={{
            background: consent ? "var(--color-brand)" : "var(--color-text-muted)",
            color: "white",
            opacity: consent ? 1 : 0.5
          }}
        >
          生成报告 →
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

function IdentityCard({
  icon,
  label,
  subtitle,
  selected,
  onClick
}: {
  icon: React.ReactNode;
  label: string;
  subtitle: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-left px-5 py-4 rounded-lg transition-all cursor-pointer hover:-translate-y-0.5"
      style={{
        background: selected ? "var(--color-brand-light)" : "var(--color-surface-warm)",
        border: `1.5px solid ${selected ? "var(--color-brand)" : "transparent"}`,
        color: "var(--color-text-primary)"
      }}
    >
      <div className="flex items-center gap-3">
        <span style={{ color: selected ? "var(--color-brand)" : "var(--color-text-muted)" }}>
          {icon}
        </span>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-base" style={{ color: selected ? "var(--color-brand)" : "var(--color-text-primary)" }}>
            {label}
          </div>
          <div className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>
            {subtitle}
          </div>
        </div>
      </div>
    </button>
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
