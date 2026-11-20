package com.metritag.hmg;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/** One tenant-scoped aggregate. All changes require an aggregate version. */
public class TaskTree {
 public String id;
 public String name;
 public String vehicleId;
 public String workflowVersion;
 public Node root;
 public List<History> history = new ArrayList<>();
 public enum Level { MAIN, SECTION, SUBTASK }
 public enum State { PENDING, ACTIVE, REVIEWING, REJECTED, COMPLETED }
 public enum Kind { VEHICLE, TECHNICAL, TESTING, REPORT, CERTIFICATE }
 public record History(String nodeId, String action, String actor, String comment, Instant time) {}
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
 }
 public Node node(String id) { return find(root, id); }
 private Node find(Node current, String id) {
  if (current.id.equals(id)) return current;
  for (Node child : current.children) {
   Node result = find(child, id);
   if (result != null) return result;
  }
  return null;
 }
 public void submit(Node node, String actor) {
  require(node.executor.equals(actor), "Only the assigned executor may submit");
  require(node.state == State.ACTIVE || node.state == State.REJECTED, "Task cannot be submitted");
  if (node.level != Level.SUBTASK) {
   require(!node.children.isEmpty(), "Task configuration is required");
   require(node.children.stream().allMatch(n -> n.state == State.COMPLETED), "Child approvals are incomplete");
  }
  node.reviewStep = 0;
  node.state = State.REVIEWING;
  record(node, "SUBMIT", actor, "");
 }
 public void review(Node node, String actor, boolean approve, String comment) {
  require(node.state == State.REVIEWING, "Task is not under review");
  require(node.reviewers.get(node.reviewStep).equals(actor), "Not the current reviewer");
  require(approve || (comment != null && !comment.isBlank()), "Rejection requires a reason");
  if (!approve) { node.state = State.REJECTED; }
  else if (++node.reviewStep == node.reviewers.size()) { node.state = State.COMPLETED; }
  record(node, approve ? "APPROVE" : "REJECT", actor, comment);
  if (node.state == State.COMPLETED && node != root) advanceParent(root, node);
 }
 private void advanceParent(Node current, Node completed) {
  if (current.children.contains(completed)) {
   if (current.children.stream().allMatch(n -> n.state == State.COMPLETED)) {
    current.state = State.REVIEWING;
    current.reviewStep = 0;
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
}
