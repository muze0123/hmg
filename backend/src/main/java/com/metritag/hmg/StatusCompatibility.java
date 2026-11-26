package com.metritag.hmg;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.ArrayList;
import java.util.List;
import org.springframework.stereotype.Service;

/**
 * Read-only compatibility layer between the kernel lifecycle (upper-case, execution-focused)
 * and the front-end canonical statuses (lower-case, display-focused). It exposes an explicit
 * mapping and the front-end aggregate rule; it does not fake business actions or states.
 */
@Service
public class StatusCompatibility {
 public record NodeStatus(String nodeId, TaskTree.Level level, String kernelState,
                          String status, boolean editable) {}
 public record TaskStatusView(String id, String status, List<NodeStatus> nodes) {}
 private final TaskRepository tasks;
 private final ObjectMapper json;
 public StatusCompatibility(TaskRepository tasks, ObjectMapper json) { this.tasks = tasks; this.json = json; }

 public TaskStatusView get(String id, Actor actor) {
  var row = tasks.findByIdAndTenantId(id, actor.tenant())
   .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.NOT_FOUND));
  TaskTree tree;
  try { tree = json.readValue(row.payload, TaskTree.class); }
  catch (JsonProcessingException e) { throw new IllegalStateException(e); }
  List<NodeStatus> nodes = new ArrayList<>();
  collect(tree.root, nodes);
  List<TaskTree.FrontendStatus> roots = nodes.stream().filter(n -> n.level() == TaskTree.Level.MAIN)
   .map(n -> TaskTree.FrontendStatus.valueOf(n.status().toUpperCase(java.util.Locale.ROOT))).toList();
  String aggregate = TaskTree.aggregateStatus(roots).name().toLowerCase(java.util.Locale.ROOT);
  return new TaskStatusView(id, aggregate, nodes);
 }
 private void collect(TaskTree.Node node, List<NodeStatus> out) {
  out.add(new NodeStatus(node.id, node.level, node.state.name(),
   TaskTree.frontendCode(node.state), TaskTree.isEditable(node.state)));
  for (TaskTree.Node child : node.children) collect(child, out);
 }
}
