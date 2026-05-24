"""
pipeline.py — 主流程:把改造一二三串起来

数据流:
  用户测评数据
      │
      ▼
  [改造一] 加载结构化事实库(过期的自动剔除并告警)
      │
      ▼
  [改造二] 带约束生成报告(模型只能引用库内数据)
      │
      ▼
  [改造三] 独立校验(换"校对员"身份重审一遍)
      │
      ▼
  PASS → 出报告   /   FAIL → 人工审核(或自动重写)
"""

from core.report_generator import generate_report
from core.fact_checker import check_report, handle_check_result


def run(assessment):
    # 改造一 + 二:生成
    report, used_facts = generate_report(assessment)

    # 改造三:校验
    check = check_report(report, used_facts)
    decision = handle_check_result(check)

    return {
        "report": report,
        "check_result": check,
        "decision": decision,   # "approved" 或 "needs_human_review"
    }


if __name__ == "__main__":
    # 示例:用一份测评数据跑一遍
    demo_assessment = {
        "name": "stone",
        "age": 39,
        "mbti": "INFP",
        "holland": "ISR",
        "values_top3": ["创造发明", "成就动机", "独立自主"],
        "stage": "主动创业",
        "target_city": "一线城市",
        "salary_expectation": "30-47万",
    }
    result = run(demo_assessment)
    print(result["decision"])
