import json
import re
import subprocess
import sys

def get_latest_pr_comment_feedback(pr_identifier=None):
    try:
        cmd = ["gh", "pr", "view"]
        if pr_identifier:
            cmd.append(str(pr_identifier))
        cmd.extend(["--json", "comments"])
        
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            check=True
        )
        data = json.loads(result.stdout)
        comments = data.get("comments", [])
        
        for comment in reversed(comments):
            body = comment.get("body", "")
            if "🤖 Agent Verification Feedback" in body:
                match = re.search(r"```json\s*(\{.*?\})\s*```", body, re.DOTALL)
                if match:
                    return json.loads(match.group(1))
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
    pr_target = sys.argv[1] if len(sys.argv) > 1 else None
    feedback = get_latest_pr_comment_feedback(pr_target)
    if feedback:
        print(build_repair_prompt(feedback))
    else:
        print("No agent feedback comment detected.")
