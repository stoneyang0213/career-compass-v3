"""
fact_checker.py — 改造三:独立的事后校验

职责单一:只检查,不创作。
输入:生成好的报告全文 + 完整事实库
输出:一份结构化检查结果,标出报告里每个数字/外部声明是否站得住。

这一步和生成是分开的调用,目的是"职责分离"——让模型换一个身份
(校对员而非作者)重新审一遍。即使是同一个模型也有效,因为它不再
背负"把报告写流畅"的压力,只盯着事实对不对。
"""

import json


def build_check_prompt(report_text, facts):
    facts_block = json.dumps(facts, ensure_ascii=False, indent=2)
    return f"""你是一名严格的事实校对员。只做核查,不做任何创作或润色。

任务:扫描下面这份报告,提取其中出现的【每一个】数字、百分比、统计数据
和外部机构结论。对每一条,逐项判断:

a) 它能否在【事实库】中找到对应条目?(能 / 不能)
b) 如果能,报告的引用口径是否与该条目的 original_scope 一致?是否违反了
   usage_note 的限制?(一致 / 被放大 / 违反限制)
c) 是否存在用宏观数据(applies_to=macro_direction)论证个人具体细分
   市场需求的情况?(是 / 否)

任何一条出现"不能找到""被放大""违反限制""是",都标记为 NEEDS_FIX。

严格按以下 JSON 输出,不要任何额外文字:
{{
  "items": [
    {{
      "claim_in_report": "报告里的原话",
      "matched_fact_id": "对应的库条目 id,找不到填 null",
      "scope_ok": true/false,
      "macro_misused": true/false,
      "status": "OK" 或 "NEEDS_FIX",
      "reason": "判定理由"
    }}
  ],
  "overall": "PASS" 或 "FAIL",
  "summary": "一句话总结"
}}

# 事实库
{facts_block}

# 待核查的报告
{report_text}
"""


def check_report(report_text, facts):
    prompt = build_check_prompt(report_text, facts)
    raw = call_model(prompt)  # ← 替换成你的实际大模型调用
    try:
        result = json.loads(raw.strip().strip("`").replace("json", "", 1))
    except json.JSONDecodeError:
        return {"overall": "FAIL", "summary": "校验返回无法解析,需人工查看", "raw": raw}
    return result


def handle_check_result(result):
    """
    根据校验结果决定下一步。两种模式二选一:
    - 自动模式:FAIL 就把问题项打回生成环节重写(跑稳后再开启)
    - 人工模式:FAIL 先进人工审核队列(上线初期建议用这个)
    """
    if result.get("overall") == "PASS":
        return "approved"
    return "needs_human_review"  # 初期保守:有问题先给人看


def call_model(prompt):
    """占位。接入时替换成你的 API 调用。"""
    raise NotImplementedError("请把这里替换成你的实际大模型 API 调用")
