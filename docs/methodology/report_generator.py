"""
report_generator.py — 改造二:带约束的报告生成

核心原则:
- 用户测评数据 = 可信事实,可自由使用
- 行业数据 = 只能从 industry_facts.json 引用,模型不得自行生成任何数字
- 引用时必须带出处,且不得超出 original_scope 放大口径

注意:本文件用伪代码 call_model() 代表你实际的大模型调用。
接入时把 call_model 换成你自己的 API 调用即可。
"""

import json
from pathlib import Path

FACTS_PATH = Path(__file__).parent.parent / "data" / "industry_facts.json"


def load_facts():
    """加载行业事实库,过滤掉过期条目。"""
    from datetime import date
    data = json.loads(FACTS_PATH.read_text(encoding="utf-8"))
    today = date.today().isoformat()
    valid, expired = [], []
    for f in data["facts"]:
        (expired if f["expires_at"] < today else valid).append(f)
    if expired:
        # 过期数据不喂给模型,但要记录告警,提醒团队复核
        print(f"[告警] {len(expired)} 条数据已过期需复核: {[f['id'] for f in expired]}")
    return valid


def select_relevant_facts(assessment, all_facts):
    """
    根据测评结果挑选相关数据条目。
    初期可以全量传入;数据多了之后,这里按行业标签/路径做筛选。
    关键:传给模型的是结构化条目,不是揉进散文的一段话。
    """
    return all_facts  # 占位:初期全量。后续按 assessment 的目标行业过滤。


def build_generation_prompt(assessment, facts):
    """构造生成 prompt。规则部分为硬性约束,不可删减。"""
    facts_block = json.dumps(facts, ensure_ascii=False, indent=2)
    assessment_block = json.dumps(assessment, ensure_ascii=False, indent=2)

    return f"""你是一位职业发展顾问,为用户生成职业罗盘报告。

# 数据使用规则(硬性约束,违反即视为错误输出)

1. 【用户测评数据】是可信事实,可直接使用、自由解读。
2. 【行业事实库】是你唯一被允许引用的行业数据来源。严禁自行生成任何
   不在库中的统计数字、百分比或外部机构结论。如果某条推理需要库里没有
   的数据,你必须如实写"此处缺乏数据支撑,以下为推断",绝不允许编造。
3. 引用任何一条行业数据时,必须在文中带上它的 source(出处全名),
   并且不得超出该条的 original_scope 做放大或外推。usage_note 字段
   里的限制是强制的,必须遵守。
4. 严禁用宏观方向数据(applies_to=macro_direction)去论证用户个人
   具体细分市场的真实付费需求。宏观数据只能说明"赛道大方向"。
5. 报告必须分三个版块,且结构上分开:
   - 【行业背景】开头注明:以下为赛道方向参考,非针对你个人的市场验证
   - 【个人画像与推理】基于测评数据
   - 【行动建议】并在每条职业推荐旁注明:本路径真实可行性,需由你自己
     的种子用户付费数据验证

# 用户测评数据(事实)
{assessment_block}

# 行业事实库(你只能引用这些)
{facts_block}

现在生成报告。"""


def generate_report(assessment):
    facts = select_relevant_facts(assessment, load_facts())
    prompt = build_generation_prompt(assessment, facts)
    report = call_model(prompt)  # ← 替换成你的实际大模型调用
    return report, facts


def call_model(prompt):
    """占位。接入时替换成你的 API 调用(如 Anthropic / 你现用的模型)。"""
    raise NotImplementedError("请把这里替换成你的实际大模型 API 调用")
