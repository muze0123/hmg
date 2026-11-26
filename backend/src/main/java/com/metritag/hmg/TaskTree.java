package com.metritag.hmg;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

/** One tenant-scoped aggregate. All changes require an aggregate version. */
public class TaskTree {
 public String id;
 public String name;
 public String vehicleId;
 public String workflowVersion;
 public Node root;
 /** Persists through resubmission until the owner confirms execution configuration. */
 public boolean descendantsPaused;
 public List<History> history = new ArrayList<>();

 /**
  * Kernel lifecycle. The first five states are the original execution core; the last three
  * close the gap to the front-end canonical statuses (submitting / withdrawn / voided).
  * Every state has a real transition — none is a cosmetic alias.
  */
 public enum State { PENDING, SUBMITTING, ACTIVE, REVIEWING, REJECTED, COMPLETED, WITHDRAWN, VOIDED }
 public enum Level { MAIN, SECTION, SUBTASK }
 public enum Kind { VEHICLE, TECHNICAL, TESTING, REPORT, CERTIFICATE }
 public record History(String nodeId, String action, String actor, String comment, Instant time) {}

 /** Front-end canonical status codes (shared/taskLifecycle.ts), lower case. */
 public enum FrontendStatus { PENDING, SUBMITTING, ACTIVE, REVIEWING, COMPLETED, REJECTED, WITHDRAWN, VOIDED }

 public static class Node {
  public String id = UUID.randomUUID().toString();
  public Level level;
  public Kind kind;
  public String regulationId;
  public String templateVersionId;
  public String executor;
  public List<String> reviewers = new ArrayList<>();
  public int reviewStep;
  public State state = State.PENDING;
  public String valuesJson = "{}";
  public TemplateSchema templateSnapshot;
  public List<Node> children = new ArrayList<>();
  /** Platform workflow instance this node's review is bound to; null for local-only tasks. */
  public String workflowInstanceId;
  /** Workflow definition version captured when review entered. */
  public String workflowRevision;
  /** Identifier the platform must quote in its next approval callback. */
  public String approvalId;
 }

 public boolean isPaused(Node node) {
  return node != null && node != root && (descendantsPaused || root.state == State.WITHDRAWN)
   && node.state != State.COMPLETED && node.state != State.VOIDED;
 }
 public void requireAvailable(Node node) { require(!isPaused(node), "Main task withdrawn; task is paused"); }
 public Node node(String id) { return find(root, id); }
 private Node find(Node current, String id) {
  if (current.id.equals(id)) return current;
  for (Node child : current.children) {
   Node result = find(child, id);
   if (result != null) return result;
  }
  return null;
 }

 /** Enter the editable draft state. Gives the front-end "submitting" a real business action. */
 public void submitDraft(Node node, String actor) {
  requireAvailable(node);
  require(node.executor.equals(actor), "Only the assigned executor may start submission");
  require(node.state == State.ACTIVE || node.state == State.REJECTED || node.state == State.WITHDRAWN,
   "Only an editable task may enter draft submission");
  node.state = State.SUBMITTING;
  record(node, "SUBMIT_DRAFT", actor, "");
 }

 public void submit(Node node, String actor) {
  requireAvailable(node);
  require(node.executor.equals(actor), "Only the assigned executor may submit");
  require(node.state == State.ACTIVE || node.state == State.REJECTED || node.state == State.SUBMITTING
   || node.state == State.WITHDRAWN, "Task cannot be submitted");
  if (node.level != Level.SUBTASK) {
   require(!node.children.isEmpty(), "Task configuration is required");
   require(node.children.stream().allMatch(n -> n.state == State.COMPLETED), "Child approvals are incomplete");
  }
  node.reviewStep = 0;
  node.state = State.REVIEWING;
  if (node.workflowRevision == null) node.workflowRevision = workflowVersion;
  if (node.workflowInstanceId != null || node.workflowRevision != null) node.approvalId = approvalId(node);
  record(node, "SUBMIT", actor, "");
 }

 /** Executor recalls a submitted/reviewing task. Approved history is preserved. */
 public void withdraw(Node node, String actor) {
  requireAvailable(node);
  require(node.executor.equals(actor), "Only the assigned executor may withdraw");
  require(node.state == State.REVIEWING || node.state == State.SUBMITTING,
   "Only a submitted task may be withdrawn");
  require(node.reviewStep == 0, "A task with approvals cannot be withdrawn");
  node.state = State.WITHDRAWN;
  if (node == root) descendantsPaused = true;
  node.approvalId = null;
  record(node, "WITHDRAW", actor, "");
 }

