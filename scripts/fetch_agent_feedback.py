import json
import re
import subprocess
import sys

def get_latest_pr_comment_feedback():
    try:
        # واکشی کامنت‌های آخرین PR با GitHub CLI
        result = subprocess.run(
            ["gh", "pr", "view", "--json", "comments"],
            capture_output=True,
            text=True,
            check=True
        )
        data = json.loads(result.stdout)
        comments = data.get("comments", [])
        
        # جستجو از جدیدترین کامنت به قدیمی‌ترین
        for comment in reversed(comments):
            body = comment.get("body", "")
            if "🤖 Agent Verification Feedback" in body:
                # استخراج بلوک جیسون از کامنت مارک‌داون
                match = re.search(r"```json\s*(\{.*?\})\s*```", body, re.DOTALL)
                if match:
                    feedback_json = json.loads(match.group(1))
                    return feedback_json
        return None
    except Exception as e:
        print(f"Error reading PR comments: {e}", file=sys.stderr)
        return None

def build_repair_prompt(feedback):
    if not feedback:
        return "No feedback payload found."
    
    if feedback.get("status") == "passed":
        return "All automated verification gates passed. Ready to merge."
    
    test_failures = feedback.get("failed_tests", [])
    type_failures = feedback.get("type_errors", [])
    
    prompt = [
        "### AUTOMATED AUDIT FAILED - REMEDIATION REQUIRED",
        f"Instruction: {feedback.get('instruction_for_agent', 'Fix the implementation.')}",
        ""
    ]
    
    if test_failures:
        prompt.append("Failed Tests Summary:")
        for t in test_failures:
            prompt.append(f"  - {t}")
        prompt.append("")
        
    if type_failures:
        prompt.append("Type Checking & Linting Errors:")
        for err in type_failures:
            prompt.append(f"  - {err}")
        prompt.append("")
        
    prompt.append("Constraint: Do NOT touch tests/ or CI workflow files. Fix only the core logic.")
    return "\n".join(prompt)

if __name__ == "__main__":
    feedback = get_latest_pr_comment_feedback()
    if feedback:
        print(build_repair_prompt(feedback))
    else:
        print("No agent feedback comment detected on current PR.")