 /** Owner voids a task that has not been approved. Terminal. */
 public void voidTask(Node node, String actor) {
  require(node.level == Level.MAIN, "Only a main task can be voided");
  require(node.executor.equals(actor), "Only the task owner may void");
  require(node.state == State.PENDING || node.state == State.ACTIVE || node.state == State.SUBMITTING
   || node.state == State.REJECTED || node.state == State.WITHDRAWN, "A reviewing or completed task cannot be voided");
  node.state = State.VOIDED;
  record(node, "VOID", actor, "");
 }

 public void review(Node node, String actor, boolean approve, String comment) {
  requireAvailable(node);
  require(node.state == State.REVIEWING, "Task is not under review");
  require(node.reviewers.get(node.reviewStep).equals(actor), "Not the current reviewer");
  require(approve || (comment != null && !comment.isBlank()), "Rejection requires a reason");
  if (!approve) {
   node.state = State.REJECTED;
   node.approvalId = null;
  } else if (++node.reviewStep == node.reviewers.size()) {
   node.state = State.COMPLETED;
   node.approvalId = null;
  } else {
   node.approvalId = approvalId(node);
  }
  record(node, approve ? "APPROVE" : "REJECT", actor, comment);
  if (node.state == State.COMPLETED && node != root) advanceParent(root, node);
 }

 /**
  * Apply a platform workflow callback. The callback is authoritative for the actor, so the
  * local reviewer list is not consulted; instance, approval id and revision must all match.
  * Stale or out-of-order callbacks are ignored by the caller, never applied here.
  */
 public void platformReview(Node node, String actor, boolean approve, String comment,
                            String instanceId, String approvalId, String revision) {
  requireAvailable(node);
  require(node.state == State.REVIEWING, "Task is not under review");
  require(node.workflowInstanceId != null && node.workflowInstanceId.equals(instanceId), "Workflow instance mismatch");
  require(node.approvalId != null && node.approvalId.equals(approvalId), "Approval id mismatch or stale callback");
  require(node.workflowRevision != null && node.workflowRevision.equals(revision), "Workflow revision mismatch");
  require(actor != null && !actor.isBlank(), "Callback actor is required");
  require(approve || (comment != null && !comment.isBlank()), "Rejection requires a reason");
  if (!approve) { node.state = State.REJECTED; node.approvalId = null; }
  else { node.state = State.COMPLETED; node.approvalId = null; }
  record(node, approve ? "PLATFORM_APPROVE" : "PLATFORM_REJECT", actor, comment);
  if (node.state == State.COMPLETED && node != root) advanceParent(root, node);
 }

 /** True when a platform callback can advance this node under review. */
 public boolean matchesCallback(Node node, String instanceId, String approvalId, String revision) {
  return node != null && !isPaused(node) && node.state == State.REVIEWING
   && node.workflowInstanceId != null && node.workflowInstanceId.equals(instanceId)
   && node.approvalId != null && node.approvalId.equals(approvalId)
   && node.workflowRevision != null && node.workflowRevision.equals(revision);
 }

 private String approvalId(Node node) { return id + "/" + node.id + "/" + node.reviewStep; }

 private void advanceParent(Node current, Node completed) {
  if (current.children.contains(completed)) {
   if (current.children.stream().allMatch(n -> n.state == State.COMPLETED)) {
    current.state = State.REVIEWING;
    current.reviewStep = 0;
    if (current.workflowRevision == null) current.workflowRevision = workflowVersion;
    if (current.workflowInstanceId != null || current.workflowRevision != null) current.approvalId = approvalId(current);
    record(current, "AUTO_SUBMIT", "system", "");
   }
   return;
  }
  for (Node child : current.children) advanceParent(child, completed);
 }

 public void record(Node node, String action, String actor, String comment) {
  history.add(new History(node.id, action, actor, comment, Instant.now()));
 }
 public static void require(boolean condition, String message) {
  if (!condition) throw new BusinessException(message);
 }

 /** Kernel state → front-end canonical code (identity, lower case). No lossy conversion. */
 public static String frontendCode(State state) { return state.name().toLowerCase(Locale.ROOT); }
 public static boolean isEditable(State state) {
  return state == State.PENDING || state == State.SUBMITTING || state == State.ACTIVE
   || state == State.REJECTED || state == State.WITHDRAWN;
 }

 /**
  * Mirror of the front-end aggregateTaskStatus: uniform children collapse to a single status;
  * mixed corrective states resolve to ACTIVE. Voided/rejected children do not reject the parent.
  */
 public static FrontendStatus aggregateStatus(List<FrontendStatus> statuses) {
  if (statuses == null || statuses.isEmpty()) return FrontendStatus.PENDING;
  for (FrontendStatus candidate : List.of(FrontendStatus.COMPLETED, FrontendStatus.REVIEWING,
    FrontendStatus.PENDING, FrontendStatus.SUBMITTING, FrontendStatus.WITHDRAWN, FrontendStatus.VOIDED)) {
   if (statuses.stream().allMatch(value -> value == candidate)) return candidate;
  }
  return FrontendStatus.ACTIVE;
 }
}
